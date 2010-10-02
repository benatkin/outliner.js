(function($) {
  $(document).ready(function() {
    $('form').bind('change', function() {
      var options = $('form').serializeObject();
      $.ajax({
        'url': 'docs/' + options.doc + '.json',
        'dataType': 'json',
        'success': function(data) {
          options['data'] = data;
          $('.doc').outliner(options);
        }
      });
    }).change();
  });
})(jQuery);
