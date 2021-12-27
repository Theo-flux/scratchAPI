/*
 *  Project on RESTful API
 *
 */

 // Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const fs = require('fs')
const StringDecoder = require('string_decoder').StringDecoder
const helpers = require('./lib/helpers')
const config = require('./lib/config')
const handlers = require('./lib/handlers')
const routers = require('./lib/routes')


// port to listen from
const HTTP_PORT = config.httpPort
const HTTPS_PORT = config.httpsPort

// instantiating the http server
const httpServer = http.createServer((req,res) => {
  unifiedServer(req, res)
})

// start the http server
httpServer.listen(HTTP_PORT,()=>{
  console.log(`http server listening on port ${HTTP_PORT} now`)
})

const httpsServerProtocolOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
}

// instantiating the https server
const httpsServer = https.createServer( httpsServerProtocolOptions, (req,res) => {
  unifiedServer(req, res)
})

// start the http server
httpsServer.listen(HTTPS_PORT,()=>{
  console.log(`https server listening on port ${HTTPS_PORT} now`)
})

// unifed server function
const unifiedServer = (req,res) => {

  // Get the url parsed
  const parsedUrl = url.parse(req.url, true)
  // console.log(req.url.replace(/^\/+|\/+$/g, ''))

  // get the query string as an object
  const queryString = parsedUrl.query

  // Get the headers as an object
  const headers = req.headers

  // Get the HTTP Method
  const method = req.method.toLowerCase()

  // Get the path from the url parse
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // get the payload if any exists
  const decoder = new StringDecoder('utf-8')
  let payload = ''

  req.on('data', (data) => {
    payload += decoder.write(data)
  })

  req.on('end', () => {
    payload += decoder.end()

    // choose the handler this request should go to if none is found use the nonFound handler
    let chosenRoute = typeof(routers[trimmedPath]) !== 'undefined' ? routers[trimmedPath] : handlers.notFound

    
    const data = {
      'trimmedPath':trimmedPath,
      'queryString':queryString,
      'headers':headers,
      'method':method,
      'payload':helpers.parseJsonToString(payload)
    }

    // route the request to the handler specified in the router
    chosenRoute(data, (statusCode, payload) => {
      //use the status code called back by the handler or use the status code 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200

      //use the payload called back by the handler or use an empty object
      payload = typeof(payload) == 'object' ? payload : {}

      const payloadString = JSON.stringify(payload)

       // return the response
       res.writeHead(statusCode, {'Content-Type': 'application/json'})
       res.end(payloadString)

       // log the request path
       console.log(`Response: `,statusCode, payloadString)
    })

  })
}




