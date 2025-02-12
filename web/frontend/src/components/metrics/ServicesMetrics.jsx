import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { TRANSPARENT, RICH_BLACK, OPACITY_30, WHITE } from '@platformatic/ui-components/src/components/constants'
import styles from './ServicesMetrics.module.css'
import typographyStyles from '~/styles/Typography.module.css'
import commonStyles from '~/styles/CommonStyles.module.css'
import { BorderedBox, LoadingSpinnerV2, VerticalSeparator } from '@platformatic/ui-components'
import { getApiMetricsPodPerService, getApiMetricsPod } from '~/api'
import ServiceLineChart from './ServiceLineChart'
import { useInterval } from '~/hooks/useInterval'
import { useWindowDimensions } from '~/hooks/useWindowDimensions'
import ErrorComponent from '~/components/errors/ErrorComponent'
import NoDataFound from '~/components/ui/NoDataFound'
import { REFRESH_INTERVAL_METRICS, POSITION_FIXED, MIN_HEIGHT_COMPACT_SIZE, DEFAULT_HEIGHT_CHART } from '~/ui-constants'
import colorSetMem from './memory.module.css'
import colorSetCpu from './cpu.module.css'
import colorSetLatency from './latency.module.css'
import NodeJSMetric from '../application/NodeJSMetric'

