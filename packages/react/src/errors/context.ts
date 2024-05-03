import { BaseError } from './base.js'

export type RenegadeProviderNotFoundErrorType =
  RenegadeProviderNotFoundError & {
    name: 'RenegadeProviderNotFoundError'
  }
export class RenegadeProviderNotFoundError extends BaseError {
  override name = 'RenegadeProviderNotFoundError'
  constructor() {
    super('`useConfig` must be used within `RenegadeProvider`.', {
      docsPath: '/api/RenegadeProvider',
    })
  }
}
