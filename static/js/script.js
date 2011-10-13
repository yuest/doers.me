jQuery( function ( $ ) {
    var _mo; //moving object, a view object

    window.Project = Backbone.Model.extend({
        defaults: {
            title: ''
        }
    });

    window.ProjectView = Backbone.View.extend({
        model: Project
        ,tagName: 'section'
        ,className: 'project focused'
        ,template: doT.template(' <div class="move-handler jMoveHandler"></div> <h1 class="jProjectName" contenteditable>{{=it.title}}</h1> <ul></ul> ')
        ,initialize: function () {
            $( this.el ).html( this.template( this.model.toJSON())).appendTo('body');
            this.$('.jProjectName').trigger('focus');
            this.model.bind('change:title', function( a, b ) {
                console.log( a.changedAttributes() );
                console.log( this );
            }, this);
        }
        ,events: {
            'keydown .jProjectName': 'titleKeydown'
            ,'blur .jProjectName': 'titleBlur'
            ,'mousedown .jMoveHandler': 'handlerMouseDown'
            ,'mouseup .jMoveHandler': 'handlerMouseUp'
        }
        ,titleKeydown: function ( ev ) {
            var $elv = $( this.el )
                ,$el = $( ev.currentTarget )
                ;
            if (_.indexOf([13,27], ev.keyCode) != -1) {
                $el.trigger('blur');
            };
        }
        ,titleBlur: function ( ev ) {
            this.model.set({'title': $( ev.currentTarget ).text()});
        }
        ,handlerMouseDown: function ( ev ) {
            var _offset = $( this.el ).offset();
            _mo = {
                $el: $( this.el )
                ,offsetX: ev.pageX - _offset.left
                ,offsetY: ev.pageY - _offset.top
            };
        }
        ,handlerMouseUp: function ( ev ) {
            _mo = void 0;
        }
        ,moving: false
    });
    $(document).on('mousemove', function ( ev ) {
        if (!_mo) {
            return;
        }
        _mo.$el.css({
            left: ev.pageX - _mo.offsetX
            ,top: ev.pageY - _mo.offsetY
        });
    });

    $('html').on('click', function ( ev ) {
        if (/html/i.test( ev.target.tagName )) {
            console.log('hello');
        }
    });

    new ProjectView({model: new Project()});
    //$('.project:eq(0)').clone().addClass('focused').appendTo('body');
    $('.project:eq(1)').css({ left: '700px' })
    .on('focus', '.jProjectName', function ( ev ) {
        var $el = $( this );
        console.log( $el );
    })
    .on('keydown', '.jProjectName', function ( ev ) {
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
