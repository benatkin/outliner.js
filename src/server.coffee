express = require 'express'
path    = require 'path'

app = express.createServer()

app.use express.static path.dirname __dirname

app.configure 'development', ->
  app.use express.errorHandler {dumpExceptions: true, showStack: true}

app.listen 5100
