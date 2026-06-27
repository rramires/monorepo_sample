/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string
	readonly VITE_ENABLE_API_DELAY: string
	readonly VITE_PASSWORD_MIN_LENGTH: string
	readonly VITE_PASSWORD_PATTERN: string
}
interface ImportMeta {
	readonly env: ImportMetaEnv
}
