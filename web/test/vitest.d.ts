// jest-dom matchers for Vitest 4.
//
// `@testing-library/jest-dom/vitest` augments `interface Assertion` in module
// 'vitest', but Vitest 4 defines `Assertion` in '@vitest/expect' and exposes a
// dedicated `interface Matchers<T>` as the extension point (`Assertion extends
// Matchers`). Augmenting `Matchers` is what actually reaches `expect(...)`.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type --
   mirrors @testing-library/jest-dom's own augmentation signature; the empty
   interface body is the declaration-merge point that adds the matchers. */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
	interface Matchers<T = any> extends TestingLibraryMatchers<any, T> {}
}
