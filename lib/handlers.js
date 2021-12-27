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
              callback(400,{'Error': 'unable to create user file'} )
            }else {
              callback(200, {'Mssg':`${firstName} data file created successfully!`})
            }
          })
        }else {
          callback(400, {'Error':'Error encrypting user password!. Try again!'})
        }

      }else{
        callback(401,{'Error':'Can not create file, User seem to exist!'})
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
  // check if phone number is valid
  const phone = typeof(data.queryString.phone) == 'string' && data.queryString.phone.trim().length > 10 ? data.queryString.phone.trim() : false
  
  if(phone){
    // get the token from the headers
    const token = typeof(data.headers.token) == 'string' && data.headers.token ? data.headers.token : false
    if(token){
      // verify the token
      handlers._tokens.verifyToken(token, phone, function(isTokenVerified){
        if(isTokenVerified){
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
          callback(400, {'Error' : 'Inavlid token! if a token has not been generated, visit the tokens route to get one'})
        }
      })
    }else {
      callback(400, {'Error' : 'No token provided! Provide a valid one. if a token has not been generated, visit the tokens route to get one'})
    }

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

    // get the token from the headers
    const token = typeof(data.headers.token) == 'string' && data.headers.token ? data.headers.token : false
    if(token){
      // verify the token
      handlers._tokens.verifyToken(token, phone, function(isTokenVerified){
        if(isTokenVerified){
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
                    callback(400, {'Error' : 'Could not update file'})
                  }else {
                    callback(200)
                  }
                })

              }else {
                callback(400, {'Error' : 'User file does not exist'})
              }
            })
          }else {
            callback(400, {'Error': 'Missing an optional field'})
          }

        }else{
          callback(400, {'Error' : 'Inavlid token!'})
        }
      })
    }else{
      callback(400, {'Error' : 'No token provided! Provide a valid one. if a token has not been generated, visit the tokens route to get one'})
    }

  }else{
    callback(400, {'Error' : 'Missing required field'})
  }
}


// Users - delete
// required field: phone
// optional field: none
handlers._users.delete = function(data, callback){
  const phone = typeof(data.queryString.phone) == "string" && data.queryString.phone.trim().length > 10 ? data.queryString.phone.trim() : null
  if(phone){
    // get the token from the headers
    const token = typeof(data.headers.token) == 'string' && data.headers.token ? data.headers.token : false
    if(token){
      // verify the token
      handlers._tokens.verifyToken(token, phone, function(isTokenVerified){
        if(isTokenVerified){
          _data.read('users', phone, function(err){
            if(err){
              callback(400, {'Error' : 'User data does not exist'})
            }else{
              _data.delete('users', phone, function(err){
                if(err){
                  callback(400, {'Error' : 'Error deleting user file'})
                }else{
                  callback(200)
                }
              })
            }
          })
        }else{
          callback(400, {'Error' : 'Inavlid token!'})
        }
      })
    }else{
      callback(400, {'Error' : 'No token provided! Provide a valid one. if a token has not been generated, visit the tokens route to get one'})
    }
  
  }else{
    callback(400, {'Error' : 'Missing required field'})
  }
}


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
handlers._tokens.post = function(data, callback){
  // validate phone and password
  const phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : null
  const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0? data.payload.password.trim() : null

  if(phone && password){
    // Read from the users folder to find the user
    _data.read('users', phone, function(err, userData){
      if(!err && userData){
        // hash the sent password and check if it corresponds with the userData.hashPassword
        if(userData.hashedPassword === helpers.encrypt(password)){
          // if valid, create a token id for the specified user
          const tokenId = helpers.createRandomString(20)
          const expieration = Date.now() + 1000 * 3600

          // Confirm that the tokenId was created successfully
          if(tokenId){
            // create token object data
            const tokenObj = {
              'id' : tokenId,
              'expiers' : expieration,
              'phone' : phone
            }

            // store the token Obj
            _data.create('tokens', tokenId, tokenObj, function(err, data){
              if(!err){
                callback(200, tokenObj)
              }else {
                callback(500, {'Error' : 'Could not create the token for this user'})
              }
            })

          }else {
            callback(500, {'Error' : 'Confirm that the correct length of tokenId was parsed'})
          }

        }else {
          callback(403, {'Error' : 'User password do not match!'})
        }
      }else {
        callback(400, {'Error' : 'User data not found!'})
      }
    })

  }else {
    callback(400, {'Error' : 'Missing required fields'} )
  }
}

// Tokens -get
// required data : id
handlers._tokens.get = function(data, callback){
  // check if id is valid
  const id = typeof(data.queryString.id) == 'string' && data.queryString.id.trim().length == 20 ? data.queryString.id.trim() : false
  if(id){
    // check if the phone number already exists in the user folder
    _data.read('tokens', id, function(err, tokenData){
      if(!err && tokenData){
        callback(200, tokenData)
      }else{
        callback(err)
      }
    })
  }else{
    callback(404)
  }
}

// Tokens -put
// required field: id, extend
handlers._tokens.put = function(data, callback){
  const id = typeof(data.payload.id) == "string" && data.payload.id.trim().length == 20 ? data.payload.id.trim() : null
  const extend = typeof(data.payload.extend) == "boolean" && data.payload.extend == true ? data.payload.extend : false

  // check if id is valid
  if(id && extend){
    _data.read('tokens', id, function(err, tokenData){
    if(!err && tokenData) {
      // check if token hasn't expired
      if(tokenData.expiers > Date.now()){
        tokenData.expiers = Date.now() + 1000 * 3600
        _data.update('tokens', id, tokenData, function(err){
          if(!err){
            callback(200) 
          }else{
            callback(500, {'Error' : 'Could not update token expiration'})
          }
        })
      }else {
        callback(400, {'Error' : 'Token expired! can not extend.'})
      }
      
    }else {
      callback(400, {'Error' : 'user with id does not exist'})
    }
    })
  }else {
    callback(400, {'Error' : 'Missing required field(s)'})
  }
}

// Tokens -delete
handlers._tokens.delete = function(data, callback){
  const id = typeof(data.queryString.id) == "string" && data.queryString.id.trim().length > 10 ? data.queryString.id.trim() : null
  if(id){

    _data.read('tokens', id, function(err){
      if(err){
        callback(400, {'Error' : 'User data does not exist'})
      }else{
        _data.delete('tokens', id, function(err){
          if(err){
            callback(400, {'Error' : 'Error deleting token file'})
          }else{
            callback(200)
          }
        })
      }
    })
  }else{
    callback(400, {'Error' : 'Missing required field'})
  }
}

// verify that token id passed to the headers is valid for the given user
handlers._tokens.verifyToken = function(id, phone, callback){
  //Check the id
  _data.read('tokens', id, function(err, tokenData){
    if(!err && tokenData){
      // check that the token hasn't expired yet
      if(tokenData.phone && tokenData.expiers > Date.now()){
        callback(true)
      }else{
        callback(false)
      }
    }else{
      callback(false)
    }
  })
}


// export the module
module.exports = handlers