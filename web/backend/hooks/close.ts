import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.addHook('onClose', async () => {
    // FIXME: this is an issue on wattpm, since graceful shutdown time of 10s isn't considered (https://github.com/platformatic/platformatic/issues/3751)
    fastify.log.info('Closing the backend...')
    clearInterval(fastify.metricsInterval)
  })
}
