(function($) {
  var render_ul = function(container, data, options) {
    if (data == null) {
      container.text('null');
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
        container.text(data.push ? '[]' : '{}');
      }
    } else {
      container.text(data);
    }
  }

  var renderers = {
    'raw': function(container, options) {
      container.html('<textarea>' + JSON.stringify(options.data, undefined, 2) + '</textarea>');
    },
    'ul': function(container, options) { return render_ul(container, options.data, options) }
  };

  $.fn.outliner = function(options) {
    this.children().remove();
    renderers[options.style](this, options);
  };
})(jQuery);
