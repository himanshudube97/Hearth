import '@testing-library/jest-dom'

// Web Crypto API polyfill for Node.js test environment.
// Node 20+ has crypto.subtle natively; we just expose it on globalThis
// for code that references global `crypto`.
import { webcrypto } from 'node:crypto'
if (!globalThis.crypto) {
  // @ts-expect-error - Node's webcrypto satisfies the interface at runtime
  globalThis.crypto = webcrypto
}
