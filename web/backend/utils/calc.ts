import { RuntimeApiClient } from '@platformatic/control'
import { FastifyInstance } from 'fastify'
import os from 'os'

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

interface RequestDataPoint extends CommonMetricData {
  count: number;
}

export interface MetricsResponse {
  dataMem: MemoryDataPoint[];
  dataCpu: CpuDataPoint[];
  dataLatency: LatencyDataPoint[];
  dataReq: RequestDataPoint[];
}

export type MappedMetrics = Record<number, {
  aggregated: MetricsResponse,
  services: Record<string, MetricsResponse>
}>

// This is to avoid the mapped metrics array from growing indefinitely (and therefore a memory leak)
const MAX_STORED_METRICS = 20

export const calculateMetrics = async ({ mappedMetrics, log }: FastifyInstance): Promise<void> => {
  try {
    const api = new RuntimeApiClient()
    const runtimes = await api.getRuntimes()
    const numCpus = os.cpus().length
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
      const aggregatedReqData: RequestDataPoint = {
        date,
        count: 0
      }
      let aggregatedCountP90 = 0
      let aggregatedCountP95 = 0
      let aggregatedCountP99 = 0
      let aggregatedSumP90 = 0
      let aggregatedSumP95 = 0
      let aggregatedSumP99 = 0
      let aggregatedRss = 0

      const runtimeMetrics = await api.getRuntimeMetrics(pid, { format: 'json' })
      if (!mappedMetrics[pid]) {
        mappedMetrics[pid] = { services: {}, aggregated: { dataCpu: [], dataLatency: [], dataMem: [], dataReq: [] } }
      }

      const { services } = await api.getRuntimeServices(pid)
      for (const { id: serviceId } of services) {
        if (!mappedMetrics[pid].services[serviceId]) {
          mappedMetrics[pid].services[serviceId] = { dataCpu: [], dataLatency: [], dataMem: [], dataReq: [] }
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
        const serviceReqData: RequestDataPoint = {
          date,
          count: 0
        }
        let countP90 = 0
        let countP95 = 0
        let countP99 = 0
        let sumP90 = 0
        let sumP95 = 0
        let sumP99 = 0

        for (const metric of runtimeMetrics) {
          if (metric.values.length > 0) {
            const [{ value, labels }] = metric.values

            if (metric.name === 'process_resident_memory_bytes') {
              aggregatedRss = calcBytesToMB(value)
            }

            if (serviceId === labels.serviceId) {
              if (metric.name === 'nodejs_heap_size_total_bytes') {
                serviceMemData.totalHeap = calcBytesToMB(value)
                aggregatedMemData.totalHeap += serviceMemData.totalHeap
              }

              if (metric.name === 'nodejs_heap_size_used_bytes') {
                serviceMemData.usedHeap = calcBytesToMB(value)
                aggregatedMemData.usedHeap += serviceMemData.usedHeap
              }

              if (metric.name === 'nodejs_heap_space_size_used_bytes') {
                metric.values.forEach(val => {
                  if (val.labels?.space === 'new') {
                    serviceMemData.newSpace = calcBytesToMB(val.value)
                    aggregatedMemData.newSpace += serviceMemData.newSpace
                  } else if (val.labels?.space === 'old') {
                    serviceMemData.oldSpace = calcBytesToMB(val.value)
                    aggregatedMemData.oldSpace += serviceMemData.oldSpace
                  }
                })
              }

              if (metric.name === 'process_cpu_percent_usage') {
                serviceCpuData.cpu = value / numCpus
                aggregatedCpuData.cpu += serviceCpuData.cpu
              }

              if (metric.name === 'nodejs_eventloop_utilization') {
                serviceCpuData.eventLoop = value * 100
                aggregatedCpuData.eventLoop += serviceCpuData.eventLoop
              }

              if (metric.name === 'http_request_all_summary_seconds') {
                for (const metricValue of metric.values) {
                  const data = metricValue.value * 1000
                  if (data > 0) {
                    if (metricValue.labels?.quantile === 0.9) {
                      countP90++
                      sumP90 += data
                      serviceLatencyData.p90 = sumP90 / countP90
                      aggregatedLatencyData.p90 += serviceLatencyData.p90
                      aggregatedCountP90 += countP90
                      aggregatedSumP90 += data
                      aggregatedLatencyData.p90 = aggregatedSumP90 / aggregatedCountP90
                    }
                    if (metricValue.labels?.quantile === 0.95) {
                      countP95++
                      sumP95 += data
                      serviceLatencyData.p95 = sumP95 / countP95
                      aggregatedLatencyData.p95 += serviceLatencyData.p95
                      aggregatedCountP95 += countP95
                      aggregatedSumP95 += data
                      aggregatedLatencyData.p95 = aggregatedSumP95 / aggregatedCountP95
                    }
                    if (metricValue.labels?.quantile === 0.99) {
                      countP99++
                      sumP99 += data
                      serviceLatencyData.p99 = sumP99 / countP99
                      aggregatedCountP99 += countP99
                      aggregatedSumP99 += data
                      aggregatedLatencyData.p99 = aggregatedSumP99 / aggregatedCountP99
                    }
                  }
                }
              }

              if (metric.name === 'http_request_duration_seconds') {
                const count = metric.values.find(({ metricName }) => metricName === 'http_request_duration_seconds_count'
                )?.value
                if (!count) {
                  log.debug(metric.values, 'Empty HTTP request count')
                } else {
                  serviceReqData.count = count
                  aggregatedReqData.count += count
                }
              }
            }
          }
        }

        serviceMemData.rss = aggregatedRss
        aggregatedMemData.rss = aggregatedRss
        if (mappedMetrics[pid].services[serviceId].dataMem.length >= MAX_STORED_METRICS) {
          mappedMetrics[pid].services[serviceId].dataMem.shift()
        }
        if (mappedMetrics[pid].services[serviceId].dataCpu.length >= MAX_STORED_METRICS) {
          mappedMetrics[pid].services[serviceId].dataCpu.shift()
        }
        if (mappedMetrics[pid].services[serviceId].dataLatency.length >= MAX_STORED_METRICS) {
          mappedMetrics[pid].services[serviceId].dataLatency.shift()
        }
        if (mappedMetrics[pid].services[serviceId].dataReq.length >= MAX_STORED_METRICS) {
          mappedMetrics[pid].services[serviceId].dataReq.shift()
        }
        mappedMetrics[pid].services[serviceId].dataMem.push(serviceMemData)
        mappedMetrics[pid].services[serviceId].dataCpu.push(serviceCpuData)
        mappedMetrics[pid].services[serviceId].dataLatency.push(serviceLatencyData)
        mappedMetrics[pid].services[serviceId].dataReq.push(serviceReqData)
      }

      if (mappedMetrics[pid].aggregated.dataMem.length >= MAX_STORED_METRICS) {
        mappedMetrics[pid].aggregated.dataMem.shift()
      }
      if (mappedMetrics[pid].aggregated.dataCpu.length >= MAX_STORED_METRICS) {
        mappedMetrics[pid].aggregated.dataCpu.shift()
      }
      if (mappedMetrics[pid].aggregated.dataLatency.length >= MAX_STORED_METRICS) {
        mappedMetrics[pid].aggregated.dataLatency.shift()
      }
      if (mappedMetrics[pid].aggregated.dataReq.length >= MAX_STORED_METRICS) {
        mappedMetrics[pid].aggregated.dataReq.shift()
      }

      mappedMetrics[pid].aggregated.dataMem.push(aggregatedMemData)
      mappedMetrics[pid].aggregated.dataCpu.push(aggregatedCpuData)
      mappedMetrics[pid].aggregated.dataLatency.push(aggregatedLatencyData)
      mappedMetrics[pid].aggregated.dataReq.push(aggregatedReqData)
    }
  } catch (error) {
    log.warn(error, 'Unable to get runtime metrics. Retry will start soon...')
  }
}

export const calcBytesToMB = (bytes: number): number => Number((bytes / (1024 * 1024)).toFixed(2))
