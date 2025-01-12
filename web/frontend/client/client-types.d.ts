export interface FullResponse<T, U extends number> {
  'statusCode': U;
  'headers': object;
  'body': T;
}

export type GetApiRuntimesRequest = {
  'includeAdmin'?: boolean;
}

export type GetApiRuntimesResponseOK = unknown
export type GetApiRuntimesResponses =
  FullResponse<GetApiRuntimesResponseOK, 200>

export type GetApiRuntimesPidMetricsRequest = {
  'pid': number;
}

export type GetApiRuntimesPidMetricsResponseOK = unknown
export type GetApiRuntimesPidMetricsResponses =
  FullResponse<GetApiRuntimesPidMetricsResponseOK, 200>

export type GetApiRuntimesPidMetricsServiceIdRequest = {
  'pid': number;
  'serviceId': string;
}

export type GetApiRuntimesPidMetricsServiceIdResponseOK = unknown
export type GetApiRuntimesPidMetricsServiceIdResponses =
  FullResponse<GetApiRuntimesPidMetricsServiceIdResponseOK, 200>

export type GetApiRuntimesPidServicesRequest = {
  'pid': number;
}

export type GetApiRuntimesPidServicesResponseOK = unknown
export type GetApiRuntimesPidServicesResponses =
  FullResponse<GetApiRuntimesPidServicesResponseOK, 200>

export type GetApiRuntimesPidOpenapiServiceIdRequest = {
  'pid': number;
  'serviceId': string;
}

export type GetApiRuntimesPidOpenapiServiceIdResponseOK = unknown
export type GetApiRuntimesPidOpenapiServiceIdResponses =
  FullResponse<GetApiRuntimesPidOpenapiServiceIdResponseOK, 200>

export type PostApiRuntimesPidReloadRequest = {
  'pid': number;
}

export type PostApiRuntimesPidReloadResponseOK = unknown
export type PostApiRuntimesPidReloadResponses =
  FullResponse<PostApiRuntimesPidReloadResponseOK, 200>

export type PostApiRuntimesPidRestartRequest = {
  'pid': number;
}

export type PostApiRuntimesPidRestartResponseOK = unknown
export type PostApiRuntimesPidRestartResponses =
  FullResponse<PostApiRuntimesPidRestartResponseOK, 200>

export type PostApiRuntimesPidStopRequest = {
  'pid': number;
}

export type PostApiRuntimesPidStopResponseOK = unknown
export type PostApiRuntimesPidStopResponses =
  FullResponse<PostApiRuntimesPidStopResponseOK, 200>



export interface Client {
  setBaseUrl(newUrl: string) : void;
  setDefaultHeaders(headers: Object) : void;
  getApiRuntimes(req: GetApiRuntimesRequest): Promise<GetApiRuntimesResponses>;
  getApiRuntimesPidMetrics(req: GetApiRuntimesPidMetricsRequest): Promise<GetApiRuntimesPidMetricsResponses>;
  getApiRuntimesPidMetricsServiceId(req: GetApiRuntimesPidMetricsServiceIdRequest): Promise<GetApiRuntimesPidMetricsServiceIdResponses>;
  getApiRuntimesPidServices(req: GetApiRuntimesPidServicesRequest): Promise<GetApiRuntimesPidServicesResponses>;
  getApiRuntimesPidOpenapiServiceId(req: GetApiRuntimesPidOpenapiServiceIdRequest): Promise<GetApiRuntimesPidOpenapiServiceIdResponses>;
  postApiRuntimesPidReload(req: PostApiRuntimesPidReloadRequest): Promise<PostApiRuntimesPidReloadResponses>;
  postApiRuntimesPidRestart(req: PostApiRuntimesPidRestartRequest): Promise<PostApiRuntimesPidRestartResponses>;
  postApiRuntimesPidStop(req: PostApiRuntimesPidStopRequest): Promise<PostApiRuntimesPidStopResponses>;
}
type PlatformaticFrontendClient = Omit<Client, 'setBaseUrl'>
type BuildOptions = {
  headers?: Object
}
export default function build(url: string, options?: BuildOptions): PlatformaticFrontendClient
