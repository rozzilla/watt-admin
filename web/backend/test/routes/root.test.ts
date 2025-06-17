import test from 'node:test'
import assert from 'node:assert'
import { getServer } from '../helper'

test('runtime is running', async (t) => {
  const server = await getServer(t)
  const res = await server.inject({
    url: '/runtimes?includeAdmin=true'
  })
  assert.strictEqual(res.statusCode, 200, 'runtimes endpoint')
  const [runtime] = res.json()
  const runtimePid = runtime.pid
  assert.strictEqual(runtime.packageName, '@platformatic/watt-admin')
  assert.strictEqual(typeof runtimePid, 'number')

  const health = await server.inject({
    url: `/runtimes/${runtimePid}/health`
  })
  assert.strictEqual(health.statusCode, 200)
  assert.deepEqual(health.json(), { status: 'OK' })

  const services = await server.inject({
    url: `/runtimes/${runtimePid}/services`
  })
  assert.strictEqual(services.statusCode, 200, 'services endpoint')
  const servicesJson = services.json()
  assert.strictEqual(servicesJson.production, true)
  assert.strictEqual(servicesJson.entrypoint, 'composer')
  assert.strictEqual(typeof servicesJson.services[0].localUrl, 'string')
  assert.strictEqual(typeof servicesJson.services[0].entrypoint, 'boolean')

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
  assert.deepEqual(json.paths['/runtimes']['get']['parameters'], [
    {
      schema: {
        type: 'boolean',
        default: false,
      },
      in: 'query',
      name: 'includeAdmin',
      required: false,
    },
  ])

  const serviceInvalidOpenapi = await server.inject({
    url: `/runtimes/${runtimePid}/openapi/fantozzi`
  })
  assert.strictEqual(serviceInvalidOpenapi.statusCode, 500, 'service OpenAPI endpoint')
  assert.strictEqual(typeof serviceInvalidOpenapi.json().code, 'string')
})
