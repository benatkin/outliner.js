var couchapp   = require('couchapp'),
    path       = require('path');

ddoc = {
  _id: '_design/outliner',
  rewrites: [
    { from: "/",           to: 'index.html' },
    { from: "/outliner",   to: '../../'     },
    { from: "/outliner/*", to: '../../*'    },
    { from: "/*",          to: '*'          }
  ]
};

ddoc.views = {};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database.";
  }
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;