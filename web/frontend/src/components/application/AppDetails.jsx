import React, { useState, useEffect } from 'react'
import styles from './AppDetails.module.css'
import AppNameBox from './AppNameBox'
import ServicesBox from './ServicesBox'
import ErrorComponent from '~/components/errors/ErrorComponent'
import NodeJSMetrics from './NodeJSMetrics'
import { getApiApplication } from '../../api'

const AppDetails = React.forwardRef(({ _ }, ref) => {
  const [showErrorComponent, setShowErrorComponent] = useState(false)
  const [error, setError] = useState(false)
  const [apiApplication, setApiApplication] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getApiApplication()
        setApiApplication(response)
      } catch (error) {
        console.error('Error getting api application:', error)
      }
    }
    fetchData()
  }, [])

  if (showErrorComponent) {
    return <ErrorComponent error={error} message={error.message} onClickDismiss={() => setShowErrorComponent(false)} />
  }

  return (
    <div className={styles.container} ref={ref}>
      <div className={styles.containerElement}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <AppNameBox
              gridClassName={styles.appNameBox}
              onErrorOccurred={(error) => {
                setError(error)
                setShowErrorComponent(true)
              }}
              apiApplication={apiApplication}
            />
            <NodeJSMetrics
              gridClassName={styles.nodeJsMetricsBox}
            />
          </div>
          <div className={styles.rightSection}>
            <ServicesBox
              gridClassName={styles.servicesBox}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

export default AppDetails
