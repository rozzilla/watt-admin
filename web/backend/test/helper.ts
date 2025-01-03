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
  const fixturesPath = join(__dirname, '..', '..', '..', '..', 'node_modules', '.bin', 'wattpm')
  const process = spawn(fixturesPath, ['start'])
  t.after(() => process.kill('SIGKILL'))

  return new Promise((resolve, reject) => {
    const onData = (data: Buffer) => {
      const input = data.toString()
      if (input.includes('Platformatic is now listening at ')) {
        process.stdout.removeListener('data', onData)
        process.removeListener('error', onError)
        resolve(input)
      }
    }

    const onError = (error: Error) => {
      process.stdout.removeListener('data', onData)
      process.removeListener('error', onError)
      reject(error)
    }

    process.stdout.on('data', onData)
    process.on('error', onError)
  })
}
