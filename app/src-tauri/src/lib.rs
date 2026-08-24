mod commands;
mod shared;
mod steam_thread;

use shared::SharedState;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let shared = Arc::new(SharedState::default());

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(shared.clone())
        .invoke_handler(tauri::generate_handler![
            commands::get_steam_profile,
            commands::get_steam_friends,
            commands::open_signaling_sessions,
            commands::send_signal,
            commands::poll_signals,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // Must happen on this thread (the real process main thread) before the
    // event loop starts — see steam_thread.rs for why.
    steam_thread::init(&shared);
    let init_error = shared.init_error.lock().unwrap().clone();
    if let Some(err) = init_error {
        eprintln!("[steam] {err} — friends, calls, and chat will stay unavailable until Steam is running.");
    } else {
        steam_thread::spawn_tick_loop(app.handle().clone(), shared);
    }

    app.run(|_, event| {
        // A clean shutdown matters here more than usual: killing the process
        // without this (e.g. during dev iteration) can leave the Steam
        // client's IPC pipe bookkeeping in a bad state for the *next* run —
        // we chased a "fatal stalled cross-thread pipe" crash that turned out
        // to be exactly that, self-inflicted by repeated hard-kills in dev.
        if matches!(event, tauri::RunEvent::Exit) {
            unsafe { steamworks_sys::SteamAPI_Shutdown() };
        }
    });
}
