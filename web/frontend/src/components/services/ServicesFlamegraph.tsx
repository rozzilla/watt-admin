import commonStyles from '../../styles/CommonStyles.module.css'
import styles from './ServicesFlamegraph.module.css'
import React, { useEffect, useState } from 'react'
import { FullFlameGraph, type Profile } from 'react-pprof'
import useAdminStore from '../../useAdminStore'
import { POD_FLAMEGRAPH_PATH } from '../../ui-constants'
import { BorderedBox } from '@platformatic/ui-components'
import { BLACK_RUSSIAN, TRANSPARENT } from '@platformatic/ui-components/src/components/constants'
import ServicesSelectorForCharts from './ServicesSelectorForCharts'
import { getResource, getServices, getType, type Type } from '../../api'
import type { ServiceData } from '../../types'

const ServicesFlamegraph: React.FC = () => {
  const { setCurrentPage, runtimePid, mode } = useAdminStore()
  const [profile, setProfile] = useState<Profile>()
  const [services, setServices] = useState<ServiceData[]>([])
  const [serviceSelected, setServiceSelected] = useState<ServiceData>({ id: '', status: '' })
  const [type, setType] = useState<Type>('cpu')

  useEffect(() => {
    setCurrentPage(POD_FLAMEGRAPH_PATH)
  }, [])

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (runtimePid) {
        const response = await getServices(runtimePid, mode)
        setServices(response)
        setServiceSelected(response[0])
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setProfile(await getResource(serviceSelected.id))
      setType(getType())
    }
    fetchData()
  }, [serviceSelected])

  return (
    <div className={styles.podServicesContainer}>
      <div className={styles.podServicesContent}>
        <BorderedBox color={TRANSPARENT} backgroundColor={BLACK_RUSSIAN} classes={styles.borderedBoxContainerPodServices}>
          <div className={`${commonStyles.smallFlexRow} ${commonStyles.itemsStart}`}>
            <ServicesSelectorForCharts
              key={serviceSelected.id}
              services={services}
              serviceSelected={serviceSelected}
              handleClickService={setServiceSelected}
              displayAggregatedMetrics={false}
            />
            {profile &&
              <div className={styles.fullFlamegraph}>
                <FullFlameGraph
                  profile={profile}
                  showHottestFrames
                  showControls
                  showStackDetails
                  primaryColor={type === 'heap' ? '#2563eb' : '#ff4444'}
                  secondaryColor={type === 'heap' ? '#7dd3fc' : '#ffcc66'}
                  backgroundColor={type === 'heap' ? '#2c3e50' : '#1e1e1e'}
                  textColor='#ffffff'
                />
              </div>}
          </div>
        </BorderedBox>
      </div>
    </div>
  )
}

export default ServicesFlamegraph
