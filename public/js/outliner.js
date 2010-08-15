(function($) {
  $.outliner = {};

  $.outliner.classes = "map mapMargin mapItems mapItem mapKey mapValue " +
                       "list listMargin listItems listItem listIndex listValue " +
                       "collection margin items item key value" +
                       "leaf string boolean number null";

  $.nodeType = function(value) {
    return (value != null && typeof value === "object")
            ? (Object.prototype.toString.apply(value) === '[object Array]' ? 'list' : 'map')
            : 'leaf';
  }
  
  var update = {
    'map': function(value) {
      this.removeClass("list leaf");
      this.children().remove();
      this.addClass("map collection");
      var margin = $('<div>').appendTo(this).addClass('mapMargin margin');
      var mapButton = $('<span>').appendTo(margin).text('{}').addClass('collectionButton');
      var items = $('<div>').appendTo(this).addClass('mapItems items');
      $.each(value, function(key, value) {
        var item = $('<div>').appendTo(items).addClass('mapItem item');
        var keyElem = $('<div>').appendTo(item).addClass('mapKey key');
        keySpan = $('<span>').appendTo(keyElem).text(key);
        var valueElem = $('<div>').appendTo(item).addClass('mapValue value');
        valueElem.value(value);
      });
    },
    'list': function(value) {
      this.removeClass("map leaf");
      this.children().remove();
      this.addClass("list collection");
      var margin = $('<div>').appendTo(this).addClass('listMargin margin');
      var listButton = $('<span>').appendTo(margin).text('[]').addClass('collectionButton');
      var items = $('<div>').appendTo(this).addClass('listItems items');
      $.each(value, function(key, value) {
        var item = $('<div>').appendTo(items).addClass('listItem item');
        var keyElem = $('<div>').appendTo(item).addClass('listKey key');
        keySpan = $('<span>').appendTo(keyElem).text(key);
        var valueElem = $('<div>').appendTo(item).addClass('listValue value');
        valueElem.value(value);
      });
    },
    'leaf': function(value) {
      this.addClass('leaf');
      $('<span>').appendTo(this).text(value);
    }
  }

  $.fn.value = function(value) {
    this.each(function() {
      if (value != undefined) {
        var nodeType = $.nodeType(value);
        update[nodeType].call($(this), value);
      } else {
      }
    });
  }

  $.fn.value.update = update;

  var removeEmpty = function(data) {
    if (data != null && typeof data == "object") {
      var empty = true;
      $.each(data, function(key, value) {
        if (removeEmpty(value) == false || value == null || value == '""') {
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
      if (options.hideEmpty) removeEmpty(options.data);
      render_ul(container, options.data, options)
    },
    'div': function(container, options) {
      container.value(options.data);
    }
  };

  $.fn.outliner = function(options) {
    this.children().remove();
    renderers[options.style](this, options);
  };
})(jQuery);
