/*
 *
 * Users handler
 * 
 * 
*/ 

// Dependencies
const helpers = require('../helpers')
const _data = require('../data')
const tokens = require('./tokens')

const users = {}

// Users - post
users.post = (data, callback) => {
  const firstName = typeof(data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0  ? data.payload.firstName.trim() : null
  const lastName = typeof(data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0  ? data.payload.lastName.trim() : null
  const phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : null
  const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0? data.payload.password.trim() : null
  const tosAgreement = typeof(data.payload.tosAgreement) == "boolean" && data.payload.tosAgreement == true ? true : false
  
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

// user -get
users.get = (data, callback) => {
  // check if phone number is valid
  const phone = typeof(data.queryString.phone) == 'string' && data.queryString.phone.trim().length > 10 ? data.queryString.phone.trim() : false
  
  if(phone){
    // get the token from the headers
    const token = typeof(data.headers.token) == 'string' && data.headers.token ? data.headers.token : false
    if(token){
      // verify the token
      tokens.verifyToken(token, phone, function(isTokenVerified){
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

// users - put
users.put = (data, callback) => {
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
      tokens.verifyToken(token, phone, function(isTokenVerified){
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

// users -Delete
users.delete = (data, callback) => {
  const phone = typeof(data.queryString.phone) == "string" && data.queryString.phone.trim().length > 10 ? data.queryString.phone.trim() : null
  if(phone){
    // get the token from the headers
    const token = typeof(data.headers.token) == 'string' && data.headers.token ? data.headers.token : false
    if(token){
      // verify the token
      tokens.verifyToken(token, phone, function(isTokenVerified){
        if(isTokenVerified){
          _data.read('users', phone, function(err, userData){
            if(err){
              callback(400, {'Error' : 'User data does not exist'})
            }else{
              _data.delete('users', phone, function(err){
                if(err){
                  callback(400, {'Error' : 'Error deleting user file'})
                }else{
                  const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : []
                  
                  const checksArrSize = userChecks.length

                  if(checksArrSize > 0){
                    const isDeleted = false
                    const deletedChecksCount = 0
                    
                    // loop through the check list
                    userChecks.forEach(checkId => {
                      _data.delete('checks', checkId, function(err){
                        if(err){
                          isDeleted = false
                        }
                        deletedChecksCount += 1
                        if(deletedChecksCount === checksArrSize){
                          if(!isDeleted){
                            callback(200)
                          }else{
                            callback(500, {"Error" : "All checks may not have been successfully deleted from the system"})
                          }
                        }
                      })
                    });
                  }else{
                    callback(200)
                  }
                  
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


module.exports = users
