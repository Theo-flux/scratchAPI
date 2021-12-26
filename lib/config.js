/*
 *
 *  Config file for the app
 *
 */

// create an empty object to store the enviroment variables
const enviroment = {}

// create the staging [default] enviroment
enviroment.staging = {
    envName: "staging",
    httpPort: 3000,
    httpsPort: 3001,
    hashSecretMssg: "thisIsSupposeToBeASecretMssg" 
}

// create the production enviroment
enviroment.production = {
    envName: "production",
    httpPort: 5000,
    httpsPort: 5001,
    hashSecretMssg: "thisIsSupposeToBeASecretMssgAlso"
}


// Determine the enviroment that was passed. if none was passed default to the staging enviroment
const currentEnv = typeof(process.env.NODE_ENV) === "string" ? process.env.NODE_ENV.toLowerCase() : ""

// check that the current enviroment is one of the enviroment variable, if not default to staging
const enviromentToExport = typeof(enviroment[currentEnv]) == "object" ? enviroment[currentEnv] : enviroment.staging

// export the enviroment
module.exports = enviromentToExport

