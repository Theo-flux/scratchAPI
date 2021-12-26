/*
 *
 * All request handlers are kept here
 *
*/

// Dependencies
const helpers = require('./helpers')
const _data = require('./data')

// create handler object
let handlers = {}

// create handler for ping
handlers.ping = function(data, callback){
  // callback to return statuscode and payload object
  callback(200)
}

// create handlers for users
handlers.users = function(data, callback){
    // object to store all methods
    const methodsArr = ['get','post', 'put', 'delete']

    // get the current method used
    const currentMethod = data.method

    // check if the method is a valid one
    methodsArr.indexOf(currentMethod) > -1 ? 
    handlers._users[currentMethod](data, callback):
    callback(405, {'Error': 'invalid method call'})
}

// container for users methods
handlers._users = {}

// Users - post
// required fields: firstName, lastName, password, phone, tosAgreement
handlers._users.post = function(data, callback){

  const firstName = typeof(data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0  ? data.payload.firstName.trim() : null
  const lastName = typeof(data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0  ? data.payload.lastName.trim() : null
  const phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : null
  const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0? data.payload.password.trim() : null
  const tosAgreement = typeof(data.payload.tosAgreement) == "boolean" && data.payload.tosAgreement == true ? true : false
  // console.log(firstName, lastName, phone, password, tosAgreement)
  // check that the payload fields are correctly filled
  if(firstName && lastName && phone && password && tosAgreement){
    // check if file doesn't already exist
    _data.read('users', phone, function(err){
      if(err){
        // hash the password
        const hashedPassword = helpers.encrypt(password)

        if(hashedPassword){
          // create user object replacing the password with the hashedPassword
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true
          }

          // create the user file using the phone number as the file name
          _data.create('users', phone, userObject, function(err){
            if(err){
              console.log(err)
              callback(500,{'Error': 'unable to create user file'} )
            }else {
              callback(200, {'Error':`${firstName} data file created successfully!`})
            }
          })
        }else {
          callback(500, {'Error':'Error encrypting user password!. Try again!'})
        }

      }else{
        callback(501,{'Error':'Can not create file, User seem to exist!'})
      }
    })
  }else {
    callback(400, {'Error': 'Missing required fields'})
  }

}

// Users - get
// required data: phone
// optional data: none
  
handlers._users.get = function(data, callback){
  // check if it phone number is valid
  const phone = typeof(data.queryString.phone) == 'string' && data.queryString.phone.trim() > 10 ? data.queryString.phone.trim() : false
  if(phone){
    // check if the phone number already exists in the user folder
    _data.read('users', phone, function(err, data){
      if(!err && data){
        delete data.hashedPassword
        callback(200, data)
      }else{
        callback(err)
      }
    })
  }else{
    callback(404)
  }
  
}

// Users - put
// required data: phone
// optional data: at least one of the following (firstName lastName, password)
handlers._users.put = function(data, callback){
  // validate both the required and optional fields
  const firstName = typeof(data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0  ? data.payload.firstName.trim() : null
  const lastName = typeof(data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0  ? data.payload.lastName.trim() : null
  const phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : null
  const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0? data.payload.password.trim() : null
  
  if(phone){

    // check if atleast one of the optional fields has been filled
    if(firstName || lastName || password){
      _data.read('users', phone, function(err, userData){
        if(!err && userData){
          
          if(firstName){
            userData.firstName = firstName
          }

          if(password){
            userData.hashedPassword = helpers.encrypt(password)
          }

          if(lastName){
            userData.lastName = lastName
          }

          _data.update('users', phone, userData, function(err){
            if(err){
              callback(500, {'Error' : 'Could not update file'})
            }else {
              callback(200)
            }
          })

        }else {
          callback(500, {'Error' : 'User file does not exist'})
        }
      })
    }else {
      callback(500, {'Error': 'Missing an optional field'})
    }
  }else{
    callback(500, {'Error' : 'Missing required field'})
  }
}

// Users - delete
// required field: phone
// optional field: none
handlers._users.delete = function(data, callback){
  const phone = typeof(data.queryString.phone) == "string" && data.queryString.phone.trim().length > 10 ? data.queryString.phone.trim() : null
  if(phone){

    _data.read('users', phone, function(err){
      if(err){
        callback(500, {'Error' : 'User data does not exist'})
      }else{
        _data.delete('users', phone, function(err){
          if(err){
            callback(500, {'Error' : 'Error deleting user file'})
          }else{
            callback(200)
          }
        })
      }
    })
  }else{
    callback(500, {'Error' : 'Missing required field'})
  }
}

// handler to handle a not found route
handlers.notFound = function(data, callback){
  callback(404)
}

// export the module
module.exports = handlers