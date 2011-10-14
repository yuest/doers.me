var connect = require('connect')
    ,connectStatic = connect['static']
    ,connectLess = require('connect-less')
    ,switchman = require('switchman')
    ,quip = require('quip')
    ,OAuth2 = require('./lib/oauth2').OAuth2
    ,fs = require('fs')
    ,dot = require('dot')
    ,util = require('util')
    ,https = require('https')
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
        if (req.session.user) {
            console.log( req.session.user );
            res.renderHtml('./views/dashboard.html');
        } else {
            /*
            res.renderHtml('./views/login.html');
            */
            req.session.user = { access_token: 'ya29.AHES6ZTUmQjFHt8ODMcoFMW9TriDhyM3ipjgOIHDTMs9Now' };
            res.redirect('/');
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
            req.session.user = result;
            res.redirect('/');
        });
    }
});

function gtapi( reqStr, options, callback ) {
    console.log( reqStr );
    var split = reqStr.split(' ')
        ,headers = {
            'Authorization': 'Bearer '+options.access_token
        }
        ,reqOptions = {
            host: 'www.googleapis.com'
            ,port: 443
            ,method: split[0]
            ,path: split[1]
            ,headers: headers
        }
        ;
    if ( options.data ) {
        options.body = new Buffer( options.data );
        headers['content-type'] = 'application/json';
        headers['content-length'] = options.body.length;
    }
    req = https.request( reqOptions, function ( res ) {
        res.setEncoding('utf8');
        var result = '';
        res.on('data', function( data ) {
            /*
            console.log( data );
            result = result + data;
        });
        res.on('end', function () {
        */
            var err = null;
            try {
                result = JSON.parse( data );
            } catch( e ) {
                err = e;
                console.log( err );
            }
            console.log( result );

            if( callback ) callback( err, result );
        });
    });
    if (options.body) {
        req.write( options.body );
    }
    req.end();
}

urlRules.add({
    '/api': {
        'GET /lists': function ( req, res, next ) {
            gtapi('GET /tasks/v1/users/@me/lists?maxResults=100', { access_token: req.session.user.access_token }, function ( err, result ) {
                res.json().ok( JSON.stringify( result ));
            });
        }
        ,'GET /lists/:listId': function ( req, res, next, listId ) {
            gtapi('DELETE /tasks/v1/users/@me/lists/'+listId, { access_token: req.session.user.access_token }, function ( err, result ) {
                res.writeHead(204, 'No Content');
                res.end();
            });
        }
    }
});

urlRules.add( require('./site/accout') );
