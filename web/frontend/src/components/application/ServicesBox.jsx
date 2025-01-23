import React from 'react'
import PropTypes from 'prop-types'
import { OPACITY_100, OPACITY_15, RICH_BLACK, WHITE, TRANSPARENT, MEDIUM, SMALL, BLACK_RUSSIAN } from '@platformatic/ui-components/src/components/constants'
import styles from './ServicesBox.module.css'
import typographyStyles from '~/styles/Typography.module.css'
import commonStyles from '~/styles/CommonStyles.module.css'
import { BorderedBox } from '@platformatic/ui-components'
import Icons from '@platformatic/ui-components/src/components/icons'

function Service ({ id, entrypoint, type }) {
  return (
    <div className={`${commonStyles.tinyFlexRow} ${commonStyles.fullWidth} ${commonStyles.flexGrow}`}>
      <BorderedBox
        classes={`${styles.servicePadding}`}
        color={TRANSPARENT}
        backgroundColor={RICH_BLACK}
        backgroundColorOpacity={OPACITY_100}
        internalOverHandling
        backgroundColorOpacityOver={OPACITY_15}
        backgroundColorOver={WHITE}
        clickable
        onClick={() => console.log('to be implemented!')}
      >
        <div className={`${commonStyles.tinyFlexRow} ${commonStyles.fullWidth} ${commonStyles.flexGrow}`}>
          <div className={`${commonStyles.tinyFlexRow} ${commonStyles.fullWidth}`}>
            {
              entrypoint
                ? <Icons.EntrypointIcon
                    color={WHITE}
                    size={SMALL}
                  />
                : <Icons.ServiceIcon
                    color={WHITE}
                    size={SMALL}
                  />
            }
            <span className={`${typographyStyles.textWhite} ${commonStyles.bold}`}>{id}</span>
            {entrypoint &&
              <span className={`${typographyStyles.desktopBodySmallest} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}>(Application Entrypoint)</span>}

            <span className={`${typographyStyles.desktopBodySmallest} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}> | &nbsp; Service Type: {type}</span>
          </div>
          <div className={`${styles.w45} ${typographyStyles.desktopBodySmallest} ${typographyStyles.textWhite} ${typographyStyles.opacity70}`}>Test it</div>
          <Icons.InternalLinkIcon className={`${typographyStyles.opacity70}`} color={WHITE} size={SMALL} />
        </div>
      </BorderedBox>
    </div>
  )
}

function ServicesBox ({
  gridClassName = ''
}) {
  return (
    <BorderedBox classes={`${styles.borderexBoxContainer} ${gridClassName}`} backgroundColor={BLACK_RUSSIAN} color={TRANSPARENT}>
      <div className={`${commonStyles.smallFlexBlock} ${commonStyles.fullWidth}`}>
        <div className={`${commonStyles.smallFlexRow} ${commonStyles.fullWidth} ${commonStyles.justifyBetween}`}>
          <div className={`${commonStyles.tinyFlexRow} ${commonStyles.fullWidth}`}>
            <Icons.ServiceIcon
              color={WHITE}
              size={MEDIUM}
            />
            <div className={styles.applicationName}>
              <p className={`${typographyStyles.desktopBodySemibold} ${typographyStyles.textWhite} ${typographyStyles.ellipsis}`}>Services</p>
            </div>
          </div>
        </div>
        <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
          {/* // FIXME@backend get dynamic data */}
          {[
            { id: 'Service-1', entrypoint: true, type: 'next' },
            { id: 'Service-2', entrypoint: false, type: 'Composer' },
            { id: 'Service-3', entrypoint: false, type: 'next' }
          ].map(service => <Service
            key={`${service.id}-$${service.selected}`}
            {...service}
                           />)}
        </div>
      </div>
    </BorderedBox>
  )
}

ServicesBox.propTypes = {
  /**
   * gridClassName
    */
  gridClassName: PropTypes.string
}

export default ServicesBox
