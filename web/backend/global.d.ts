// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FastifyInstance } from 'fastify'
import type { PlatformaticApp, PlatformaticServiceConfig } from '@platformatic/service'
import type { Mode } from './schemas/index.ts'
import type { MappedMetrics } from './utils/metrics-helpers.ts'

declare module 'fastify' {
  interface FastifyInstance {
    platformatic: PlatformaticApp<PlatformaticServiceConfig>
    metricsInterval: NodeJS.Timeout
    loaded: { mode?: Mode, metrics: MappedMetrics }
  }

  interface FastifySchema {
    hide?: boolean
  }
}
