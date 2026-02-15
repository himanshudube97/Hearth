export const isDevAuth = process.env.USE_DEV_AUTH === 'true'
export const DEV_JWT_SECRET = process.env.DEV_JWT_SECRET || 'dev-secret-key-for-local-development-only-min-32-chars'
export const AUTH_COOKIE_NAME = 'hearth-auth-token'
