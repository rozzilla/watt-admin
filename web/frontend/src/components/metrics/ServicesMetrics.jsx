import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { TRANSPARENT, RICH_BLACK } from '@platformatic/ui-components/src/components/constants'
import styles from './ServicesMetrics.module.css'
import commonStyles from '~/styles/CommonStyles.module.css'
import { BorderedBox } from '@platformatic/ui-components'
import { getApiMetricsPodService, getApiMetricsPod } from '~/api'
import { useInterval } from '~/hooks/useInterval'
import useAdminStore from '~/useAdminStore'
import { REFRESH_INTERVAL_METRICS, POSITION_FIXED, MEMORY_UNIT_METRICS, LATENCY_UNIT_METRICS, CPU_UNIT_METRICS } from '~/ui-constants'
import colorSetMem from './memory.module.css'
import colorSetCpu from './cpu.module.css'
import colorSetLatency from './latency.module.css'
import NodeJSMetric, { generateLegend } from '../application/NodeJSMetric'

const ServicesMetrics = React.forwardRef(({
  serviceId,
  showAggregatedMetrics
}, ref) => {
  const [initialLoading, setInitialLoading] = useState(true)
  const [serviceData, setServiceData] = useState({
    dataMem: [],
    dataCpu: [],
    dataLatency: []
  })
  const [allData, setAllData] = useState({
    dataMem: [],
    dataCpu: [],
    dataLatency: []
  })
  const [latestRefreshDate, setLatestRefreshDate] = useState(new Date())
  const { runtimePid } = useAdminStore()

  const getData = async () => {
    try {
      setAllData(await getApiMetricsPod(runtimePid))
      setServiceData(await getApiMetricsPodService(runtimePid, serviceId))
      setLatestRefreshDate(new Date())
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  useInterval(() => { getData() }, REFRESH_INTERVAL_METRICS)
  useEffect(() => { getData() }, [runtimePid, serviceId])

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
                    unit={`(${MEMORY_UNIT_METRICS})`}
                    metricURL='mem'
                    dataValues={serviceData.dataMem}
                    initialLoading={initialLoading}
                    chartTooltipPosition={POSITION_FIXED}
                    options={[{
                      label: 'RSS',
                      internalKey: 'rss',
                      unit: MEMORY_UNIT_METRICS
                    }, {
                      label: 'Total Heap',
                      internalKey: 'totalHeap',
                      unit: MEMORY_UNIT_METRICS
                    }, {
                      label: 'Heap Used',
                      internalKey: 'usedHeap',
                      unit: MEMORY_UNIT_METRICS
                    }, {
                      label: 'New Space',
                      internalKey: 'newSpace',
                      unit: MEMORY_UNIT_METRICS
                    }, {
                      label: 'Old Space',
                      internalKey: 'oldSpace',
                      unit: MEMORY_UNIT_METRICS
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
                      unit={`(${MEMORY_UNIT_METRICS})`}
                      metricURL='mem'
                      dataValues={allData.dataMem}
                      initialLoading={initialLoading}
                      chartTooltipPosition={POSITION_FIXED}
                      options={[{
                        label: 'RSS',
                        internalKey: 'rss',
                        unit: MEMORY_UNIT_METRICS
                      }, {
                        label: 'Total Heap',
                        internalKey: 'totalHeap',
                        unit: MEMORY_UNIT_METRICS
                      }, {
                        label: 'Heap Used',
                        internalKey: 'usedHeap',
                        unit: MEMORY_UNIT_METRICS
                      }, {
                        label: 'New Space',
                        internalKey: 'newSpace',
                        unit: MEMORY_UNIT_METRICS
                      }, {
                        label: 'Old Space',
                        internalKey: 'oldSpace',
                        unit: MEMORY_UNIT_METRICS
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
                    dataValues={serviceData.dataCpu}
                    initialLoading={initialLoading}
                    chartTooltipPosition={POSITION_FIXED}
                    unit={`(${CPU_UNIT_METRICS})`}
                    options={[{
                      label: 'CPU',
                      internalKey: 'cpu',
                      unit: CPU_UNIT_METRICS
                    }, {
                      label: 'ELU',
                      internalKey: 'eventLoop',
                      unit: CPU_UNIT_METRICS
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
                      unit={`(${CPU_UNIT_METRICS})`}
                      options={[{
                        label: 'CPU',
                        internalKey: 'cpu',
                        unit: CPU_UNIT_METRICS
                      }, {
                        label: 'ELU',
                        internalKey: 'eventLoop',
                        unit: CPU_UNIT_METRICS
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
                    dataValues={serviceData.dataLatency}
                    initialLoading={initialLoading}
                    chartTooltipPosition={POSITION_FIXED}
                    unit={`(${LATENCY_UNIT_METRICS})`}
                    options={[{
                      label: 'P90',
                      internalKey: 'p90',
                      unit: LATENCY_UNIT_METRICS
                    }, {
                      label: 'P95',
                      internalKey: 'p95',
                      unit: LATENCY_UNIT_METRICS
                    }, {
                      label: 'P99',
                      internalKey: 'p99',
                      unit: LATENCY_UNIT_METRICS
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
                      unit={`(${LATENCY_UNIT_METRICS})`}
                      options={[{
                        label: 'P90',
                        internalKey: 'p90',
                        unit: LATENCY_UNIT_METRICS
                      }, {
                        label: 'P95',
                        internalKey: 'p95',
                        unit: LATENCY_UNIT_METRICS
                      }, {
                        label: 'P99',
                        internalKey: 'p99',
                        unit: LATENCY_UNIT_METRICS
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
