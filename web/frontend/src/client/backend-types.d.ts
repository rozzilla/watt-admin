export interface FullResponse<T, U extends number> {
  'statusCode': U;
  'headers': object;
  'body': T;
}

export type GetRuntimesRequest = {
  query?: {
    'includeAdmin'?: boolean;
  }
}

export type GetRuntimesResponseOK = unknown
export type GetRuntimesResponses =
  FullResponse<GetRuntimesResponseOK, 200>

export type GetRuntimesPidMetricsRequest = {
  path: {
    'pid': number;
  }
}

export type GetRuntimesPidMetricsResponseOK = unknown
export type GetRuntimesPidMetricsResponses =
  FullResponse<GetRuntimesPidMetricsResponseOK, 200>

export type GetRuntimesPidMetricsServiceIdRequest = {
  path: {
    'pid': number;
    'serviceId': string;
  }
}

export type GetRuntimesPidMetricsServiceIdResponseOK = unknown
export type GetRuntimesPidMetricsServiceIdResponses =
  FullResponse<GetRuntimesPidMetricsServiceIdResponseOK, 200>

export type GetRuntimesPidServicesRequest = {
  path: {
    'pid': number;
  }
}

export type GetRuntimesPidServicesResponseOK = unknown
export type GetRuntimesPidServicesResponses =
  FullResponse<GetRuntimesPidServicesResponseOK, 200>

export type GetRuntimesPidLogsRequest = {
  path: {
    'pid': number;
  }
}

export type GetRuntimesPidLogsResponseOK = unknown
export type GetRuntimesPidLogsResponses =
  FullResponse<GetRuntimesPidLogsResponseOK, 200>

export type GetRuntimesPidOpenapiServiceIdRequest = {
  path: {
    'pid': number;
    'serviceId': string;
  }
}

export type GetRuntimesPidOpenapiServiceIdResponseOK = unknown
export type GetRuntimesPidOpenapiServiceIdResponses =
  FullResponse<GetRuntimesPidOpenapiServiceIdResponseOK, 200>

export type PostRuntimesPidRestartRequest = {
  path: {
    'pid': number;
  }
}

export type PostRuntimesPidRestartResponseOK = unknown
export type PostRuntimesPidRestartResponses =
  FullResponse<PostRuntimesPidRestartResponseOK, 200>



export interface Backend {
  setBaseUrl(newUrl: string): void;
  setDefaultHeaders(headers: object): void;
  setDefaultFetchParams(fetchParams: RequestInit): void;
  /**
   * @param req - request parameters object
   * @returns the API response
   */
  getRuntimes(req: GetRuntimesRequest): Promise<GetRuntimesResponses>;
  /**
   * @param req - request parameters object
   * @returns the API response
   */
  getRuntimesPidMetrics(req: GetRuntimesPidMetricsRequest): Promise<GetRuntimesPidMetricsResponses>;
  /**
   * @param req - request parameters object
   * @returns the API response
   */
  getRuntimesPidMetricsServiceId(req: GetRuntimesPidMetricsServiceIdRequest): Promise<GetRuntimesPidMetricsServiceIdResponses>;
  /**
   * @param req - request parameters object
   * @returns the API response
   */
  getRuntimesPidServices(req: GetRuntimesPidServicesRequest): Promise<GetRuntimesPidServicesResponses>;
  /**
   * @param req - request parameters object
   * @returns the API response
   */
  getRuntimesPidLogs(req: GetRuntimesPidLogsRequest): Promise<GetRuntimesPidLogsResponses>;
  /**
   * @param req - request parameters object
   * @returns the API response
   */
  getRuntimesPidOpenapiServiceId(req: GetRuntimesPidOpenapiServiceIdRequest): Promise<GetRuntimesPidOpenapiServiceIdResponses>;
  /**
   * @param req - request parameters object
   * @returns the API response
   */
  postRuntimesPidRestart(req: PostRuntimesPidRestartRequest): Promise<PostRuntimesPidRestartResponses>;
}
type PlatformaticFrontendClient = Omit<Backend, 'setBaseUrl'>
type BuildOptions = {
  headers?: object
}
export default function build(url: string, options?: BuildOptions): PlatformaticFrontendClient
