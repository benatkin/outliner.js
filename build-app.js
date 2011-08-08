var browserify = require('browserify'),
    fs         = require('fs');

var bundle = browserify()
             .use(require('shimify'))
             .require('seq')
             .require('traverse')
             .require('hashish')
             .require('chainsaw');

fs.writeFileSync('attachments/vendor/bundle.js', bundle.bundle());