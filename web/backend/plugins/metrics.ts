import { RuntimeApiClient } from '@platformatic/control'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // FIXME: store the `mappedMetrics` into a DB, where the pid is the table name, and `pid`, `serviceId`, name (like `process_cpu_user_seconds_total`), etc. are rows values that can be easily retrieve through an SQL query. the current approach isn't scalable and it leads to a memory leak.
  fastify.decorate('mappedMetrics', {})

  try {
    const api = new RuntimeApiClient()
    const runtimes = await api.getRuntimes()

    const metricsInterval = setInterval(async () => {
      for (const { pid } of runtimes) {
        // TODO: add more strict types into `@platformatic/control` to avoid casting to `any`
        const runtimeMetrics: any = await api.getRuntimeMetrics(pid, { format: 'json' })

        for (const { name, type, aggregator, values } of runtimeMetrics) {
          if (!fastify.mappedMetrics[pid]) {
            fastify.mappedMetrics[pid] = []
          }

          const serviceId = values[0]?.labels?.serviceId
          if (serviceId) {
            fastify.mappedMetrics[pid].push({ name, time: new Date(), type, aggregator, values, serviceId, pid })
          }
        }
      }
    }, 1000)

    fastify.decorate('metricsInterval', metricsInterval)
  } catch (error) {
    fastify.log.error({ error }, 'Fatal error on metrics plugin')
  }
}
