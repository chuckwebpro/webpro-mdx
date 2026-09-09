use std::path::Path;

fn rerun_if_changed(path: &Path) {
    if path.is_file() {
        println!("cargo:rerun-if-changed={}", path.display());
    }
}

fn watch_icons(dir: &Path) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            rerun_if_changed(&path);
        }
    }
}

fn main() {
    watch_icons(Path::new("icons"));
    rerun_if_changed(Path::new("icons/icon.ico"));
    rerun_if_changed(Path::new("icons/32x32.png"));
    tauri_build::build()
}