const ServicesMetrics = React.forwardRef(({
  serviceId,
  showAggregatedMetrics
}, ref) => {
  const [initialLoading, setInitialLoading] = useState(true)
  const [showNoResult, setShowNoResult] = useState(false)
  const [showErrorComponent, setShowErrorComponent] = useState(false)
  const [error, setError] = useState(null)
  const [paused, setPaused] = useState(false) // This pauses the chart flowing (not the data collection)
  const [dataAggregated, setDataAggregated] = useState({
    memory: [],
    cpuEL: [],
    latency: []
  })

  const toMB = (bytes) => {
    return Math.round(bytes / 1024 / 1024)
  }
  const [heightChart, setHeightChart] = useState(DEFAULT_HEIGHT_CHART)
  const { height: innerHeight } = useWindowDimensions()

  const [allData, setAllData] = useState({
    dataMem: [],
    dataCpu: [],
    dataLatency: []
  })
  const [latestRefreshDate, setLatestRefreshDate] = useState(new Date())

  useInterval(async () => {
    try {
      const response = await getApiMetricsPod()
      const data = await response.json()

      const dataMem = data.map(item => ({
        date: item.date,
        rss: item.rss / (1024 * 1024 * 1024),
        totalHeap: item.totalHeapSize / (1024 * 1024 * 1024),
        usedHeap: item.usedHeapSize / (1024 * 1024 * 1024)
      }))

      const dataCpu = data.map(item => ({
        date: item.date,
        cpu: item.cpu * 100,
        eventLoop: item.elu * 100
      }))

      const dataLatency = data.map(item => ({
        date: item.date,
        p90: item.latencies.p90,
        p95: item.latencies.p95,
        p99: item.latencies.p99
      }))

      setAllData({ dataMem, dataCpu, dataLatency })
      setLatestRefreshDate(new Date())
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setInitialLoading(false)
    }
  }, REFRESH_INTERVAL_METRICS)

  useEffect(() => {
    if (innerHeight > MIN_HEIGHT_COMPACT_SIZE) {
      setHeightChart(DEFAULT_HEIGHT_CHART + ((innerHeight - MIN_HEIGHT_COMPACT_SIZE) / 3))
    } else {
      setHeightChart(DEFAULT_HEIGHT_CHART)
    }
  }, [innerHeight])

  function handleMetrics (metrics, service = false) {
    const parsedMetrics = metrics
    const memory = []
    const cpuEL = []
    const latency = []
    for (const parsedMetric of parsedMetrics) {
      const { date, cpu, elu, rss, totalHeapSize, usedHeapSize, newSpaceSize, oldSpaceSize, latencies } = parsedMetric
      const { p90: P90, p95: P95, p99: P99 } = latencies
      const time = new Date(date)
      const eluPercentage = elu * 100
      memory.push({
        time,
        values: [rss, totalHeapSize, usedHeapSize, newSpaceSize, oldSpaceSize].map(toMB)
      })
      cpuEL.push({
        time,
        values: [cpu, eluPercentage]
      })
      latency.push({ time, P90, P95, P99 })
    }
    if (!service) {
      setDataAggregated({
        memory,
        cpuEL,
        latency
      })
    }

    if (initialLoading && memory.length > 3) {
      setInitialLoading(false)
    }
  }

  useInterval(async () => {
    try {
      const [responseDataServices, responseDataAggregated] = await Promise.all([
        getApiMetricsPodPerService(),
        getApiMetricsPod()
      ])
      setShowNoResult(false)
      if (responseDataServices.status === 200) {
        const dataService = await responseDataServices.json()
        const dataAggregated = await responseDataAggregated.json()
        handleMetrics(dataService, true)
        handleMetrics(dataAggregated)
      } else {
        console.error('error on status', responseDataServices.status)
      }
    } catch (e) {
      console.error(e)
      setError(e)
      setShowErrorComponent(true)
    }
  }, REFRESH_INTERVAL_METRICS)

  function generateLegend (labels, colorStyles) {
    return (
      <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth} ${commonStyles.itemsCenter}`}>
        {
        labels.map((label, i) => {
          return (
            <React.Fragment key={`label-${i}`}>
              <div className={commonStyles.tinyFlexRow}>
                <div className={`${styles.label} ${typographyStyles.desktopBodySmallest} ${typographyStyles.opacity70} ${typographyStyles.textWhite}`}>{label} </div>
                <div className={`${styles.legendLine} ${colorStyles[`color-${i}`]}`} />
              </div>
              {i !== labels.length - 1 ? <VerticalSeparator color={WHITE} backgroundColorOpacity={OPACITY_30} classes={styles.verticalSeparator} /> : ''}
            </React.Fragment>
          )
        })
      }
      </div>
    )
  }

  function getKeyAggregated (metric) {
    let defaultKey = `aggregated-${metric}-`
    const defaultDate = new Date().toISOString()

    switch (metric) {
      case 'memory':
        if (dataAggregated.memory.length > 0) {
          defaultKey += dataAggregated.memory[dataAggregated.memory.length - 1].time ? new Date(dataAggregated.memory[dataAggregated.memory.length - 1].time).toISOString() : defaultDate
        }
        break
      case 'cpu':
        if (dataAggregated.cpuEL.length > 0) {
          defaultKey += dataAggregated.cpuEL[dataAggregated.cpuEL.length - 1].time ? new Date(dataAggregated.cpuEL[dataAggregated.cpuEL.length - 1].time).toISOString() : defaultDate
        }
        break
      case 'latency':
        if (dataAggregated.latency.length > 0) {
          defaultKey += dataAggregated.latency[dataAggregated.latency.length - 1].time ? new Date(dataAggregated.latency[dataAggregated.latency.length - 1].time).toISOString() : defaultDate
        }
        break
      default:
        defaultKey += defaultDate
        break
    }
    return defaultKey
  }

  function renderContent () {
    if (initialLoading) {
      return (
        <LoadingSpinnerV2
          loading
          applySentences={{
            containerClassName: `${commonStyles.mediumFlexBlock} ${commonStyles.itemsCenter}`,
            sentences: [{
              style: `${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite}`,
              text: 'Start collecting metrics'
            }]
          }}
          containerClassName={styles.loadingSpinner}
          spinnerProps={{ size: 40, thickness: 3 }}
        />
      )
    }

    if (showNoResult) { return <NoDataFound title='No Metrics yet' subTitle={<span>There’s no metrics collected by your apps.</span>} /> }

    if (showErrorComponent) {
      return (
        <ErrorComponent
          error={error}
          message={error?.message || ''}
          onClickDismiss={() => setShowErrorComponent(false)}
        />
      )
    }

    return (
      <div className={`${commonStyles.smallFlexBlock} ${commonStyles.fullWidth} ${styles.flexGrow}`}>
        <div className={`${commonStyles.smallFlexBlock} ${commonStyles.fullWidth}`}>
          <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
            <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>
              <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
                <NodeJSMetric
                  key={`mem_${latestRefreshDate.toISOString()}`}
                  title={`${serviceId} Memory`}
                  unit='(GB)'
                  metricURL='mem'
                  dataValues={allData.dataMem}
                  initialLoading={initialLoading}
                  options={[{
                    label: 'RSS',
                    internalKey: 'rss',
                    unit: 'GB'
                  }, {
                    label: 'Total Heap',
                    internalKey: 'totalHeap',
                    unit: 'GB'
                  }, {
                    label: 'Heap Used',
                    internalKey: 'usedHeap',
                    unit: 'GB'
                  }]}
                  backgroundColor={RICH_BLACK}
                  showLegend={false}
                  timeline
                  slimCss
                />
              </BorderedBox>

              {showAggregatedMetrics && (
                <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
                  <ServiceLineChart
                    data={dataAggregated.memory}
                    key={getKeyAggregated('memory')}
                    title='Aggregated Memory'
                    unit='MB'
                    labels={['RSS', 'Total Heap', 'Heap Used', 'New Space', 'Old Space']}
                    paused={paused}
                    setPaused={setPaused}
                    tooltipPosition={POSITION_FIXED}
                    heightChart={heightChart}
                  />
                </BorderedBox>
              )}
            </div>

            {generateLegend(['RSS', 'Total Heap', 'Heap Used', 'New Space', 'Old Space'], colorSetMem)}
          </div>
          <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
            <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>

              <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
                <NodeJSMetric
                  key={`cpu_${latestRefreshDate.toISOString()}`}
                  title={`${serviceId} CPU & ELU`}
                  metricURL='cpu'
                  dataValues={allData.dataCpu}
                  initialLoading={initialLoading}
                  unit='(%)'
                  options={[{
                    label: 'CPU',
                    internalKey: 'cpu',
                    unit: '%'
                  }, {
                    label: 'ELU',
                    internalKey: 'eventLoop',
                    unit: '%'
                  }]}
                  backgroundColor={RICH_BLACK}
                  showLegend={false}
                  timeline
                  slimCss
                />
              </BorderedBox>

              {showAggregatedMetrics && (
                <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
                  <ServiceLineChart
                    data={dataAggregated.cpuEL}
                    key={getKeyAggregated('cpu')}
                    title='Aggregated CPU & ELU'
                    unit='%'
                    lowerMaxY={100}
                    labels={['CPU', 'ELU']}
                    colorSet='cpu'
                    paused={paused}
                    setPaused={setPaused}
                    tooltipPosition={POSITION_FIXED}
                    heightChart={heightChart}
                  />
                </BorderedBox>
              )}
            </div>

            {generateLegend(['CPU', 'ELU'], colorSetCpu)}
          </div>

          <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
            <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>

              <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
                <NodeJSMetric
                  key={`latency_${latestRefreshDate.toISOString()}`}
                  title={`${serviceId} Latency`}
                  metricURL='latency'
                  dataValues={allData.dataLatency}
                  initialLoading={initialLoading}
                  unit='(ms)'
                  options={[{
                    label: 'P90',
                    internalKey: 'p90',
                    unit: 'ms'
                  }, {
                    label: 'P95',
                    internalKey: 'p95',
                    unit: 'ms'
                  }, {
                    label: 'P99',
                    internalKey: 'p99',
                    unit: 'ms'
                  }]}
                  backgroundColor={RICH_BLACK}
                  showLegend={false}
                  slimCss
                  timeline
                />
              </BorderedBox>

              {showAggregatedMetrics && (
                <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
                  <NodeJSMetric
                    key={`latency_${latestRefreshDate.toISOString()}`}
                    title='Aggregated Service Latency'
                    metricURL='latency'
                    dataValues={allData.dataLatency}
                    initialLoading={initialLoading}
                    unit='(ms)'
                    options={[{
                      label: 'P90',
                      internalKey: 'p90',
                      unit: 'ms'
                    }, {
                      label: 'P95',
                      internalKey: 'p95',
                      unit: 'ms'
                    }, {
                      label: 'P99',
                      internalKey: 'p99',
                      unit: 'ms'
                    }]}
                    backgroundColor={RICH_BLACK}
                    showLegend={false}
                    slimCss
                    timeline
                  />
                </BorderedBox>
              )}
            </div>

            {generateLegend(['P99', 'P95', 'P90'], colorSetLatency)}
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={ref}>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  )
})

ServicesMetrics.propTypes = {
  /**
   * serviceId
   */
  serviceId: PropTypes.string,
  /**
   * showAggregatedMetrics
   */
  showAggregatedMetrics: PropTypes.bool
}

export default ServicesMetrics
