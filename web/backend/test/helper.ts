import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { buildServer } from '@platformatic/service'
import { test } from 'node:test'
import { spawn } from 'node:child_process'

type testfn = Parameters<typeof test>[0]
type TestContext = Parameters<Exclude<testfn, undefined>>[0]

export async function getServer (t: TestContext) {
  // We go up two folder because this files executes in the dist folder
  const config = JSON.parse(await readFile(join(__dirname, '..', '..', 'platformatic.json'), 'utf8'))
  // Add your config customizations here. For example you want to set
  // all things that are set in the config file to read from an env variable
  config.server ||= {}
  config.server.logger ||= {}
  config.server.logger.level = 'warn'
  config.watch = false

  // Add your config customizations here
  const server = await buildServer(config)
  t.after(() => server.close())

  return server
}

export async function startWatt (t: TestContext): Promise<string> {
  const fixturesPath = join(__dirname, '..', '..', 'fixtures', 'watt', 'node_modules', '.bin', 'wattpm')

  return new Promise((resolve, reject) => {
    const process = spawn(fixturesPath, ['start'])

    process.stdout.on('data', data => {
      const result = data.toString().split('Platformatic is now listening at ')
      if (result.length > 1) {
        const wattUrl = result[1].slice(0, -3)
        resolve(wattUrl)
      }
    })

    process.on('error', error => reject(error))

    t.after(() => process.kill('SIGKILL'))
  })
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
