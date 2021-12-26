/*
 * 
 * All helpers are kept here 
 * 
 * 
 */ 

// dependencies
const crypto = require('crypto')
const config = require('./config')

// create helpers container
const helpers = {}

helpers.encrypt = function(str){
    if(str){
        const hash = crypto.createHmac('sha256', config.hashSecretMssg).update(str).digest('hex')
        return hash
    }else {
        return false
    }

}

helpers.parseJsonToString = function(str){
    try{
        const object = JSON.parse(str)
        return object
    }catch(err){
        return {}
    }
}

// Export module 
module.exports = helpers
