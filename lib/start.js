'use strict'

import { create } from '@platformatic/runtime'
import { join } from 'path'
import { parseArgs, promisify } from 'util'
import { request } from 'undici'
import { exec } from 'child_process'
import closeWithGrace from 'close-with-grace'

const __dirname = import.meta.dirname

const execAsync = promisify(exec)

const msOneMinute = 1000 * 60
let recordTimeout

const recordMetrics = async (configHost, configPort) => {
  try {
    const { statusCode, body } = await request(`http://${configHost}:${configPort}/api/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'stop' })
    })
    if (statusCode === 200) {
      await body.dump()
      const bundlePath = join(__dirname, '..', 'web', 'frontend', 'dist', 'index.html')
      await execAsync(`${process.platform === 'win32' ? 'start' : 'open'} ${bundlePath}`)
    } else {
      console.error(`Failure triggering the stop command: ${await body.text()}`)
    }
  } catch (error) {
    console.error('Error on record metrics', { error, configHost, configPort })
    clearTimeout(recordTimeout)
  }
}

export async function start (selectedRuntime) {
  process.env.SELECTED_RUNTIME = selectedRuntime
  const { values: { port, record } } = parseArgs({
    options: {
      port: { type: 'string' },
      record: { type: 'boolean' },
    }
  })

  process.env.PORT = port || 4042

  const configFile = join(__dirname, '..', 'watt.json')
  const server = await create(configFile)
  await server.start()

  if (record) {
    const { current: { server: { hostname: configHost, port: configPort } } } = server.configManager
    closeWithGrace({ delay: msOneMinute }, async ({ signal }) => {
      if (signal === 'SIGINT') {
        clearTimeout(recordTimeout)
        await recordMetrics(configHost, configPort)
      }
    })

    const { statusCode, body } = await request(`http://${configHost}:${configPort}/api/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'start' })
    })
    if (statusCode === 200) {
      await body.dump()

      recordTimeout = setTimeout(async () => {
        await recordMetrics(configHost, configPort)
      }, msOneMinute * 10)
    } else {
      console.log(`Failure triggering the start command: ${await body.text()}`)
    }
  }
}
