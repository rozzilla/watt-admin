import { getRuntimes, getRuntimesPidMetrics, getRuntimesPidMetricsServiceId, setBaseUrl } from './client/backend'
import { ApiApplication } from './components/application/AppNameBox'
import { subtractSecondsFromDate } from './utilities/dates'

// FIXME: once the codebase will be migrated to TypeScript, we should leverage auto-generated clients through `@platformatic/client-cli`
const host = '/api'

setBaseUrl(host)

export const getApiApplication = async (): Promise<ApiApplication> => {
  const { body } = await getRuntimes({ query: { includeAdmin: false } })

  for (const runtime of body) {
    const { platformaticVersion: pltVersion, packageName: name, pid: id, uptimeSeconds, url, selected } = runtime
    if (!selected) continue
    const lastStarted = subtractSecondsFromDate(new Date(), uptimeSeconds)
    return { id, url, name, pltVersion, lastStarted }
  }

  return { id: 0, lastStarted: '', name: '', url: '' }
}

// This is to avoid calling npm registry every time we run the method below
let latest = ''
export const isWattpmVersionOutdated = async (currentVersion?: string) => {
  if (!latest) {
    const result = await fetch('https://registry.npmjs.org/@platformatic/control')
    const data = await result.json()
    latest = data['dist-tags'].latest
  }
  console.log('last stable @platformatic/control version', latest)
  return latest !== currentVersion
}

export const getServices = async (id: number) => {
  const result = await fetch(`${host}/runtimes/${id}/services`)
  const data = await result.json()
  return data.services
}

export const getLogs = async (id: number) => {
  const result = await fetch(`${host}/runtimes/${id}/logs`)
  const data = await result.json()
  return data
}

export const getApiMetricsPod = async (id: number) => {
  const { body } = await getRuntimesPidMetrics({ path: { pid: id } })
  return body
}

export const getApiMetricsPodService = async (id: number, serviceId: string) => {
  const { body } = await getRuntimesPidMetricsServiceId({ path: { pid: id, serviceId } })
  return body
}

export const restartApiApplication = async (id: number) => {
  const result = await fetch(`${host}/runtimes/${id}/restart`, { method: 'POST' })
  console.log('restart api application status', result.status)
  return {}
}
