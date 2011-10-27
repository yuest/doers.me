define( function( require, exports, module ) {
var jQuery
    ,underscore
    ,lib = require('./lib/index')
    ,$ = jQuery = lib.jQuery
    ,_ = underscore = lib.underscore
    ,Backbone = lib.Backbone
    ,doT = lib.doT
    ;
jQuery( function ( $ ) {
    var _mo; //moving object, a view object
    var focusProjectView = (function () {
        var topz = 10000;
        return function ( prejectView ) {
            $('body>section').removeClass('focused');
            $( prejectView.el ).addClass('focused').css({ 'z-index': ++topz });
        };
    }())

    window.Task = Backbone.Model.extend({
        defaults: {
            title: '<br>'
            ,position: 0
        }
        ,initialize: function ( attributes, options ) {
            var viewType = this.viewType = options && options.viewType || 'task';
            if (viewType == 'task') {
                this.view = new TaskView({ model: this });
            } else if (viewType == 'project') {
                this.view = new ProjectView({ model: this }, options.left, options.top);
                this.set({
                    left: options.left
                    ,top: options.top
                }, { silent: true });
            }
        }
    });

    window.TaskView = Backbone.View.extend({
        tagName: 'li'
        ,template: doT.template(' <u></u> <i></i> <s></s> <div class="text"> <span class="jTaskTitle" contenteditable>{{=it.title}}</span> </div> ')
        ,initialize: function ( options ) {
            this.model.view = this;
            var $elv = $( this.el );
            $elv.data({ view: this, model: this.model });
            $elv.html( this.template( this.model.toJSON()));
        }
        ,events: {
            'keydown .jTaskTitle': 'titleKeydown'
            ,'blur .jTaskTitle': 'titleBlur'
            ,'click s': 'select'
            ,'mouseenter i': 'mouseenter'
            ,'mouseleave i': 'mouseleave'
        }
        ,titleKeydown: function ( ev ) {
            var $elv = $( this.el )
                ,$el = $( ev.currentTarget )
                ,children
                ;
            console.log( ev );
            if (ev.keyCode == 27) {
                $el.trigger('blur');
            } else if (ev.keyCode == 13) {
                $el.trigger('blur');
                $el.closest('ul').data('collection').add( new Task );
                return false;
            } else if (ev.keyCode == 9) {
                var modelOrCollection = $elv.prev().data('model') || $elv.prev().data('collection'), children;
                if (!modelOrCollection) {
                    return false;
                }
                if ( modelOrCollection instanceof TaskList ) {
                    modelOrCollection.add( this.model );
                    ev.preventDefault();
                    return false;
                } else {
                    modelOrCollection.children = new TaskList( null, null, modelOrCollection );
                    modelOrCollection.children.add( this.model );
                    ev.preventDefault();
                    return false;
                }
            }
        }
        ,titleBlur: function ( ev ) {
            if (!this.$('.jTaskTitle').text().length && this.model.collection.length > 1) {
                this.remove();
                return false;
            }
            this.model.set({'title': $( ev.currentTarget ).text()});
        }
        ,select: function ( ev ) {
            var $el = $( ev.currentTarget );
            $el.toggleClass('selected');
            if (this.model.children) {
                if ($el.hasClass('selected')) {
                    $el.closest('li').next('ul').find('s').addClass('selected');
                } else {
                    $el.closest('li').next('ul').find('s').removeClass('selected');
                }
            }
        }
        ,mouseenter : function ( ev ) {
            var topTask = this.model
                ,$selected
                ;
            while ( topTask.collection && topTask.collection.parent ) {
                topTask = topTask.collection.parent;
            }
            $selected = topTask.view.$('.selected') .map( function ( i, el ) {
                    return $( el ).prev()[0];
                })
                .add( ev.currentTarget )

            if ( $selected.length > 1 && !$( ev.currentTarget ).next().hasClass('selected') ) {
                return false;
            }
            $selected.addClass('hover');
        }
        ,mouseleave : function ( ev ) {
            $('i').removeClass('hover');
        }
    });

    window.ProjectView = Backbone.View.extend({
        tagName: 'section'
        ,className: 'project focused'
        ,template: doT.template(' <div class="move-handler jMoveHandler"></div> <h1 class="jProjectTitle" contenteditable>{{=it.title}}</h1> ')
        ,initialize: function ( options, left, top ) {
            this.model.view = this;
            var $elv = $( this.el );
            if (left) {
                $elv.css('left', left+'px');
            }
            if (top) {
                $elv.css('top', top+'px');
            }
            $elv.data({
                model: this.model
                ,view: this
            });
            $elv.html( this.template( this.model.toJSON())).appendTo('body');
            this.$('.jProjectTitle').trigger('focus');
            focusProjectView( this );
            /*
            var self = this;
            $( document ).click('click.'+self.model.cid, function ( ev ) {
                console.log('click.'+self.model.cid);
                console.log( $( ev.target ).parents().index( $elv ));
                if ( $( ev.target ).parents().index( $elv ) == -1 ) {// > -1 说明点击的是该组件
                    $( document ).unbind('click.'+self.model.cid);
                    console.log('ickii');
                    self.events['blur .jProjectTitle'] = 'titleBlur';
                    self.delegateEvents();// 新建的 Project，要在点击 Project View 外一次才开始监听 blur .jProjectTitle
                    console.log( self.titleBlur );
                    self.$('.jProjectTitle').trigger('blur');
                }
            });
            */

            if (!this.model.children) {
                this.model.children = new TaskList( null, null, this.model );
                this.model.children.add( new Task );
            }
        }
        ,events: {
            'keydown .jProjectTitle': 'titleKeydown'
            ,'blur .jProjectTitle': 'titleBlur'
            ,'mousedown .jMoveHandler': 'handlerMouseDown'
            ,'mouseup .jMoveHandler': 'handlerMouseUp'
            ,'click ul': 'newTask'
            ,'mousedown': 'focusOnThis'
        }
        ,focusOnThis: function () {
            focusProjectView( this );
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
            var self = this;
            setTimeout( function () {
                if ($( self.el ).hasClass('focused')) return;
                if (!self.$('.jProjectTitle').text().length) {
                    self.remove();
                    return false;
                }
                self.model.set({'title': $( ev.currentTarget ).text()});
            }, 1);
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

    window.TaskList = Backbone.Collection.extend({
        model: Task
        ,comparator: function ( task ) {
            return task.get('position');
        }
        ,initialize: function ( models, options, parent ) {
            if (parent && parent instanceof Task) {
                this.parent = parent;
            }
            this.view = new TaskListView({ collection: this }, parent );
            this.bind('add', function ( model ) {
                if (this.parent && this.parent.view) {
                    if (model.viewType != 'task') {
                        model.view = new TaskView({ model: model });
                    }
                    $( model.view.el ).appendTo( this.view.el );
                    if (this.length > 1) {
                        model.view.$('.jTaskTitle').trigger('focus');
                    }
                }
            });
        }
    });

    window.TaskListView = Backbone.View.extend({
        tagName: 'ul'
        ,initialize: function ( options, parent ) {
            var $elv = $( this.el );
            this.collection.view = this;
            $elv.data({ view: this, collection: this.collection });
            if (this.collection.parent) {
                if (this.collection.parent.viewType == 'project') {
                    $elv.appendTo( parent.view.el );
                } else if (this.collection.parent.viewType == 'task') {
                    $elv.insertAfter( parent.view.el );
                }
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
            new Task( null, { left: ev.pageX-6, top: ev.pageY-16, viewType: 'project'});
        }
    });
});
});
