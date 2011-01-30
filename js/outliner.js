//     Outliner.js 0.0.1-SNAPSHOT
//     (c) 2011 Ben Atkin
//     Outliner.js may be freely distributed under the MIT license.
//
//     Contains code from Backbone.js:
//     (c) 2010 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://documentcloud.github.com/backbone

(function(){

  var Backbone = this.Backbone;
  if (typeof this.Backbone === 'undefined')
    Backbone = require('backbone');
  
  // From Backbone.js
  // The top-level namespace. All public Outliner classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Outliner;
  if (typeof exports !== 'undefined') {
    Outliner = exports;
  } else {
    Outliner = this.Outliner = {};
  }

  Outliner.View = Backbone.View.extend({
    render: function() {
      $(this.el).html('');
      return this;
    }
  });

})();
