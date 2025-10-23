import { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert'

describe('CLI Integration', () => {
  const mockRuntimes = [
    {
      packageName: 'app-1',
      pid: 1111,
      cwd: '/test/app1',
      startTime: new Date().getTime(),
      argv: ['node', 'server1.js']
    },
    {
      packageName: 'app-2',
      pid: 2222,
      cwd: '/test/app2',
      startTime: new Date().getTime(),
      argv: ['node', 'server2.js']
    }
  ]

  // Setup for test
  let consoleOutput: string[] = []
  const originalConsoleLog = console.log
  const originalDisableMainCliAutorun = process.env.DISABLE_MAIN_CLI_AUTORUN

  before(() => {
    process.env.DISABLE_MAIN_CLI_AUTORUN = '1'
    consoleOutput = []
    console.log = (...args) => {
      consoleOutput.push(args.join(' '))
    }

    mock.module('@platformatic/control', {
      namedExports: {
        RuntimeApiClient: class {
          async getRuntimes () { return mockRuntimes }
          async getRuntimeConfig () { return { path: '/test/config.json' } }
          async close () {}
        }
      }
    })

    mock.module('@inquirer/prompts', {
      namedExports: {
        select: async () => mockRuntimes[1] // Always select the second runtime
      }
    })
  })

  after(() => {
    console.log = originalConsoleLog
    mock.restoreAll()
    process.env.DISABLE_MAIN_CLI_AUTORUN = originalDisableMainCliAutorun
  })

  it('should correctly select a runtime from multiple options', async () => {
    const { default: cli } = await import('../cli.js')

    // Call the main function
    const result = await cli()

    // Verify result
    assert.deepStrictEqual(result, mockRuntimes[1])
    assert.ok(consoleOutput.some(output => output.includes('app-2')))
    assert.ok(consoleOutput.some(output => output.includes('2222')))
  })
})
