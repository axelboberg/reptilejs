/**
 * Axel Boberg © 2019
 */

const ValidationError = require('./ValidationError')

module.exports = class NotEnumeratedValidationError extends ValidationError {
  constructor (value, allowed = []) {
    const allowedStr = allowed
      .map(val => `"${val}"`)
      .join(',')

    const allowedExplanationStr = allowed.length > 0 ?
                                  `. Enumerated values are: ${allowedStr}` :
                                  ''

    super(`Value is not enumerated${allowedExplanationStr}`, 'VALUE_NOT_ENUMERATED', value)
  }
}