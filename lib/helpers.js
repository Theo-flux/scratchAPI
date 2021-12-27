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

// create an encrypted version of the user password
helpers.encrypt = function(str){
    if(str){
        const hash = crypto.createHmac('sha256', config.hashSecretMssg).update(str).digest('hex')
        return hash
    }else {
        return false
    }

}

// convert an object to a string
helpers.parseJsonToString = function(str){
    try{
        const object = JSON.parse(str)
        return object
    }catch(err){
        return {}
    }
}

// Generate a sequence of random alphanumeric characters
helpers.createRandomString = function(strLength){
    // validate the strLength
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false
    
    if(strLength){
        // create a variable of possible characters
        let possibleChar = 'abcdefghijklmnopqrstuvwxyz0123456789'

        // initialise an empty str variable
        let possibleStr = ''

        for(i = 0; i < strLength; i++){
            // get a random character from the possibleChar variable
            let randomChar = possibleChar.charAt(Math.floor(Math.random() * possibleChar.length))
            
            possibleStr += randomChar
        }
        return possibleStr

    }else {
        return false
    }
}







// Export module 
module.exports = helpers
