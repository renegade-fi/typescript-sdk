/// Errors generated when converting between relayer and smart contract types
#[derive(Clone, Debug)]
pub enum ConversionError {
    /// Error thrown when a variable-length input
    /// can't be coerced into a fixed-length array
    InvalidLength,
    /// Error thrown when converting between uint types
    InvalidUint,
}

#[macro_export]
macro_rules! js_error {
    ($($arg:tt)*) => {
        wasm_bindgen::JsError::new(&format!($($arg)*))
    };
}
