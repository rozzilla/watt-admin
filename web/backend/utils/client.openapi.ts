import fs from 'fs/promises'
import { buildServer } from '@platformatic/service'

async function clientOpenapi () {
  const server = await buildServer({
    $schema: 'https://schemas.platformatic.dev/@platformatic/service/2.57.0.json',
    service: {
      openapi: true
    },
    watch: false,
    plugins: {
      paths: [
        {
          path: './plugins',
          encapsulate: false
        },
        './routes'
      ],
      typescript: true
    }
  })
  await server.ready()
  await fs.writeFile('openapi.json', JSON.stringify(server.swagger()))
  await server.close()
}

clientOpenapi()
