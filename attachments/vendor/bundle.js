var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}
var __require = require;

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require.resolve = (function () {
    var core = {
        'assert': true,
        'events': true,
        'fs': true,
        'path': true,
        'vm': true
    };
    
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    Object.keys(require.modules)
        .forEach(function (x) {
            if (x.slice(0, basedir.length + 1) === basedir + '/') {
                var f = x.slice(basedir.length);
                require.modules[to + f] = require.modules[basedir + f];
            }
            else if (x === basedir) {
                require.modules[to] = require.modules[basedir];
            }
        })
    ;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.modules["path"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "path";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["path"]._cached = module.exports;
    
    (function () {
        // resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(resolvedPath.split('/').filter(function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(path.split('/').filter(function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(paths.filter(function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};
;
    }).call(module.exports);
    
    __require.modules["path"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/seq/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/seq";
    var __filename = "/node_modules/seq/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/seq");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/seq");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/seq/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"seq","version":"0.3.3","description":"Chainable asynchronous flow control with sequential and parallel primitives and pipeline-style error handling","main":"./index.js","repository":{"type":"git","url":"http://github.com/substack/node-seq.git"},"dependencies":{"chainsaw":">=0.0.7 <0.1","hashish":">=0.0.2 <0.1"},"devDependencies":{"expresso":"=0.7.x"},"script":{"test":"expresso"},"keywords":["flow-control","flow","control","async","asynchronous","chain","pipeline","sequence","sequential","parallel","error"],"author":{"name":"James Halliday","email":"mail@substack.net","url":"http://substack.net"},"license":"MIT/X11","engine":{"node":">=0.4.0"}};
    }).call(module.exports);
    
    __require.modules["/node_modules/seq/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/seq/index.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/seq";
    var __filename = "/node_modules/seq/index.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/seq");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/seq");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/seq/index.js"]._cached = module.exports;
    
    (function () {
        var EventEmitter = require('events').EventEmitter;
var Hash = require('hashish');
var Chainsaw = require('chainsaw');

module.exports = Seq;
function Seq (xs) {
    if (xs && !Array.isArray(xs) || arguments.length > 1) {
        throw new Error('Optional argument to Seq() is exactly one Array');
    }
    
    var ch = Chainsaw(function (saw) {
        builder.call(this, saw, xs || []);
    });
    
    process.nextTick(function () {
        ch['catch'](function (err) {
            console.error(err.stack ? err.stack : err)
        });
    });
    return ch;
}

Seq.ap = Seq; // for compatability with versions <0.3

function builder (saw, xs) {
    var context = {
        vars : {},
        args : {},
        stack : xs,
        error : null
    };
    context.stack_ = context.stack;
    
    function action (step, key, f, g) {
        var cb = function (err) {
            var args = [].slice.call(arguments, 1);
            if (err) {
                context.error = { message : err, key : key };
                saw.jump(lastPar);
                saw.down('catch');
                g();
            }
            else {
                if (typeof key == 'number') {
                    context.stack_[key] = args[0];
                    context.args[key] = args;
                }
                else {
                    context.stack_.push.apply(context.stack_, args);
                    if (key !== undefined) {
                        context.vars[key] = args[0];
                        context.args[key] = args;
                    }
                }
                if (g) g(args, key);
            }
        };
        Hash(context).forEach(function (v,k) { cb[k] = v });
        
        cb.into = function (k) {
            key = k;
            return cb;
        };
        
        cb.next = function (err, xs) {
            context.stack_.push.apply(context.stack_, xs);
            cb.apply(cb, [err].concat(context.stack));
        };
        
        cb.pass = function (err) {
            cb.apply(cb, [err].concat(context.stack));
        };
        
        cb.ok = cb.bind(cb, null);
        
        f.apply(cb, context.stack);
    }
    
    var running = 0;
    var errors = 0;
    
    this.seq = function (key, cb) {
        var bound = [].slice.call(arguments, 2);
        
        if (typeof key === 'function') {
            if (arguments.length > 1) bound.unshift(cb);
            cb = key;
            key = undefined;
        }
        
        if (context.error) saw.next()
        else if (running === 0) {
            action(saw.step, key,
                function () {
                    context.stack_ = [];
                    var args = [].slice.call(arguments);
                    args.unshift.apply(args, bound.map(function (arg) {
                        return arg === Seq ? this : arg
                    }, this));
                    
                    cb.apply(this, args);
                }, function () {
                    context.stack = context.stack_;
                    saw.next()
                }
            );
        }
    };
    
    var lastPar = null;
    this.par = function (key, cb) {
        lastPar = saw.step;
        
        if (running == 0) {
            // empty the active stack for the first par() in a chain
            context.stack_ = [];
        }
        
        var bound = [].slice.call(arguments, 2);
        if (typeof key === 'function') {
            if (arguments.length > 1) bound.unshift(cb);
            cb = key;
            key = context.stack_.length;
            context.stack_.push(null);
        }
        var cb_ = function () {
            var args = [].slice.call(arguments);
            args.unshift.apply(args, bound.map(function (arg) {
                return arg === Seq ? this : arg
            }, this));
            
            cb.apply(this, args);
        };
        
        running ++;
        
        var step = saw.step;
        process.nextTick(function () {
            action(step, key, cb_, function (args) {
                if (!args) errors ++;
                
                running --;
                if (running == 0) {
                    context.stack = context.stack_.slice();
                    saw.step = lastPar;
                    if (errors > 0) saw.down('catch');
                    errors = 0;
                    saw.next();
                }
            });
        });
        saw.next();
    };
    
    [ 'seq', 'par' ].forEach(function (name) {
        this[name + '_'] = function (key) {
            var args = [].slice.call(arguments);
            
            var cb = typeof key === 'function'
                ? args[0] : args[1];
            
            var fn = function () {
                var argv = [].slice.call(arguments);
                argv.unshift(this);
                cb.apply(this, argv);
            };
            
            if (typeof key === 'function') {
                args[0] = fn;
            }
            else {
                args[1] = fn;
            }
            
            this[name].apply(this, args);
        };
    }, this);
    
    this['catch'] = function (cb) {
        if (context.error) {
            cb.call(context, context.error.message, context.error.key);
            context.error = null;
        }
        saw.next();
    };
    
    this.forEach = function (cb) {
        this.seq(function () {
            context.stack_ = context.stack.slice();
            var end = context.stack.length;
            
            if (end === 0) this(null)
            else context.stack.forEach(function (x, i) {
                action(saw.step, i, function () {
                    cb.call(this, x, i);
                    if (i == end - 1) saw.next();
                });
            });
        });
    };
    
    this.seqEach = function (cb) {
        this.seq(function () {
            context.stack_ = context.stack.slice();
            var xs = context.stack.slice();
            if (xs.length === 0) this(null);
            else (function next (i) {
                action(
                    saw.step, i,
                    function () { cb.call(this, xs[i], i) },
                    function (args) {
                        if (!args || i === xs.length - 1) saw.next();
                        else next(i + 1);
                    }
                );
            }).bind(this)(0);
        });
    };
    
    this.parEach = function (limit, cb) {
        var xs = context.stack.slice();
        if (cb === undefined) { cb = limit; limit = xs.length }
        context.stack_ = [];
        
        var active = 0;
        var finished = 0;
        var queue = [];
        
        if (xs.length === 0) saw.next()
        else xs.forEach(function call (x, i) {
            if (active >= limit) {
                queue.push(call.bind(this, x, i));
            }
            else {
                active ++;
                action(saw.step, i,
                    function () {
                        cb.call(this, x, i);
                    },
                    function () {
                        active --;
                        finished ++;
                        if (queue.length > 0) queue.shift()();
                        else if (finished === xs.length) {
                            saw.next();
                        }
                    }
                );
            }
        });
    };
    
    this.parMap = function (limit, cb) {
        var res = [];
        var len = context.stack.length;
        if (cb === undefined) { cb = limit; limit = len }
        var res = [];
        
        Seq()
            .extend(context.stack)
            .parEach(limit, function (x, i) {
                var self = this;
                
                var next = function () {
                    res[i] = arguments[1];
                    self.apply(self, arguments);
                };
                
                next.stack = self.stack;
                next.stack_ = self.stack_;
                next.vars = self.vars;
                next.args = self.args;
                next.error = self.error;
                
                next.into = function (key) {
                    return function () {
                        res[key] = arguments[1];
                        self.apply(self, arguments);
                    };
                };
                
                next.ok = function () {
                    var args = [].slice.call(arguments);
                    args.unshift(null);
                    return next.apply(next, args);
                };
                
                cb.apply(next, arguments);
            })
            .seq(function () {
                context.stack = res;
                saw.next();
            })
        ;
    };
    
    this.seqMap = function (cb) {
        var res = [];
        var len = context.stack.length;
        
        this.seqEach(function (x, i) {
            var self = this;
            
            var next = function () {
                res[i] = arguments[1];
                if (i == len - 1) context.stack = res;
                self.apply(self, arguments);
            };
            
            next.stack = self.stack;
            next.stack_ = self.stack_;
            next.vars = self.vars;
            next.args = self.args;
            next.error = self.error;
            
            next.into = function (key) {
                return function () {
                    res[key] = arguments[1];
                    self.apply(self, arguments);
                };
            };
            
            next.ok = function () {
                var args = [].slice.call(arguments);
                args.unshift(null);
                return next.apply(next, args);
            };
            
            cb.apply(next, arguments);
        });
    };
    
    [ 'forEach', 'seqEach', 'parEach', 'seqMap', 'parMap' ]
        .forEach(function (name) {
            this[name + '_'] = function (cb) {
                this[name].call(this, function () {
                    var args = [].slice.call(arguments);
                    args.unshift(this);
                    cb.apply(this, args);
                });
            };
        }, this)
    ;
    
    ['push','pop','shift','unshift','splice']
        .forEach(function (name) {
            this[name] = function () {
                context.stack[name].apply(
                    context.stack,
                    [].slice.call(arguments)
                );
                saw.next();
                return this;
            };
        }, this)
    ;
    
    this.extend = function (xs) {
        if (!Array.isArray(xs)) {
            throw new Error('argument to .extend() is not an Array');
        }
        context.stack.push.apply(context.stack, xs);
        saw.next();
    };
    
    this.flatten = function (pancake) {
        var xs = [];
        // should we fully flatten this array? (default: true)
        if (pancake === undefined) { pancake = true; }
        context.stack.forEach(function f (x) {
            if (Array.isArray(x) && pancake) x.forEach(f);
            else if (Array.isArray(x)) xs = xs.concat(x);
            else xs.push(x);
        });
        context.stack = xs;
        saw.next();
    };
    
    this.unflatten = function () {
        context.stack = [context.stack];
        saw.next();
    };
    
    this.empty = function () {
        context.stack = [];
        saw.next();
    };
    
    this.set = function (stack) {
        context.stack = stack;
        saw.next();
    };
    
    this['do'] = function (cb) {
        saw.nest(cb, context);
    };
}
;
    }).call(module.exports);
    
    __require.modules["/node_modules/seq/index.js"]._cached = module.exports;
    return module.exports;
};

