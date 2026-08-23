mod messages;
mod steam;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let steam_state: steam::SteamStateSlot = match steam::init() {
        Ok(state) => Some(state),
        Err(err) => {
            eprintln!("[steam] {err} — friends list will stay empty until Steam is running.");
            None
        }
    };

    let messaging_state: messages::MessagingStateSlot = match messages::init() {
        Ok(state) => Some(state),
        Err(err) => {
            eprintln!("[messages] {err} — call signaling will not work until Steam is running.");
            None
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(steam_state)
        .manage(messaging_state)
        .invoke_handler(tauri::generate_handler![
            steam::get_steam_profile,
            steam::get_steam_friends,
            messages::open_signaling_sessions,
            messages::send_signal,
            messages::poll_signals,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
