import React, { useState, useEffect, useRef } from 'react'
import { RICH_BLACK, WHITE, TRANSPARENT, MARGIN_0, OPACITY_15 } from '@platformatic/ui-components/src/components/constants'
import styles from './AppLogs.module.css'
import typographyStyles from '~/styles/Typography.module.css'
import commonStyles from '~/styles/CommonStyles.module.css'
import { BorderedBox, Button, HorizontalSeparator } from '@platformatic/ui-components'
import ErrorComponent from '~/components/errors/ErrorComponent'
import Log from './Log'
import {
  PRETTY,
  RAW,
  DIRECTION_UP,
  DIRECTION_DOWN,
  DIRECTION_STILL,
  DIRECTION_TAIL,
  STATUS_PAUSED_LOGS,
  STATUS_RESUMED_LOGS
} from '~/ui-constants'
import LogFilterSelector from './LogFilterSelector'
import useOnScreen from '~/hooks/useOnScreen'

const AppLogs = React.forwardRef(({ filteredServices }, ref) => {
  const [displayLog, setDisplayLog] = useState(PRETTY)
  const [filterLogsByLevel, setFilterLogsByLevel] = useState('')
  const [scrollDirection, setScrollDirection] = useState(DIRECTION_TAIL)

  // FIXME@backend get dynamic data
  const [applicationLogs] = useState([
    JSON.stringify({
      level: 30,
      time: new Date().toISOString(),
      pid: 1234,
      name: 'api-gateway',
      msg: 'Server listening on port 3000',
      hostname: 'pod-1234'
    }),
    JSON.stringify({
      level: 40,
      time: new Date().toISOString(),
      pid: 1234,
      name: 'user-service',
      msg: 'High CPU usage detected',
      hostname: 'pod-1234',
      reqId: 'abc123xyz789'
    }),
    JSON.stringify({
      level: 50,
      time: new Date().toISOString(),
      pid: 1235,
      name: 'auth-service',
      msg: 'Database connection failed',
      hostname: 'pod-1234',
      reqId: 'def456uvw321'
    }),
    JSON.stringify({
      level: 30,
      time: new Date().toISOString(),
      pid: 1236,
      name: 'notification-service',
      msg: 'Email notification sent successfully',
      hostname: 'pod-1234',
      req: {
        method: 'POST',
        url: '/api/notifications/email'
      }
    }),
    JSON.stringify({
      level: 20,
      time: new Date().toISOString(),
      pid: 1237,
      name: 'payment-service',
      msg: 'Processing payment transaction',
      hostname: 'pod-1234',
      reqId: 'ghi789rst654',
      req: {
        method: 'POST',
        url: '/api/payments/process'
      }
    })
  ])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [filtersInitialized, setFiltersInitialized] = useState(false)
  const logContentRef = useRef()
  const [lastScrollTop, setLastScrollTop] = useState(0)
  const [displayGoToBottom, setDisplayGoToBottom] = useState(false)
  const [showPreviousLogs] = useState(false)
  const [statusPausedLogs, setStatusPausedLogs] = useState('')
  const [filteredLogsLengthAtPause, setFilteredLogsLengthAtPause] = useState(0)
  const bottomRef = useRef()
  const isBottomOnScreen = useOnScreen(bottomRef)
  const [showErrorComponent, setShowErrorComponent] = useState(false)
  const [error] = useState(false)

  useEffect(() => {
    if (logContentRef.current && scrollDirection === DIRECTION_TAIL && filteredLogs.length > 0) {
      logContentRef.current.scrollTo({
        top: logContentRef.current.scrollHeight,
        left: 0,
        behavior: 'smooth'
      })
      if (statusPausedLogs === STATUS_PAUSED_LOGS) {
        setStatusPausedLogs(STATUS_RESUMED_LOGS)
      }
    }
    if (scrollDirection !== DIRECTION_TAIL) {
      setFilteredLogsLengthAtPause(filteredLogs.length)
    }
  }, [logContentRef, scrollDirection, filteredLogs])

  useEffect(() => {
    if (statusPausedLogs) {
      switch (statusPausedLogs) {
        case STATUS_PAUSED_LOGS:
          // callApiPauseLogs()
          console.log('pause TODO')
          break

        case STATUS_RESUMED_LOGS:
          console.log('resume TODO')
          // callApiResumeLogs()
          break

        default:
          break
      }
    }
  }, [statusPausedLogs])

  useEffect(() => {
    if (isBottomOnScreen && scrollDirection === DIRECTION_DOWN) {
      resumeScrolling()
    }
  }, [isBottomOnScreen, scrollDirection])

  useEffect(() => {
    if (applicationLogs.length > 0) {
      if (!filtersInitialized) {
        setFilterLogsByLevel(30)
        setFiltersInitialized(true)
        return
      }
      if (filterLogsByLevel || filteredServices.length >= 0) {
        let founds = [...applicationLogs]
        if (filterLogsByLevel) {
          founds = founds.filter(log => JSON.parse(log).level >= filterLogsByLevel)
        }
        if (filteredServices.length >= 0) {
          founds = founds.filter(log => filteredServices.includes(JSON.parse(log).name))
        }
        setFilteredLogs(founds)
      } else {
        setFilteredLogs([...applicationLogs])
      }
    }
  }, [
    applicationLogs,
    filtersInitialized,
    filterLogsByLevel,
    filteredServices
  ])

  useEffect(() => {
    if (scrollDirection !== DIRECTION_TAIL && filteredLogsLengthAtPause > 0 && filteredLogsLengthAtPause < filteredLogs.length) {
      setDisplayGoToBottom(true)
    }
  }, [scrollDirection, filteredLogs.length, filteredLogsLengthAtPause])

  function resumeScrolling () {
    setScrollDirection(DIRECTION_TAIL)
    setDisplayGoToBottom(false)
    setFilteredLogsLengthAtPause(0)
  }

  async function loadPreviousLogs () {
  }

  /* function onlyUnique (value, index, array) {
    return array.indexOf(value) === index
  } */

  function saveLogs () {
    let fileData = ''
    applicationLogs.forEach(log => {
      fileData += `${log}
`
    })

    const blob = new Blob([fileData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${new Date().toISOString()}.logs`
    link.href = url
    link.target = '_blank'
    link.click()
  }

  function handlingClickArrow () {
    setScrollDirection(DIRECTION_STILL)
    setFilteredLogsLengthAtPause(filteredLogs.length)
  }

  function renderLogs () {
    if (displayLog === PRETTY) {
      return filteredLogs.map((log, index) => <Log key={`${index}-${filterLogsByLevel}`} log={log} display={displayLog} onClickArrow={() => handlingClickArrow()} />)
    }

    return (
      <span className={`${typographyStyles.desktopOtherCliTerminalSmall} ${typographyStyles.textWhite}`}>
        {filteredLogs}
      </span>
    )
  }

  function handleScroll (event) {
    // setStatusPausedLogs(STATUS_PAUSED_LOGS)
    const st = event.currentTarget.scrollTop // Credits: "https://github.com/qeremy/so/blob/master/so.dom.js#L426"
    if (st > lastScrollTop) {
      // downscroll code
      if (scrollDirection !== DIRECTION_TAIL) {
        setScrollDirection(DIRECTION_DOWN)
      }
    } else if (st < lastScrollTop) {
      // upscroll code
      setScrollDirection(DIRECTION_UP)
    }
    setLastScrollTop(st <= 0 ? 0 : st)
  }

  if (showErrorComponent) {
    return <ErrorComponent error={error} onClickDismiss={() => setShowErrorComponent(false)} />
  }

  return (
    <div className={styles.container} ref={ref}>
      <div className={styles.content}>
        <div className={`${commonStyles.largeFlexBlock} ${commonStyles.fullWidth} ${styles.flexGrow}`}>
          <BorderedBox classes={styles.borderexBoxPodContainer} backgroundColor={RICH_BLACK} color={TRANSPARENT}>
            <div className={`${commonStyles.tinyFlexRow} ${commonStyles.itemsCenter} ${commonStyles.justifyBetween} ${styles.lateralPadding} ${styles.top}`}>
              <span className={styles.select}>&nbsp;</span>
              <LogFilterSelector defaultLevelSelected={30} onChangeLevelSelected={(level) => setFilterLogsByLevel(level)} />
              <div className={`${commonStyles.tinyFlexRow} ${commonStyles.justifyEnd} ${styles.buttonContainer}`}>
                <Button
                  type='button'
                  paddingClass={commonStyles.smallButtonPadding}
                  label='Pretty'
                  onClick={() => setDisplayLog(PRETTY)}
                  color={WHITE}
                  backgroundColor={RICH_BLACK}
                  selected={displayLog === PRETTY}
                  textClass={typographyStyles.desktopButtonSmall}
                />
                <Button
                  type='button'
                  paddingClass={commonStyles.smallButtonPadding}
                  label='Raw'
                  onClick={() => setDisplayLog(RAW)}
                  color={WHITE}
                  backgroundColor={TRANSPARENT}
                  selected={displayLog === RAW}
                  textClass={typographyStyles.desktopButtonSmall}
                />
              </div>
            </div>
            <HorizontalSeparator marginBottom={MARGIN_0} color={WHITE} opacity={OPACITY_15} />
            <div className={`${styles.logsContainer} ${styles.lateralPadding}`} ref={logContentRef} onScroll={handleScroll}>
              {showPreviousLogs && (
                <div className={styles.previousLogContainer}>
                  <p className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite} ${typographyStyles.textCenter} ${commonStyles.fullWidth} `}><span className={`${commonStyles.cursorPointer} ${typographyStyles.textTertiaryBlue}`} onClick={() => loadPreviousLogs()}>Click Here</span> to load previous logs</p>
                </div>
              )}

              {filteredLogs?.length > 0 && (
                <>
                  <hr className={styles.logDividerTop} />
                  {renderLogs()}
                </>
              )}
              <div ref={bottomRef} className={styles.logDividerBottom} />
            </div>
            <HorizontalSeparator marginTop={MARGIN_0} color={WHITE} opacity={OPACITY_15} />
            <div className={`${commonStyles.tinyFlexRow} ${commonStyles.itemsCenter} ${commonStyles.justifyBetween} ${styles.lateralPadding} ${styles.bottom}`}>
              <div>&nbsp;</div>

              {displayGoToBottom
                ? (
                  <p className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textWhite}`}>There are new logs. <span className={`${commonStyles.cursorPointer} ${typographyStyles.textTertiaryBlue}`} onClick={() => resumeScrolling()}>Go to the bottom</span> to resume</p>
                  )
                : (
                  <p className={`${typographyStyles.desktopBodySmall} ${typographyStyles.textRichBlack}`}>There are new logs. Go to the bottom to resume</p>
                  )}
              <Button
                type='button'
                paddingClass={commonStyles.smallButtonPadding}
                label='Save Logs'
                onClick={() => saveLogs()}
                color={WHITE}
                backgroundColor={TRANSPARENT}
                textClass={typographyStyles.desktopButtonSmall}
              />
            </div>

          </BorderedBox>
        </div>
      </div>
    </div>
  )
})

export default AppLogs
