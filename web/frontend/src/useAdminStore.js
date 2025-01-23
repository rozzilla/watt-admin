import { create } from 'zustand'

const initialState = {
  breadCrumbs: [],
  currentPage: '',
  applicationSelected: null,
  appStatus: '',
  currentWindowWidth: 0
}

const useAdminStore = create((set, get) => ({
  ...initialState,
  computed: {
    get getApplicationSelectedServices () {
      const services = get().applicationSelected?.state?.services ?? []
      if (services.length === 0) { return services }
      return services.filter(service => service.entrypoint).concat(services.filter(service => !service.entrypoint))
    }
  },
  setNavigation: (item, level = 0) => {
    set((state) => {
      const currentBreadcrumbs = state.breadCrumbs.slice(0, level)
      currentBreadcrumbs.push(item)
      return {
        ...state,
        breadCrumbs: currentBreadcrumbs
      }
    })
  },
  setCurrentPage: (page) => {
    set((state) => {
      return {
        ...state,
        currentPage: page
      }
    })
  },
  setCurrentWindowWidth: (width) => {
    set((state) => {
      return {
        ...state,
        currentWindowWidth: width
      }
    })
  },
  setApplicationSelected: (applicationSelected) => {
    set((state) => {
      return {
        ...state,
        applicationSelected
      }
    })
  },
  setAppStatus: (appStatus) => {
    set((state) => {
      return {
        ...state,
        appStatus
      }
    })
  }
}))

export default useAdminStore
