/**
 * Axel Boberg © 2019
 */

const TooBigValidationError = require('./error/TooBigValidationError')

module.exports = (val, criterion) => {
  if (val === null || val === undefined) return
  
  let compare = val
  if (typeof val !== 'number') compare = val.length

  if (compare > criterion) throw new TooBigValidationError(val)
}