require.modules["events"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "events";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["events"]._cached = module.exports;
    
    (function () {
        if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = Array.isArray;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};
;
    }).call(module.exports);
    
    __require.modules["events"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/hashish/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/hashish";
    var __filename = "/node_modules/hashish/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/hashish");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/hashish");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/hashish/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"hashish","version":"0.0.4","description":"Hash data structure manipulation functions","main":"./index.js","repository":{"type":"git","url":"http://github.com/substack/node-hashish.git"},"keywords":["hash","object","convenience","manipulation","data structure"],"author":{"name":"James Halliday","email":"mail@substack.net","url":"http://substack.net"},"dependencies":{"traverse":">=0.2.4"},"devDependencies":{"expresso":">=0.6.0"},"scripts":{"test":"expresso"},"license":"MIT/X11","engine":["node >=0.2.0"]};
    }).call(module.exports);
    
    __require.modules["/node_modules/hashish/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/hashish/index.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/hashish";
    var __filename = "/node_modules/hashish/index.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/hashish");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/hashish");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/hashish/index.js"]._cached = module.exports;
    
    (function () {
        module.exports = Hash;
var Traverse = require('traverse');

function Hash (hash, xs) {
    if (Array.isArray(hash) && Array.isArray(xs)) {
        var to = Math.min(hash.length, xs.length);
        var acc = {};
        for (var i = 0; i < to; i++) {
            acc[hash[i]] = xs[i];
        }
        return Hash(acc);
    }
    
    if (hash === undefined) return Hash({});
    
    var self = {
        map : function (f) {
            var acc = { __proto__ : hash.__proto__ };
            Object.keys(hash).forEach(function (key) {
                acc[key] = f.call(self, hash[key], key);
            });
            return Hash(acc);
        },
        forEach : function (f) {
            Object.keys(hash).forEach(function (key) {
                f.call(self, hash[key], key);
            });
            return self;
        },
        filter : function (f) {
            var acc = { __proto__ : hash.__proto__ };
            Object.keys(hash).forEach(function (key) {
                if (f.call(self, hash[key], key)) {
                    acc[key] = hash[key];
                }
            });
            return Hash(acc);
        },
        detect : function (f) {
            for (var key in hash) {
                if (f.call(self, hash[key], key)) {
                    return hash[key];
                }
            }
            return undefined;
        },
        reduce : function (f, acc) {
            var keys = Object.keys(hash);
            if (acc === undefined) acc = keys.shift();
            keys.forEach(function (key) {
                acc = f.call(self, acc, hash[key], key);
            });
            return acc;
        },
        some : function (f) {
            for (var key in hash) {
                if (f.call(self, hash[key], key)) return true;
            }
            return false;
        },
        update : function (obj) {
            if (arguments.length > 1) {
                self.updateAll([].slice.call(arguments));
            }
            else {
                Object.keys(obj).forEach(function (key) {
                    hash[key] = obj[key];
                });
            }
            return self;
        },
        updateAll : function (xs) {
            xs.filter(Boolean).forEach(function (x) {
                self.update(x);
            });
            return self;
        },
        merge : function (obj) {
            if (arguments.length > 1) {
                return self.copy.updateAll([].slice.call(arguments));
            }
            else {
                return self.copy.update(obj);
            }
        },
        mergeAll : function (xs) {
            return self.copy.updateAll(xs);
        },
        has : function (key) { // only operates on enumerables
            return Array.isArray(key)
                ? key.every(function (k) { return self.has(k) })
                : self.keys.indexOf(key.toString()) >= 0;
        },
        valuesAt : function (keys) {
            return Array.isArray(keys)
                ? keys.map(function (key) { return hash[key] })
                : hash[keys]
            ;
        },
        tap : function (f) {
            f.call(self, hash);
            return self;
        },
        extract : function (keys) {
            var acc = {};
            keys.forEach(function (key) {
                acc[key] = hash[key];
            });
            return Hash(acc);
        },
        exclude : function (keys) {
            return self.filter(function (_, key) {
                return keys.indexOf(key) < 0
            });
        },
        end : hash,
        items : hash
    };
    
    var props = {
        keys : function () { return Object.keys(hash) },
        values : function () {
            return Object.keys(hash).map(function (key) { return hash[key] });
        },
        compact : function () {
            return self.filter(function (x) { return x !== undefined });
        },
        clone : function () { return Hash(Hash.clone(hash)) },
        copy : function () { return Hash(Hash.copy(hash)) },
        length : function () { return Object.keys(hash).length },
        size : function () { return self.length }
    };
    
    if (Object.defineProperty) {
        // es5-shim has an Object.defineProperty but it throws for getters
        try {
            for (var key in props) {
                Object.defineProperty(self, key, { get : props[key] });
            }
        }
        catch (err) {
            for (var key in props) {
                if (key !== 'clone' && key !== 'copy' && key !== 'compact') {
                    // ^ those keys use Hash() so can't call them without
                    // a stack overflow
                    self[key] = props[key]();
                }
            }
        }
    }
    else if (self.__defineGetter__) {
        for (var key in props) {
            self.__defineGetter__(key, props[key]);
        }
    }
    else {
        // non-lazy version for browsers that suck >_<
        for (var key in props) {
            self[key] = props[key]();
        }
    }
    
    return self;
};

// deep copy
Hash.clone = function (ref) {
    return Traverse.clone(ref);
};

// shallow copy
Hash.copy = function (ref) {
    var hash = { __proto__ : ref.__proto__ };
    Object.keys(ref).forEach(function (key) {
        hash[key] = ref[key];
    });
    return hash;
};

Hash.map = function (ref, f) {
    return Hash(ref).map(f).items;
};

Hash.forEach = function (ref, f) {
    Hash(ref).forEach(f);
};

Hash.filter = function (ref, f) {
    return Hash(ref).filter(f).items;
};

Hash.detect = function (ref, f) {
    return Hash(ref).detect(f);
};

Hash.reduce = function (ref, f, acc) {
    return Hash(ref).reduce(f, acc);
};

Hash.some = function (ref, f) {
    return Hash(ref).some(f);
};

Hash.update = function (a /*, b, c, ... */) {
    var args = Array.prototype.slice.call(arguments, 1);
    var hash = Hash(a);
    return hash.update.apply(hash, args).items;
};

Hash.merge = function (a /*, b, c, ... */) {
    var args = Array.prototype.slice.call(arguments, 1);
    var hash = Hash(a);
    return hash.merge.apply(hash, args).items;
};

Hash.has = function (ref, key) {
    return Hash(ref).has(key);
};

Hash.valuesAt = function (ref, keys) {
    return Hash(ref).valuesAt(keys);
};

Hash.tap = function (ref, f) {
    return Hash(ref).tap(f).items;
};

Hash.extract = function (ref, keys) {
    return Hash(ref).extract(keys).items;
};

Hash.exclude = function (ref, keys) {
    return Hash(ref).exclude(keys).items;
};

Hash.concat = function (xs) {
    var hash = Hash({});
    xs.forEach(function (x) { hash.update(x) });
    return hash.items;
};

Hash.zip = function (xs, ys) {
    return Hash(xs, ys).items;
};

// .length is already defined for function prototypes
Hash.size = function (ref) {
    return Hash(ref).size;
};

Hash.compact = function (ref) {
    return Hash(ref).compact.items;
};
;
    }).call(module.exports);
    
    __require.modules["/node_modules/hashish/index.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/traverse/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/traverse";
    var __filename = "/node_modules/traverse/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/traverse");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/traverse");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/traverse/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"traverse","version":"0.4.6","description":"Traverse and transform objects by visiting every node on a recursive walk","author":"James Halliday","license":"MIT/X11","main":"./index","repository":{"type":"git","url":"http://github.com/substack/js-traverse.git"},"devDependencies":{"expresso":"0.7.x"},"scripts":{"test":"expresso"}};
    }).call(module.exports);
    
    __require.modules["/node_modules/traverse/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/traverse/index.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/traverse";
    var __filename = "/node_modules/traverse/index.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/traverse");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/traverse");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/traverse/index.js"]._cached = module.exports;
    
    (function () {
        module.exports = Traverse;
function Traverse (obj) {
    if (!(this instanceof Traverse)) return new Traverse(obj);
    this.value = obj;
}

Traverse.prototype.get = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!Object.hasOwnProperty.call(node, key)) {
            node = undefined;
            break;
        }
        node = node[key];
    }
    return node;
};

