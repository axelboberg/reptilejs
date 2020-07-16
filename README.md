# ReptileJS
A straightforward ORM for MySQL and Nodejs using [mysqljs/mysql](https://github.com/mysqljs/mysql).

## Contents
* [Installation](#installation)
* [Usage](#usage)
* [Getting started](#getting-started)
* [Database](#database)
* [Model](#model)
  * [Declaration](#declaring-a-model)
  * [Validation](#validation)
  * [Interacting with the database](#interacting-with-the-database)
  * [Transactions](#model.transaction(fns))
* [Why reptile](#why-reptile)
* [License](#license)

## Installation

`npm install reptilejs`

## Usage
```javascript
const { Database, Model } = require('reptilejs')

// Connect to the database
const myDatabase = new Database({
    host: '127.0.0.1',
    user: 'myUser',
    password: 'myPass',
    database: 'myDatabase'
})

// Declare a model
class MyModel extends Model {
    static get table () {
        return 'myTable'
    }

    static get fields () {
        return {
            'id': { type: 'string', max: 5, min: 5 },
            'myNum': { type: 'number', max: 11 },
            'myDate': { type: Date }
        }
    }
}

// Register the model
myDatabase.register('myModel', MyModel)

// Create an item
const myItem = new MyModel('abcde', {
  myNum: 1,
  myDate: new Date()
})

myItem.save()
  .then(res => {
    // res is mysql response
  })

// Retrieve an item
MyModel.findOne({ id: 'abcde' })
  .then(res => {
    // res is null or instance of MyModel
  })

```

## Getting started  
The framework consists of two classes, `Database` and `Model`.  
Both are explained below.

## `Database`  
The class `Database` is used to create a connection pool to a database.

### `new Database(opts)`  
Connect to a database  

##### opts `Object`
An object containing the connection details for the connection pool.  
As `Database` uses `mysqljs/mysql` internally available options are anything outlined at [https://github.com/mysqljs/mysql#pooling-connections](https://github.com/mysqljs/mysql#pooling-connections)

### `database.register(name, model)`
Register a model to be used by other models registered to a database  

##### name `String`
The name to register the model as, only one model can use a specific name  

##### model `Model`
The model to register

## `Model`
A model is used to act like an interface between the database and the business logic by allowing for easy manipulating of data.
The class `Model` needs to be inherited from in order to work.

### Declaring a model
```javascript
const sql = require('js-sql-syntax')
const { Model, relations } = require('reptilejs')

// Declare a model by inheriting from the Model-class
class User extends Model {

  /*
    REQUIRED
    Every model has to specify the table to which it maps
    by returning the name of the table as a string when
    requesting the static parameter `table`
  */
  static get table () {
    return 'users'
  }

  /*
    REQUIRED
    Every model has to specify the fields it should map
    to the table.

    Fields are described as an object where the column name is the key
    and the validation details is the value such as the following:
  */
  static get fields () {
    return {
      'id': { type: 'number' },
      'given_name': { type: 'string', max: 255 },
      'family_name': { type: 'string', max: 255 }
    }
  }

  /*
    OPTIONAL
    The static field `primary` declares the primary fields
    of the model as an array of strings.

    DEFAULT
    [ 'id' ]
  */
  static get primary () {
    return 'id'
  }

  /*
    OPTIONAL
    A model can have direct relations to any other model
    registered to the same database, this is done by
    returning an object from the static field `relations`.

    The key is the property to mount the related row/rows to
    and the value is a set of options for the relation.

    Note that relations will not be populated unless specified
    as an option in Model.findOne or Model.findMany.

    DEFAULT
    {}
  */
  static get relations () {
    return {
      'address': { // REQUIRED user.address will house the relation
        'model': 'Address', // REQUIRED The registered name of the related model from database.register(name, model)
        'type': relations.type.HAS_MANY, // REQUIRED The type of the relation, HAS_MANY or HAS_ONE
        'local': 'id', // REQUIRED The local column to match on,
        'foreign': 'user_id', // REQUIRED The foreign column to match on, must exist in the related table
        'cols': [ 'street', 'city' ], // OPTIONAL An array of which columns to include from the related table, defaults to all columns
        'transform': rows => { ... } // OPTIONAL A function to apply to the row(s) before mounting, parameter is a single object or a row depending on the relation's type
      }
    }
  }

  /*
    OPTIONAL

    A function that will modify the data returned from the
    database before an instance of the model is created
  */
  static transform (data) {
    // Modify data
    return data
  }

  // MARK: Custom methods

  /*
    OPTIONAL
    A model can implement or override any method to set or retrieve
    data by simply using the `this.constructor.execute` -function
  */
  findOneByGivenName (name, opts) {

    // Using the 'js-sql-syntax' framework
    const query = sql().select().from(this.constructor.table).where({ 'given_name': name }).limit(1)
    return this.constructor.execute(query.getQuery(), query.getValues())

    // Using strings
    const query = `SELECT * FROM ${this.constructor.table} WHERE given_name=? LIMIT 1`
    const values = [ name ]
    return this.constructor.execute(query, values)
  }
}

```

### Validation  
When defining fields for a model you also define the type, length and any other parameters that the value should conform to. Validation of this is done automatically when creating an instance of a model.

#### `type`
**Type** `String, Type`

The type property specifies the type of the value, either as a string to match the result of a typical `typeof` check or the name of a type to match an `instanceof` check.

*Valid values:* `'string'`, `'number'`, `'boolean'`, `Date`, `String`, `Number`, `Boolean`

#### `max` and `min`
**Type** `Number`

The max and min properties behave differenly depending on the type of the field.
If the type is a number these properties will define the maximum and minimum values, while if the type is a string these will define the length of the string.

#### `required`
**Type** `Boolean`

Declares if the contents of the field can be null or not.

#### `enum`
**Type** `Array`

Define an array of allowed values for the field.

#### `custom`
**Type** `Function`

Use a custom validation method for the field. The function should take the value of the field as its only parameter and return a boolean of whether the value passed or failed the validation. It can also throw a string explaining a reason why the validation failed which will be wrapped in a `FailedCustomValidationError`.

### API

#### `new Model(primary, data [, opts])`
In order to use a model you need to instantiate it.
One instance of a model translates to one row in the database.

##### primary `Object`, `String`, `Number`, `Date` or `null`
The parameter `primary` is most often used when updating a partial instance.
It's type should be an object where the keys are the names of the primary columns and the values are its values, or null if no primary values can be specified at that point in time.

For convenience however, if only one primary column is specified the value of this parameter can be the direct primary value.

Example 1. `Object`
```javascript
class MyModel extends Model {}
const myInstance = new MyModel({ id: 7 }, {})
```

Example 2. Direct value
```javascript
class MyModel extends Model {}
const myInstance = new MyModel(7, {})
```

##### data `Object`
The parameter `data` specifies the data with which the model should be instantiated. This resembles the values for each column of the row (instance).

##### opts `Object`
Options for the instance

```javascript
{
  validate: null | Array<String>, // Declares the fields that should be validated, defaults to `null` (all fields)
  removeExcessProperties: Boolean // Whether or not to remove all properties from the `data` parameter that are not declared as fields in the model. Useful if, for example, data is raw user input. Defaults to `true`.
}
```

### Interacting with the database

#### Options
Almost all default functions interacting with the database allows for options as the last parameter, except for a few specific ones (which you can read about under each function) they can all handle the following:

```javascript
{
  connection: Connection, // OPTIONAL A database connection to use instead of the pool provided from the `Database` class
}
```

#### `Model.findMany(query [, opts])`
Find many rows based on a query and return them as an array of instances.

##### query `Object`
An object specifying a query with keys mapping to columns and values to values. Values are escaped, keys are not.

##### opts `Object`
An optional object specifying options. These can be everything under the Options-heading and any of the following:
```javascript
{
  limit: Number,
  offset: Number,
  populate: Boolean | Array // Specifies which relations to populate as an array of the names of the relations or a boolean meaning none `false` or all `true`. Defaults to `false`.
}
```

#### `Model.findOne(query [, opts])`
A convenience function around `Model.findMany` but limiting the response to 1 and returning the instance directly instead of in an array.

#### `Model.findOneById(id [, opts])`
A convenience function around `Model.findOne` but creating the query automatically for the field `id`.

##### id `String`, `Number`, `Date`

#### `Model.findOneByPartial(partial [, opts])`
A convenience function around `Model.findOne` but creating the query automatically from an already existing instance.

##### partial `Model`

#### `Model.delete(query [, opts])`
Delete a row in the database.

##### query `Object`
The query needs to specify at least one `field: value` pair or the function will throw.

#### `Model.insert(data [, opts])`
Insert data into the table specified for the model without validation.

##### data `Object`
Data to insert, values are escaped, keys are not.

#### `Model.update(query, values [, opts])`
Update some data where the query match.

##### query `Object`
Values are escaped, keys are not.

##### values `Object`
Values to set. Values are escaped, keys are not.

#### `Model.execute(query, values [, opts])`
Execute an SQL statement on the table specified for the model.

##### query `String`
An SQL-query.

##### values `Array`
Values to insert at placeholders in the query marked with `?`.

#### `Model.transaction(fns)`
Create database transactions.

##### fns `Array<Function>`
An array of functions, each taking a connection as its only parameter.
Every function should return a promise. If a promise fails the transaction will abort and any changes will be reverted.

**Example**

```javascript
class MyModel extends Model {}
class MyOtherModel extends Model {}

const myInstance = new MyModel(null, {})

MyModel.transaction([
  conn => {
    return myInstance.save({ connection: conn })
  },
  conn => {
    const myOtherInstance = new MyOtherModel(null, { 'other_id': myInstance.id })
    return myOtherInstance.save({ connection: conn })
  }
])
```

#### `model.save([opts])`
Save the instance to the database by either inserting or updating the row.
This function uses `ON DUPLICATE KEY UPDATE` internally.

##### opts `Object`
All default options and:

```javascript
{
  insertOnly: Boolean // Indicates if only insertion is permitted (no update). Defaults to false.
}
```

#### `model.update([opts])`
Update the database with the current values of the instance.
The instance's primary values will be used to create a query.

## Why reptile
The term "orm" translates to snake in Swedish.

## License
MIT