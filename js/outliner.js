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
  
  var _ = this._;
  if (typeof this._ === 'undefined')
    _ = require('underscore');
  
  // From Backbone.js
  // The top-level namespace. All public Outliner classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Outliner;
  if (typeof exports !== 'undefined') {
    Outliner = exports;
  } else {
    Outliner = this.Outliner = {};
  }
  
  Outliner.Node = function(value) {
    this.value = value;
  };
  
  _.extend(Outliner.Node.prototype, {
    expand: function() {
      if (typeof this.value === "object" && (! _.isEmpty(this.value))) {
        if (_.isArray(this.value)) {
          this.children = _.map(this.value, function(value) {
            return new Outliner.Node(value).expand();
          });
        } else {
          this.children = {};
          _.each(this.value, function(value, key) {
            this.children[key] = new Outliner.Node(value).expand();
          }, this);
        }
      }
      return this;
    },
    render: function() {
      if (this.children) {
        this.children.each(function(node) {
          node.render();
        });
      }
      return this.html;
    }
  });
  
  Outliner.Model = Backbone.Model.extend({
    render: function() {
      return new Outliner.Node(this.get('value')).render();
    }
  });

  Outliner.View = Backbone.View.extend({
    render: function() {
      $(this.el).html(this.model.render());
      return this;
    }
  });

})();
