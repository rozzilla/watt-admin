import { describe, it, expect, beforeEach } from 'vitest'
import useAdminStore from '../src/useAdminStore'

describe('useAdminStore', () => {
  beforeEach(() => {
    useAdminStore.setState({
      breadCrumbs: [],
      currentPage: '',
      runtimePid: undefined,
      currentWindowWidth: 0,
    })
  })

  it('should initialize with default state', () => {
    const state = useAdminStore.getState()
    expect(state.breadCrumbs).toEqual([])
    expect(state.currentPage).toBe('')
    expect(state.runtimePid).toBeUndefined()
    expect(state.currentWindowWidth).toBe(0)
  })

  it('should set runtime PID', () => {
    useAdminStore.getState().setRuntimePid(12345)
    expect(useAdminStore.getState().runtimePid).toBe(12345)
  })

  it('should set navigation with default level', () => {
    useAdminStore.getState().setNavigation({ key: 'home', label: 'Home', page: '/home' })
    expect(useAdminStore.getState().breadCrumbs).toEqual([{ key: 'home', label: 'Home', page: '/home' }])
  })

  it('should set navigation with specified level', () => {
    useAdminStore.getState().setNavigation({ key: 'home', label: 'Home', page: '/home' })
    useAdminStore.getState().setNavigation({ key: 'services', label: 'Services', page: '/services' })
    useAdminStore.getState().setNavigation({ key: 'details', label: 'Details', page: '/details' })
    expect(useAdminStore.getState().breadCrumbs).toEqual([{ key: 'details', label: 'Details', page: '/details' }])
  })

  it('should set current page', () => {
    useAdminStore.getState().setCurrentPage('Dashboard')
    expect(useAdminStore.getState().currentPage).toBe('Dashboard')
  })

  it('should set window width', () => {
    useAdminStore.getState().setCurrentWindowWidth(1024)
    expect(useAdminStore.getState().currentWindowWidth).toBe(1024)
  })
})
