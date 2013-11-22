// Test suite for scry.js module
// To run the tests, simply navigate to test.html in your browser
var methods = [
    {
        name: 'setA',
        args: [3],
        expectation: function(object, ret) {
            return (object.a == 3 && ret == 3);
        }
    }, 
    {
        name: 'setB',
        args: [2],
        expectation: function(object, ret) {
            return (object.b == 2 && ret == 2);
        }
    }, 
    {
        name: 'getA',
        args: [],
        expectation: function(object, ret) {
            return ret == object.a;
        }
    }, 
    {
        name: 'getB',
        args: [],
        expectation: function(object, ret) {
            return ret == object.b;
        }
    }, 
    {
        name: 'set',
        args: [4, 5],
        expectation: function(object, ret) {
            return (object.a == 4 && object.b == 5 && ret.a == 4 && ret.b == 5);
        }
    },
    {
        name: 'get',
        args: [],
        expectation: function(object, ret) {
            return (object.a == ret.a && object.b == ret.b);
        }
    }
]; // Whatever objects I create should have these methods
var getPureObject = function() {
    return {
        a: 1,
        b: 2,
        setA: function(a) {
            this.a = a;
            return a;
        },
        setB: function(b) {
            this.b = b;
            return b;
        },
        getA: function() {
            return this.a;
        },
        getB: function() {
            return this.b;
        },
        set: function(a, b) {
            this.a = a;
            this.b = b;
            return this;
        },
        get: function() {
            return {a: this.a, b: this.b};
        }
    };
};
var getPrototypedObject = (function() {
    function PrototypedObject(a, b) {
        this.a = a;
        this.b = b;
    }
    PrototypedObject.prototype.setA = function(a) {
        this.a = a;
        return a;
    };
    PrototypedObject.prototype.setB = function(b) {
        this.b = b;
        return b;
    };
    PrototypedObject.prototype.getA = function() {
        return this.a;
    };
    PrototypedObject.prototype.getB = function() {
        return this.b;
    };
    PrototypedObject.prototype.set = function(a, b) {
        this.a = a;
        this.b = b;
        return this;
    };
    PrototypedObject.prototype.get = function() {
        return {a: this.a, b: this.b};
    };

    return function() {
        return new PrototypedObject(1, 2);
    };
}());

