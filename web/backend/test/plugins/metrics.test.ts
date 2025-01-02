import test from 'node:test'
import assert from 'node:assert'
import { getServer, startWatt } from '../helper'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('metrics without runtime', async (t) => {
  const server = await getServer(t)
  assert.ok('_idleTimeout' in server.metricsInterval, 'interval for metrics are defined')
  const metricsKeys = Object.keys(server.mappedMetrics)
  assert.ok(metricsKeys.length === 0, 'mapped metrics are defined, and are empty')
})

test('metrics with runtime', async (t) => {
  await startWatt(t)
  const server = await getServer(t)

  await wait(1200)
  const metricsKeys = Object.keys(server.mappedMetrics)
  const [pid] = metricsKeys
  assert.ok(metricsKeys.length > 0, 'mapped metrics are defined, and contain values')
  assert.strictEqual(server.mappedMetrics[pid][0].pid, parseInt(pid))
})
