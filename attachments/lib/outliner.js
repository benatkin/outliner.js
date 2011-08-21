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

  Outliner.Leaf = function(attr) {
    this._attr = attr;
    this.key = attr.key;
    this.value = attr.value;
    this.resource = attr.resource;
    this.parent = attr.parent;
    var value = this.value;
    if (value == null)
      this.leafType = "null";
    else if (value === "")
      this.leafType = "empty";
    else
      this.leafType = typeof value;
  };

  _.extend(Outliner.Leaf.prototype, {
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

    escape: function(attr) {
      return escapeHTML(String(this[attr]));
    },

    leafType: function() {
      
    },

    renderValue: function() {
      var value = this.value, leafType = this.leafType;
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
      if (leafType == "string" && value.indexOf("\n") != -1) {
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

  Outliner.ResourceModel = Backbone.Model.extend({
    defaults: {
      naturalSort: true,
      rootKey: 'root'
    },
    type: 'resource',
    initialize: function(attributes, options) {
      this.lastId = 0;
      this.bind('change:data', this.build, this);
      this.build();
    },
    build: function() {
      var resource = this;
      this.attributes.root = Traverse(this.attributes.data).map(function(value) {
        this.after(function(value) {
          var node;
          if (this.isLeaf) {
            node = {
              value:    value,
              type:     typeof value,
              resource: resource
            };
          } else {
            var keys = Object.keys(value);
            node = {
              type:     Array.isArray(value) ? 'array' : 'object',
              empty:    keys.length === 0,
              keys:     keys,
              children: value,
              resource: resource
            };
          }

          this.update(node);
        });
      });

      Traverse(this.attributes.root).forEach(function(node) {
        this.before(function() {
          if (this.depth % 2 === 0) {
            if ((node.children || node.value) && this.parents.length !== 0) {
              // skip a node
              node.parent = this.parents[1].node;
            }
            if (node.children) {
              // descend right into the children
              this.keys = ['children'];
            }
            if (node.value) {
              this.block();
            }
          }
        });
      });
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
      var leaf = new Outliner.Leaf({
        key: key,
        value: value
      });
      items.append(leaf.render());
    }
  });

  // Helpers
  // -------

  /*  Copyright 2006 The Closure Library Authors. All Rights Reserved.
   *    
   *  Licensed under the Apache License, Version 2.0 (the "License");
   *  you may not use this file except in compliance with the License.
   *  You may obtain a copy of the License at
   *    
   *       http://www.apache.org/licenses/LICENSE-2.0
   *    
   *  Unless required by applicable law or agreed to in writing, software
   *  distributed under the License is distributed on an "AS-IS" BASIS,
   *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   *  See the License for the specific language governing permissions and
   *  limitations under the License.
   */
  
  /* goog.inherits http://code.google.com/p/closure-library/source/browse/trunk/closure/goog/base.js#1421 */
  var inherits = function(childCtor, parentCtor) {
    /** @constructor */
    function tempCtor() {};
    tempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    childCtor.prototype.constructor = childCtor;
  };

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

  // Include escapeHTML from Backbone.js for direct access
  var escapeHTML = function(string) {
    return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27').replace(/\//g,'&#x2F;');
  };

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
