import { FastifyInstance } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { RuntimeApiClient } from '@platformatic/control'
import { modeSchema, pidParamSchema, selectableRuntimeSchema } from '../schemas'
import { getPidToLoad, getSelectableRuntimes } from '../utils/runtimes'
import { writeFile, readFile } from 'fs/promises'
import { checkRecordState } from '../utils/states'
import { join } from 'path'

export default async function (fastify: FastifyInstance) {
  const typedFastify = fastify.withTypeProvider<JsonSchemaToTsProvider>()
  const api = new RuntimeApiClient()

  typedFastify.get('/runtimes', {
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
      response: { 200: { type: 'array', items: selectableRuntimeSchema } }
    }
  }, async (request) => getSelectableRuntimes(await api.getRuntimes(), request.query.includeAdmin))

  typedFastify.get('/runtimes/:pid/health', {
    schema: {
      params: pidParamSchema,
      response: {
        200: {
          type: 'object',
          additionalProperties: false,
          properties: {
            status: {
              type: 'string',
              enum: ['OK', 'KO'],
              description: "Status can only be 'OK' or 'KO'"
            }
          },
          required: ['status']
        }
      }
    }
  }, async ({ params: { pid } }) => {
    const ok = { status: 'OK' as const }
    const ko = { status: 'KO' as const }

    try {
      const result = await api.getMatchingRuntime({ pid: pid.toString() })
      return (result.pid === pid) ? ok : ko
    } catch {
      return ko
    }
  })

  typedFastify.get('/runtimes/:pid/services', {
    schema: {
      params: pidParamSchema,
      response: {
        200: {
          type: 'object',
          additionalProperties: false,
          required: ['entrypoint', 'production', 'services'],
          properties: {
            entrypoint: {
              type: 'string'
            },
            production: {
              type: 'boolean'
            },
            services: {
              type: 'array',
              items: {
                anyOf: [
                  {
                    type: 'object',
                    required: ['id', 'type', 'status', 'version', 'localUrl', 'entrypoint', 'dependencies'],
                    properties: {
                      id: {
                        type: 'string'
                      },
                      type: {
                        type: 'string'
                      },
                      status: {
                        type: 'string'
                      },
                      version: {
                        type: 'string'
                      },
                      localUrl: {
                        type: 'string'
                      },
                      entrypoint: {
                        type: 'boolean'
                      },
                      workers: {
                        type: 'number'
                      },
                      url: {
                        type: 'string'
                      },
                      dependencies: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['id', 'url', 'local'],
                          properties: {
                            id: {
                              type: 'string'
                            },
                            url: {
                              type: 'string'
                            },
                            local: {
                              type: 'boolean'
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    type: 'object',
                    required: ['id', 'status'],
                    properties: {
                      id: {
                        type: 'string'
                      },
                      status: {
                        type: 'string'
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }
  }, async (request) => api.getRuntimeServices(request.params.pid))

  typedFastify.get('/runtimes/:pid/openapi/:serviceId', {
    schema: {
      params: { type: 'object', properties: { pid: { type: 'number' }, serviceId: { type: 'string' } }, required: ['pid', 'serviceId'] }
    }
  }, async ({ params: { pid, serviceId } }) => {
    return api.getRuntimeOpenapi(pid, serviceId)
  })

  typedFastify.post('/runtimes/:pid/restart', {
    schema: { params: pidParamSchema, body: { type: 'object' } }
  }, async (request) => {
    try {
      await api.restartRuntime(request.params.pid)
    } catch (err) {
      fastify.log.warn({ err }, 'Issue restarting the runtime')
    }
  })

  typedFastify.post('/record', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: false,
        properties: { mode: modeSchema },
        required: ['mode']
      }
    }
  }, async ({ body: { mode } }) => {
    const from = fastify.loaded.mode
    const to = mode
    if (!checkRecordState({ from, to })) {
      return fastify.log.error({ from, to }, 'Invalid record state machine transition')
    }

    fastify.loaded.mode = mode
    if (mode === 'start') {
      fastify.loaded.metrics = {}
    }

    if (mode === 'stop') {
      const runtimes = getSelectableRuntimes(await api.getRuntimes(), false)
      const services = await api.getRuntimeServices(getPidToLoad(runtimes))
      const loadedJson = JSON.stringify({ runtimes, services, metrics: fastify.loaded.metrics[getPidToLoad(runtimes)] })
      const scriptToAppend = `  <script>window.LOADED_JSON=${loadedJson}</script>\n</body>`

      const sourcePath = join(__dirname, '..', '..', '..', 'frontend', 'index.html')
      await writeFile(sourcePath, (await readFile(sourcePath, 'utf8')).replace('</body>', scriptToAppend), 'utf8')

      const bundlePath = join(__dirname, '..', '..', '..', 'frontend', 'dist', 'index.html')
      await writeFile(bundlePath, (await readFile(bundlePath, 'utf8')).replace('</body>', scriptToAppend), 'utf8')
    }
  })
}
