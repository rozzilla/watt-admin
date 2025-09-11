import { GetRuntimesPidMetricsResponseOK } from 'src/client/backend-types'
import colorSetMem from '../components/metrics/memory.module.css'
import colorSetCpu from '../components/metrics/cpu.module.css'
import colorSetReq from '../components/metrics/req.module.css'
import colorSetLatency from '../components/metrics/latency.module.css'
import colorSetKafka from '../components/metrics/kafka.module.css'
import colorSetWs from '../components/metrics/ws.module.css'
import colorSetUndici from '../components/metrics/undici.module.css'
import colorSetNodejs from '../components/metrics/nodejs.module.css'
import { MetricType } from '../components/application/NodeJSMetric'

export const getEmptyMetrics = (): GetRuntimesPidMetricsResponseOK => ({ dataMem: [], dataCpu: [], dataLatency: [], dataReq: [], dataKafka: [], dataUndici: [], dataWebsocket: [], dataNodejs: [] })

export const getMetricColor = (metricType: MetricType) => {
  let colorStyles: Record<string, string>
  switch (metricType) {
    case 'mem':
      colorStyles = colorSetMem
      break
    case 'cpu':
      colorStyles = colorSetCpu
      break
    case 'req':
      colorStyles = colorSetReq
      break
    case 'latency':
      colorStyles = colorSetLatency
      break
    case 'kafka':
      colorStyles = colorSetKafka
      break
    case 'undici':
      colorStyles = colorSetUndici
      break
    case 'ws':
      colorStyles = colorSetWs
      break
    case 'nodejs':
      colorStyles = colorSetNodejs
      break
    default:
    {
      // This will cause a TypeScript error if any MetricType case is missing
      const tsMetricCheck: never = metricType
      throw new Error(`Unhandled metric type: ${tsMetricCheck}`)
    }
  }
  return colorStyles
}
