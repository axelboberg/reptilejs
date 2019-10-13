/**
 * Axel Boberg © 2019
 */

const UnexpectedTypeValidationError = require('./error/UnexpectedTypeValidationError')

module.exports = (val, criterion) => {
  if (val === null || val === undefined) return
  if (typeof val === criterion) return
  if (typeof criterion !== 'string' && val instanceof criterion) return

  throw new UnexpectedTypeValidationError(val, criterion)
}