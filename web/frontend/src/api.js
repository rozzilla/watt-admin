/* APPLICATIONS */
export const getApiApplication = () => {
  // FIXME@backend get dynamic data
  return {
    id: '',
    name: 'Application-name-1',
    lastStarted: '2024-04-22T09:52:57.858Z',
    pltVersion: '1.2.3',
    state: { services: [] },
    latestDeployment: {},
    deploymentsOnMainTaxonomy: 1
  }
}

// FIXME@backend get dynamic data
const generateMockData = () => {
  const generateTimestamps = (count) => {
    const timestamps = []
    const now = new Date()
    for (let i = 0; i < count; i++) {
      timestamps.unshift(new Date(now - i * 60000))
    }
    return timestamps
  }

  const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const timestamps = generateTimestamps(5)
  const mockData = timestamps.map(date => ({
    date: date.toISOString(),
    rss: randomInRange(150 * 1024 * 1024, 200 * 1024 * 1024),
    totalHeapSize: randomInRange(100 * 1024 * 1024, 150 * 1024 * 1024),
    usedHeapSize: randomInRange(50 * 1024 * 1024, 100 * 1024 * 1024),
    newSpaceSize: randomInRange(20 * 1024 * 1024, 40 * 1024 * 1024),
    oldSpaceSize: randomInRange(30 * 1024 * 1024, 60 * 1024 * 1024),
    cpu: randomInRange(10, 40) / 100,
    elu: randomInRange(20, 60) / 100,
    latencies: {
      p90: randomInRange(50, 100),
      p95: randomInRange(100, 150),
      p99: randomInRange(150, 200)
    }
  }))
  return mockData
}

// FIXME@backend get dynamic data
export const getApiMetricsPodPerService = async () => {
  const mockData = generateMockData()
  return { status: 200, json: () => Promise.resolve(mockData) }
}

// FIXME@backend get dynamic data
export const getApiMetricsPod = async () => {
  const mockData = generateMockData()
  return { status: 200, json: () => Promise.resolve(mockData) }
}

// FIXME@backend get dynamic data
export const restartApiApplication = async (applicationId) => {
  console.log('application', applicationId)
  return {}
}

/* PODS */
export const getApiPod = async (applicationId, taxonomyId, podId) => {
  const [dataMem, dataCpu] = await Promise.all([
    getApiMetricsPod(taxonomyId, applicationId, podId, 'mem'),
    getApiMetricsPod(taxonomyId, applicationId, podId, 'cpu')
  ])

  const dataValuesMem = await dataMem.json()
  const dataValuesCpu = await dataCpu.json()

  return { ...dataValuesMem, ...dataValuesCpu }
}
