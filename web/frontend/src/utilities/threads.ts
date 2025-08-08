export type ThreadIndex = number | 'all'

export const getThreadName = (idx: ThreadIndex): string => idx === 'all' ? 'All Threads' : `Thread-${idx}`

export const hasMultipleWorkers = (workers?: number): workers is number => workers ? workers > 1 : false
