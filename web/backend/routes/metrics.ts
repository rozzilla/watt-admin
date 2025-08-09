import { writeFile, readFile } from 'fs/promises'
import { FastifyInstance } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { metricResponseSchema, MetricsResponse, modeSchema, pidParamSchema } from '../schemas'

export default async function (fastify: FastifyInstance) {
  const typedFastify = fastify.withTypeProvider<JsonSchemaToTsProvider>()
  const emptyMetrics: MetricsResponse = { dataCpu: [], dataLatency: [], dataMem: [], dataReq: [], dataKafka: [], dataUndici: [], dataWebsocket: [] }

  typedFastify.post('/metrics/mode', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: false,
        properties: { mode: modeSchema },
        required: ['mode']
      }
    }
  }, async ({ body: { mode } }) => {
    fastify.storageMetrics.mode = mode

    if (fastify.storageMetrics.mode === 'load') {
      clearInterval(fastify.metricsInterval)
      const mappedMetrics = await readFile(fastify.storageMetrics.path)
      fastify.mappedMetrics = JSON.parse(mappedMetrics.toString())
    }

    if (fastify.storageMetrics.mode === 'record') {
      await writeFile(fastify.storageMetrics.path, JSON.stringify(fastify.mappedMetrics))
    }
  })

  typedFastify.get('/runtimes/:pid/metrics', {
    schema: { params: pidParamSchema, response: { 200: metricResponseSchema } },
  }, async ({ params: { pid } }) => {
    return fastify.mappedMetrics[pid]?.aggregated || emptyMetrics
  })

  typedFastify.get('/runtimes/:pid/metrics/:serviceId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          pid: { type: 'number' },
          serviceId: { type: 'string' }
        },
        required: ['pid', 'serviceId']
      },
      response: { 200: metricResponseSchema }
    }
  }, async ({ params: { pid, serviceId } }) => {
    return fastify.mappedMetrics[pid]?.services[serviceId]?.all || emptyMetrics
  })

  typedFastify.get('/runtimes/:pid/metrics/:serviceId/:workerId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          pid: { type: 'number' },
          serviceId: { type: 'string' },
          workerId: { type: 'number' },
        },
        required: ['pid', 'serviceId', 'workerId']
      },
      response: { 200: metricResponseSchema }
    }
  }, async ({ params: { pid, serviceId, workerId } }) => {
    return fastify.mappedMetrics[pid]?.services[serviceId]?.[workerId] || emptyMetrics
  })
}
