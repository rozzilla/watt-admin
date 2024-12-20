/// <reference path="../global.d.ts" />
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
// TODO: create types for RuntimeApiClient and re-enable strict mode
import { RuntimeApiClient } from '@platformatic/control'

declare module 'fastify' {
  interface FastifyInstance {
    example: string
  }
}

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  const api = new RuntimeApiClient()
  fastify.get('/example', async (request, reply) => {
    return { hello: fastify.example }
  })

  fastify.get('/runtimes', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          includeAdmin: {
            type: 'boolean',
            default: false,
          },
        },
      },
    }
  }, async (request, reply) => {
    let runtimes = await api.getRuntimes()

    // @ts-ignore
    console.log(request.query.includeAdmin)

    // @ts-ignore
    if (!request.query.includeAdmin) {
      runtimes = runtimes.filter((runtime) => runtime.packageName !== 'watt-admin')
    }

    return runtimes
  })
}
