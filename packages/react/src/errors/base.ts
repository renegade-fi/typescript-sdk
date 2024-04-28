import { BaseError as CoreError } from "@renegade-fi/core"

import { getVersion } from "../utils/getVersion.js"

export type BaseErrorType = BaseError & { name: "RenegadeError" }
export class BaseError extends CoreError {
    override name = "RenegadeError"
    override get docsBaseUrl() {
        return "todo: put a docs link here"
    }
    override get version() {
        return getVersion()
    }
}
