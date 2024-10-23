mod auth_helpers;

/// Header name for the HTTP auth signature; lower cased
pub const RENEGADE_AUTH_HEADER_NAME: &str = "x-renegade-auth";
/// Header name for the expiration timestamp of a signature; lower cased
pub const RENEGADE_SIG_EXPIRATION_HEADER_NAME: &str = "x-renegade-auth-expiration";
