(function($) {
  $.outliner = {};

  $.nodeType = function(value) {
    return (value != null && typeof value === "object")
            ? (Object.prototype.toString.apply(value) === '[object Array]' ? 'list' : 'map')
            : 'leaf';
  }

  $.leafType = function(value) {
    if (value == null)
      return "null";
    else if (value === "")
      return "empty";
    else
      return typeof value;
  }

  $.each_sorted = function(collection, callback) {
    if (collection && collection.push) {
      $.each(collection, callback);
    } else {
      keys = [];
      $.each(collection, function(key, value) {
        keys.push(key);
      });
      keys.sort();
      $.each(keys, function(ix, key) {
        var value = collection[key];
        callback.call(value, key, value);
      });
    }
  }
  
  $.fn.appendCollection = function(key, value) {
    var nodeType = $.nodeType(value);
    var container = $('<div>').appendTo(this).addClass('collection');

    // construct collection row
    var symbol = nodeType == "map" ? "{}" : "[]";
    var collectionItem = $('<div>').appendTo(this).addClass(nodeType).addClass('collectionRow row');
    var keyElem = $('<span>').appendTo(collectionItem).text(key + ' ' + symbol).addClass('collectionKey key');

    // construct items
    var items = $('<div>').appendTo(this).addClass('collectionItems');
    $.each_sorted(value, function(key, value) {
      if ($.nodeType(value) == 'leaf') {
        items.appendLeaf(key, value);
      } else {
        items.appendCollection(key, value);
      }
    });
  }

  $.fn.appendLeaf = function(key, value) {
    var leafItem = $('<div>').appendTo(this).addClass('leafRow row');
    var keyDiv = $('<div>').appendTo(leafItem).addClass('leafKeyDiv');
    var keyElem = $('<span>').appendTo(keyDiv).text(key).addClass('leafKey key');
    var leafType = $.leafType(value);
    if (value == null)
      value = "null";
    else if (value === "")
      value = '""';
    var valueElem = $('<div>').appendTo(leafItem).text(value).addClass('leafValue').addClass(leafType);
    if (leafType == "string") {
      valueElem.html(valueElem.html().replace("\n", "<br />"));
    }
  }

  var removeEmpty = function(data) {
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

  $.fn.outliner = function(options) {
    this.html('');
    if (options.hideEmpty) removeEmpty(options.data);
    this.appendCollection('root', options.data);
  };
})(jQuery);
