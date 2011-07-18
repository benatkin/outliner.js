(function($) {
  $.outliner = function($el, options) {
    $el.html('');
    var container = $('<div>').addClass('outliner').appendTo($el);
    if (options.hideEmpty) removeEmpty(options.data);
    this.appendCollection(container, 'root', options.data);
  }

  $.outliner.fn = $.outliner.prototype = {
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
    'appendCollection': function($el, key, value) {
      var nodeType = this.nodeType(value);
      var container = $('<div>').appendTo($el).addClass('collection');

      // construct collection row
      var symbol = nodeType == "map" ? "{}" : "[]";
      var collectionItem = $('<div>').appendTo($el).addClass(nodeType).addClass('collectionRow row');
      var keyElem = $('<span>').appendTo(collectionItem).text(key + ' ' + symbol).addClass('collectionKey key');

      // construct items
      var items = $('<div>').appendTo($el).addClass('collectionItems');
      var that = this;
      _.each(value, function(value, key) {
        if (that.nodeType(value) == 'leaf') {
          that.appendLeaf(items, key, value);
        } else {
          that.appendCollection(items, key, value);
        }
      });
    },
    'appendLeaf': function(items, key, value) {
      var leafItem = $('<div>').appendTo(items).addClass('leafRow row');
      var keyDiv = $('<div>').appendTo(leafItem).addClass('leafKeyDiv');
      var keyElem = $('<span>').appendTo(keyDiv).text(key).addClass('leafKey key');
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
    if (! $(this).data('outliner')) {
      this.data('outliner', new($.outliner)($(this), options));
    } else {
      this.data('outliner').call(options);
    }
  };

})(jQuery);
