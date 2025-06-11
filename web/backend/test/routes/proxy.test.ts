import test from 'node:test'
import assert from 'node:assert'
import { getServer, startWatt } from '../helper'

test('proxy', async (t) => {
  await startWatt(t)
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

  const jsonPost = await server.inject({
    url: `/proxy/${runtimePid}/services/backend/runtimes/0/restart`,
    method: 'POST',
    body: {}
  })
  assert.strictEqual(jsonPost.statusCode, 200, 'normal json body')

  const jsonPayload = JSON.stringify({})
  const restartPost = await server.inject({
    url: `/proxy/${runtimePid}/services/backend/runtimes/0/restart`,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(jsonPayload)
    },
    payload: Buffer.from(jsonPayload, 'utf8')
  })
  assert.strictEqual(restartPost.statusCode, 200, 'buffer json body')
})
