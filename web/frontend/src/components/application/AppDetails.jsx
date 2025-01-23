import React, { useState } from 'react'
import styles from './AppDetails.module.css'
import AppNameBox from './AppNameBox'
import ServicesBox from './ServicesBox'
import ErrorComponent from '~/components/errors/ErrorComponent'
import NodeJSMetrics from './NodeJSMetrics'

const AppDetails = React.forwardRef(({ _ }, ref) => {
  const [showErrorComponent, setShowErrorComponent] = useState(false)
  const [error, setError] = useState(false)

  // FIXME@backend get dynamic data
  const [applicationPublicUrl] = useState('to-be-updated!')

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
              applicationPublicUrl={applicationPublicUrl}
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
