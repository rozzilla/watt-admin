import styles from './ServicesFlamegraph.module.css'
import React, { useEffect, useState } from 'react'
import { FullFlameGraph, type Profile } from 'react-pprof'
import useAdminStore from '../../useAdminStore'
import { POD_FLAMEGRAPH_PATH } from '../../ui-constants'
import { getResource } from '../../api'

const ServicesFlamegraph: React.FC = () => {
  const { setCurrentPage } = useAdminStore()
  const [profile, setProfile] = useState<Profile>()

  useEffect(() => {
    setCurrentPage(POD_FLAMEGRAPH_PATH)
  }, [])

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setProfile(await getResource())
    }
    fetchData()
  }, [])

  return (
    profile &&
      <div className={styles.fullFlamegraph}>
        <FullFlameGraph
          profile={profile}
          showHottestFrames
          showControls
          showStackDetails
        />
      </div>
  )
}

export default ServicesFlamegraph
