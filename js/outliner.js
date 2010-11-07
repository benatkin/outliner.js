(function($) {
  window.Outliner = {};

  window.Outliner.Pair = Backbone.Model.extend({
    initialize: function() {}
  });

  window.Outliner.Collection = Backbone.Collection.extend({
    model: Outliner.Pair,
    comparator: function(pair) {
      return pair.get("key");
    }
  });

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
  
  $.fn.appendCollection = function(key, value) {
    var nodeType = $.nodeType(value);
    var container = $('<div>').appendTo(this).addClass('collection');

    // construct collection row
    var symbol = nodeType == "map" ? "{}" : "[]";
    var collectionItem = $('<div>').appendTo(this).addClass(nodeType).addClass('collectionRow row');
    var keyElem = $('<span>').appendTo(collectionItem).text(key + ' ' + symbol).addClass('collectionKey key');

    var map = new Outliner.Collection();
    _.each(value, function(value, key) {
      map.add(new Outliner.Pair({ "value": value, "key": key }));
    });

    // construct items
    var items = $('<div>').appendTo(this).addClass('collectionItems');
    map.each(function(pair) {
      if ($.nodeType(pair.get("value")) == 'leaf') {
        items.appendLeaf(pair.get("key"), pair.get("value"));
      } else {
        items.appendCollection(pair.get("key"), pair.get("value"));
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
    this.appendCollection('root', options.data, options);
  };
})(jQuery);
