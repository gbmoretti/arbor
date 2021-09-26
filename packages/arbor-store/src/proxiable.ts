import Model from "./Model"

/**
 * Checks whether or not a given value can be proxied by Arbor.
 *
 * Currently Arbor only supports object literals and Arrays.
 *
 * @param value the value to check for.
 * @returns true if the given value can be proxied, false otherwise.
 */
export default function proxiable<T>(value: T): boolean {
  return (
    value != null &&
    (Array.isArray(value) ||
      value instanceof Model ||
      value.constructor === Object)
  )
}
