// Minimal, hand-rolled bindings on top of steamworks-sys's flat C API.
//
// We don't use the `steamworks` high-level crate: its Rust wrapper is written
// against an older Steamworks API surface and fails to compile against
// current SDKs (e.g. ISteamFriends jumped interface v017 -> v018, several
// functions gained new parameters). steamworks-sys itself is fine once its
// bindings are rebuilt from our actual SDK headers (see Cargo.toml).
use serde::Serialize;
use std::ffi::{c_int, CStr};
use steamworks_sys as sys;

/// Spacewar test AppID (owned by every Steam account) — used until Kesto has
/// its own AppID from Steam Direct. See plans/kesto-development-plan.md.
const DEV_APP_ID: u32 = 480;

pub struct SteamState {
    friends: *mut sys::ISteamFriends,
    user: *mut sys::ISteamUser,
}

// Steam API calls are safe to make from any thread per Valve's docs as long
// as they aren't made concurrently; Tauri's command dispatcher serializes
// access to this state behind `tauri::State`, so a single shared handle is fine.
unsafe impl Send for SteamState {}
unsafe impl Sync for SteamState {}

#[derive(Serialize)]
pub struct SteamProfile {
    pub steam_id: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct SteamFriend {
    pub steam_id: String,
    pub name: String,
    pub online: bool,
    pub in_game: bool,
    pub game_name: Option<String>,
}

unsafe fn c_str_to_string(ptr: *const std::os::raw::c_char) -> String {
    if ptr.is_null() {
        return String::new();
    }
    CStr::from_ptr(ptr).to_string_lossy().into_owned()
}

pub fn init() -> Result<SteamState, String> {
    std::env::set_var("SteamAppId", DEV_APP_ID.to_string());
    std::env::set_var("SteamGameId", DEV_APP_ID.to_string());

    unsafe {
        let mut err_msg: sys::SteamErrMsg = [0; 1024];
        let result = sys::SteamAPI_InitFlat(&mut err_msg);
        if result != sys::ESteamAPIInitResult::k_ESteamAPIInitResult_OK {
            let msg = c_str_to_string(err_msg.as_ptr());
            return Err(format!(
                "Steam client init failed ({result:?}): {msg}. Is Steam running and logged in?"
            ));
        }

        let friends = sys::SteamAPI_SteamFriends_v018();
        let user = sys::SteamAPI_SteamUser_v023();
        if friends.is_null() || user.is_null() {
            return Err("Steam interfaces unavailable after init".to_string());
        }

        Ok(SteamState { friends, user })
    }
}

#[tauri::command]
pub fn get_steam_profile(state: tauri::State<SteamState>) -> SteamProfile {
    unsafe {
        let steam_id = sys::SteamAPI_ISteamUser_GetSteamID(state.user);
        let name = c_str_to_string(sys::SteamAPI_ISteamFriends_GetPersonaName(state.friends));
        SteamProfile {
            steam_id: steam_id.to_string(),
            name,
        }
    }
}

#[tauri::command]
pub fn get_steam_friends(state: tauri::State<SteamState>) -> Vec<SteamFriend> {
    unsafe {
        let flags = sys::EFriendFlags::k_EFriendFlagImmediate as c_int;
        let count = sys::SteamAPI_ISteamFriends_GetFriendCount(state.friends, flags);

        (0..count)
            .map(|i| {
                let steam_id = sys::SteamAPI_ISteamFriends_GetFriendByIndex(state.friends, i, flags);
                let name = c_str_to_string(sys::SteamAPI_ISteamFriends_GetFriendPersonaName(
                    state.friends,
                    steam_id,
                ));
                let persona_state =
                    sys::SteamAPI_ISteamFriends_GetFriendPersonaState(state.friends, steam_id);
                let online = persona_state != sys::EPersonaState::k_EPersonaStateOffline;

                let mut game_info: sys::FriendGameInfo_t = std::mem::zeroed();
                let in_game = sys::SteamAPI_ISteamFriends_GetFriendGamePlayed(
                    state.friends,
                    steam_id,
                    &mut game_info,
                );

                SteamFriend {
                    steam_id: steam_id.to_string(),
                    name,
                    online,
                    in_game,
                    // Steam doesn't expose the game's display name via this call,
                    // only its AppId — resolving that to a title needs the Store
                    // API and isn't wired up yet.
                    game_name: None,
                }
            })
            .collect()
    }
}
