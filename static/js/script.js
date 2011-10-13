jQuery( function ( $ ) {
    window.MList = Backbone.Model.extend({
        defaults: {
            title: ''
        }
    });

    window.VList = Backbone.View.extend({
        tagName: 'section'
        ,className: 'project focused'
        ,template: doT.template(' <div class="move-handler jMoveHandler"></div> <h1 class="jProjectName" contenteditable>{{=it.title}}</h1> <ul></ul> ')
        ,initialize: function () {
            $( this.el ).html( this.template( this.model.toJSON())).appendTo('body');
            this.$('.jProjectName').trigger('focus');
        }
    });

    new VList({model: new MList()});
    //$('.project:eq(0)').clone().addClass('focused').appendTo('body');
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
    })
    .on('keydown', 'span[contenteditable]', function ( ev ) {
        var $el = $( this );
        if (ev.keyCode == 8 && !$el.text().length && $el.height() <= 24) {
            return false;
        }
        if (ev.keyCode == 27) {
            $el.trigger('blur');
        }
    });
});
