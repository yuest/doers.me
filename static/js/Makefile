buildall: jquery.js underscore.js backbone.js doT.js
	#done build

jquery.js: lib/jquery.js
	 cat wrap/define_start lib/jquery.js wrap/define_end_for_jquery > jquery.js
underscore.js: ../../node_modules/underscore/underscore.js
	 cat wrap/define_start ../../node_modules/underscore/underscore.js wrap/define_end > underscore.js
backbone.js: ../../node_modules/backbone/backbone.js
	 cat wrap/define_start ../../node_modules/backbone/backbone.js wrap/define_end > backbone.js
doT.js: ../../node_modules/dot/doT.js
	 cat wrap/define_start ../../node_modules/dot/doT.js wrap/define_end > doT.js
