import { RuntimeApiClient } from '@platformatic/control'
import { FastifyInstance } from 'fastify'

interface CommonMetricData {
  date: Date;
  serviceId: string;
}

interface MemoryDataPoint extends CommonMetricData {
  rss: number;
  totalHeap: number;
  usedHeap: number;
  newSpace: number;
  oldSpace: number;
}

interface CpuDataPoint extends CommonMetricData {
  cpu: number;
  eventLoop: number;
}

interface LatencyDataPoint extends CommonMetricData {
  p90: number;
  p95: number;
  p99: number;
}

export interface MetricsResponse {
  dataMem: MemoryDataPoint[];
  dataCpu: CpuDataPoint[];
  dataLatency: LatencyDataPoint[];
}

const bytesToGB = (bytes: number) => Number((bytes / (1024 * 1024 * 1024)).toFixed(2))

export default async function (fastify: FastifyInstance) {
  fastify.decorate('mappedMetrics', {})

  const api = new RuntimeApiClient()

  const metricsInterval = setInterval(async () => {
    const runtimes = await api.getRuntimes()
    for (const { pid } of runtimes) {
      try {
        const date = new Date()
        const runtimeMetrics = await api.getRuntimeMetrics(pid, { format: 'json' })
        if (!fastify.mappedMetrics[pid]) {
          fastify.mappedMetrics[pid] = { dataCpu: [], dataLatency: [], dataMem: [] }
        }

        const { services } = await api.getRuntimeServices(pid)
        // This is to avoid the mapped metrics array from growing indefinitely (and therefore a memory leak)
        const MAX_STORED_METRICS = services.length * 15
        for (const { id: serviceId } of services) {
          const memData: MemoryDataPoint = {
            date,
            serviceId,
            rss: 0,
            totalHeap: 0,
            usedHeap: 0,
            newSpace: 0,
            oldSpace: 0
          }
          const cpuData: CpuDataPoint = {
            date,
            serviceId,
            cpu: 0,
            eventLoop: 0
          }
          const latencyData: LatencyDataPoint = {
            date,
            serviceId,
            p90: 0,
            p95: 0,
            p99: 0
          }

          for (const metric of runtimeMetrics) {
            if (metric.values.length > 0) {
              const [{ value, labels }] = metric.values

              if (serviceId === labels.serviceId) {
                if (metric.name === 'process_resident_memory_bytes') {
                  memData.rss = bytesToGB(value)
                }

                if (metric.name === 'nodejs_heap_size_total_bytes') {
                  memData.totalHeap = bytesToGB(value)
                }

                if (metric.name === 'nodejs_heap_size_used_bytes') {
                  memData.usedHeap = bytesToGB(value)
                }

                if (metric.name === 'nodejs_heap_space_size_used_bytes') {
                  metric.values.forEach(val => {
                    if (val.labels?.space === 'new') {
                      memData.newSpace = bytesToGB(val.value)
                    } else if (val.labels?.space === 'old') {
                      memData.oldSpace = bytesToGB(val.value)
                    }
                  })
                }

                if (metric.name === 'process_cpu_percent_usage') {
                  cpuData.cpu = value
                }

                if (metric.name === 'nodejs_eventloop_utilization') {
                  cpuData.eventLoop = value
                }

                if (metric.name === 'nodejs_eventloop_lag_p90_seconds') {
                  latencyData.p90 = value * 1000
                }

                if (metric.name === 'nodejs_eventloop_lag_p99_seconds') {
                  latencyData.p99 = value * 1000
                }

                if (latencyData.p90 && latencyData.p99) {
                  latencyData.p95 = (latencyData.p90 + latencyData.p99) / 2
                }
              }
            }
          }

          if (fastify.mappedMetrics[pid].dataMem.length >= MAX_STORED_METRICS) {
            fastify.mappedMetrics[pid].dataMem.shift()
          }
          if (fastify.mappedMetrics[pid].dataCpu.length >= MAX_STORED_METRICS) {
            fastify.mappedMetrics[pid].dataCpu.shift()
          }
          if (fastify.mappedMetrics[pid].dataLatency.length >= MAX_STORED_METRICS) {
            fastify.mappedMetrics[pid].dataLatency.shift()
          }
          fastify.mappedMetrics[pid].dataMem.push(memData)
          fastify.mappedMetrics[pid].dataCpu.push(cpuData)
          fastify.mappedMetrics[pid].dataLatency.push(latencyData)
        }
      } catch (error) {
        fastify.log.warn(error, 'Unable to get runtime metrics. Retry will start soon...')
      }
    }
  }, 1000)

  fastify.decorate('metricsInterval', metricsInterval)

  fastify.addHook('onClose', async () => {
    // If the following log is not called, please run the project directly through the `wattpm` binary (ref. https://github.com/platformatic/platformatic/issues/3751)
    fastify.log.info('Closing the backend...')
    clearInterval(fastify.metricsInterval)
  })
}
