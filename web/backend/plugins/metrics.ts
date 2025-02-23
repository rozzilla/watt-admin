import { RuntimeApiClient } from '@platformatic/control'
import { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
  fastify.decorate('mappedMetrics', {})

  // This is to avoid the mapped metrics array from growing indefinitely (and therefore a memory leak)
  const MAX_STORED_METRICS = 1000
  const api = new RuntimeApiClient()

  const metricsInterval = setInterval(async () => {
    const runtimes = await api.getRuntimes()
    for (const { pid } of runtimes) {
      try {
        const runtimeMetrics = await api.getRuntimeMetrics(pid, { format: 'json' })

        for (const { name, type, aggregator, values } of runtimeMetrics) {
          if (!fastify.mappedMetrics[pid]) {
            fastify.mappedMetrics[pid] = []
          }

          const serviceId = values[0]?.labels?.serviceId
          if (serviceId) {
            if (fastify.mappedMetrics[pid].length > MAX_STORED_METRICS) {
              fastify.mappedMetrics[pid].pop()
            }
            fastify.mappedMetrics[pid].push({ name, time: new Date(), type, aggregator, values, serviceId, pid })
          }
        }
      } catch (error) {
        fastify.log.warn(error, 'Unable to get runtime metrics. Retry will start soon...')
      }
    }
  }, 1000)

  fastify.decorate('metricsInterval', metricsInterval)

  fastify.addHook('onClose', async () => {
    // If the following log is not called, please run the project directly through the `wattpm` binary (ref. https://github.com/platformatic/platformatic/issues/3751)
    fastify.log.info('Closing the backend...')
    clearInterval(fastify.metricsInterval)
  })
}
