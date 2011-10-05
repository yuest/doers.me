var connect = require('connect')
    ,connectStatic = connect['static']
    ,switchman = require('switchman')
    ,quip = require('quip')
    ,dot = require('dot')
    ,FS = require('q-fs')
    ,mongodb = require('mongodb')
    ,Db = mongodb.Db
    ,U = require('./utils')
    ,mongo = require('mongoskin')
    ,util = require('util')
    ,urlRules = switchman()
    ;

var db = mongo.db('localhost:27017/suckless-info?auto_reconnect');
var Model = function( db ) {
    db = (typeof db == 'string') ? mongo.db( db ) : db;
    var collection = function ( _coll ) {
        var coll = db.collection( _coll );
        coll.p = function ( action ) { // 以 promise 的方式调用 collection 方法
            if (arguments.length < 1) {
                throw new Error('at least one argument');
            }
            var args = U.slice.call( arguments )
                ,offset
                ,doc
                ,fmArgs = [
                    coll.findAndModify
                    ,coll
                    ,{ _id: 'counter' }
                    ,[['_id', 'asc']]
                    ,{ $inc: { next: 1 }}
                    ,{
                        'new': true
                        ,upsert: true
                    }
                ]
                ;
            if (action == 'insertOne') {
                doc = args[1];
                offset = args[2] || 0;
                return U.a2p.apply( null, fmArgs ).then( function ( counter ) {
                    doc.id = counter.next + offset;
                    return U.a2p( coll.insert, coll, doc );
                });
            }
            if (action == 'counter') {
                args = fmArgs;
            } else {
                args.splice( 0, 1, coll[ action ], coll);
            }
            return U.a2p.apply( null, args );
        };
    };
    collection.db = db;
    return collection;
}

var M = Model('localhost:27017/suckless-info?auto_reconnect');
M('user')('count')( function ( count ) { console.log( count ); });


var S = {}; // global settings
S.debug = true;
S.secret = 'suckless.info';

var T = (function () {
    var cache = {};
    return function ( path ) {
        var pTemplate = cache[ path ]
            ,dTemplate
            ;
        if (S.debug || !pTemplate) {
            dTemplate = U.deferred();
            pTemplate = cache[ path ] = dTemplate.promise;
            FS.read( path, { charset: 'utf-8' }).then( function ( rawTemplate ){
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
    ,connect.bodyParser()
    ,connect.cookieParser()
    ,connect.session({ secret: S.secret })
    ,urlRules
).listen(10086);

urlRules.add({
    '/': function ( req, res, next ) {
        var u = req.session && req.session.user && JSON.stringify( req.session.user) || '欢迎光临，请<a href="/signin/">登入或注册</a>';
        res.renderHtml('./views/index.html', { username: u });
    }
});

function redirectToSignin( req, res, next ) {
    res.redirect('/account/');
}
urlRules.add({
    '/account': switchman.addSlash
    ,'/account/': {
        'GET': function ( req, res, next ) {
            res.renderHtml('./views/signin.html');
        }
        ,'POST': function ( req, res, next ) {
            var reqBody = U.extend({}, req.body);
            if ( reqBody.action == '注册' ) {
                delete reqBody.password_confirm;
                delete reqBody.action;
                reqBody.password = U.crypt( S.secret + reqBody.username + reqBody.password );
                M('user').p('insertOne', reqBody, -1 ).then( function ( doc ) {
                    console.log( doc );
                });
                res.redirect('/account/registered/');
            } else {
                if ( reqBody.action == '登入' ) {
                }
                M('user').p('findOne', {
                    username: reqBody.username
                    ,password: U.crypt( S.secret + reqBody.username + reqBody.password )
                }, { fields: { username:1, nickname:1, email:1, _id:0 }}).then( function ( doc ) {
                    console.log( doc );
                    req.session.user = doc;
                    res.redirect('/account/registered/');
                });
            }
        }
        ,'GET registered/': function ( req, res, next ) {
            res.html().ok( JSON.stringify( req.session.user || false ));
            //res.ok().html(req.session.c + '注册成功');
        }
    }
    ,'GET /signin': redirectToSignin
    ,'GET /signin/': redirectToSignin
    ,'GET /signup': redirectToSignin
    ,'GET /signup/': redirectToSignin
    ,'GET /register': redirectToSignin
    ,'GET /register/': redirectToSignin
    ,'GET /reg': redirectToSignin
    ,'GET /reg/': redirectToSignin
    ,'GET /login': redirectToSignin
    ,'GET /login/': redirectToSignin
});
