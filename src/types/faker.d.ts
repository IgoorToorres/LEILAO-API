/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@faker-js/faker' {
  // Fallback typing to unblock tests when using CJS faker
  // You can replace 'any' with proper typings if you switch to ESM version later.
  export const faker: any
}
