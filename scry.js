// Scry.js
// A module for looking into objects
(function (root, factory) {
    if (typeof define === 'function' && define.amd) { // AMD
        define(factory);
    } else if (typeof exports === 'object') {   // Node
        module.exports = factory();
    } else {    // Browser Global
        root.Scry = factory();
    }
}(this, function () {
    var Scry = {};
    Scry.version = '0.0.1';

    // Useage:
    // Suppose that you have an object `list` that you want to be able
    // to observe. In particular, you want to watch the methods
    // `list.add` and `list.remove`. Call
    //
    // Scry.gaze(list, ['add', 'remove']);
    //
    // Now `list` is permanently changed. In particular, it now has the
    // `list.scry` object, which allows for spying on both `add` and
    // `remove`. Now, if you want to know every time `list.add` is
    // called, you could call
    //
    // var id = list.scry.watch('add', function() {
    //     console.log('list.add was called with arguments ' + arguments);
    // });
    //
    // The `list` object can still be used as it always was, except that
    // now every time `list.add` is called, the callback function is
    // also called.
    //
    // list.add('item') // adds 'item' to the list, and also ouputs the
    //                  // message above to the console.
    //
    // The optional third argument `name` allows you to provide an
    // alternate name to the `scry` object, if `list.scry` is already
    // being used.
    Scry.gaze = function(obj, fnames, name) {
        // Save the original functions, since we'll overload them with
        // hooked versions
        var orig = {};
        var watchers = {};
        fnames.forEach(function(fname) {
            var f = obj[fname];

            // Save the originals
            orig[fname] = f;

            // Add a watcher collection
            watchers[fname] = {};

            // Transform the function into a hooked version
            obj[fname] = function() {
                var args = Array.prototype.slice.call(arguments);
                var ret = f.apply(obj, args);
                // Trigger all watchers
                for (var wid in watchers[fname]) {
                    if (watchers[fname].hasOwnProperty(wid)) {
                        watchers[fname][wid].apply(null, args);
                    }
                }
                return ret;
            };
        });

        var scry;
        name = name || 'scry';
        // Special case - we want all of the scry methods (watch,
        // unwatch, silently, etc) to be available on our root object,
        // at the base.
        if (name == '.') {
            scry = obj;
        } else {    // Put them in the subobject given by name
            scry = {};
            obj[name] = scry;
        }

        // Positive ids for regular watchers, negative ids for global
        // watchers.
        var curId = 0;

        // If you wanted to know the names of the methods being watched
        scry.methods = function() {
            return fnames;
        };

        // Add a watcher to the `fname` method, using fn as a callback.
        // The callback function is called with the arguments given to
        // the function fname. Returns a watcher id, to be used in
        // unwatch and/or trigger, or returns null, if it was
        // unsuccessful. Ex:
        //
        // var id = list.scry.watch('add', function(item) {
        //     console.log('list.add was called with argument ' + item);
        // });
        scry.watch = function(fname, fn) {
            if (watchers.hasOwnProperty(fname)) {
                watchers[fname][curId] = fn;
                curId += 1;
                return curId - 1;
            } else {
                return null;
            }
        };

        // Removes the watchers with the given ids. Ex:
        //
        // list.scry.unwatch([id1, id2]);
        scry.unwatch = function(ids) { 
            fnames.forEach(function(fname) {
                if (toString.call(ids) != '[object Array]') { // ids is single item
                    ids = [ids];
                }
                ids.forEach(function(id) {
                    if (watchers[fname].hasOwnProperty(id)) {
                        delete(watchers[fname][id]);
                    }
                });
            });
        };

        // Add a global watcher, which is called whenever any of the
        // scried methods gets called. fn will be called with the
        // arguments (fname, arg1, arg2, ...), where fname is the name of the
        // method that was called, and arg1, arg2, ... are the arguments
        // passed to that method. Ex:
        //
        // var gid = list.scry.watchAll(function(fname) {
        //     console.log('list.' + fname + ' was called!');
        // });
        scry.watchAll = function(fn) {
            fnames.forEach(function(fname) {
                // Note - negative id for global watchers
                watchers[fname][-curId] = function() {
                    var args = Array.prototype.slice.call(arguments);
                    args.unshift(fname);
                    fn.apply(null, args);
                };
            });

            curId += 1;
            return (-curId + 1);
        };

        // Remove all watchers on this object watching fname. If no
        // argument is supplied, remove all watchers, period.
        scry.unwatchAll = function(fname) {
            if (fname == null) {
                watchers = {};
                fnames.forEach(function(fname) {
                    watchers[fname] = {};
                });
            } else if (watchers.hasOwnProperty(fname)) {
                watchers[fname] = {};
            }
        };

        // If you want to trigger a function, but without alerting any
        // of the watchers. Then
        //
        // list.scry.silently('add', item)
        //
        // is equivalent to calling list.add(item) before you added scry
        scry.silently = function() { // (fname, args)
            if (arguments.length == 0 || !orig.hasOwnProperty(arguments[0])) { 
                return null;
            }
            var args = Array.prototype.slice.call(arguments, 1);
            return orig[arguments[0]].apply(obj, args);
        };

        // Often, you want to trigger a function, but without alerting
        // some of the watchers. For example:
        //
        // list.scry.trigger('add', [id1, id2], item)
        //
        // will both call list.add(item), and will alert all of the
        // watchers except those with id id1 and id2. Alternately, if
        // there is only one watcher to be excluded (the typical use
        // case):
        //
        // list.scry.trigger('add', id1, item)
        //
        // This can be useful if, for example, you have an object that
        // is watching and also calling functions, so that it can call
        // list.add without being alerted that it just called list.add,
        // and entering an infinite loop.
        scry.quietly = function() { // (fname, without, args)
            if (arguments.length < 2 || !orig.hasOwnProperty(arguments[0])) {
                return;
            }
            var fname = arguments[0];
            var without = arguments[1];
            var args = Array.prototype.slice.call(arguments, 2);
            var ret = orig[fname].apply(obj, args);
            if (toString.call(without) == '[object Array]') { // without is array
                var newWatchers = {};
                // newWatchers should be all of the watchers, but
                // without any watchers in without
                for (var id in watchers[fname]) {
                    if (watchers[fname].hasOwnProperty(id)) {
                        newWatchers[id] = watchers[fname][id];
                    }
                }
                without.forEach(function(id) {
                    if (newWatchers.hasOwnProperty(id)) {
                        delete(newWatchers[id]);
                    }
                });
                // alert all of the newWatchers
                for (var id in newWatchers) {
                    if (newWatchers.hasOwnProperty(id)) {
                        newWatchers[id].apply(null, args);
                    }
                }
            } else { // without is not an array
                // In this case, this algorithm is faster
                for (var id in watchers[fname]) {
                    if (watchers[fname].hasOwnProperty(id) && id != without) {
                        watchers[fname][id].apply(null, args);
                    }
                }
            }
            return ret;
        };

        //scry.orig = orig;
        return obj;
    }

    return Scry;
}));
