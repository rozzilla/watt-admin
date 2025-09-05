import test from 'node:test'
import assert from 'node:assert'
import { getServer, startWatt, loadMetrics } from '../helper'
import { MetricsResponse } from '../../schemas'

test('metrics are calculated', async (t) => {
  const emptyMetrics: MetricsResponse = { dataCpu: [], dataLatency: [], dataMem: [], dataReq: [], dataKafka: [], dataUndici: [], dataWebsocket: [], dataNodejs: [] }

  await startWatt(t)
  const server = await getServer(t)
  const res = await server.inject({
    url: '/runtimes?includeAdmin=true'
  })
  assert.strictEqual(res.statusCode, 200, 'runtimes endpoint')
  const [runtime] = res.json()
  const runtimePid = runtime.pid
  assert.strictEqual(runtime.packageName, '@platformatic/watt-admin')
  assert.strictEqual(typeof runtimePid, 'number')

  const metricsEmpty = await server.inject({
    url: `/runtimes/${runtimePid}/metrics`
  })
  assert.strictEqual(metricsEmpty.statusCode, 200, 'metrics endpoint')
  assert.deepEqual(metricsEmpty.json(), emptyMetrics, 'metrics result is empty')

  await loadMetrics(server)
  const metrics = await server.inject({
    url: `/runtimes/${runtimePid}/metrics`
  })
  assert.strictEqual(metrics.statusCode, 200, 'metrics endpoint')
  const metricsJson = metrics.json()
  assert.ok('dataCpu' in metricsJson)
  assert.ok('dataLatency' in metricsJson)
  assert.ok('dataMem' in metricsJson)
  assert.ok('dataReq' in metricsJson)
  assert.ok('dataKafka' in metricsJson)
  assert.ok('dataUndici' in metricsJson)
  assert.ok('dataWebsocket' in metricsJson)
  assert.ok('dataNodejs' in metricsJson)
  assert.notDeepEqual(metricsJson, {}, 'metrics are not empty after the interval')

  const serviceMetrics = await server.inject({
    url: `/runtimes/${runtimePid}/metrics/backend`
  })
  assert.strictEqual(serviceMetrics.statusCode, 200, 'service metrics endpoint')
  assert.notDeepEqual(serviceMetrics.json(), emptyMetrics, 'service metrics are not empty for a valid service name')

  const serviceMetricsEmpty = await server.inject({
    url: `/runtimes/${runtimePid}/metrics/fantozzi`
  })
  assert.strictEqual(serviceMetricsEmpty.statusCode, 200, 'service metrics endpoint')
  assert.deepEqual(serviceMetricsEmpty.json(), emptyMetrics, 'service metrics are empty for an invalid service name')

  const workerMetricsEmpty = await server.inject({
    url: `/runtimes/${runtimePid}/metrics/backend/42`
  })
  assert.strictEqual(workerMetricsEmpty.statusCode, 200, 'worker metrics endpoint')
  assert.deepEqual(workerMetricsEmpty.json(), emptyMetrics, 'worker metrics are empty for a non existent worker id')
})
