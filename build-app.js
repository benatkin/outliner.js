var browserify = require('browserify'),
    fs         = require('fs');

var bundle = browserify({
	require: ['seq', 'traverse', 'hashish', 'shimify', 'chainsaw']
});

fs.writeFileSync('attachments/vendor/bundle.js', bundle.bundle());