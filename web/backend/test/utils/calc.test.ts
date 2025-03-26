import test from 'node:test'
import assert from 'node:assert'
import { calcBytesToMB } from '../../utils/calc'
import proxyquire from 'proxyquire'
import { FastifyInstance } from 'fastify'

const calcPath = '../../utils/calc'

class RuntimeApiClient {
  async getRuntimes () {
    return [{ pid: 1234 }]
  }

  async getRuntimeServices () {
    return {
      services: [
        { id: 'service-1' },
        { id: 'service-2' }
      ]
    }
  }

  async getRuntimeMetrics () {
    return [
      {
        name: 'process_resident_memory_bytes',
        values: [{ value: 1048576, labels: {} }]
      },
      {
        name: 'nodejs_heap_size_total_bytes',
        values: [{ value: 2097152, labels: { serviceId: 'service-1' } }]
      },
      {
        name: 'nodejs_heap_size_used_bytes',
        values: [{ value: 1048576, labels: { serviceId: 'service-1' } }]
      },
      {
        name: 'nodejs_heap_space_size_used_bytes',
        values: [
          { value: 524288, labels: { serviceId: 'service-1', space: 'new' } },
          { value: 1048576, labels: { serviceId: 'service-1', space: 'old' } }
        ]
      },
      {
        name: 'thread_cpu_percent_usage',
        values: [{ value: 50, labels: { serviceId: 'service-1' } }]
      },
      {
        name: 'nodejs_eventloop_utilization',
        values: [{ value: 0.5, labels: { serviceId: 'service-1' } }]
      },
      {
        name: 'http_request_all_summary_seconds',
        values: [
          { value: 0.09, labels: { serviceId: 'service-1', quantile: 0.9 } },
          { value: 0.095, labels: { serviceId: 'service-1', quantile: 0.95 } },
          { value: 0.099, labels: { serviceId: 'service-1', quantile: 0.99 } }
        ]
      }
    ]
  }
}

const getMockFastify = () => ({ mappedMetrics: {} }) as FastifyInstance

test('calculateMetrics collects and aggregates metrics correctly', async () => {
  const { calculateMetrics } = proxyquire(calcPath, {
    '@platformatic/control': { RuntimeApiClient },
  })

  const fastify = getMockFastify()
  await calculateMetrics(fastify)

  assert.ok(fastify.mappedMetrics[1234])

  assert.ok(fastify.mappedMetrics[1234].services['service-1'])
  assert.ok(fastify.mappedMetrics[1234].services['service-2'])

  const service1Mem = fastify.mappedMetrics[1234].services['service-1'].dataMem[0]
  assert.strictEqual(service1Mem.rss, 1.00) // 1MB
  assert.strictEqual(service1Mem.totalHeap, 2.00) // 2MB
  assert.strictEqual(service1Mem.usedHeap, 1.00) // 1MB
  assert.strictEqual(service1Mem.newSpace, 0.50) // 0.5MB
  assert.strictEqual(service1Mem.oldSpace, 1.00) // 1MB

  const service1Cpu = fastify.mappedMetrics[1234].services['service-1'].dataCpu[0]
  assert.strictEqual(service1Cpu.cpu, 50) // 50%
  assert.strictEqual(service1Cpu.eventLoop, 50) // 0.5 * 100

  const service1Latency = fastify.mappedMetrics[1234].services['service-1'].dataLatency[0]
  assert.strictEqual(service1Latency.p90, 90) // 0.09 * 1000
  assert.strictEqual(service1Latency.p95, 95) // 0.095 * 1000
  assert.strictEqual(service1Latency.p99, 99) // 0.099 * 1000

  const service1Req = fastify.mappedMetrics[1234].services['service-1'].dataReq[0]
  assert.ok(service1Req.count >= 0)

  const aggregatedMem = fastify.mappedMetrics[1234].aggregated.dataMem[0]
  assert.strictEqual(aggregatedMem.rss, 1.00)
  assert.strictEqual(aggregatedMem.totalHeap, 2.00)
  assert.strictEqual(aggregatedMem.usedHeap, 1.00)
  assert.strictEqual(aggregatedMem.newSpace, 0.50)
  assert.strictEqual(aggregatedMem.oldSpace, 1.00)

  assert.ok(fastify.mappedMetrics[1234].services['service-1'].dataMem.length <= 20)
  assert.ok(fastify.mappedMetrics[1234].services['service-1'].dataCpu.length <= 20)
  assert.ok(fastify.mappedMetrics[1234].services['service-1'].dataLatency.length <= 20)
  assert.ok(fastify.mappedMetrics[1234].aggregated.dataMem.length <= 20)
  assert.ok(fastify.mappedMetrics[1234].aggregated.dataCpu.length <= 20)
  assert.ok(fastify.mappedMetrics[1234].aggregated.dataLatency.length <= 20)
  assert.ok(fastify.mappedMetrics[1234].aggregated.dataReq.length <= 20)
})

