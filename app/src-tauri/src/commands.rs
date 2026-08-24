// Tauri commands here never touch the Steam API directly — only the plain,
// thread-safe SharedState. All actual Steam calls happen on the dedicated
// thread in steam_thread.rs; see its module doc for why.
use crate::shared::{OutCommand, SharedState, SignalMessage, SteamFriend, SteamProfile};
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::State;

fn require_connected(state: &SharedState) -> Result<(), String> {
    if state.connected.load(Ordering::SeqCst) {
        return Ok(());
    }
    if let Some(err) = state.init_error.lock().unwrap().clone() {
        return Err(err);
    }
    Err("Steam is still starting up".to_string())
}

fn parse_steam_id(s: &str) -> Result<u64, String> {
    s.parse::<u64>().map_err(|_| format!("invalid steam id: {s}"))
}

#[tauri::command]
pub fn get_steam_profile(state: State<Arc<SharedState>>) -> Result<SteamProfile, String> {
    require_connected(&state)?;
    state
        .profile
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "Steam profile not available yet".to_string())
}

#[tauri::command]
pub fn get_steam_friends(state: State<Arc<SharedState>>) -> Result<Vec<SteamFriend>, String> {
    require_connected(&state)?;
    Ok(state.friends.lock().unwrap().clone())
}

#[tauri::command]
pub fn open_signaling_sessions(state: State<Arc<SharedState>>, steam_ids: Vec<String>) -> Result<(), String> {
    require_connected(&state)?;
    let mut outbox = state.outbox.lock().unwrap();
    for id in steam_ids {
        outbox.push_back(OutCommand::OpenSession { steam_id: parse_steam_id(&id)? });
    }
    Ok(())
}

#[tauri::command]
pub fn send_signal(state: State<Arc<SharedState>>, to_steam_id: String, payload: String) -> Result<(), String> {
    require_connected(&state)?;
    let steam_id = parse_steam_id(&to_steam_id)?;
    state.outbox.lock().unwrap().push_back(OutCommand::SendMessage { steam_id, payload });
    Ok(())
}

#[tauri::command]
pub fn poll_signals(state: State<Arc<SharedState>>) -> Result<Vec<SignalMessage>, String> {
    require_connected(&state)?;
    Ok(state.inbox.lock().unwrap().drain(..).collect())
}
