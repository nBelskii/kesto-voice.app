// Plain Rust state shared between the dedicated Steam thread (steam_thread.rs,
// the only place allowed to touch the Steam API) and Tauri commands
// (commands.rs, which only ever read/write these Mutexes — never call Steam
// API functions directly). See steam_thread.rs for why this split exists.
use std::collections::VecDeque;
use std::sync::atomic::AtomicBool;
use std::sync::Mutex;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct SteamProfile {
    pub steam_id: String,
    pub name: String,
}

#[derive(Serialize, Clone)]
pub struct SteamFriend {
    pub steam_id: String,
    pub name: String,
    pub online: bool,
    pub in_game: bool,
    pub game_name: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct SignalMessage {
    pub from_steam_id: String,
    pub payload: String,
}

pub enum OutCommand {
    OpenSession { steam_id: u64 },
    SendMessage { steam_id: u64, payload: String },
}

#[derive(Default)]
pub struct SharedState {
    pub connected: AtomicBool,
    pub init_error: Mutex<Option<String>>,
    pub profile: Mutex<Option<SteamProfile>>,
    pub friends: Mutex<Vec<SteamFriend>>,
    pub inbox: Mutex<VecDeque<SignalMessage>>,
    pub outbox: Mutex<VecDeque<OutCommand>>,
}
