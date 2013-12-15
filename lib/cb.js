var uid    = require('node-uuid'),
    laeh2  = require('laeh2'),
    domain = require('domain');

module.exports = function(callback) {
    var count = 0,
        once         = false,
        timedout     = false,
        interval     = false,
        secured      = false,
        timeoutError = TimeoutError,
        emitters     = [],
        errback,
        tid,
        cb;

    cb = function() {
        var ret,
            args = Array.prototype.slice.call(arguments),
            d,
            fn = callback;

        if ( timedout || (once && count) ) {
            return ret;
        }
        
        if (secure) {
//            d = domain.create();  
//            
//            if (errback) {                                
//                fn = d.intercept(callback);                                                        
//            } else {
//                fn = d.bind(callback);
//            }         
//            
//            d.on('error', function(err) {
//                errback ? errback(err) : callback(err);
//            });

              if (errback) {
                  fn = laeh2._x(errback, true, fn);
              } else {
                  fn = laeh2._x(console.log, false, fn);
              }
        }
        
        count += 1;

        tid && clearTimeout(tid);

        ret = args[0] && errback ? errback(args[0]) : fn.apply(this, args);

        if ( interval ) {
            cb.timeout(interval);
        }

        return ret;
    };

    cb.uid = uid.v4();

    cb.emitter = function(eventEmitter) {
        if ( eventEmitter instanceof require('events').EventEmitter ) {
            emitters.push(eventEmitter);
        }

        return cb;
    };

    cb.free = function() {
        if ( emitters.length ) {
            emitters.forEach(function(ee) {
                var events = Object.keys(ee._events);

                events.forEach(function(e) {
                    var listeners = ee.listeners(e);

                    for ( var i = 0; i < listeners.length; i++ ) {
                        if ( listeners[i].uid && listeners[i].uid == cb.uid ) {
                            delete listeners[i];
                            break;
                        }
                    }

                    ee._events[e] = listeners.filter(function(l) {
                        return l;
                    });
                })
            })
        }

        emitters = [];

        return cb;
    };

    cb.timeout = function(ms, handler) {
        tid && clearTimeout(tid);

        if ( ms ) {
            tid = setTimeout(function() {
                cb.free();
                cb(new timeoutError(ms));
                timedout = true;
            }, ms);
        }

        if ( handler && typeof handler === 'function' ) {
            timeoutError = handler;
        }

        return cb;
    };

    cb.interval = function(iv) {
        interval = iv;

        if ( iv ) {
            cb.timeout(iv);
        }

        return cb;
    };

    cb.error = function(func) {
        errback = func;
        return cb;
    };
    
    cb.secure = function(sec) {       
        secure = typeof sec !== 'boolean' ? true : sec;
        
        return cb;
    };

    cb.once = function() {
        once = true;
        return cb;
    };

    cb.bind = function() {
        callback = callback.bind.apply(callback, arguments);

        return cb;
    };

    cb.context = function() {
        return callback;
    };

    cb.async = function() {
        var orig = callback,
                args = arguments;

        callback = function() {
            process.nextTick(function() {
                orig.apply(null, args);
            });
        }

        return cb;
    };

    return cb;
};

var TimeoutError = module.exports.TimeoutError = function TimeoutError(ms) {
	this.message = 'Specified timeout of ' + ms + 'ms was reached';
	Error.captureStackTrace(this, this.constructor);
};

TimeoutError.prototype = new Error;
TimeoutError.prototype.constructor = TimeoutError;
TimeoutError.prototype.name = 'TimeoutError';