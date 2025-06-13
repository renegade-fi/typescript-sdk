/// Errors generated when converting between relayer and smart contract types
#[derive(Clone, Debug)]
pub enum ConversionError {
    /// Error thrown when a variable-length input
    /// can't be coerced into a fixed-length array
    InvalidLength,
    /// Error thrown when converting between uint types
    InvalidUint,
}

impl std::fmt::Display for ConversionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[macro_export]
macro_rules! map_js_error {
    ($fmt:expr $(, $($arg:tt)*)?) => {
        |e| wasm_bindgen::JsError::new(&format!($fmt $(, $($arg)*)?, e))
    }
}
