/**
 * Axel Boberg © 2019
 */

const ValidationError = require('./ValidationError')

module.exports = class TooSmallValidationError extends ValidationError {
  constructor (value) {
    super('Value is too small', 'VALUE_TOO_SMALL', value)
  }
}