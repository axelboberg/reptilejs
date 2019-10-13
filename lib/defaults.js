/**
 * Axel Boberg © 2019
 */

/**
 * Make sure that an object has
 * a set of default values
 * 
 * @param { Object } target
 * @param { Object } defaults
 * @returns { Object }
 */
module.exports = (target, defaults) => {
  const defaultCopy = Object.assign({}, defaults)
  return Object.assign(defaultCopy, target)
}