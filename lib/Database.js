/**
 * Axel Boberg © 2019
 */

const util = require('util')
const mysql = require('mysql')

/**
 * Represents a database and its
 * registered models and connection pool
 */
class Database {
    get models () {
        return this._models
    }

    get pool () {
        return this._pool
    }

    constructor (opts) {
        this._pool = mysql.createPool(opts)
        this._pool.getConnectionPromise = util.promisify(this._pool.getConnection)

        this._models = {}
    }

    register (name, model) {
        this._models[name] = model
        model.database = this
    }
}

module.exports = Database