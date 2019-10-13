/**
 * Axel Boberg © 2019
 */

module.exports = class ValidationError extends Error {
  constructor (message, code, value) {
    super(message)
    this.name = 'ValidationError'
    this.code = code
    this.value = value
  }
}