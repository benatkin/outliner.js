var couchapp = require('couchapp'),
    path     = require('path');

ddoc = {
  _id: '_design/redir',
  rewrites: [
    { from: "/*", to: '_show/redirect', query: {path: '*'} }
  ]
};

ddoc.shows = {
  redirect: function(doc, req) {
    return {
      code : 301,
      headers : {
        "Location": 'http://outlinerjs.com/' + req.query.path
      }
    };
  }
};

module.exports = ddoc;