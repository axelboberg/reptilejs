/**
 * Axel Boberg © 2019
 */

const ValidationError = require('./ValidationError')

module.exports = class UnexpectedTypeValidationError extends ValidationError {
  constructor (value, expected) {
    super(`Got value of type ${typeof value} but expected ${expected}`, 'UNEXPECTED_TYPE', value)
  }
}