'use strict'

import type { Signals } from 'close-with-grace'

const { buildRuntime, loadConfig } = require('@platformatic/runtime')
const { join } = require('path')
const { parseArgs } = require('util')
const { request } = require('undici')
const { exec } = require('child_process')
const { promisify } = require('util')
const closeWithGrace = require('close-with-grace')
const execAsync = promisify(exec)

const msOneMinute = 1000 * 60
let recordTimeout: NodeJS.Timeout

const recordMetrics = async (configHost: string, configPort: number) => {
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

async function start (selectedRuntime: string) {
  process.env.SELECTED_RUNTIME = selectedRuntime
  const { values: { port, record } } = parseArgs({
    options: {
      port: { type: 'string' },
      record: { type: 'boolean' },
    }
  })

  process.env.PORT = port || 4042

  const configFile = join(__dirname, '..', 'watt.json')
  const { configManager, args } = await loadConfig({
  }, ['--production', '--config', configFile], { production: true, disableEnvLoad: true })
  configManager.args = args

  const server = await buildRuntime(configManager)
  await server.start()

  if (record) {
    const { current: { server: { hostname: configHost, port: configPort } } } = configManager
    closeWithGrace({ delay: msOneMinute }, async ({ signal }: { signal: Signals }) => {
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

module.exports.start = start
