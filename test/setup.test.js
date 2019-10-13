/**
 * Axel Boberg © 2019
 */

const { Database, Model } = require('../index')

test('setup model', () => {
  class MyModel extends Model {
    static get table () {
      return 'my-table'
    }
  }
  expect(MyModel.table).toBe('my-table')
})