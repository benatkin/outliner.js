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
    var keyElem = $('<span>').appendTo(leafItem).text(key).addClass('leafKey key');
    var leafType = $.leafType(value);
    if (value == null)
      value = "null";
    else if (value === "")
      value = '""';
    var valueElem = $('<span>').appendTo(leafItem).text(value).addClass('leafValue').addClass(leafType);
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

  var addEmpty = function(container, text) {
    var span = $('<span/>').appendTo(container).text(text).addClass('empty');
  }

  var render_ul = function(container, data, options) {
    if (data == null) {
      addEmpty(container, 'null');
    } else if (typeof data == "object") {
      var ul = $('<ul/>').appendTo(container);
      var empty = true;
      $.each(data, function(key, value) {
        var li = $('<li/>').appendTo(ul);
        render_ul(li, value, options);
        var keySpan = $('<span/>').prependTo(li);
        keySpan.text(key).addClass("key");
        empty = false;
      });
      if (empty) {
        container.children().remove();
        addEmpty(container, data.push ? '[]' : '{}');
      }
    } else {
      if (empty == "")
        addEmpty(container, '""');
      else
        container.text(data);
    }
  }

  var renderers = {
    'raw': function(container, options) {
      container.html('<textarea>' + JSON.stringify(options.data, undefined, 2) + '</textarea>');
    },
    'ul': function(container, options) {
      render_ul(container, options.data, options)
    },
    'div': function(container, options) {
      container.appendCollection('root', options.data);
    }
  };

  $.fn.outliner = function(options) {
    this.html('');
    if (options.hideEmpty) removeEmpty(options.data);
    renderers[options.style](this, options);
  };
})(jQuery);
