/**
 * Axel Boberg © 2019
 */

const FailedCustomValidationError = require('./error/FailedCustomValidationError')

module.exports = (val, criterion) => {
  try {
    const passed = criterion(val)
    if (!passed) throw 'Custom validation failed'
  } catch (msg) {
    throw new FailedCustomValidationError(val, msg)
  }
}