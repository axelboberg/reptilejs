/**
 * Axel Boberg © 2019
 */

const ValidationError = require('./ValidationError')

module.exports = class UndefinedValueValidationError extends ValidationError {
  constructor (value) {
    super('Value is undefined', 'UNDEFINED_VALUE', value)
  }
}