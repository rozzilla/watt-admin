import type { GetRuntimesPidServicesResponseOK } from './client/backend-types'

export type ServiceData = NonNullable<GetRuntimesPidServicesResponseOK['applications']>[number] & { selected?: boolean }
