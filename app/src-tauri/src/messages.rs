// Signaling transport for WebRTC call setup, riding on Steam's own P2P
// networking (ISteamNetworkingMessages) so we don't need to run or pay for
// a signaling server. The actual voice/video media never touches this path —
// only small JSON blobs (call-request, SDP offer/answer, ICE candidates).
use serde::Serialize;
use std::ffi::CString;
use steamworks_sys as sys;

pub struct MessagingState {
    interface: *mut sys::ISteamNetworkingMessages,
}

unsafe impl Send for MessagingState {}
unsafe impl Sync for MessagingState {}

pub type MessagingStateSlot = Option<MessagingState>;

#[derive(Serialize)]
pub struct SignalMessage {
    pub from_steam_id: String,
    pub payload: String,
}

pub fn init() -> Result<MessagingState, String> {
    unsafe {
        let interface = sys::SteamAPI_SteamNetworkingMessages_SteamAPI_v002();
        if interface.is_null() {
            return Err("ISteamNetworkingMessages unavailable".to_string());
        }
        Ok(MessagingState { interface })
    }
}

unsafe fn identity_for(steam_id: u64) -> sys::SteamNetworkingIdentity {
    let mut identity: sys::SteamNetworkingIdentity = std::mem::zeroed();
    sys::SteamAPI_SteamNetworkingIdentity_SetSteamID(&mut identity, steam_id);
    identity
}

fn parse_steam_id(s: &str) -> Result<u64, String> {
    s.parse::<u64>().map_err(|_| format!("invalid steam id: {s}"))
}

/// "Opens the door" for a friend to message us. Steam drops the first packet
/// of an unsolicited session unless the recipient has already accepted it (or
/// does so in response to a SessionRequest callback, which we don't handle
/// here) — so callers accept sessions with everyone they might call *or* be
/// called by, up front, right after the friends list loads.
#[tauri::command]
pub fn open_signaling_sessions(
    state: tauri::State<MessagingStateSlot>,
    steam_ids: Vec<String>,
) -> Result<(), String> {
    let state = state.as_ref().ok_or("Steam is not connected")?;
    for id in steam_ids {
        let steam_id = parse_steam_id(&id)?;
        unsafe {
            let identity = identity_for(steam_id);
            sys::SteamAPI_ISteamNetworkingMessages_AcceptSessionWithUser(state.interface, &identity);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn send_signal(
    state: tauri::State<MessagingStateSlot>,
    to_steam_id: String,
    payload: String,
) -> Result<(), String> {
    let state = state.as_ref().ok_or("Steam is not connected")?;
    let steam_id = parse_steam_id(&to_steam_id)?;
    let bytes = CString::new(payload).map_err(|e| e.to_string())?;
    let bytes = bytes.as_bytes_with_nul();

    unsafe {
        let identity = identity_for(steam_id);
        // Harmless if already accepted; covers the case where we're the first
        // to talk to this peer this session.
        sys::SteamAPI_ISteamNetworkingMessages_AcceptSessionWithUser(state.interface, &identity);

        let result = sys::SteamAPI_ISteamNetworkingMessages_SendMessageToUser(
            state.interface,
            &identity,
            bytes.as_ptr() as *const std::ffi::c_void,
            bytes.len() as u32,
            sys::k_nSteamNetworkingSend_Reliable,
            0,
        );
        if result != sys::EResult::k_EResultOK {
            return Err(format!("SendMessageToUser failed: {result:?}"));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn poll_signals(state: tauri::State<MessagingStateSlot>) -> Result<Vec<SignalMessage>, String> {
    let state = state.as_ref().ok_or("Steam is not connected")?;
    const MAX_MESSAGES: usize = 32;
    let mut out = Vec::new();

    unsafe {
        let mut buf: [*mut sys::SteamNetworkingMessage_t; MAX_MESSAGES] = [std::ptr::null_mut(); MAX_MESSAGES];
        let count = sys::SteamAPI_ISteamNetworkingMessages_ReceiveMessagesOnChannel(
            state.interface,
            0,
            buf.as_mut_ptr(),
            MAX_MESSAGES as i32,
        );

        for msg_ptr in buf.iter().take(count.max(0) as usize) {
            let msg = &**msg_ptr;
            let data = std::slice::from_raw_parts(msg.m_pData as *const u8, msg.m_cbSize as usize);
            let payload = String::from_utf8_lossy(data).trim_end_matches('\0').to_string();

            let mut peer = msg.m_identityPeer;
            let from_steam_id = sys::SteamAPI_SteamNetworkingIdentity_GetSteamID(&mut peer).to_string();

            out.push(SignalMessage { from_steam_id, payload });

            if let Some(release) = msg.m_pfnRelease {
                release(*msg_ptr);
            }
        }
    }

    Ok(out)
}
