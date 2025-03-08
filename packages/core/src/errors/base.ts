import { getVersion } from '../utils/getVersion.js'

export type ErrorType<name extends string = 'Error'> = Error & { name: name }

type BaseErrorParameters = {
  cause?: BaseError | Error | undefined
  details?: string | undefined
  metaMessages?: string[] | undefined
  name?: string | undefined
}

export type BaseErrorType = BaseError & { name: 'RenegadeCoreError' }
export class BaseError extends Error {
  details: string
  metaMessages?: string[] | undefined
  shortMessage: string

  override name = 'RenegadeCoreError'
  get version() {
    return getVersion()
  }

  constructor(shortMessage: string, args: BaseErrorParameters = {}) {
    super()

    const details =
      args.cause instanceof BaseError
        ? args.cause.details
        : args.cause?.message
          ? args.cause.message
          : args.details!

    this.message = [
      shortMessage || 'An error occurred.',
      '',
      ...(args.metaMessages ? [...args.metaMessages, ''] : []),
      ...(details ? [`Details: ${details}`] : []),
      `Version: ${this.version}`,
    ].join('\n')

    if (args.cause) this.cause = args.cause
    this.details = details
    this.metaMessages = args.metaMessages
    this.shortMessage = shortMessage
  }

  walk(fn?: (err: unknown) => boolean) {
    return this.#walk(this, fn)
  }

  #walk(err: unknown, fn?: (err: unknown) => boolean): unknown {
    if (fn?.(err)) return err
    if ((err as Error).cause) return this.#walk((err as Error).cause, fn)
    return err
  }
}
