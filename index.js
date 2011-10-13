var connect = require('connect')
    ,connectStatic = connect['static']
    ,connectLess = require('connect-less')
    ,switchman = require('switchman')
    ,quip = require('quip')
    ,everyauth = require('everyauth')
    ,fs = require('fs')
    ,dot = require('dot')
    ,util = require('util')
    ,urlRules = switchman()
    ,U = require('./lib/utils')
    ,S = require('./settings')
    ,Model = require('./lib/model')
    ;

var M = Model( S.db );

var T = (function () {
    var cache = {};
    return function ( path ) {
        var pTemplate = cache[ path ]
            ,dTemplate
            ;
        if (S.debug || !pTemplate) {
            dTemplate = U.deferred();
            pTemplate = cache[ path ] = dTemplate.promise;
            U.a2p( fs.readFile, fs, path, 'utf-8').then( function ( rawTemplate ){
                dTemplate.resolve( dot.template( rawTemplate ));
            }, function ( err ) {
                dTemplate.reject('error while loading '+ path + ': ' + err );
            });
        }
        return function ( context ) {
            var d = U.deferred();
            pTemplate.then( function ( tplt ) {
                try {
                    d.resolve( tplt( context || {}));
                } catch ( err ) {
                    d.reject('error while rending '+ path + ': ' + err );
                }
            }, function ( err ) {
                d.reject('error while rending '+ path + ': ' + err );
            });
            return d.promise;
        }
    };
}());

everyauth.everymodule.logoutPath('/signout');
everyauth.everymodule.moduleTimeout(30000);

everyauth.google
    .entryPath('/auth/google')
    .callbackPath('/auth/google/callback')
    .appId('402025418712.apps.googleusercontent.com')
    .appSecret('nEvNLEuLqTGo3h')
    .scope('https://www.googleapis.com/auth/tasks') // What you want access to
    //.handleAuthCallbackError( function (req, res) {
        // If a user denies your app, Google will redirect the user to
        // /auth/facebook/callback?error=access_denied
        // This configurable route handler defines how you want to respond to
        // that.
        // If you do not configure this, everyauth renders a default fallback
        // view notifying the user that their authentication failed and why.
    //})
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
        console.log( session );
        console.log( accessToken );
        console.log( accessTokenExtra );
        console.log( googleUserMetadata );
        // find or create user logic goes here
        // Return a user or Promise that promises a user
        // Promises are created via
        //     var promise = this.Promise();
    })
    .redirectPath('/');

connect(
    quip()
    ,function ( req, res, next ) {
        res.renderHtml = function ( path, context ) {
            T( path )( context ).then( function ( html ) {
                res.html().ok( html );
            }, function ( err ) {
                res.html().error( err )
            });
        };
        next();
    }
    ,connect.bodyParser()
    ,connect.cookieParser()
    ,connect.session({ secret: S.secret })
    ,everyauth.middleware()
    ,connectLess({ src: __dirname + '/static'})
    ,connectStatic( __dirname + '/static' )
    ,urlRules
).listen(10086);
console.log('Server started.');

urlRules.add({
    '/': function ( req, res, next ) {
        res.renderHtml('./views/dashboard.html');
    }
    ,'/post/new': switchman.addSlash
    ,'/api/lists': {
        'GET': function ( req, res, next ) {
            M('list').find().toArray( function ( err, topics ) {
                res.json().ok( JSON.stringify({ items: topics }));
            });
        }
        ,'POST': function ( req, res, next ) {
            var reqBody = U.extend( {}, req.body );
            M('list').p( 'insertOne', reqBody ).then( function ( docs ) {
                res.json().ok( JSON.stringify( docs ));
            });
        }
    }
    ,'/api/lists/:listId': {
        'PUT': function ( req, res, next, listId ) {
            var reqBody = U.extend( {}, req.body );
            M('list').p( 'upsert', { id: listId }, reqBody ).then( function ( docs ) {
                res.json().ok( JSON.stringify( docs ));
            });
        }
        ,'DELETE': function ( req, res, next, listId ) {
            M('list').p( 'remove', { _id: listId }).then( function ( docs ) {
                res.json().ok();
            });
        }
    }
});

urlRules.add( require('./site/accout') );
