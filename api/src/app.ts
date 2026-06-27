import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyJwt from '@fastify/jwt'
import fastifyRateLimit from '@fastify/rate-limit'
import underPressure from '@fastify/under-pressure'
import fastify from 'fastify'
import { z, ZodError } from 'zod'

import { env } from './env'
import { authRoutes } from './http/controllers/auth/routes'
import { checkInsRoutes } from './http/controllers/check-ins/routes'
import { gymsRoutes } from './http/controllers/gyms/routes'
import { healthRoutes } from './http/controllers/health/routes'
import { meRoutes } from './http/controllers/me/routes'
import { modulesRoutes } from './http/controllers/modules/routes'
import { noticesRoutes } from './http/controllers/notices/routes'
import { permissionsRoutes } from './http/controllers/permissions/routes'
import { profilesRoutes } from './http/controllers/profiles/routes'
import { screensRoutes } from './http/controllers/screens/routes'
import { usersRoutes } from './http/controllers/users/routes'
import { prisma } from './lib/prisma'
import { reportError } from './lib/report-error'
import { AppError } from './use-cases/errors/app-error'

const trustProxy =
	env.TRUST_PROXY === 'true'
		? true
		: env.TRUST_PROXY && env.TRUST_PROXY !== 'false'
			? env.TRUST_PROXY
			: false

export const app = fastify({
	bodyLimit: env.BODY_LIMIT,
	trustProxy,
	// Structured JSON logs in production; human-readable in development; silent
	// during tests to avoid worker-thread noise and open handles.
	logger:
		env.NODE_ENV === 'test'
			? false
			: env.NODE_ENV === 'production'
				? { level: env.LOG_LEVEL }
				: { transport: { target: 'pino-pretty' } },
})
// Security headers. Helmet defaults are fine for a JSON API; a custom CSP only
// matters if this service starts serving HTML.
app.register(fastifyHelmet)
// Under-pressure: auto-returns 503 when event-loop lag or heap size exceed thresholds.
app.register(underPressure, {
	maxEventLoopDelay: env.MAX_EVENT_LOOP_DELAY,
	maxHeapUsedBytes: env.MAX_HEAP_USED_BYTES,
	message: 'Server under pressure — retry later.',
	retryAfter: 50,
})
// CORS. credentials:true is required to send the refresh-token cookie.
// Dev allows any origin; prod restricts to the configured allow-list.
// methods must be explicit: @fastify/cors defaults to 'GET,HEAD,POST', which
// silently blocks every PATCH/PUT/DELETE at the browser preflight (the server
// still answers OPTIONS 204, but the browser aborts the real request).
app.register(fastifyCors, {
	credentials: true,
	methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
	origin:
		env.NODE_ENV === 'production'
			? (env.CORS_ORIGIN?.split(',') ?? false)
			: true,
})
// Global rate limit per IP. For multi-instance, swap the store for Redis later.
app.register(fastifyRateLimit, {
	max: 100,
	timeWindow: '1 minute',
})
// JWT
app.register(fastifyJwt, {
	secret: env.JWT_SECRET,
	cookie: {
		cookieName: 'refreshToken',
		signed: false,
	},
	sign: {
		expiresIn: '4h',
	},
})
app.register(fastifyCookie)
// Routes
app.register(healthRoutes)
app.register(authRoutes)
app.register(usersRoutes)
app.register(gymsRoutes)
app.register(checkInsRoutes)
app.register(meRoutes)
app.register(modulesRoutes)
app.register(screensRoutes)
app.register(permissionsRoutes)
app.register(profilesRoutes)
app.register(noticesRoutes)
// Errors
app.setErrorHandler((error, request, reply) => {
	// Domain errors: the single serialization point for the `{ code, message,
	// meta? }` envelope. Controllers and middlewares just throw AppError
	// subclasses; the frontend localizes off `code` (message is a dev fallback).
	if (error instanceof AppError) {
		return reply.status(error.httpStatus).send({
			code: error.code,
			message: error.message,
			...(error.meta ? { meta: error.meta } : {}),
		})
	}
	if (error instanceof ZodError) {
		return reply.status(400).send({
			code: 'validation_error',
			message: 'Validation error.',
			// In production expose only path + message; full format() leaks input shape
			issues:
				env.NODE_ENV === 'production'
					? error.issues.map((issue) => ({
							path: issue.path,
							message: issue.message,
						}))
					: z.treeifyError(error),
		})
	}
	// Framework errors carry a meaningful statusCode (429 rate-limit, 413
	// body-limit, 400 bad JSON, 503 under-pressure). Honor it and map it to a
	// stable code; only true unknowns fall through to 500 + reportError.
	const statusCode = (error as { statusCode?: unknown }).statusCode
	if (typeof statusCode === 'number' && statusCode !== 500) {
		const message = (error as { message?: unknown }).message
		const code =
			statusCode === 429
				? 'rate_limited'
				: statusCode === 413
					? 'payload_too_large'
					: statusCode === 503
						? 'server_under_pressure'
						: 'bad_request'
		return reply.status(statusCode).send({
			code,
			message: typeof message === 'string' ? message : 'Error.',
		})
	}
	if (env.NODE_ENV === 'production') {
		// Production: route through the reporting seam (Sentry/Datadog later).
		reportError(error)
	} else {
		request.log.error(error)
	}
	// Other errors
	return reply.status(500).send({
		code: 'internal_server_error',
		message: 'Internal server error.',
	})
})
// Release the database connection pool when the server closes.
app.addHook('onClose', async () => {
	await prisma.$disconnect()
})
