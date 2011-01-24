(function($) {
  window.OutlinerController = Backbone.Controller.extend({
    init: function() {
      _.bindAll(this, 'docData', 'navigate');

      var navvy = this.navigate;
      $('form').bind('change', function() {
        var options = $('form').serializeObject();
        navvy(options.renderer, options.doc);
      });
    },
    navigate: function(renderer, doc) {
      window.location.hash = renderer + '/' + doc;
    },
    routes: {
      ":renderer/:doc": "doc"
    },
    doc: function(renderer, doc) {
      this.renderer = renderer;
      this.doc = doc;
      $.ajax({
        'url': 'data/' + this.doc + '.json',
        'dataType': 'json',
        'success': this.docData
      });
    },
    docData: function(data) {
      this.data = data;
      this.render();
    },
    render: function() {
      $('.doc').html('');
      if (this.renderer == 'keybubble') {
        var options = {data: this.data};
        $('.doc').keybubble(options);
      } else {
        var template = "<textarea rows=30 cols=80>{{ data }}</textarea>";
        var data = { data: JSON.stringify(this.data, null, 2) };
        var html = Flatstache.to_html(template, data);
        $('.doc').html(html);
      }
    }
  });

  $(document).ready(function() {
    window.outliner_controller = new OutlinerController();
    window.outliner_controller.init();
    Backbone.history.start();
    $('form').change();
  });
})(jQuery);
