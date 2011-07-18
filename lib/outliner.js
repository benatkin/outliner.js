(function($) {
  $.outliner = function($el, options) {
    this.options = $.extend({}, this.defaults, options);
    $el.html('').addClass('outliner');
    this.appendCollection($el, 'root', this.options.data);
  }

  $.outliner.fn = $.outliner.prototype = {
    defaults: {
      naturalSort: true
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
      
      var i=0, key, keys, childValue;

      if (nodeType === 'map') {
        keys = [];
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        if (this.options.naturalSort === true && $.naturalSort !== 'undefined')
          keys.sort($.naturalSort);
        else
          keys.sort();
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
    }
  };

  $.fn.outliner = function(options) {
    this.data('outliner', new($.outliner)(this, options));
  };

})(jQuery);