// Everything that touches the raw Steamworks API lives here. Steam pins its
// IPC pipe to whatever OS thread called SteamAPI_Init — not just "a
// consistent thread", the actual process main thread. Calling Steam API
// functions from anywhere else trips a fatal assert inside the Steam client
// ("stalled cross-thread pipe") and kills the whole process. Init happens
// synchronously on fn main's thread before Tauri's event loop starts, and
// every periodic pump after that is dispatched onto the main thread via
// AppHandle::run_on_main_thread — a lightweight background thread only
// decides *when* to tick, never touches the API itself.
//
// We pump with the legacy SteamAPI_RunCallbacks() rather than
// SteamAPI_ManualDispatch_RunFrame/GetNextCallback: the manual-dispatch pair
// reproduced the same fatal cross-thread assert even when both init and the
// pump were verified on the same OS thread, so something about that specific
// pair doesn't get along with this SDK build. RunCallbacks doesn't need a
// pipe handle and is the far more common/tested path for a flat-API-only
// integration like ours that has no registered C++ callback handlers.
use crate::shared::{OutCommand, SharedState, SignalMessage, SteamFriend, SteamProfile};
use std::ffi::{c_int, CStr};
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Duration;
use steamworks_sys as sys;
use tauri::AppHandle;

const DEV_APP_ID: u32 = 480;
// 30ms was too aggressive: a Windows P2P call attempt hit
// "SteamnetworkingSockets service thread waited 127ms for lock" warnings
// followed by a hard ACCESS_VIOLATION inside the Steam client's own P2P/ICE
// code — main-thread Steam API calls this frequent were contending with
// Steam's own internal networking service thread for its locks. Backing off
// to 100ms cuts that contention substantially; still imperceptible for call
// setup or chat (a 100ms signaling delay isn't noticeable).
const TICK_INTERVAL: Duration = Duration::from_millis(100);
const FRIENDS_REFRESH_EVERY_N_TICKS: u32 = 30; // ~3s at 100ms/tick

#[derive(Clone, Copy)]
struct Interfaces {
    friends: *mut sys::ISteamFriends,
    messages: *mut sys::ISteamNetworkingMessages,
    utils: *mut sys::ISteamNetworkingUtils,
}
// Raw pointers aren't Send by default; they're only ever dereferenced from
// the main thread (enforced by always routing through run_on_main_thread),
// so this is sound despite crossing into the ticker closure.
unsafe impl Send for Interfaces {}

unsafe fn c_str_to_string(ptr: *const std::os::raw::c_char) -> String {
    if ptr.is_null() {
        return String::new();
    }
    CStr::from_ptr(ptr).to_string_lossy().into_owned()
}

unsafe fn identity_for(steam_id: u64) -> sys::SteamNetworkingIdentity {
    let mut identity: sys::SteamNetworkingIdentity = std::mem::zeroed();
    sys::SteamAPI_SteamNetworkingIdentity_SetSteamID(&mut identity, steam_id);
    identity
}

unsafe fn fetch_friends(friends_if: *mut sys::ISteamFriends) -> Vec<SteamFriend> {
    let flags = sys::EFriendFlags::k_EFriendFlagImmediate as c_int;
    let count = sys::SteamAPI_ISteamFriends_GetFriendCount(friends_if, flags);
    (0..count)
        .map(|i| {
            let steam_id = sys::SteamAPI_ISteamFriends_GetFriendByIndex(friends_if, i, flags);
            let name = c_str_to_string(sys::SteamAPI_ISteamFriends_GetFriendPersonaName(friends_if, steam_id));
            let persona_state = sys::SteamAPI_ISteamFriends_GetFriendPersonaState(friends_if, steam_id);
            let online = persona_state != sys::EPersonaState::k_EPersonaStateOffline;

            let mut game_info: sys::FriendGameInfo_t = std::mem::zeroed();
            let in_game = sys::SteamAPI_ISteamFriends_GetFriendGamePlayed(friends_if, steam_id, &mut game_info);

            SteamFriend {
                steam_id: steam_id.to_string(),
                name,
                online,
                in_game,
                game_name: None,
            }
        })
        .collect()
}

/// Must be called from the process's actual main thread, before the Tauri
/// event loop starts (i.e. before `.run()`).
pub fn init(shared: &Arc<SharedState>) {
    unsafe {
        std::env::set_var("SteamAppId", DEV_APP_ID.to_string());
        std::env::set_var("SteamGameId", DEV_APP_ID.to_string());

        let mut err_msg: sys::SteamErrMsg = [0; 1024];
        let result = sys::SteamAPI_InitFlat(&mut err_msg);
        if result != sys::ESteamAPIInitResult::k_ESteamAPIInitResult_OK {
            let msg = c_str_to_string(err_msg.as_ptr());
            *shared.init_error.lock().unwrap() = Some(format!(
                "Steam client init failed ({result:?}): {msg}. Is Steam running and logged in?"
            ));
            return;
        }

        let friends_if = sys::SteamAPI_SteamFriends_v018();
        let user_if = sys::SteamAPI_SteamUser_v023();
        let messages_if = sys::SteamAPI_SteamNetworkingMessages_SteamAPI_v002();
        let utils_if = sys::SteamAPI_SteamNetworkingUtils_SteamAPI_v004();
        if friends_if.is_null() || user_if.is_null() || messages_if.is_null() || utils_if.is_null() {
            *shared.init_error.lock().unwrap() = Some("Steam interfaces unavailable after init".to_string());
            return;
        }

        // Kick off the connection to Valve's relay network (SDR) up front
        // rather than waiting for it to happen lazily on the first call
        // attempt — that lazy path is what we saw producing a string of
        // "candidate type not allowed" warnings while a call couldn't
        // connect. Whether SDR is actually reachable for the shared
        // Spacewar (480) AppID we're testing under is a separate open
        // question we can't fully rule out; see the relay status logging
        // in pump_once for a live read on that.
        sys::SteamAPI_ISteamNetworkingUtils_InitRelayNetworkAccess(utils_if);

        let steam_id = sys::SteamAPI_ISteamUser_GetSteamID(user_if);
        let name = c_str_to_string(sys::SteamAPI_ISteamFriends_GetPersonaName(friends_if));
        *shared.profile.lock().unwrap() = Some(SteamProfile { steam_id: steam_id.to_string(), name });
        *shared.friends.lock().unwrap() = fetch_friends(friends_if);
        shared.connected.store(true, Ordering::SeqCst);
    }
}

