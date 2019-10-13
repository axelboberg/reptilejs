/**
 * Axel Boberg © 2019
 */

const MissingRequiredValidationError = require('./error/MissingRequiredValidationError')

module.exports = (val, criterion) => {
  if (val === null || val === undefined) {
    throw new MissingRequiredValidationError(val)
  }
}