use std::env;
use std::path::PathBuf;

fn main() {
    let crate_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    
    // Generate C++ bindings
    cbindgen::Builder::new()
        .with_crate(crate_dir)
        .with_language(cbindgen::Language::C)
        .with_header("/* Mixx Club Studio - C++ Bindings */")
        .with_include_guard("MIXX_CORE_H")
        .generate()
        .expect("Unable to generate bindings")
        .write_to_file("include/mixx_core_generated.h");
    
    // Note: Rust dependencies are linked automatically via Cargo.toml
    // This build script is only for generating C++ bindings
    
    // Tell cargo to invalidate the built crate whenever the wrapper changes
    println!("cargo:rerun-if-changed=src/ffi.rs");
    println!("cargo:rerun-if-changed=include/mixx_core.h");
}
