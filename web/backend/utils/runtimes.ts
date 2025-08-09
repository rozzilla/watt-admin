import { Runtime } from '@platformatic/control'
import { SelectableRuntime } from '../schemas'

export const getSelectableRuntimes = (runtimes: Runtime[], includeAdmin: boolean) => {
  const selectableRuntimes: SelectableRuntime[] = []
  for (const runtime of runtimes) {
    if (!includeAdmin && runtime.packageName === 'watt-admin') {
      continue
    }

    let selected = true
    if (process.env.SELECTED_RUNTIME) {
      selected = process.env.SELECTED_RUNTIME === runtime.pid.toString()
    }

    selectableRuntimes.push({ ...runtime, packageName: runtime.packageName || '', packageVersion: runtime.packageVersion || '', url: runtime.url || '', selected })
  }
  return selectableRuntimes
}
