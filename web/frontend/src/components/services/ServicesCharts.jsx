import React, { useEffect, useState } from 'react'
import typographyStyles from '~/styles/Typography.module.css'
import commonStyles from '~/styles/CommonStyles.module.css'
import styles from './ServicesCharts.module.css'
import { BLACK_RUSSIAN, MEDIUM, TRANSPARENT, WHITE } from '@platformatic/ui-components/src/components/constants'
import Icons from '@platformatic/ui-components/src/components/icons'
import useAdminStore from '~/useAdminStore'
import ServicesSelectorForCharts from './ServicesSelectorForCharts'
import { BorderedBox } from '@platformatic/ui-components'
import ServicesMetrics from '~/components/metrics/ServicesMetrics'
import { POD_SERVICES_PATH } from '~/ui-constants'

const ServicesCharts = React.forwardRef(({ _ }, ref) => {
  const globalState = useAdminStore()
  const { setCurrentPage } = globalState
  const [showAggregatedMetrics, setShowAggregatedMetrics] = useState(true)
  const [services, setServices] = useState([])
  const [serviceSelected, setServiceSelected] = useState({})

  useEffect(() => {
    setCurrentPage(POD_SERVICES_PATH)
  }, [])

  useEffect(() => {
    if ((services.length === 0)) {
      const orderedServices = getOrderedServices()
      setServices(orderedServices)
      setServiceSelected(orderedServices.length > 0 ? orderedServices[0] : {})
    }
  }, [services])

  function getOrderedServices () {
    // FIXME@backend get dynamic data
    return [
      { id: 'service-1', name: 'Service 1', entrypoint: true },
      { id: 'service-2', name: 'Service 2', entrypoint: false },
      { id: 'service-3', name: 'Service 3', entrypoint: false }
    ]
  }

  return (
    <div className={styles.podServicesContainer} ref={ref}>
      <div className={styles.podServicesContent}>
        <div className={`${commonStyles.miniFlexBlock} ${commonStyles.fullWidth}`}>
          <div className={`${commonStyles.tinyFlexRow} ${commonStyles.fullWidth}`}>
            <Icons.NodeJSMetricsIcon
              color={WHITE}
              size={MEDIUM}
            />
            <p className={`${typographyStyles.desktopBodyLargeSemibold} ${typographyStyles.textWhite} `}>NodeJS Metrics</p>
          </div>
        </div>

        <BorderedBox color={TRANSPARENT} backgroundColor={BLACK_RUSSIAN} classes={styles.borderedBoxContainerPodServices}>
          <div className={`${commonStyles.smallFlexRow} ${commonStyles.itemsStart}`}>
            <ServicesSelectorForCharts
              key={serviceSelected.id}
              services={services}
              serviceSelected={serviceSelected}
              handleClickService={(service) => setServiceSelected(service)}
              showAggregatedMetrics={showAggregatedMetrics}
              handleChangeShowAggregateMetrics={() => setShowAggregatedMetrics(!showAggregatedMetrics)}
            />
            <ServicesMetrics
              serviceId={serviceSelected.id}
              showAggregatedMetrics={showAggregatedMetrics}
            />
          </div>
        </BorderedBox>
      </div>
    </div>
  )
})

export default ServicesCharts
