(function($) {
  var O;

  var f = {
    // init
    'init': function(options) {
      this.html('');
      if (options.hideEmpty) removeEmpty(options.data);
      O.appendCollection.call(this, 'root', options.data);
    },
    // determine types
    'nodeType': function(value) {
      return (value != null && typeof value === "object")
              ? (Object.prototype.toString.apply(value) === '[object Array]' ? 'list' : 'map')
              : 'leaf';
    },
    'leafType': function(value) {
      if (value == null)
        return "null";
      else if (value === "")
        return "empty";
      else
        return typeof value;
    },
    // element creation
    'appendCollection': function(key, value) {
      var nodeType = O.nodeType(value);
      var container = $('<div>').appendTo(this).addClass('collection');

      // construct collection row
      var symbol = nodeType == "map" ? "{}" : "[]";
      var collectionItem = $('<div>').appendTo(this).addClass(nodeType).addClass('collectionRow row');
      var keyElem = $('<span>').appendTo(collectionItem).text(key + ' ' + symbol).addClass('collectionKey key');

      // construct items
      var items = $('<div>').appendTo(this).addClass('collectionItems');
      _.each(value, function(value, key) {
        if (O.nodeType(value) == 'leaf') {
          O.appendLeaf.call(items, key, value);
        } else {
          O.appendCollection.call(items, key, value);
        }
      });
    },
    'appendLeaf': function(key, value) {
      var leafItem = $('<div>').appendTo(this).addClass('leafRow row');
      var keyDiv = $('<div>').appendTo(leafItem).addClass('leafKeyDiv');
      var keyElem = $('<span>').appendTo(keyDiv).text(key).addClass('leafKey key');
      var leafType = O.leafType(value);
      if (value == null)
        value = "null";
      else if (value === "")
        value = '""';
      var valueElem = $('<div>').appendTo(leafItem).text(value).addClass('leafValue').addClass(leafType);
      if (leafType == "string") {
        valueElem.html(valueElem.html().replace("\n", "<br />"));
      }
    },
    // data manipulation
    'removeEmpty': function(data) {
      if (data != null && typeof data == "object") {
        var empty = true;
        $.each(data, function(key, value) {
          if (removeEmpty(value) == false || value == null || value === "") {
            delete data[key];
          } else {
            empty = false;
          }
        });
        if (empty) return false;
      }
      return true;
    }
  };

  O = f.init;
  $.extend(O, f);
  $.fn.outliner = O;

})(jQuery);
