/**
 * Axel Boberg © 2019
 */

const sql = require('js-sql-syntax')

module.exports.type = Object.freeze({
  'HAS_ONE': 'HAS_ONE',
  'HAS_MANY': 'HAS_MANY'
})

/**
 * Functions generating SQL queries joining the
 * related data from their respective tables
 * 
 * @param { Model } Model
 * @param { String } name
 * @param { String } local
 * @param { String } foreign
 * @returns { Array<sql, Array<String>> }
 */
const GENERATOR = {
  /**
   * One-to-one
   */
  HAS_ONE: (name, { model, local, foreign, cols }) => {
    let TARGET_TABLE = model.table
    const NAME = name
  
    /**
     * Add backticks around keys representing
     * columns to avoid clashes with reserved
     * words
     */
    const _cols = (cols || Object.keys(model.fields))
      .map(key => `'${key}', \`${key}\``)
      .join(', ')
  
    const inner = sql()
      .select([foreign, `JSON_OBJECT(${_cols}) AS \`${NAME}\``])
      .from(TARGET_TABLE)
  
    return [inner, [`t_${NAME}.${NAME}`]]
  },

  /**
   * Many-to-one
   */
  HAS_MANY: (name, rel) => {
    const [ inner ] = GENERATOR.HAS_ONE(name, rel)
    const NAME = name
  
    const outer = sql()
      .select([rel.foreign, `JSON_ARRAYAGG(${`t_${NAME}__inner.${NAME}`}) AS \`${NAME}\``])
      .from('')
      .subquery(inner)
      .as(`t_${NAME}__inner`)
      .groupBy(`t_${NAME}__inner.${rel.foreign}`)
  
    return [outer, [`t_${NAME}.${NAME}`]]
  }
}

exports.makeSQL = (name, rel) => {
  if (exports.type[rel.type] === undefined) throw new Error('Invalid relation type')

  const generator = GENERATOR[rel.type]
  return generator(name, rel)
}
