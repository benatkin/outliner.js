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

  var Traverse = require('traverse');

  Outliner.CollectionBuilder = function(attr) {
    attr = attr || {};
    this.naturalSort = attr.naturalSort;
    this.resource = attr.resource;
  }

  _.extend(Outliner.CollectionBuilder.prototype, {
    collapseMarkup: "&#x25BE;", // ▾
    expandMarkup: '&#x25B8;', // ▸
    // determine types
    nodeType: function(value) {
      return (value != null && typeof value === "object")
              ? (Object.prototype.toString.apply(value) === '[object Array]' ? 'list' : 'map')
              : 'leaf';
    },
    render: function($el, key, value) {
      var nodeType = this.nodeType(value);
      var $container = $('<div>').appendTo($el).addClass('collection');
      
      var i=0, childKeys, childKey, childValue;

      if (nodeType === 'map') {
        childKeys = [];
        for (var childKey in value) {
          if (value.hasOwnProperty(childKey)) {
            childKeys.push(childKey);
          }
        }
        if (this.naturalSort)
          childKeys.sort(naturalSort);
        else
          childKeys.sort();
      } else {
        childKeys = value;
      }

      // construct collection row
      var symbol = nodeType == "map" ? "{}" : "[]";
      var collectionItem = $('<div>').appendTo($container).addClass(nodeType).addClass('collectionRow row');
      
      var keyMarkup, keyElem;
      if (childKeys.length > 0) {
        keyMarkup = '<span class="collapse">' + this.collapseMarkup + '</span> <span class="label">' + _.escape(key + ' ' + symbol) + "</span>";
        keyElem = $('<span>').appendTo(collectionItem).html(keyMarkup).addClass('collectionKey key');
      } else {
        keyMarkup = '<span class="label">' + _.escape(key) + "</span>";
        keyElem = $('<span>').appendTo(collectionItem).html(keyMarkup).addClass('collectionKey key empty');
        $('<span>').text(symbol).addClass('collectionValue empty').appendTo(collectionItem);
      }

      // construct items
      var $items = $('<div>').appendTo($container).addClass('collectionItems');
      
      for (i=0; i < childKeys.length; i++) {
        if (nodeType === 'map')
          childKey = childKeys[i];
        else
          childKey = i;
        childValue = value[childKey];

        if (this.nodeType(childValue) == 'leaf') {
          this.resource.appendLeaf($items, childKey, childValue);
        } else {
          this.resource.appendCollection($items, childKey, childValue);
        }
      }
    },
    toggleNode: function($el) {
      var $items = $el.children('.collectionItems', $el);
      $items.toggle();
      var collapseMarkup = $items.is(':visible') ? this.collapseMarkup : this.expandMarkup;
      $('.collapse', $el.children('.collectionRow')).html(collapseMarkup);
    },
    selectNode: function($el) {
      $el.find('.key').first().addClass('selected');
    }
  });

  Outliner.LeafBuilder = function(attr) {
  };

  _.extend(Outliner.LeafBuilder.prototype, {
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
        '<div class="leafRow row leaf">',
        '  <div class="leafKeyDiv">',
        '    <span class="leafKey key"><span class="label"><%= key %></span></span>',
        '    <%= valueSpan %>',
        '  </div>',
        '  <%= valueBlock %>',
        '</div>'
      ].join("\n")
    },

    escape: function(attr) {
      return _.escape(String(this[attr]));
    },

    leafType: function() {
      
    },

    renderValue: function(key, value) {
      var leafType = null;

      if (value == null)
        leafType = "null";
      else if (value === "")
        leafType = "empty";
      else
        leafType = typeof value;

      var tpl = this.templates.str, ctx = {leafType: _.escape(leafType), value: _.escape(value)};
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
      if (leafType == "string" && value.indexOf("\n") != -1) {
        return { block: html };
      } else {
        return { span: html }
      }
    },
    render: function(key, value) {
      var rendered = this.renderValue(key, value);
      var ctx = {
        key: _.escape(key),
        valueBlock: rendered.block || '',
        valueSpan: rendered.span || ''
      }
      return _.template(this.templates.leaf, ctx);
    },
    selectNode: function($el) {
      $el.find('.key').first().addClass('selected');
    }
  });

  Outliner.ResourceModel = Backbone.Model.extend({
    defaults: {
      naturalSort: true,
      rootKey: 'root'
    },
    type: 'resource',
    initialize: function(attributes, options) {
      this.lastId = 0;
      this.configure();
    },
    configure: function() {
      this.collectionBuilder = new Outliner.CollectionBuilder({
        resource: this,
        naturalSort: this.get('naturalSort')
      });
      this.leafBuilder = new Outliner.LeafBuilder();
    },
    render: function($el) {
      $el.html('').addClass('outliner');
      this.appendCollection($el, this.get('rootKey'), this.get('data'));
    },
    appendCollection: function($el, key, value) {
      this.collectionBuilder.render($el, key, value);
    },
    // element creation
    appendLeaf: function($el, key, value) {
      $el.append(this.leafBuilder.render(key, value));
    }
  });

  Outliner.ResourceView = Backbone.View.extend({
    events: {
      'click .collapse': 'toggleNode',
      'click .label': 'selectNode'
    },
    render: function() {
      this.model.render($(this.el));
    },
    toggleNode: function(e) {
      var $collection = $(e.target).closest('.collection')
      this.model.collectionBuilder.toggleNode($collection);
    },
    selectNode: function(e) {
      this.$('.key.selected').removeClass('selected');
      var $node = $(e.target).closest('.leaf, .collection');
      if ($node.hasClass('collection')) {
        this.model.collectionBuilder.selectNode($node);
      } else {
        this.model.leafBuilder.selectNode($node);
      }
    }
  });

  // Helpers
  // -------

  /*  Natural Sort algorithm for Javascript - Version 0.6 - Released under MIT license
   *  Author: Jim Palmer (based on chunking idea from Dave Koelle)
   *  Contributors: Mike Grier (mgrier.com), Clint Priest, Kyle Adams, guillermo
   */

  /* naturalSort http://code.google.com/p/js-naturalsort/source/browse/trunk/naturalSort.js */
  var naturalSort = function(a, b) {
    var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
        sre = /(^[ ]*|[ ]*$)/g,
        dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
        hre = /^0x[0-9a-f]+$/i,
        ore = /^0/,
        /* convert all to strings and trim() */
        x = a.toString().replace(sre, '') || '',
        y = b.toString().replace(sre, '') || '',
        /* chunk/tokenize */
        xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
        yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
        /* numeric, hex or date detection */
        xD = parseInt(x.match(hre)) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
        yD = parseInt(y.match(hre)) || xD && y.match(dre) && Date.parse(y) || null;
    /* first try and sort Hex codes or Dates */
    if (yD)
      if ( xD < yD ) return -1;
      else if ( xD > yD ) return 1;
    /* natural sorting through split numeric strings and default strings */
    for (var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
      /* find floats not starting with '0', string or 0 if not defined (Clint Priest) */
      oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
      oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
      /* handle numeric vs string comparison - number < string - (Kyle Adams) */
      if (isNaN(oFxNcL) !== isNaN(oFyNcL)) return (isNaN(oFxNcL)) ? 1 : -1; 
      /* rely on string comparison if different types - i.e. '02' < 2 != '02' < '2' */
      else if (typeof oFxNcL !== typeof oFyNcL) {
        oFxNcL += ''; 
        oFyNcL += ''; 
      }
      if (oFxNcL < oFyNcL) return -1;
      if (oFxNcL > oFyNcL) return 1;
    }
    return 0;
  };

  /*     Backbone.js 0.5.1
   *     (c) 2010 Jeremy Ashkenas, DocumentCloud Inc.
   *     Backbone may be freely distributed under the MIT license.
   *     For all details and documentation:
   *     http://documentcloud.github.com/backbone
   */

  /*     Underscore.js 1.1.7
   *     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
   *     Underscore is freely distributable under the MIT license.
   *     Portions of Underscore are inspired or borrowed from Prototype,
   *     Oliver Steele's Functional, and John Resig's Micro-Templating.
   *     For all details and documentation:
   *     http://documentcloud.github.com/underscore
   */

  // Versions of sortedIndex and sortBy from underscore.js that take two comparison functions:
  // one for getting the key and one for comparing two keys.
  var sortedIndex2 = function(model, criteria, comparator) {
    var array = this.models, low = 0, high = this.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      comparator(this.criteria(array[mid]), this.criteria(model)) < 0 ? low = mid + 1 : high = mid;
    }
    return low;
  };

  var sortBy2 = function(criteria, comparator) {
    return _.pluck(_.map(this.models, function(value, index, list) {
      return {
        value : value,
        criteria : this.criteria(value, index, list)
      };
    }).sort(function(left, right) {
      return comparator(left.criteria, right.criteria);
    }), 'value');
  };

})(this);
