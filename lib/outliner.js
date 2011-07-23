(function() {

  var root = this;

  // pattern to support environments with and without require() from Backbone.js
  var Outliner;
  if (typeof exports !== 'undefined') {
    Outliner = exports;
  } else {
    Outliner = this.Outliner = {};
  }

  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;

  var Backbone = root.Backbone;
  if (!_ && (typeof require !== 'undefined')) Backbone = require('backbone');

  // Backbone.js doesn't export this, but I want it
  var escapeHTML = function(string) {
    return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27').replace(/\//g,'&#x2F;');
  }

  /*
   * Natural Sort algorithm for Javascript - Version 0.6 - Released under MIT license
   * Author: Jim Palmer (based on chunking idea from Dave Koelle)
   * Contributors: Mike Grier (mgrier.com), Clint Priest, Kyle Adams, guillermo
   */
  naturalSort = function(a, b) {
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

  Outliner.Outline = Backbone.Model.extend({
    defaults: {
      naturalSort: true,
      rootKey: 'root'
    },
    initialize: function(attributes, options) {
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
    leafType: function(value) {
      if (value == null)
        return "null";
      else if (value === "")
        return "empty";
      else
        return typeof value;
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
      var leafType, leafItem, keyDiv, keyElem, valueDiv, valueElem;

      leafType = this.leafType(value);

      leafItem = $('<div>').appendTo(items).addClass('leafRow row');
      keyDiv = $('<div>').appendTo(leafItem).addClass('leafKeyDiv');
      keyElem = $('<span>').appendTo(keyDiv).addClass('leafKey key').text(key);

      if (value == null)
        value = "null";
      else if (value === "")
        value = '""';
      if (leafType == "string" && value.indexOf("\n") != -1) {
        valueDiv = $('<div>').appendTo(leafItem).addClass('leafValueDiv');
        valueElem = $('<pre>').appendTo(valueDiv).text(value).addClass('leafValue string multiline');
      } else {
        valueElem = $('<span>').appendTo(keyDiv).text(value).addClass('leafValue').addClass(leafType);
      }
    }
  });

})(this);