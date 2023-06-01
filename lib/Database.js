/**
 * Axel Boberg © 2019
 */

const util = require('util')
const mysql2 = require('mysql2')

/**
 * Represents a database and its
 * registered models and connection pool
 */
class Database {
  /**
   * Get an index of the models
   * registered to this Database
   * @type { Object.<String, Model> }
   */
  get models () {
    return Object.freeze(this._models)
  }

  /**
   * Get the oritinal pool object
   * @type { mysql2.Pool }
   */
  get pool () {
    return this._pool
  }

  constructor (opts) {
    /**
     * @private
     * A reference to the
     * adapter's pool
     * @type { mysql2.Pool }
     */
    this._pool = mysql2.createPool(opts)
    this._pool.getConnectionPromise = util.promisify(this._pool.getConnection)

    /**
     * @private
     * An index of the models registered
     * to this Database
     * @type { Object.<String, Model> }
     */
    this._models = {}
  }

  /**
   * Register a model to this Database,
   * this allows the model to start making queries
   * and create relationships with other models
   *
   * @param { String } name A unique name identifying the model
   * @param { Model } model A model class to register
   */
  register (name, model) {
    this._models[name] = model
    model.database = this
  }
}

module.exports = Database