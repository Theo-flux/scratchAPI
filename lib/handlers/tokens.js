/*
 *
 * tokens handler
 * 
 * 
*/ 

// Dependencies
const helpers = require('../helpers')
const _data = require('../data')

const tokens = {}

tokens.post = (data, callback) => {
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


tokens.get = (data, callback) => {
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

tokens.put = (data, callback) => {
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

tokens.delete = (data, callback) => {
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
tokens.verifyToken = (id, phone, callback) => {
  //Check the id
  _data.read('tokens', id, function(err, tokenData){
    if(!err && tokenData){
      // check that the token hasn't expired yet
      // console.log(phone, tokenData.phone)
      
      if(tokenData.phone === phone && tokenData.expiers > Date.now()){
        callback(true)
      }else{
        callback(false)
      }
    }else{
      callback(false)
    }
  })
}



// export tokens container
module.exports = tokens