define(["./lib/index"],function(a,b,c){var d,e,f=a("./lib/index"),g=d=f.jQuery,h=e=f.underscore,i=f.Backbone,j=f.doT;d(function(a){var b,c=function(){var b=1e4;return function(c){a("body>section").removeClass("focused"),a(c.el).addClass("focused").css({"z-index":++b})}}();window.Task=i.Model.extend({defaults:{title:"<br>",position:0},initialize:function(a,b){var c=this.viewType=b&&b.viewType||"task";c=="task"?this.view=new TaskView({model:this}):c=="project"&&(this.view=new ProjectView({model:this},b.left,b.top),this.set({left:b.left,top:b.top},{silent:!0}))}}),window.TaskView=i.View.extend({tagName:"li",template:j.template(' <u></u> <i></i> <s></s> <div class="text"> <span class="jTaskTitle" contenteditable>{{=it.title}}</span> </div> '),initialize:function(b){this.model.view=this;var c=a(this.el);c.data({view:this,model:this.model}),c.html(this.template(this.model.toJSON()))},events:{"keydown .jTaskTitle":"titleKeydown","blur .jTaskTitle":"titleBlur","click s":"select","mouseenter i":"mouseenter","mouseleave i":"mouseleave"},titleKeydown:function(b){var c=a(this.el),d=a(b.currentTarget),e;console.log(b);if(b.keyCode==27)d.trigger("blur");else{if(b.keyCode==13)return d.trigger("blur"),d.closest("ul").data("collection").add(new Task),!1;if(b.keyCode==9){var f=c.prev().data("model")||c.prev().data("collection"),e;return f?f instanceof TaskList?(f.add(this.model),b.preventDefault(),!1):(f.children=new TaskList(null,null,f),f.children.add(this.model),b.preventDefault(),!1):!1}}},titleBlur:function(b){if(!this.$(".jTaskTitle").text().length&&this.model.collection.length>1)return this.remove(),!1;this.model.set({title:a(b.currentTarget).text()})},select:function(b){var c=a(b.currentTarget);c.toggleClass("selected"),this.model.children&&(c.hasClass("selected")?c.closest("li").next("ul").find("s").addClass("selected"):c.closest("li").next("ul").find("s").removeClass("selected"))},mouseenter:function(b){var c=this.model,d;while(c.collection&&c.collection.parent)c=c.collection.parent;d=c.view.$(".selected").map(function(b,c){return a(c).prev()[0]}).add(b.currentTarget);if(d.length>1&&!a(b.currentTarget).next().hasClass("selected"))return!1;d.addClass("hover")},mouseleave:function(b){a("i").removeClass("hover")}}),window.ProjectView=i.View.extend({tagName:"section",className:"project focused",template:j.template(' <div class="move-handler jMoveHandler"></div> <h1 class="jProjectTitle" contenteditable>{{=it.title}}</h1> '),initialize:function(b,d,e){this.model.view=this;var f=a(this.el);d&&f.css("left",d+"px"),e&&f.css("top",e+"px"),f.data({model:this.model,view:this}),f.html(this.template(this.model.toJSON())).appendTo("body"),this.$(".jProjectTitle").trigger("focus"),c(this),this.model.children||(this.model.children=new TaskList(null,null,this.model),this.model.children.add(new Task))},events:{"keydown .jProjectTitle":"titleKeydown","blur .jProjectTitle":"titleBlur","mousedown .jMoveHandler":"handlerMouseDown","mouseup .jMoveHandler":"handlerMouseUp","click ul":"newTask",mousedown:"focusOnThis"},focusOnThis:function(){c(this)},titleKeydown:function(b){var c=a(this.el),d=a(b.currentTarget);h.indexOf([13,27],b.keyCode)!=-1&&d.trigger("blur")},titleBlur:function(b){var c=this;setTimeout(function(){if(a(c.el).hasClass("focused"))return;if(!c.$(".jProjectTitle").text().length)return c.remove(),!1;c.model.set({title:a(b.currentTarget).text()})},1)},handlerMouseDown:function(c){var d=a(this.el).offset();b={$el:a(this.el),offsetX:c.pageX-d.left,offsetY:c.pageY-d.top}},handlerMouseUp:function(a){b=void 0},moving:!1,newTask:function(b){var c=a(this.el);a(b.target).parent().is(c)&&new TaskView({model:new Task({parent:this})})}}),window.TaskList=i.Collection.extend({model:Task,comparator:function(a){return a.get("position")},initialize:function(b,c,d){d&&d instanceof Task&&(this.parent=d),this.view=new TaskListView({collection:this},d),this.bind("add",function(b){this.parent&&this.parent.view&&(b.viewType!="task"&&(b.view=new TaskView({model:b})),a(b.view.el).appendTo(this.view.el),this.length>1&&b.view.$(".jTaskTitle").trigger("focus"))})}}),window.TaskListView=i.View.extend({tagName:"ul",initialize:function(b,c){var d=a(this.el);this.collection.view=this,d.data({view:this,collection:this.collection}),this.collection.parent&&(this.collection.parent.viewType=="project"?d.appendTo(c.view.el):this.collection.parent.viewType=="task"&&d.insertAfter(c.view.el))}}),a(document).on("mousemove",function(a){if(!b)return;b.$el.css({left:a.pageX-b.offsetX,top:a.pageY-b.offsetY})}),a(document).on("click",function(a){/html/i.test(a.target.tagName)&&new Task(null,{left:a.pageX-6,top:a.pageY-16,viewType:"project"})})})});