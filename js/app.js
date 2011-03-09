(function($) {
  window.OutlinerController = Backbone.Controller.extend({
    initialize: function() {
      _.bindAll(this, 'docData', 'navigate');

      $('form').bind('change', this.navigate);
    },
    navigate: function() {
      var options = $('form').serializeObject();
      window.location.hash = options.renderer + '/' + options.doc;
    },
    setForm: function() {
      $('select[name=renderer]').val(this.renderer);
      $('select[name=doc]').val(this.doc);
    },
    routes: {
      ":renderer/:doc": "doc",
      "": "doc"
    },
    doc: function(renderer, doc) {
      if (renderer && doc) {
        this.renderer = renderer;
        this.doc = doc;
        this.setForm();
      } else {
        var options = $('form').serializeObject();
        this.renderer = options.renderer;
        this.doc = options.doc;
      }
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
      if (this.renderer === 'keybubble') {
        var options = {data: this.data};
        $('.doc').keybubble(options);
      } else {
        var template = "<textarea rows=30 cols=80>{{ data }}</textarea>";
        var data = { data: JSON.stringify(this.data, null, 2) };
        var html = $.mustache(template, data);
        $('.doc').html(html);
      }
    }
  });

  $(document).ready(function() {
    window.controller = new OutlinerController();
    Backbone.history.start();
    window.location.hash = window.location.hash;
  });
})(jQuery);
