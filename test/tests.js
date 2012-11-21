var assert = require('assert'),
	cb = require('../');

function invokeAsync(callback) {
	setTimeout(function() {
		callback(null, 'foo');
	}, 100);
}

function invokeAsyncError(callback) {
	setTimeout(function() {
		callback(new Error());
	}, 100);
}

function invokeAsyncTwice(callback) {
	setTimeout(function() {
		callback(null, 'foo');
		callback(null, 'foo');
	}, 100);
}

describe('cb(callback)', function() {

	it('should invoke the provided callback', function(done) {
		invokeAsync(cb(function(err, res) {
			assert.strictEqual(res, 'foo');
			done();
		}));
	});

	it('shouldn\'t mess with errors', function(done) {
		invokeAsyncError(cb(function(err, res) {
			assert(err);
			done();
		}));
	});

	it('should allow multiple executions', function(done) {
		var count = 0;
		invokeAsyncTwice(cb(function(err, res) {
			count++;
			if (count === 2) done();
		}));
	});

});

describe('cb(callback).timeout(ms)', function() {
	
	it('should complete successfully within timeout period', function(done) {
		invokeAsync(cb(function(err, res) {
			assert.strictEqual(res, 'foo');
			done();
		}).timeout(200));
	});

	it('should complete with an error after timeout period', function(done) {
		invokeAsync(cb(function(err, res) {
			assert(err);
			done();
		}).timeout(50));
	});

	it('error resulting from a timeout should be instanceof cb.TimeoutError by default', function(done) {
		invokeAsync(cb(function(err, res) {
			assert(err instanceof cb.TimeoutError);
			done();
		}).timeout(50));
	});
        
        it('error resulting from a timeout should be customizable', function(done) {
                var CustomError = function CustomError(ms) {
                    this.message = 'Specified timeout of ' + ms + 'ms was reached';
                    Error.captureStackTrace(this, this.constructor);
                };
                
                CustomError.prototype = new Error;
                CustomError.prototype.constructor = CustomError;
                CustomError.prototype.name = 'CustomError';
                
		invokeAsync(cb(function(err, res) {        
			assert(err instanceof CustomError);
			done();
		}).timeout(50, CustomError));
	});

});

describe('cb(callback).error(errback)', function() {

	it('should skip the err argument when invoking callback', function(done) {
		invokeAsync(cb(function(res) {
			assert.strictEqual(res, 'foo');
			done();
		}).error(assert.ifError));
	});

	it('should pass errors to provided errback', function(done) {
		invokeAsyncError(cb(function(res) {
			throw new Error('should not be invoked');
		}).error(function(err) {
			assert(err);
			done();
		}));
	});

});

describe('cb(callback).error(errback).timeout(ms)', function() {

	it('should skip the err argument when invoking callback', function(done) {
		invokeAsync(cb(function(res) {
			assert.strictEqual(res, 'foo');
			done();
		}).error(assert.ifError).timeout(200));
	});

	it('should pass timeout error to provided errback', function(done) {
		invokeAsyncError(cb(function(res) {
			throw new Error('should not be invoked');
		}).error(function(err) {
			assert(err);
			done();
		}).timeout(50));
	});

});

describe('cb(callback).once()', function() {

	it('should allow multiple executions', function(done) {
		var count = 0;
		invokeAsyncTwice(cb(function(err, res) {
			count++;
			assert.notEqual(count, 2);
			setTimeout(done, 100);
		}).once());
	});

});

describe('cb(callback).uid', function() {

	it('should have a unique id', function() {
            var _cb = cb(function() {});

            assert.strictEqual(typeof _cb.uid, 'string');
	});
        
});

describe('cb(callback).bind()', function() {

	it('should allow binding a context', function(done) {		
		invokeAsync(cb(function(err, res) {
			assert.strictEqual([1,2,3].toString(), this.toString())                        
			done();
		}).bind([1, 2, 3]));
	});
        
        it('should allow for currying arguments', function(done) {
		invokeAsync(cb(function(a, b, c, err, res) {
			assert.strictEqual(a, 1);
                        assert.strictEqual(b, 2);
                        assert.strictEqual(c, 3);
			done();
		}).bind(null, 1, 2, 3));            
        })
});

describe('cb(callback).interval()', function() {
    it('should allow for a timeout to be extended and called', function(done) {
		var count = 0,                   
                    start,
                    iid,
                    _cb   = cb(function(err, res) {
                        if (! count) {
                            start = new Date().getTime();
                        }
                        
                        if (count > 5) {
                            clearInterval(iid); 
                        }
                        
                        if (err) {
                            assert((new Date().getTime() - start) > 1000);
                            done();
                        }
                        
                        ++count;
		    }).interval(500);
                    
                this.timeout(5000);   
                
                this.slow(5000);
                    
                iid = setInterval(_cb, 200);                  		
    });
    
    it('should allow for interval to be cancelled', function(done) {
		var count = 0,                   
                    iid,
                    _cb   = cb(function(err, res) {                       
                        if (count == 6) {
                            clearInterval(iid);
                            _cb.interval(false);
                        }
                        
                        if (err) {                            
                            throw new Error('Should not timeout if interval is cancelled');
                        }
                        
                        ++count;
		    }).interval(500);
                    
                this.timeout(10000);   
                
                this.slow(10000);
                    
                iid = setInterval(_cb, 200); 
                
                setTimeout(function() {   
                    assert(count == 7);
                    done();                    
                }, 4000);
    });
})

describe('cb(callback).context()', function() {

	it('should return the callback passed', function() {
		var foo     = function foo() {},
                    context = cb(foo).context();
                    
                assert.strictEqual(context.name, 'foo');
                assert.strictEqual(context, foo);
	});
        
        it('should return the callback passed, even after timing out', function(done) {
                var bar    = function bar(err, res) {                        
			    assert(err);
                            assert.strictEqual()
			    finish();
		    },
                    _cb = cb(bar).timeout(50),
                    finish = function() {
                        var context = _cb.context();
                        
                        assert.strictEqual(context.name, 'bar');
                        assert.strictEqual(context, bar);
                        
                        done();
                    }                       
                        
                    
		invokeAsync(_cb);
	});

});
