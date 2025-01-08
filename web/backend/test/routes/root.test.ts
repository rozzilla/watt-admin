import test from 'node:test'
import assert from 'node:assert'
import { getServer, startWatt } from '../helper'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('no runtime running', async (t) => {
  const server = await getServer(t)
  const res = await server.inject({
    method: 'GET',
    url: '/runtimes'
  })
  assert.strictEqual(res.statusCode, 200)
  assert.deepStrictEqual(res.json(), [], 'with no runtime running')

  const services = await server.inject({
    method: 'GET',
    url: '/runtimes/42/services'
  })
  assert.strictEqual(services.statusCode, 500)
  assert.ok(services.json().message.includes('connect ENOENT'), 'unable to list services due to no runtime available')
})

test('runtime is running', async (t) => {
  await startWatt(t)
  const server = await getServer(t)
  const res = await server.inject({
    method: 'GET',
    url: '/runtimes'
  })
  assert.strictEqual(res.statusCode, 200, 'runtimes endpoint')
  const [runtime] = res.json()
  const runtimePid = runtime.pid
  assert.strictEqual(runtime.packageName, 'backend')
  assert.strictEqual(typeof runtime.packageName, 'string')
  assert.strictEqual(typeof runtimePid, 'number')
  assert.strictEqual(runtime.packageVersion, null)

  const metricsEmpty = await server.inject({
    method: 'GET',
    url: `/runtimes/${runtimePid}/metrics`
  })
  assert.strictEqual(metricsEmpty.statusCode, 200, 'metrics endpoint')
  assert.deepEqual(metricsEmpty.json(), [], 'metrics result is empty')

  const services = await server.inject({
    method: 'GET',
    url: `/runtimes/${runtimePid}/services`
  })
  assert.strictEqual(services.statusCode, 200, 'services endpoint')
  const servicesJson = services.json()
  assert.strictEqual(servicesJson.production, true)
  assert.strictEqual(servicesJson.entrypoint, 'backend')
  assert.strictEqual(typeof servicesJson.services[0].url, 'string')
  assert.strictEqual(typeof servicesJson.services[0].entrypoint, 'boolean')

  // Wait for the interval to be run
  await wait(1000)
  const metrics = await server.inject({
    method: 'GET',
    url: `/runtimes/${runtimePid}/metrics`
  })
  assert.strictEqual(metrics.statusCode, 200, 'metrics endpoint')
  const metricsJson = metrics.json()
  assert.strictEqual(metricsJson[0].pid, runtimePid)
  assert.strictEqual(metricsJson[0].serviceId, 'backend')
  assert.notDeepEqual(metricsJson, [], 'metrics are not empty after the interval')

  const serviceMetrics = await server.inject({
    method: 'GET',
    url: `/runtimes/${runtimePid}/metrics/backend`
  })
  assert.strictEqual(serviceMetrics.statusCode, 200, 'service metrics endpoint')
  assert.notDeepEqual(serviceMetrics.json(), [], 'service metrics are not empty for a valid service name')

  const serviceMetricsEmpty = await server.inject({
    method: 'GET',
    url: `/runtimes/${runtimePid}/metrics/fantozzi`
  })
  assert.strictEqual(serviceMetricsEmpty.statusCode, 200, 'service metrics endpoint')
  assert.deepEqual(serviceMetricsEmpty.json(), [], 'service metrics are empty for an invalid service name')
})
