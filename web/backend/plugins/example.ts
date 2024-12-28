import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.log.debug({ pltConfig: fastify.platformatic.configManager.current }, 'pltConfig')
  fastify.decorate('example', 'foobar')
}
