/**
 * Axel Boberg © 2019
 */

const NotEnumeratedValidationError = require('./error/NotEnumeratedValidationError')

module.exports = (val, criterion) => {
  if (!criterion.includes(val)) {
    throw new NotEnumeratedValidationError(val, criterion)
  }
}