/**
 * Axel Boberg © 2019
 */

const ValidationError = require('./ValidationError')

module.exports = class TooBigValidationError extends ValidationError {
  constructor (value) {
    super('Value is too big', 'VALUE_TOO_BIG', value)
  }
}