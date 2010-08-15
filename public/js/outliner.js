(function($) {
  $.fn.outliner = function(options) {
    this.html('<textarea>' + JSON.stringify(options.data) + '</textarea>');
    console.log(options);
  };
})(jQuery);
