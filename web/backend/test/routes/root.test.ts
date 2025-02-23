import test from 'node:test'
import assert from 'node:assert'
import { getServer, startWatt } from '../helper'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('no runtime running', async (t) => {
  const server = await getServer(t)
  const res = await server.inject({
    url: '/runtimes'
  })
  assert.strictEqual(res.statusCode, 200)
  assert.deepStrictEqual(res.json(), [], 'with no runtime running')

  const services = await server.inject({
    url: '/runtimes/42/services'
  })
  assert.strictEqual(services.statusCode, 500)
  assert.ok(services.json().message.includes('connect ENOENT'), 'unable to list services due to no runtime available')
})

test('runtime is running', async (t) => {
  await startWatt(t)
  const server = await getServer(t)
  const res = await server.inject({
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
    url: `/runtimes/${runtimePid}/metrics`
  })
  assert.strictEqual(metricsEmpty.statusCode, 200, 'metrics endpoint')
  assert.deepEqual(metricsEmpty.json(), [], 'metrics result is empty')

  const services = await server.inject({
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
    url: `/runtimes/${runtimePid}/metrics`
  })
  assert.strictEqual(metrics.statusCode, 200, 'metrics endpoint')
  const metricsJson = metrics.json()
  assert.strictEqual(metricsJson[0].pid, runtimePid)
  assert.strictEqual(metricsJson[0].serviceId, 'backend')
  assert.notDeepEqual(metricsJson, [], 'metrics are not empty after the interval')

  const serviceMetrics = await server.inject({
    url: `/runtimes/${runtimePid}/metrics/backend`
  })
  assert.strictEqual(serviceMetrics.statusCode, 200, 'service metrics endpoint')
  assert.notDeepEqual(serviceMetrics.json(), [], 'service metrics are not empty for a valid service name')

  const serviceMetricsEmpty = await server.inject({
    url: `/runtimes/${runtimePid}/metrics/fantozzi`
  })
  assert.strictEqual(serviceMetricsEmpty.statusCode, 200, 'service metrics endpoint')
  assert.deepEqual(serviceMetricsEmpty.json(), [], 'service metrics are empty for an invalid service name')

  const serviceOpenapi = await server.inject({
    url: `/runtimes/${runtimePid}/openapi/backend`
  })
  assert.strictEqual(serviceOpenapi.statusCode, 200, 'service OpenAPI endpoint')
  const json = serviceOpenapi.json()
  assert.strictEqual(json.openapi, '3.0.3')
  assert.deepEqual(json.info, {
    title: 'Platformatic',
    description: 'This is a service built on top of Platformatic',
    version: '1.0.0'
  })
  assert.deepEqual(json.servers, [{ url: '/' }])
  assert.deepEqual(json.paths['/runtimes'], {
    get: {
      parameters: [
        {
          schema: {
            type: 'boolean',
            default: false,
          },
          in: 'query',
          name: 'includeAdmin',
          required: false,
        },
      ],
      responses: { 200: { description: 'Default Response' } },
    },
  })
  assert.deepEqual(json.paths['/runtimes/{pid}/reload'], {
    post: {
      parameters: [
        {
          schema: {
            type: 'number',
          },
          in: 'path',
          name: 'pid',
          required: true,
        },
      ],
      responses: {
        200: {
          description: 'Default Response',
        },
      },
    },
  })

  const serviceInvalidOpenapi = await server.inject({
    url: `/runtimes/${runtimePid}/openapi/fantozzi`
  })
  assert.strictEqual(serviceInvalidOpenapi.statusCode, 500, 'service OpenAPI endpoint')
  assert.strictEqual(serviceInvalidOpenapi.json().code, 'PLT_CTR_FAILED_TO_GET_RUNTIME_OPENAPI')

  const logs = await server.inject({
    url: `/runtimes/${runtimePid}/logs`
  })
  assert.strictEqual(logs.statusCode, 200)

  const [starting, listening, started, platformatic] = logs.body.trim().split('\n')
  assert.ok(starting.includes('Starting the service'))
  assert.ok(listening.includes('Server listening at http://127.0.0.1'))
  assert.ok(started.includes('Started the service'))
  assert.ok(platformatic.includes('Platformatic is now listening at http://127.0.0.1'))
})

test('runtime start & stop', async (t) => {
  await startWatt(t)
  const server = await getServer(t)
  const res = await server.inject({
    url: '/runtimes'
  })
  const [{ pid }] = res.json()
  assert.ok(pid > 0)

  const restart = await server.inject({
    method: 'POST',
    url: `/runtimes/${pid}/restart`
  })
  assert.strictEqual(restart.statusCode, 200)

  const { statusCode } = await server.inject({
    method: 'POST',
    url: `/runtimes/${pid}/stop`
  })
  assert.strictEqual(statusCode, 200, 'runtime has been properly stopped')

  const stop = await server.inject({
    method: 'POST',
    url: `/runtimes/${pid}/stop`
  })
  assert.strictEqual(stop.statusCode, 500, 'trying to run stop command to a closed runtime')

  const runtimes = await server.inject({
    url: '/runtimes'
  })
  assert.deepEqual(runtimes.json(), [], 'no runtime running')
})
