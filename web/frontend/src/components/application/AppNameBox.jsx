import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { WHITE, TRANSPARENT, SMALL, BLACK_RUSSIAN, MEDIUM } from '@platformatic/ui-components/src/components/constants'
import styles from './AppNameBox.module.css'
import typographyStyles from '~/styles/Typography.module.css'
import commonStyles from '~/styles/CommonStyles.module.css'
import { BorderedBox, Button, PlatformaticIcon } from '@platformatic/ui-components'
import { getFormattedDate } from '~/utilities/dates'
import { STATUS_STOPPED, STATUS_RUNNING } from '~/ui-constants'
import Icons from '@platformatic/ui-components/src/components/icons'
import ApplicationStatusPills from '~/components/ui/ApplicationStatusPills'
import useAdminStore from '~/useAdminStore'
import { restartApiApplication, getApiApplication } from '../../api'

function AppNameBox ({
  onErrorOccurred = () => {},
  gridClassName = '',
  applicationPublicUrl = ''
}) {
  const globalState = useAdminStore()
  const { appStatus, setAppStatus } = globalState
  const [changingRestartStatus, setChangingRestartStatus] = useState(false)
  const [applicationSelected, setApplicationSelected] = useState({})

  useEffect(() => {
    // FIXME@backend get dynamic data
    setAppStatus(STATUS_RUNNING)
    setApplicationSelected(getApiApplication())
  }, [])

  async function handleRestartApplication () {
    try {
      setChangingRestartStatus(true)
      await restartApiApplication(applicationSelected.id)
    } catch (error) {
      console.error(`Error on handleRestartApplication ${error}`)
      onErrorOccurred(error)
    } finally {
      setChangingRestartStatus(false)
    }
  }

  return applicationSelected && (
    <BorderedBox classes={`${styles.borderexBoxContainer} ${gridClassName}`} backgroundColor={BLACK_RUSSIAN} color={TRANSPARENT}>
      <div className={`${commonStyles.smallFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.smallFlexResponsiveRow} ${commonStyles.fullWidth}`}>
          <div className={`${commonStyles.tinyFlexResponsiveRow} ${commonStyles.fullWidth}`}>
            <div className={commonStyles.tinyFlexRow}>
              <Icons.AppIcon
                color={WHITE}
                size={MEDIUM}
              />
              <div className={styles.applicationName}>
                <p className={`${typographyStyles.desktopBodyLargeSemibold} ${typographyStyles.textWhite} ${typographyStyles.ellipsis}`}>{applicationSelected.name}</p>
              </div>
            </div>
            {appStatus && <ApplicationStatusPills status={appStatus} />}
          </div>
          <div className={styles.buttonContainer}>
            {changingRestartStatus
              ? (
                <Button
                  type='button'
                  label='Restarting...'
                  onClick={() => {}}
                  color={WHITE}
                  backgroundColor={TRANSPARENT}
                  paddingClass={commonStyles.smallButtonPadding}
                  platformaticIcon={{ iconName: 'RestartIcon', color: WHITE }}
                  textClass={typographyStyles.desktopButtonSmall}
                />
                )
              : (
                <Button
                  type='button'
                  label='Restart'
                  onClick={() => handleRestartApplication()}
                  color={WHITE}
                  backgroundColor={TRANSPARENT}
                  paddingClass={commonStyles.smallButtonPadding}
                  platformaticIcon={{ iconName: 'RestartIcon', color: WHITE }}
                  textClass={typographyStyles.desktopButtonSmall}
                  disabled={!appStatus || appStatus === STATUS_STOPPED}
                />
                )}

          </div>
        </div>
        <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth} ${styles.appInnerBox}`}>
          <div className={styles.rowContainer}>
            <div className={`${commonStyles.tinyFlexRow} ${commonStyles.itemsCenter}`}>
              <span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}>Last Started:</span>
              <span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite}`}>{getFormattedDate(applicationSelected.lastStarted)}</span>
            </div>
          </div>
          <div className={styles.rowContainer}>
            <div className={`${commonStyles.smallFlexResponsiveRow}`}>
              {!applicationSelected.pltVersion
                ? (<span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}>Current Runtime Version: -</span>)
                : (
                  <>
                    <div className={`${commonStyles.tinyFlexRow} ${commonStyles.itemsCenter}`}>
                      <span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}>Current Runtime Version: </span>
                      {applicationSelected.pltVersion
                        ? (
                          <>
                            <span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWarningYellow}`}>{applicationSelected.pltVersion}</span>
                          </>)
                        : (<span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}>-</span>)}
                    </div>
                  </>
                  )}
            </div>
          </div>

          <div className={styles.rowContainer}>
            <div className={`${commonStyles.tinyFlexRow} ${commonStyles.itemsCenter}`}>
              <span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}>URL:</span>
              <span className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite}`}>{applicationPublicUrl} </span>
              <PlatformaticIcon iconName='ExpandIcon' color={WHITE} size={SMALL} onClick={() => window.open(applicationPublicUrl, '_blank')} internalOverHandling disabled={applicationPublicUrl === ''} />
            </div>
          </div>
        </div>
      </div>
    </BorderedBox>
  )
}

AppNameBox.propTypes = {
  /**
   * onErrorOccurred
    */
  onErrorOccurred: PropTypes.func,
  /**
   * gridClassName
    */
  gridClassName: PropTypes.string,
  /**
   * applicationPublicUrl
    */
  applicationPublicUrl: PropTypes.string
}

export default AppNameBox
