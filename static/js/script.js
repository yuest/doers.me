jQuery( function ( $ ) {
    window.Task = Backbone.Model.extend({
    });
    $('.project:eq(0)').clone().addClass('focused').appendTo('body');
    $('.project:eq(1)').css({ left: '700px' })
    .on('focus', '.jProjectName', function ( ev ) {
        var $el = $( this );
        console.log( $el );
    })
    .on('keydown', '.jProjectName', function ( ev ) {
        if ( ev.keyCode == 13 ) {
            $( this ).trigger('blur');
        };
    })
    .on('blur', '.jProjectName', function ( ev ) {
        var $el = $( this );
        console.log( $el );
    });
});
