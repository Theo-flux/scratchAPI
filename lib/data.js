/*
 *
 *  Library for editing and storing data
 * 
 */

// Dependencies
const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')


// container object for the module to be exported
const lib = {}

// Get the path for the base directory where data will be stored 
lib.baseDir = path.join(__dirname,'../.data/')

// create a file
lib.create = function(dirName, fileName, data, callback){
    // file path
    const filePath = lib.baseDir+dirName+'/'+fileName+'.json'
    
    // attempting to open file
    fs.open(filePath, 'wx', function(err, fileDescriptor){
        if(err){
            callback("\nerror creating new file!. \nIt may already exist.")
        }else{
            // convert data into string
            const dataString = JSON.stringify(data)
            fs.writeFile(fileDescriptor, dataString, function(err){
                if(err){
                    callback("error writing data into new file!")
                }else{
                    // attempting to close the file
                    fs.close(fileDescriptor, function(err){
                        if(err){
                            callback("error closing the file!")
                        }else{
                            callback(false)
                        }
                    })
                }
            })
        }

    })
}

// read from a file
lib.read = function(dirName, fileName, callback){
    // file path to read from
    const filePath = lib.baseDir+dirName+'/'+fileName+'.json'

    fs.readFile(filePath, 'utf8', function(err, fileContent){
        if(!err && fileContent){
            const parsedData = helpers.parseJsonToString(fileContent)
            callback(false, parsedData)
        }else{
            callback(err, fileContent)
        }
    })
}

// update an existing file
lib.update = function(dirName, fileName, data, callback){
    // get the full path to the file
    const filePath = lib.baseDir+dirName+'/'+fileName+'.json'

    // open the file
    fs.open(filePath, 'r+', function(err, fileDescriptor){
        if(err){
            callback("\ncould not open the file. Check if file or path exists")
        }else{
            // truncate file
            fs.truncate(fileDescriptor, function(err){
                if(err){
                    callback("Error truncating file!")
                }else{
                    // convert json to string
                    const dataString = JSON.stringify(data) 

                    // write into the file
                    fs.writeFile(fileDescriptor, dataString, function(err){
                        if(err){
                            callback("Error writitng into the file!")
                        }else{
                            // attempting to close the file
                            fs.close(fileDescriptor, function(err){
                                if(err){
                                    callback("error closing the file!")
                                }else{
                                    callback(false)
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}


// Deleting a file
lib.delete = function(dirName, fileName, callback){
    const filePath = lib.baseDir+dirName+'/'+fileName+'.json'
    // unlink file
    fs.unlink(filePath, function(err){
        if(err){
            callback("Error deleting file!")
        }else{
            callback(false)
        }
    })
}

// exported container object
module.exports = lib