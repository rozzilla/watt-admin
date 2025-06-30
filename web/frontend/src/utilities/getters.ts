import { ServiceData } from 'src/types'

export const getServiceSelected = (service: ServiceData): boolean => 'selected' in service ? !!service.selected : false

export const getServiceWorkers = (service: ServiceData): number => 'workers' in service ? (service.workers ? service.workers : 0) : 0
