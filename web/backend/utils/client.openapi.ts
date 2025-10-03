import fs from 'fs/promises'
import { create } from '@platformatic/service'
import { join, resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'

const __dirname = import.meta.dirname

async function clientOpenapi () {
  const basePath = resolve(__dirname, join('..', 'platformatic.json'))
  const server = (await create(basePath, {
    service: { openapi: true },
    watch: false,
    plugins: {
      paths: [
        {
          path: resolve(__dirname, join('..', 'plugins')),
          encapsulate: false
        },
        resolve(__dirname, join('..', 'routes'))
      ]
    }
  })) as unknown as FastifyInstance & { start: () => unknown; url: string } // FIXME: the new type returned from `create` is wrong, and it should be updated directly on the original platformatic module

  await server.start()
  const response = await fetch(`${server.url}/documentation/json`)
  await fs.writeFile('openapi.json', await response.text())
  await server.close()
}

clientOpenapi()
