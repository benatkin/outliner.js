(function() {
  var app, express, path;
  express = require('express');
  path = require('path');
  app = express.createServer();
  app.use(express.static(path.dirname(__dirname)));
  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.listen(5100);
}).call(this);