/// Called once from lib.rs after the Tauri app is built, with a real
/// AppHandle in hand. Spawns the background thread that schedules ticks.
pub fn spawn_tick_loop(app_handle: AppHandle, shared: Arc<SharedState>) {
    if !shared.connected.load(Ordering::SeqCst) {
        return;
    }
    let interfaces = unsafe {
        Interfaces {
            friends: sys::SteamAPI_SteamFriends_v018(),
            messages: sys::SteamAPI_SteamNetworkingMessages_SteamAPI_v002(),
            utils: sys::SteamAPI_SteamNetworkingUtils_SteamAPI_v004(),
        }
    };

    std::thread::spawn(move || {
        let mut tick_count: u32 = 0;
        let mut relay_status_logged = false;
        loop {
            std::thread::sleep(TICK_INTERVAL);
            let shared = shared.clone();
            tick_count = tick_count.wrapping_add(1);
            let refresh_friends = tick_count % FRIENDS_REFRESH_EVERY_N_TICKS == 0;
            // Give relay init a few seconds before checking — logged once,
            // not every tick, since this is diagnostic noise once known.
            let log_relay_status = !relay_status_logged && tick_count >= 30;
            if log_relay_status {
                relay_status_logged = true;
            }
            let sent = app_handle.run_on_main_thread(move || unsafe {
                pump_once(interfaces, &shared, refresh_friends, log_relay_status);
            });
            if sent.is_err() {
                break;
            }
        }
    });
}

unsafe fn accept_session_once(interfaces: Interfaces, shared: &SharedState, steam_id: u64) {
    let mut accepted = shared.accepted_sessions.lock().unwrap();
    if accepted.insert(steam_id) {
        let identity = identity_for(steam_id);
        sys::SteamAPI_ISteamNetworkingMessages_AcceptSessionWithUser(interfaces.messages, &identity);
    }
}

unsafe fn pump_once(interfaces: Interfaces, shared: &SharedState, refresh_friends: bool, log_relay_status: bool) {
    sys::SteamAPI_RunCallbacks();

    if refresh_friends {
        *shared.friends.lock().unwrap() = fetch_friends(interfaces.friends);
    }

    if log_relay_status {
        let mut status: sys::SteamRelayNetworkStatus_t = std::mem::zeroed();
        sys::SteamAPI_ISteamNetworkingUtils_GetRelayNetworkStatus(interfaces.utils, &mut status);
        let debug_msg = c_str_to_string(status.m_debugMsg.as_ptr());
        eprintln!(
            "[steam] relay network status: avail={:?} any_relay={:?} network_config={:?} — {debug_msg}",
            status.m_eAvail, status.m_eAvailAnyRelay, status.m_eAvailNetworkConfig
        );
    }

    let pending: Vec<OutCommand> = shared.outbox.lock().unwrap().drain(..).collect();
    for cmd in pending {
        match cmd {
            OutCommand::OpenSession { steam_id } => {
                accept_session_once(interfaces, shared, steam_id);
            }
            OutCommand::SendMessage { steam_id, payload } => {
                accept_session_once(interfaces, shared, steam_id);
                let identity = identity_for(steam_id);
                let bytes = payload.into_bytes();
                sys::SteamAPI_ISteamNetworkingMessages_SendMessageToUser(
                    interfaces.messages,
                    &identity,
                    bytes.as_ptr() as *const std::ffi::c_void,
                    bytes.len() as u32,
                    sys::k_nSteamNetworkingSend_Reliable,
                    0,
                );
            }
        }
    }

    const MAX_MESSAGES: usize = 32;
    let mut buf: [*mut sys::SteamNetworkingMessage_t; MAX_MESSAGES] = [std::ptr::null_mut(); MAX_MESSAGES];
    let count = sys::SteamAPI_ISteamNetworkingMessages_ReceiveMessagesOnChannel(
        interfaces.messages,
        0,
        buf.as_mut_ptr(),
        MAX_MESSAGES as i32,
    );
    if count > 0 {
        let mut inbox = shared.inbox.lock().unwrap();
        for msg_ptr in buf.iter().take(count as usize) {
            let msg = &**msg_ptr;
            let data = std::slice::from_raw_parts(msg.m_pData as *const u8, msg.m_cbSize as usize);
            let payload = String::from_utf8_lossy(data).trim_end_matches('\0').to_string();
            let mut peer = msg.m_identityPeer;
            let from_steam_id = sys::SteamAPI_SteamNetworkingIdentity_GetSteamID(&mut peer).to_string();
            inbox.push_back(SignalMessage { from_steam_id, payload });
            if let Some(release) = msg.m_pfnRelease {
                release(*msg_ptr);
            }
        }
    }
}
