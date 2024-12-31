import test from 'node:test'
import assert from 'node:assert'
import { getServer } from '../helper'

// TODO: add setup and test on a up & running wattpm instance
test('metrics plugin', async (t) => {
  const server = await getServer(t)

  assert.ok('_idleTimeout' in server.metricsInterval, 'interval for metrics are defined')
  assert.deepEqual(server.mappedMetrics, {}, 'mapped metrics are defined')
})
