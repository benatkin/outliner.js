(function($) {
  $.fn.outliner = function(options) {
    this.html('<textarea>' + JSON.stringify(options.data, undefined, 2) + '</textarea>');
    console.log(options);
  };
})(jQuery);
