import fs from 'fs/promises'
import { create } from '@platformatic/service'
import { join, resolve } from 'node:path'

const __dirname = import.meta.dirname

async function clientOpenapi () {
  const basePath = resolve(__dirname, join('..', 'platformatic.json'))
  const server = await create(basePath, {
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
  })

  await server.start({})
  const response = await fetch(`${server.url}/documentation/json`)
  await fs.writeFile('openapi.json', await response.text())
  await server.close()
}

clientOpenapi()
