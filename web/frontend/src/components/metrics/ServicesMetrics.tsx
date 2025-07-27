import React, { useState, useEffect } from 'react'
import { TRANSPARENT, RICH_BLACK } from '@platformatic/ui-components/src/components/constants'
import styles from './ServicesMetrics.module.css'
import commonStyles from '../../styles/CommonStyles.module.css'
import { BorderedBox } from '@platformatic/ui-components'
import { getApiMetricsPodService, getApiMetricsPod, getApiMetricsPodWorker } from '../../api'
import { useInterval } from '../../hooks/useInterval'
import useAdminStore from '../../useAdminStore'
import { REFRESH_INTERVAL_METRICS, POSITION_FIXED, OPTIONS_METRICS, KEY_MEM, KEY_CPU, KEY_LATENCY, KEY_REQ, KEY_UNDICI, KEY_WS, KEY_KAFKA } from '../../ui-constants'
import colorSetMem from './memory.module.css'
import colorSetCpu from './cpu.module.css'
import colorSetLatency from './latency.module.css'
import colorSetReq from './req.module.css'
import colorSetKafka from './kafka.module.css'
import colorSetUndici from './undici.module.css'
import colorSetWs from './ws.module.css'
import NodeJSMetric, { generateLegend } from '../application/NodeJSMetric'
import { GetRuntimesPidMetricsResponseOK } from 'src/client/backend-types'
import ErrorComponent from '../errors/ErrorComponent'
import { ServiceData } from 'src/types'
import { getThreadName, ThreadIndex } from '../services/ServicesSelectorForCharts'
import { getEmptyMetrics } from '../application/NodeJSMetrics'
import { getKafkaType, getOptionMetricsLabel } from '../../utilities/getters'

interface ServicesMetricsProps {
  service: ServiceData;
  threadIndex?: ThreadIndex;
  showAggregatedMetrics: boolean;
}

