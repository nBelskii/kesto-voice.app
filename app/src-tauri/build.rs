use std::env;
use std::fs;
use std::path::{Path, PathBuf};

fn main() {
    tauri_build::build();
    copy_steam_redistributable();
}

/// Cargo statically resolves the steam_api symbol at link time but never
/// copies the actual shared library next to the produced binary — that's on
/// us. Without this, `target/{profile}/app(.exe)` fails to launch outside a
/// `cargo run`/`tauri dev` session (dev builds happen to work because the
/// linker embeds an absolute path into steamworks-sys's own OUT_DIR, which
/// only exists on the machine that built it). Release builds meant to be
/// handed to someone else (e.g. a friend testing over Steam) need the real
/// DLL/dylib/so sitting right next to the executable.
fn copy_steam_redistributable() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let target_triple = env::var("TARGET").unwrap();

    let (subdir, filename) = if target_triple.contains("windows") {
        ("win64", "steam_api64.dll")
    } else if target_triple.contains("darwin") {
        ("osx", "libsteam_api.dylib")
    } else if target_triple.contains("linux") {
        ("linux64", "libsteam_api.so")
    } else {
        return;
    };

    let src = manifest_dir
        .join("steamworks_sdk/redistributable_bin")
        .join(subdir)
        .join(filename);
    if !src.exists() {
        println!(
            "cargo:warning=Steam redistributable not found at {}; see app/src-tauri/steamworks_sdk setup in plans/kesto-friend-test-guide.md",
            src.display()
        );
        return;
    }

    // OUT_DIR looks like target/{profile}/build/{pkg}-{hash}/out — walk back
    // up to target/{profile}, where the final binary actually lands.
    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());
    let Some(target_profile_dir) = out_dir.ancestors().nth(3).map(Path::to_path_buf) else {
        return;
    };

    let dest = target_profile_dir.join(filename);
    if let Err(e) = fs::copy(&src, &dest) {
        println!("cargo:warning=Failed to copy {} -> {}: {e}", src.display(), dest.display());
    }

    println!("cargo:rerun-if-changed={}", src.display());
}
