import { request as httpsRequest, Agent as HttpsAgent } from 'https'
import { request as httpRequest } from 'http'
import { readFileSync } from 'fs'
import { initConsolLogger } from './consoleLogger'
import {
  ILogRequest,
  ITaglogConfig,
  ITaglogInit,
  ITagLogRequest,
  SessionType,
  TagLogInstance
} from './models'

const logMessageType = 'LOG_TYPE_API'

const taglogConfig: ITaglogConfig = {}

const TAGLOG_SERVER_URL = 'https://api.taglog.io/api'

let shouldCaptureConsole: boolean = false

const session: SessionType = {
  __HEADERS__: {},
  __TAGS__: []
}

export function taglogInit({
  accessKey,
  defaultChannel,
  serverURL = TAGLOG_SERVER_URL,
  options = {
    captureConsole: false,
    autoDetectHeaders: true,
    tags: [],
    key: undefined,
    cert: undefined
  }
}: ITaglogInit): TagLogInstance {
  taglogConfig[accessKey] = {
    ACCESS_KEY: accessKey,
    DEFAULT_CHANNEL: defaultChannel,
    SERVER_URL: serverURL
  }

  if (options.captureConsole) shouldCaptureConsole = options.captureConsole

  session.__HEADERS__ = options.session ? options.session.__HEADERS__ : {}
  session.__TAGS__ = options.tags || []

  if (options.autoDetectHeaders) {
    const envHeaders = autoDetectEnv()
    session.__HEADERS__ = {
      ...session.__HEADERS__,
      ...envHeaders
    }
  }

  const logInstance: TagLogInstance = {
    captureException,
    captureInfo,
    captureRequest
  }

  if (options.captureConsole) {
    initConsolLogger(logInstance)
  }

  if (options.key && options.cert) {
    const httpsAgent = new HttpsAgent({
      key: readFileSync(options.key),
      cert: readFileSync(options.cert),
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3'
    })
    taglogConfig[accessKey].httpsAgent = httpsAgent
  }

  return logInstance
}

export const setEnvSession = (_session: SessionType) => {
  session.__HEADERS__ = {
    ...session.__HEADERS__,
    ..._session.__HEADERS__
  }
}

export function autoDetectEnv(): Record<string, string> {
  const envHeaders: Record<string, string> = {}

  if (process.env.NODE_ENV) {
    envHeaders['NODE_ENV'] = process.env.NODE_ENV
  }

  if (process.env.SERVER_HOST) {
    envHeaders['SERVER_HOST'] = process.env.SERVER_HOST
  }

  return envHeaders
}

function getFirstConfig() {
  for (const accessKey in taglogConfig) {
    return accessKey
  }
  return false
}

export function captureException(
  title: string | Error,
  data?: Record<string, any> | Error,
  channel?: string,
  tags?: string[],
  accessKey?: string
): void {
  let errorData = {}
  let errorTitle = 'Error'

  if (title instanceof Error) {
    errorData = {
      message: title.message,
      stack: title.stack,
      name: title.name
    }
    errorTitle = title.message
  } else {
    errorTitle = title
    if (data instanceof Error) {
      errorData = {
        message: data.message,
        stack: data.stack,
        name: data.name
      }
    } else {
      errorData = data || {}
    }
  }

  const detectedAccessKey = accessKey ? accessKey : getFirstConfig()

  if (detectedAccessKey) {
    logRequestBeacon({
      title: errorTitle,
      data: errorData,
      type: 'EXCEPTION',
      channel,
      tags,
      accessKey: detectedAccessKey
    })
  } else {
    if (!shouldCaptureConsole)
      console.error('Logging event to taglog.io failed.')
  }
}

export function captureRequest(
  request: ITagLogRequest,
  channel?: string,
  tags?: string[],
  accessKey?: string
): void {
  const detectedAccessKey = accessKey ? accessKey : getFirstConfig()

  if (detectedAccessKey) {
    logRequestBeacon({
      title: request.url,
      data: {
        method: request.method,
        status: request.status,
        duration: request.duration,
        headers: request.headers,
        body: request.body,
        response: request.response
      },
      tags,
      type: 'REQUEST',
      channel,
      accessKey: detectedAccessKey
    })
  } else {
    if (!shouldCaptureConsole)
      console.error('Logging event to taglog.io failed.')
  }
}

export function captureInfo(
  title: string,
  data?: Record<string, any>,
  channel?: string,
  tags?: string[],
  accessKey?: string
): void {
  const detectedAccessKey = accessKey ? accessKey : getFirstConfig()

  if (detectedAccessKey) {
    logRequestBeacon({
      title,
      data,
      type: 'INFO',
      channel,
      tags,
      accessKey: detectedAccessKey
    })
  } else {
    if (!shouldCaptureConsole)
      console.error('Logging event to taglog.io failed.')
  }
}

function logRequestBeacon({
  title,
  data = {},
  type,
  accessKey,
  tags = [],
  channel
}: ILogRequest & { tags?: string[] }) {
  const postData = JSON.stringify({
    title,
    data,
    type,
    tags: [...tags, ...session.__TAGS__],
    meta: session.__HEADERS__
  })

  const isLocalhost =
    taglogConfig[accessKey].SERVER_URL.includes('localhost') ||
    taglogConfig[accessKey].httpsAgent
  const request = isLocalhost ? httpRequest : httpsRequest

  const serverUrl = new URL(taglogConfig[accessKey].SERVER_URL)
  const options = {
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',
    hostname: serverUrl.hostname,
    port: serverUrl.port || 80,
    path: `/api/ingest/${
      channel ? channel : taglogConfig[accessKey].DEFAULT_CHANNEL
    }`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      messageType: logMessageType,
      accessToken: accessKey,
      Accept: 'application/json'
    },
    ...(taglogConfig[accessKey].httpsAgent
      ? { agent: taglogConfig[accessKey].httpsAgent }
      : {})
  }

  const req = request(options)

  req.on('error', (e) => {
    if (!shouldCaptureConsole)
      console.error(`problem with request: ${e.message}`)
  })

  // Write data to request body and end the request
  req.write(postData)
  req.end()
}
