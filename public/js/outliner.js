(function($) {
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
    }
  };

  $.fn.outliner = function(options) {
    this.children().remove();
    renderers[options.style](this, options);
  };
})(jQuery);
