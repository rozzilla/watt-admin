import type { RequestDataPoint } from '../schemas/index.ts'

export const getReqRps = (count: number, req: RequestDataPoint[]) => Math.abs(count - (req[req.length - 1]?.count || 0))
