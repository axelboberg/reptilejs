/**
 * Axel Boberg © 2019
 */

const ValidationError = require('./ValidationError')

module.exports = class FailedCustomValidationError extends ValidationError {
  constructor (value, msg) {
    super(msg, 'CUSTOM_VALIDATION_FAILED', value)
  }
}