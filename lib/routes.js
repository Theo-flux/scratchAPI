/*
 *
 * All routes are kept here
 *
*/

// Dependencies
const handlers = require('./handlers')

// request routers object
const routers = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens
}

// export the module
module.exports = routers
