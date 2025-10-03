import websocket from '@fastify/websocket'
import type { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
  await fastify.register(websocket)
}
