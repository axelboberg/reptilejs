/**
 * Axel Boberg © 2019
 */

const validate = require('./validate')
const defaults = require('./defaults')

const Database = require('./Database')

const DEFAULT_OPTS = {
  'validate': null,
  'removeExcessProperties': true
}

const models = {}

/**
 * Remove properties from
 * an object in bulk
 * 
 * @param { Object } obj
 * @param { Array<String> } allowed
 * @returns { Object }
 */
function removeExcessProperties (obj, allowed) {
  for (let key of Object.keys(obj)) {
    if (allowed.includes(key)) continue
    delete obj[key]
  }

  return obj
}

class Model {
  static get table () {
    throw new Error('Model needs to implement table')
  }

  static get fields () {
    throw new Error('Model needs to implement fields')
  }

  static get primary () {
    return [ 'id' ]
  }

  static get relations () {
    return {}
  }

  get database () {
    if (!this._database) throw new Error('Attempt to access the database of a not yet registered model')
    return this._database
  }

  set database (val) {
    if (!(val instanceof Database)) throw new TypeError('Value is not of type Database')
    this._database = val
  } 

  constructor (primary, data = {}, opts) {
    opts = defaults(opts, DEFAULT_OPTS)

    /**
     * Assign primary values
     * to this instance
     */
    if (primary === null || typeof primary !== 'object') {
      primary = {
        [this.constructor.primary[0]]: primary
      }
    }

    for (let key of this.constructor.primary) {
      if (primary.hasOwnProperty(key)) continue
      primary[key] = data[key]
    }

    Object.assign(this, primary)

    /**
     * Remove data that is not specified
     * as belonging to a model field, is
     * a primary value or is a relationship
     */
    if (opts.removeExcessProperties) {
      removeExcessProperties(data,
        [
          ...Object.keys(this.constructor.fields),
          this.constructor.primary
        ]
      )
    }

    /**
     * Check the 'opts' object to allow
     * validation on specified fields only
     */
    let fields = this.constructor.fields
    if (opts.validate) {
      fields = opts.validate
        .filter(field => this.constructor.fields[field])
        .map(field => {
          return {
            [field]: this.constructor.fields[field]
          }
        })
        .reduce((prev, cur = {}) => {
          return { ...prev, ...cur }
        }, {})
    }

    // Validate data
    this.constructor._validate(data, fields)

    this._createProperties(data)
  }

  /**
   * Validate an object following the
   * model's field declaration
   * 
   * @param { Object } data 
   * @param { Object } fields A field declaration to validate against, defaults to the current model's
   * @returns { Error? }
   */
  static _validate (data, fields = this.fields) {
    let error
    try {
      validate.object(data, fields)
    } catch(err) {
      error = err
    }

    if (!error) return true

    if (error.code === 'UNDEFINED_VALUE') {
      data[error.key] = null
      return this._validate(data, fields)
    }

    error.status = 400
    throw error
  }

  /**
   * Populate the instance with data
   * 
   * @param { Object } data
   */
  _createProperties (data) {
    Object.assign(this, data)
  }

  /**
   * Get an object containing the model's fields and the instance's data
   * 
   * @return {Object}
   */
  getValues (opts = {}) {
    const data = {}

    /**
     * Add general keys to the
     * data object
     */
    const fields = Object.keys(this.constructor.fields)

    for (let i = 0, l = fields.length; i < l; i++) {
      const field = fields[i]

      if (!(field in this)) continue
      data[field] = this[field]
    }

    /**
     * Remove null and undefined values
     */
    for (let key of Object.keys(this)) {
      const val = this[key]

      if (val === null || val === undefined) {
        delete this[key]
      }
    }

    return data
  }

  /**
   * Get only the primary
   * values for the instance
   * @returns { Object }
   */
  getPrimary () {
    const out = {}
    for (let key of this.constructor.primary) {
      out[key] = this[key]
    }
    return out
  }

  static register (name, model) {
    models[name] = model
  }

  static getModel (name) {
    return this._models[name]
  }

  static get _models () {
    return models
  }
}
module.exports = Model

/**
 * Extend class with SQL methods
 */
require('./methods')(Model)
