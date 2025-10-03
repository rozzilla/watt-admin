import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { RuntimeApiClient } from '@platformatic/control'
import type { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
  const typedFastify = fastify.withTypeProvider<JsonSchemaToTsProvider>()
  const api = new RuntimeApiClient()

  typedFastify.removeContentTypeParser(['application/json', 'text/*'])
  typedFastify.addContentTypeParser('*', { parseAs: 'buffer' }, async (_request: unknown, body: unknown) => body)

  typedFastify.all('/proxy/:pid/services/:serviceId/*', {
    schema: {
      hide: true, // needed since the client generation fails to properly handle the '*' wildcard
    }
  }, async (request, reply) => {
    const { pid, serviceId, '*': requestUrl } = request.params as { pid: number, serviceId: string, '*': string } // cast needed because we can't define a valid json schema with the '*' wildcard

    delete request.headers.connection
    delete request.headers['content-length']
    delete request.headers['content-encoding']
    delete request.headers['transfer-encoding']

    const injectParams = {
      method: request.method,
      url: '/' + requestUrl,
      headers: request.headers,
      query: request.query,
      body: request.body
    } as Parameters<typeof api.injectRuntime>[2]

    fastify.log.info({ pid, serviceId, injectParams }, 'runtime request proxy')

    const res = await api.injectRuntime(pid, serviceId, injectParams)

    delete res.headers['content-length']
    delete res.headers['transfer-encoding']

    return reply.code(res.statusCode).headers(res.headers).send(res.body)
  })
}
