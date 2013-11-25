# Scry.js
## A module for seeing things

Scry is used to turn a regular object into one with callbacks. A simple
example:

Suppose that you have an object `vect`.

~~~
var vect = (function() {
    var x = 1;
    var y = 2;
    return {
        setX: function(xVal) { x = xVal; },
        setY: function(yVal) { y = yVal; },
        move: function(xVal, yVal) { x = xVal; y = yVal; },
        draw: function() { /* Drawing code here */ }
    };
}());
~~~

You want to add some logging functionality to `vect`, so that every time
`vect.setX` is called, you see some output. You can use `Scry` to
achieve this by making `vect.setX` watchable.

~~~
Scry.gaze(vect, ['setX']);
~~~

Now you can watch `vect.setX` with

~~~
var id = vect.scry.watch('setX', function(x) {
    alert('vect.setX called with argument ' + x);
});
vect.setX(2); // alerts
~~~

You can stop watching any time with 

~~~
vect.scry.unwatch(id);
vect.setX(3); // no alert
~~~

## Loading scry.js

Scry is built according to the [Universal Module
Definition](https://github.com/umdjs/umd) guidelines, so it should work
with AMD loaders (e.g. [require.js](http://requirejs.org)), with node,
or simply by including it in the browser before your other code, like a
global variable `Scry`. If you happen to be using node, Scry should be
available in the npm repositories, so you can

~~~
npm install scry
~~~

See the examples folder for examples of all three.

## Features

1. Watch any method on any object. Works with plain objects, as above,
   but also with prototyped or inherited objects.
2. Preserves object constructor. If you had an instance of `Vect`
   before, then it will still be a `Vect` after you `Scry.gaze` it.

## Things to Know

There are a couple of important things to know. When you use
`Scry.gaze`, your object is permanently changed. This means that

1. If there was something at `object.scry` before - it's no longer
  useable. This isn't generally a problem, but if it is there is an
optional third argument to `Scry.gaze`, which is the name to use instead
of 'scry'. Ex:

    ~~~
    Scry.gaze(vect, ['addX', 'addY'], 'watcher');
    var id = vect.watcher.watch('addX', callback);
    ~~~

    A very spectial version is to pass in `'.'` as the name, which
will simply place the scry methods `watch`, `unwatch`, `watchAll`, etc.
on your base object.

    ~~~
    Scry.gaze(vect, ['addX', 'addY'], '.');
    var id = vect.watch('addX', callback);
    ~~~

2. Don't use `Scry.gaze` on it again, in order to e.g. make more of
  the methods gazeable. I hope to fix this in a future release.
3. Your object methods are now slower. There is some overhead in
  looking for the callbacks and parsing arguments. For most cases,
the cost of the function and the callback will outweigh the overhead, so
this won't matter. But I wouldn't gaze at objects or methods unless you
need to.
4. There is no `Scry.ungaze` yet. I'm working on it.

## API

* Scry.gaze(object, methodNames [, altName]);

    Adds `object.scry` to `object`, allowing for any of the functions
below to be used. Note that only methods named in the second parameter
can be watched or unwatched - all others will be silently ignored.

    The optional parameter `altName` provides an alternative name to use
instead of 'scry', making the functions below available on
`object[altName]` instead of `object.scry`. However, if you pass the
special case `'.'` as `altName`, the methods below will all be placed
directly on `object`.

    * `object.scry.watch(methodName, callback);`

        Watch the given method, so that whenver `object[methodName]` is
called, `callback` is called afterward. The arguments given to callback
are the same as the arguments given to `object[methodName]`. Returns an
id, to be used with `unwatch`.

    * `object.scry.watchAll(callback);`

        Watch all the watchable methods, calling `callback` whenever one
is called. The arguments given to `callback` are the name of the method
called, followed by the arguments given to that method. Returns an id of
a global watcher, which can be removed with 

    * `object.scry.unwatch(id);`

        Stop the watcher with the given id. The id of a watcher can be
obtained when `watch` or `watchAll` is first called.

    * `object.scry.unwatchAll([methods]);`

        Stop many watchers at once. Can be called with 

            * no arguments: stop all watchers on all methods
            * one argument (a string `fname`): stop all watchers on the method
              `fname`
            * one argument (an array of `fnames`): stop all watchers on
              every method in `fnames`

    * `object.scry.methods();`

        Return a list with the names of all watchable methods.

    * `object.scry.quietly(fname, without [, arg1, arg2, ...]);`

        Call the function given by `fname` with the arguments given, but
without alerting any of the watchers whose ids are presented in the
array of ids `without`. The typical use case is when an object `A` is
watching the scried object `B`, and must call `B.buzz` whenever `B.fizz`
is called, and must call `B.fizz` whenever `B.fuzz` is called. This
would lead to an infinite loop of callbacks, unless it can call `B.buzz`
without then getting a signal that `B.fizz` was called. It should use
e.g.

            B.scry.quietly(fname, this.fizzWatcherId, args);

        Note that `without` can be either an array of ids or a single
id.

    * `object.scry.silently(fname [, arg1, arg2, ...]);`

        Call the function given by `fname` with the supplied arguments,
but don't alert any of the watchers. Equivalent to 
        
            object.scry.quietly(fname, object.scry.methods(), arg1, arg2, ...);

## License

My goal is to use as unrestrictive a license as possible. If this
license does not fit your requirements, please contact me as I would be
more than happy to allow you to use this code under any conditions that
you see fit.

All code in this project is placed under the following license, save:

    * the copy of [require.js](http://requirejs.org) provided in
      `examples/browser-requirejs/lib/`, which is copyright (c) The Dojo
Foundation and used under the MIT license.
    * the copy of [qunit](http://qunitjs.com) provided in
      `tests/resources/`, which is copyright (c) The jQuery Foundation
and other contributors and used under the MIT license.

The MIT License (MIT)
Copyright (c) 2013 Brian Shourd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
