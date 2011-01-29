var     vows = require('vows'),
    Outliner = require('../js/outliner'),
      assert = require('assert');

vows.describe('Outliner.Model').addBatch({
  "rendering a simple list": {
    topic: new Outliner.Model(),
    "`render`": function(model) {
      assert.equal(model.render(), '');
    }
  }
}).export(module);
