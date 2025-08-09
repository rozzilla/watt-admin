import { FastifyInstance } from 'fastify'
import { getMetrics } from '../utils/metrics'
import { join } from 'path'

export default async function (fastify: FastifyInstance) {
  fastify.decorate('mappedMetrics', {})

  fastify.decorate('storageMetrics', {
    mode: 'live',
    // FIXME: get the dynamic path directly from the user through the frontend
    path: join(__dirname, '..', '..', '..', 'storageMetrics.json')
  })

  fastify.decorate('metricsInterval', setInterval(() => getMetrics(fastify), 1000))

  fastify.addHook('onClose', async () => {
    // If the following log is not called, please run the project directly through the `wattpm` binary (ref. https://github.com/platformatic/platformatic/issues/3751)
    fastify.log.info('Closing the backend...')
    clearInterval(fastify.metricsInterval)
  })
}
