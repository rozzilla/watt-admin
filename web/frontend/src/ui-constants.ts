import type { MetricOption, MetricType } from './components/application/NodeJSMetric'

export const HOME_PATH = '/'
export const POD_SERVICES_PATH = '/services'
export const POD_LOGS_PATH = '/logs'

export const STATUS_RUNNING = 'running'
export const STATUS_STARTED = 'started'
export const STATUS_STOPPED = 'stopped'

export const RAW = 'raw'
export const PRETTY = 'pretty'

export const DIRECTION_DOWN = 'down'
export const DIRECTION_STILL = 'still'
export const DIRECTION_UP = 'up'
export const DIRECTION_TAIL = 'tail'

export const REFRESH_INTERVAL_METRICS = 2000
export const REFRESH_INTERVAL_LOGS = 2000

export const KEY_MEM = 'mem'
export const KEY_CPU = 'cpu'
export const KEY_LATENCY = 'latency'
export const KEY_REQ = 'req'
export const KEY_UNDICI = 'undici'
export const KEY_WS = 'ws'
export const KEY_KAFKA = 'kafka'

const MEMORY_UNIT_METRICS = 'MB'
const LATENCY_UNIT_METRICS = 'ms'
const CPU_UNIT_METRICS = '%'
const REQ_UNIT_METRICS = '#'
const UNDICI_UNIT_METRICS = '#'
const WS_UNIT_METRICS = '#'
const KAFKA_UNIT_METRICS = '#'

export const OPTIONS_METRICS: Record<MetricType, {
  unit: string,
  title: string,
  options: MetricOption[]
}> = {
  mem: {
    title: 'Memory',
    unit: MEMORY_UNIT_METRICS,
    options: [{
      label: 'RSS',
      internalKey: 'rss',
      unit: MEMORY_UNIT_METRICS
    }, {
      label: 'Total Heap',
      internalKey: 'totalHeap',
      unit: MEMORY_UNIT_METRICS
    }, {
      label: 'Heap Used',
      internalKey: 'usedHeap',
      unit: MEMORY_UNIT_METRICS
    }, {
      label: 'New Space',
      internalKey: 'newSpace',
      unit: MEMORY_UNIT_METRICS
    }, {
      label: 'Old Space',
      internalKey: 'oldSpace',
      unit: MEMORY_UNIT_METRICS
    }]
  },
  cpu: {
    title: 'CPU & ELU',
    unit: CPU_UNIT_METRICS,
    options: [{
      label: 'CPU',
      internalKey: 'cpu',
      unit: CPU_UNIT_METRICS
    }, {
      label: 'ELU',
      internalKey: 'eventLoop',
      unit: CPU_UNIT_METRICS
    }]
  },
  latency: {
    title: 'Latency',
    unit: LATENCY_UNIT_METRICS,
    options: [{
      label: 'P90',
      internalKey: 'p90',
      unit: LATENCY_UNIT_METRICS
    }, {
      label: 'P95',
      internalKey: 'p95',
      unit: LATENCY_UNIT_METRICS
    }, {
      label: 'P99',
      internalKey: 'p99',
      unit: LATENCY_UNIT_METRICS
    }]
  },
  req: {
    title: 'Requests',
    unit: REQ_UNIT_METRICS,
    options: [{
      label: 'RPS',
      internalKey: 'rps',
      unit: REQ_UNIT_METRICS
    }]
  },
  undici: {
    title: 'Undici',
    unit: UNDICI_UNIT_METRICS,
    options: [
      {
        label: 'Idle',
        internalKey: 'idleSockets',
        unit: UNDICI_UNIT_METRICS
      },
      {
        label: 'Open',
        internalKey: 'openSockets',
        unit: UNDICI_UNIT_METRICS
      },
      {
        label: 'Pending',
        internalKey: 'pendingRequests',
        unit: UNDICI_UNIT_METRICS
      },
      {
        label: 'Queued',
        internalKey: 'queuedRequests',
        unit: UNDICI_UNIT_METRICS
      },
      {
        label: 'Active',
        internalKey: 'activeRequests',
        unit: UNDICI_UNIT_METRICS
      }
    ]
  },
  ws: {
    title: 'Websocket',
    unit: WS_UNIT_METRICS,
    options: [{
      label: 'Connections',
      internalKey: 'connections',
      unit: WS_UNIT_METRICS
    }]
  },
  kafka: {
    title: 'Kafka',
    unit: KAFKA_UNIT_METRICS,
    options: [
      {
        label: 'Produced',
        internalKey: 'producedMessages',
        unit: KAFKA_UNIT_METRICS
      },
      {
        label: 'Consumed',
        internalKey: 'consumedMessages',
        unit: KAFKA_UNIT_METRICS
      },
      {
        label: 'DLQ',
        internalKey: 'hooksDlqMessagesTotal',
        unit: KAFKA_UNIT_METRICS
      }
    ]
  }
}

export const POSITION_ABSOLUTE = 'absolute'
export const POSITION_FIXED = 'fixed'
