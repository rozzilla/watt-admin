import test from 'node:test'
import assert from 'node:assert'
import { getServer } from '../helper'

test('proxy', async (t) => {
  const server = await getServer(t)
  const res = await server.inject({ url: '/runtimes?includeAdmin=true' })
  assert.strictEqual(res.statusCode, 200, 'runtimes endpoint')
  const [runtime] = res.json()
  const runtimePid = runtime.pid
  const health = await server.inject({ url: `/proxy/${runtimePid}/services/backend/runtimes/${runtimePid}/health` })
  assert.strictEqual(health.statusCode, 200)
  assert.strictEqual(health.json().status, 'OK', 'backend service is in healthy state')

  const frontend = await server.inject({ url: `/proxy/${runtimePid}/services/frontend/#/` })
  assert.strictEqual(frontend.statusCode, 200, 'proxy endpoint')
  assert.ok(frontend.payload.includes('<!doctype html>'))
  assert.ok(frontend.payload.includes('<html lang="en">'))
  assert.ok(frontend.payload.includes('<title>Watt admin</title>'))
  assert.ok(frontend.payload.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0" />'))
  assert.ok(frontend.payload.includes('<div id="root"></div>'))

  const backend = await server.inject({ url: `/proxy/${runtimePid}/services/backend/documentation/json` })
  assert.strictEqual(backend.statusCode, 200)
  assert.deepEqual(backend.json().info, {
    title: 'Platformatic',
    description: 'This is a service built on top of Platformatic',
    version: '1.0.0'
  })

  const composer = await server.inject({ url: `/proxy/${runtimePid}/services/composer/api/documentation/json` })
  assert.strictEqual(composer.statusCode, 200)
  assert.strictEqual(composer.json().openapi, '3.0.3')
})
