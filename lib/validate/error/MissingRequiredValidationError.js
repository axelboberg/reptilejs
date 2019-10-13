/**
 * Axel Boberg © 2019
 */

const ValidationError = require('./ValidationError')

module.exports = class MissingRequiredValidationError extends ValidationError {
  constructor (value) {
    super('Missing required value', 'MISSING_REQUIRED_VALUE', value)
  }
}