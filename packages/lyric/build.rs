#[cfg(feature = "eqrc")]
fn build_qdec() {
    let arch = std::env::var("CARGO_CFG_TARGET_POINTER_WIDTH").unwrap();
    let define_arch = format!("RS_PTR_WIDTH_{}", arch.to_uppercase());

    println!("cargo:rerun-if-changed=./src/eqrc/qdec/des.h");
    println!("cargo:rerun-if-changed=./src/eqrc/qdec/des.c");

    cc::Build::new()
        .include("./src/eqrc/qdec")
        .file("./src/eqrc/qdec/des.c")
        .define(&define_arch, None)
        .compile("qdec");
}

fn main() {
    #[cfg(feature = "eqrc")]
    build_qdec();

    println!("cargo:rerun-if-changed=./src/types.d.ts");

    let types = std::fs::read_to_string("./src/types.d.ts").expect("Can't read types.d.ts");
    let out_path = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
    std::fs::write(
        out_path.join("types.rs"),
        format!(
            r######"use wasm_bindgen::prelude::*;
#[wasm_bindgen(typescript_custom_section)]
const TS_TYPES: &str = r###"{types}"###;
"######
        ),
    )
    .expect("Can't write types.rs");
}
