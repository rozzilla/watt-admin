import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { TRANSPARENT, RICH_BLACK, OPACITY_30, WHITE } from '@platformatic/ui-components/src/components/constants'
import styles from './ServicesMetrics.module.css'
import typographyStyles from '~/styles/Typography.module.css'
import commonStyles from '~/styles/CommonStyles.module.css'
import { BorderedBox, VerticalSeparator } from '@platformatic/ui-components'
import { getApiMetricsPod } from '~/api'
import { useInterval } from '~/hooks/useInterval'
import { REFRESH_INTERVAL_METRICS, POSITION_FIXED } from '~/ui-constants'
import colorSetMem from './memory.module.css'
import colorSetCpu from './cpu.module.css'
import colorSetLatency from './latency.module.css'
import NodeJSMetric from '../application/NodeJSMetric'

const ServicesMetrics = React.forwardRef(({
  serviceId,
  showAggregatedMetrics
}, ref) => {
  const [initialLoading, setInitialLoading] = useState(true)
  const [allData, setAllData] = useState({
    dataMem: [],
    dataCpu: [],
    dataLatency: []
  })
  const [latestRefreshDate, setLatestRefreshDate] = useState(new Date())

  useInterval(async () => {
    try {
      setInitialLoading(true)
      const response = await getApiMetricsPod()
      const data = await response.json()

      // FIXME: unify with NodeJSMetrics logic (since it's duplicated)
      const dataMem = data.map(item => ({
        date: item.date,
        rss: item.rss / (1024 * 1024 * 1024),
        totalHeap: item.totalHeapSize / (1024 * 1024 * 1024),
        usedHeap: item.usedHeapSize / (1024 * 1024 * 1024),
        newSpace: item.newSpaceSize / (1024 * 1024 * 1024),
        oldSpace: item.oldSpaceSize / (1024 * 1024 * 1024)
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

  // FIXME: unify with NodeJSMetrics logic (since it's duplicated)
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

  return (
    <div className={styles.container} ref={ref}>
      <div className={styles.content}>
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
                    chartTooltipPosition={POSITION_FIXED}
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
                    }, {
                      label: 'New Space',
                      internalKey: 'newSpace',
                      unit: 'GB'
                    }, {
                      label: 'Old Space',
                      internalKey: 'oldSpace',
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
                    <NodeJSMetric
                      key={`mem_${latestRefreshDate.toISOString()}`}
                      title='Memory'
                      unit='(GB)'
                      metricURL='mem'
                      dataValues={allData.dataMem}
                      initialLoading={initialLoading}
                      chartTooltipPosition={POSITION_FIXED}
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
                      }, {
                        label: 'New Space',
                        internalKey: 'newSpace',
                        unit: 'GB'
                      }, {
                        label: 'Old Space',
                        internalKey: 'oldSpace',
                        unit: 'GB'
                      }]}
                      backgroundColor={RICH_BLACK}
                      showLegend={false}
                      timeline
                      slimCss
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
                    chartTooltipPosition={POSITION_FIXED}
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
                    <NodeJSMetric
                      key={`cpu_${latestRefreshDate.toISOString()}`}
                      title='CPU & ELU'
                      metricURL='cpu'
                      dataValues={allData.dataCpu}
                      initialLoading={initialLoading}
                      chartTooltipPosition={POSITION_FIXED}
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
                    chartTooltipPosition={POSITION_FIXED}
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
                      chartTooltipPosition={POSITION_FIXED}
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
