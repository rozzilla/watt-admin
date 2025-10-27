import { type FromSchema } from 'json-schema-to-ts'

const dateSchema = { type: 'string', format: 'date-time' } as const

export const modeSchema = { type: 'string', enum: ['start', 'stop'] } as const
export type Mode = FromSchema<typeof modeSchema>

const memoryDataPointSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: dateSchema,
    rss: { type: 'number' },
    totalHeap: { type: 'number' },
    usedHeap: { type: 'number' },
    newSpace: { type: 'number' },
    oldSpace: { type: 'number' }
  },
  required: ['date', 'rss', 'totalHeap', 'usedHeap', 'newSpace', 'oldSpace']
} as const
export type MemoryDataPoint = FromSchema<typeof memoryDataPointSchema>

const cpuDataPointSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: dateSchema,
    cpu: { type: 'number' },
    eventLoop: { type: 'number' }
  },
  required: ['date', 'cpu', 'eventLoop']
} as const
export type CpuDataPoint = FromSchema<typeof cpuDataPointSchema>

const latencyDataPointSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: { type: 'string', format: 'date-time' },
    p90: { type: 'number' },
    p95: { type: 'number' },
    p99: { type: 'number' }
  },
  required: ['date', 'p90', 'p95', 'p99']
} as const
export type LatencyDataPoint = FromSchema<typeof latencyDataPointSchema>

const requestDataPointSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: { type: 'string', format: 'date-time' },
    count: { type: 'number' },
    rps: { type: 'number' }
  },
  required: ['date', 'count', 'rps']
} as const
export type RequestDataPoint = FromSchema<typeof requestDataPointSchema>

const kafkaDataPointSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: { type: 'string', format: 'date-time' },
    producers: { type: 'number' },
    producedMessages: { type: 'number' },
    consumers: { type: 'number' },
    consumersStreams: { type: 'number' },
    consumersTopics: { type: 'number' },
    consumedMessages: { type: 'number' },
    hooksMessagesInFlight: { type: 'number' },
    hooksDlqMessagesTotal: { type: 'number' },
  },
  required: [
    'date',
    'producers',
    'producedMessages',
    'consumers',
    'consumersStreams',
    'consumersTopics',
    'consumedMessages',
    'hooksMessagesInFlight',
    'hooksDlqMessagesTotal',
  ]
} as const
export type KafkaDataPoint = FromSchema<typeof kafkaDataPointSchema>

const undiciDataPointSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: { type: 'string', format: 'date-time' },
    idleSockets: { type: 'number' },
    openSockets: { type: 'number' },
    pendingRequests: { type: 'number' },
    queuedRequests: { type: 'number' },
    activeRequests: { type: 'number' },
    sizeRequests: { type: 'number' },
  },
  required: [
    'date',
    'idleSockets',
    'openSockets',
    'pendingRequests',
    'queuedRequests',
    'activeRequests',
    'sizeRequests',
  ]
} as const
export type UndiciDataPoint = FromSchema<typeof undiciDataPointSchema>

const websocketDataPointSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: { type: 'string', format: 'date-time' },
    connections: { type: 'number' }
  },
  required: [
    'date',
    'connections'
  ]
} as const
export type WebsocketDataPoint = FromSchema<typeof websocketDataPointSchema>

const nodejsDataPointSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: { type: 'string', format: 'date-time' },
    resources: { type: 'number' }
  },
  required: [
    'date',
    'resources'
  ]
} as const
export type NodejsDataPoint = FromSchema<typeof nodejsDataPointSchema>

export const requiredMetricKeys = ['dataMem', 'dataCpu', 'dataKafka', 'dataReq', 'dataLatency', 'dataUndici', 'dataWebsocket', 'dataNodejs'] as const
export const metricResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    dataMem: { type: 'array', items: memoryDataPointSchema },
    dataCpu: { type: 'array', items: cpuDataPointSchema },
    dataLatency: { type: 'array', items: latencyDataPointSchema },
    dataReq: { type: 'array', items: requestDataPointSchema },
    dataKafka: { type: 'array', items: kafkaDataPointSchema },
    dataUndici: { type: 'array', items: undiciDataPointSchema },
    dataWebsocket: { type: 'array', items: websocketDataPointSchema },
    dataNodejs: { type: 'array', items: nodejsDataPointSchema }
  },
  required: requiredMetricKeys
} as const
export type MetricsResponse = FromSchema<typeof metricResponseSchema>
export type SingleMetricResponse = {
  [K in keyof MetricsResponse]: MetricsResponse[K] extends (infer T)[] ? T : never
}

export const pidParamSchema = { type: 'object', additionalProperties: false, properties: { pid: { type: 'number' } }, required: ['pid'] } as const
export type PidParam = FromSchema<typeof pidParamSchema>

export const profileSchema = { type: 'string', enum: ['cpu', 'heap'] } as const
export type Profile = FromSchema<typeof profileSchema>

export const selectableRuntimeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    pid: {
      type: 'integer'
    },
    cwd: {
      type: 'string'
    },
    argv: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    uptimeSeconds: {
      type: 'number'
    },
    execPath: {
      type: 'string'
    },
    nodeVersion: {
      type: 'string'
    },
    projectDir: {
      type: 'string'
    },
    packageName: {
      type: 'string'
    },
    packageVersion: {
      type: 'string'
    },
    url: {
      type: 'string'
    },
    platformaticVersion: {
      type: 'string'
    },
    selected: {
      type: 'boolean'
    }
  },
  required: [
    'pid',
    'cwd',
    'argv',
    'uptimeSeconds',
    'execPath',
    'nodeVersion',
    'projectDir',
    'packageName',
    'packageVersion',
    'url',
    'platformaticVersion',
    'selected'
  ]
} as const
export type SelectableRuntime = FromSchema<typeof selectableRuntimeSchema>
