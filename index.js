var connect = require('connect')
    ,connectStatic = connect['static']
    ,connectLess = require('connect-less')
    ,switchman = require('switchman')
    ,quip = require('quip')
    ,OAuth2 = require('./lib/oauth2').OAuth2
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
    ,connect.query()
    ,connect.bodyParser()
    ,connect.cookieParser()
    ,connect.session({ secret: S.secret })
    ,connectLess({ src: __dirname + '/static'})
    ,connectStatic( __dirname + '/static' )
    ,urlRules
).listen( S.serverPort );
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

urlRules.add({
    '/auth/google': function ( req, res, next ) {
        res.redirect(
            'https://accounts.google.com/o/oauth2/auth'
                + '?client_id=' + S.google.clientId
                + '&redirect_uri=' + S.google.redirectUrl
                + '&scope=https://www.googleapis.com/auth/tasks'
                + '&response_type=code'
        );
    }
    ,'/auth/google/callback': function ( req, res, next ) {
        console.log( req.query.code );
        var oauth2 = new OAuth2({
            base: "accounts.google.com",
            tokenUrl: "/o/oauth2/token",
            redirectUri: S.google.redirectUrl,
            id: S.google.clientId,
            secret: S.google.clientSecret
        });
        console.log( oauth2 );
        oauth2.accessToken(req.query.code, { redirect_url: S.google.redirectUrl }, function( statusCode, result ) {
            res.text().ok( JSON.stringify({
                status: statusCode,
                result: result
            }));
        });
    }
});

urlRules.add( require('./site/accout') );