Traverse.prototype.set = function (ps, value) {
    var node = this.value;
    for (var i = 0; i < ps.length - 1; i ++) {
        var key = ps[i];
        if (!Object.hasOwnProperty.call(node, key)) node[key] = {};
        node = node[key];
    }
    node[ps[i]] = value;
    return value;
};

Traverse.prototype.map = function (cb) {
    return walk(this.value, cb, true);
};

Traverse.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb, false);
    return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
    var skip = arguments.length === 1;
    var acc = skip ? this.value : init;
    this.forEach(function (x) {
        if (!this.isRoot || !skip) {
            acc = cb.call(this, acc, x);
        }
    });
    return acc;
};

Traverse.prototype.deepEqual = function (obj) {
    if (arguments.length !== 1) {
        throw new Error(
            'deepEqual requires exactly one object to compare against'
        );
    }
    
    var equal = true;
    var node = obj;
    
    this.forEach(function (y) {
        var notEqual = (function () {
            equal = false;
            //this.stop();
            return undefined;
        }).bind(this);
        
        //if (node === undefined || node === null) return notEqual();
        
        if (!this.isRoot) {
        /*
            if (!Object.hasOwnProperty.call(node, this.key)) {
                return notEqual();
            }
        */
            if (typeof node !== 'object') return notEqual();
            node = node[this.key];
        }
        
        var x = node;
        
        this.post(function () {
            node = x;
        });
        
        var toS = function (o) {
            return Object.prototype.toString.call(o);
        };
        
        if (this.circular) {
            if (Traverse(obj).get(this.circular.path) !== x) notEqual();
        }
        else if (typeof x !== typeof y) {
            notEqual();
        }
        else if (x === null || y === null || x === undefined || y === undefined) {
            if (x !== y) notEqual();
        }
        else if (x.__proto__ !== y.__proto__) {
            notEqual();
        }
        else if (x === y) {
            // nop
        }
        else if (typeof x === 'function') {
            if (x instanceof RegExp) {
                // both regexps on account of the __proto__ check
                if (x.toString() != y.toString()) notEqual();
            }
            else if (x !== y) notEqual();
        }
        else if (typeof x === 'object') {
            if (toS(y) === '[object Arguments]'
            || toS(x) === '[object Arguments]') {
                if (toS(x) !== toS(y)) {
                    notEqual();
                }
            }
            else if (x instanceof Date || y instanceof Date) {
                if (!(x instanceof Date) || !(y instanceof Date)
                || x.getTime() !== y.getTime()) {
                    notEqual();
                }
            }
            else {
                var kx = Object.keys(x);
                var ky = Object.keys(y);
                if (kx.length !== ky.length) return notEqual();
                for (var i = 0; i < kx.length; i++) {
                    var k = kx[i];
                    if (!Object.hasOwnProperty.call(y, k)) {
                        notEqual();
                    }
                }
            }
        }
    });
    
    return equal;
};

