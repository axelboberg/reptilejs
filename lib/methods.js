/**
 * Axel Boberg © 2019
 * 
 * A set of functions that the model can
 * use to interact with the database
 */

const util = require('util')

const sql = require('js-sql-syntax')
const defaults = require('./defaults')
const relations = require('./relations')

/**
 * Extract primary data from
 * an instance of a model
 * or a standard object
 * 
 * @param { Object } source 
 * @param { Model } Model 
 * @returns { Object }
 */
function primary (source, Model) {
  const primary = {}
  const keys = Model.primary
  
  for (let key of keys) {
    if (!source[key]) return false
    primary[key] = source[key]
  }

  return primary
}

module.exports = Model => {

  /**
   * Find one row by its id
   * @param { Number } id The row's id
   * @returns { Promise<ThisType> }
   */
  Model.findOneById = function (id, opts) {
    opts.limit = 1

    return this.findMany({ 'id': id }, opts)
      .then(res => {
        if (res.length === 0) return null
        return res[0]
      })
  }

  /**
   * Find any rows matching the keys and values of the query
   * 
   * Note that keys from the query are not escaped and should
   * therefore be hard-coded
   * 
   * @param { Object } query
   * @param { Number? } limit The maximum nuber of returned rows
   * @param { Number? } offset N number of rows to skip
   * @returns { Promise<[ThisType]> }
   */
  Model.findMany = function (query = {}, opts) {
    opts = defaults(opts, {
      query: sql(),
      offset: 0,
      columns: [`${this.table}.*`],
      populate: false,
      _relations: []
    })

    if (opts.populate) {
      for ([name, rel] of Object.entries(this.relations)) {
        if (opts.populate !== true && !opts.populate.includes(name)) continue

        /**
         * Get the Model from the
         * relationship data
         */
        if (!this.database.models[rel.model]) throw new ReferenceError(`Model '${rel.model}' does not exist or has not been registred`)
        rel.model = this.database.models[rel.model]

        const [ subquery, columns ] = relations.makeSQL(name, rel)
  
        opts.columns.push(columns)
        opts._relations.push({query: subquery, name: name, ...rel})
      }  
    }

    let _query = opts.query
      .select(opts.columns)
      .from(this.table)

    opts._relations.forEach(({ query, name, local, foreign }) => {
      _query
        .leftJoin()
        .subquery(query)
        .as(`t_${name}`)
        .on(`${this.table}.${local}`, `t_${name}.${foreign}`)
    })
    /**
     * Scope the query to the current table
     * to avoid SQL errors when joining other tables
     */
    for ([ key, val ] of Object.entries(query)) {
      /**
       * TODO: Check if key needs to be
       * scoped before scoping
       */
      delete query[key]
      query[`${this.table}.${key}`] = val  
    }

    _query.where(query)
    
    if (opts.orderBy) _query.orderBy(opts.orderBy)
    if ((opts.orderBy && !opts.orderDir) || opts.orderDir === 'desc') _query.descending()
    if (opts.orderDir === 'asc') _query.ascending()

    if (opts.limit) _query.limit(opts.limit)
    if (opts.offset && opts.limit) _query.offset(opts.offset)

    return this.execute(_query.getQuery(), _query.getValues(), opts)
      .then(res => {
        /**
         * Instatiate models from the response
         */
        return res

          /**
           * Parse joined data as JSON and apply an
           * optional transformation if one is defined
           */
          .map(row => {
            for ({ name, transform, type } of opts._relations) {
              if (!row.hasOwnProperty(name)) continue

              // Parse item as JSON
              row[name] = JSON.parse(row[name])

              /**
               * If no rows were joined but an array is expected,
               * replace null with an empty array
               */
              if (type = 'HAS_MANY' && row[name] === null) {
                row[name] = []
              }

              // Apply transformation
              if (transform) row[name] = transform(row[name])
            }
            return row
          })

          /**
           * Instantiate model
           */
          .map(row => {
            const transformed = this.transform(row)
            return new this(null, transformed, { validate: [], removeExcessProperties: false })
          })
      })
  }

  /**
   * Find one row matching the query
   * 
   * @param { Object } query
   * @param { Object } opts
   * @returns { Promise<ThisType> }
   */
  Model.findOne = function (query, opts = {}) {
    opts.limit = 1

    return this.findMany(query, opts)
      .then(res => {
        return res[0] || null
      })
  }

  /**
   * Find one row matching a partial model
   * which is useful for utilizing the
   * validation capabilities of the Model class
   * 
   * @param { Model } partial
   * @param { Object } opts
   * @returns { Promise<ThisType> }
   */
  Model.findOneByPartial = function (partial, opts) {
    if (!(partial instanceof Model)) {
      throw new Error('Partial must be an instance of Model')
    }

    const query = partial.getValues(opts)
    return partial.constructor.findOne(query, opts)
  }

  /**
   * Delete one or multiple rows by a query
   * @param { Object } query
   * @returns { Promise }
   */
  Model.delete = function (query = {}, opts) {
    if (Object.keys(query).length === 0) {
      return Promise.reject(new Error('Query cannot be empty when deleting'))
    }

    const _query = sql().delete().from(this.table).where(query)
    return this.execute(_query.getQuery(), _query.getValues(), opts)
  }

  /**
   * Insert the instance into the database
   * or update if the instance's id already exists
   * @param { Object } opts
   * @returns { Promise<ThisType> }
   */
  Model.prototype.save = function (opts = { insertOnly: false }) {
    const data = this.getValues()
    const query = sql().insert().into(this.constructor.table).values(data)

    if (!opts.insertOnly) {
      query.onDuplicateKeyUpdate(data)
    }

    return this.constructor.execute(query.getQuery(), query.getValues(), opts)
  }

  /**
   * Insert one or many objects into the database
   * @param { Object } data
   * @param { Object } opts
   * @returns { Promise<ThisType> }
   */
  Model.insert = function (data = {}, opts) {
    let _data = data
    if (Array.isArray(_data) && _data.length === 0) {
      _data = {}
    }

    const query = sql().insert().into(this.table).values(_data)
    return this.execute(query.getQuery(), query.getValues(), opts)
  }

  /**
   * Update the database with the instance's values,
   * but only if there is a match with primary keys
   * @returns { Promise }
   */
  Model.prototype.update = function (opts) {
    const _primary = primary(this, Model)
    const table = this.constructor.table

    if (!_primary) {
      throw new Error(`Object is missing a value for its primary key(s), unable to update`)
    }

    const data = this.getValues(true)
    const query = sql().update(table).set(data).where(_primary)

    return this.constructor.execute(query.getQuery(), query.getValues(), opts)
  }

  /**
   * Update a row without making an
   * instance of the model
   * @param { Object } query
   * @param { Object } values
   * @param { Object } opts
   * @returns { Promise }
   */
  Model.update = function (query, values, opts) {
    const _query = sql().update(this.table).set(values).where(query)
    return this.execute(_query.getQuery(), _query.getValues(), opts)
  }

  /**
   * Prepare and execute an sql query
   * @param { String } query
   * @param { Array<Any> } values
   * @returns { Promise<ThisType | Any> }
   */
  Model.execute = function (query, values = [], opts = {}) {
    if (!query) throw new Error('No query provided')

    if (!Array.isArray(values)) throw new TypeError('Values must be an array')
    if (typeof opts !== 'object') throw new TypeError('Options must be an object')

    return new Promise((resolve, reject) => {
      const connection = opts.connection || this.database.pool

      if (!connection || !connection.query) {
        throw new Error('Database connection has not been initialized')
      }
      
      connection.query(query, values, (err, res, fields) => {
        if (err) return reject(err)
        resolve(res)
      })
    })
  }

  /**
   * Execute multiple functions as a transaction
   * 
   * Every function gets the connection as the
   * first argument and MUST return a Promise.
   * 
   * @param { Array<Function<Promise>>> } fns
   * @returns { Promise }
   */
  Model.transaction = async function (fns = []) {
    if (fns.length === 0) return Promise.resolve()

    const getConnection = util.promisify(this.database.pool.getConnection.bind(this.database.pool))
    const conn = await getConnection()

    // Promisify required functions
    const beginTransaction = util.promisify(conn.beginTransaction.bind(conn))
    const commit = util.promisify(conn.commit.bind(conn))

    await beginTransaction()

    /*
      Create a rollback function that
      either throws the original error
      or, if rollback fails,
      the rollback's error
    */
    const rollback = (function () {
      const _rollback = util.promisify(conn.rollback.bind(conn))

      /**
       * Rollback function that
       * will always throw
       * @param { Error } err Original error
       * @returns { Promise }
       */
      return function (err) {
        return _rollback()
          .then(() => { throw err }) // Throw original error
          .catch(err => { throw err }) // Throw rollback error
      }
    })()

    function execute (fn) {
      /*
        Commit connection if no
        function is left to execute
      */
      if (!fn) {
        return commit()
          .catch(err => rollback(err))
      }

      return fn(conn)
        .then(res => execute(fns.shift()))
        .catch(err => rollback(err))
    }

    return execute(fns.shift())
      .finally(() => conn.release())
  }
}
