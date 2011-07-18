(function($) {
  $.outliner = function($el, options) {
    this.options = $.extend({}, this.defaults, options);
    $el.html('').addClass('outliner');
    this.appendCollection($el, this.options.rootKey, this.options.data);
  }

  $.outliner.fn = $.outliner.prototype = {
    defaults: {
      naturalSort: true,
      rootKey: 'root'
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
        if (this.options.naturalSort === true && $.naturalSort !== 'undefined')
          childKeys.sort($.naturalSort);
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
  };

  $.fn.outliner = function(options) {
    this.data('outliner', new($.outliner)(this, options));
  };

})(jQuery);