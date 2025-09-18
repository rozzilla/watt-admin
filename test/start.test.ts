'use strict'

import type { CloseWithGraceAsyncCallback } from 'close-with-grace'

const { describe, it, beforeEach, mock } = require('node:test')
const assert = require('node:assert')
const proxyquire = require('proxyquire')

describe('start', () => {
  // Mock server object
  const mockServer = {
    started: false,
    start: async function () {
      this.started = true
      return this
    }
  }

  // Mock modules
  const mockBuildRuntime = async () => mockServer
  const mockLoadConfig = async () => ({
    configManager: {
      config: { server: {} },
      current: { server: { hostname: 'localhost', port: 3000 } }
    }
  })
  const mockReadFile = async () => JSON.stringify({ server: {} })

  // Setup module with mocks
  const mockedStart = (overrides = {}) => {
    return proxyquire.noCallThru().load('../lib/start.js', {
      '@platformatic/runtime': {
        buildRuntime: mockBuildRuntime,
        loadConfig: mockLoadConfig
      },
      'fs/promises': {
        readFile: mockReadFile
      },
      ...overrides
    })
  }

  beforeEach(() => {
    // Reset mockServer state
    mockServer.started = false

    // Delete environment variable if it exists
    if ('SELECTED_RUNTIME' in process.env) {
      delete process.env.SELECTED_RUNTIME
    }
    mock.reset()
  })

  it('should start the server with the selected runtime', async () => {
    // Get mocked start module
    const { start } = mockedStart()

    // Set a test PID
    const testPid = '12345'

    // Call the start function
    await start(testPid)

    // Check if environment variable was set
    assert.strictEqual(process.env.SELECTED_RUNTIME, testPid)

    // Check if server was started
    assert.strictEqual(mockServer.started, true)
  })

  it('should start recording and save metrics on exit', async () => {
    const requestMock = mock.fn(async (_: unknown, options: { body: string }) => {
      const body = JSON.parse(options.body)
      if (body.mode === 'start') {
        return { statusCode: 200, body: { dump: async () => {} } }
      }
      if (body.mode === 'stop') {
        return { statusCode: 200, body: { dump: async () => undefined } }
      }
      return { statusCode: 500, body: { text: async () => 'error' } }
    })

    // eslint-disable-next-line no-undef-init
    let closeHandler: CloseWithGraceAsyncCallback | undefined = undefined
    const closeWithGraceMock = mock.fn((_: unknown, handler: CloseWithGraceAsyncCallback) => {
      closeHandler = handler
    })
    const execAsyncMock = mock.fn(async () => {})

    const { start } = mockedStart({
      undici: {
        request: requestMock
      },
      'close-with-grace': closeWithGraceMock,
      util: {
        ...require('util'),
        parseArgs: () => ({ values: { record: true } }),
        promisify: (fn: () => unknown) => {
          if (fn.name === 'exec' || fn === require('child_process').exec) {
            return execAsyncMock
          }
          return fn
        }
      }
    })

    await start('test-runtime-record')

    // 1. Check if the server was started
    assert.strictEqual(mockServer.started, true, 'Server should be started')

    // 2. Check if the 'start' record request was made
    assert.strictEqual(requestMock.mock.calls.length, 1, 'Should have made one request to start recording')
    const [startUrl, startOptions] = requestMock.mock.calls[0].arguments
    assert.strictEqual(startUrl, 'http://localhost:3000/api/record')
    assert.deepStrictEqual(JSON.parse(startOptions.body), { mode: 'start' })

    // 3. Check if closeWithGrace was configured
    assert.strictEqual(closeWithGraceMock.mock.calls.length, 1, 'closeWithGrace should be called')
    assert.ok(typeof closeHandler === 'function', 'closeWithGrace handler should be a function')

    // 4. Simulate SIGINT to trigger the exit handler
    // @ts-expect-error
    await closeHandler({ signal: 'SIGINT' })

    // 5. Check if the 'stop' record request was made
    assert.strictEqual(requestMock.mock.calls.length, 2, 'Should have made a second request to stop recording')
    const [stopUrl, stopOptions] = requestMock.mock.calls[1].arguments
    assert.strictEqual(stopUrl, 'http://localhost:3000/api/record')
    assert.deepStrictEqual(JSON.parse(stopOptions.body), { mode: 'stop' })

    // 6. Check if execAsync was called with 'open' and 'index.html'
    assert.strictEqual(execAsyncMock.mock.calls.length, 1, 'execAsync should be called once')
    const [execCommand] = execAsyncMock.mock.calls[0].arguments
    assert.ok(execCommand.includes('open'), 'execAsync command should contain "open"')
    assert.ok(execCommand.includes('index.html'), 'execAsync command should contain "index.html"')
  })
})
