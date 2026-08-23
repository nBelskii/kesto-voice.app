mod steam;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_opener::init());

    match steam::init() {
        Ok(state) => {
            builder = builder.manage(state).invoke_handler(tauri::generate_handler![
                steam::get_steam_profile,
                steam::get_steam_friends
            ]);
        }
        Err(err) => {
            eprintln!("[steam] {err} — friends list will stay empty until Steam is running.");
        }
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
