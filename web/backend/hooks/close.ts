import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.addHook('onClose', async () => {
    // FIXME: this is an issue on wattpm, since graceful shutdown time of 10s isn't considered (https://docs.platformatic.dev/docs/runtime/configuration#gracefulshutdown)
    fastify.log.info('Closing the backend...')
    clearInterval(fastify.metricsInterval)
  })
}
