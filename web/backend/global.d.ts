/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance } from 'fastify'
import { PlatformaticApp, PlatformaticServiceConfig } from '@platformatic/service'
import { MetricsResponse } from './plugins/metrics'

declare module 'fastify' {
  interface FastifyInstance {
    platformatic: PlatformaticApp<PlatformaticServiceConfig>
    metricsInterval: NodeJS.Timeout
    mappedMetrics: Record<number, MetricsResponse>
  }
}