function ServicesMetrics ({
  threadIndex,
  service: { id: serviceId },
  showAggregatedMetrics
}: ServicesMetricsProps): React.ReactElement {
  const threadName = threadIndex ? getThreadName(threadIndex) : ''
  const [error, setError] = useState<unknown>(undefined)
  const [initialLoading, setInitialLoading] = useState(true)
  const [serviceData, setServiceData] = useState<GetRuntimesPidMetricsResponseOK>(getEmptyMetrics())
  const [allData, setAllData] = useState<GetRuntimesPidMetricsResponseOK>(getEmptyMetrics())
  const { runtimePid } = useAdminStore()
  const [hasKafkaData, setHasKafkaData] = useState(false)

  const getData = async (): Promise<void> => {
    try {
      if (serviceId && runtimePid) {
        const detailedMetricsPromise = (threadIndex && threadIndex !== 'all') ? getApiMetricsPodWorker(runtimePid, serviceId, threadIndex - 1) : getApiMetricsPodService(runtimePid, serviceId)
        const [runtimeData, serviceData] = await Promise.all([getApiMetricsPod(runtimePid), detailedMetricsPromise])
        setAllData(runtimeData)
        setServiceData(serviceData)
        setError(undefined)
        setHasKafkaData(getKafkaType(serviceData.dataKafka))
      }
    } catch (error) {
      setError(error)
    } finally {
      setInitialLoading(false)
    }
  }

  useInterval(() => { getData() }, REFRESH_INTERVAL_METRICS)
  useEffect(() => { getData() }, [serviceId, showAggregatedMetrics, threadIndex])

  if (error) {
    return <ErrorComponent error={error} onClickDismiss={() => setError(undefined)} />
  }

  return (
    <div className={`${styles.container} ${styles.content} ${commonStyles.smallFlexBlock} ${commonStyles.fullWidth} ${styles.flexGrow}`}>
      <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>
          <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
            <NodeJSMetric
              title={`${serviceId} ${OPTIONS_METRICS[KEY_MEM].title}`}
              unit={`(${OPTIONS_METRICS[KEY_MEM].unit})`}
              metricURL={KEY_MEM}
              dataValues={serviceData.dataMem}
              initialLoading={initialLoading}
              chartTooltipPosition={POSITION_FIXED}
              options={OPTIONS_METRICS[KEY_MEM].options}
              showLegend={false}
              timeline
              slimCss
              threadName={threadName}
            />
          </BorderedBox>

          {showAggregatedMetrics && (
            <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
              <NodeJSMetric
                title={`Entrypoint ${OPTIONS_METRICS[KEY_MEM].title}`}
                unit={`(${OPTIONS_METRICS[KEY_MEM].unit})`}
                metricURL={KEY_MEM}
                dataValues={allData.dataMem}
                initialLoading={initialLoading}
                chartTooltipPosition={POSITION_FIXED}
                options={OPTIONS_METRICS[KEY_MEM].options}
                showLegend={false}
                timeline
                slimCss
              />
            </BorderedBox>
          )}
        </div>
        {generateLegend(getOptionMetricsLabel(OPTIONS_METRICS[KEY_MEM].options), colorSetMem)}
      </div>

      <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>
          <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
            <NodeJSMetric
              title={`${serviceId} ${OPTIONS_METRICS[KEY_CPU].title}`}
              metricURL={KEY_CPU}
              dataValues={serviceData.dataCpu}
              initialLoading={initialLoading}
              chartTooltipPosition={POSITION_FIXED}
              unit={`(${OPTIONS_METRICS[KEY_CPU].unit})`}
              options={OPTIONS_METRICS[KEY_CPU].options}
              showLegend={false}
              timeline
              slimCss
              threadName={threadName}
            />
          </BorderedBox>

          {showAggregatedMetrics && (
            <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
              <NodeJSMetric
                title={`Entrypoint ${OPTIONS_METRICS[KEY_CPU].title}`}
                metricURL={KEY_CPU}
                dataValues={allData.dataCpu}
                initialLoading={initialLoading}
                chartTooltipPosition={POSITION_FIXED}
                unit={`(${OPTIONS_METRICS[KEY_CPU].unit})`}
                options={OPTIONS_METRICS[KEY_CPU].options}
                showLegend={false}
                timeline
                slimCss
              />
            </BorderedBox>
          )}
        </div>
        {generateLegend(getOptionMetricsLabel(OPTIONS_METRICS[KEY_CPU].options), colorSetCpu)}
      </div>

      <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>
          <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
            <NodeJSMetric
              title={`${serviceId} ${OPTIONS_METRICS[KEY_LATENCY].title}`}
              metricURL={KEY_LATENCY}
              dataValues={serviceData.dataLatency}
              initialLoading={initialLoading}
              chartTooltipPosition={POSITION_FIXED}
              unit={`(${OPTIONS_METRICS[KEY_LATENCY].unit})`}
              options={OPTIONS_METRICS[KEY_LATENCY].options}
              showLegend={false}
              threadName={threadName}
              slimCss
              timeline
            />
          </BorderedBox>

          {showAggregatedMetrics && (
            <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
              <NodeJSMetric
                title={`Entrypoint ${OPTIONS_METRICS[KEY_LATENCY].title}`}
                metricURL={KEY_LATENCY}
                dataValues={allData.dataLatency}
                initialLoading={initialLoading}
                chartTooltipPosition={POSITION_FIXED}
                unit={`(${OPTIONS_METRICS[KEY_LATENCY].unit})`}
                options={OPTIONS_METRICS[KEY_LATENCY].options}
                showLegend={false}
                slimCss
                timeline
              />
            </BorderedBox>
          )}
        </div>
        {generateLegend(getOptionMetricsLabel(OPTIONS_METRICS[KEY_LATENCY].options), colorSetLatency)}
      </div>

      <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>
          <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
            <NodeJSMetric
              title={`${serviceId} ${OPTIONS_METRICS[KEY_REQ].title}`}
              metricURL={KEY_REQ}
              dataValues={serviceData.dataReq}
              initialLoading={initialLoading}
              chartTooltipPosition={POSITION_FIXED}
              unit={`(${OPTIONS_METRICS[KEY_REQ].unit})`}
              options={OPTIONS_METRICS[KEY_REQ].options}
              showLegend={false}
              threadName={threadName}
              slimCss
              timeline
            />
          </BorderedBox>

          {showAggregatedMetrics && (
            <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
              <NodeJSMetric
                title={`Entrypoint ${OPTIONS_METRICS[KEY_REQ].title}`}
                metricURL={KEY_REQ}
                dataValues={allData.dataReq}
                initialLoading={initialLoading}
                chartTooltipPosition={POSITION_FIXED}
                unit={`(${OPTIONS_METRICS[KEY_REQ].unit})`}
                options={OPTIONS_METRICS[KEY_REQ].options}
                showLegend={false}
                slimCss
                timeline
              />
            </BorderedBox>
          )}
        </div>
        {generateLegend(getOptionMetricsLabel(OPTIONS_METRICS[KEY_REQ].options), colorSetReq)}
      </div>

      <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>
          <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
            <NodeJSMetric
              title={`${serviceId} ${OPTIONS_METRICS[KEY_UNDICI].title}`}
              metricURL={KEY_UNDICI}
              dataValues={serviceData.dataUndici}
              initialLoading={initialLoading}
              chartTooltipPosition={POSITION_FIXED}
              unit={`(${OPTIONS_METRICS[KEY_UNDICI].unit})`}
              options={OPTIONS_METRICS[KEY_UNDICI].options}
              showLegend={false}
              threadName={threadName}
              slimCss
              timeline
            />
          </BorderedBox>

          {showAggregatedMetrics && (
            <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
              <NodeJSMetric
                title={`Entrypoint ${OPTIONS_METRICS[KEY_UNDICI].title}`}
                metricURL={KEY_UNDICI}
                dataValues={allData.dataUndici}
                initialLoading={initialLoading}
                chartTooltipPosition={POSITION_FIXED}
                unit={`(${OPTIONS_METRICS[KEY_UNDICI].unit})`}
                options={OPTIONS_METRICS[KEY_UNDICI].options}
                showLegend={false}
                slimCss
                timeline
              />
            </BorderedBox>
          )}
        </div>
        {generateLegend(getOptionMetricsLabel(OPTIONS_METRICS[KEY_UNDICI].options), colorSetUndici)}
      </div>

      <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>
          <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
            <NodeJSMetric
              title={`${serviceId} ${OPTIONS_METRICS[KEY_WS].title}`}
              metricURL={KEY_WS}
              dataValues={serviceData.dataWebsocket}
              initialLoading={initialLoading}
              chartTooltipPosition={POSITION_FIXED}
              unit={`(${OPTIONS_METRICS[KEY_WS].unit})`}
              options={OPTIONS_METRICS[KEY_WS].options}
              showLegend={false}
              threadName={threadName}
              slimCss
              timeline
            />
          </BorderedBox>

          {showAggregatedMetrics && (
            <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
              <NodeJSMetric
                title={`Entrypoint ${OPTIONS_METRICS[KEY_WS].title}`}
                metricURL={KEY_WS}
                dataValues={allData.dataWebsocket}
                initialLoading={initialLoading}
                chartTooltipPosition={POSITION_FIXED}
                unit={`(${OPTIONS_METRICS[KEY_WS].unit})`}
                options={OPTIONS_METRICS[KEY_WS].options}
                showLegend={false}
                slimCss
                timeline
              />
            </BorderedBox>
          )}
        </div>
        {generateLegend(getOptionMetricsLabel(OPTIONS_METRICS[KEY_WS].options), colorSetWs)}
      </div>

      {hasKafkaData &&
        <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
          <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth}`}>
            <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
              <NodeJSMetric
                title={`${serviceId} ${OPTIONS_METRICS[KEY_KAFKA].title}`}
                metricURL={KEY_KAFKA}
                dataValues={serviceData.dataKafka}
                initialLoading={initialLoading}
                chartTooltipPosition={POSITION_FIXED}
                unit={`(${OPTIONS_METRICS[KEY_KAFKA].unit})`}
                options={OPTIONS_METRICS[KEY_KAFKA].options}
                showLegend={false}
                threadName={threadName}
                slimCss
                timeline
              />
            </BorderedBox>

            {showAggregatedMetrics && (
              <BorderedBox color={TRANSPARENT} backgroundColor={RICH_BLACK} classes={styles.boxMetricContainer}>
                <NodeJSMetric
                  title={`Entrypoint ${OPTIONS_METRICS[KEY_KAFKA].title}`}
                  metricURL={KEY_KAFKA}
                  dataValues={allData.dataKafka}
                  initialLoading={initialLoading}
                  chartTooltipPosition={POSITION_FIXED}
                  unit={`(${OPTIONS_METRICS[KEY_KAFKA].unit})`}
                  options={OPTIONS_METRICS[KEY_KAFKA].options}
                  showLegend={false}
                  slimCss
                  timeline
                />
              </BorderedBox>
            )}
          </div>
          {generateLegend(getOptionMetricsLabel(OPTIONS_METRICS[KEY_KAFKA].options), colorSetKafka)}
        </div>}
    </div>
  )
}

export default ServicesMetrics
