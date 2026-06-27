import type { ErrorCode, ErrorMeta } from '@root/contracts'

// Base for every domain error. Carries the stable wire `code`, the HTTP status,
// and optional `meta` (interpolation data: retryAfter / count / action). The
// central `setErrorHandler` in app.ts is the SINGLE place that serializes these
// to the `{ code, message, meta? }` envelope — controllers just let them
// propagate (no per-controller status mapping). `message` is an English dev
// fallback; clients localize off `code`.
export class AppError extends Error {
	readonly code: ErrorCode
	readonly httpStatus: number
	readonly meta?: ErrorMeta

	constructor(params: {
		code: ErrorCode
		httpStatus: number
		message: string
		meta?: ErrorMeta
	}) {
		super(params.message)
		this.name = this.constructor.name
		this.code = params.code
		this.httpStatus = params.httpStatus
		this.meta = params.meta
	}
}
