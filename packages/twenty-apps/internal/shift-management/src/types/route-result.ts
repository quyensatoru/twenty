// Every route answers HTTP 200 with this envelope; a business rejection is
// `success: false` plus a message the front component shows verbatim.
export type RouteFailure = { success: false; error: string };

export type RouteSuccess<TPayload> = { success: true } & TPayload;

export type RouteResult<TPayload> = RouteSuccess<TPayload> | RouteFailure;
