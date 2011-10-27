allfiles = lib/jquery.js lib/underscore.js lib/backbone.js lib/doT.js
buildall: $(allfiles)
	#done build

lib/jquery.js: lib/jquery.orig.js
	 cat wrap/define_start lib/jquery.orig.js wrap/define_end_for_jquery > lib/jquery.js
lib/underscore.js: ../../node_modules/underscore/underscore.js
	 cat wrap/define_start ../../node_modules/underscore/underscore.js wrap/define_end > lib/underscore.js
lib/backbone.js: ../../node_modules/backbone/backbone.js
	 cat wrap/define_start ../../node_modules/backbone/backbone.js wrap/define_end > lib/backbone.js
lib/doT.js: ../../node_modules/dot/doT.js
	 cat wrap/define_start ../../node_modules/dot/doT.js wrap/define_end > lib/doT.js

clean:
	rm $(allfiles)
