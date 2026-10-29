import process from 'node:process'
import readline from 'node:readline'

import { bold, cyan, dim, hex, red, yellow } from 'ansis'

export type LogType = 'error' | 'warn' | 'info' | 'debug'
export type LogLevel = 'silent' | LogType | 'verbose'

export const LogLevels: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  verbose: 5,
}

export interface LogOptions {
  clear?: boolean;
  timestamp?: boolean;
  scope?: string;
}

export interface LogErrorOptions extends LogOptions {
  error?: Error | null;
}

export interface Logger {
  withScope: (scope: string) => Logger;
  debug: (msg: string, options?: LogOptions) => void;
  info: (msg: string, options?: LogOptions) => void;
  warn: (msg: string, options?: LogOptions) => void;
  warnOnce: (msg: string, options?: LogOptions) => void;
  error: (msg: string, options?: LogErrorOptions) => void;
  clearScreen: (type: LogType) => void;
  hasErrorLogged: (error: Error) => boolean;
  hasWarned: boolean;
}

export interface LoggerOptions {
  prefix?: string;
  scope?: string;
  allowClearScreen?: boolean;
  customLogger?: Logger;
  console?: Console;
}

let lastType: LogType | undefined
let lastMsg: string | undefined
let sameCount = 0
let timeFormatter: Intl.DateTimeFormat | undefined

function clearTerminalScreen() {
  const repeatCount = process.stdout.rows - 2
  const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : ''
  process.stdout.write(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

function getTimeFormatter() {
  timeFormatter ??= new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
  return timeFormatter
}

export function createLogger(
  level: LogLevel = 'info',
  options: LoggerOptions = {},
): Logger {
  if (options.customLogger) {
    return options.customLogger
  }

  const loggedErrors = new WeakSet<Error>()
  const warnedMessages = new Set<string>()
  const {
    prefix = '[OIYO]',
    scope,
    allowClearScreen = true,
    console = globalThis.console,
  } = options

  const threshold = LogLevels[level]
  const canClearScreen = allowClearScreen && process.stdout.isTTY && !process.env.CI
  const clear = canClearScreen ? clearTerminalScreen : () => {}

  function format(type: LogType, msg: string, logOptions: LogErrorOptions = {}) {
    const resolvedScope = logOptions.scope ?? scope

    const prefixText = hex('#FC9117')(bold(prefix))
    const scopeText = formatScope(type, resolvedScope)
    const msgText = formatMsg(type, msg)

    if (!logOptions.timestamp) {
      return `${prefixText} ${scopeText} ${msgText}`
    }

    return `${dim(getTimeFormatter().format(new Date()))} ${prefixText} ${scopeText} ${msg}`
  }

  function formatScope(type: LogType, scope?: string) {
    if (!scope) {
      return ' '
    }

    const label = `[${scope.toUpperCase()}]`

    const coloredLabel = {
      info: cyan(label),
      warn: yellow(label),
      error: red(label),
      debug: dim(cyan(label)),
    }[type]

    return coloredLabel
  }

  function formatMsg(type: LogType, msg: string) {
    const coloredMsg = {
      info: cyan(msg),
      warn: yellow(msg),
      error: red(msg),
      debug: dim(cyan(msg)),
    }[type]

    return coloredMsg
  }

  function output(type: LogType, msg: string, logOptions: LogErrorOptions = {}) {
    if (threshold < LogLevels[type]) {
      return
    }

    const method = type

    if (logOptions.error) {
      loggedErrors.add(logOptions.error)
    }

    if (canClearScreen) {
      if (type === lastType && msg === lastMsg) {
        sameCount++
        clear()
        console[type](format(type, msg, logOptions), yellow(`(x${sameCount + 1})`))
        return
      }

      sameCount = 0
      lastType = type
      lastMsg = msg

      if (logOptions.clear) {
        clear()
      }
    }

    console[method](format(type, msg, logOptions))
  }

  const logger: Logger = {
    hasWarned: false,
    withScope(targetScope) {
      return createLogger(level, {
        ...options,
        scope: targetScope,
      })
    },
    debug(msg, logOptions) {
      output('debug', msg, logOptions)
    },
    info(msg, logOptions) {
      output('info', msg, logOptions)
    },
    warn(msg, logOptions) {
      logger.hasWarned = true
      output('warn', msg, logOptions)
    },
    warnOnce(msg, logOptions) {
      if (warnedMessages.has(msg)) {
        return
      }

      warnedMessages.add(msg)
      logger.hasWarned = true
      output('warn', msg, logOptions)
    },
    error(msg, logOptions) {
      logger.hasWarned = true
      output('error', msg, logOptions)
    },
    clearScreen(type) {
      if (threshold >= LogLevels[type]) {
        clear()
      }
    },
    hasErrorLogged(error) {
      return loggedErrors.has(error)
    },
  }

  return logger
}
