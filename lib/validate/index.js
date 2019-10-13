/**
 * Axel Boberg © 2019
 * 
 * A validation framework
 */

const UndefinedValueValidationError = require('./error/UndefinedValueValidationError')

const validators = {
  'required': require('./required'),
  'type': require('./type'),
  'max': require('./max'),
  'min': require('./min'),
  'enum': require('./enum'),
  'custom': require('./custom')
}

/**
 * Validate a value against a set of rules
 * 
 * @param { Any } value
 * @param { Object } rules
 * @throws { ValidationError } An error describing what caused the validation to fail
 */
exports.value = (value, rules) => {
  if (value === undefined) {
    throw new UndefinedValueValidationError(value)
  }

  for (let [rule, condition] of Object.entries(rules)) {
    if (!validators[rule]) continue
    validators[rule](value, condition, rules)
  }
}

/**
 * Validate an entire object against a schema
 * 
 * @param { Object } obj An object to validate
 * @param { Object } schema A schema to validate against
 * @returns { Bool } If validation succeeded the returned value will be true
 * @throws { ValidationError } An error describing what caused the validation to fail
 */
exports.object = (obj, schema) => {
  for (let [key, rules] of Object.entries(schema)) {
    /**
     * Skip non existing keys
     */
    if (!(key in obj) && !rules.required) continue

    try {
      exports.value(obj[key], rules)
    } catch(err) {
      err.key = key
      throw err
    }
  }

  return true
}