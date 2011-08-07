var browserify = require('browserify'),
    fs         = require('fs');

var bundle = browserify({
	require: ['seq', 'traverse', 'hashish', 'shimify']
});

fs.writeFileSync('attachments/vendor/bundle.js', bundle.bundle());