var runTests = function(moduleName, getFreshObject, scryName, watchable) {
    var object = null;
    var scryObject = null;
    var usedName = scryName || 'scry';
    var getMethod = function(mname) {
        var i;
        for (i = 0; i < methods.length; i++) {
            if (methods[i].name == mname) {
                return methods[i];
            }
        }
        return null;
    };
    var callMethod = function(method) {
        return object[method.name].apply(object, method.args);
    };
    var callAllMethods = function(except) {
        methods.forEach(function(method) {
            if (!except || except.name != method.name) {
                callMethod(method);
            }
        });
    };
    var watchAllMethods = function(callback, except) {
        methods.forEach(function(method) {
            if (!except || except.name != method.name) {
                scryObject.watch(method.name, callback);
            } 
        });
    };
    var isWatchable = function(method) {
        return watchable.indexOf(method.name) != -1;
    };
    
    // Some repeated tests
    var testOriginalMethods = function() {
        methods.forEach(function(method) {
            var ret = object[method.name].apply(object, method.args);
            ok(method.expectation(object, ret), 'method ' + method.name + ' still works as expected');
        });
    }

    var reset = function() {
            object = getFreshObject();
            Scry.gaze(object, watchable, scryName);
            scryObject = usedName == '.' ? object : object[usedName];
    };
    var moduleOptions = {
        setup: reset,
        teardown: function() {
            testOriginalMethods();
            object = null;
            scryObject = null;
        }
    };

    // Define each module
    var runSetupModule = function() {
        module(moduleName + ' Setup', moduleOptions);

        test("Has scry object", function() {
            if (usedName != '.') {
                ok(object.hasOwnProperty(usedName), 'scry exists (called ' + usedName + ')');
            } else {
                ok(!object.hasOwnProperty(usedName), 'scry does not exist');
            }
        });

        test("Has scry methods", function() {
            var scryMethods = ['methods', 'watch', 'unwatch', 'watchAll', 'unwatchAll', 'silently', 'quietly'];
            scryMethods.forEach(function(method) {
                ok(scryObject.hasOwnProperty(method), 'has method ' + method);
            });
        });

        test("Get watchable methods", function() {
            equal(watchable, scryObject.methods(), 'watchable methods are a go');
        });

        test("Original methods work without changes", function() { });
    };

    var runWatchModule = function() {
        module(moduleName + ' Watch/unwatch', moduleOptions);

        test("Watch one", function() {
            var called = 0;
            var callback = function() { called += 1; }
            methods.forEach(function(method) {
                called = 0;
                scryObject.watch(method.name, callback);
                callMethod(method);
                if (isWatchable(method)) {
                    ok(called == 1, 'callback called once for method ' + method.name);
                } else {
                    ok(called == 0, 'callback failed for unwatchable method ' + method.name);
                }
            });
        });

        test("Watch and unwatch one", function() {
            var called = 0;
            var callback = function() { called += 1; }
            methods.forEach(function(method) {
                called = 0;
                var id = scryObject.watch(method.name, callback);
                scryObject.unwatch(id);
                callMethod(method);
                ok(called == 0, 'callback not called for method ' + method.name);
                reset();
            });
        });

        test("Only one is watched", function() {
            var called = 0;
            var callback = function() { called += 1; }
            methods.forEach(function(method) {
                called = 0;
                var id = scryObject.watch(method.name, callback);
                callAllMethods();
                if (isWatchable(method)) {
                    ok(called == 1, 'callback only called once for method ' + method.name);
                } else {
                    ok(called == 0, 'callback not called for unwatchable method ' + method.name);
                }
                reset();
            });
        });

        test("Only one is unwatched", function() {
            var called = 0;
            var callback = function() { called += 1; }
            methods.forEach(function(method) {
                called = 0;
                watchAllMethods(callback, method);
                var id = scryObject.watch(method.name, callback);
                scryObject.unwatch(id);
                callAllMethods();
                var target = isWatchable(method) ? watchable.length - 1 : watchable.length;
                equal(called, target, 'callback called for all but method ' + method.name);
                reset();
            });
        });

        test("Proper arguments", function() {
            var args = [];
            var callback = function() {
                var i;
                for (i = 0; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
            };
            methods.forEach(function(method) {
                args = [];
                scryObject.watch(method.name, callback);
                callAllMethods();
                if (isWatchable(method)) {
                    deepEqual(args, method.args, 'proper args for method ' + method.name);
                } else {
                    equal(args.length, 0, 'no change for unwatchable method ' + method.name);
                }
                reset();
            });
        });

        test("Multi-callbacks adding", function() {
            var called = 0;
            var callback = function() { called += 1; }
            methods.forEach(function(method) {
                called = 0;
                scryObject.watch(method.name, callback);
                scryObject.watch(method.name, callback);
                callAllMethods();
                if (isWatchable(method)) {
                    equal(called, 2, 'callback called twice for method ' + method.name);
                } else {
                    equal(called, 0, 'callback not called for unwatchable method ' + method.name);
                }
                reset();
            });
        });

        test("Multi-callbacks removing", function() {
            var called = 0;
            var callback = function() { called += 1; }
            methods.forEach(function(method) {
                called = 0;
                scryObject.watch(method.name, callback);
                var id = scryObject.watch(method.name, callback);
                scryObject.unwatch(id);
                callAllMethods();
                if (isWatchable(method)) {
                    equal(called, 1, 'callback called only once for method ' + method.name);
                } else {
                    equal(called, 0, 'callback not called for unwatchable method ' + method.name);
                }
                reset();
            });
        });

        test("Lots of watching/unwatching", function() {
            var called = 0;
            var callback = function() { called += 1; }
            methods.forEach(function(method) {
                called = 0;
                var i, id;
                for (i = 0; i < 1000; i++) {
                    id = scryObject.watch(method.name, callback);
                    scryObject.unwatch(id);
                }
                callAllMethods();
                equal(called, 0, 'all callbacks remove for method ' + method.name);
                reset();
            });
        });
    };

    var runWatchAllModule = function() {
        module(moduleName + ' WatchAll/UnwatchAll', moduleOptions);
        
        test('WatchAll single function', function() {
            var called = 0;
            var callback = function() { called += 1; }
            scryObject.watchAll(callback);
            if (watchable.length > 0) {
                var m = getMethod(watchable[0]);
                if (m != null) {
                    callMethod(getMethod(watchable[0]));
                    equal(called, 1, 'callback called only once for a single method');
                }
                called = 0;
            }
            callAllMethods();
            equal(called, watchable.length, 'callback called once for each watchable method');
        });

        test('WatchAll single unwatch', function() {
            var called = 0;
            var callback = function() { called += 1; }
            var id = scryObject.watchAll(callback);
            scryObject.unwatch(id);
            callAllMethods();
            equal(called, 0, 'global watcher uncalled');
        });

        test('WatchAll multi-function', function() {
            var called = 0;
            var callback = function() { called += 1; }
            scryObject.watchAll(callback);
            var id = scryObject.watchAll(callback);
            callAllMethods();
            equal(called, watchable.length * 2, 'callback called twice for each watchable method');
            called = 0;
            scryObject.unwatch(id);
            callAllMethods();
            equal(called, watchable.length, 'callback only called once for each watchable method');
        });

        test('WatchAll proper arguments', function() {
            var args = [];
            var callback = function() {
                var i;
                for (i = 0; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
            };
            var id = scryObject.watchAll(callback);
            methods.forEach(function(method) {
                args = [];
                callMethod(method);
                if (isWatchable(method)) {
                    equal(args[0], method.name, 'first argument is method name');
                    deepEqual(args.slice(1), method.args, 'rest are passed args');
                } else {
                    ok(args.length == 0, 'callback not called for unwatchable method ' + method);
                }
            });
        });

        test('UnwatchAll', function() {
            var called = 0;
            var callback = function() { called += 1; };
            scryObject.watchAll(callback);
            watchAllMethods(callback);
            scryObject.unwatchAll();
            callAllMethods();
            equal(called, 0, 'no arguments were called');
        });
    };

    var runQuietlyModule = function() {
        module(moduleName + ' Quietly/Silently', moduleOptions);
        
        test('Testing quietly single avoider', function() {
            var called1 = 0;
            var called2 = 0;
            var callback1 = function() { called1 += 1; };
            var callback2 = function() { called2 += 1; };
            methods.forEach(function(method) {
                called1 = 0;
                called2 = 0;
                var id = scryObject.watch(method.name, callback1);
                scryObject.watch(method.name, callback2);
                var args = [method.name, id].concat(method.args);
                scryObject.quietly.apply(scryObject, args);
                if (isWatchable(method)) {
                    equal(called1, 0, 'first callback was not called');
                    equal(called2, 1, 'second callback was called');
                } else {
                    ok(called1 == 0 && called2 == 0, 'no callbacks called');
                }
            });
        });

        test('Testing quietly multi-avoider', function() {
            var called1 = 0;
            var called2 = 0;
            var called3 = 0;
            var callback1 = function() { called1 += 1; };
            var callback2 = function() { called2 += 1; };
            var callback3 = function() { called3 += 1; };
            methods.forEach(function(method) {
                called1 = 0;
                called2 = 0;
                called3 = 0;
                var id1 = scryObject.watch(method.name, callback1);
                var id2 = scryObject.watch(method.name, callback2);
                scryObject.watch(method.name, callback3);
                var args = [method.name, [id1, id2]].concat(method.args);
                scryObject.quietly.apply(scryObject, args);
                if (isWatchable(method)) {
                    equal(called1, 0, 'first callback was not called');
                    equal(called2, 0, 'second callback was not called');
                    equal(called3, 1, 'third callback was called');
                } else {
                    ok(called1 == 0 && called2 == 0 && called3 == 0, 'no callbacks called');
                }
            });
        });

        test('Testing quietly return value', function() {
            var called1 = 0;
            var called2 = 0;
            var callback1 = function() { called1 += 1; };
            var callback2 = function() { called2 += 1; };
            methods.forEach(function(method) {
                called1 = 0;
                called2 = 0;
                var id = scryObject.watch(method.name, callback1);
                scryObject.watch(method.name, callback2);
                var args = [method.name, id].concat(method.args);
                var ret = scryObject.quietly.apply(scryObject, args);
                if (isWatchable(method)) {
                    ok(method.expectation(object, ret), 'proper return value');
                } else {
                    ok(ret == null && called1 == 0 && called2 == 0, 'callback not called');
                }
            });
        });

        test('Silently test', function() {
            var called1 = 0;
            var called2 = 0;
            var callback1 = function() { called1 += 1; };
            var callback2 = function() { called2 += 1; };
            methods.forEach(function(method) {
                called1 = 0;
                called2 = 0;
                scryObject.watch(method.name, callback1);
                scryObject.watch(method.name, callback2);
                var args = [method.name].concat(method.args);
                var ret = scryObject.silently.apply(scryObject, args);
                equal(called1, 0, 'first callback was not called');
                equal(called2, 0, 'second callback was not called');
                if (isWatchable(method)) {
                    ok(method.expectation(object, ret), 'proper return value');
                } else {
                    ok(ret == null, 'proper return value');
                }
            });
        });
    };

    // Actually run all the modules
    runSetupModule();
    runWatchModule();
    runWatchAllModule();
    runQuietlyModule();
};

// Type 1 group: pure object (no constructor or prototype functions),
// all methods, using the default name (scry)
var watchable = ['setA', 'setB', 'getA', 'getB', 'set', 'get'];
runTests("Type 1", getPureObject, null, watchable);

// Type 2 group: pure object (no constructor or prototype functions),
// all methods, using the special name
watchable = ['setA', 'setB', 'getA', 'getB', 'set', 'get'];
runTests("Type 2", getPureObject, '.', watchable);

// Type 3 group: pure object (no constructor or prototype functions),
// all methods, using another name
watchable = ['setA', 'setB', 'getA', 'getB', 'set', 'get'];
runTests("Type 3", getPureObject, 'spy', watchable);

// Type 4 group: prototyped object, all methods, default name
watchable = ['setA', 'setB', 'getA', 'getB', 'set', 'get'];
runTests("Type 4", getPrototypedObject, null, watchable);

// Type 5 group: prototyped object, all methods, using the special name
watchable = ['setA', 'setB', 'getA', 'getB', 'set', 'get'];
runTests("Type 5", getPrototypedObject, '.', watchable);

// Type 6 group: prototyped object, all methods, using another name
watchable = ['setA', 'setB', 'getA', 'getB', 'set', 'get'];
runTests("Type 6", getPureObject, 'spy', watchable);

// Type 7 group: pure object (no constructor or prototype functions),
// half methods, using the default name (scry)
watchable = ['setA', 'getA', 'set', 'get'];
runTests("Type 7", getPureObject, null, watchable);

// Type 8 group: prototyped object, half methods, default name
watchable = ['setA', 'getA', 'set', 'get'];
runTests("Type 8", getPrototypedObject, null, watchable);

