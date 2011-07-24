(function() {

  var root = this;

  // Export Outliner for CommonJS and non-CommonJS environments.
  var Outliner;
  if (typeof exports !== 'undefined') {
    Outliner = exports;
  } else {
    Outliner = this.Outliner = {};
  }

  // Get a reference to Underscore.js and Backbone.js, from the root object or through require().
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;

  var Backbone = root.Backbone;
  if (!_ && (typeof require !== 'undefined')) Backbone = require('backbone');

  Outliner.Model = Backbone.Model.extend({
    type: 'node',
    escape: function(attr) {
      return escapeHTML(String(this.get(attr)));
    },
    createChildren: function() {
      var value = this.get('value');
      return _.map(value, function(childValue, childKey, value) {
        return Outliner.Model.create({
          key: childKey,
          value: childValue,
          resource: this.resource,
          parent: this
        });
      }, this);
    }
  },
  {
    // Create a model instance, based on the attributes.
    create: function(attributes, options) {
      var value = attributes.value;
      if (_.isArray(value)) {
        return Outliner.ListModel.create(attributes, options);
      } else if (typeof value === 'object') {
        return Outliner.MapModel.create(attributes, options);
      } else {
        return Outliner.LeafModel.create(attributes, options);
      }
    }
  });
  Outliner.MapModel = Outliner.Model.extend({
    type: 'map',
    initialize: function(attributes, options) {
      this.resource = this.attributes.resource;
      this.parent = this.attributes.parent;
      this.children = new Outliner.MapCollection(this.createChildren(), {naturalSort: this.resource.get('naturalSort')});
    }
  },
  {
    create: function(attributes, options) {
      return new Outliner.MapModel(attributes, options);
    }
  });

  Outliner.ListModel = Outliner.Model.extend({
    type: 'list',
    initialize: function(attributes, options) {
      this.resource = this.attributes.resource;
      this.parent = this.attributes.parent;
      this.children = new Outliner.ListCollection(this.createChildren());
    }
  },
  {
    create: function(attributes, options) {
      return new Outliner.ListModel(attributes, options);
    }
  });

  Outliner.LeafModel = function(attributes, options) {
    this.attributes = attributes;
    this.initialize(attributes, options);
  }

  _.extend(Outliner.LeafModel.prototype, {
    type: 'leaf',

    // The underscore templates.
    templates: {
      link: '<a href="<%= url %>" class="leafValue <%= leafType %>"><%= value %></a>',
      str: '<span class="leafValue <%= leafType %>"><%= value %></span>',
      text: [
        '<div class="leafValueDiv">',
        '  <pre class="leafValue string multiline"><%= value %></pre>',
        '</div>'
      ].join("\n"),
      leaf: [
        '<div class="leafRow row">',
        '  <div class="leafKeyDiv leaf">',
        '    <span class="leafKey key"><%= key %></span>',
        '    <%= valueSpan %>',
        '  </div>',
        '  <%= valueBlock %>',
        '</div>'
      ].join("\n")
    },

    initialize: function(attributes, options) {
      this.attributes.leafType = this.leafType();
    },

    get: function(attr) {
      return this.attributes[attr];
    },

    set: function(attrs) {
      _.extend(this.attributes, attrs);
    },

    escape: function(attr) {
      return escapeHTML(String(this.get(attr)));
    },

    leafType: function() {
      var value = this.get('value');
      if (value == null)
        return "null";
      else if (value === "")
        return "empty";
      else
        return typeof value;
    },

    renderValue: function() {
      var value = this.get('value'), leafType = this.get('leafType');
      var tpl = this.templates.str, ctx = {leafType: this.escape('leafType'), value: this.escape('value')};
      var div = false;
      if (value == null) {
        ctx.value = 'null';
      } else if (value === "") {
        ctx.value = '""';
      } else if (leafType == "string" && value.indexOf("\n") != -1) {
        tpl = this.templates.text;
      } else if (/^(?:https?|mailto):/.test(value)) {
        tpl = this.templates.link;
        ctx.url = ctx.value;
      }

      var html = _.template(tpl, ctx);
      if (tpl === tpl.text) {
        return { block: html };
      } else {
        return { span: html }
      }
    },
    render: function() {
      var rendered = this.renderValue();
      var ctx = {
        key: this.escape('key'),
        valueBlock: rendered.block || '',
        valueSpan: rendered.span || ''
      }
      return _.template(this.templates.leaf, ctx);
    }
  });

  _.extend(Outliner.LeafModel, {
    create: function(attributes, options) {
      return new Outliner.LeafModel(attributes, options);
    }
  });

  Outliner.ResourceModel = Backbone.Model.extend({
    defaults: {
      naturalSort: true,
      rootKey: 'root'
    },
    type: 'resource',
    initialize: function(attributes, options) {
      this.root = Outliner.Model.create({resource: this, key: this.get('rootKey'), value: this.get('data')});
    },
    render: function($el) {
      $el.html('').addClass('outliner');
      this.appendCollection($el, this.get('rootKey'), this.get('data'));
    },
    // determine types
    nodeType: function(value) {
      return (value != null && typeof value === "object")
              ? (Object.prototype.toString.apply(value) === '[object Array]' ? 'list' : 'map')
              : 'leaf';
    },
    // element creation
    appendCollection: function($el, key, value) {
      var nodeType = this.nodeType(value);
      var container = $('<div>').appendTo($el).addClass('collection');
      
      var i=0, childKeys, childKey, childValue;

      if (nodeType === 'map') {
        childKeys = [];
        for (var childKey in value) {
          if (value.hasOwnProperty(childKey)) {
            childKeys.push(childKey);
          }
        }
        if (this.get('naturalSort') === true)
          childKeys.sort(naturalSort);
        else
          childKeys.sort();
      } else {
        childKeys = value;
      }

      // construct collection row
      var symbol = nodeType == "map" ? "{}" : "[]";
      var collectionItem = $('<div>').appendTo($el).addClass(nodeType).addClass('collectionRow row');
      
      var keyElem;
      if (childKeys.length > 0) {
        keyElem = $('<span>').appendTo(collectionItem).text(key + ' ' + symbol).addClass('collectionKey key');
      } else {
        keyElem = $('<span>').appendTo(collectionItem).text(key).addClass('collectionKey key empty');
        $('<span>').text(symbol).addClass('collectionValue empty').appendTo(collectionItem);
      }

      // construct items
      var items = $('<div>').appendTo($el).addClass('collectionItems');
      
      for (i=0; i < childKeys.length; i++) {
        if (nodeType === 'map')
          childKey = childKeys[i];
        else
          childKey = i;
        childValue = value[childKey];

        if (this.nodeType(childValue) == 'leaf') {
          this.appendLeaf(items, childKey, childValue);
        } else {
          this.appendCollection(items, childKey, childValue);
        }
      }
    },
    appendLeaf: function(items, key, value) {
      var leaf = new Outliner.LeafModel({
        key: key,
        value: value
      });
      items.append(leaf.render());
    }
  });

  Outliner.Collection = Backbone.Collection.extend({
    initialize: function(models, options) {
      this.naturalSort = options && options.naturalSort;
      return Backbone.Collection.prototype.initialize.call(models, options);
    },
    comparator: function(model) {
      return model.get('key');
    },
    sortBy: function(comparator) {
      if (! this.naturalSort) return Backbone.Collection.prototype.sortBy.call(this, comparator);

      return _.pluck(_.map(this.models, function(value, index, list) {
        return {
          value : value,
          criteria : this.comparator(value, index, list)
        };
      }).sort(function(left, right) {
        return naturalSort(left.criteria, right.criteria);
      }), 'value');
    },
    sortedIndex: function(model, comparator) {
      if (! this.naturalSort) return Backbone.Collection.prototype.sortedIndex.call(this, model, comparator);

      var array = this.models, low = 0, high = this.length;
      while (low < high) {
        var mid = (low + high) >> 1;
        naturalSort(this.comparator(array[mid]), this.comparator(model)) < 0 ? low = mid + 1 : high = mid;
      }
      return low;
    }
  });

  Outliner.MapCollection = Outliner.Collection.extend({});

  Outliner.ListCollection = Outliner.Collection.extend({});

  // Helpers
  // -------

  /*
   * escapeHTML from Backbone.js (https://github.com/documentcloud/backbone)
   * Copyright (c) 2010 Jeremy Ashkenas, DocumentCloud
   * MIT License
   */
  var escapeHTML = function(string) {
    return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27').replace(/\//g,'&#x2F;');
  }

  // 
  /*
   * Natural Sort algorithm for Javascript - Version 0.6 - Released under MIT license
   * Author: Jim Palmer (based on chunking idea from Dave Koelle)
   * Contributors: Mike Grier (mgrier.com), Clint Priest, Kyle Adams, guillermo
   */
  var naturalSort = function(a, b) {
    var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
        sre = /(^[ ]*|[ ]*$)/g,
        dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
        hre = /^0x[0-9a-f]+$/i,
        ore = /^0/,
        // convert all to strings and trim()
        x = a.toString().replace(sre, '') || '',
        y = b.toString().replace(sre, '') || '',
        // chunk/tokenize
        xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
        yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
        // numeric, hex or date detection
        xD = parseInt(x.match(hre)) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
        yD = parseInt(y.match(hre)) || xD && y.match(dre) && Date.parse(y) || null;
    // first try and sort Hex codes or Dates
    if (yD)
      if ( xD < yD ) return -1;
      else if ( xD > yD ) return 1;
    // natural sorting through split numeric strings and default strings
    for (var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
      // find floats not starting with '0', string or 0 if not defined (Clint Priest)
      oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
      oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
      // handle numeric vs string comparison - number < string - (Kyle Adams)
      if (isNaN(oFxNcL) !== isNaN(oFyNcL)) return (isNaN(oFxNcL)) ? 1 : -1; 
      // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
      else if (typeof oFxNcL !== typeof oFyNcL) {
        oFxNcL += ''; 
        oFyNcL += ''; 
      }
      if (oFxNcL < oFyNcL) return -1;
      if (oFxNcL > oFyNcL) return 1;
    }
    return 0;
  };

})(this);