test('calculateMetrics handles empty metrics correctly', async () => {
  class EmptyMetricsMockClient extends RuntimeApiClient {
    async getRuntimeMetrics () {
      return []
    }
  }

  const { calculateMetrics: calculateEmptyMetrics } = proxyquire(calcPath, {
    '@platformatic/control': {
      RuntimeApiClient: EmptyMetricsMockClient
    }
  })

  const fastify = getMockFastify()
  await calculateEmptyMetrics(fastify)

  assert.ok(fastify.mappedMetrics[1234])
  const service1Metrics = fastify.mappedMetrics[1234].services['service-1']

  assert.strictEqual(service1Metrics.dataMem[0].rss, 0)
  assert.strictEqual(service1Metrics.dataMem[0].totalHeap, 0)
  assert.strictEqual(service1Metrics.dataCpu[0].cpu, 0)
  assert.strictEqual(service1Metrics.dataLatency[0].p90, 0)
  assert.strictEqual(service1Metrics.dataReq[0].count, 0)
})

test('calculateMetrics handles missing services', async () => {
  class NoServicesMockClient extends RuntimeApiClient {
    async getRuntimeServices () {
      return { services: [] }
    }
  }

  const { calculateMetrics: calculateNoServices } = proxyquire(calcPath, {
    '@platformatic/control': {
      RuntimeApiClient: NoServicesMockClient
    }
  })

  const fastify = getMockFastify()
  await calculateNoServices(fastify)

  assert.ok(fastify.mappedMetrics[1234])
  assert.deepStrictEqual(fastify.mappedMetrics[1234].services, {})
  assert.ok(fastify.mappedMetrics[1234].aggregated.dataMem.length === 1)
  assert.ok(fastify.mappedMetrics[1234].aggregated.dataCpu.length === 1)
  assert.ok(fastify.mappedMetrics[1234].aggregated.dataLatency.length === 1)
  assert.ok(fastify.mappedMetrics[1234].aggregated.dataReq.length === 1)
})

test('calculateMetrics respects MAX_STORED_METRICS limit', async () => {
  const { calculateMetrics: calculateLimitedMetrics } = proxyquire(calcPath, {
    '@platformatic/control': { RuntimeApiClient }
  })

  const fastify = getMockFastify()
  for (let i = 0; i < 25; i++) {
    await calculateLimitedMetrics(fastify)
  }

  Object.values(fastify.mappedMetrics[1234].services).forEach(service => {
    assert.strictEqual(service.dataMem.length, 20, 'Service memory metrics should be limited to 20 entries')
    assert.strictEqual(service.dataCpu.length, 20, 'Service CPU metrics should be limited to 20 entries')
    assert.strictEqual(service.dataLatency.length, 20, 'Service latency metrics should be limited to 20 entries')
    assert.strictEqual(service.dataReq.length, 20, 'Service req metrics should be limited to 20 entries')
  })

  assert.strictEqual(fastify.mappedMetrics[1234].aggregated.dataMem.length, 20, 'Aggregated memory metrics should be limited to 20 entries')
  assert.strictEqual(fastify.mappedMetrics[1234].aggregated.dataCpu.length, 20, 'Aggregated CPU metrics should be limited to 20 entries')
  assert.strictEqual(fastify.mappedMetrics[1234].aggregated.dataLatency.length, 20, 'Aggregated latency metrics should be limited to 20 entries')
  assert.strictEqual(fastify.mappedMetrics[1234].aggregated.dataReq.length, 20, 'Aggregated req metrics should be limited to 20 entries')
})

test('calcBytesToMB converts 1048576 bytes to 1.00MB', () => {
  const result = calcBytesToMB(1048576)
  assert.strictEqual(result, 1.00)
})

test('calcBytesToMB converts 2621440 bytes to 2.50MB', () => {
  const result = calcBytesToMB(2621440)
  assert.strictEqual(result, 2.50)
})

test('calcBytesToMB converts 0 bytes to 0.00MB', () => {
  const result = calcBytesToMB(0)
  assert.strictEqual(result, 0.00)
})

test('calcBytesToMB handles small numbers correctly', () => {
  const result = calcBytesToMB(10000)
  assert.strictEqual(result, 0.01)
})