Traverse.prototype.paths = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.path); 
    });
    return acc;
};

Traverse.prototype.nodes = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.node);
    });
    return acc;
};

Traverse.prototype.clone = function () {
    var parents = [], nodes = [];
    
    return (function clone (src) {
        for (var i = 0; i < parents.length; i++) {
            if (parents[i] === src) {
                return nodes[i];
            }
        }
        
        if (typeof src === 'object' && src !== null) {
            var dst = copy(src);
            
            parents.push(src);
            nodes.push(dst);
            
            Object.keys(src).forEach(function (key) {
                dst[key] = clone(src[key]);
            });
            
            parents.pop();
            nodes.pop();
            return dst;
        }
        else {
            return src;
        }
    })(this.value);
};

function walk (root, cb, immutable) {
    var path = [];
    var parents = [];
    var alive = true;
    
    return (function walker (node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};
        
        var keepGoing = true;
        
        var state = {
            node : node,
            node_ : node_,
            path : [].concat(path),
            parent : parents[parents.length - 1],
            parents : parents,
            key : path.slice(-1)[0],
            isRoot : path.length === 0,
            level : path.length,
            circular : null,
            update : function (x, stopHere) {
                if (!state.isRoot) {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
                if (stopHere) keepGoing = false;
            },
            'delete' : function () {
                delete state.parent.node[state.key];
            },
            remove : function () {
                if (Array.isArray(state.parent.node)) {
                    state.parent.node.splice(state.key, 1);
                }
                else {
                    delete state.parent.node[state.key];
                }
            },
            keys : null,
            before : function (f) { modifiers.before = f },
            after : function (f) { modifiers.after = f },
            pre : function (f) { modifiers.pre = f },
            post : function (f) { modifiers.post = f },
            stop : function () { alive = false },
            block : function () { keepGoing = false }
        };
        
        if (!alive) return state;
        
        if (typeof node === 'object' && node !== null) {
            state.keys = Object.keys(node);
            
            state.isLeaf = state.keys.length == 0;
            
            for (var i = 0; i < parents.length; i++) {
                if (parents[i].node_ === node_) {
                    state.circular = parents[i];
                    break;
                }
            }
        }
        else {
            state.isLeaf = true;
        }
        
        state.notLeaf = !state.isLeaf;
        state.notRoot = !state.isRoot;
        
        // use return values to update if defined
        var ret = cb.call(state, state.node);
        if (ret !== undefined && state.update) state.update(ret);
        
        if (modifiers.before) modifiers.before.call(state, state.node);
        
        if (!keepGoing) return state;
        
        if (typeof state.node == 'object'
        && state.node !== null && !state.circular) {
            parents.push(state);
            
            state.keys.forEach(function (key, i) {
                path.push(key);
                
                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                
                var child = walker(state.node[key]);
                if (immutable && Object.hasOwnProperty.call(state.node, key)) {
                    state.node[key] = child.node;
                }
                
                child.isLast = i == state.keys.length - 1;
                child.isFirst = i == 0;
                
                if (modifiers.post) modifiers.post.call(state, child);
                
                path.pop();
            });
            parents.pop();
        }
        
        if (modifiers.after) modifiers.after.call(state, state.node);
        
        return state;
    })(root).node;
}

