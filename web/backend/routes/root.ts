/// <reference path="../global.d.ts" />
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
// TODO: create types for RuntimeApiClient
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

  fastify.get('/runtimes', async (request, reply) => {
    const runtimes = await api.getRuntimes()
    return runtimes
  })
}
