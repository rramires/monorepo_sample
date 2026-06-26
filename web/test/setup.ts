import '@testing-library/jest-dom/vitest'

import i18n from '../src/i18n'

// Force English so the suite (which asserts the English copy) is deterministic
// regardless of the CI machine's navigator language or any persisted locale.
// In-memory JSON resources make this effectively synchronous.
await i18n.changeLanguage('en')
