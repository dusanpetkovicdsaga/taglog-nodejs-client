// logger.js

import { TagLogInstance } from './models'

export function initConsolLogger({
  captureInfo,
  captureException
}: TagLogInstance) {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  }

  console.log = function (title, ...rest) {
    captureInfo(title, rest)
    originalConsole.log.apply(console, rest)
  }

  console.error = function (title, ...rest) {
    captureException(title, rest)
    originalConsole.error.apply(console, [title, ...rest])
  }

  console.warn = function (title, ...rest) {
    captureException(title, rest)
    originalConsole.warn.apply(console, [title, ...rest])
  }

  console.info = function (title, ...rest) {
    captureInfo(title, rest)
    originalConsole.info.apply(console, [title, ...rest])
  }
}
