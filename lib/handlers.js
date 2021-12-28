/*
 *
 * All request handlers are kept here
 *
*/

// Dependencies
const users = require('./handlers/users')
const tokens = require('./handlers/tokens')
const checks = require('./handlers/checks')

// create handler object
let handlers = {}

// object to store all methods
const methodsArr = ['get','post', 'put', 'delete']

// create handler for ping
handlers.ping = function(data, callback){
  // callback to return statuscode and payload object
  callback(200)
}

// handler to handle a not found route
handlers.notFound = function(data, callback){
  callback(404)
}

// create handlers for users
handlers.users = function(data, callback){

    // get the current method used
    const currentMethod = data.method

    // check if the method is a valid one
    methodsArr.indexOf(currentMethod) > -1 ? 
    handlers._users[currentMethod](data, callback):
    callback(405, {'Error': 'invalid method call'})
}

// container for users sub-methods
handlers._users = {}

// Users - post
// required fields: firstName, lastName, password, phone, tosAgreement
handlers._users.post = users.post

// Users - get
// required data: phone
// optional data: none  
handlers._users.get = users.get

// Users - put
// required data: phone
// optional data: at least one of the following (firstName lastName, password)
handlers._users.put = users.put

// Users - delete
// required field: phone
// optional field: none
handlers._users.delete = users.delete

// token handler
handlers.tokens = function(data, callback){
  // get the current method used
  const currentMethod = data.method

  // check if the method is a valid one
  methodsArr.indexOf(currentMethod) > -1 ? 
  handlers._tokens[currentMethod](data, callback):
  callback(405, {'Error': 'invalid method call'})
}

// container for tokens sub-method
handlers._tokens = {}

// Tokens -post
handlers._tokens.post = tokens.post

// Tokens -get
// required data : id
handlers._tokens.get = tokens.get

// Tokens -put
// required field: id, extend
handlers._tokens.put = tokens.put

// Tokens -delete
handlers._tokens.delete = tokens.delete

// checks handler
handlers.checks = function(data, callback){
  // get the current method used
  const currentMethod = data.method

  // check if the method is a valid one
  methodsArr.indexOf(currentMethod) > -1 ? 
  handlers._checks[currentMethod](data, callback):
  callback(405, {'Error': 'invalid method call'})
}

// container for checks sub-method 
handlers._checks = {}

// checks -post
// required fields: methods, protocol, url, successcodes and timeouts
handlers._checks.post = checks.post

// checks -get
handlers._checks.get = checks.get

// checks -put
handlers._checks.put = checks.put

// checks -delete
handlers._checks.delete = checks.delete



// export the module
module.exports = handlers