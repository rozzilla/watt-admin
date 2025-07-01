import { GetRuntimesPidServicesResponseOK } from './client/backend-types'

export type ServiceData = GetRuntimesPidServicesResponseOK['services'][number] & { selected?: boolean }
