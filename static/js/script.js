jQuery( function ( $ ) {
    var _mo; //moving object, a view object

    window.Task = Backbone.Model.extend({
        defaults: {
            title: '<br>'
            ,position: 0
            ,parent: null
            ,children: null
        }
    });

    window.TaskList = Backbone.Collection.extend({
        model: Task
        ,comparator: function ( task ) {
            return task.get('position');
        }
    });

    window.TaskView = Backbone.View.extend({
        tagName: 'li'
        ,template: doT.template(' <u></u> <i></i> <s></s> <div class="text"> <span class="jTaskTitle" contenteditable>{{=it.title}}</span> </div> ')
        ,initialize: function ( options ) {
            var $elv = $( this.el );
            console.log( this.model );
            $elv.html( this.template( this.model.toJSON())).appendTo( $('>ul', this.model.get('parent').el ));
            console.log( this.$('.jTaskTitle'));
            this.$('.jTaskTitle').trigger('focus');
            this.model.view = this;
        }
    });

    window.ProjectView = Backbone.View.extend({
        tagName: 'section'
        ,className: 'project focused'
        ,template: doT.template(' <div class="move-handler jMoveHandler"></div> <h1 class="jProjectTitle" contenteditable>{{=it.title}}</h1> <ul></ul> ')
        ,initialize: function ( options, left, top ) {
            var $elv = $( this.el );
            if (left) {
                $elv.css('left', left+'px');
            }
            if (top) {
                $elv.css('top', top+'px');
            }
            $elv.html( this.template( this.model.toJSON())).appendTo('body');
            this.$('.jProjectTitle').trigger('focus');
            this.model.bind('change:title', function( a, b ) {
                console.log( a.changedAttributes() );
                console.log( this );
            }, this);
            this.model.view = this;
        }
        ,events: {
            'keydown .jProjectTitle': 'titleKeydown'
            ,'blur .jProjectTitle': 'titleBlur'
            ,'mousedown .jMoveHandler': 'handlerMouseDown'
            ,'mouseup .jMoveHandler': 'handlerMouseUp'
            ,'click ul': 'newTask'
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
            if (!this.$('.jProjectTitle').text().length) {
                this.remove();
                return false;
            }
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
        ,newTask: function ( ev ) {
            var $elv = $( this.el );
            if ($( ev.target ).parent().is( $elv )) {
                new TaskView({ model: new Task({ parent: this }) });
            }
        }
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

    $(document).on('click', function ( ev ) {
        if (/html/i.test( ev.target.tagName )) {
            new ProjectView({ model: new Task() }, ev.pageX-6, ev.pageY-8 );
        }
    });

    //$('.project:eq(0)').clone().addClass('focused').appendTo('body');
    $('.project:eq(1)').css({ left: '700px' })
    .on('focus', '.jProjectTitle', function ( ev ) {
        var $el = $( this );
        console.log( $el );
    })
    .on('keydown', '.jProjectTitle', function ( ev ) {
    })
    .on('blur', '.jProjectTitle', function ( ev ) {
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
