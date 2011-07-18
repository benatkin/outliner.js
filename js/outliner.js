(function($) {
  $.outliner = function($el, options) {
    $el.html('').addClass('outliner');
    this.appendCollection($el, 'root', options.data);
  }

  $.outliner.fn = $.outliner.prototype = {
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
      
      var i=0, key, keys, childValue;

      if (nodeType === 'map') {
        keys = [];
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        keys.sort(this.naturalSort);
      } else {
        keys = value;
      }

      // construct collection row
      var symbol = nodeType == "map" ? "{}" : "[]";
      var collectionItem = $('<div>').appendTo($el).addClass(nodeType).addClass('collectionRow row');
      
      var keyElem;
      if (keys.length > 0) {
        keyElem = $('<span>').appendTo(collectionItem).text(key + ' ' + symbol).addClass('collectionKey key');
      } else {
        keyElem = $('<span>').appendTo(collectionItem).text(key).addClass('collectionKey key empty');
        $('<span>').text(symbol).addClass('collectionValue empty').appendTo(collectionItem);
      }

      // construct items
      var items = $('<div>').appendTo($el).addClass('collectionItems');
      
      for (i=0; i < keys.length; i++) {
        if (nodeType === 'map')
          key = keys[i];
        else
          key = i;
        childValue = value[key];

        if (this.nodeType(childValue) == 'leaf') {
          this.appendLeaf(items, key, childValue);
        } else {
          this.appendCollection(items, key, childValue);
        }
      }
    },
    appendLeaf: function(items, key, value) {
      var leafItem = $('<div>').appendTo(items).addClass('leafRow row');
      var keyDiv = $('<div>').appendTo(leafItem).addClass('leafKeyDiv');
      var keyElem = $('<span>').appendTo(keyDiv).addClass('leafKey key').text(key);
      var leafType = this.leafType(value);
      if (value == null)
        value = "null";
      else if (value === "")
        value = '""';
      var valueElem = $('<div>').appendTo(leafItem).text(value).addClass('leafValue').addClass(leafType);
      if (leafType == "string") {
        valueElem.html(valueElem.html().replace("\n", "<br />"));
      }
    },

    /*
     * Natural Sort algorithm for Javascript - Version 0.6 - Released under MIT license
     * Author: Jim Palmer (based on chunking idea from Dave Koelle)
     * Contributors: Mike Grier (mgrier.com), Clint Priest, Kyle Adams, guillermo
    */
    naturalSort: function (a, b) {
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
        if ( xD < yD )       return -1;
        else if ( xD > yD )  return 1;
      // natural sorting through split numeric strings and default strings
      for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
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
    }
  };

  $.fn.outliner = function(options) {
    this.data('outliner', new($.outliner)(this, options));
  };

})(jQuery);
