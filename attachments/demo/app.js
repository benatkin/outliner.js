(function($) {
  window.OutlinerController = Backbone.Router.extend({
    initialize: function() {
      _.bindAll(this, 'docData', 'navigate');

      $('form').bind('change', this.navigate);
    },
    navigate: function() {
      var options = $('form').serializeObject();
      window.location.hash = options.doc;
    },
    setForm: function() {
      $('select[name=doc]').val(this.doc);
    },
    routes: {
      "*doc": "doc",
      "": "doc"
    },
    doc: function(doc) {
      if (doc) {
        this.doc = doc;
        this.setForm();
      } else {
        var options = $('form').serializeObject();
        this.doc = options.doc;
      }
      $.ajax({
        'url': 'demo/data/' + this.doc + '.json',
        'dataType': 'json',
        'success': this.docData
      });
    },
    docData: function(data) {
      this.data = data;
      this.render();
    },
    render: function() {
      this.resourceModel = new Outliner.ResourceModel({data: this.data});
      this.resourceView = new Outliner.ResourceView({
        model: this.resourceModel,
        el: $('.doc')
      });
      this.resourceView.render();
    }
  });

  $(document).ready(function() {
    window.controller = new OutlinerController();
    Backbone.history.start();
    window.location.hash = window.location.hash;
  });
})(jQuery);
