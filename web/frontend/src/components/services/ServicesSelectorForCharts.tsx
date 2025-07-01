import React, { useState } from 'react'
import typographyStyles from '../../styles/Typography.module.css'
import commonStyles from '../../styles/CommonStyles.module.css'
import styles from './ServicesSelector.module.css'
import { OPACITY_100, OPACITY_15, OPACITY_30, RICH_BLACK, SMALL, TRANSPARENT, WHITE } from '@platformatic/ui-components/src/components/constants'
import { Icons, BorderedBox, Forms } from '@platformatic/ui-components'
import { ServiceData } from 'src/types'
import { getServiceEntrypoint, getServiceWorkers } from '../../utilities/getters'

export type ThreadIndex = number | 'all'

type ServiceProps = {
  service: ServiceData
  isSelected: boolean;
  selectedThread?: ThreadIndex;
  onClickService: () => void;
  onSelectThread: (threadIndex: ThreadIndex) => void;
}

export const getThreadName = (idx: ThreadIndex): string => idx === 'all' ? 'All Threads' : `Thread-${idx}`

export const hasMultipleWorkers = (workers?: number): workers is number => workers ? workers > 1 : false

function Service ({
  service,
  isSelected,
  onClickService,
  selectedThread = 'all',
  onSelectThread
}: ServiceProps): React.ReactElement {
  const [selected] = useState(isSelected)
  const workers = getServiceWorkers(service)
  const multipleWorkers = hasMultipleWorkers(getServiceWorkers(service))
  const showAllThreads = () => {
    const allThreads = []
    if (multipleWorkers) {
      for (let i = 0; i <= workers; i++) {
        const index = i === 0 ? 'all' : i
        allThreads.push(
          <div
            key={index}
            className={`${commonStyles.fullWidth} ${commonStyles.justifyBetween} ${styles.workerThreads} ${typographyStyles.opacity70} ${selectedThread === index && styles.selectedThread}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelectThread(index)
            }}
          >
            {getThreadName(index)}
          </div>)
      }
    }
    return allThreads
  }

  return (
    <BorderedBox
      classes={styles.boxService}
      color={TRANSPARENT}
      backgroundColor={selected && !multipleWorkers ? WHITE : RICH_BLACK}
      backgroundColorOpacity={selected && !multipleWorkers ? OPACITY_30 : OPACITY_100}
      internalOverHandling
      backgroundColorOpacityOver={(!selected || !multipleWorkers) && OPACITY_15}
      backgroundColorOver={(!selected || !multipleWorkers) && WHITE}
      clickable
      onClick={() => onClickService()}
    >
      <div className={`${commonStyles.miniFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.tinyFlexRow} ${commonStyles.fullWidth} ${commonStyles.justifyBetween}`}>
          <div className={`${commonStyles.tinyFlexRow} ${commonStyles.fullWidth}`}>
            <span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite}`}>{service.id}</span>
            {getServiceEntrypoint(service) &&
              <span className={`${typographyStyles.desktopBodySmallest} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}>(Entrypoint)</span>}
          </div>
          {multipleWorkers && (selected ? <span><Icons.ArrowDownIcon color={WHITE} size={SMALL} /></span> : <span className={`${typographyStyles.opacity70}`}><Icons.ArrowRightIcon color={WHITE} size={SMALL} /></span>)}
        </div>
        {multipleWorkers && selected && (<div className={`${commonStyles.fullWidth}`}>{showAllThreads()}</div>)}
      </div>
    </BorderedBox>
  )
}

interface ServicesSelectorForChartsProps {
  services: ServiceData[];
  showAggregatedMetrics?: boolean;
  handleClickService: (service: ServiceData) => void;
  handleClickThread: (threadIndex: ThreadIndex) => void;
  handleChangeShowAggregateMetrics: () => void;
  serviceSelected: ServiceData;
}

function ServicesSelectorForCharts ({
  services,
  handleClickService,
  handleClickThread,
  showAggregatedMetrics = true,
  handleChangeShowAggregateMetrics,
  serviceSelected
}: ServicesSelectorForChartsProps): React.ReactElement {
  const [selectedThread, setSelectedThread] = useState<ThreadIndex>('all')

  const handleThreadSelection = (threadIndex: ThreadIndex) => {
    setSelectedThread(threadIndex)
    handleClickThread(threadIndex)
  }

  return (
    <div className={`${commonStyles.smallFlexBlock} ${commonStyles.fullWidth} ${styles.servicesContainer}`}>
      {services.length > 1 &&
        <Forms.ToggleSwitch
          label='Show Aggregated Metrics'
          labelClassName={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite}`}
          name='showAggregatedMetrics'
          onChange={() => handleChangeShowAggregateMetrics()}
          checked={showAggregatedMetrics}
          size={SMALL}
        />}
      <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
        {services.map(service => {
          const isSelected = serviceSelected.id === service.id
          return (
            <Service
              key={`${service.id}-$${service.selected}`}
              service={service}
              isSelected={isSelected}
              onClickService={() => handleClickService(service)}
              selectedThread={isSelected ? selectedThread : 'all'}
              onSelectThread={(threadIndex) => handleThreadSelection(threadIndex)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default ServicesSelectorForCharts
