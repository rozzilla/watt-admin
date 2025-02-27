import { RuntimeApiClient } from '@platformatic/control'
import { FastifyInstance } from 'fastify'

interface CommonMetricData {
  date: Date;
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
  const calculateMetrics = async () => {
    // This is to avoid the mapped metrics array from growing indefinitely (and therefore a memory leak)
    const MAX_STORED_METRICS = 20
    try {
      const api = new RuntimeApiClient()
      const runtimes = await api.getRuntimes()
      for (const { pid } of runtimes) {
        const date = new Date()
        const aggregatedMemData: MemoryDataPoint = {
          date,
          rss: 0,
          totalHeap: 0,
          usedHeap: 0,
          newSpace: 0,
          oldSpace: 0
        }
        const aggregatedCpuData: CpuDataPoint = {
          date,
          cpu: 0,
          eventLoop: 0
        }
        const aggregatedLatencyData: LatencyDataPoint = {
          date,
          p90: 0,
          p95: 0,
          p99: 0
        }
        const runtimeMetrics = await api.getRuntimeMetrics(pid, { format: 'json' })
        if (!fastify.mappedMetrics[pid]) {
          fastify.mappedMetrics[pid] = { services: {}, aggregated: { dataCpu: [], dataLatency: [], dataMem: [] } }
        }

        const { services } = await api.getRuntimeServices(pid)
        for (const { id: serviceId } of services) {
          if (!fastify.mappedMetrics[pid].services[serviceId]) {
            fastify.mappedMetrics[pid].services[serviceId] = { dataCpu: [], dataLatency: [], dataMem: [] }
          }

          const serviceMemData: MemoryDataPoint = {
            date,
            rss: 0,
            totalHeap: 0,
            usedHeap: 0,
            newSpace: 0,
            oldSpace: 0
          }
          const serviceCpuData: CpuDataPoint = {
            date,
            cpu: 0,
            eventLoop: 0
          }
          const serviceLatencyData: LatencyDataPoint = {
            date,
            p90: 0,
            p95: 0,
            p99: 0
          }

          for (const metric of runtimeMetrics) {
            if (metric.values.length > 0) {
              const [{ value, labels }] = metric.values

              if (serviceId === labels.serviceId) {
                if (metric.name === 'process_resident_memory_bytes') {
                  serviceMemData.rss = bytesToGB(value)
                  aggregatedMemData.rss += serviceMemData.rss
                }

                if (metric.name === 'nodejs_heap_size_total_bytes') {
                  serviceMemData.totalHeap = bytesToGB(value)
                  aggregatedMemData.totalHeap += serviceMemData.totalHeap
                }

                if (metric.name === 'nodejs_heap_size_used_bytes') {
                  serviceMemData.usedHeap = bytesToGB(value)
                  aggregatedMemData.usedHeap += serviceMemData.usedHeap
                }

                if (metric.name === 'nodejs_heap_space_size_used_bytes') {
                  metric.values.forEach(val => {
                    if (val.labels?.space === 'new') {
                      serviceMemData.newSpace = bytesToGB(val.value)
                      aggregatedMemData.newSpace += serviceMemData.newSpace
                    } else if (val.labels?.space === 'old') {
                      serviceMemData.oldSpace = bytesToGB(val.value)
                      aggregatedMemData.oldSpace += serviceMemData.oldSpace
                    }
                  })
                }

                if (metric.name === 'process_cpu_percent_usage') {
                  serviceCpuData.cpu = value
                  aggregatedCpuData.cpu += value
                }

                if (metric.name === 'nodejs_eventloop_utilization') {
                  serviceCpuData.eventLoop = value
                  aggregatedCpuData.eventLoop += value
                }

                if (metric.name === 'nodejs_eventloop_lag_p90_seconds') {
                  serviceLatencyData.p90 = value * 1000
                  aggregatedLatencyData.p90 += serviceLatencyData.p90
                }

                if (metric.name === 'nodejs_eventloop_lag_p99_seconds') {
                  serviceLatencyData.p99 = value * 1000
                  aggregatedLatencyData.p99 += serviceLatencyData.p99
                }

                if (serviceLatencyData.p90 && serviceLatencyData.p99) {
                  serviceLatencyData.p95 = (serviceLatencyData.p90 + serviceLatencyData.p99) / 2
                  aggregatedLatencyData.p95 = (aggregatedLatencyData.p90 + aggregatedLatencyData.p99) / 2
                }
              }
            }
          }

          if (fastify.mappedMetrics[pid].services[serviceId].dataMem.length >= MAX_STORED_METRICS) {
            fastify.mappedMetrics[pid].services[serviceId].dataMem.shift()
          }
          if (fastify.mappedMetrics[pid].services[serviceId].dataCpu.length >= MAX_STORED_METRICS) {
            fastify.mappedMetrics[pid].services[serviceId].dataCpu.shift()
          }
          if (fastify.mappedMetrics[pid].services[serviceId].dataLatency.length >= MAX_STORED_METRICS) {
            fastify.mappedMetrics[pid].services[serviceId].dataLatency.shift()
          }
          fastify.mappedMetrics[pid].services[serviceId].dataMem.push(serviceMemData)
          fastify.mappedMetrics[pid].services[serviceId].dataCpu.push(serviceCpuData)
          fastify.mappedMetrics[pid].services[serviceId].dataLatency.push(serviceLatencyData)
        }

        if (fastify.mappedMetrics[pid].aggregated.dataMem.length >= MAX_STORED_METRICS) {
          fastify.mappedMetrics[pid].aggregated.dataMem.shift()
        }
        if (fastify.mappedMetrics[pid].aggregated.dataCpu.length >= MAX_STORED_METRICS) {
          fastify.mappedMetrics[pid].aggregated.dataCpu.shift()
        }
        if (fastify.mappedMetrics[pid].aggregated.dataLatency.length >= MAX_STORED_METRICS) {
          fastify.mappedMetrics[pid].aggregated.dataLatency.shift()
        }

        fastify.mappedMetrics[pid].aggregated.dataMem.push(aggregatedMemData)
        fastify.mappedMetrics[pid].aggregated.dataCpu.push(aggregatedCpuData)
        fastify.mappedMetrics[pid].aggregated.dataLatency.push(aggregatedLatencyData)
      }
    } catch (error) {
      fastify.log.warn(error, 'Unable to get runtime metrics. Retry will start soon...')
    }
  }

  fastify.decorate('mappedMetrics', {})

  fastify.decorate('metricsInterval', setInterval(calculateMetrics, 1000))

  fastify.addHook('onClose', async () => {
    // If the following log is not called, please run the project directly through the `wattpm` binary (ref. https://github.com/platformatic/platformatic/issues/3751)
    fastify.log.info('Closing the backend...')
    clearInterval(fastify.metricsInterval)
  })
}
