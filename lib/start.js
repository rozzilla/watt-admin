'use strict'

const { buildRuntime, loadConfig } = require('@platformatic/runtime')
const { join } = require('path')
const { parseArgs } = require('util')

async function start (selectedRuntime) {
  process.env.SELECTED_RUNTIME = selectedRuntime
  const { values: { port } } = parseArgs({ options: { port: { type: 'string' } } })
  process.env.PORT = port || 4042

  const configFile = join(__dirname, '..', 'watt.json')
  const { configManager, args } = await loadConfig({
  }, ['--production', '--config', configFile], { production: true, disableEnvLoad: true })
  configManager.args = args
  const server = await buildRuntime(configManager)
  await server.start()
}

module.exports.start = start
