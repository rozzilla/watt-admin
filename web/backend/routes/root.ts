import { FastifyInstance } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { RuntimeApiClient } from '@platformatic/control'
import { Metric } from '../global'

export default async function (fastify: FastifyInstance) {
  const typedFastify = fastify.withTypeProvider<JsonSchemaToTsProvider>()
  const api = new RuntimeApiClient()

  typedFastify.get('/runtimes', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          includeAdmin: {
            type: 'boolean',
            default: false,
          },
        },
      },
    }
  }, async (request) => {
    let runtimes = await api.getRuntimes()

    if (!request.query.includeAdmin) {
      runtimes = runtimes.filter((runtime) => runtime.packageName !== 'watt-admin')
    }

    return runtimes
  })

  interface MemoryDataPoint {
    serviceId: string;
    date: Date;
    rss: number;
    totalHeap: number;
    usedHeap: number;
    newSpace: number;
    oldSpace: number;
  }

  interface CpuDataPoint {
    serviceId: string;
    date: Date;
    cpu: number;
    eventLoop: number;
  }

  interface LatencyDataPoint {
    serviceId: string;
    date: Date;
    p90: number;
    p95: number;
    p99: number;
  }

  interface MetricsResponse {
    dataMem: MemoryDataPoint[];
    dataCpu: CpuDataPoint[];
    dataLatency: LatencyDataPoint[];
  }

  const BYTES_TO_GB = 1024 * 1024 * 1024

  const bytesToGB = (bytes: number): number =>
    Number((bytes / BYTES_TO_GB).toFixed(2))

  const hasNonZeroValues = (obj: Record<string, any>): boolean =>
    Object.entries(obj).some(([key, value]) => key !== 'date' && value !== 0)

  typedFastify.get('/runtimes/:pid/metrics', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' } }, required: ['pid'] }
    }
  }, async ({ params: { pid } }) => {
    const metrics = fastify.mappedMetrics[pid] || []

    const groupedByTime = metrics.reduce((acc: Record<string, Metric[]>, metric) => {
      const timeKey = metric.time.toISOString()
      if (!acc[timeKey]) {
        acc[timeKey] = []
      }
      acc[timeKey].push(metric)
      return acc
    }, {})

    const result: MetricsResponse = {
      dataMem: [],
      dataCpu: [],
      dataLatency: []
    }

    Object.entries(groupedByTime).forEach(([time, timeMetrics]) => {
      const memData: MemoryDataPoint = {
        serviceId: timeMetrics[0].serviceId,
        date: new Date(time),
        rss: 0,
        totalHeap: 0,
        usedHeap: 0,
        newSpace: 0,
        oldSpace: 0
      }

      const cpuData: CpuDataPoint = {
        serviceId: timeMetrics[0].serviceId,
        date: new Date(time),
        cpu: 0,
        eventLoop: 0
      }

      const latencyData: LatencyDataPoint = {
        serviceId: timeMetrics[0].serviceId,
        date: new Date(time),
        p90: 0,
        p95: 0,
        p99: 0
      }

      timeMetrics.forEach((metric) => {
        const metricValue = metric.values[0]?.value || 0

        switch (metric.name) {
          case 'process_resident_memory_bytes':
            memData.rss = bytesToGB(metricValue)
            break
          case 'nodejs_heap_size_total_bytes':
            memData.totalHeap = bytesToGB(metricValue)
            break
          case 'nodejs_heap_size_used_bytes':
            memData.usedHeap = bytesToGB(metricValue)
            break
          case 'nodejs_heap_space_size_used_bytes':
            metric.values.forEach(val => {
              if (val.labels?.space === 'new') {
                memData.newSpace = bytesToGB(val.value)
              } else if (val.labels?.space === 'old') {
                memData.oldSpace = bytesToGB(val.value)
              }
            })
            break
          case 'process_cpu_percent_usage':
            cpuData.cpu = metricValue
            break
          case 'nodejs_eventloop_utilization':
            cpuData.eventLoop = metricValue
            break
          case 'nodejs_eventloop_lag_p90_seconds':
            latencyData.p90 = metricValue
            break
          case 'nodejs_eventloop_lag_p99_seconds':
            latencyData.p99 = metricValue
            latencyData.p95 = (latencyData.p90 + latencyData.p99) / 2
            break
        }
      })

      if (hasNonZeroValues(memData)) {
        result.dataMem.push(memData)
      }
      if (hasNonZeroValues(cpuData)) {
        result.dataCpu.push(cpuData)
      }
      if (hasNonZeroValues(latencyData)) {
        result.dataLatency.push(latencyData)
      }
    })

    return result
  })

  typedFastify.get('/runtimes/:pid/metrics/:serviceId', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' }, serviceId: { type: 'string' } }, required: ['pid', 'serviceId'] }
    }
  }, async ({ params: { pid, serviceId } }) => {
    return fastify.mappedMetrics[pid]?.filter((value) => value.serviceId === serviceId)
  })

  typedFastify.get('/runtimes/:pid/services', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' } }, required: ['pid'] }
    }
  }, async (request) => {
    return api.getRuntimeServices(request.params.pid)
  })

  typedFastify.get('/runtimes/:pid/logs', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' } }, required: ['pid'] }
    }
  }, async (request) => api.getRuntimeAllLogsStream(request.params.pid))

  typedFastify.get('/runtimes/:pid/openapi/:serviceId', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' }, serviceId: { type: 'string' } }, required: ['pid', 'serviceId'] }
    }
  }, async ({ params: { pid, serviceId } }) => {
    return api.getRuntimeOpenapi(pid, serviceId)
  })

  typedFastify.post('/runtimes/:pid/reload', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' } }, required: ['pid'] }
    }
  }, async (request) => {
    return api.reloadRuntime(request.params.pid)
  })

  typedFastify.post('/runtimes/:pid/restart', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' } }, required: ['pid'] }
    }
  }, async (request) => {
    return api.restartRuntime(request.params.pid)
  })

  typedFastify.post('/runtimes/:pid/stop', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' } }, required: ['pid'] }
    }
  }, async (request) => {
    return api.stopRuntime(request.params.pid)
  })
}