Object.keys(Traverse.prototype).forEach(function (key) {
    Traverse[key] = function (obj) {
        var args = [].slice.call(arguments, 1);
        var t = Traverse(obj);
        return t[key].apply(t, args);
    };
});

function copy (src) {
    if (typeof src === 'object' && src !== null) {
        var dst;
        
        if (Array.isArray(src)) {
            dst = [];
        }
        else if (src instanceof Date) {
            dst = new Date(src);
        }
        else if (src instanceof Boolean) {
            dst = new Boolean(src);
        }
        else if (src instanceof Number) {
            dst = new Number(src);
        }
        else if (src instanceof String) {
            dst = new String(src);
        }
        else {
            dst = Object.create(Object.getPrototypeOf(src));
        }
        
        Object.keys(src).forEach(function (key) {
            dst[key] = src[key];
        });
        return dst;
    }
    else return src;
}
;
    }).call(module.exports);
    
    __require.modules["/node_modules/traverse/index.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/seq/node_modules/chainsaw/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/seq/node_modules/chainsaw";
    var __filename = "/node_modules/seq/node_modules/chainsaw/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/seq/node_modules/chainsaw");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/seq/node_modules/chainsaw");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/seq/node_modules/chainsaw/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"chainsaw","version":"0.0.9","description":"Build chainable fluent interfaces the easy way... with a freakin' chainsaw!","main":"./index.js","repository":{"type":"git","url":"http://github.com/substack/node-chainsaw.git"},"dependencies":{"traverse":">=0.3.0 <0.4"},"keywords":["chain","fluent","interface","monad","monadic"],"author":"James Halliday <mail@substack.net> (http://substack.net)","license":"MIT/X11","engine":{"node":">=0.4.0"}};
    }).call(module.exports);
    
    __require.modules["/node_modules/seq/node_modules/chainsaw/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/seq/node_modules/chainsaw/index.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/seq/node_modules/chainsaw";
    var __filename = "/node_modules/seq/node_modules/chainsaw/index.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/seq/node_modules/chainsaw");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/seq/node_modules/chainsaw");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/seq/node_modules/chainsaw/index.js"]._cached = module.exports;
    
    (function () {
        var Traverse = require('traverse');
var EventEmitter = require('events').EventEmitter;

module.exports = Chainsaw;
function Chainsaw (builder) {
    var saw = Chainsaw.saw(builder, {});
    var r = builder.call(saw.handlers, saw);
    if (r !== undefined) saw.handlers = r;
    return saw.chain();
};

Chainsaw.saw = function (builder, handlers) {
    var saw = new EventEmitter;
    saw.handlers = handlers;
    saw.actions = [];
    saw.step = 0;
    
    saw.chain = function () {
        var ch = Traverse(saw.handlers).map(function (node) {
            if (this.isRoot) return node;
            var ps = this.path;
            
            if (typeof node === 'function') {
                this.update(function () {
                    saw.actions.push({
                        path : ps,
                        args : [].slice.call(arguments)
                    });
                    return ch;
                });
            }
        });
        
        process.nextTick(function () {
            saw.emit('begin');
            saw.next();
        });
        
        return ch;
    };
    
    saw.next = function () {
        var action = saw.actions[saw.step];
        saw.step ++;
        
        if (!action) {
            saw.emit('end');
        }
        else if (!action.trap) {
            var node = saw.handlers;
            action.path.forEach(function (key) { node = node[key] });
            node.apply(saw.handlers, action.args);
        }
    };
    
    saw.nest = function (cb) {
        var args = [].slice.call(arguments, 1);
        var autonext = true;
        
        if (typeof cb === 'boolean') {
            var autonext = cb;
            cb = args.shift();
        }
        
        var s = Chainsaw.saw(builder, {});
        var r = builder.call(s.handlers, s);
        
        if (r !== undefined) s.handlers = r;
        cb.apply(s.chain(), args);
        if (autonext !== false) s.on('end', saw.next);
    };
    
    saw.trap = function (name, cb) {
        var ps = Array.isArray(name) ? name : [name];
        saw.actions.push({
            path : ps,
            step : saw.step,
            cb : cb,
            trap : true
        });
    };
    
    saw.down = function (name) {
        var ps = (Array.isArray(name) ? name : [name]).join('/');
        var i = saw.actions.slice(saw.step).map(function (x) {
            if (x.trap && x.step <= saw.step) return false;
            return x.path.join('/') == ps;
        }).indexOf(true);
        
        if (i >= 0) saw.step += i;
        else saw.step = saw.actions.length;
        
        var act = saw.actions[saw.step - 1];
        if (act && act.trap) {
            // It's a trap!
            saw.step = act.step;
            act.cb();
        }
        else saw.next();
    };
    
    saw.jump = function (step) {
        saw.step = step;
        saw.next();
    };
    
    return saw;
}; 
;
    }).call(module.exports);
    
    __require.modules["/node_modules/seq/node_modules/chainsaw/index.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/shimify/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/shimify";
    var __filename = "/node_modules/shimify/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/shimify");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/shimify");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/shimify/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"shimify","version":"0.0.0","description":"browserify middleware to prepend es5-shim","main":"index.js","directories":{"lib":".","example":"example","test":"test"},"dependencies":{"es5-shim":"1.2.x"},"devDependencies":{"expresso":"0.7.x","browserify":">=1.2.9 <1.3","es5-shim":"1.2.x"},"repository":{"type":"git","url":"http://github.com/substack/node-shimify.git"},"keywords":["es5","shim","middleware","browserify","browser"],"author":{"name":"James Halliday","email":"mail@substack.net","url":"http://substack.net"},"license":"MIT/X11","engine":{"node":">=0.4"}};
    }).call(module.exports);
    
    __require.modules["/node_modules/shimify/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/shimify/index.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/shimify";
    var __filename = "/node_modules/shimify/index.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/shimify");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/shimify");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/shimify/index.js"]._cached = module.exports;
    
    (function () {
        var fs = require('fs');
var shimPath = require.resolve('es5-shim');
var shimCode = fs.readFileSync(shimPath, 'utf8');

module.exports = function (bundle) {
    bundle.prepend(shimCode);
};
;
    }).call(module.exports);
    
    __require.modules["/node_modules/shimify/index.js"]._cached = module.exports;
    return module.exports;
};

require.modules["fs"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "fs";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["fs"]._cached = module.exports;
    
    (function () {
        // nothing to see here... no file methods for the browser
;
    }).call(module.exports);
    
    __require.modules["fs"]._cached = module.exports;
    return module.exports;
};
