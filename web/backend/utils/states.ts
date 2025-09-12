import type { Mode } from '../schemas/index.ts'

export const checkRecordState = ({ from, to }: { from: Mode | undefined, to: Mode }): boolean => (from === undefined && to === 'start') || (from === 'start' && to === 'stop') || (from === 'stop' && to === 'start')
