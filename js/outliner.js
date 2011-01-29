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

  // From Backbone.js
  // The top-level namespace. All public Outliner classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Outliner;
  if (typeof exports !== 'undefined') {
    Outliner = exports;
  } else {
    Outliner = this.Outliner = {};
  }

  // The model for a collection of expanded nodes.
  Outliner.NodeCollection = Backbone.Model.extend({
  });

  // The model for an expanded node.
  Outliner.NodeModel = Backbone.Model.extend({
  });

  // The model for a tree of data.
  Outliner.Model = Backbone.Model.extend({
    renderMarkup: function() {
      return "";
    }
  });

  // The Outline view.
  Outliner.View = Backbone.View.extend({
    render: function() {
      $(this.el).html(this.model.renderMarkup());
      return this;
    }
  });

})();
