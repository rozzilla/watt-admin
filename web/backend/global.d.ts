// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FastifyInstance } from 'fastify'
import type { PlatformaticApp, PlatformaticServiceConfig } from '@platformatic/service'
import type { MappedMetrics } from './utils/metrics-helpers'
import type { Mode } from './schemas'

declare module 'fastify' {
  interface FastifyInstance {
    platformatic: PlatformaticApp<PlatformaticServiceConfig>
    metricsInterval: NodeJS.Timeout
    mappedMetrics: MappedMetrics
    storageMetrics: { path: string, mode: Mode }
  }
}
