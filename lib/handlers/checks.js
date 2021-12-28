/*
 *
 * checks handler
 * 
 * 
*/ 

// Dependencies
const helpers = require('../helpers')
const _data = require('../data')
const { type } = require('os')
const tokens = require('./tokens')
const config = require('../config')
const { time } = require('console')


// container for checks object 
const checks = {}

// checks -post
checks.post = (data, callback) => {
    // validate inputs
    const protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol : false
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0  ? data.payload.successCodes : false
    const timeOut = typeof(data.payload.timeOut) == 'number' && data.payload.timeOut % 1 == 0 & data.payload.timeOut >=1 && data.payload.timeOut <=5 ? data.payload.timeOut : false
    console.log(protocol, url, method, successCodes, timeOut)
    if(protocol && url && method && successCodes && timeOut){
        // Get the token from the headers
        const token = typeof(data.headers.token) == 'string' && data.headers.token.length == 20 ? data.headers.token : false
        
        if(token){
            // Look up the token in the tokens directory
            _data.read('tokens', token, function(err, tokenData){
                if(!err && tokenData){
                    const userPhone = tokenData.phone

                    // Look up the userPhone in the users directory 
                    _data.read('users', userPhone, function(err, userData){
                        if(!err && userData){
                            // check if checks key exists
                            const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : []
                            
                            // verify that the user has not exceeded the maximum nuber of checks
                            if(userChecks.length < config.maxChecks){
                                // create a random id for checks
                                const checkId = helpers.createRandomString(20)

                                // create check object and add the user's phone for easy reference
                                const checkObj = {
                                    'id' : checkId,
                                    'userPhone' : userPhone,
                                    'protocol' : protocol,
                                    'method' : method,
                                    'url' : url,
                                    'successCodes' : successCodes,
                                    'timeOut' : timeOut
                                }

                                // save checks object in checks folder
                                _data.create('checks',  checkId, checkObj, function(err){
                                    if(!err){
                                        // add the checkId into the checks array in the userData object
                                        userData.checks = userChecks
                                        userData.checks.push(checkId)

                                        // save the new userData
                                        _data.update('users', userPhone, userData, function(err){
                                            if(!err){
                                                callback(200, checkObj)
                                            }else{
                                                callback(500, {'Error' : 'Unable to update the userData with the checks'})
                                            }
                                        })
                                    }else{
                                        callback(403)
                                    }
                                })


                            }else {
                                callback(400, {'Error' : 'maximum number of checks exceeded!'})
                            }

                        }else{
                            callback(403, {'Error' : 'No user exists!'})
                        }
                    })
                }else{
                    callback(403, {'Error' : 'Invalid token provided'})
                }
            })
        }else{
            callback(400, {'Error' : 'No token provided in the headers'})
        }
        
        
    }else{
        callback(400, {'Error' : 'Missig required fields'})
    }
}

// checks -get
// required data: id
// optional data: none
checks.get = (data, callback) => {
    // check if id is valid
    const id = typeof(data.queryString.id) == 'string' && data.queryString.id.trim().length == 20 ? data.queryString.id.trim() : false
    
    if(id){
      // get the token from the headers
      const token = typeof(data.headers.token) == 'string' && data.headers.token ? data.headers.token : false
      if(token){
        // Look up the checks
        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                // verify the token
                tokens.verifyToken(token, checkData.userPhone, function(isTokenVerified){
                    if(isTokenVerified){
                        callback(200, checkData)
                    }else{
                    callback(403)
                    }
                })
            }else{
                callback(403, {'Error' : 'check id doesn not exist'})
            }
        })

      }else {
        callback(400, {'Error' : 'No token provided! Provide a valid one. if a token has not been generated, visit the tokens route to get one'})
      }
  
    }else{
      callback(404)
    }
      
}
  
// checks -put
// required data: id
// optional data: at least one of these {protocol, method, url, successCodes, timeOut}
checks.put = (data, callback) => {
    // Required field
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false

    // optional field
    const protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol : false
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0  ? data.payload.successCodes : false
    const timeOut = typeof(data.payload.timeOut) == 'number' && data.payload.timeOut % 1 == 0 & data.payload.timeOut >=1 && data.payload.timeOut <=5 ? data.payload.timeOut : false

    if(id){
        // check that one of the optional fields is available
        if(protocol || url || method || successCodes || timeOut){

            _data.read('checks', id, function(err, checkData){
                if(!err && checkData){
                    // get the token from the headers
                    const token = typeof(data.headers.token) == 'string' && data.headers.token ? data.headers.token : false
                    // console.log(token)
                    // verify the token
                    tokens.verifyToken(token, checkData.userPhone, function(isTokenVerified){
                        // console.log(isTokenVerified, checkData.userPhone)
                        if(isTokenVerified){
                            if(protocol){
                                checkData.protocol = protocol
                            }
        
                            if(url){
                                checkData.url = url
                            }
        
                            if(method){
                                checkData.method = method
                            }
        
                            if(successCodes){
                                checkData.successCodes = successCodes
                            }
        
                            if(timeOut) {
                                checkData.timeOut = timeOut
                            }   
                            
                            // store the updates
                            _data.update('checks', id, checkData, function(err){
                                if(!err){
                                    callback(200, checkData)
                                }else{
                                    callback(500, {'Error':'Error updating check Data'})
                                }
                            })
                        }else{
                            callback(400, {'Error' : 'Invalid token provided!'})
                        }
                    })

                }else{
                    callback(403, {'Error' : 'Invalid id'})
                }
            })

        }else{
            callback(400, {'Error' : 'Missing field(s) to update'})
        }
    }else{
        callback(400, {'Error' : 'Missing required fields'})
    }
}

// Checks -Delete
checks.delete = (data, callback) => {
    // Required field
    const id = typeof(data.queryString.id) == 'string' && data.queryString.id.trim().length == 20 ? data.queryString.id.trim() : false

    if(id){
        // get the token from the headers
        const token = typeof(data.headers.token) == 'string' && data.headers.token ? data.headers.token : false
        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                // verify the token
                tokens.verifyToken(token, checkData.userPhone, function(isTokenVerified){
                    if(isTokenVerified){
                        _data.read('users', checkData.userPhone, function(err, userData){
                            if(!err && userData){
                                // delete check file with the appropriate id 
                                _data.delete('checks', id, function(err){
                                    if(!err){
                                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [] 
                                        
                                        // just in case the check list is empty
                                        if(userChecks){
                                            const index = userChecks.indexOf(id)
                                            if(index > -1){
                                                userChecks.splice(index, 1)

                                                _data.update('users', checkData.userPhone, userData, function(err){
                                                    if(!err){
                                                        callback(200, userData)
                                                    }else{  
                                                        callback(400, {'Error' : 'unable to update user file'})
                                                    }
                                                })
                                            }else{
                                                callback(403)
                                            }
                                        }else{
                                            callback(403)
                                        }
                                    }else{
                                        callback(400, {'Error' : 'check data can not be deleted'})
                                    }
                                })
        
        
                            }else{
                                callback(400, {'Error' : 'user who created the check does not exist. CheckId can not be delted from user data check list'})
                            }
                        })
                        
                    }else{
                        callback(400, {'Error' : 'Invalid token id'})
                    }
                })

            }else{
                callback(400, {'Error' : 'User check data does not exist!'})
            }
        })
        

    }else{
        callback(500, {'Error' : 'Missing required query.'})
    }

}


// export checks container
module.exports = checks