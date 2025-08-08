import { describe, it, expect } from 'vitest'
import { getEmptyMetrics, getMetricColor } from '../../src/utilities/metrics'

describe('getEmptyMetrics', () => {
  it('should return an object with all metric arrays empty', () => {
    const result = getEmptyMetrics()

    expect(result).toEqual({
      dataMem: [],
      dataCpu: [],
      dataLatency: [],
      dataReq: [],
      dataKafka: [],
      dataUndici: [],
      dataWebsocket: []
    })
  })

  it('should return a new object instance on each call', () => {
    const result1 = getEmptyMetrics()
    const result2 = getEmptyMetrics()

    expect(result1).not.toBe(result2)
    expect(result1).toEqual(result2)
  })

  it('should return arrays that are separate instances', () => {
    const result = getEmptyMetrics()

    expect(result.dataMem).not.toBe(result.dataCpu)
    expect(result.dataMem).toHaveLength(0)
    expect(result.dataCpu).toHaveLength(0)
    expect(result.dataLatency).toHaveLength(0)
    expect(result.dataReq).toHaveLength(0)
    expect(result.dataKafka).toHaveLength(0)
    expect(result.dataUndici).toHaveLength(0)
    expect(result.dataWebsocket).toHaveLength(0)
  })
})

describe('getMetricColor', () => {
  it('should return correct color sets for each metric type', () => {
    expect(getMetricColor('mem')).toBeDefined()
    expect(getMetricColor('cpu')).toBeDefined()
    expect(getMetricColor('req')).toBeDefined()
    expect(getMetricColor('latency')).toBeDefined()
    expect(getMetricColor('kafka')).toBeDefined()
    expect(getMetricColor('undici')).toBeDefined()
    expect(getMetricColor('ws')).toBeDefined()
  })

  it('should throw error for invalid metric type', () => {
    expect(() => getMetricColor('invalid' as 'ws')).toThrow('Unhandled metric type: invalid')
  })
})
