/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	var fs = __webpack_require__(2);
	var chalk = __webpack_require__(3);
	var style = __webpack_require__(15);
	var path = __webpack_require__(16);
	var express = __webpack_require__(17);
	var app = express();
	var http = __webpack_require__(30).Server(app);
	var io = __webpack_require__(94)(http);

	process.env['DEBUG'] = '*';

	var USER_TIMEOUT = 60 * 1000;

	var NAMES = ['Henry', 'Luna', 'Oliver', 'Alison', 'Desmond', 'Ava', 'Lincoln', 'Clémentine', 'Lucas', 'Ella', 'Akira', 'Amaterasu', 'Atsuko', 'Arisu', 'Ayaka', 'Jung', 'Iseul', 'Haneul'];
	var COLORS = ['#aaa', '#e44', '#4e4', '#44e', '#dcd7d2', '#2b2b2b', '#2a5fe3', '#d94835', '#30a28f', '#7a7a7a', '#049451', '#24364b', '#dadbda', '#84454a', '#c38f3d', '#758b9d', '#ad8989', '#2ea9c3'];

	app.get('/', function (req, res) {
	  res.sendFile(path.resolve('client/index.html'));
	});
	app.use('/static', express.static(path.resolve('client')));
	app.use('/js', express.static(path.resolve('build/client')));

	var state = null;

	function loadState(cb) {
	  fs.readFile('state.json', function (err, data) {
	    if (err) {
	      console.error('loadState: ' + err);
	      return cb(err, {
	        clients: [],
	        clientsOld: []
	      });
	    } else {
	      return cb(err, JSON.parse(data));
	    }
	  });
	}

	function saveState(state) {
	  fs.writeFile('state.json', JSON.stringify(state, null, 2), function (err, data) {
	    if (err) {
	      console.error('saveState: ' + err);
	    }
	  });
	  return state;
	}

	io.on('connection', function (socket) {

	  state = onClientConnection(state, socket);

	  var client = state.clients.find(function (c) {
	    return c.sid == socket.client.id;
	  });

	  console.log('> a client connected: %s %s', client.name, client.cid, client.sid);

	  socket.emit('welcome', client.cid);

	  socket.on('chat message', function (msg) {
	    state = markClientAlive(state, client);

	    if (msg.data) {
	      console.log('> ' + client.name + ' #' + client.cid + ': ' + JSON.stringify(msg.data, null, 1));
	      state = newMessage(state, msg);
	      socket.emit('chat message', msg);
	      socket.broadcast.emit('chat message', msg);
	    }
	  });

	  socket.on('disconnect', function () {
	    console.log('> a client disconnected: ' + client.name + '#' + client.cid);
	    state = onClientDisconnection(state, socket.client.sid);

	    broadcastState(state);
	  });

	  broadcastState(state);
	});

	function onClientConnection(state, socket) {

	  var client = state.clients.find(function (c) {
	    return c.sid === socket.client.id;
	  });

	  // todo: check if already in state.oldClients

	  if (!client) {
	    client = {
	      sid: socket.client.id, // session id
	      cid: socket.client.id, // client id
	      name: NAMES[~ ~((NAMES.length - 1) * Math.random())],
	      color: COLORS[~ ~((COLORS.length - 1) * Math.random())],
	      ts: Date.now(),
	      te: Date.now() + USER_TIMEOUT
	    };
	  }

	  return _extends({}, state, {
	    clients: [client].concat(_toConsumableArray(state.clients))
	  });
	}

	function onClientDisconnection(state, sid) {
	  return _extends({}, state, {
	    clients: state.clients.filter(function (c) {
	      return c.sid !== sid;
	    })
	  });
	}

	function broadcastState(state) {
	  console.log('Broadcast state.clients: [' + state.clients.reduce(function (s, c) {
	    return s + (style.bgColor.ansi.hex(c.color) + '_' + style.bgColor.close + c.name + '(' + ((c.te - Date.now()) / 1000).toFixed(2) + 's), ');
	  }, '').replace(/, $/, '') + ']');
	  io.of('').emit('state.clients', state.clients);

	  return state;
	}

	function markClientAlive(state, client) {
	  return _extends({}, state, {
	    clients: state.clients.map(function (c) {
	      return c.cid !== client.cid ? c : _extends({}, c, {
	        ts: Date.now(),
	        te: Date.now() + USER_TIMEOUT
	      });
	    })
	  });
	}

	function cleanState(state) {
	  var now = Date.now();

	  var clients = [];
	  var goneClients = [];

	  state.clients.forEach(function (c) {
	    if (now - c.ts > USER_TIMEOUT) {
	      goneClients.push(c);
	      console.log('Client ' + c.name + ' is no longer active.');
	    } else {
	      clients.push(c);
	    }
	  });

	  // merge
	  var clientsOld = goneClients.concat(state.clientsOld.filter(function (old) {
	    now - old.ts > USER_TIMEOUT * 2 && goneClients.findIndex(function (gone) {
	      return old.cid === gone.cid;
	    }) < 0;
	  }));

	  var newState = _extends({}, state, {
	    clients: clients,
	    clientsOld: clientsOld
	  });

	  // if there has been changes
	  if (goneClients.length > 0) newState = broadcastState(newState);

	  return newState;
	}

	function newMessage(state, msg) {
	  return _extends({}, state, {
	    messages: [].concat(_toConsumableArray(state.messages), [msg])
	  });
	}

	// Start server
	http.listen(3000, function () {

	  loadState(function (err, data) {

	    state = data;

	    console.log('listening on *:3000');

	    setInterval(function () {
	      state = cleanState(state);
	      state = saveState(state);
	    }, 10000);
	  });
	});

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("fs");

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var escapeStringRegexp = __webpack_require__(4);
	var ansiStyles = __webpack_require__(5);
	var stripAnsi = __webpack_require__(11);
	var hasAnsi = __webpack_require__(13);
	var supportsColor = __webpack_require__(14);
	var defineProps = Object.defineProperties;
	var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

	function Chalk(options) {
		// detect mode if not set manually
		this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
	}

	// use bright blue on Windows as the normal blue color is illegible
	if (isSimpleWindowsTerm) {
		ansiStyles.blue.open = '\u001b[94m';
	}

	var styles = (function () {
		var ret = {};

		Object.keys(ansiStyles).forEach(function (key) {
			ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

			ret[key] = {
				get: function () {
					return build.call(this, this._styles.concat(key));
				}
			};
		});

		return ret;
	})();

	var proto = defineProps(function chalk() {}, styles);

	function build(_styles) {
		var builder = function () {
			return applyStyle.apply(builder, arguments);
		};

		builder._styles = _styles;
		builder.enabled = this.enabled;
		// __proto__ is used because we must return a function, but there is
		// no way to create a function with a different prototype.
		/* eslint-disable no-proto */
		builder.__proto__ = proto;

		return builder;
	}

	function applyStyle() {
		// support varags, but simply cast to string in case there's only one arg
		var args = arguments;
		var argsLen = args.length;
		var str = argsLen !== 0 && String(arguments[0]);

		if (argsLen > 1) {
			// don't slice `arguments`, it prevents v8 optimizations
			for (var a = 1; a < argsLen; a++) {
				str += ' ' + args[a];
			}
		}

		if (!this.enabled || !str) {
			return str;
		}

		var nestedStyles = this._styles;
		var i = nestedStyles.length;

		// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
		// see https://github.com/chalk/chalk/issues/58
		// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
		var originalDim = ansiStyles.dim.open;
		if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
			ansiStyles.dim.open = '';
		}

		while (i--) {
			var code = ansiStyles[nestedStyles[i]];

			// Replace any instances already present with a re-opening code
			// otherwise only the part of the string until said closing code
			// will be colored, and the rest will simply be 'plain'.
			str = code.open + str.replace(code.closeRe, code.open) + code.close;
		}

		// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
		ansiStyles.dim.open = originalDim;

		return str;
	}

	function init() {
		var ret = {};

		Object.keys(styles).forEach(function (name) {
			ret[name] = {
				get: function () {
					return build.call(this, [name]);
				}
			};
		});

		return ret;
	}

	defineProps(Chalk.prototype, init());

	module.exports = new Chalk();
	module.exports.styles = ansiStyles;
	module.exports.hasColor = hasAnsi;
	module.exports.stripColor = stripAnsi;
	module.exports.supportsColor = supportsColor;


/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

	module.exports = function (str) {
		if (typeof str !== 'string') {
			throw new TypeError('Expected a string');
		}

		return str.replace(matchOperatorsRe, '\\$&');
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	var colorConvert = __webpack_require__(7);

	function wrapAnsi16(fn, offset) {
		return function () {
			var code = fn.apply(colorConvert, arguments);
			return '\u001b[' + (code + offset) + 'm';
		};
	}

	function wrapAnsi256(fn, offset) {
		return function () {
			var code = fn.apply(colorConvert, arguments);
			return '\u001b[' + (38 + offset) + ';5;' + code + 'm';
		};
	}

	function wrapAnsi16m(fn, offset) {
		return function () {
			var rgb = fn.apply(colorConvert, arguments);
			return '\u001b[' + (38 + offset) + ';2;' +
				rgb[0] + ';' + rgb[1] + ';' + rgb[2] + 'm';
		};
	}

	function assembleStyles() {
		var styles = {
			modifier: {
				reset: [0, 0],
				// 21 isn't widely supported and 22 does the same thing
				bold: [1, 22],
				dim: [2, 22],
				italic: [3, 23],
				underline: [4, 24],
				inverse: [7, 27],
				hidden: [8, 28],
				strikethrough: [9, 29]
			},
			color: {
				black: [30, 39],
				red: [31, 39],
				green: [32, 39],
				yellow: [33, 39],
				blue: [34, 39],
				magenta: [35, 39],
				cyan: [36, 39],
				white: [37, 39],
				gray: [90, 39]
			},
			bgColor: {
				bgBlack: [40, 49],
				bgRed: [41, 49],
				bgGreen: [42, 49],
				bgYellow: [43, 49],
				bgBlue: [44, 49],
				bgMagenta: [45, 49],
				bgCyan: [46, 49],
				bgWhite: [47, 49]
			}
		};

		// fix humans
		styles.color.grey = styles.color.gray;

		Object.keys(styles).forEach(function (groupName) {
			var group = styles[groupName];

			Object.keys(group).forEach(function (styleName) {
				var style = group[styleName];

				styles[styleName] = group[styleName] = {
					open: '\u001b[' + style[0] + 'm',
					close: '\u001b[' + style[1] + 'm'
				};
			});

			Object.defineProperty(styles, groupName, {
				value: group,
				enumerable: false
			});
		});

		function rgb2rgb(r, g, b) {
			return [r, g, b];
		}

		styles.color.close = '\u001b[39m';
		styles.bgColor.close = '\u001b[49m';

		styles.color.ansi = {};
		styles.color.ansi256 = {};
		styles.color.ansi16m = {
			rgb: wrapAnsi16m(rgb2rgb, 0)
		};

		styles.bgColor.ansi = {};
		styles.bgColor.ansi256 = {};
		styles.bgColor.ansi16m = {
			rgb: wrapAnsi16m(rgb2rgb, 10)
		};

		for (var key in colorConvert) {
			if (!colorConvert.hasOwnProperty(key) || typeof colorConvert[key] !== 'object') {
				continue;
			}

			var suite = colorConvert[key];

			if ('ansi16' in suite) {
				styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
				styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
			}

			if ('ansi256' in suite) {
				styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
				styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
			}

			if ('rgb' in suite) {
				styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
				styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
			}
		}

		return styles;
	}

	Object.defineProperty(module, 'exports', {
		enumerable: true,
		get: assembleStyles
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)(module)))

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var conversions = __webpack_require__(8);
	var route = __webpack_require__(10);

	var convert = {};

	var models = Object.keys(conversions);

	function wrapRaw(fn) {
		var wrappedFn = function (args) {
			if (args === undefined || args === null) {
				return args;
			}

			if (arguments.length > 1) {
				args = Array.prototype.slice.call(arguments);
			}

			return fn(args);
		};

		// preserve .conversion property if there is one
		if ('conversion' in fn) {
			wrappedFn.conversion = fn.conversion;
		}

		return wrappedFn;
	}

	function wrapRounded(fn) {
		var wrappedFn = function (args) {
			if (args === undefined || args === null) {
				return args;
			}

			if (arguments.length > 1) {
				args = Array.prototype.slice.call(arguments);
			}

			var result = fn(args);

			// we're assuming the result is an array here.
			// see notice in conversions.js; don't use box types
			// in conversion functions.
			if (typeof result === 'object') {
				for (var len = result.length, i = 0; i < len; i++) {
					result[i] = Math.round(result[i]);
				}
			}

			return result;
		};

		// preserve .conversion property if there is one
		if ('conversion' in fn) {
			wrappedFn.conversion = fn.conversion;
		}

		return wrappedFn;
	}

	models.forEach(function (fromModel) {
		convert[fromModel] = {};

		var routes = route(fromModel);
		var routeModels = Object.keys(routes);

		routeModels.forEach(function (toModel) {
			var fn = routes[toModel];

			convert[fromModel][toModel] = wrapRounded(fn);
			convert[fromModel][toModel].raw = wrapRaw(fn);
		});
	});

	module.exports = convert;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/* MIT license */
	var cssKeywords = __webpack_require__(9);

	// NOTE: conversions should only return primitive values (i.e. arrays, or
	//       values that give correct `typeof` results).
	//       do not use box values types (i.e. Number(), String(), etc.)

	var reverseKeywords = {};
	for (var key in cssKeywords) {
		if (cssKeywords.hasOwnProperty(key)) {
			reverseKeywords[cssKeywords[key].join()] = key;
		}
	}

	var convert = module.exports = {
		rgb: {},
		hsl: {},
		hsv: {},
		hwb: {},
		cmyk: {},
		xyz: {},
		lab: {},
		lch: {},
		hex: {},
		keyword: {},
		ansi16: {},
		ansi256: {}
	};

	convert.rgb.hsl = function (rgb) {
		var r = rgb[0] / 255;
		var g = rgb[1] / 255;
		var b = rgb[2] / 255;
		var min = Math.min(r, g, b);
		var max = Math.max(r, g, b);
		var delta = max - min;
		var h;
		var s;
		var l;

		if (max === min) {
			h = 0;
		} else if (r === max) {
			h = (g - b) / delta;
		} else if (g === max) {
			h = 2 + (b - r) / delta;
		} else if (b === max) {
			h = 4 + (r - g) / delta;
		}

		h = Math.min(h * 60, 360);

		if (h < 0) {
			h += 360;
		}

		l = (min + max) / 2;

		if (max === min) {
			s = 0;
		} else if (l <= 0.5) {
			s = delta / (max + min);
		} else {
			s = delta / (2 - max - min);
		}

		return [h, s * 100, l * 100];
	};

	convert.rgb.hsv = function (rgb) {
		var r = rgb[0];
		var g = rgb[1];
		var b = rgb[2];
		var min = Math.min(r, g, b);
		var max = Math.max(r, g, b);
		var delta = max - min;
		var h;
		var s;
		var v;

		if (max === 0) {
			s = 0;
		} else {
			s = (delta / max * 1000) / 10;
		}

		if (max === min) {
			h = 0;
		} else if (r === max) {
			h = (g - b) / delta;
		} else if (g === max) {
			h = 2 + (b - r) / delta;
		} else if (b === max) {
			h = 4 + (r - g) / delta;
		}

		h = Math.min(h * 60, 360);

		if (h < 0) {
			h += 360;
		}

		v = ((max / 255) * 1000) / 10;

		return [h, s, v];
	};

	convert.rgb.hwb = function (rgb) {
		var r = rgb[0];
		var g = rgb[1];
		var b = rgb[2];
		var h = convert.rgb.hsl(rgb)[0];
		var w = 1 / 255 * Math.min(r, Math.min(g, b));

		b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

		return [h, w * 100, b * 100];
	};

	convert.rgb.cmyk = function (rgb) {
		var r = rgb[0] / 255;
		var g = rgb[1] / 255;
		var b = rgb[2] / 255;
		var c;
		var m;
		var y;
		var k;

		k = Math.min(1 - r, 1 - g, 1 - b);
		c = (1 - r - k) / (1 - k) || 0;
		m = (1 - g - k) / (1 - k) || 0;
		y = (1 - b - k) / (1 - k) || 0;

		return [c * 100, m * 100, y * 100, k * 100];
	};

	convert.rgb.keyword = function (rgb) {
		return reverseKeywords[rgb.join()];
	};

	convert.keyword.rgb = function (keyword) {
		return cssKeywords[keyword];
	};

	convert.rgb.xyz = function (rgb) {
		var r = rgb[0] / 255;
		var g = rgb[1] / 255;
		var b = rgb[2] / 255;

		// assume sRGB
		r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
		g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
		b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

		var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
		var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
		var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

		return [x * 100, y * 100, z * 100];
	};

	convert.rgb.lab = function (rgb) {
		var xyz = convert.rgb.xyz(rgb);
		var x = xyz[0];
		var y = xyz[1];
		var z = xyz[2];
		var l;
		var a;
		var b;

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

		l = (116 * y) - 16;
		a = 500 * (x - y);
		b = 200 * (y - z);

		return [l, a, b];
	};

	convert.hsl.rgb = function (hsl) {
		var h = hsl[0] / 360;
		var s = hsl[1] / 100;
		var l = hsl[2] / 100;
		var t1;
		var t2;
		var t3;
		var rgb;
		var val;

		if (s === 0) {
			val = l * 255;
			return [val, val, val];
		}

		if (l < 0.5) {
			t2 = l * (1 + s);
		} else {
			t2 = l + s - l * s;
		}

		t1 = 2 * l - t2;

		rgb = [0, 0, 0];
		for (var i = 0; i < 3; i++) {
			t3 = h + 1 / 3 * -(i - 1);
			if (t3 < 0) {
				t3++;
			}
			if (t3 > 1) {
				t3--;
			}

			if (6 * t3 < 1) {
				val = t1 + (t2 - t1) * 6 * t3;
			} else if (2 * t3 < 1) {
				val = t2;
			} else if (3 * t3 < 2) {
				val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
			} else {
				val = t1;
			}

			rgb[i] = val * 255;
		}

		return rgb;
	};

	convert.hsl.hsv = function (hsl) {
		var h = hsl[0];
		var s = hsl[1] / 100;
		var l = hsl[2] / 100;
		var sv;
		var v;

		if (l === 0) {
			// no need to do calc on black
			// also avoids divide by 0 error
			return [0, 0, 0];
		}

		l *= 2;
		s *= (l <= 1) ? l : 2 - l;
		v = (l + s) / 2;
		sv = (2 * s) / (l + s);

		return [h, sv * 100, v * 100];
	};

	convert.hsv.rgb = function (hsv) {
		var h = hsv[0] / 60;
		var s = hsv[1] / 100;
		var v = hsv[2] / 100;
		var hi = Math.floor(h) % 6;

		var f = h - Math.floor(h);
		var p = 255 * v * (1 - s);
		var q = 255 * v * (1 - (s * f));
		var t = 255 * v * (1 - (s * (1 - f)));
		v *= 255;

		switch (hi) {
			case 0:
				return [v, t, p];
			case 1:
				return [q, v, p];
			case 2:
				return [p, v, t];
			case 3:
				return [p, q, v];
			case 4:
				return [t, p, v];
			case 5:
				return [v, p, q];
		}
	};

	convert.hsv.hsl = function (hsv) {
		var h = hsv[0];
		var s = hsv[1] / 100;
		var v = hsv[2] / 100;
		var sl;
		var l;

		l = (2 - s) * v;
		sl = s * v;
		sl /= (l <= 1) ? l : 2 - l;
		sl = sl || 0;
		l /= 2;

		return [h, sl * 100, l * 100];
	};

	// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
	convert.hwb.rgb = function (hwb) {
		var h = hwb[0] / 360;
		var wh = hwb[1] / 100;
		var bl = hwb[2] / 100;
		var ratio = wh + bl;
		var i;
		var v;
		var f;
		var n;

		// wh + bl cant be > 1
		if (ratio > 1) {
			wh /= ratio;
			bl /= ratio;
		}

		i = Math.floor(6 * h);
		v = 1 - bl;
		f = 6 * h - i;

		if ((i & 0x01) !== 0) {
			f = 1 - f;
		}

		n = wh + f * (v - wh); // linear interpolation

		var r;
		var g;
		var b;
		switch (i) {
			default:
			case 6:
			case 0: r = v; g = n; b = wh; break;
			case 1: r = n; g = v; b = wh; break;
			case 2: r = wh; g = v; b = n; break;
			case 3: r = wh; g = n; b = v; break;
			case 4: r = n; g = wh; b = v; break;
			case 5: r = v; g = wh; b = n; break;
		}

		return [r * 255, g * 255, b * 255];
	};

	convert.cmyk.rgb = function (cmyk) {
		var c = cmyk[0] / 100;
		var m = cmyk[1] / 100;
		var y = cmyk[2] / 100;
		var k = cmyk[3] / 100;
		var r;
		var g;
		var b;

		r = 1 - Math.min(1, c * (1 - k) + k);
		g = 1 - Math.min(1, m * (1 - k) + k);
		b = 1 - Math.min(1, y * (1 - k) + k);

		return [r * 255, g * 255, b * 255];
	};

	convert.xyz.rgb = function (xyz) {
		var x = xyz[0] / 100;
		var y = xyz[1] / 100;
		var z = xyz[2] / 100;
		var r;
		var g;
		var b;

		r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
		g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
		b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

		// assume sRGB
		r = r > 0.0031308
			? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
			: r *= 12.92;

		g = g > 0.0031308
			? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
			: g *= 12.92;

		b = b > 0.0031308
			? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
			: b *= 12.92;

		r = Math.min(Math.max(0, r), 1);
		g = Math.min(Math.max(0, g), 1);
		b = Math.min(Math.max(0, b), 1);

		return [r * 255, g * 255, b * 255];
	};

	convert.xyz.lab = function (xyz) {
		var x = xyz[0];
		var y = xyz[1];
		var z = xyz[2];
		var l;
		var a;
		var b;

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

		l = (116 * y) - 16;
		a = 500 * (x - y);
		b = 200 * (y - z);

		return [l, a, b];
	};

	convert.lab.xyz = function (lab) {
		var l = lab[0];
		var a = lab[1];
		var b = lab[2];
		var x;
		var y;
		var z;
		var y2;

		if (l <= 8) {
			y = (l * 100) / 903.3;
			y2 = (7.787 * (y / 100)) + (16 / 116);
		} else {
			y = 100 * Math.pow((l + 16) / 116, 3);
			y2 = Math.pow(y / 100, 1 / 3);
		}

		x = x / 95.047 <= 0.008856
			? x = (95.047 * ((a / 500) + y2 - (16 / 116))) / 7.787
			: 95.047 * Math.pow((a / 500) + y2, 3);
		z = z / 108.883 <= 0.008859
			? z = (108.883 * (y2 - (b / 200) - (16 / 116))) / 7.787
			: 108.883 * Math.pow(y2 - (b / 200), 3);

		return [x, y, z];
	};

	convert.lab.lch = function (lab) {
		var l = lab[0];
		var a = lab[1];
		var b = lab[2];
		var hr;
		var h;
		var c;

		hr = Math.atan2(b, a);
		h = hr * 360 / 2 / Math.PI;

		if (h < 0) {
			h += 360;
		}

		c = Math.sqrt(a * a + b * b);

		return [l, c, h];
	};

	convert.lch.lab = function (lch) {
		var l = lch[0];
		var c = lch[1];
		var h = lch[2];
		var a;
		var b;
		var hr;

		hr = h / 360 * 2 * Math.PI;
		a = c * Math.cos(hr);
		b = c * Math.sin(hr);

		return [l, a, b];
	};

	convert.rgb.ansi16 = function (args) {
		var r = args[0];
		var g = args[1];
		var b = args[2];
		var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

		value = Math.round(value / 50);

		if (value === 0) {
			return 30;
		}

		var ansi = 30
			+ ((Math.round(b / 255) << 2)
			| (Math.round(g / 255) << 1)
			| Math.round(r / 255));

		if (value === 2) {
			ansi += 60;
		}

		return ansi;
	};

	convert.hsv.ansi16 = function (args) {
		// optimization here; we already know the value and don't need to get
		// it converted for us.
		return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
	};

	convert.rgb.ansi256 = function (args) {
		var r = args[0];
		var g = args[1];
		var b = args[2];

		// we use the extended greyscale palette here, with the exception of
		// black and white. normal palette only has 4 greyscale shades.
		if (r === g && g === b) {
			if (r < 8) {
				return 16;
			}

			if (r > 248) {
				return 231;
			}

			return Math.round(((r - 8) / 247) * 24) + 232;
		}

		var ansi = 16
			+ (36 * Math.round(r / 255 * 5))
			+ (6 * Math.round(g / 255 * 5))
			+ Math.round(b / 255 * 5);

		return ansi;
	};

	convert.ansi16.rgb = function (args) {
		var color = args % 10;

		// handle greyscale
		if (color === 0 || color === 7) {
			if (args > 50) {
				color += 3.5;
			}

			color = color / 10.5 * 255;

			return [color, color, color];
		}

		var mult = (~~(args > 50) + 1) * 0.5;
		var r = ((color & 1) * mult) * 255;
		var g = (((color >> 1) & 1) * mult) * 255;
		var b = (((color >> 2) & 1) * mult) * 255;

		return [r, g, b];
	};

	convert.ansi256.rgb = function (args) {
		// handle greyscale
		if (args >= 232) {
			var c = (args - 232) * 10 + 8;
			return [c, c, c];
		}

		args -= 16;

		var rem;
		var r = Math.floor(args / 36) / 5 * 255;
		var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
		var b = (rem % 6) / 5 * 255;

		return [r, g, b];
	};

	convert.rgb.hex = function (args) {
		var integer = ((Math.round(args[0]) & 0xFF) << 16)
			+ ((Math.round(args[1]) & 0xFF) << 8)
			+ (Math.round(args[2]) & 0xFF);

		var string = integer.toString(16).toUpperCase();
		return '000000'.substring(string.length) + string;
	};

	convert.hex.rgb = function (args) {
		var match = args.toString(16).match(/[a-f0-9]{6}/i);
		if (!match) {
			return [0, 0, 0];
		}

		var integer = parseInt(match[0], 16);
		var r = (integer >> 16) & 0xFF;
		var g = (integer >> 8) & 0xFF;
		var b = integer & 0xFF;

		return [r, g, b];
	};


/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = {
		aliceblue: [240, 248, 255],
		antiquewhite: [250, 235, 215],
		aqua: [0, 255, 255],
		aquamarine: [127, 255, 212],
		azure: [240, 255, 255],
		beige: [245, 245, 220],
		bisque: [255, 228, 196],
		black: [0, 0, 0],
		blanchedalmond: [255, 235, 205],
		blue: [0, 0, 255],
		blueviolet: [138, 43, 226],
		brown: [165, 42, 42],
		burlywood: [222, 184, 135],
		cadetblue: [95, 158, 160],
		chartreuse: [127, 255, 0],
		chocolate: [210, 105, 30],
		coral: [255, 127, 80],
		cornflowerblue: [100, 149, 237],
		cornsilk: [255, 248, 220],
		crimson: [220, 20, 60],
		cyan: [0, 255, 255],
		darkblue: [0, 0, 139],
		darkcyan: [0, 139, 139],
		darkgoldenrod: [184, 134, 11],
		darkgray: [169, 169, 169],
		darkgreen: [0, 100, 0],
		darkgrey: [169, 169, 169],
		darkkhaki: [189, 183, 107],
		darkmagenta: [139, 0, 139],
		darkolivegreen: [85, 107, 47],
		darkorange: [255, 140, 0],
		darkorchid: [153, 50, 204],
		darkred: [139, 0, 0],
		darksalmon: [233, 150, 122],
		darkseagreen: [143, 188, 143],
		darkslateblue: [72, 61, 139],
		darkslategray: [47, 79, 79],
		darkslategrey: [47, 79, 79],
		darkturquoise: [0, 206, 209],
		darkviolet: [148, 0, 211],
		deeppink: [255, 20, 147],
		deepskyblue: [0, 191, 255],
		dimgray: [105, 105, 105],
		dimgrey: [105, 105, 105],
		dodgerblue: [30, 144, 255],
		firebrick: [178, 34, 34],
		floralwhite: [255, 250, 240],
		forestgreen: [34, 139, 34],
		fuchsia: [255, 0, 255],
		gainsboro: [220, 220, 220],
		ghostwhite: [248, 248, 255],
		gold: [255, 215, 0],
		goldenrod: [218, 165, 32],
		gray: [128, 128, 128],
		green: [0, 128, 0],
		greenyellow: [173, 255, 47],
		grey: [128, 128, 128],
		honeydew: [240, 255, 240],
		hotpink: [255, 105, 180],
		indianred: [205, 92, 92],
		indigo: [75, 0, 130],
		ivory: [255, 255, 240],
		khaki: [240, 230, 140],
		lavender: [230, 230, 250],
		lavenderblush: [255, 240, 245],
		lawngreen: [124, 252, 0],
		lemonchiffon: [255, 250, 205],
		lightblue: [173, 216, 230],
		lightcoral: [240, 128, 128],
		lightcyan: [224, 255, 255],
		lightgoldenrodyellow: [250, 250, 210],
		lightgray: [211, 211, 211],
		lightgreen: [144, 238, 144],
		lightgrey: [211, 211, 211],
		lightpink: [255, 182, 193],
		lightsalmon: [255, 160, 122],
		lightseagreen: [32, 178, 170],
		lightskyblue: [135, 206, 250],
		lightslategray: [119, 136, 153],
		lightslategrey: [119, 136, 153],
		lightsteelblue: [176, 196, 222],
		lightyellow: [255, 255, 224],
		lime: [0, 255, 0],
		limegreen: [50, 205, 50],
		linen: [250, 240, 230],
		magenta: [255, 0, 255],
		maroon: [128, 0, 0],
		mediumaquamarine: [102, 205, 170],
		mediumblue: [0, 0, 205],
		mediumorchid: [186, 85, 211],
		mediumpurple: [147, 112, 219],
		mediumseagreen: [60, 179, 113],
		mediumslateblue: [123, 104, 238],
		mediumspringgreen: [0, 250, 154],
		mediumturquoise: [72, 209, 204],
		mediumvioletred: [199, 21, 133],
		midnightblue: [25, 25, 112],
		mintcream: [245, 255, 250],
		mistyrose: [255, 228, 225],
		moccasin: [255, 228, 181],
		navajowhite: [255, 222, 173],
		navy: [0, 0, 128],
		oldlace: [253, 245, 230],
		olive: [128, 128, 0],
		olivedrab: [107, 142, 35],
		orange: [255, 165, 0],
		orangered: [255, 69, 0],
		orchid: [218, 112, 214],
		palegoldenrod: [238, 232, 170],
		palegreen: [152, 251, 152],
		paleturquoise: [175, 238, 238],
		palevioletred: [219, 112, 147],
		papayawhip: [255, 239, 213],
		peachpuff: [255, 218, 185],
		peru: [205, 133, 63],
		pink: [255, 192, 203],
		plum: [221, 160, 221],
		powderblue: [176, 224, 230],
		purple: [128, 0, 128],
		rebeccapurple: [102, 51, 153],
		red: [255, 0, 0],
		rosybrown: [188, 143, 143],
		royalblue: [65, 105, 225],
		saddlebrown: [139, 69, 19],
		salmon: [250, 128, 114],
		sandybrown: [244, 164, 96],
		seagreen: [46, 139, 87],
		seashell: [255, 245, 238],
		sienna: [160, 82, 45],
		silver: [192, 192, 192],
		skyblue: [135, 206, 235],
		slateblue: [106, 90, 205],
		slategray: [112, 128, 144],
		slategrey: [112, 128, 144],
		snow: [255, 250, 250],
		springgreen: [0, 255, 127],
		steelblue: [70, 130, 180],
		tan: [210, 180, 140],
		teal: [0, 128, 128],
		thistle: [216, 191, 216],
		tomato: [255, 99, 71],
		turquoise: [64, 224, 208],
		violet: [238, 130, 238],
		wheat: [245, 222, 179],
		white: [255, 255, 255],
		whitesmoke: [245, 245, 245],
		yellow: [255, 255, 0],
		yellowgreen: [154, 205, 50]
	};



/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var conversions = __webpack_require__(8);

	/*
		this function routes a model to all other models.

		all functions that are routed have a property `.conversion` attached
		to the returned synthetic function. This property is an array
		of strings, each with the steps in between the 'from' and 'to'
		color models (inclusive).

		conversions that are not possible simply are not included.
	*/

	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	var models = Object.keys(conversions);

	function buildGraph() {
		var graph = {};

		for (var len = models.length, i = 0; i < len; i++) {
			graph[models[i]] = {
				// http://jsperf.com/1-vs-infinity
				// micro-opt, but this is simple.
				distance: -1,
				parent: null
			};
		}

		return graph;
	}

	// https://en.wikipedia.org/wiki/Breadth-first_search
	function deriveBFS(fromModel) {
		var graph = buildGraph();
		var queue = [fromModel]; // unshift -> queue -> pop

		graph[fromModel].distance = 0;

		while (queue.length) {
			var current = queue.pop();
			var adjacents = Object.keys(conversions[current]);

			for (var len = adjacents.length, i = 0; i < len; i++) {
				var adjacent = adjacents[i];
				var node = graph[adjacent];

				if (node.distance === -1) {
					node.distance = graph[current].distance + 1;
					node.parent = current;
					queue.unshift(adjacent);
				}
			}
		}

		return graph;
	}

	function link(from, to) {
		return function (args) {
			return to(from(args));
		};
	}

	function wrapConversion(toModel, graph) {
		var path = [graph[toModel].parent, toModel];
		var fn = conversions[graph[toModel].parent][toModel];

		var cur = graph[toModel].parent;
		while (graph[cur].parent) {
			path.unshift(graph[cur].parent);
			fn = link(conversions[graph[cur].parent][cur], fn);
			cur = graph[cur].parent;
		}

		fn.conversion = path;
		return fn;
	}

	module.exports = function (fromModel) {
		var graph = deriveBFS(fromModel);
		var conversion = {};

		var models = Object.keys(graph);
		for (var len = models.length, i = 0; i < len; i++) {
			var toModel = models[i];
			var node = graph[toModel];

			if (node.parent === null) {
				// no possible conversion, or this node is the source model.
				continue;
			}

			conversion[toModel] = wrapConversion(toModel, graph);
		}

		return conversion;
	};



/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ansiRegex = __webpack_require__(12)();

	module.exports = function (str) {
		return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
	};


/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';
	module.exports = function () {
		return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
	};


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ansiRegex = __webpack_require__(12);
	var re = new RegExp(ansiRegex().source); // remove the `g` flag
	module.exports = re.test.bind(re);


/***/ },
/* 14 */
/***/ function(module, exports) {

	'use strict';
	var argv = process.argv;

	var terminator = argv.indexOf('--');
	var hasFlag = function (flag) {
		flag = '--' + flag;
		var pos = argv.indexOf(flag);
		return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
	};

	module.exports = (function () {
		if ('FORCE_COLOR' in process.env) {
			return true;
		}

		if (hasFlag('no-color') ||
			hasFlag('no-colors') ||
			hasFlag('color=false')) {
			return false;
		}

		if (hasFlag('color') ||
			hasFlag('colors') ||
			hasFlag('color=true') ||
			hasFlag('color=always')) {
			return true;
		}

		if (process.stdout && !process.stdout.isTTY) {
			return false;
		}

		if (process.platform === 'win32') {
			return true;
		}

		if ('COLORTERM' in process.env) {
			return true;
		}

		if (process.env.TERM === 'dumb') {
			return false;
		}

		if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
			return true;
		}

		return false;
	})();


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';
	var colorConvert = __webpack_require__(7);

	function wrapAnsi16(fn, offset) {
		return function () {
			var code = fn.apply(colorConvert, arguments);
			return '\u001b[' + (code + offset) + 'm';
		};
	}

	function wrapAnsi256(fn, offset) {
		return function () {
			var code = fn.apply(colorConvert, arguments);
			return '\u001b[' + (38 + offset) + ';5;' + code + 'm';
		};
	}

	function wrapAnsi16m(fn, offset) {
		return function () {
			var rgb = fn.apply(colorConvert, arguments);
			return '\u001b[' + (38 + offset) + ';2;' +
				rgb[0] + ';' + rgb[1] + ';' + rgb[2] + 'm';
		};
	}

	function assembleStyles() {
		var styles = {
			modifier: {
				reset: [0, 0],
				// 21 isn't widely supported and 22 does the same thing
				bold: [1, 22],
				dim: [2, 22],
				italic: [3, 23],
				underline: [4, 24],
				inverse: [7, 27],
				hidden: [8, 28],
				strikethrough: [9, 29]
			},
			color: {
				black: [30, 39],
				red: [31, 39],
				green: [32, 39],
				yellow: [33, 39],
				blue: [34, 39],
				magenta: [35, 39],
				cyan: [36, 39],
				white: [37, 39],
				gray: [90, 39]
			},
			bgColor: {
				bgBlack: [40, 49],
				bgRed: [41, 49],
				bgGreen: [42, 49],
				bgYellow: [43, 49],
				bgBlue: [44, 49],
				bgMagenta: [45, 49],
				bgCyan: [46, 49],
				bgWhite: [47, 49]
			}
		};

		// fix humans
		styles.color.grey = styles.color.gray;

		Object.keys(styles).forEach(function (groupName) {
			var group = styles[groupName];

			Object.keys(group).forEach(function (styleName) {
				var style = group[styleName];

				styles[styleName] = group[styleName] = {
					open: '\u001b[' + style[0] + 'm',
					close: '\u001b[' + style[1] + 'm'
				};
			});

			Object.defineProperty(styles, groupName, {
				value: group,
				enumerable: false
			});
		});

		function rgb2rgb(r, g, b) {
			return [r, g, b];
		}

		styles.color.close = '\u001b[39m';
		styles.bgColor.close = '\u001b[49m';

		styles.color.ansi = {};
		styles.color.ansi256 = {};
		styles.color.ansi16m = {
			rgb: wrapAnsi16m(rgb2rgb, 0)
		};

		styles.bgColor.ansi = {};
		styles.bgColor.ansi256 = {};
		styles.bgColor.ansi16m = {
			rgb: wrapAnsi16m(rgb2rgb, 10)
		};

		for (var key in colorConvert) {
			if (!colorConvert.hasOwnProperty(key) || typeof colorConvert[key] !== 'object') {
				continue;
			}

			var suite = colorConvert[key];

			if ('ansi16' in suite) {
				styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
				styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
			}

			if ('ansi256' in suite) {
				styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
				styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
			}

			if ('rgb' in suite) {
				styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
				styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
			}
		}

		return styles;
	}

	Object.defineProperty(module, 'exports', {
		enumerable: true,
		get: assembleStyles
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)(module)))

/***/ },
/* 16 */
/***/ function(module, exports) {

	module.exports = require("path");

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	module.exports = __webpack_require__(18);


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 */

	var EventEmitter = __webpack_require__(19).EventEmitter;
	var mixin = __webpack_require__(20);
	var proto = __webpack_require__(21);
	var Route = __webpack_require__(35);
	var Router = __webpack_require__(34);
	var req = __webpack_require__(77);
	var res = __webpack_require__(89);

	/**
	 * Expose `createApplication()`.
	 */

	exports = module.exports = createApplication;

	/**
	 * Create an express application.
	 *
	 * @return {Function}
	 * @api public
	 */

	function createApplication() {
	  var app = function(req, res, next) {
	    app.handle(req, res, next);
	  };

	  mixin(app, EventEmitter.prototype, false);
	  mixin(app, proto, false);

	  app.request = { __proto__: req, app: app };
	  app.response = { __proto__: res, app: app };
	  app.init();
	  return app;
	}

	/**
	 * Expose the prototypes.
	 */

	exports.application = proto;
	exports.request = req;
	exports.response = res;

	/**
	 * Expose constructors.
	 */

	exports.Route = Route;
	exports.Router = Router;

	/**
	 * Expose middleware
	 */

	exports.query = __webpack_require__(50);
	exports.static = __webpack_require__(93);

	/**
	 * Replace removed middleware with an appropriate error message.
	 */

	[
	  'json',
	  'urlencoded',
	  'bodyParser',
	  'compress',
	  'cookieSession',
	  'session',
	  'logger',
	  'cookieParser',
	  'favicon',
	  'responseTime',
	  'errorHandler',
	  'timeout',
	  'methodOverride',
	  'vhost',
	  'csrf',
	  'directory',
	  'limit',
	  'multipart',
	  'staticCache',
	].forEach(function (name) {
	  Object.defineProperty(exports, name, {
	    get: function () {
	      throw new Error('Most middleware (like ' + name + ') is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.');
	    },
	    configurable: true
	  });
	});


/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = require("events");

/***/ },
/* 20 */
/***/ function(module, exports) {

	/*!
	 * merge-descriptors
	 * Copyright(c) 2014 Jonathan Ong
	 * Copyright(c) 2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = merge

	/**
	 * Module variables.
	 * @private
	 */

	var hasOwnProperty = Object.prototype.hasOwnProperty

	/**
	 * Merge the property descriptors of `src` into `dest`
	 *
	 * @param {object} dest Object to add descriptors to
	 * @param {object} src Object to clone descriptors from
	 * @param {boolean} [redefine=true] Redefine `dest` properties with `src` properties
	 * @returns {object} Reference to dest
	 * @public
	 */

	function merge(dest, src, redefine) {
	  if (!dest) {
	    throw new TypeError('argument dest is required')
	  }

	  if (!src) {
	    throw new TypeError('argument src is required')
	  }

	  if (redefine === undefined) {
	    // Default to true
	    redefine = true
	  }

	  Object.getOwnPropertyNames(src).forEach(function forEachOwnPropertyName(name) {
	    if (!redefine && hasOwnProperty.call(dest, name)) {
	      // Skip desriptor
	      return
	    }

	    // Copy descriptor
	    var descriptor = Object.getOwnPropertyDescriptor(src, name)
	    Object.defineProperty(dest, name, descriptor)
	  })

	  return dest
	}


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @private
	 */

	var finalhandler = __webpack_require__(22);
	var Router = __webpack_require__(34);
	var methods = __webpack_require__(39);
	var middleware = __webpack_require__(49);
	var query = __webpack_require__(50);
	var debug = __webpack_require__(23)('express:application');
	var View = __webpack_require__(55);
	var http = __webpack_require__(30);
	var compileETag = __webpack_require__(56).compileETag;
	var compileQueryParser = __webpack_require__(56).compileQueryParser;
	var compileTrust = __webpack_require__(56).compileTrust;
	var deprecate = __webpack_require__(41)('express');
	var flatten = __webpack_require__(36);
	var merge = __webpack_require__(40);
	var resolve = __webpack_require__(16).resolve;
	var slice = Array.prototype.slice;

	/**
	 * Application prototype.
	 */

	var app = exports = module.exports = {};

	/**
	 * Variable for trust proxy inheritance back-compat
	 * @private
	 */

	var trustProxyDefaultSymbol = '@@symbol:trust_proxy_default';

	/**
	 * Initialize the server.
	 *
	 *   - setup default configuration
	 *   - setup default middleware
	 *   - setup route reflection methods
	 *
	 * @private
	 */

	app.init = function init() {
	  this.cache = {};
	  this.engines = {};
	  this.settings = {};

	  this.defaultConfiguration();
	};

	/**
	 * Initialize application configuration.
	 * @private
	 */

	app.defaultConfiguration = function defaultConfiguration() {
	  var env = process.env.NODE_ENV || 'development';

	  // default settings
	  this.enable('x-powered-by');
	  this.set('etag', 'weak');
	  this.set('env', env);
	  this.set('query parser', 'extended');
	  this.set('subdomain offset', 2);
	  this.set('trust proxy', false);

	  // trust proxy inherit back-compat
	  Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
	    configurable: true,
	    value: true
	  });

	  debug('booting in %s mode', env);

	  this.on('mount', function onmount(parent) {
	    // inherit trust proxy
	    if (this.settings[trustProxyDefaultSymbol] === true
	      && typeof parent.settings['trust proxy fn'] === 'function') {
	      delete this.settings['trust proxy'];
	      delete this.settings['trust proxy fn'];
	    }

	    // inherit protos
	    this.request.__proto__ = parent.request;
	    this.response.__proto__ = parent.response;
	    this.engines.__proto__ = parent.engines;
	    this.settings.__proto__ = parent.settings;
	  });

	  // setup locals
	  this.locals = Object.create(null);

	  // top-most app is mounted at /
	  this.mountpath = '/';

	  // default locals
	  this.locals.settings = this.settings;

	  // default configuration
	  this.set('view', View);
	  this.set('views', resolve('views'));
	  this.set('jsonp callback name', 'callback');

	  if (env === 'production') {
	    this.enable('view cache');
	  }

	  Object.defineProperty(this, 'router', {
	    get: function() {
	      throw new Error('\'app.router\' is deprecated!\nPlease see the 3.x to 4.x migration guide for details on how to update your app.');
	    }
	  });
	};

	/**
	 * lazily adds the base router if it has not yet been added.
	 *
	 * We cannot add the base router in the defaultConfiguration because
	 * it reads app settings which might be set after that has run.
	 *
	 * @private
	 */
	app.lazyrouter = function lazyrouter() {
	  if (!this._router) {
	    this._router = new Router({
	      caseSensitive: this.enabled('case sensitive routing'),
	      strict: this.enabled('strict routing')
	    });

	    this._router.use(query(this.get('query parser fn')));
	    this._router.use(middleware.init(this));
	  }
	};

	/**
	 * Dispatch a req, res pair into the application. Starts pipeline processing.
	 *
	 * If no callback is provided, then default error handlers will respond
	 * in the event of an error bubbling through the stack.
	 *
	 * @private
	 */

	app.handle = function handle(req, res, callback) {
	  var router = this._router;

	  // final handler
	  var done = callback || finalhandler(req, res, {
	    env: this.get('env'),
	    onerror: logerror.bind(this)
	  });

	  // no routes
	  if (!router) {
	    debug('no routes defined on app');
	    done();
	    return;
	  }

	  router.handle(req, res, done);
	};

	/**
	 * Proxy `Router#use()` to add middleware to the app router.
	 * See Router#use() documentation for details.
	 *
	 * If the _fn_ parameter is an express app, then it will be
	 * mounted at the _route_ specified.
	 *
	 * @public
	 */

	app.use = function use(fn) {
	  var offset = 0;
	  var path = '/';

	  // default path to '/'
	  // disambiguate app.use([fn])
	  if (typeof fn !== 'function') {
	    var arg = fn;

	    while (Array.isArray(arg) && arg.length !== 0) {
	      arg = arg[0];
	    }

	    // first arg is the path
	    if (typeof arg !== 'function') {
	      offset = 1;
	      path = fn;
	    }
	  }

	  var fns = flatten(slice.call(arguments, offset));

	  if (fns.length === 0) {
	    throw new TypeError('app.use() requires middleware functions');
	  }

	  // setup router
	  this.lazyrouter();
	  var router = this._router;

	  fns.forEach(function (fn) {
	    // non-express app
	    if (!fn || !fn.handle || !fn.set) {
	      return router.use(path, fn);
	    }

	    debug('.use app under %s', path);
	    fn.mountpath = path;
	    fn.parent = this;

	    // restore .app property on req and res
	    router.use(path, function mounted_app(req, res, next) {
	      var orig = req.app;
	      fn.handle(req, res, function (err) {
	        req.__proto__ = orig.request;
	        res.__proto__ = orig.response;
	        next(err);
	      });
	    });

	    // mounted an app
	    fn.emit('mount', this);
	  }, this);

	  return this;
	};

	/**
	 * Proxy to the app `Router#route()`
	 * Returns a new `Route` instance for the _path_.
	 *
	 * Routes are isolated middleware stacks for specific paths.
	 * See the Route api docs for details.
	 *
	 * @public
	 */

	app.route = function route(path) {
	  this.lazyrouter();
	  return this._router.route(path);
	};

	/**
	 * Register the given template engine callback `fn`
	 * as `ext`.
	 *
	 * By default will `require()` the engine based on the
	 * file extension. For example if you try to render
	 * a "foo.jade" file Express will invoke the following internally:
	 *
	 *     app.engine('jade', require('jade').__express);
	 *
	 * For engines that do not provide `.__express` out of the box,
	 * or if you wish to "map" a different extension to the template engine
	 * you may use this method. For example mapping the EJS template engine to
	 * ".html" files:
	 *
	 *     app.engine('html', require('ejs').renderFile);
	 *
	 * In this case EJS provides a `.renderFile()` method with
	 * the same signature that Express expects: `(path, options, callback)`,
	 * though note that it aliases this method as `ejs.__express` internally
	 * so if you're using ".ejs" extensions you dont need to do anything.
	 *
	 * Some template engines do not follow this convention, the
	 * [Consolidate.js](https://github.com/tj/consolidate.js)
	 * library was created to map all of node's popular template
	 * engines to follow this convention, thus allowing them to
	 * work seamlessly within Express.
	 *
	 * @param {String} ext
	 * @param {Function} fn
	 * @return {app} for chaining
	 * @public
	 */

	app.engine = function engine(ext, fn) {
	  if (typeof fn !== 'function') {
	    throw new Error('callback function required');
	  }

	  // get file extension
	  var extension = ext[0] !== '.'
	    ? '.' + ext
	    : ext;

	  // store engine
	  this.engines[extension] = fn;

	  return this;
	};

	/**
	 * Proxy to `Router#param()` with one added api feature. The _name_ parameter
	 * can be an array of names.
	 *
	 * See the Router#param() docs for more details.
	 *
	 * @param {String|Array} name
	 * @param {Function} fn
	 * @return {app} for chaining
	 * @public
	 */

	app.param = function param(name, fn) {
	  this.lazyrouter();

	  if (Array.isArray(name)) {
	    for (var i = 0; i < name.length; i++) {
	      this.param(name[i], fn);
	    }

	    return this;
	  }

	  this._router.param(name, fn);

	  return this;
	};

	/**
	 * Assign `setting` to `val`, or return `setting`'s value.
	 *
	 *    app.set('foo', 'bar');
	 *    app.get('foo');
	 *    // => "bar"
	 *
	 * Mounted servers inherit their parent server's settings.
	 *
	 * @param {String} setting
	 * @param {*} [val]
	 * @return {Server} for chaining
	 * @public
	 */

	app.set = function set(setting, val) {
	  if (arguments.length === 1) {
	    // app.get(setting)
	    return this.settings[setting];
	  }

	  debug('set "%s" to %o', setting, val);

	  // set value
	  this.settings[setting] = val;

	  // trigger matched settings
	  switch (setting) {
	    case 'etag':
	      this.set('etag fn', compileETag(val));
	      break;
	    case 'query parser':
	      this.set('query parser fn', compileQueryParser(val));
	      break;
	    case 'trust proxy':
	      this.set('trust proxy fn', compileTrust(val));

	      // trust proxy inherit back-compat
	      Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
	        configurable: true,
	        value: false
	      });

	      break;
	  }

	  return this;
	};

	/**
	 * Return the app's absolute pathname
	 * based on the parent(s) that have
	 * mounted it.
	 *
	 * For example if the application was
	 * mounted as "/admin", which itself
	 * was mounted as "/blog" then the
	 * return value would be "/blog/admin".
	 *
	 * @return {String}
	 * @private
	 */

	app.path = function path() {
	  return this.parent
	    ? this.parent.path() + this.mountpath
	    : '';
	};

	/**
	 * Check if `setting` is enabled (truthy).
	 *
	 *    app.enabled('foo')
	 *    // => false
	 *
	 *    app.enable('foo')
	 *    app.enabled('foo')
	 *    // => true
	 *
	 * @param {String} setting
	 * @return {Boolean}
	 * @public
	 */

	app.enabled = function enabled(setting) {
	  return Boolean(this.set(setting));
	};

	/**
	 * Check if `setting` is disabled.
	 *
	 *    app.disabled('foo')
	 *    // => true
	 *
	 *    app.enable('foo')
	 *    app.disabled('foo')
	 *    // => false
	 *
	 * @param {String} setting
	 * @return {Boolean}
	 * @public
	 */

	app.disabled = function disabled(setting) {
	  return !this.set(setting);
	};

	/**
	 * Enable `setting`.
	 *
	 * @param {String} setting
	 * @return {app} for chaining
	 * @public
	 */

	app.enable = function enable(setting) {
	  return this.set(setting, true);
	};

	/**
	 * Disable `setting`.
	 *
	 * @param {String} setting
	 * @return {app} for chaining
	 * @public
	 */

	app.disable = function disable(setting) {
	  return this.set(setting, false);
	};

	/**
	 * Delegate `.VERB(...)` calls to `router.VERB(...)`.
	 */

	methods.forEach(function(method){
	  app[method] = function(path){
	    if (method === 'get' && arguments.length === 1) {
	      // app.get(setting)
	      return this.set(path);
	    }

	    this.lazyrouter();

	    var route = this._router.route(path);
	    route[method].apply(route, slice.call(arguments, 1));
	    return this;
	  };
	});

	/**
	 * Special-cased "all" method, applying the given route `path`,
	 * middleware, and callback to _every_ HTTP method.
	 *
	 * @param {String} path
	 * @param {Function} ...
	 * @return {app} for chaining
	 * @public
	 */

	app.all = function all(path) {
	  this.lazyrouter();

	  var route = this._router.route(path);
	  var args = slice.call(arguments, 1);

	  for (var i = 0; i < methods.length; i++) {
	    route[methods[i]].apply(route, args);
	  }

	  return this;
	};

	// del -> delete alias

	app.del = deprecate.function(app.delete, 'app.del: Use app.delete instead');

	/**
	 * Render the given view `name` name with `options`
	 * and a callback accepting an error and the
	 * rendered template string.
	 *
	 * Example:
	 *
	 *    app.render('email', { name: 'Tobi' }, function(err, html){
	 *      // ...
	 *    })
	 *
	 * @param {String} name
	 * @param {Object|Function} options or fn
	 * @param {Function} callback
	 * @public
	 */

	app.render = function render(name, options, callback) {
	  var cache = this.cache;
	  var done = callback;
	  var engines = this.engines;
	  var opts = options;
	  var renderOptions = {};
	  var view;

	  // support callback function as second arg
	  if (typeof options === 'function') {
	    done = options;
	    opts = {};
	  }

	  // merge app.locals
	  merge(renderOptions, this.locals);

	  // merge options._locals
	  if (opts._locals) {
	    merge(renderOptions, opts._locals);
	  }

	  // merge options
	  merge(renderOptions, opts);

	  // set .cache unless explicitly provided
	  if (renderOptions.cache == null) {
	    renderOptions.cache = this.enabled('view cache');
	  }

	  // primed cache
	  if (renderOptions.cache) {
	    view = cache[name];
	  }

	  // view
	  if (!view) {
	    var View = this.get('view');

	    view = new View(name, {
	      defaultEngine: this.get('view engine'),
	      root: this.get('views'),
	      engines: engines
	    });

	    if (!view.path) {
	      var dirs = Array.isArray(view.root) && view.root.length > 1
	        ? 'directories "' + view.root.slice(0, -1).join('", "') + '" or "' + view.root[view.root.length - 1] + '"'
	        : 'directory "' + view.root + '"'
	      var err = new Error('Failed to lookup view "' + name + '" in views ' + dirs);
	      err.view = view;
	      return done(err);
	    }

	    // prime the cache
	    if (renderOptions.cache) {
	      cache[name] = view;
	    }
	  }

	  // render
	  tryRender(view, renderOptions, done);
	};

	/**
	 * Listen for connections.
	 *
	 * A node `http.Server` is returned, with this
	 * application (which is a `Function`) as its
	 * callback. If you wish to create both an HTTP
	 * and HTTPS server you may do so with the "http"
	 * and "https" modules as shown here:
	 *
	 *    var http = require('http')
	 *      , https = require('https')
	 *      , express = require('express')
	 *      , app = express();
	 *
	 *    http.createServer(app).listen(80);
	 *    https.createServer({ ... }, app).listen(443);
	 *
	 * @return {http.Server}
	 * @public
	 */

	app.listen = function listen() {
	  var server = http.createServer(this);
	  return server.listen.apply(server, arguments);
	};

	/**
	 * Log error using console.error.
	 *
	 * @param {Error} err
	 * @private
	 */

	function logerror(err) {
	  /* istanbul ignore next */
	  if (this.get('env') !== 'test') console.error(err.stack || err.toString());
	}

	/**
	 * Try rendering a view.
	 * @private
	 */

	function tryRender(view, options, callback) {
	  try {
	    view.render(options, callback);
	  } catch (err) {
	    callback(err);
	  }
	}


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * finalhandler
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 * @private
	 */

	var debug = __webpack_require__(23)('finalhandler')
	var escapeHtml = __webpack_require__(29)
	var http = __webpack_require__(30)
	var onFinished = __webpack_require__(31)
	var unpipe = __webpack_require__(33)

	/**
	 * Module variables.
	 * @private
	 */

	/* istanbul ignore next */
	var defer = typeof setImmediate === 'function'
	  ? setImmediate
	  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }
	var isFinished = onFinished.isFinished

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = finalhandler

	/**
	 * Create a function to handle the final response.
	 *
	 * @param {Request} req
	 * @param {Response} res
	 * @param {Object} [options]
	 * @return {Function}
	 * @public
	 */

	function finalhandler(req, res, options) {
	  var opts = options || {}

	  // get environment
	  var env = opts.env || process.env.NODE_ENV || 'development'

	  // get error callback
	  var onerror = opts.onerror

	  return function (err) {
	    var status = res.statusCode

	    // ignore 404 on in-flight response
	    if (!err && res._header) {
	      debug('cannot 404 after headers sent')
	      return
	    }

	    // unhandled error
	    if (err) {
	      // respect err.statusCode
	      if (err.statusCode) {
	        status = err.statusCode
	      }

	      // respect err.status
	      if (err.status) {
	        status = err.status
	      }

	      // default status code to 500
	      if (!status || status < 400) {
	        status = 500
	      }

	      // production gets a basic error message
	      var msg = env === 'production'
	        ? http.STATUS_CODES[status]
	        : err.stack || err.toString()
	      msg = escapeHtml(msg)
	        .replace(/\n/g, '<br>')
	        .replace(/  /g, ' &nbsp;') + '\n'
	    } else {
	      status = 404
	      msg = 'Cannot ' + escapeHtml(req.method) + ' ' + escapeHtml(req.originalUrl || req.url) + '\n'
	    }

	    debug('default %s', status)

	    // schedule onerror callback
	    if (err && onerror) {
	      defer(onerror, err, req, res)
	    }

	    // cannot actually respond
	    if (res._header) {
	      return req.socket.destroy()
	    }

	    send(req, res, status, msg)
	  }
	}

	/**
	 * Send response.
	 *
	 * @param {IncomingMessage} req
	 * @param {OutgoingMessage} res
	 * @param {number} status
	 * @param {string} body
	 * @private
	 */

	function send(req, res, status, body) {
	  function write() {
	    res.statusCode = status

	    // security header for content sniffing
	    res.setHeader('X-Content-Type-Options', 'nosniff')

	    // standard headers
	    res.setHeader('Content-Type', 'text/html; charset=utf-8')
	    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'))

	    if (req.method === 'HEAD') {
	      res.end()
	      return
	    }

	    res.end(body, 'utf8')
	  }

	  if (isFinished(req)) {
	    write()
	    return
	  }

	  // unpipe everything from the request
	  unpipe(req)

	  // flush the request
	  onFinished(req, write)
	  req.resume()
	}


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var tty = __webpack_require__(24);
	var util = __webpack_require__(25);

	/**
	 * This is the Node.js implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = __webpack_require__(26);
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;

	/**
	 * Colors.
	 */

	exports.colors = [6, 2, 3, 4, 5, 1];

	/**
	 * The file descriptor to write the `debug()` calls to.
	 * Set the `DEBUG_FD` env variable to override with another value. i.e.:
	 *
	 *   $ DEBUG_FD=3 node script.js 3>debug.log
	 */

	var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
	var stream = 1 === fd ? process.stdout :
	             2 === fd ? process.stderr :
	             createWritableStdioStream(fd);

	/**
	 * Is stdout a TTY? Colored output is enabled when `true`.
	 */

	function useColors() {
	  var debugColors = (process.env.DEBUG_COLORS || '').trim().toLowerCase();
	  if (0 === debugColors.length) {
	    return tty.isatty(fd);
	  } else {
	    return '0' !== debugColors
	        && 'no' !== debugColors
	        && 'false' !== debugColors
	        && 'disabled' !== debugColors;
	  }
	}

	/**
	 * Map %o to `util.inspect()`, since Node doesn't do that out of the box.
	 */

	var inspect = (4 === util.inspect.length ?
	  // node <= 0.8.x
	  function (v, colors) {
	    return util.inspect(v, void 0, void 0, colors);
	  } :
	  // node > 0.8.x
	  function (v, colors) {
	    return util.inspect(v, { colors: colors });
	  }
	);

	exports.formatters.o = function(v) {
	  return inspect(v, this.useColors)
	    .replace(/\s*\n\s*/g, ' ');
	};

	/**
	 * Adds ANSI color escape codes if enabled.
	 *
	 * @api public
	 */

	function formatArgs() {
	  var args = arguments;
	  var useColors = this.useColors;
	  var name = this.namespace;

	  if (useColors) {
	    var c = this.color;

	    args[0] = '  \u001b[3' + c + ';1m' + name + ' '
	      + '\u001b[0m'
	      + args[0] + '\u001b[3' + c + 'm'
	      + ' +' + exports.humanize(this.diff) + '\u001b[0m';
	  } else {
	    args[0] = new Date().toUTCString()
	      + ' ' + name + ' ' + args[0];
	  }
	  return args;
	}

	/**
	 * Invokes `console.error()` with the specified arguments.
	 */

	function log() {
	  return stream.write(util.format.apply(this, arguments) + '\n');
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  if (null == namespaces) {
	    // If you set a process.env field to null or undefined, it gets cast to the
	    // string 'null' or 'undefined'. Just delete instead.
	    delete process.env.DEBUG;
	  } else {
	    process.env.DEBUG = namespaces;
	  }
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  return process.env.DEBUG;
	}

	/**
	 * Copied from `node/src/node.js`.
	 *
	 * XXX: It's lame that node doesn't expose this API out-of-the-box. It also
	 * relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
	 */

	function createWritableStdioStream (fd) {
	  var stream;
	  var tty_wrap = process.binding('tty_wrap');

	  // Note stream._type is used for test-module-load-list.js

	  switch (tty_wrap.guessHandleType(fd)) {
	    case 'TTY':
	      stream = new tty.WriteStream(fd);
	      stream._type = 'tty';

	      // Hack to have stream not keep the event loop alive.
	      // See https://github.com/joyent/node/issues/1726
	      if (stream._handle && stream._handle.unref) {
	        stream._handle.unref();
	      }
	      break;

	    case 'FILE':
	      var fs = __webpack_require__(2);
	      stream = new fs.SyncWriteStream(fd, { autoClose: false });
	      stream._type = 'fs';
	      break;

	    case 'PIPE':
	    case 'TCP':
	      var net = __webpack_require__(28);
	      stream = new net.Socket({
	        fd: fd,
	        readable: false,
	        writable: true
	      });

	      // FIXME Should probably have an option in net.Socket to create a
	      // stream from an existing fd which is writable only. But for now
	      // we'll just add this hack and set the `readable` member to false.
	      // Test: ./node test/fixtures/echo.js < /etc/passwd
	      stream.readable = false;
	      stream.read = null;
	      stream._type = 'pipe';

	      // FIXME Hack to have stream not keep the event loop alive.
	      // See https://github.com/joyent/node/issues/1726
	      if (stream._handle && stream._handle.unref) {
	        stream._handle.unref();
	      }
	      break;

	    default:
	      // Probably an error on in uv_guess_handle()
	      throw new Error('Implement me. Unknown stream file type!');
	  }

	  // For supporting legacy API we put the FD here.
	  stream.fd = fd;

	  stream._isStdio = true;

	  return stream;
	}

	/**
	 * Enable namespaces listed in `process.env.DEBUG` initially.
	 */

	exports.enable(load());


/***/ },
/* 24 */
/***/ function(module, exports) {

	module.exports = require("tty");

/***/ },
/* 25 */
/***/ function(module, exports) {

	module.exports = require("util");

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = __webpack_require__(27);

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lowercased letter, i.e. "n".
	 */

	exports.formatters = {};

	/**
	 * Previously assigned color.
	 */

	var prevColor = 0;

	/**
	 * Previous log timestamp.
	 */

	var prevTime;

	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */

	function selectColor() {
	  return exports.colors[prevColor++ % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function debug(namespace) {

	  // define the `disabled` version
	  function disabled() {
	  }
	  disabled.enabled = false;

	  // define the `enabled` version
	  function enabled() {

	    var self = enabled;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // add the `color` if not set
	    if (null == self.useColors) self.useColors = exports.useColors();
	    if (null == self.color && self.useColors) self.color = selectColor();

	    var args = Array.prototype.slice.call(arguments);

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %o
	      args = ['%o'].concat(args);
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    if ('function' === typeof exports.formatArgs) {
	      args = exports.formatArgs.apply(self, args);
	    }
	    var logFn = enabled.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }
	  enabled.enabled = true;

	  var fn = exports.enabled(namespace) ? enabled : disabled;

	  fn.namespace = namespace;

	  return fn;
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  var split = (namespaces || '').split(/[\s,]+/);
	  var len = split.length;

	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}


/***/ },
/* 27 */
/***/ function(module, exports) {

	/**
	 * Helpers.
	 */

	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} options
	 * @return {String|Number}
	 * @api public
	 */

	module.exports = function(val, options){
	  options = options || {};
	  if ('string' == typeof val) return parse(val);
	  return options.long
	    ? long(val)
	    : short(val);
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = '' + str;
	  if (str.length > 10000) return;
	  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
	  if (!match) return;
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function short(ms) {
	  if (ms >= d) return Math.round(ms / d) + 'd';
	  if (ms >= h) return Math.round(ms / h) + 'h';
	  if (ms >= m) return Math.round(ms / m) + 'm';
	  if (ms >= s) return Math.round(ms / s) + 's';
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function long(ms) {
	  return plural(ms, d, 'day')
	    || plural(ms, h, 'hour')
	    || plural(ms, m, 'minute')
	    || plural(ms, s, 'second')
	    || ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, n, name) {
	  if (ms < n) return;
	  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
	  return Math.ceil(ms / n) + ' ' + name + 's';
	}


/***/ },
/* 28 */
/***/ function(module, exports) {

	module.exports = require("net");

/***/ },
/* 29 */
/***/ function(module, exports) {

	/*!
	 * escape-html
	 * Copyright(c) 2012-2013 TJ Holowaychuk
	 * Copyright(c) 2015 Andreas Lubbe
	 * Copyright(c) 2015 Tiancheng "Timothy" Gu
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module variables.
	 * @private
	 */

	var matchHtmlRegExp = /["'&<>]/;

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = escapeHtml;

	/**
	 * Escape special characters in the given string of html.
	 *
	 * @param  {string} string The string to escape for inserting into HTML
	 * @return {string}
	 * @public
	 */

	function escapeHtml(string) {
	  var str = '' + string;
	  var match = matchHtmlRegExp.exec(str);

	  if (!match) {
	    return str;
	  }

	  var escape;
	  var html = '';
	  var index = 0;
	  var lastIndex = 0;

	  for (index = match.index; index < str.length; index++) {
	    switch (str.charCodeAt(index)) {
	      case 34: // "
	        escape = '&quot;';
	        break;
	      case 38: // &
	        escape = '&amp;';
	        break;
	      case 39: // '
	        escape = '&#39;';
	        break;
	      case 60: // <
	        escape = '&lt;';
	        break;
	      case 62: // >
	        escape = '&gt;';
	        break;
	      default:
	        continue;
	    }

	    if (lastIndex !== index) {
	      html += str.substring(lastIndex, index);
	    }

	    lastIndex = index + 1;
	    html += escape;
	  }

	  return lastIndex !== index
	    ? html + str.substring(lastIndex, index)
	    : html;
	}


/***/ },
/* 30 */
/***/ function(module, exports) {

	module.exports = require("http");

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * on-finished
	 * Copyright(c) 2013 Jonathan Ong
	 * Copyright(c) 2014 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = onFinished
	module.exports.isFinished = isFinished

	/**
	 * Module dependencies.
	 * @private
	 */

	var first = __webpack_require__(32)

	/**
	 * Variables.
	 * @private
	 */

	/* istanbul ignore next */
	var defer = typeof setImmediate === 'function'
	  ? setImmediate
	  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

	/**
	 * Invoke callback when the response has finished, useful for
	 * cleaning up resources afterwards.
	 *
	 * @param {object} msg
	 * @param {function} listener
	 * @return {object}
	 * @public
	 */

	function onFinished(msg, listener) {
	  if (isFinished(msg) !== false) {
	    defer(listener, null, msg)
	    return msg
	  }

	  // attach the listener to the message
	  attachListener(msg, listener)

	  return msg
	}

	/**
	 * Determine if message is already finished.
	 *
	 * @param {object} msg
	 * @return {boolean}
	 * @public
	 */

	function isFinished(msg) {
	  var socket = msg.socket

	  if (typeof msg.finished === 'boolean') {
	    // OutgoingMessage
	    return Boolean(msg.finished || (socket && !socket.writable))
	  }

	  if (typeof msg.complete === 'boolean') {
	    // IncomingMessage
	    return Boolean(msg.upgrade || !socket || !socket.readable || (msg.complete && !msg.readable))
	  }

	  // don't know
	  return undefined
	}

	/**
	 * Attach a finished listener to the message.
	 *
	 * @param {object} msg
	 * @param {function} callback
	 * @private
	 */

	function attachFinishedListener(msg, callback) {
	  var eeMsg
	  var eeSocket
	  var finished = false

	  function onFinish(error) {
	    eeMsg.cancel()
	    eeSocket.cancel()

	    finished = true
	    callback(error)
	  }

	  // finished on first message event
	  eeMsg = eeSocket = first([[msg, 'end', 'finish']], onFinish)

	  function onSocket(socket) {
	    // remove listener
	    msg.removeListener('socket', onSocket)

	    if (finished) return
	    if (eeMsg !== eeSocket) return

	    // finished on first socket event
	    eeSocket = first([[socket, 'error', 'close']], onFinish)
	  }

	  if (msg.socket) {
	    // socket already assigned
	    onSocket(msg.socket)
	    return
	  }

	  // wait for socket to be assigned
	  msg.on('socket', onSocket)

	  if (msg.socket === undefined) {
	    // node.js 0.8 patch
	    patchAssignSocket(msg, onSocket)
	  }
	}

	/**
	 * Attach the listener to the message.
	 *
	 * @param {object} msg
	 * @return {function}
	 * @private
	 */

	function attachListener(msg, listener) {
	  var attached = msg.__onFinished

	  // create a private single listener with queue
	  if (!attached || !attached.queue) {
	    attached = msg.__onFinished = createListener(msg)
	    attachFinishedListener(msg, attached)
	  }

	  attached.queue.push(listener)
	}

	/**
	 * Create listener on message.
	 *
	 * @param {object} msg
	 * @return {function}
	 * @private
	 */

	function createListener(msg) {
	  function listener(err) {
	    if (msg.__onFinished === listener) msg.__onFinished = null
	    if (!listener.queue) return

	    var queue = listener.queue
	    listener.queue = null

	    for (var i = 0; i < queue.length; i++) {
	      queue[i](err, msg)
	    }
	  }

	  listener.queue = []

	  return listener
	}

	/**
	 * Patch ServerResponse.prototype.assignSocket for node.js 0.8.
	 *
	 * @param {ServerResponse} res
	 * @param {function} callback
	 * @private
	 */

	function patchAssignSocket(res, callback) {
	  var assignSocket = res.assignSocket

	  if (typeof assignSocket !== 'function') return

	  // res.on('socket', callback) is broken in 0.8
	  res.assignSocket = function _assignSocket(socket) {
	    assignSocket.call(this, socket)
	    callback(socket)
	  }
	}


/***/ },
/* 32 */
/***/ function(module, exports) {

	/*!
	 * ee-first
	 * Copyright(c) 2014 Jonathan Ong
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = first

	/**
	 * Get the first event in a set of event emitters and event pairs.
	 *
	 * @param {array} stuff
	 * @param {function} done
	 * @public
	 */

	function first(stuff, done) {
	  if (!Array.isArray(stuff))
	    throw new TypeError('arg must be an array of [ee, events...] arrays')

	  var cleanups = []

	  for (var i = 0; i < stuff.length; i++) {
	    var arr = stuff[i]

	    if (!Array.isArray(arr) || arr.length < 2)
	      throw new TypeError('each array member must be [ee, events...]')

	    var ee = arr[0]

	    for (var j = 1; j < arr.length; j++) {
	      var event = arr[j]
	      var fn = listener(event, callback)

	      // listen to the event
	      ee.on(event, fn)
	      // push this listener to the list of cleanups
	      cleanups.push({
	        ee: ee,
	        event: event,
	        fn: fn,
	      })
	    }
	  }

	  function callback() {
	    cleanup()
	    done.apply(null, arguments)
	  }

	  function cleanup() {
	    var x
	    for (var i = 0; i < cleanups.length; i++) {
	      x = cleanups[i]
	      x.ee.removeListener(x.event, x.fn)
	    }
	  }

	  function thunk(fn) {
	    done = fn
	  }

	  thunk.cancel = cleanup

	  return thunk
	}

	/**
	 * Create the event listener.
	 * @private
	 */

	function listener(event, done) {
	  return function onevent(arg1) {
	    var args = new Array(arguments.length)
	    var ee = this
	    var err = event === 'error'
	      ? arg1
	      : null

	    // copy args to prevent arguments escaping scope
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i]
	    }

	    done(err, ee, event, args)
	  }
	}


/***/ },
/* 33 */
/***/ function(module, exports) {

	/*!
	 * unpipe
	 * Copyright(c) 2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = unpipe

	/**
	 * Determine if there are Node.js pipe-like data listeners.
	 * @private
	 */

	function hasPipeDataListeners(stream) {
	  var listeners = stream.listeners('data')

	  for (var i = 0; i < listeners.length; i++) {
	    if (listeners[i].name === 'ondata') {
	      return true
	    }
	  }

	  return false
	}

	/**
	 * Unpipe a stream from all destinations.
	 *
	 * @param {object} stream
	 * @public
	 */

	function unpipe(stream) {
	  if (!stream) {
	    throw new TypeError('argument stream is required')
	  }

	  if (typeof stream.unpipe === 'function') {
	    // new-style
	    stream.unpipe()
	    return
	  }

	  // Node.js 0.8 hack
	  if (!hasPipeDataListeners(stream)) {
	    return
	  }

	  var listener
	  var listeners = stream.listeners('close')

	  for (var i = 0; i < listeners.length; i++) {
	    listener = listeners[i]

	    if (listener.name !== 'cleanup' && listener.name !== 'onclose') {
	      continue
	    }

	    // invoke the listener
	    listener.call(stream)
	  }
	}


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @private
	 */

	var Route = __webpack_require__(35);
	var Layer = __webpack_require__(37);
	var methods = __webpack_require__(39);
	var mixin = __webpack_require__(40);
	var debug = __webpack_require__(23)('express:router');
	var deprecate = __webpack_require__(41)('express');
	var flatten = __webpack_require__(36);
	var parseUrl = __webpack_require__(47);

	/**
	 * Module variables.
	 * @private
	 */

	var objectRegExp = /^\[object (\S+)\]$/;
	var slice = Array.prototype.slice;
	var toString = Object.prototype.toString;

	/**
	 * Initialize a new `Router` with the given `options`.
	 *
	 * @param {Object} options
	 * @return {Router} which is an callable function
	 * @public
	 */

	var proto = module.exports = function(options) {
	  var opts = options || {};

	  function router(req, res, next) {
	    router.handle(req, res, next);
	  }

	  // mixin Router class functions
	  router.__proto__ = proto;

	  router.params = {};
	  router._params = [];
	  router.caseSensitive = opts.caseSensitive;
	  router.mergeParams = opts.mergeParams;
	  router.strict = opts.strict;
	  router.stack = [];

	  return router;
	};

	/**
	 * Map the given param placeholder `name`(s) to the given callback.
	 *
	 * Parameter mapping is used to provide pre-conditions to routes
	 * which use normalized placeholders. For example a _:user_id_ parameter
	 * could automatically load a user's information from the database without
	 * any additional code,
	 *
	 * The callback uses the same signature as middleware, the only difference
	 * being that the value of the placeholder is passed, in this case the _id_
	 * of the user. Once the `next()` function is invoked, just like middleware
	 * it will continue on to execute the route, or subsequent parameter functions.
	 *
	 * Just like in middleware, you must either respond to the request or call next
	 * to avoid stalling the request.
	 *
	 *  app.param('user_id', function(req, res, next, id){
	 *    User.find(id, function(err, user){
	 *      if (err) {
	 *        return next(err);
	 *      } else if (!user) {
	 *        return next(new Error('failed to load user'));
	 *      }
	 *      req.user = user;
	 *      next();
	 *    });
	 *  });
	 *
	 * @param {String} name
	 * @param {Function} fn
	 * @return {app} for chaining
	 * @public
	 */

	proto.param = function param(name, fn) {
	  // param logic
	  if (typeof name === 'function') {
	    deprecate('router.param(fn): Refactor to use path params');
	    this._params.push(name);
	    return;
	  }

	  // apply param functions
	  var params = this._params;
	  var len = params.length;
	  var ret;

	  if (name[0] === ':') {
	    deprecate('router.param(' + JSON.stringify(name) + ', fn): Use router.param(' + JSON.stringify(name.substr(1)) + ', fn) instead');
	    name = name.substr(1);
	  }

	  for (var i = 0; i < len; ++i) {
	    if (ret = params[i](name, fn)) {
	      fn = ret;
	    }
	  }

	  // ensure we end up with a
	  // middleware function
	  if ('function' != typeof fn) {
	    throw new Error('invalid param() call for ' + name + ', got ' + fn);
	  }

	  (this.params[name] = this.params[name] || []).push(fn);
	  return this;
	};

	/**
	 * Dispatch a req, res into the router.
	 * @private
	 */

	proto.handle = function handle(req, res, out) {
	  var self = this;

	  debug('dispatching %s %s', req.method, req.url);

	  var search = 1 + req.url.indexOf('?');
	  var pathlength = search ? search - 1 : req.url.length;
	  var fqdn = req.url[0] !== '/' && 1 + req.url.substr(0, pathlength).indexOf('://');
	  var protohost = fqdn ? req.url.substr(0, req.url.indexOf('/', 2 + fqdn)) : '';
	  var idx = 0;
	  var removed = '';
	  var slashAdded = false;
	  var paramcalled = {};

	  // store options for OPTIONS request
	  // only used if OPTIONS request
	  var options = [];

	  // middleware and routes
	  var stack = self.stack;

	  // manage inter-router variables
	  var parentParams = req.params;
	  var parentUrl = req.baseUrl || '';
	  var done = restore(out, req, 'baseUrl', 'next', 'params');

	  // setup next layer
	  req.next = next;

	  // for options requests, respond with a default if nothing else responds
	  if (req.method === 'OPTIONS') {
	    done = wrap(done, function(old, err) {
	      if (err || options.length === 0) return old(err);
	      sendOptionsResponse(res, options, old);
	    });
	  }

	  // setup basic req values
	  req.baseUrl = parentUrl;
	  req.originalUrl = req.originalUrl || req.url;

	  next();

	  function next(err) {
	    var layerError = err === 'route'
	      ? null
	      : err;

	    // remove added slash
	    if (slashAdded) {
	      req.url = req.url.substr(1);
	      slashAdded = false;
	    }

	    // restore altered req.url
	    if (removed.length !== 0) {
	      req.baseUrl = parentUrl;
	      req.url = protohost + removed + req.url.substr(protohost.length);
	      removed = '';
	    }

	    // no more matching layers
	    if (idx >= stack.length) {
	      setImmediate(done, layerError);
	      return;
	    }

	    // get pathname of request
	    var path = getPathname(req);

	    if (path == null) {
	      return done(layerError);
	    }

	    // find next matching layer
	    var layer;
	    var match;
	    var route;

	    while (match !== true && idx < stack.length) {
	      layer = stack[idx++];
	      match = matchLayer(layer, path);
	      route = layer.route;

	      if (typeof match !== 'boolean') {
	        // hold on to layerError
	        layerError = layerError || match;
	      }

	      if (match !== true) {
	        continue;
	      }

	      if (!route) {
	        // process non-route handlers normally
	        continue;
	      }

	      if (layerError) {
	        // routes do not match with a pending error
	        match = false;
	        continue;
	      }

	      var method = req.method;
	      var has_method = route._handles_method(method);

	      // build up automatic options response
	      if (!has_method && method === 'OPTIONS') {
	        appendMethods(options, route._options());
	      }

	      // don't even bother matching route
	      if (!has_method && method !== 'HEAD') {
	        match = false;
	        continue;
	      }
	    }

	    // no match
	    if (match !== true) {
	      return done(layerError);
	    }

	    // store route for dispatch on change
	    if (route) {
	      req.route = route;
	    }

	    // Capture one-time layer values
	    req.params = self.mergeParams
	      ? mergeParams(layer.params, parentParams)
	      : layer.params;
	    var layerPath = layer.path;

	    // this should be done for the layer
	    self.process_params(layer, paramcalled, req, res, function (err) {
	      if (err) {
	        return next(layerError || err);
	      }

	      if (route) {
	        return layer.handle_request(req, res, next);
	      }

	      trim_prefix(layer, layerError, layerPath, path);
	    });
	  }

	  function trim_prefix(layer, layerError, layerPath, path) {
	    var c = path[layerPath.length];
	    if (c && '/' !== c && '.' !== c) return next(layerError);

	     // Trim off the part of the url that matches the route
	     // middleware (.use stuff) needs to have the path stripped
	    if (layerPath.length !== 0) {
	      debug('trim prefix (%s) from url %s', layerPath, req.url);
	      removed = layerPath;
	      req.url = protohost + req.url.substr(protohost.length + removed.length);

	      // Ensure leading slash
	      if (!fqdn && req.url[0] !== '/') {
	        req.url = '/' + req.url;
	        slashAdded = true;
	      }

	      // Setup base URL (no trailing slash)
	      req.baseUrl = parentUrl + (removed[removed.length - 1] === '/'
	        ? removed.substring(0, removed.length - 1)
	        : removed);
	    }

	    debug('%s %s : %s', layer.name, layerPath, req.originalUrl);

	    if (layerError) {
	      layer.handle_error(layerError, req, res, next);
	    } else {
	      layer.handle_request(req, res, next);
	    }
	  }
	};

	/**
	 * Process any parameters for the layer.
	 * @private
	 */

	proto.process_params = function process_params(layer, called, req, res, done) {
	  var params = this.params;

	  // captured parameters from the layer, keys and values
	  var keys = layer.keys;

	  // fast track
	  if (!keys || keys.length === 0) {
	    return done();
	  }

	  var i = 0;
	  var name;
	  var paramIndex = 0;
	  var key;
	  var paramVal;
	  var paramCallbacks;
	  var paramCalled;

	  // process params in order
	  // param callbacks can be async
	  function param(err) {
	    if (err) {
	      return done(err);
	    }

	    if (i >= keys.length ) {
	      return done();
	    }

	    paramIndex = 0;
	    key = keys[i++];

	    if (!key) {
	      return done();
	    }

	    name = key.name;
	    paramVal = req.params[name];
	    paramCallbacks = params[name];
	    paramCalled = called[name];

	    if (paramVal === undefined || !paramCallbacks) {
	      return param();
	    }

	    // param previously called with same value or error occurred
	    if (paramCalled && (paramCalled.match === paramVal
	      || (paramCalled.error && paramCalled.error !== 'route'))) {
	      // restore value
	      req.params[name] = paramCalled.value;

	      // next param
	      return param(paramCalled.error);
	    }

	    called[name] = paramCalled = {
	      error: null,
	      match: paramVal,
	      value: paramVal
	    };

	    paramCallback();
	  }

	  // single param callbacks
	  function paramCallback(err) {
	    var fn = paramCallbacks[paramIndex++];

	    // store updated value
	    paramCalled.value = req.params[key.name];

	    if (err) {
	      // store error
	      paramCalled.error = err;
	      param(err);
	      return;
	    }

	    if (!fn) return param();

	    try {
	      fn(req, res, paramCallback, paramVal, key.name);
	    } catch (e) {
	      paramCallback(e);
	    }
	  }

	  param();
	};

	/**
	 * Use the given middleware function, with optional path, defaulting to "/".
	 *
	 * Use (like `.all`) will run for any http METHOD, but it will not add
	 * handlers for those methods so OPTIONS requests will not consider `.use`
	 * functions even if they could respond.
	 *
	 * The other difference is that _route_ path is stripped and not visible
	 * to the handler function. The main effect of this feature is that mounted
	 * handlers can operate without any code changes regardless of the "prefix"
	 * pathname.
	 *
	 * @public
	 */

	proto.use = function use(fn) {
	  var offset = 0;
	  var path = '/';

	  // default path to '/'
	  // disambiguate router.use([fn])
	  if (typeof fn !== 'function') {
	    var arg = fn;

	    while (Array.isArray(arg) && arg.length !== 0) {
	      arg = arg[0];
	    }

	    // first arg is the path
	    if (typeof arg !== 'function') {
	      offset = 1;
	      path = fn;
	    }
	  }

	  var callbacks = flatten(slice.call(arguments, offset));

	  if (callbacks.length === 0) {
	    throw new TypeError('Router.use() requires middleware functions');
	  }

	  for (var i = 0; i < callbacks.length; i++) {
	    var fn = callbacks[i];

	    if (typeof fn !== 'function') {
	      throw new TypeError('Router.use() requires middleware function but got a ' + gettype(fn));
	    }

	    // add the middleware
	    debug('use %s %s', path, fn.name || '<anonymous>');

	    var layer = new Layer(path, {
	      sensitive: this.caseSensitive,
	      strict: false,
	      end: false
	    }, fn);

	    layer.route = undefined;

	    this.stack.push(layer);
	  }

	  return this;
	};

	/**
	 * Create a new Route for the given path.
	 *
	 * Each route contains a separate middleware stack and VERB handlers.
	 *
	 * See the Route api documentation for details on adding handlers
	 * and middleware to routes.
	 *
	 * @param {String} path
	 * @return {Route}
	 * @public
	 */

	proto.route = function route(path) {
	  var route = new Route(path);

	  var layer = new Layer(path, {
	    sensitive: this.caseSensitive,
	    strict: this.strict,
	    end: true
	  }, route.dispatch.bind(route));

	  layer.route = route;

	  this.stack.push(layer);
	  return route;
	};

	// create Router#VERB functions
	methods.concat('all').forEach(function(method){
	  proto[method] = function(path){
	    var route = this.route(path)
	    route[method].apply(route, slice.call(arguments, 1));
	    return this;
	  };
	});

	// append methods to a list of methods
	function appendMethods(list, addition) {
	  for (var i = 0; i < addition.length; i++) {
	    var method = addition[i];
	    if (list.indexOf(method) === -1) {
	      list.push(method);
	    }
	  }
	}

	// get pathname of request
	function getPathname(req) {
	  try {
	    return parseUrl(req).pathname;
	  } catch (err) {
	    return undefined;
	  }
	}

	// get type for error message
	function gettype(obj) {
	  var type = typeof obj;

	  if (type !== 'object') {
	    return type;
	  }

	  // inspect [[Class]] for objects
	  return toString.call(obj)
	    .replace(objectRegExp, '$1');
	}

	/**
	 * Match path to a layer.
	 *
	 * @param {Layer} layer
	 * @param {string} path
	 * @private
	 */

	function matchLayer(layer, path) {
	  try {
	    return layer.match(path);
	  } catch (err) {
	    return err;
	  }
	}

	// merge params with parent params
	function mergeParams(params, parent) {
	  if (typeof parent !== 'object' || !parent) {
	    return params;
	  }

	  // make copy of parent for base
	  var obj = mixin({}, parent);

	  // simple non-numeric merging
	  if (!(0 in params) || !(0 in parent)) {
	    return mixin(obj, params);
	  }

	  var i = 0;
	  var o = 0;

	  // determine numeric gaps
	  while (i in params) {
	    i++;
	  }

	  while (o in parent) {
	    o++;
	  }

	  // offset numeric indices in params before merge
	  for (i--; i >= 0; i--) {
	    params[i + o] = params[i];

	    // create holes for the merge when necessary
	    if (i < o) {
	      delete params[i];
	    }
	  }

	  return mixin(obj, params);
	}

	// restore obj props after function
	function restore(fn, obj) {
	  var props = new Array(arguments.length - 2);
	  var vals = new Array(arguments.length - 2);

	  for (var i = 0; i < props.length; i++) {
	    props[i] = arguments[i + 2];
	    vals[i] = obj[props[i]];
	  }

	  return function(err){
	    // restore vals
	    for (var i = 0; i < props.length; i++) {
	      obj[props[i]] = vals[i];
	    }

	    return fn.apply(this, arguments);
	  };
	}

	// send an OPTIONS response
	function sendOptionsResponse(res, options, next) {
	  try {
	    var body = options.join(',');
	    res.set('Allow', body);
	    res.send(body);
	  } catch (err) {
	    next(err);
	  }
	}

	// wrap a function
	function wrap(old, fn) {
	  return function proxy() {
	    var args = new Array(arguments.length + 1);

	    args[0] = old;
	    for (var i = 0, len = arguments.length; i < len; i++) {
	      args[i + 1] = arguments[i];
	    }

	    fn.apply(this, args);
	  };
	}


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @private
	 */

	var debug = __webpack_require__(23)('express:router:route');
	var flatten = __webpack_require__(36);
	var Layer = __webpack_require__(37);
	var methods = __webpack_require__(39);

	/**
	 * Module variables.
	 * @private
	 */

	var slice = Array.prototype.slice;
	var toString = Object.prototype.toString;

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = Route;

	/**
	 * Initialize `Route` with the given `path`,
	 *
	 * @param {String} path
	 * @public
	 */

	function Route(path) {
	  this.path = path;
	  this.stack = [];

	  debug('new %s', path);

	  // route handlers for various http methods
	  this.methods = {};
	}

	/**
	 * Determine if the route handles a given method.
	 * @private
	 */

	Route.prototype._handles_method = function _handles_method(method) {
	  if (this.methods._all) {
	    return true;
	  }

	  var name = method.toLowerCase();

	  if (name === 'head' && !this.methods['head']) {
	    name = 'get';
	  }

	  return Boolean(this.methods[name]);
	};

	/**
	 * @return {Array} supported HTTP methods
	 * @private
	 */

	Route.prototype._options = function _options() {
	  var methods = Object.keys(this.methods);

	  // append automatic head
	  if (this.methods.get && !this.methods.head) {
	    methods.push('head');
	  }

	  for (var i = 0; i < methods.length; i++) {
	    // make upper case
	    methods[i] = methods[i].toUpperCase();
	  }

	  return methods;
	};

	/**
	 * dispatch req, res into this route
	 * @private
	 */

	Route.prototype.dispatch = function dispatch(req, res, done) {
	  var idx = 0;
	  var stack = this.stack;
	  if (stack.length === 0) {
	    return done();
	  }

	  var method = req.method.toLowerCase();
	  if (method === 'head' && !this.methods['head']) {
	    method = 'get';
	  }

	  req.route = this;

	  next();

	  function next(err) {
	    if (err && err === 'route') {
	      return done();
	    }

	    var layer = stack[idx++];
	    if (!layer) {
	      return done(err);
	    }

	    if (layer.method && layer.method !== method) {
	      return next(err);
	    }

	    if (err) {
	      layer.handle_error(err, req, res, next);
	    } else {
	      layer.handle_request(req, res, next);
	    }
	  }
	};

	/**
	 * Add a handler for all HTTP verbs to this route.
	 *
	 * Behaves just like middleware and can respond or call `next`
	 * to continue processing.
	 *
	 * You can use multiple `.all` call to add multiple handlers.
	 *
	 *   function check_something(req, res, next){
	 *     next();
	 *   };
	 *
	 *   function validate_user(req, res, next){
	 *     next();
	 *   };
	 *
	 *   route
	 *   .all(validate_user)
	 *   .all(check_something)
	 *   .get(function(req, res, next){
	 *     res.send('hello world');
	 *   });
	 *
	 * @param {function} handler
	 * @return {Route} for chaining
	 * @api public
	 */

	Route.prototype.all = function all() {
	  var handles = flatten(slice.call(arguments));

	  for (var i = 0; i < handles.length; i++) {
	    var handle = handles[i];

	    if (typeof handle !== 'function') {
	      var type = toString.call(handle);
	      var msg = 'Route.all() requires callback functions but got a ' + type;
	      throw new TypeError(msg);
	    }

	    var layer = Layer('/', {}, handle);
	    layer.method = undefined;

	    this.methods._all = true;
	    this.stack.push(layer);
	  }

	  return this;
	};

	methods.forEach(function(method){
	  Route.prototype[method] = function(){
	    var handles = flatten(slice.call(arguments));

	    for (var i = 0; i < handles.length; i++) {
	      var handle = handles[i];

	      if (typeof handle !== 'function') {
	        var type = toString.call(handle);
	        var msg = 'Route.' + method + '() requires callback functions but got a ' + type;
	        throw new Error(msg);
	      }

	      debug('%s %s', method, this.path);

	      var layer = Layer('/', {}, handle);
	      layer.method = method;

	      this.methods[method] = true;
	      this.stack.push(layer);
	    }

	    return this;
	  };
	});


/***/ },
/* 36 */
/***/ function(module, exports) {

	'use strict'

	/**
	 * Expose `arrayFlatten`.
	 */
	module.exports = arrayFlatten

	/**
	 * Recursive flatten function with depth.
	 *
	 * @param  {Array}  array
	 * @param  {Array}  result
	 * @param  {Number} depth
	 * @return {Array}
	 */
	function flattenWithDepth (array, result, depth) {
	  for (var i = 0; i < array.length; i++) {
	    var value = array[i]

	    if (depth > 0 && Array.isArray(value)) {
	      flattenWithDepth(value, result, depth - 1)
	    } else {
	      result.push(value)
	    }
	  }

	  return result
	}

	/**
	 * Recursive flatten function. Omitting depth is slightly faster.
	 *
	 * @param  {Array} array
	 * @param  {Array} result
	 * @return {Array}
	 */
	function flattenForever (array, result) {
	  for (var i = 0; i < array.length; i++) {
	    var value = array[i]

	    if (Array.isArray(value)) {
	      flattenForever(value, result)
	    } else {
	      result.push(value)
	    }
	  }

	  return result
	}

	/**
	 * Flatten an array, with the ability to define a depth.
	 *
	 * @param  {Array}  array
	 * @param  {Number} depth
	 * @return {Array}
	 */
	function arrayFlatten (array, depth) {
	  if (depth == null) {
	    return flattenForever(array, [])
	  }

	  return flattenWithDepth(array, [], depth)
	}


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @private
	 */

	var pathRegexp = __webpack_require__(38);
	var debug = __webpack_require__(23)('express:router:layer');

	/**
	 * Module variables.
	 * @private
	 */

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = Layer;

	function Layer(path, options, fn) {
	  if (!(this instanceof Layer)) {
	    return new Layer(path, options, fn);
	  }

	  debug('new %s', path);
	  var opts = options || {};

	  this.handle = fn;
	  this.name = fn.name || '<anonymous>';
	  this.params = undefined;
	  this.path = undefined;
	  this.regexp = pathRegexp(path, this.keys = [], opts);

	  if (path === '/' && opts.end === false) {
	    this.regexp.fast_slash = true;
	  }
	}

	/**
	 * Handle the error for the layer.
	 *
	 * @param {Error} error
	 * @param {Request} req
	 * @param {Response} res
	 * @param {function} next
	 * @api private
	 */

	Layer.prototype.handle_error = function handle_error(error, req, res, next) {
	  var fn = this.handle;

	  if (fn.length !== 4) {
	    // not a standard error handler
	    return next(error);
	  }

	  try {
	    fn(error, req, res, next);
	  } catch (err) {
	    next(err);
	  }
	};

	/**
	 * Handle the request for the layer.
	 *
	 * @param {Request} req
	 * @param {Response} res
	 * @param {function} next
	 * @api private
	 */

	Layer.prototype.handle_request = function handle(req, res, next) {
	  var fn = this.handle;

	  if (fn.length > 3) {
	    // not a standard request handler
	    return next();
	  }

	  try {
	    fn(req, res, next);
	  } catch (err) {
	    next(err);
	  }
	};

	/**
	 * Check if this route matches `path`, if so
	 * populate `.params`.
	 *
	 * @param {String} path
	 * @return {Boolean}
	 * @api private
	 */

	Layer.prototype.match = function match(path) {
	  if (path == null) {
	    // no path, nothing matches
	    this.params = undefined;
	    this.path = undefined;
	    return false;
	  }

	  if (this.regexp.fast_slash) {
	    // fast path non-ending match for / (everything matches)
	    this.params = {};
	    this.path = '';
	    return true;
	  }

	  var m = this.regexp.exec(path);

	  if (!m) {
	    this.params = undefined;
	    this.path = undefined;
	    return false;
	  }

	  // store values
	  this.params = {};
	  this.path = m[0];

	  var keys = this.keys;
	  var params = this.params;

	  for (var i = 1; i < m.length; i++) {
	    var key = keys[i - 1];
	    var prop = key.name;
	    var val = decode_param(m[i]);

	    if (val !== undefined || !(hasOwnProperty.call(params, prop))) {
	      params[prop] = val;
	    }
	  }

	  return true;
	};

	/**
	 * Decode param value.
	 *
	 * @param {string} val
	 * @return {string}
	 * @private
	 */

	function decode_param(val) {
	  if (typeof val !== 'string' || val.length === 0) {
	    return val;
	  }

	  try {
	    return decodeURIComponent(val);
	  } catch (err) {
	    if (err instanceof URIError) {
	      err.message = 'Failed to decode param \'' + val + '\'';
	      err.status = err.statusCode = 400;
	    }

	    throw err;
	  }
	}


/***/ },
/* 38 */
/***/ function(module, exports) {

	/**
	 * Expose `pathtoRegexp`.
	 */

	module.exports = pathtoRegexp;

	/**
	 * Match matching groups in a regular expression.
	 */
	var MATCHING_GROUP_REGEXP = /\((?!\?)/g;

	/**
	 * Normalize the given path string,
	 * returning a regular expression.
	 *
	 * An empty array should be passed,
	 * which will contain the placeholder
	 * key names. For example "/user/:id" will
	 * then contain ["id"].
	 *
	 * @param  {String|RegExp|Array} path
	 * @param  {Array} keys
	 * @param  {Object} options
	 * @return {RegExp}
	 * @api private
	 */

	function pathtoRegexp(path, keys, options) {
	  options = options || {};
	  keys = keys || [];
	  var strict = options.strict;
	  var end = options.end !== false;
	  var flags = options.sensitive ? '' : 'i';
	  var extraOffset = 0;
	  var keysOffset = keys.length;
	  var i = 0;
	  var name = 0;
	  var m;

	  if (path instanceof RegExp) {
	    while (m = MATCHING_GROUP_REGEXP.exec(path.source)) {
	      keys.push({
	        name: name++,
	        optional: false,
	        offset: m.index
	      });
	    }

	    return path;
	  }

	  if (Array.isArray(path)) {
	    // Map array parts into regexps and return their source. We also pass
	    // the same keys and options instance into every generation to get
	    // consistent matching groups before we join the sources together.
	    path = path.map(function (value) {
	      return pathtoRegexp(value, keys, options).source;
	    });

	    return new RegExp('(?:' + path.join('|') + ')', flags);
	  }

	  path = ('^' + path + (strict ? '' : path[path.length - 1] === '/' ? '?' : '/?'))
	    .replace(/\/\(/g, '/(?:')
	    .replace(/([\/\.])/g, '\\$1')
	    .replace(/(\\\/)?(\\\.)?:(\w+)(\(.*?\))?(\*)?(\?)?/g, function (match, slash, format, key, capture, star, optional, offset) {
	      slash = slash || '';
	      format = format || '';
	      capture = capture || '([^\\/' + format + ']+?)';
	      optional = optional || '';

	      keys.push({
	        name: key,
	        optional: !!optional,
	        offset: offset + extraOffset
	      });

	      var result = ''
	        + (optional ? '' : slash)
	        + '(?:'
	        + format + (optional ? slash : '') + capture
	        + (star ? '((?:[\\/' + format + '].+?)?)' : '')
	        + ')'
	        + optional;

	      extraOffset += result.length - match.length;

	      return result;
	    })
	    .replace(/\*/g, function (star, index) {
	      var len = keys.length

	      while (len-- > keysOffset && keys[len].offset > index) {
	        keys[len].offset += 3; // Replacement length minus asterisk length.
	      }

	      return '(.*)';
	    });

	  // This is a workaround for handling unnamed matching groups.
	  while (m = MATCHING_GROUP_REGEXP.exec(path)) {
	    var escapeCount = 0;
	    var index = m.index;

	    while (path.charAt(--index) === '\\') {
	      escapeCount++;
	    }

	    // It's possible to escape the bracket.
	    if (escapeCount % 2 === 1) {
	      continue;
	    }

	    if (keysOffset + i === keys.length || keys[keysOffset + i].offset > m.index) {
	      keys.splice(keysOffset + i, 0, {
	        name: name++, // Unnamed matching groups must be consistently linear.
	        optional: false,
	        offset: m.index
	      });
	    }

	    i++;
	  }

	  // If the path is non-ending, match until the end or a slash.
	  path += (end ? '$' : (path[path.length - 1] === '/' ? '' : '(?=\\/|$)'));

	  return new RegExp(path, flags);
	};


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * methods
	 * Copyright(c) 2013-2014 TJ Holowaychuk
	 * Copyright(c) 2015-2016 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @private
	 */

	var http = __webpack_require__(30);

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = getCurrentNodeMethods() || getBasicNodeMethods();

	/**
	 * Get the current Node.js methods.
	 * @private
	 */

	function getCurrentNodeMethods() {
	  return http.METHODS && http.METHODS.map(function lowerCaseMethod(method) {
	    return method.toLowerCase();
	  });
	}

	/**
	 * Get the "basic" Node.js methods, a snapshot from Node.js 0.10.
	 * @private
	 */

	function getBasicNodeMethods() {
	  return [
	    'get',
	    'post',
	    'put',
	    'head',
	    'delete',
	    'options',
	    'trace',
	    'copy',
	    'lock',
	    'mkcol',
	    'move',
	    'purge',
	    'propfind',
	    'proppatch',
	    'unlock',
	    'report',
	    'mkactivity',
	    'checkout',
	    'merge',
	    'm-search',
	    'notify',
	    'subscribe',
	    'unsubscribe',
	    'patch',
	    'search',
	    'connect'
	  ];
	}


/***/ },
/* 40 */
/***/ function(module, exports) {

	/**
	 * Merge object b with object a.
	 *
	 *     var a = { foo: 'bar' }
	 *       , b = { bar: 'baz' };
	 *
	 *     merge(a, b);
	 *     // => { foo: 'bar', bar: 'baz' }
	 *
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Object}
	 * @api public
	 */

	exports = module.exports = function(a, b){
	  if (a && b) {
	    for (var key in b) {
	      a[key] = b[key];
	    }
	  }
	  return a;
	};


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * depd
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var callSiteToString = __webpack_require__(42).callSiteToString
	var eventListenerCount = __webpack_require__(42).eventListenerCount
	var relative = __webpack_require__(16).relative

	/**
	 * Module exports.
	 */

	module.exports = depd

	/**
	 * Get the path to base files on.
	 */

	var basePath = process.cwd()

	/**
	 * Determine if namespace is contained in the string.
	 */

	function containsNamespace(str, namespace) {
	  var val = str.split(/[ ,]+/)

	  namespace = String(namespace).toLowerCase()

	  for (var i = 0 ; i < val.length; i++) {
	    if (!(str = val[i])) continue;

	    // namespace contained
	    if (str === '*' || str.toLowerCase() === namespace) {
	      return true
	    }
	  }

	  return false
	}

	/**
	 * Convert a data descriptor to accessor descriptor.
	 */

	function convertDataDescriptorToAccessor(obj, prop, message) {
	  var descriptor = Object.getOwnPropertyDescriptor(obj, prop)
	  var value = descriptor.value

	  descriptor.get = function getter() { return value }

	  if (descriptor.writable) {
	    descriptor.set = function setter(val) { return value = val }
	  }

	  delete descriptor.value
	  delete descriptor.writable

	  Object.defineProperty(obj, prop, descriptor)

	  return descriptor
	}

	/**
	 * Create arguments string to keep arity.
	 */

	function createArgumentsString(arity) {
	  var str = ''

	  for (var i = 0; i < arity; i++) {
	    str += ', arg' + i
	  }

	  return str.substr(2)
	}

	/**
	 * Create stack string from stack.
	 */

	function createStackString(stack) {
	  var str = this.name + ': ' + this.namespace

	  if (this.message) {
	    str += ' deprecated ' + this.message
	  }

	  for (var i = 0; i < stack.length; i++) {
	    str += '\n    at ' + callSiteToString(stack[i])
	  }

	  return str
	}

	/**
	 * Create deprecate for namespace in caller.
	 */

	function depd(namespace) {
	  if (!namespace) {
	    throw new TypeError('argument namespace is required')
	  }

	  var stack = getStack()
	  var site = callSiteLocation(stack[1])
	  var file = site[0]

	  function deprecate(message) {
	    // call to self as log
	    log.call(deprecate, message)
	  }

	  deprecate._file = file
	  deprecate._ignored = isignored(namespace)
	  deprecate._namespace = namespace
	  deprecate._traced = istraced(namespace)
	  deprecate._warned = Object.create(null)

	  deprecate.function = wrapfunction
	  deprecate.property = wrapproperty

	  return deprecate
	}

	/**
	 * Determine if namespace is ignored.
	 */

	function isignored(namespace) {
	  /* istanbul ignore next: tested in a child processs */
	  if (process.noDeprecation) {
	    // --no-deprecation support
	    return true
	  }

	  var str = process.env.NO_DEPRECATION || ''

	  // namespace ignored
	  return containsNamespace(str, namespace)
	}

	/**
	 * Determine if namespace is traced.
	 */

	function istraced(namespace) {
	  /* istanbul ignore next: tested in a child processs */
	  if (process.traceDeprecation) {
	    // --trace-deprecation support
	    return true
	  }

	  var str = process.env.TRACE_DEPRECATION || ''

	  // namespace traced
	  return containsNamespace(str, namespace)
	}

	/**
	 * Display deprecation message.
	 */

	function log(message, site) {
	  var haslisteners = eventListenerCount(process, 'deprecation') !== 0

	  // abort early if no destination
	  if (!haslisteners && this._ignored) {
	    return
	  }

	  var caller
	  var callFile
	  var callSite
	  var i = 0
	  var seen = false
	  var stack = getStack()
	  var file = this._file

	  if (site) {
	    // provided site
	    callSite = callSiteLocation(stack[1])
	    callSite.name = site.name
	    file = callSite[0]
	  } else {
	    // get call site
	    i = 2
	    site = callSiteLocation(stack[i])
	    callSite = site
	  }

	  // get caller of deprecated thing in relation to file
	  for (; i < stack.length; i++) {
	    caller = callSiteLocation(stack[i])
	    callFile = caller[0]

	    if (callFile === file) {
	      seen = true
	    } else if (callFile === this._file) {
	      file = this._file
	    } else if (seen) {
	      break
	    }
	  }

	  var key = caller
	    ? site.join(':') + '__' + caller.join(':')
	    : undefined

	  if (key !== undefined && key in this._warned) {
	    // already warned
	    return
	  }

	  this._warned[key] = true

	  // generate automatic message from call site
	  if (!message) {
	    message = callSite === site || !callSite.name
	      ? defaultMessage(site)
	      : defaultMessage(callSite)
	  }

	  // emit deprecation if listeners exist
	  if (haslisteners) {
	    var err = DeprecationError(this._namespace, message, stack.slice(i))
	    process.emit('deprecation', err)
	    return
	  }

	  // format and write message
	  var format = process.stderr.isTTY
	    ? formatColor
	    : formatPlain
	  var msg = format.call(this, message, caller, stack.slice(i))
	  process.stderr.write(msg + '\n', 'utf8')

	  return
	}

	/**
	 * Get call site location as array.
	 */

	function callSiteLocation(callSite) {
	  var file = callSite.getFileName() || '<anonymous>'
	  var line = callSite.getLineNumber()
	  var colm = callSite.getColumnNumber()

	  if (callSite.isEval()) {
	    file = callSite.getEvalOrigin() + ', ' + file
	  }

	  var site = [file, line, colm]

	  site.callSite = callSite
	  site.name = callSite.getFunctionName()

	  return site
	}

	/**
	 * Generate a default message from the site.
	 */

	function defaultMessage(site) {
	  var callSite = site.callSite
	  var funcName = site.name

	  // make useful anonymous name
	  if (!funcName) {
	    funcName = '<anonymous@' + formatLocation(site) + '>'
	  }

	  var context = callSite.getThis()
	  var typeName = context && callSite.getTypeName()

	  // ignore useless type name
	  if (typeName === 'Object') {
	    typeName = undefined
	  }

	  // make useful type name
	  if (typeName === 'Function') {
	    typeName = context.name || typeName
	  }

	  return typeName && callSite.getMethodName()
	    ? typeName + '.' + funcName
	    : funcName
	}

	/**
	 * Format deprecation message without color.
	 */

	function formatPlain(msg, caller, stack) {
	  var timestamp = new Date().toUTCString()

	  var formatted = timestamp
	    + ' ' + this._namespace
	    + ' deprecated ' + msg

	  // add stack trace
	  if (this._traced) {
	    for (var i = 0; i < stack.length; i++) {
	      formatted += '\n    at ' + callSiteToString(stack[i])
	    }

	    return formatted
	  }

	  if (caller) {
	    formatted += ' at ' + formatLocation(caller)
	  }

	  return formatted
	}

	/**
	 * Format deprecation message with color.
	 */

	function formatColor(msg, caller, stack) {
	  var formatted = '\x1b[36;1m' + this._namespace + '\x1b[22;39m' // bold cyan
	    + ' \x1b[33;1mdeprecated\x1b[22;39m' // bold yellow
	    + ' \x1b[0m' + msg + '\x1b[39m' // reset

	  // add stack trace
	  if (this._traced) {
	    for (var i = 0; i < stack.length; i++) {
	      formatted += '\n    \x1b[36mat ' + callSiteToString(stack[i]) + '\x1b[39m' // cyan
	    }

	    return formatted
	  }

	  if (caller) {
	    formatted += ' \x1b[36m' + formatLocation(caller) + '\x1b[39m' // cyan
	  }

	  return formatted
	}

	/**
	 * Format call site location.
	 */

	function formatLocation(callSite) {
	  return relative(basePath, callSite[0])
	    + ':' + callSite[1]
	    + ':' + callSite[2]
	}

	/**
	 * Get the stack as array of call sites.
	 */

	function getStack() {
	  var limit = Error.stackTraceLimit
	  var obj = {}
	  var prep = Error.prepareStackTrace

	  Error.prepareStackTrace = prepareObjectStackTrace
	  Error.stackTraceLimit = Math.max(10, limit)

	  // capture the stack
	  Error.captureStackTrace(obj)

	  // slice this function off the top
	  var stack = obj.stack.slice(1)

	  Error.prepareStackTrace = prep
	  Error.stackTraceLimit = limit

	  return stack
	}

	/**
	 * Capture call site stack from v8.
	 */

	function prepareObjectStackTrace(obj, stack) {
	  return stack
	}

	/**
	 * Return a wrapped function in a deprecation message.
	 */

	function wrapfunction(fn, message) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('argument fn must be a function')
	  }

	  var args = createArgumentsString(fn.length)
	  var deprecate = this
	  var stack = getStack()
	  var site = callSiteLocation(stack[1])

	  site.name = fn.name

	  var deprecatedfn = eval('(function (' + args + ') {\n'
	    + '"use strict"\n'
	    + 'log.call(deprecate, message, site)\n'
	    + 'return fn.apply(this, arguments)\n'
	    + '})')

	  return deprecatedfn
	}

	/**
	 * Wrap property in a deprecation message.
	 */

	function wrapproperty(obj, prop, message) {
	  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
	    throw new TypeError('argument obj must be object')
	  }

	  var descriptor = Object.getOwnPropertyDescriptor(obj, prop)

	  if (!descriptor) {
	    throw new TypeError('must call property on owner object')
	  }

	  if (!descriptor.configurable) {
	    throw new TypeError('property must be configurable')
	  }

	  var deprecate = this
	  var stack = getStack()
	  var site = callSiteLocation(stack[1])

	  // set site name
	  site.name = prop

	  // convert data descriptor
	  if ('value' in descriptor) {
	    descriptor = convertDataDescriptorToAccessor(obj, prop, message)
	  }

	  var get = descriptor.get
	  var set = descriptor.set

	  // wrap getter
	  if (typeof get === 'function') {
	    descriptor.get = function getter() {
	      log.call(deprecate, message, site)
	      return get.apply(this, arguments)
	    }
	  }

	  // wrap setter
	  if (typeof set === 'function') {
	    descriptor.set = function setter() {
	      log.call(deprecate, message, site)
	      return set.apply(this, arguments)
	    }
	  }

	  Object.defineProperty(obj, prop, descriptor)
	}

	/**
	 * Create DeprecationError for deprecation
	 */

	function DeprecationError(namespace, message, stack) {
	  var error = new Error()
	  var stackString

	  Object.defineProperty(error, 'constructor', {
	    value: DeprecationError
	  })

	  Object.defineProperty(error, 'message', {
	    configurable: true,
	    enumerable: false,
	    value: message,
	    writable: true
	  })

	  Object.defineProperty(error, 'name', {
	    enumerable: false,
	    configurable: true,
	    value: 'DeprecationError',
	    writable: true
	  })

	  Object.defineProperty(error, 'namespace', {
	    configurable: true,
	    enumerable: false,
	    value: namespace,
	    writable: true
	  })

	  Object.defineProperty(error, 'stack', {
	    configurable: true,
	    enumerable: false,
	    get: function () {
	      if (stackString !== undefined) {
	        return stackString
	      }

	      // prepare stack trace
	      return stackString = createStackString.call(this, stack)
	    },
	    set: function setter(val) {
	      stackString = val
	    }
	  })

	  return error
	}


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * depd
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 * @private
	 */

	var Buffer = __webpack_require__(43)
	var EventEmitter = __webpack_require__(19).EventEmitter

	/**
	 * Module exports.
	 * @public
	 */

	lazyProperty(module.exports, 'bufferConcat', function bufferConcat() {
	  return Buffer.concat || __webpack_require__(44)
	})

	lazyProperty(module.exports, 'callSiteToString', function callSiteToString() {
	  var limit = Error.stackTraceLimit
	  var obj = {}
	  var prep = Error.prepareStackTrace

	  function prepareObjectStackTrace(obj, stack) {
	    return stack
	  }

	  Error.prepareStackTrace = prepareObjectStackTrace
	  Error.stackTraceLimit = 2

	  // capture the stack
	  Error.captureStackTrace(obj)

	  // slice the stack
	  var stack = obj.stack.slice()

	  Error.prepareStackTrace = prep
	  Error.stackTraceLimit = limit

	  return stack[0].toString ? toString : __webpack_require__(45)
	})

	lazyProperty(module.exports, 'eventListenerCount', function eventListenerCount() {
	  return EventEmitter.listenerCount || __webpack_require__(46)
	})

	/**
	 * Define a lazy property.
	 */

	function lazyProperty(obj, prop, getter) {
	  function get() {
	    var val = getter()

	    Object.defineProperty(obj, prop, {
	      configurable: true,
	      enumerable: true,
	      value: val
	    })

	    return val
	  }

	  Object.defineProperty(obj, prop, {
	    configurable: true,
	    enumerable: true,
	    get: get
	  })
	}

	/**
	 * Call toString() on the obj
	 */

	function toString(obj) {
	  return obj.toString()
	}


/***/ },
/* 43 */
/***/ function(module, exports) {

	module.exports = require("buffer");

/***/ },
/* 44 */
/***/ function(module, exports) {

	/*!
	 * depd
	 * Copyright(c) 2014 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 */

	module.exports = bufferConcat

	/**
	 * Concatenate an array of Buffers.
	 */

	function bufferConcat(bufs) {
	  var length = 0

	  for (var i = 0, len = bufs.length; i < len; i++) {
	    length += bufs[i].length
	  }

	  var buf = new Buffer(length)
	  var pos = 0

	  for (var i = 0, len = bufs.length; i < len; i++) {
	    bufs[i].copy(buf, pos)
	    pos += bufs[i].length
	  }

	  return buf
	}


/***/ },
/* 45 */
/***/ function(module, exports) {

	/*!
	 * depd
	 * Copyright(c) 2014 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 */

	module.exports = callSiteToString

	/**
	 * Format a CallSite file location to a string.
	 */

	function callSiteFileLocation(callSite) {
	  var fileName
	  var fileLocation = ''

	  if (callSite.isNative()) {
	    fileLocation = 'native'
	  } else if (callSite.isEval()) {
	    fileName = callSite.getScriptNameOrSourceURL()
	    if (!fileName) {
	      fileLocation = callSite.getEvalOrigin()
	    }
	  } else {
	    fileName = callSite.getFileName()
	  }

	  if (fileName) {
	    fileLocation += fileName

	    var lineNumber = callSite.getLineNumber()
	    if (lineNumber != null) {
	      fileLocation += ':' + lineNumber

	      var columnNumber = callSite.getColumnNumber()
	      if (columnNumber) {
	        fileLocation += ':' + columnNumber
	      }
	    }
	  }

	  return fileLocation || 'unknown source'
	}

	/**
	 * Format a CallSite to a string.
	 */

	function callSiteToString(callSite) {
	  var addSuffix = true
	  var fileLocation = callSiteFileLocation(callSite)
	  var functionName = callSite.getFunctionName()
	  var isConstructor = callSite.isConstructor()
	  var isMethodCall = !(callSite.isToplevel() || isConstructor)
	  var line = ''

	  if (isMethodCall) {
	    var methodName = callSite.getMethodName()
	    var typeName = getConstructorName(callSite)

	    if (functionName) {
	      if (typeName && functionName.indexOf(typeName) !== 0) {
	        line += typeName + '.'
	      }

	      line += functionName

	      if (methodName && functionName.lastIndexOf('.' + methodName) !== functionName.length - methodName.length - 1) {
	        line += ' [as ' + methodName + ']'
	      }
	    } else {
	      line += typeName + '.' + (methodName || '<anonymous>')
	    }
	  } else if (isConstructor) {
	    line += 'new ' + (functionName || '<anonymous>')
	  } else if (functionName) {
	    line += functionName
	  } else {
	    addSuffix = false
	    line += fileLocation
	  }

	  if (addSuffix) {
	    line += ' (' + fileLocation + ')'
	  }

	  return line
	}

	/**
	 * Get constructor name of reviver.
	 */

	function getConstructorName(obj) {
	  var receiver = obj.receiver
	  return (receiver.constructor && receiver.constructor.name) || null
	}


/***/ },
/* 46 */
/***/ function(module, exports) {

	/*!
	 * depd
	 * Copyright(c) 2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = eventListenerCount

	/**
	 * Get the count of listeners on an event emitter of a specific type.
	 */

	function eventListenerCount(emitter, type) {
	  return emitter.listeners(type).length
	}


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * parseurl
	 * Copyright(c) 2014 Jonathan Ong
	 * Copyright(c) 2014 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 */

	var url = __webpack_require__(48)
	var parse = url.parse
	var Url = url.Url

	/**
	 * Pattern for a simple path case.
	 * See: https://github.com/joyent/node/pull/7878
	 */

	var simplePathRegExp = /^(\/\/?(?!\/)[^\?#\s]*)(\?[^#\s]*)?$/

	/**
	 * Exports.
	 */

	module.exports = parseurl
	module.exports.original = originalurl

	/**
	 * Parse the `req` url with memoization.
	 *
	 * @param {ServerRequest} req
	 * @return {Object}
	 * @api public
	 */

	function parseurl(req) {
	  var url = req.url

	  if (url === undefined) {
	    // URL is undefined
	    return undefined
	  }

	  var parsed = req._parsedUrl

	  if (fresh(url, parsed)) {
	    // Return cached URL parse
	    return parsed
	  }

	  // Parse the URL
	  parsed = fastparse(url)
	  parsed._raw = url

	  return req._parsedUrl = parsed
	};

	/**
	 * Parse the `req` original url with fallback and memoization.
	 *
	 * @param {ServerRequest} req
	 * @return {Object}
	 * @api public
	 */

	function originalurl(req) {
	  var url = req.originalUrl

	  if (typeof url !== 'string') {
	    // Fallback
	    return parseurl(req)
	  }

	  var parsed = req._parsedOriginalUrl

	  if (fresh(url, parsed)) {
	    // Return cached URL parse
	    return parsed
	  }

	  // Parse the URL
	  parsed = fastparse(url)
	  parsed._raw = url

	  return req._parsedOriginalUrl = parsed
	};

	/**
	 * Parse the `str` url with fast-path short-cut.
	 *
	 * @param {string} str
	 * @return {Object}
	 * @api private
	 */

	function fastparse(str) {
	  // Try fast path regexp
	  // See: https://github.com/joyent/node/pull/7878
	  var simplePath = typeof str === 'string' && simplePathRegExp.exec(str)

	  // Construct simple URL
	  if (simplePath) {
	    var pathname = simplePath[1]
	    var search = simplePath[2] || null
	    var url = Url !== undefined
	      ? new Url()
	      : {}
	    url.path = str
	    url.href = str
	    url.pathname = pathname
	    url.search = search
	    url.query = search && search.substr(1)

	    return url
	  }

	  return parse(str)
	}

	/**
	 * Determine if parsed is still fresh for url.
	 *
	 * @param {string} url
	 * @param {object} parsedUrl
	 * @return {boolean}
	 * @api private
	 */

	function fresh(url, parsedUrl) {
	  return typeof parsedUrl === 'object'
	    && parsedUrl !== null
	    && (Url === undefined || parsedUrl instanceof Url)
	    && parsedUrl._raw === url
	}


/***/ },
/* 48 */
/***/ function(module, exports) {

	module.exports = require("url");

/***/ },
/* 49 */
/***/ function(module, exports) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Initialization middleware, exposing the
	 * request and response to each other, as well
	 * as defaulting the X-Powered-By header field.
	 *
	 * @param {Function} app
	 * @return {Function}
	 * @api private
	 */

	exports.init = function(app){
	  return function expressInit(req, res, next){
	    if (app.enabled('x-powered-by')) res.setHeader('X-Powered-By', 'Express');
	    req.res = res;
	    res.req = req;
	    req.next = next;

	    req.__proto__ = app.request;
	    res.__proto__ = app.response;

	    res.locals = res.locals || Object.create(null);

	    next();
	  };
	};



/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 */

	var parseUrl = __webpack_require__(47);
	var qs = __webpack_require__(51);

	/**
	 * @param {Object} options
	 * @return {Function}
	 * @api public
	 */

	module.exports = function query(options) {
	  var opts = Object.create(options || null);
	  var queryparse = qs.parse;

	  if (typeof options === 'function') {
	    queryparse = options;
	    opts = undefined;
	  }

	  if (opts !== undefined) {
	    if (opts.allowDots === undefined) {
	      opts.allowDots = false;
	    }

	    if (opts.allowPrototypes === undefined) {
	      opts.allowPrototypes = true;
	    }
	  }

	  return function query(req, res, next){
	    if (!req.query) {
	      var val = parseUrl(req).query;
	      req.query = queryparse(val, opts);
	    }

	    next();
	  };
	};


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Stringify = __webpack_require__(52);
	var Parse = __webpack_require__(54);


	// Declare internals

	var internals = {};


	module.exports = {
	    stringify: Stringify,
	    parse: Parse
	};


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Utils = __webpack_require__(53);


	// Declare internals

	var internals = {
	    delimiter: '&',
	    arrayPrefixGenerators: {
	        brackets: function (prefix, key) {

	            return prefix + '[]';
	        },
	        indices: function (prefix, key) {

	            return prefix + '[' + key + ']';
	        },
	        repeat: function (prefix, key) {

	            return prefix;
	        }
	    },
	    strictNullHandling: false
	};


	internals.stringify = function (obj, prefix, generateArrayPrefix, strictNullHandling, filter) {

	    if (typeof filter === 'function') {
	        obj = filter(prefix, obj);
	    }
	    else if (Utils.isBuffer(obj)) {
	        obj = obj.toString();
	    }
	    else if (obj instanceof Date) {
	        obj = obj.toISOString();
	    }
	    else if (obj === null) {
	        if (strictNullHandling) {
	            return Utils.encode(prefix);
	        }

	        obj = '';
	    }

	    if (typeof obj === 'string' ||
	        typeof obj === 'number' ||
	        typeof obj === 'boolean') {

	        return [Utils.encode(prefix) + '=' + Utils.encode(obj)];
	    }

	    var values = [];

	    if (typeof obj === 'undefined') {
	        return values;
	    }

	    var objKeys = Array.isArray(filter) ? filter : Object.keys(obj);
	    for (var i = 0, il = objKeys.length; i < il; ++i) {
	        var key = objKeys[i];

	        if (Array.isArray(obj)) {
	            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, filter));
	        }
	        else {
	            values = values.concat(internals.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix, strictNullHandling, filter));
	        }
	    }

	    return values;
	};


	module.exports = function (obj, options) {

	    options = options || {};
	    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
	    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;
	    var objKeys;
	    var filter;
	    if (typeof options.filter === 'function') {
	        filter = options.filter;
	        obj = filter('', obj);
	    }
	    else if (Array.isArray(options.filter)) {
	        objKeys = filter = options.filter;
	    }

	    var keys = [];

	    if (typeof obj !== 'object' ||
	        obj === null) {

	        return '';
	    }

	    var arrayFormat;
	    if (options.arrayFormat in internals.arrayPrefixGenerators) {
	        arrayFormat = options.arrayFormat;
	    }
	    else if ('indices' in options) {
	        arrayFormat = options.indices ? 'indices' : 'repeat';
	    }
	    else {
	        arrayFormat = 'indices';
	    }

	    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

	    if (!objKeys) {
	        objKeys = Object.keys(obj);
	    }
	    for (var i = 0, il = objKeys.length; i < il; ++i) {
	        var key = objKeys[i];
	        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix, strictNullHandling, filter));
	    }

	    return keys.join(delimiter);
	};


/***/ },
/* 53 */
/***/ function(module, exports) {

	// Load modules


	// Declare internals

	var internals = {};
	internals.hexTable = new Array(256);
	for (var h = 0; h < 256; ++h) {
	    internals.hexTable[h] = '%' + ((h < 16 ? '0' : '') + h.toString(16)).toUpperCase();
	}


	exports.arrayToObject = function (source, options) {

	    var obj = options.plainObjects ? Object.create(null) : {};
	    for (var i = 0, il = source.length; i < il; ++i) {
	        if (typeof source[i] !== 'undefined') {

	            obj[i] = source[i];
	        }
	    }

	    return obj;
	};


	exports.merge = function (target, source, options) {

	    if (!source) {
	        return target;
	    }

	    if (typeof source !== 'object') {
	        if (Array.isArray(target)) {
	            target.push(source);
	        }
	        else if (typeof target === 'object') {
	            target[source] = true;
	        }
	        else {
	            target = [target, source];
	        }

	        return target;
	    }

	    if (typeof target !== 'object') {
	        target = [target].concat(source);
	        return target;
	    }

	    if (Array.isArray(target) &&
	        !Array.isArray(source)) {

	        target = exports.arrayToObject(target, options);
	    }

	    var keys = Object.keys(source);
	    for (var k = 0, kl = keys.length; k < kl; ++k) {
	        var key = keys[k];
	        var value = source[key];

	        if (!Object.prototype.hasOwnProperty.call(target, key)) {
	            target[key] = value;
	        }
	        else {
	            target[key] = exports.merge(target[key], value, options);
	        }
	    }

	    return target;
	};


	exports.decode = function (str) {

	    try {
	        return decodeURIComponent(str.replace(/\+/g, ' '));
	    } catch (e) {
	        return str;
	    }
	};

	exports.encode = function (str) {

	    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
	    // It has been adapted here for stricter adherence to RFC 3986
	    if (str.length === 0) {
	        return str;
	    }

	    if (typeof str !== 'string') {
	        str = '' + str;
	    }

	    var out = '';
	    for (var i = 0, il = str.length; i < il; ++i) {
	        var c = str.charCodeAt(i);

	        if (c === 0x2D || // -
	            c === 0x2E || // .
	            c === 0x5F || // _
	            c === 0x7E || // ~
	            (c >= 0x30 && c <= 0x39) || // 0-9
	            (c >= 0x41 && c <= 0x5A) || // a-z
	            (c >= 0x61 && c <= 0x7A)) { // A-Z

	            out += str[i];
	            continue;
	        }

	        if (c < 0x80) {
	            out += internals.hexTable[c];
	            continue;
	        }

	        if (c < 0x800) {
	            out += internals.hexTable[0xC0 | (c >> 6)] + internals.hexTable[0x80 | (c & 0x3F)];
	            continue;
	        }

	        if (c < 0xD800 || c >= 0xE000) {
	            out += internals.hexTable[0xE0 | (c >> 12)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
	            continue;
	        }

	        ++i;
	        c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
	        out += internals.hexTable[0xF0 | (c >> 18)] + internals.hexTable[0x80 | ((c >> 12) & 0x3F)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
	    }

	    return out;
	};

	exports.compact = function (obj, refs) {

	    if (typeof obj !== 'object' ||
	        obj === null) {

	        return obj;
	    }

	    refs = refs || [];
	    var lookup = refs.indexOf(obj);
	    if (lookup !== -1) {
	        return refs[lookup];
	    }

	    refs.push(obj);

	    if (Array.isArray(obj)) {
	        var compacted = [];

	        for (var i = 0, il = obj.length; i < il; ++i) {
	            if (typeof obj[i] !== 'undefined') {
	                compacted.push(obj[i]);
	            }
	        }

	        return compacted;
	    }

	    var keys = Object.keys(obj);
	    for (i = 0, il = keys.length; i < il; ++i) {
	        var key = keys[i];
	        obj[key] = exports.compact(obj[key], refs);
	    }

	    return obj;
	};


	exports.isRegExp = function (obj) {

	    return Object.prototype.toString.call(obj) === '[object RegExp]';
	};


	exports.isBuffer = function (obj) {

	    if (obj === null ||
	        typeof obj === 'undefined') {

	        return false;
	    }

	    return !!(obj.constructor &&
	              obj.constructor.isBuffer &&
	              obj.constructor.isBuffer(obj));
	};


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Utils = __webpack_require__(53);


	// Declare internals

	var internals = {
	    delimiter: '&',
	    depth: 5,
	    arrayLimit: 20,
	    parameterLimit: 1000,
	    strictNullHandling: false,
	    plainObjects: false,
	    allowPrototypes: false
	};


	internals.parseValues = function (str, options) {

	    var obj = {};
	    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

	    for (var i = 0, il = parts.length; i < il; ++i) {
	        var part = parts[i];
	        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

	        if (pos === -1) {
	            obj[Utils.decode(part)] = '';

	            if (options.strictNullHandling) {
	                obj[Utils.decode(part)] = null;
	            }
	        }
	        else {
	            var key = Utils.decode(part.slice(0, pos));
	            var val = Utils.decode(part.slice(pos + 1));

	            if (!Object.prototype.hasOwnProperty.call(obj, key)) {
	                obj[key] = val;
	            }
	            else {
	                obj[key] = [].concat(obj[key]).concat(val);
	            }
	        }
	    }

	    return obj;
	};


	internals.parseObject = function (chain, val, options) {

	    if (!chain.length) {
	        return val;
	    }

	    var root = chain.shift();

	    var obj;
	    if (root === '[]') {
	        obj = [];
	        obj = obj.concat(internals.parseObject(chain, val, options));
	    }
	    else {
	        obj = options.plainObjects ? Object.create(null) : {};
	        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
	        var index = parseInt(cleanRoot, 10);
	        var indexString = '' + index;
	        if (!isNaN(index) &&
	            root !== cleanRoot &&
	            indexString === cleanRoot &&
	            index >= 0 &&
	            (options.parseArrays &&
	             index <= options.arrayLimit)) {

	            obj = [];
	            obj[index] = internals.parseObject(chain, val, options);
	        }
	        else {
	            obj[cleanRoot] = internals.parseObject(chain, val, options);
	        }
	    }

	    return obj;
	};


	internals.parseKeys = function (key, val, options) {

	    if (!key) {
	        return;
	    }

	    // Transform dot notation to bracket notation

	    if (options.allowDots) {
	        key = key.replace(/\.([^\.\[]+)/g, '[$1]');
	    }

	    // The regex chunks

	    var parent = /^([^\[\]]*)/;
	    var child = /(\[[^\[\]]*\])/g;

	    // Get the parent

	    var segment = parent.exec(key);

	    // Stash the parent if it exists

	    var keys = [];
	    if (segment[1]) {
	        // If we aren't using plain objects, optionally prefix keys
	        // that would overwrite object prototype properties
	        if (!options.plainObjects &&
	            Object.prototype.hasOwnProperty(segment[1])) {

	            if (!options.allowPrototypes) {
	                return;
	            }
	        }

	        keys.push(segment[1]);
	    }

	    // Loop through children appending to the array until we hit depth

	    var i = 0;
	    while ((segment = child.exec(key)) !== null && i < options.depth) {

	        ++i;
	        if (!options.plainObjects &&
	            Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {

	            if (!options.allowPrototypes) {
	                continue;
	            }
	        }
	        keys.push(segment[1]);
	    }

	    // If there's a remainder, just add whatever is left

	    if (segment) {
	        keys.push('[' + key.slice(segment.index) + ']');
	    }

	    return internals.parseObject(keys, val, options);
	};


	module.exports = function (str, options) {

	    options = options || {};
	    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
	    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
	    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
	    options.parseArrays = options.parseArrays !== false;
	    options.allowDots = options.allowDots !== false;
	    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
	    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
	    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
	    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

	    if (str === '' ||
	        str === null ||
	        typeof str === 'undefined') {

	        return options.plainObjects ? Object.create(null) : {};
	    }

	    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
	    var obj = options.plainObjects ? Object.create(null) : {};

	    // Iterate over the keys and setup the new object

	    var keys = Object.keys(tempObj);
	    for (var i = 0, il = keys.length; i < il; ++i) {
	        var key = keys[i];
	        var newObj = internals.parseKeys(key, tempObj[key], options);
	        obj = Utils.merge(obj, newObj, options);
	    }

	    return Utils.compact(obj);
	};


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @private
	 */

	var debug = __webpack_require__(23)('express:view');
	var path = __webpack_require__(16);
	var fs = __webpack_require__(2);
	var utils = __webpack_require__(56);

	/**
	 * Module variables.
	 * @private
	 */

	var dirname = path.dirname;
	var basename = path.basename;
	var extname = path.extname;
	var join = path.join;
	var resolve = path.resolve;

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = View;

	/**
	 * Initialize a new `View` with the given `name`.
	 *
	 * Options:
	 *
	 *   - `defaultEngine` the default template engine name
	 *   - `engines` template engine require() cache
	 *   - `root` root path for view lookup
	 *
	 * @param {string} name
	 * @param {object} options
	 * @public
	 */

	function View(name, options) {
	  var opts = options || {};

	  this.defaultEngine = opts.defaultEngine;
	  this.ext = extname(name);
	  this.name = name;
	  this.root = opts.root;

	  if (!this.ext && !this.defaultEngine) {
	    throw new Error('No default engine was specified and no extension was provided.');
	  }

	  var fileName = name;

	  if (!this.ext) {
	    // get extension from default engine name
	    this.ext = this.defaultEngine[0] !== '.'
	      ? '.' + this.defaultEngine
	      : this.defaultEngine;

	    fileName += this.ext;
	  }

	  if (!opts.engines[this.ext]) {
	    // load engine
	    opts.engines[this.ext] = __webpack_require__(76)(this.ext.substr(1)).__express;
	  }

	  // store loaded engine
	  this.engine = opts.engines[this.ext];

	  // lookup path
	  this.path = this.lookup(fileName);
	}

	/**
	 * Lookup view by the given `name`
	 *
	 * @param {string} name
	 * @private
	 */

	View.prototype.lookup = function lookup(name) {
	  var path;
	  var roots = [].concat(this.root);

	  debug('lookup "%s"', name);

	  for (var i = 0; i < roots.length && !path; i++) {
	    var root = roots[i];

	    // resolve the path
	    var loc = resolve(root, name);
	    var dir = dirname(loc);
	    var file = basename(loc);

	    // resolve the file
	    path = this.resolve(dir, file);
	  }

	  return path;
	};

	/**
	 * Render with the given options.
	 *
	 * @param {object} options
	 * @param {function} callback
	 * @private
	 */

	View.prototype.render = function render(options, callback) {
	  debug('render "%s"', this.path);
	  this.engine(this.path, options, callback);
	};

	/**
	 * Resolve the file within the given directory.
	 *
	 * @param {string} dir
	 * @param {string} file
	 * @private
	 */

	View.prototype.resolve = function resolve(dir, file) {
	  var ext = this.ext;

	  // <path>.<ext>
	  var path = join(dir, file);
	  var stat = tryStat(path);

	  if (stat && stat.isFile()) {
	    return path;
	  }

	  // <path>/index.<ext>
	  path = join(dir, basename(file, ext), 'index' + ext);
	  stat = tryStat(path);

	  if (stat && stat.isFile()) {
	    return path;
	  }
	};

	/**
	 * Return a stat, maybe.
	 *
	 * @param {string} path
	 * @return {fs.Stats}
	 * @private
	 */

	function tryStat(path) {
	  debug('stat "%s"', path);

	  try {
	    return fs.statSync(path);
	  } catch (e) {
	    return undefined;
	  }
	}


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @api private
	 */

	var contentDisposition = __webpack_require__(57);
	var contentType = __webpack_require__(58);
	var deprecate = __webpack_require__(41)('express');
	var flatten = __webpack_require__(36);
	var mime = __webpack_require__(59).mime;
	var basename = __webpack_require__(16).basename;
	var etag = __webpack_require__(70);
	var proxyaddr = __webpack_require__(72);
	var qs = __webpack_require__(51);
	var querystring = __webpack_require__(75);

	/**
	 * Return strong ETag for `body`.
	 *
	 * @param {String|Buffer} body
	 * @param {String} [encoding]
	 * @return {String}
	 * @api private
	 */

	exports.etag = function (body, encoding) {
	  var buf = !Buffer.isBuffer(body)
	    ? new Buffer(body, encoding)
	    : body;

	  return etag(buf, {weak: false});
	};

	/**
	 * Return weak ETag for `body`.
	 *
	 * @param {String|Buffer} body
	 * @param {String} [encoding]
	 * @return {String}
	 * @api private
	 */

	exports.wetag = function wetag(body, encoding){
	  var buf = !Buffer.isBuffer(body)
	    ? new Buffer(body, encoding)
	    : body;

	  return etag(buf, {weak: true});
	};

	/**
	 * Check if `path` looks absolute.
	 *
	 * @param {String} path
	 * @return {Boolean}
	 * @api private
	 */

	exports.isAbsolute = function(path){
	  if ('/' == path[0]) return true;
	  if (':' == path[1] && '\\' == path[2]) return true;
	  if ('\\\\' == path.substring(0, 2)) return true; // Microsoft Azure absolute path
	};

	/**
	 * Flatten the given `arr`.
	 *
	 * @param {Array} arr
	 * @return {Array}
	 * @api private
	 */

	exports.flatten = deprecate.function(flatten,
	  'utils.flatten: use array-flatten npm module instead');

	/**
	 * Normalize the given `type`, for example "html" becomes "text/html".
	 *
	 * @param {String} type
	 * @return {Object}
	 * @api private
	 */

	exports.normalizeType = function(type){
	  return ~type.indexOf('/')
	    ? acceptParams(type)
	    : { value: mime.lookup(type), params: {} };
	};

	/**
	 * Normalize `types`, for example "html" becomes "text/html".
	 *
	 * @param {Array} types
	 * @return {Array}
	 * @api private
	 */

	exports.normalizeTypes = function(types){
	  var ret = [];

	  for (var i = 0; i < types.length; ++i) {
	    ret.push(exports.normalizeType(types[i]));
	  }

	  return ret;
	};

	/**
	 * Generate Content-Disposition header appropriate for the filename.
	 * non-ascii filenames are urlencoded and a filename* parameter is added
	 *
	 * @param {String} filename
	 * @return {String}
	 * @api private
	 */

	exports.contentDisposition = deprecate.function(contentDisposition,
	  'utils.contentDisposition: use content-disposition npm module instead');

	/**
	 * Parse accept params `str` returning an
	 * object with `.value`, `.quality` and `.params`.
	 * also includes `.originalIndex` for stable sorting
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */

	function acceptParams(str, index) {
	  var parts = str.split(/ *; */);
	  var ret = { value: parts[0], quality: 1, params: {}, originalIndex: index };

	  for (var i = 1; i < parts.length; ++i) {
	    var pms = parts[i].split(/ *= */);
	    if ('q' == pms[0]) {
	      ret.quality = parseFloat(pms[1]);
	    } else {
	      ret.params[pms[0]] = pms[1];
	    }
	  }

	  return ret;
	}

	/**
	 * Compile "etag" value to function.
	 *
	 * @param  {Boolean|String|Function} val
	 * @return {Function}
	 * @api private
	 */

	exports.compileETag = function(val) {
	  var fn;

	  if (typeof val === 'function') {
	    return val;
	  }

	  switch (val) {
	    case true:
	      fn = exports.wetag;
	      break;
	    case false:
	      break;
	    case 'strong':
	      fn = exports.etag;
	      break;
	    case 'weak':
	      fn = exports.wetag;
	      break;
	    default:
	      throw new TypeError('unknown value for etag function: ' + val);
	  }

	  return fn;
	}

	/**
	 * Compile "query parser" value to function.
	 *
	 * @param  {String|Function} val
	 * @return {Function}
	 * @api private
	 */

	exports.compileQueryParser = function compileQueryParser(val) {
	  var fn;

	  if (typeof val === 'function') {
	    return val;
	  }

	  switch (val) {
	    case true:
	      fn = querystring.parse;
	      break;
	    case false:
	      fn = newObject;
	      break;
	    case 'extended':
	      fn = parseExtendedQueryString;
	      break;
	    case 'simple':
	      fn = querystring.parse;
	      break;
	    default:
	      throw new TypeError('unknown value for query parser function: ' + val);
	  }

	  return fn;
	}

	/**
	 * Compile "proxy trust" value to function.
	 *
	 * @param  {Boolean|String|Number|Array|Function} val
	 * @return {Function}
	 * @api private
	 */

	exports.compileTrust = function(val) {
	  if (typeof val === 'function') return val;

	  if (val === true) {
	    // Support plain true/false
	    return function(){ return true };
	  }

	  if (typeof val === 'number') {
	    // Support trusting hop count
	    return function(a, i){ return i < val };
	  }

	  if (typeof val === 'string') {
	    // Support comma-separated values
	    val = val.split(/ *, */);
	  }

	  return proxyaddr.compile(val || []);
	}

	/**
	 * Set the charset in a given Content-Type string.
	 *
	 * @param {String} type
	 * @param {String} charset
	 * @return {String}
	 * @api private
	 */

	exports.setCharset = function setCharset(type, charset) {
	  if (!type || !charset) {
	    return type;
	  }

	  // parse type
	  var parsed = contentType.parse(type);

	  // set charset
	  parsed.parameters.charset = charset;

	  // format type
	  return contentType.format(parsed);
	};

	/**
	 * Parse an extended query string with qs.
	 *
	 * @return {Object}
	 * @private
	 */

	function parseExtendedQueryString(str) {
	  return qs.parse(str, {
	    allowDots: false,
	    allowPrototypes: true
	  });
	}

	/**
	 * Return new empty object.
	 *
	 * @return {Object}
	 * @api private
	 */

	function newObject() {
	  return {};
	}


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * content-disposition
	 * Copyright(c) 2014 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 */

	module.exports = contentDisposition
	module.exports.parse = parse

	/**
	 * Module dependencies.
	 */

	var basename = __webpack_require__(16).basename

	/**
	 * RegExp to match non attr-char, *after* encodeURIComponent (i.e. not including "%")
	 */

	var encodeUriAttrCharRegExp = /[\x00-\x20"'\(\)*,\/:;<=>?@\[\\\]\{\}\x7f]/g

	/**
	 * RegExp to match percent encoding escape.
	 */

	var hexEscapeRegExp = /%[0-9A-Fa-f]{2}/
	var hexEscapeReplaceRegExp = /%([0-9A-Fa-f]{2})/g

	/**
	 * RegExp to match non-latin1 characters.
	 */

	var nonLatin1RegExp = /[^\x20-\x7e\xa0-\xff]/g

	/**
	 * RegExp to match quoted-pair in RFC 2616
	 *
	 * quoted-pair = "\" CHAR
	 * CHAR        = <any US-ASCII character (octets 0 - 127)>
	 */

	var qescRegExp = /\\([\u0000-\u007f])/g;

	/**
	 * RegExp to match chars that must be quoted-pair in RFC 2616
	 */

	var quoteRegExp = /([\\"])/g

	/**
	 * RegExp for various RFC 2616 grammar
	 *
	 * parameter     = token "=" ( token | quoted-string )
	 * token         = 1*<any CHAR except CTLs or separators>
	 * separators    = "(" | ")" | "<" | ">" | "@"
	 *               | "," | ";" | ":" | "\" | <">
	 *               | "/" | "[" | "]" | "?" | "="
	 *               | "{" | "}" | SP | HT
	 * quoted-string = ( <"> *(qdtext | quoted-pair ) <"> )
	 * qdtext        = <any TEXT except <">>
	 * quoted-pair   = "\" CHAR
	 * CHAR          = <any US-ASCII character (octets 0 - 127)>
	 * TEXT          = <any OCTET except CTLs, but including LWS>
	 * LWS           = [CRLF] 1*( SP | HT )
	 * CRLF          = CR LF
	 * CR            = <US-ASCII CR, carriage return (13)>
	 * LF            = <US-ASCII LF, linefeed (10)>
	 * SP            = <US-ASCII SP, space (32)>
	 * HT            = <US-ASCII HT, horizontal-tab (9)>
	 * CTL           = <any US-ASCII control character (octets 0 - 31) and DEL (127)>
	 * OCTET         = <any 8-bit sequence of data>
	 */

	var paramRegExp = /; *([!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) *= *("(?:[ !\x23-\x5b\x5d-\x7e\x80-\xff]|\\[\x20-\x7e])*"|[!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) */g
	var textRegExp = /^[\x20-\x7e\x80-\xff]+$/
	var tokenRegExp = /^[!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+$/

	/**
	 * RegExp for various RFC 5987 grammar
	 *
	 * ext-value     = charset  "'" [ language ] "'" value-chars
	 * charset       = "UTF-8" / "ISO-8859-1" / mime-charset
	 * mime-charset  = 1*mime-charsetc
	 * mime-charsetc = ALPHA / DIGIT
	 *               / "!" / "#" / "$" / "%" / "&"
	 *               / "+" / "-" / "^" / "_" / "`"
	 *               / "{" / "}" / "~"
	 * language      = ( 2*3ALPHA [ extlang ] )
	 *               / 4ALPHA
	 *               / 5*8ALPHA
	 * extlang       = *3( "-" 3ALPHA )
	 * value-chars   = *( pct-encoded / attr-char )
	 * pct-encoded   = "%" HEXDIG HEXDIG
	 * attr-char     = ALPHA / DIGIT
	 *               / "!" / "#" / "$" / "&" / "+" / "-" / "."
	 *               / "^" / "_" / "`" / "|" / "~"
	 */

	var extValueRegExp = /^([A-Za-z0-9!#$%&+\-^_`{}~]+)'(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4,8}|)'((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!#$&+\-\.^_`|~])+)$/

	/**
	 * RegExp for various RFC 6266 grammar
	 *
	 * disposition-type = "inline" | "attachment" | disp-ext-type
	 * disp-ext-type    = token
	 * disposition-parm = filename-parm | disp-ext-parm
	 * filename-parm    = "filename" "=" value
	 *                  | "filename*" "=" ext-value
	 * disp-ext-parm    = token "=" value
	 *                  | ext-token "=" ext-value
	 * ext-token        = <the characters in token, followed by "*">
	 */

	var dispositionTypeRegExp = /^([!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) *(?:$|;)/

	/**
	 * Create an attachment Content-Disposition header.
	 *
	 * @param {string} [filename]
	 * @param {object} [options]
	 * @param {string} [options.type=attachment]
	 * @param {string|boolean} [options.fallback=true]
	 * @return {string}
	 * @api public
	 */

	function contentDisposition(filename, options) {
	  var opts = options || {}

	  // get type
	  var type = opts.type || 'attachment'

	  // get parameters
	  var params = createparams(filename, opts.fallback)

	  // format into string
	  return format(new ContentDisposition(type, params))
	}

	/**
	 * Create parameters object from filename and fallback.
	 *
	 * @param {string} [filename]
	 * @param {string|boolean} [fallback=true]
	 * @return {object}
	 * @api private
	 */

	function createparams(filename, fallback) {
	  if (filename === undefined) {
	    return
	  }

	  var params = {}

	  if (typeof filename !== 'string') {
	    throw new TypeError('filename must be a string')
	  }

	  // fallback defaults to true
	  if (fallback === undefined) {
	    fallback = true
	  }

	  if (typeof fallback !== 'string' && typeof fallback !== 'boolean') {
	    throw new TypeError('fallback must be a string or boolean')
	  }

	  if (typeof fallback === 'string' && nonLatin1RegExp.test(fallback)) {
	    throw new TypeError('fallback must be ISO-8859-1 string')
	  }

	  // restrict to file base name
	  var name = basename(filename)

	  // determine if name is suitable for quoted string
	  var isQuotedString = textRegExp.test(name)

	  // generate fallback name
	  var fallbackName = typeof fallback !== 'string'
	    ? fallback && getlatin1(name)
	    : basename(fallback)
	  var hasFallback = typeof fallbackName === 'string' && fallbackName !== name

	  // set extended filename parameter
	  if (hasFallback || !isQuotedString || hexEscapeRegExp.test(name)) {
	    params['filename*'] = name
	  }

	  // set filename parameter
	  if (isQuotedString || hasFallback) {
	    params.filename = hasFallback
	      ? fallbackName
	      : name
	  }

	  return params
	}

	/**
	 * Format object to Content-Disposition header.
	 *
	 * @param {object} obj
	 * @param {string} obj.type
	 * @param {object} [obj.parameters]
	 * @return {string}
	 * @api private
	 */

	function format(obj) {
	  var parameters = obj.parameters
	  var type = obj.type

	  if (!type || typeof type !== 'string' || !tokenRegExp.test(type)) {
	    throw new TypeError('invalid type')
	  }

	  // start with normalized type
	  var string = String(type).toLowerCase()

	  // append parameters
	  if (parameters && typeof parameters === 'object') {
	    var param
	    var params = Object.keys(parameters).sort()

	    for (var i = 0; i < params.length; i++) {
	      param = params[i]

	      var val = param.substr(-1) === '*'
	        ? ustring(parameters[param])
	        : qstring(parameters[param])

	      string += '; ' + param + '=' + val
	    }
	  }

	  return string
	}

	/**
	 * Decode a RFC 6987 field value (gracefully).
	 *
	 * @param {string} str
	 * @return {string}
	 * @api private
	 */

	function decodefield(str) {
	  var match = extValueRegExp.exec(str)

	  if (!match) {
	    throw new TypeError('invalid extended field value')
	  }

	  var charset = match[1].toLowerCase()
	  var encoded = match[2]
	  var value

	  // to binary string
	  var binary = encoded.replace(hexEscapeReplaceRegExp, pdecode)

	  switch (charset) {
	    case 'iso-8859-1':
	      value = getlatin1(binary)
	      break
	    case 'utf-8':
	      value = new Buffer(binary, 'binary').toString('utf8')
	      break
	    default:
	      throw new TypeError('unsupported charset in extended field')
	  }

	  return value
	}

	/**
	 * Get ISO-8859-1 version of string.
	 *
	 * @param {string} val
	 * @return {string}
	 * @api private
	 */

	function getlatin1(val) {
	  // simple Unicode -> ISO-8859-1 transformation
	  return String(val).replace(nonLatin1RegExp, '?')
	}

	/**
	 * Parse Content-Disposition header string.
	 *
	 * @param {string} string
	 * @return {object}
	 * @api private
	 */

	function parse(string) {
	  if (!string || typeof string !== 'string') {
	    throw new TypeError('argument string is required')
	  }

	  var match = dispositionTypeRegExp.exec(string)

	  if (!match) {
	    throw new TypeError('invalid type format')
	  }

	  // normalize type
	  var index = match[0].length
	  var type = match[1].toLowerCase()

	  var key
	  var names = []
	  var params = {}
	  var value

	  // calculate index to start at
	  index = paramRegExp.lastIndex = match[0].substr(-1) === ';'
	    ? index - 1
	    : index

	  // match parameters
	  while (match = paramRegExp.exec(string)) {
	    if (match.index !== index) {
	      throw new TypeError('invalid parameter format')
	    }

	    index += match[0].length
	    key = match[1].toLowerCase()
	    value = match[2]

	    if (names.indexOf(key) !== -1) {
	      throw new TypeError('invalid duplicate parameter')
	    }

	    names.push(key)

	    if (key.indexOf('*') + 1 === key.length) {
	      // decode extended value
	      key = key.slice(0, -1)
	      value = decodefield(value)

	      // overwrite existing value
	      params[key] = value
	      continue
	    }

	    if (typeof params[key] === 'string') {
	      continue
	    }

	    if (value[0] === '"') {
	      // remove quotes and escapes
	      value = value
	        .substr(1, value.length - 2)
	        .replace(qescRegExp, '$1')
	    }

	    params[key] = value
	  }

	  if (index !== -1 && index !== string.length) {
	    throw new TypeError('invalid parameter format')
	  }

	  return new ContentDisposition(type, params)
	}

	/**
	 * Percent decode a single character.
	 *
	 * @param {string} str
	 * @param {string} hex
	 * @return {string}
	 * @api private
	 */

	function pdecode(str, hex) {
	  return String.fromCharCode(parseInt(hex, 16))
	}

	/**
	 * Percent encode a single character.
	 *
	 * @param {string} char
	 * @return {string}
	 * @api private
	 */

	function pencode(char) {
	  var hex = String(char)
	    .charCodeAt(0)
	    .toString(16)
	    .toUpperCase()
	  return hex.length === 1
	    ? '%0' + hex
	    : '%' + hex
	}

	/**
	 * Quote a string for HTTP.
	 *
	 * @param {string} val
	 * @return {string}
	 * @api private
	 */

	function qstring(val) {
	  var str = String(val)

	  return '"' + str.replace(quoteRegExp, '\\$1') + '"'
	}

	/**
	 * Encode a Unicode string for HTTP (RFC 5987).
	 *
	 * @param {string} val
	 * @return {string}
	 * @api private
	 */

	function ustring(val) {
	  var str = String(val)

	  // percent encode as UTF-8
	  var encoded = encodeURIComponent(str)
	    .replace(encodeUriAttrCharRegExp, pencode)

	  return 'UTF-8\'\'' + encoded
	}

	/**
	 * Class for parsed Content-Disposition header for v8 optimization
	 */

	function ContentDisposition(type, parameters) {
	  this.type = type
	  this.parameters = parameters
	}


/***/ },
/* 58 */
/***/ function(module, exports) {

	/*!
	 * content-type
	 * Copyright(c) 2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	/**
	 * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
	 *
	 * parameter     = token "=" ( token / quoted-string )
	 * token         = 1*tchar
	 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
	 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
	 *               / DIGIT / ALPHA
	 *               ; any VCHAR, except delimiters
	 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
	 * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
	 * obs-text      = %x80-FF
	 * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
	 */
	var paramRegExp = /; *([!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) */g
	var textRegExp = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/
	var tokenRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/

	/**
	 * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
	 *
	 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
	 * obs-text    = %x80-FF
	 */
	var qescRegExp = /\\([\u000b\u0020-\u00ff])/g

	/**
	 * RegExp to match chars that must be quoted-pair in RFC 7230 sec 3.2.6
	 */
	var quoteRegExp = /([\\"])/g

	/**
	 * RegExp to match type in RFC 6838
	 *
	 * media-type = type "/" subtype
	 * type       = token
	 * subtype    = token
	 */
	var typeRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+\/[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/

	/**
	 * Module exports.
	 * @public
	 */

	exports.format = format
	exports.parse = parse

	/**
	 * Format object to media type.
	 *
	 * @param {object} obj
	 * @return {string}
	 * @public
	 */

	function format(obj) {
	  if (!obj || typeof obj !== 'object') {
	    throw new TypeError('argument obj is required')
	  }

	  var parameters = obj.parameters
	  var type = obj.type

	  if (!type || !typeRegExp.test(type)) {
	    throw new TypeError('invalid type')
	  }

	  var string = type

	  // append parameters
	  if (parameters && typeof parameters === 'object') {
	    var param
	    var params = Object.keys(parameters).sort()

	    for (var i = 0; i < params.length; i++) {
	      param = params[i]

	      if (!tokenRegExp.test(param)) {
	        throw new TypeError('invalid parameter name')
	      }

	      string += '; ' + param + '=' + qstring(parameters[param])
	    }
	  }

	  return string
	}

	/**
	 * Parse media type to object.
	 *
	 * @param {string|object} string
	 * @return {Object}
	 * @public
	 */

	function parse(string) {
	  if (!string) {
	    throw new TypeError('argument string is required')
	  }

	  if (typeof string === 'object') {
	    // support req/res-like objects as argument
	    string = getcontenttype(string)

	    if (typeof string !== 'string') {
	      throw new TypeError('content-type header is missing from object');
	    }
	  }

	  if (typeof string !== 'string') {
	    throw new TypeError('argument string is required to be a string')
	  }

	  var index = string.indexOf(';')
	  var type = index !== -1
	    ? string.substr(0, index).trim()
	    : string.trim()

	  if (!typeRegExp.test(type)) {
	    throw new TypeError('invalid media type')
	  }

	  var key
	  var match
	  var obj = new ContentType(type.toLowerCase())
	  var value

	  paramRegExp.lastIndex = index

	  while (match = paramRegExp.exec(string)) {
	    if (match.index !== index) {
	      throw new TypeError('invalid parameter format')
	    }

	    index += match[0].length
	    key = match[1].toLowerCase()
	    value = match[2]

	    if (value[0] === '"') {
	      // remove quotes and escapes
	      value = value
	        .substr(1, value.length - 2)
	        .replace(qescRegExp, '$1')
	    }

	    obj.parameters[key] = value
	  }

	  if (index !== -1 && index !== string.length) {
	    throw new TypeError('invalid parameter format')
	  }

	  return obj
	}

	/**
	 * Get content-type from req/res objects.
	 *
	 * @param {object}
	 * @return {Object}
	 * @private
	 */

	function getcontenttype(obj) {
	  if (typeof obj.getHeader === 'function') {
	    // res-like
	    return obj.getHeader('content-type')
	  }

	  if (typeof obj.headers === 'object') {
	    // req-like
	    return obj.headers && obj.headers['content-type']
	  }
	}

	/**
	 * Quote a string if necessary.
	 *
	 * @param {string} val
	 * @return {string}
	 * @private
	 */

	function qstring(val) {
	  var str = String(val)

	  // no need to quote tokens
	  if (tokenRegExp.test(str)) {
	    return str
	  }

	  if (str.length > 0 && !textRegExp.test(str)) {
	    throw new TypeError('invalid parameter value')
	  }

	  return '"' + str.replace(quoteRegExp, '\\$1') + '"'
	}

	/**
	 * Class to represent a content type.
	 * @private
	 */
	function ContentType(type) {
	  this.parameters = Object.create(null)
	  this.type = type
	}


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * send
	 * Copyright(c) 2012 TJ Holowaychuk
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 * @private
	 */

	var createError = __webpack_require__(60)
	var debug = __webpack_require__(23)('send')
	var deprecate = __webpack_require__(41)('send')
	var destroy = __webpack_require__(64)
	var escapeHtml = __webpack_require__(29)
	  , parseRange = __webpack_require__(66)
	  , Stream = __webpack_require__(65)
	  , mime = __webpack_require__(67)
	  , fresh = __webpack_require__(69)
	  , path = __webpack_require__(16)
	  , fs = __webpack_require__(2)
	  , normalize = path.normalize
	  , join = path.join
	var etag = __webpack_require__(70)
	var EventEmitter = __webpack_require__(19).EventEmitter;
	var ms = __webpack_require__(27);
	var onFinished = __webpack_require__(31)
	var statuses = __webpack_require__(61)

	/**
	 * Variables.
	 */
	var extname = path.extname
	var maxMaxAge = 60 * 60 * 24 * 365 * 1000; // 1 year
	var resolve = path.resolve
	var sep = path.sep
	var toString = Object.prototype.toString
	var upPathRegexp = /(?:^|[\\\/])\.\.(?:[\\\/]|$)/

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = send
	module.exports.mime = mime

	/**
	 * Shim EventEmitter.listenerCount for node.js < 0.10
	 */

	/* istanbul ignore next */
	var listenerCount = EventEmitter.listenerCount
	  || function(emitter, type){ return emitter.listeners(type).length; };

	/**
	 * Return a `SendStream` for `req` and `path`.
	 *
	 * @param {object} req
	 * @param {string} path
	 * @param {object} [options]
	 * @return {SendStream}
	 * @public
	 */

	function send(req, path, options) {
	  return new SendStream(req, path, options);
	}

	/**
	 * Initialize a `SendStream` with the given `path`.
	 *
	 * @param {Request} req
	 * @param {String} path
	 * @param {object} [options]
	 * @private
	 */

	function SendStream(req, path, options) {
	  var opts = options || {}

	  this.options = opts
	  this.path = path
	  this.req = req

	  this._etag = opts.etag !== undefined
	    ? Boolean(opts.etag)
	    : true

	  this._dotfiles = opts.dotfiles !== undefined
	    ? opts.dotfiles
	    : 'ignore'

	  if (this._dotfiles !== 'ignore' && this._dotfiles !== 'allow' && this._dotfiles !== 'deny') {
	    throw new TypeError('dotfiles option must be "allow", "deny", or "ignore"')
	  }

	  this._hidden = Boolean(opts.hidden)

	  if (opts.hidden !== undefined) {
	    deprecate('hidden: use dotfiles: \'' + (this._hidden ? 'allow' : 'ignore') + '\' instead')
	  }

	  // legacy support
	  if (opts.dotfiles === undefined) {
	    this._dotfiles = undefined
	  }

	  this._extensions = opts.extensions !== undefined
	    ? normalizeList(opts.extensions, 'extensions option')
	    : []

	  this._index = opts.index !== undefined
	    ? normalizeList(opts.index, 'index option')
	    : ['index.html']

	  this._lastModified = opts.lastModified !== undefined
	    ? Boolean(opts.lastModified)
	    : true

	  this._maxage = opts.maxAge || opts.maxage
	  this._maxage = typeof this._maxage === 'string'
	    ? ms(this._maxage)
	    : Number(this._maxage)
	  this._maxage = !isNaN(this._maxage)
	    ? Math.min(Math.max(0, this._maxage), maxMaxAge)
	    : 0

	  this._root = opts.root
	    ? resolve(opts.root)
	    : null

	  if (!this._root && opts.from) {
	    this.from(opts.from)
	  }
	}

	/**
	 * Inherits from `Stream.prototype`.
	 */

	SendStream.prototype.__proto__ = Stream.prototype;

	/**
	 * Enable or disable etag generation.
	 *
	 * @param {Boolean} val
	 * @return {SendStream}
	 * @api public
	 */

	SendStream.prototype.etag = deprecate.function(function etag(val) {
	  val = Boolean(val);
	  debug('etag %s', val);
	  this._etag = val;
	  return this;
	}, 'send.etag: pass etag as option');

	/**
	 * Enable or disable "hidden" (dot) files.
	 *
	 * @param {Boolean} path
	 * @return {SendStream}
	 * @api public
	 */

	SendStream.prototype.hidden = deprecate.function(function hidden(val) {
	  val = Boolean(val);
	  debug('hidden %s', val);
	  this._hidden = val;
	  this._dotfiles = undefined
	  return this;
	}, 'send.hidden: use dotfiles option');

	/**
	 * Set index `paths`, set to a falsy
	 * value to disable index support.
	 *
	 * @param {String|Boolean|Array} paths
	 * @return {SendStream}
	 * @api public
	 */

	SendStream.prototype.index = deprecate.function(function index(paths) {
	  var index = !paths ? [] : normalizeList(paths, 'paths argument');
	  debug('index %o', paths);
	  this._index = index;
	  return this;
	}, 'send.index: pass index as option');

	/**
	 * Set root `path`.
	 *
	 * @param {String} path
	 * @return {SendStream}
	 * @api public
	 */

	SendStream.prototype.root = function(path){
	  path = String(path);
	  this._root = resolve(path)
	  return this;
	};

	SendStream.prototype.from = deprecate.function(SendStream.prototype.root,
	  'send.from: pass root as option');

	SendStream.prototype.root = deprecate.function(SendStream.prototype.root,
	  'send.root: pass root as option');

	/**
	 * Set max-age to `maxAge`.
	 *
	 * @param {Number} maxAge
	 * @return {SendStream}
	 * @api public
	 */

	SendStream.prototype.maxage = deprecate.function(function maxage(maxAge) {
	  maxAge = typeof maxAge === 'string'
	    ? ms(maxAge)
	    : Number(maxAge);
	  if (isNaN(maxAge)) maxAge = 0;
	  if (Infinity == maxAge) maxAge = 60 * 60 * 24 * 365 * 1000;
	  debug('max-age %d', maxAge);
	  this._maxage = maxAge;
	  return this;
	}, 'send.maxage: pass maxAge as option');

	/**
	 * Emit error with `status`.
	 *
	 * @param {number} status
	 * @param {Error} [error]
	 * @private
	 */

	SendStream.prototype.error = function error(status, error) {
	  // emit if listeners instead of responding
	  if (listenerCount(this, 'error') !== 0) {
	    return this.emit('error', createError(error, status, {
	      expose: false
	    }))
	  }

	  var res = this.res
	  var msg = statuses[status]

	  // wipe all existing headers
	  res._headers = null

	  // send basic response
	  res.statusCode = status
	  res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
	  res.setHeader('Content-Length', Buffer.byteLength(msg))
	  res.setHeader('X-Content-Type-Options', 'nosniff')
	  res.end(msg)
	}

	/**
	 * Check if the pathname ends with "/".
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.hasTrailingSlash = function(){
	  return '/' == this.path[this.path.length - 1];
	};

	/**
	 * Check if this is a conditional GET request.
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.isConditionalGET = function(){
	  return this.req.headers['if-none-match']
	    || this.req.headers['if-modified-since'];
	};

	/**
	 * Strip content-* header fields.
	 *
	 * @private
	 */

	SendStream.prototype.removeContentHeaderFields = function removeContentHeaderFields() {
	  var res = this.res
	  var headers = Object.keys(res._headers || {})

	  for (var i = 0; i < headers.length; i++) {
	    var header = headers[i]
	    if (header.substr(0, 8) === 'content-' && header !== 'content-location') {
	      res.removeHeader(header)
	    }
	  }
	}

	/**
	 * Respond with 304 not modified.
	 *
	 * @api private
	 */

	SendStream.prototype.notModified = function(){
	  var res = this.res;
	  debug('not modified');
	  this.removeContentHeaderFields();
	  res.statusCode = 304;
	  res.end();
	};

	/**
	 * Raise error that headers already sent.
	 *
	 * @api private
	 */

	SendStream.prototype.headersAlreadySent = function headersAlreadySent(){
	  var err = new Error('Can\'t set headers after they are sent.');
	  debug('headers already sent');
	  this.error(500, err);
	};

	/**
	 * Check if the request is cacheable, aka
	 * responded with 2xx or 304 (see RFC 2616 section 14.2{5,6}).
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.isCachable = function(){
	  var res = this.res;
	  return (res.statusCode >= 200 && res.statusCode < 300) || 304 == res.statusCode;
	};

	/**
	 * Handle stat() error.
	 *
	 * @param {Error} error
	 * @private
	 */

	SendStream.prototype.onStatError = function onStatError(error) {
	  switch (error.code) {
	    case 'ENAMETOOLONG':
	    case 'ENOENT':
	    case 'ENOTDIR':
	      this.error(404, error)
	      break
	    default:
	      this.error(500, error)
	      break
	  }
	}

	/**
	 * Check if the cache is fresh.
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.isFresh = function(){
	  return fresh(this.req.headers, this.res._headers);
	};

	/**
	 * Check if the range is fresh.
	 *
	 * @return {Boolean}
	 * @api private
	 */

	SendStream.prototype.isRangeFresh = function isRangeFresh(){
	  var ifRange = this.req.headers['if-range'];

	  if (!ifRange) return true;

	  return ~ifRange.indexOf('"')
	    ? ~ifRange.indexOf(this.res._headers['etag'])
	    : Date.parse(this.res._headers['last-modified']) <= Date.parse(ifRange);
	};

	/**
	 * Redirect to path.
	 *
	 * @param {string} path
	 * @private
	 */

	SendStream.prototype.redirect = function redirect(path) {
	  if (listenerCount(this, 'directory') !== 0) {
	    this.emit('directory')
	    return
	  }

	  if (this.hasTrailingSlash()) {
	    this.error(403)
	    return
	  }

	  var loc = path + '/'
	  var msg = 'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + '</a>\n'
	  var res = this.res

	  // redirect
	  res.statusCode = 301
	  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
	  res.setHeader('Content-Length', Buffer.byteLength(msg))
	  res.setHeader('X-Content-Type-Options', 'nosniff')
	  res.setHeader('Location', loc)
	  res.end(msg)
	}

	/**
	 * Pipe to `res.
	 *
	 * @param {Stream} res
	 * @return {Stream} res
	 * @api public
	 */

	SendStream.prototype.pipe = function(res){
	  var self = this
	    , args = arguments
	    , root = this._root;

	  // references
	  this.res = res;

	  // decode the path
	  var path = decode(this.path)
	  if (path === -1) return this.error(400)

	  // null byte(s)
	  if (~path.indexOf('\0')) return this.error(400);

	  var parts
	  if (root !== null) {
	    // malicious path
	    if (upPathRegexp.test(normalize('.' + sep + path))) {
	      debug('malicious path "%s"', path)
	      return this.error(403)
	    }

	    // join / normalize from optional root dir
	    path = normalize(join(root, path))
	    root = normalize(root + sep)

	    // explode path parts
	    parts = path.substr(root.length).split(sep)
	  } else {
	    // ".." is malicious without "root"
	    if (upPathRegexp.test(path)) {
	      debug('malicious path "%s"', path)
	      return this.error(403)
	    }

	    // explode path parts
	    parts = normalize(path).split(sep)

	    // resolve the path
	    path = resolve(path)
	  }

	  // dotfile handling
	  if (containsDotFile(parts)) {
	    var access = this._dotfiles

	    // legacy support
	    if (access === undefined) {
	      access = parts[parts.length - 1][0] === '.'
	        ? (this._hidden ? 'allow' : 'ignore')
	        : 'allow'
	    }

	    debug('%s dotfile "%s"', access, path)
	    switch (access) {
	      case 'allow':
	        break
	      case 'deny':
	        return this.error(403)
	      case 'ignore':
	      default:
	        return this.error(404)
	    }
	  }

	  // index file support
	  if (this._index.length && this.path[this.path.length - 1] === '/') {
	    this.sendIndex(path);
	    return res;
	  }

	  this.sendFile(path);
	  return res;
	};

	/**
	 * Transfer `path`.
	 *
	 * @param {String} path
	 * @api public
	 */

	SendStream.prototype.send = function(path, stat){
	  var len = stat.size;
	  var options = this.options
	  var opts = {}
	  var res = this.res;
	  var req = this.req;
	  var ranges = req.headers.range;
	  var offset = options.start || 0;

	  if (res._header) {
	    // impossible to send now
	    return this.headersAlreadySent();
	  }

	  debug('pipe "%s"', path)

	  // set header fields
	  this.setHeader(path, stat);

	  // set content-type
	  this.type(path);

	  // conditional GET support
	  if (this.isConditionalGET()
	    && this.isCachable()
	    && this.isFresh()) {
	    return this.notModified();
	  }

	  // adjust len to start/end options
	  len = Math.max(0, len - offset);
	  if (options.end !== undefined) {
	    var bytes = options.end - offset + 1;
	    if (len > bytes) len = bytes;
	  }

	  // Range support
	  if (ranges) {
	    ranges = parseRange(len, ranges);

	    // If-Range support
	    if (!this.isRangeFresh()) {
	      debug('range stale');
	      ranges = -2;
	    }

	    // unsatisfiable
	    if (-1 == ranges) {
	      debug('range unsatisfiable');
	      res.setHeader('Content-Range', 'bytes */' + stat.size);
	      return this.error(416);
	    }

	    // valid (syntactically invalid/multiple ranges are treated as a regular response)
	    if (-2 != ranges && ranges.length === 1) {
	      debug('range %j', ranges);

	      // Content-Range
	      res.statusCode = 206;
	      res.setHeader('Content-Range', 'bytes '
	        + ranges[0].start
	        + '-'
	        + ranges[0].end
	        + '/'
	        + len);

	      offset += ranges[0].start;
	      len = ranges[0].end - ranges[0].start + 1;
	    }
	  }

	  // clone options
	  for (var prop in options) {
	    opts[prop] = options[prop]
	  }

	  // set read options
	  opts.start = offset
	  opts.end = Math.max(offset, offset + len - 1)

	  // content-length
	  res.setHeader('Content-Length', len);

	  // HEAD support
	  if ('HEAD' == req.method) return res.end();

	  this.stream(path, opts)
	};

	/**
	 * Transfer file for `path`.
	 *
	 * @param {String} path
	 * @api private
	 */
	SendStream.prototype.sendFile = function sendFile(path) {
	  var i = 0
	  var self = this

	  debug('stat "%s"', path);
	  fs.stat(path, function onstat(err, stat) {
	    if (err && err.code === 'ENOENT'
	      && !extname(path)
	      && path[path.length - 1] !== sep) {
	      // not found, check extensions
	      return next(err)
	    }
	    if (err) return self.onStatError(err)
	    if (stat.isDirectory()) return self.redirect(self.path)
	    self.emit('file', path, stat)
	    self.send(path, stat)
	  })

	  function next(err) {
	    if (self._extensions.length <= i) {
	      return err
	        ? self.onStatError(err)
	        : self.error(404)
	    }

	    var p = path + '.' + self._extensions[i++]

	    debug('stat "%s"', p)
	    fs.stat(p, function (err, stat) {
	      if (err) return next(err)
	      if (stat.isDirectory()) return next()
	      self.emit('file', p, stat)
	      self.send(p, stat)
	    })
	  }
	}

	/**
	 * Transfer index for `path`.
	 *
	 * @param {String} path
	 * @api private
	 */
	SendStream.prototype.sendIndex = function sendIndex(path){
	  var i = -1;
	  var self = this;

	  function next(err){
	    if (++i >= self._index.length) {
	      if (err) return self.onStatError(err);
	      return self.error(404);
	    }

	    var p = join(path, self._index[i]);

	    debug('stat "%s"', p);
	    fs.stat(p, function(err, stat){
	      if (err) return next(err);
	      if (stat.isDirectory()) return next();
	      self.emit('file', p, stat);
	      self.send(p, stat);
	    });
	  }

	  next();
	};

	/**
	 * Stream `path` to the response.
	 *
	 * @param {String} path
	 * @param {Object} options
	 * @api private
	 */

	SendStream.prototype.stream = function(path, options){
	  // TODO: this is all lame, refactor meeee
	  var finished = false;
	  var self = this;
	  var res = this.res;
	  var req = this.req;

	  // pipe
	  var stream = fs.createReadStream(path, options);
	  this.emit('stream', stream);
	  stream.pipe(res);

	  // response finished, done with the fd
	  onFinished(res, function onfinished(){
	    finished = true;
	    destroy(stream);
	  });

	  // error handling code-smell
	  stream.on('error', function onerror(err){
	    // request already finished
	    if (finished) return;

	    // clean up stream
	    finished = true;
	    destroy(stream);

	    // error
	    self.onStatError(err);
	  });

	  // end
	  stream.on('end', function onend(){
	    self.emit('end');
	  });
	};

	/**
	 * Set content-type based on `path`
	 * if it hasn't been explicitly set.
	 *
	 * @param {String} path
	 * @api private
	 */

	SendStream.prototype.type = function(path){
	  var res = this.res;
	  if (res.getHeader('Content-Type')) return;
	  var type = mime.lookup(path);
	  var charset = mime.charsets.lookup(type);
	  debug('content-type %s', type);
	  res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
	};

	/**
	 * Set response header fields, most
	 * fields may be pre-defined.
	 *
	 * @param {String} path
	 * @param {Object} stat
	 * @api private
	 */

	SendStream.prototype.setHeader = function setHeader(path, stat){
	  var res = this.res;

	  this.emit('headers', res, path, stat);

	  if (!res.getHeader('Accept-Ranges')) res.setHeader('Accept-Ranges', 'bytes');
	  if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + Math.floor(this._maxage / 1000));

	  if (this._lastModified && !res.getHeader('Last-Modified')) {
	    var modified = stat.mtime.toUTCString()
	    debug('modified %s', modified)
	    res.setHeader('Last-Modified', modified)
	  }

	  if (this._etag && !res.getHeader('ETag')) {
	    var val = etag(stat)
	    debug('etag %s', val)
	    res.setHeader('ETag', val)
	  }
	};

	/**
	 * Determine if path parts contain a dotfile.
	 *
	 * @api private
	 */

	function containsDotFile(parts) {
	  for (var i = 0; i < parts.length; i++) {
	    if (parts[i][0] === '.') {
	      return true
	    }
	  }

	  return false
	}

	/**
	 * decodeURIComponent.
	 *
	 * Allows V8 to only deoptimize this fn instead of all
	 * of send().
	 *
	 * @param {String} path
	 * @api private
	 */

	function decode(path) {
	  try {
	    return decodeURIComponent(path)
	  } catch (err) {
	    return -1
	  }
	}

	/**
	 * Normalize the index option into an array.
	 *
	 * @param {boolean|string|array} val
	 * @param {string} name
	 * @private
	 */

	function normalizeList(val, name) {
	  var list = [].concat(val || [])

	  for (var i = 0; i < list.length; i++) {
	    if (typeof list[i] !== 'string') {
	      throw new TypeError(name + ' must be array of strings or false')
	    }
	  }

	  return list
	}


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	
	var statuses = __webpack_require__(61);
	var inherits = __webpack_require__(63);

	function toIdentifier(str) {
	  return str.split(' ').map(function (token) {
	    return token.slice(0, 1).toUpperCase() + token.slice(1)
	  }).join('').replace(/[^ _0-9a-z]/gi, '')
	}

	exports = module.exports = function httpError() {
	  // so much arity going on ~_~
	  var err;
	  var msg;
	  var status = 500;
	  var props = {};
	  for (var i = 0; i < arguments.length; i++) {
	    var arg = arguments[i];
	    if (arg instanceof Error) {
	      err = arg;
	      status = err.status || err.statusCode || status;
	      continue;
	    }
	    switch (typeof arg) {
	      case 'string':
	        msg = arg;
	        break;
	      case 'number':
	        status = arg;
	        break;
	      case 'object':
	        props = arg;
	        break;
	    }
	  }

	  if (typeof status !== 'number' || !statuses[status]) {
	    status = 500
	  }

	  // constructor
	  var HttpError = exports[status]

	  if (!err) {
	    // create error
	    err = HttpError
	      ? new HttpError(msg)
	      : new Error(msg || statuses[status])
	    Error.captureStackTrace(err, httpError)
	  }

	  if (!HttpError || !(err instanceof HttpError)) {
	    // add properties to generic error
	    err.expose = status < 500
	    err.status = err.statusCode = status
	  }

	  for (var key in props) {
	    if (key !== 'status' && key !== 'statusCode') {
	      err[key] = props[key]
	    }
	  }

	  return err;
	};

	// create generic error objects
	var codes = statuses.codes.filter(function (num) {
	  return num >= 400;
	});

	codes.forEach(function (code) {
	  var name = toIdentifier(statuses[code])
	  var className = name.match(/Error$/) ? name : name + 'Error'

	  if (code >= 500) {
	    var ServerError = function ServerError(msg) {
	      var self = new Error(msg != null ? msg : statuses[code])
	      Error.captureStackTrace(self, ServerError)
	      self.__proto__ = ServerError.prototype
	      Object.defineProperty(self, 'name', {
	        enumerable: false,
	        configurable: true,
	        value: className,
	        writable: true
	      })
	      return self
	    }
	    inherits(ServerError, Error);
	    ServerError.prototype.status =
	    ServerError.prototype.statusCode = code;
	    ServerError.prototype.expose = false;
	    exports[code] =
	    exports[name] = ServerError
	    return;
	  }

	  var ClientError = function ClientError(msg) {
	    var self = new Error(msg != null ? msg : statuses[code])
	    Error.captureStackTrace(self, ClientError)
	    self.__proto__ = ClientError.prototype
	    Object.defineProperty(self, 'name', {
	      enumerable: false,
	      configurable: true,
	      value: className,
	      writable: true
	    })
	    return self
	  }
	  inherits(ClientError, Error);
	  ClientError.prototype.status =
	  ClientError.prototype.statusCode = code;
	  ClientError.prototype.expose = true;
	  exports[code] =
	  exports[name] = ClientError
	  return;
	});

	// backwards-compatibility
	exports["I'mateapot"] = exports.ImATeapot


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	
	var codes = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"./codes.json\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	module.exports = status;

	// [Integer...]
	status.codes = Object.keys(codes).map(function (code) {
	  code = ~~code;
	  var msg = codes[code];
	  status[code] = msg;
	  status[msg] = status[msg.toLowerCase()] = code;
	  return code;
	});

	// status codes for redirects
	status.redirect = {
	  300: true,
	  301: true,
	  302: true,
	  303: true,
	  305: true,
	  307: true,
	  308: true,
	};

	// status codes for empty bodies
	status.empty = {
	  204: true,
	  205: true,
	  304: true,
	};

	// status codes for when you should retry the request
	status.retry = {
	  502: true,
	  503: true,
	  504: true,
	};

	function status(code) {
	  if (typeof code === 'number') {
	    if (!status[code]) throw new Error('invalid status code: ' + code);
	    return code;
	  }

	  if (typeof code !== 'string') {
	    throw new TypeError('code must be a number or string');
	  }

	  // '403'
	  var n = parseInt(code, 10)
	  if (!isNaN(n)) {
	    if (!status[n]) throw new Error('invalid status code: ' + n);
	    return n;
	  }

	  n = status[code.toLowerCase()];
	  if (!n) throw new Error('invalid status message: "' + code + '"');
	  return n;
	}


/***/ },
/* 62 */,
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(25).inherits


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * destroy
	 * Copyright(c) 2014 Jonathan Ong
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 * @private
	 */

	var ReadStream = __webpack_require__(2).ReadStream
	var Stream = __webpack_require__(65)

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = destroy

	/**
	 * Destroy a stream.
	 *
	 * @param {object} stream
	 * @public
	 */

	function destroy(stream) {
	  if (stream instanceof ReadStream) {
	    return destroyReadStream(stream)
	  }

	  if (!(stream instanceof Stream)) {
	    return stream
	  }

	  if (typeof stream.destroy === 'function') {
	    stream.destroy()
	  }

	  return stream
	}

	/**
	 * Destroy a ReadStream.
	 *
	 * @param {object} stream
	 * @private
	 */

	function destroyReadStream(stream) {
	  stream.destroy()

	  if (typeof stream.close === 'function') {
	    // node.js core bug work-around
	    stream.on('open', onOpenClose)
	  }

	  return stream
	}

	/**
	 * On open handler to close stream.
	 * @private
	 */

	function onOpenClose() {
	  if (typeof this.fd === 'number') {
	    // actually close down the fd
	    this.close()
	  }
	}


/***/ },
/* 65 */
/***/ function(module, exports) {

	module.exports = require("stream");

/***/ },
/* 66 */
/***/ function(module, exports) {

	/*!
	 * range-parser
	 * Copyright(c) 2012-2014 TJ Holowaychuk
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = rangeParser;

	/**
	 * Parse "Range" header `str` relative to the given file `size`.
	 *
	 * @param {Number} size
	 * @param {String} str
	 * @return {Array}
	 * @public
	 */

	function rangeParser(size, str) {
	  var valid = true;
	  var i = str.indexOf('=');

	  if (-1 == i) return -2;

	  var arr = str.slice(i + 1).split(',').map(function(range){
	    var range = range.split('-')
	      , start = parseInt(range[0], 10)
	      , end = parseInt(range[1], 10);

	    // -nnn
	    if (isNaN(start)) {
	      start = size - end;
	      end = size - 1;
	    // nnn-
	    } else if (isNaN(end)) {
	      end = size - 1;
	    }

	    // limit last-byte-pos to current length
	    if (end > size - 1) end = size - 1;

	    // invalid
	    if (isNaN(start)
	      || isNaN(end)
	      || start > end
	      || start < 0) valid = false;

	    return {
	      start: start,
	      end: end
	    };
	  });

	  arr.type = str.slice(0, i);

	  return valid ? arr : -1;
	}


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var path = __webpack_require__(16);
	var fs = __webpack_require__(2);

	function Mime() {
	  // Map of extension -> mime type
	  this.types = Object.create(null);

	  // Map of mime type -> extension
	  this.extensions = Object.create(null);
	}

	/**
	 * Define mimetype -> extension mappings.  Each key is a mime-type that maps
	 * to an array of extensions associated with the type.  The first extension is
	 * used as the default extension for the type.
	 *
	 * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
	 *
	 * @param map (Object) type definitions
	 */
	Mime.prototype.define = function (map) {
	  for (var type in map) {
	    var exts = map[type];
	    for (var i = 0; i < exts.length; i++) {
	      if (process.env.DEBUG_MIME && this.types[exts]) {
	        console.warn(this._loading.replace(/.*\//, ''), 'changes "' + exts[i] + '" extension type from ' +
	          this.types[exts] + ' to ' + type);
	      }

	      this.types[exts[i]] = type;
	    }

	    // Default extension is the first one we encounter
	    if (!this.extensions[type]) {
	      this.extensions[type] = exts[0];
	    }
	  }
	};

	/**
	 * Load an Apache2-style ".types" file
	 *
	 * This may be called multiple times (it's expected).  Where files declare
	 * overlapping types/extensions, the last file wins.
	 *
	 * @param file (String) path of file to load.
	 */
	Mime.prototype.load = function(file) {
	  this._loading = file;
	  // Read file and split into lines
	  var map = {},
	      content = fs.readFileSync(file, 'ascii'),
	      lines = content.split(/[\r\n]+/);

	  lines.forEach(function(line) {
	    // Clean up whitespace/comments, and split into fields
	    var fields = line.replace(/\s*#.*|^\s*|\s*$/g, '').split(/\s+/);
	    map[fields.shift()] = fields;
	  });

	  this.define(map);

	  this._loading = null;
	};

	/**
	 * Lookup a mime type based on extension
	 */
	Mime.prototype.lookup = function(path, fallback) {
	  var ext = path.replace(/.*[\.\/\\]/, '').toLowerCase();

	  return this.types[ext] || fallback || this.default_type;
	};

	/**
	 * Return file extension associated with a mime type
	 */
	Mime.prototype.extension = function(mimeType) {
	  var type = mimeType.match(/^\s*([^;\s]*)(?:;|\s|$)/)[1].toLowerCase();
	  return this.extensions[type];
	};

	// Default instance
	var mime = new Mime();

	// Define built-in types
	mime.define(__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"./types.json\""); e.code = 'MODULE_NOT_FOUND'; throw e; }())));

	// Default type
	mime.default_type = mime.lookup('bin');

	//
	// Additional API specific to the default instance
	//

	mime.Mime = Mime;

	/**
	 * Lookup a charset based on mime type.
	 */
	mime.charsets = {
	  lookup: function(mimeType, fallback) {
	    // Assume text types are utf8
	    return (/^text\//).test(mimeType) ? 'UTF-8' : fallback;
	  }
	};

	module.exports = mime;


/***/ },
/* 68 */,
/* 69 */
/***/ function(module, exports) {

	
	/**
	 * Expose `fresh()`.
	 */

	module.exports = fresh;

	/**
	 * Check freshness of `req` and `res` headers.
	 *
	 * When the cache is "fresh" __true__ is returned,
	 * otherwise __false__ is returned to indicate that
	 * the cache is now stale.
	 *
	 * @param {Object} req
	 * @param {Object} res
	 * @return {Boolean}
	 * @api public
	 */

	function fresh(req, res) {
	  // defaults
	  var etagMatches = true;
	  var notModified = true;

	  // fields
	  var modifiedSince = req['if-modified-since'];
	  var noneMatch = req['if-none-match'];
	  var lastModified = res['last-modified'];
	  var etag = res['etag'];
	  var cc = req['cache-control'];

	  // unconditional request
	  if (!modifiedSince && !noneMatch) return false;

	  // check for no-cache cache request directive
	  if (cc && cc.indexOf('no-cache') !== -1) return false;  

	  // parse if-none-match
	  if (noneMatch) noneMatch = noneMatch.split(/ *, */);

	  // if-none-match
	  if (noneMatch) {
	    etagMatches = noneMatch.some(function (match) {
	      return match === '*' || match === etag || match === 'W/' + etag;
	    });
	  }

	  // if-modified-since
	  if (modifiedSince) {
	    modifiedSince = new Date(modifiedSince);
	    lastModified = new Date(lastModified);
	    notModified = lastModified <= modifiedSince;
	  }

	  return !! (etagMatches && notModified);
	}


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * etag
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = etag

	/**
	 * Module dependencies.
	 * @private
	 */

	var crypto = __webpack_require__(71)
	var Stats = __webpack_require__(2).Stats

	/**
	 * Module variables.
	 * @private
	 */

	var base64PadCharRegExp = /=+$/
	var toString = Object.prototype.toString

	/**
	 * Generate an entity tag.
	 *
	 * @param {Buffer|string} entity
	 * @return {string}
	 * @private
	 */

	function entitytag(entity) {
	  if (entity.length === 0) {
	    // fast-path empty
	    return '"0-1B2M2Y8AsgTpgAmY7PhCfg"'
	  }

	  // compute hash of entity
	  var hash = crypto
	    .createHash('md5')
	    .update(entity, 'utf8')
	    .digest('base64')
	    .replace(base64PadCharRegExp, '')

	  // compute length of entity
	  var len = typeof entity === 'string'
	    ? Buffer.byteLength(entity, 'utf8')
	    : entity.length

	  return '"' + len.toString(16) + '-' + hash + '"'
	}

	/**
	 * Create a simple ETag.
	 *
	 * @param {string|Buffer|Stats} entity
	 * @param {object} [options]
	 * @param {boolean} [options.weak]
	 * @return {String}
	 * @public
	 */

	function etag(entity, options) {
	  if (entity == null) {
	    throw new TypeError('argument entity is required')
	  }

	  // support fs.Stats object
	  var isStats = isstats(entity)
	  var weak = options && typeof options.weak === 'boolean'
	    ? options.weak
	    : isStats

	  // validate argument
	  if (!isStats && typeof entity !== 'string' && !Buffer.isBuffer(entity)) {
	    throw new TypeError('argument entity must be string, Buffer, or fs.Stats')
	  }

	  // generate entity tag
	  var tag = isStats
	    ? stattag(entity)
	    : entitytag(entity)

	  return weak
	    ? 'W/' + tag
	    : tag
	}

	/**
	 * Determine if object is a Stats object.
	 *
	 * @param {object} obj
	 * @return {boolean}
	 * @api private
	 */

	function isstats(obj) {
	  // genuine fs.Stats
	  if (typeof Stats === 'function' && obj instanceof Stats) {
	    return true
	  }

	  // quack quack
	  return obj && typeof obj === 'object'
	    && 'ctime' in obj && toString.call(obj.ctime) === '[object Date]'
	    && 'mtime' in obj && toString.call(obj.mtime) === '[object Date]'
	    && 'ino' in obj && typeof obj.ino === 'number'
	    && 'size' in obj && typeof obj.size === 'number'
	}

	/**
	 * Generate a tag for a stat.
	 *
	 * @param {object} stat
	 * @return {string}
	 * @private
	 */

	function stattag(stat) {
	  var mtime = stat.mtime.getTime().toString(16)
	  var size = stat.size.toString(16)

	  return '"' + size + '-' + mtime + '"'
	}


/***/ },
/* 71 */
/***/ function(module, exports) {

	module.exports = require("crypto");

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * proxy-addr
	 * Copyright(c) 2014 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module exports.
	 */

	module.exports = proxyaddr;
	module.exports.all = alladdrs;
	module.exports.compile = compile;

	/**
	 * Module dependencies.
	 */

	var forwarded = __webpack_require__(73);
	var ipaddr = __webpack_require__(74);

	/**
	 * Variables.
	 */

	var digitre = /^[0-9]+$/;
	var isip = ipaddr.isValid;
	var parseip = ipaddr.parse;

	/**
	 * Pre-defined IP ranges.
	 */

	var ipranges = {
	  linklocal: ['169.254.0.0/16', 'fe80::/10'],
	  loopback: ['127.0.0.1/8', '::1/128'],
	  uniquelocal: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7']
	};

	/**
	 * Get all addresses in the request, optionally stopping
	 * at the first untrusted.
	 *
	 * @param {Object} request
	 * @param {Function|Array|String} [trust]
	 * @api public
	 */

	function alladdrs(req, trust) {
	  // get addresses
	  var addrs = forwarded(req);

	  if (!trust) {
	    // Return all addresses
	    return addrs;
	  }

	  if (typeof trust !== 'function') {
	    trust = compile(trust);
	  }

	  for (var i = 0; i < addrs.length - 1; i++) {
	    if (trust(addrs[i], i)) continue;

	    addrs.length = i + 1;
	  }

	  return addrs;
	}

	/**
	 * Compile argument into trust function.
	 *
	 * @param {Array|String} val
	 * @api private
	 */

	function compile(val) {
	  if (!val) {
	    throw new TypeError('argument is required');
	  }

	  var trust = typeof val === 'string'
	    ? [val]
	    : val;

	  if (!Array.isArray(trust)) {
	    throw new TypeError('unsupported trust argument');
	  }

	  for (var i = 0; i < trust.length; i++) {
	    val = trust[i];

	    if (!ipranges.hasOwnProperty(val)) {
	      continue;
	    }

	    // Splice in pre-defined range
	    val = ipranges[val];
	    trust.splice.apply(trust, [i, 1].concat(val));
	    i += val.length - 1;
	  }

	  return compileTrust(compileRangeSubnets(trust));
	}

	/**
	 * Compile `arr` elements into range subnets.
	 *
	 * @param {Array} arr
	 * @api private
	 */

	function compileRangeSubnets(arr) {
	  var rangeSubnets = new Array(arr.length);

	  for (var i = 0; i < arr.length; i++) {
	    rangeSubnets[i] = parseipNotation(arr[i]);
	  }

	  return rangeSubnets;
	}

	/**
	 * Compile range subnet array into trust function.
	 *
	 * @param {Array} rangeSubnets
	 * @api private
	 */

	function compileTrust(rangeSubnets) {
	  // Return optimized function based on length
	  var len = rangeSubnets.length;
	  return len === 0
	    ? trustNone
	    : len === 1
	    ? trustSingle(rangeSubnets[0])
	    : trustMulti(rangeSubnets);
	}

	/**
	 * Parse IP notation string into range subnet.
	 *
	 * @param {String} note
	 * @api private
	 */

	function parseipNotation(note) {
	  var ip;
	  var kind;
	  var max;
	  var pos = note.lastIndexOf('/');
	  var range;

	  ip = pos !== -1
	    ? note.substring(0, pos)
	    : note;

	  if (!isip(ip)) {
	    throw new TypeError('invalid IP address: ' + ip);
	  }

	  ip = parseip(ip);

	  kind = ip.kind();
	  max = kind === 'ipv6'
	    ? 128
	    : 32;

	  range = pos !== -1
	    ? note.substring(pos + 1, note.length)
	    : max;

	  if (typeof range !== 'number') {
	    range = digitre.test(range)
	      ? parseInt(range, 10)
	      : isip(range)
	      ? parseNetmask(range)
	      : 0;
	  }

	  if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) {
	    // Store as IPv4
	    ip = ip.toIPv4Address();
	    range = range <= max
	      ? range - 96
	      : range;
	  }

	  if (range <= 0 || range > max) {
	    throw new TypeError('invalid range on address: ' + note);
	  }

	  return [ip, range];
	}

	/**
	 * Parse netmask string into CIDR range.
	 *
	 * @param {String} note
	 * @api private
	 */

	function parseNetmask(netmask) {
	  var ip = parseip(netmask);
	  var parts;
	  var size;

	  switch (ip.kind()) {
	    case 'ipv4':
	      parts = ip.octets;
	      size = 8;
	      break;
	    case 'ipv6':
	      parts = ip.parts;
	      size = 16;
	      break;
	  }

	  var max = Math.pow(2, size) - 1;
	  var part;
	  var range = 0;

	  for (var i = 0; i < parts.length; i++) {
	    part = parts[i] & max;

	    if (part === max) {
	      range += size;
	      continue;
	    }

	    while (part) {
	      part = (part << 1) & max;
	      range += 1;
	    }

	    break;
	  }

	  return range;
	}

	/**
	 * Determine address of proxied request.
	 *
	 * @param {Object} request
	 * @param {Function|Array|String} trust
	 * @api public
	 */

	function proxyaddr(req, trust) {
	  if (!req) {
	    throw new TypeError('req argument is required');
	  }

	  if (!trust) {
	    throw new TypeError('trust argument is required');
	  }

	  var addrs = alladdrs(req, trust);
	  var addr = addrs[addrs.length - 1];

	  return addr;
	}

	/**
	 * Static trust function to trust nothing.
	 *
	 * @api private
	 */

	function trustNone() {
	  return false;
	}

	/**
	 * Compile trust function for multiple subnets.
	 *
	 * @param {Array} subnets
	 * @api private
	 */

	function trustMulti(subnets) {
	  return function trust(addr) {
	    if (!isip(addr)) return false;

	    var ip = parseip(addr);
	    var ipv4;
	    var kind = ip.kind();
	    var subnet;
	    var subnetip;
	    var subnetkind;
	    var subnetrange;
	    var trusted;

	    for (var i = 0; i < subnets.length; i++) {
	      subnet = subnets[i];
	      subnetip = subnet[0];
	      subnetkind = subnetip.kind();
	      subnetrange = subnet[1];
	      trusted = ip;

	      if (kind !== subnetkind) {
	        if (kind !== 'ipv6' || subnetkind !== 'ipv4' || !ip.isIPv4MappedAddress()) {
	          continue;
	        }

	        // Store addr as IPv4
	        ipv4 = ipv4 || ip.toIPv4Address();
	        trusted = ipv4;
	      }

	      if (trusted.match(subnetip, subnetrange)) return true;
	    }

	    return false;
	  };
	}

	/**
	 * Compile trust function for single subnet.
	 *
	 * @param {Object} subnet
	 * @api private
	 */

	function trustSingle(subnet) {
	  var subnetip = subnet[0];
	  var subnetkind = subnetip.kind();
	  var subnetisipv4 = subnetkind === 'ipv4';
	  var subnetrange = subnet[1];

	  return function trust(addr) {
	    if (!isip(addr)) return false;

	    var ip = parseip(addr);
	    var kind = ip.kind();

	    return kind === subnetkind
	      ? ip.match(subnetip, subnetrange)
	      : subnetisipv4 && kind === 'ipv6' && ip.isIPv4MappedAddress()
	      ? ip.toIPv4Address().match(subnetip, subnetrange)
	      : false;
	  };
	}


/***/ },
/* 73 */
/***/ function(module, exports) {

	/*!
	 * forwarded
	 * Copyright(c) 2014 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	/**
	 * Module exports.
	 */

	module.exports = forwarded

	/**
	 * Get all addresses in the request, using the `X-Forwarded-For` header.
	 *
	 * @param {Object} req
	 * @api public
	 */

	function forwarded(req) {
	  if (!req) {
	    throw new TypeError('argument req is required')
	  }

	  // simple header parsing
	  var proxyAddrs = (req.headers['x-forwarded-for'] || '')
	    .split(/ *, */)
	    .filter(Boolean)
	    .reverse()
	  var socketAddr = req.connection.remoteAddress
	  var addrs = [socketAddr].concat(proxyAddrs)

	  // return all addresses
	  return addrs
	}


/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {(function() {
	  var expandIPv6, ipaddr, ipv4Part, ipv4Regexes, ipv6Part, ipv6Regexes, matchCIDR, root;

	  ipaddr = {};

	  root = this;

	  if ((typeof module !== "undefined" && module !== null) && module.exports) {
	    module.exports = ipaddr;
	  } else {
	    root['ipaddr'] = ipaddr;
	  }

	  matchCIDR = function(first, second, partSize, cidrBits) {
	    var part, shift;
	    if (first.length !== second.length) {
	      throw new Error("ipaddr: cannot match CIDR for objects with different lengths");
	    }
	    part = 0;
	    while (cidrBits > 0) {
	      shift = partSize - cidrBits;
	      if (shift < 0) {
	        shift = 0;
	      }
	      if (first[part] >> shift !== second[part] >> shift) {
	        return false;
	      }
	      cidrBits -= partSize;
	      part += 1;
	    }
	    return true;
	  };

	  ipaddr.subnetMatch = function(address, rangeList, defaultName) {
	    var rangeName, rangeSubnets, subnet, _i, _len;
	    if (defaultName == null) {
	      defaultName = 'unicast';
	    }
	    for (rangeName in rangeList) {
	      rangeSubnets = rangeList[rangeName];
	      if (rangeSubnets[0] && !(rangeSubnets[0] instanceof Array)) {
	        rangeSubnets = [rangeSubnets];
	      }
	      for (_i = 0, _len = rangeSubnets.length; _i < _len; _i++) {
	        subnet = rangeSubnets[_i];
	        if (address.match.apply(address, subnet)) {
	          return rangeName;
	        }
	      }
	    }
	    return defaultName;
	  };

	  ipaddr.IPv4 = (function() {
	    function IPv4(octets) {
	      var octet, _i, _len;
	      if (octets.length !== 4) {
	        throw new Error("ipaddr: ipv4 octet count should be 4");
	      }
	      for (_i = 0, _len = octets.length; _i < _len; _i++) {
	        octet = octets[_i];
	        if (!((0 <= octet && octet <= 255))) {
	          throw new Error("ipaddr: ipv4 octet is a byte");
	        }
	      }
	      this.octets = octets;
	    }

	    IPv4.prototype.kind = function() {
	      return 'ipv4';
	    };

	    IPv4.prototype.toString = function() {
	      return this.octets.join(".");
	    };

	    IPv4.prototype.toByteArray = function() {
	      return this.octets.slice(0);
	    };

	    IPv4.prototype.match = function(other, cidrRange) {
	      var _ref;
	      if (cidrRange === void 0) {
	        _ref = other, other = _ref[0], cidrRange = _ref[1];
	      }
	      if (other.kind() !== 'ipv4') {
	        throw new Error("ipaddr: cannot match ipv4 address with non-ipv4 one");
	      }
	      return matchCIDR(this.octets, other.octets, 8, cidrRange);
	    };

	    IPv4.prototype.SpecialRanges = {
	      unspecified: [[new IPv4([0, 0, 0, 0]), 8]],
	      broadcast: [[new IPv4([255, 255, 255, 255]), 32]],
	      multicast: [[new IPv4([224, 0, 0, 0]), 4]],
	      linkLocal: [[new IPv4([169, 254, 0, 0]), 16]],
	      loopback: [[new IPv4([127, 0, 0, 0]), 8]],
	      "private": [[new IPv4([10, 0, 0, 0]), 8], [new IPv4([172, 16, 0, 0]), 12], [new IPv4([192, 168, 0, 0]), 16]],
	      reserved: [[new IPv4([192, 0, 0, 0]), 24], [new IPv4([192, 0, 2, 0]), 24], [new IPv4([192, 88, 99, 0]), 24], [new IPv4([198, 51, 100, 0]), 24], [new IPv4([203, 0, 113, 0]), 24], [new IPv4([240, 0, 0, 0]), 4]]
	    };

	    IPv4.prototype.range = function() {
	      return ipaddr.subnetMatch(this, this.SpecialRanges);
	    };

	    IPv4.prototype.toIPv4MappedAddress = function() {
	      return ipaddr.IPv6.parse("::ffff:" + (this.toString()));
	    };

	    return IPv4;

	  })();

	  ipv4Part = "(0?\\d+|0x[a-f0-9]+)";

	  ipv4Regexes = {
	    fourOctet: new RegExp("^" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$", 'i'),
	    longValue: new RegExp("^" + ipv4Part + "$", 'i')
	  };

	  ipaddr.IPv4.parser = function(string) {
	    var match, parseIntAuto, part, shift, value;
	    parseIntAuto = function(string) {
	      if (string[0] === "0" && string[1] !== "x") {
	        return parseInt(string, 8);
	      } else {
	        return parseInt(string);
	      }
	    };
	    if (match = string.match(ipv4Regexes.fourOctet)) {
	      return (function() {
	        var _i, _len, _ref, _results;
	        _ref = match.slice(1, 6);
	        _results = [];
	        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	          part = _ref[_i];
	          _results.push(parseIntAuto(part));
	        }
	        return _results;
	      })();
	    } else if (match = string.match(ipv4Regexes.longValue)) {
	      value = parseIntAuto(match[1]);
	      if (value > 0xffffffff || value < 0) {
	        throw new Error("ipaddr: address outside defined range");
	      }
	      return ((function() {
	        var _i, _results;
	        _results = [];
	        for (shift = _i = 0; _i <= 24; shift = _i += 8) {
	          _results.push((value >> shift) & 0xff);
	        }
	        return _results;
	      })()).reverse();
	    } else {
	      return null;
	    }
	  };

	  ipaddr.IPv6 = (function() {
	    function IPv6(parts) {
	      var part, _i, _len;
	      if (parts.length !== 8) {
	        throw new Error("ipaddr: ipv6 part count should be 8");
	      }
	      for (_i = 0, _len = parts.length; _i < _len; _i++) {
	        part = parts[_i];
	        if (!((0 <= part && part <= 0xffff))) {
	          throw new Error("ipaddr: ipv6 part should fit to two octets");
	        }
	      }
	      this.parts = parts;
	    }

	    IPv6.prototype.kind = function() {
	      return 'ipv6';
	    };

	    IPv6.prototype.toString = function() {
	      var compactStringParts, part, pushPart, state, stringParts, _i, _len;
	      stringParts = (function() {
	        var _i, _len, _ref, _results;
	        _ref = this.parts;
	        _results = [];
	        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	          part = _ref[_i];
	          _results.push(part.toString(16));
	        }
	        return _results;
	      }).call(this);
	      compactStringParts = [];
	      pushPart = function(part) {
	        return compactStringParts.push(part);
	      };
	      state = 0;
	      for (_i = 0, _len = stringParts.length; _i < _len; _i++) {
	        part = stringParts[_i];
	        switch (state) {
	          case 0:
	            if (part === '0') {
	              pushPart('');
	            } else {
	              pushPart(part);
	            }
	            state = 1;
	            break;
	          case 1:
	            if (part === '0') {
	              state = 2;
	            } else {
	              pushPart(part);
	            }
	            break;
	          case 2:
	            if (part !== '0') {
	              pushPart('');
	              pushPart(part);
	              state = 3;
	            }
	            break;
	          case 3:
	            pushPart(part);
	        }
	      }
	      if (state === 2) {
	        pushPart('');
	        pushPart('');
	      }
	      return compactStringParts.join(":");
	    };

	    IPv6.prototype.toByteArray = function() {
	      var bytes, part, _i, _len, _ref;
	      bytes = [];
	      _ref = this.parts;
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        part = _ref[_i];
	        bytes.push(part >> 8);
	        bytes.push(part & 0xff);
	      }
	      return bytes;
	    };

	    IPv6.prototype.toNormalizedString = function() {
	      var part;
	      return ((function() {
	        var _i, _len, _ref, _results;
	        _ref = this.parts;
	        _results = [];
	        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	          part = _ref[_i];
	          _results.push(part.toString(16));
	        }
	        return _results;
	      }).call(this)).join(":");
	    };

	    IPv6.prototype.match = function(other, cidrRange) {
	      var _ref;
	      if (cidrRange === void 0) {
	        _ref = other, other = _ref[0], cidrRange = _ref[1];
	      }
	      if (other.kind() !== 'ipv6') {
	        throw new Error("ipaddr: cannot match ipv6 address with non-ipv6 one");
	      }
	      return matchCIDR(this.parts, other.parts, 16, cidrRange);
	    };

	    IPv6.prototype.SpecialRanges = {
	      unspecified: [new IPv6([0, 0, 0, 0, 0, 0, 0, 0]), 128],
	      linkLocal: [new IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 0]), 10],
	      multicast: [new IPv6([0xff00, 0, 0, 0, 0, 0, 0, 0]), 8],
	      loopback: [new IPv6([0, 0, 0, 0, 0, 0, 0, 1]), 128],
	      uniqueLocal: [new IPv6([0xfc00, 0, 0, 0, 0, 0, 0, 0]), 7],
	      ipv4Mapped: [new IPv6([0, 0, 0, 0, 0, 0xffff, 0, 0]), 96],
	      rfc6145: [new IPv6([0, 0, 0, 0, 0xffff, 0, 0, 0]), 96],
	      rfc6052: [new IPv6([0x64, 0xff9b, 0, 0, 0, 0, 0, 0]), 96],
	      '6to4': [new IPv6([0x2002, 0, 0, 0, 0, 0, 0, 0]), 16],
	      teredo: [new IPv6([0x2001, 0, 0, 0, 0, 0, 0, 0]), 32],
	      reserved: [[new IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]), 32]]
	    };

	    IPv6.prototype.range = function() {
	      return ipaddr.subnetMatch(this, this.SpecialRanges);
	    };

	    IPv6.prototype.isIPv4MappedAddress = function() {
	      return this.range() === 'ipv4Mapped';
	    };

	    IPv6.prototype.toIPv4Address = function() {
	      var high, low, _ref;
	      if (!this.isIPv4MappedAddress()) {
	        throw new Error("ipaddr: trying to convert a generic ipv6 address to ipv4");
	      }
	      _ref = this.parts.slice(-2), high = _ref[0], low = _ref[1];
	      return new ipaddr.IPv4([high >> 8, high & 0xff, low >> 8, low & 0xff]);
	    };

	    return IPv6;

	  })();

	  ipv6Part = "(?:[0-9a-f]+::?)+";

	  ipv6Regexes = {
	    "native": new RegExp("^(::)?(" + ipv6Part + ")?([0-9a-f]+)?(::)?$", 'i'),
	    transitional: new RegExp(("^((?:" + ipv6Part + ")|(?:::)(?:" + ipv6Part + ")?)") + ("" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$"), 'i')
	  };

	  expandIPv6 = function(string, parts) {
	    var colonCount, lastColon, part, replacement, replacementCount;
	    if (string.indexOf('::') !== string.lastIndexOf('::')) {
	      return null;
	    }
	    colonCount = 0;
	    lastColon = -1;
	    while ((lastColon = string.indexOf(':', lastColon + 1)) >= 0) {
	      colonCount++;
	    }
	    if (string.substr(0, 2) === '::') {
	      colonCount--;
	    }
	    if (string.substr(-2, 2) === '::') {
	      colonCount--;
	    }
	    if (colonCount > parts) {
	      return null;
	    }
	    replacementCount = parts - colonCount;
	    replacement = ':';
	    while (replacementCount--) {
	      replacement += '0:';
	    }
	    string = string.replace('::', replacement);
	    if (string[0] === ':') {
	      string = string.slice(1);
	    }
	    if (string[string.length - 1] === ':') {
	      string = string.slice(0, -1);
	    }
	    return (function() {
	      var _i, _len, _ref, _results;
	      _ref = string.split(":");
	      _results = [];
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        part = _ref[_i];
	        _results.push(parseInt(part, 16));
	      }
	      return _results;
	    })();
	  };

	  ipaddr.IPv6.parser = function(string) {
	    var match, parts;
	    if (string.match(ipv6Regexes['native'])) {
	      return expandIPv6(string, 8);
	    } else if (match = string.match(ipv6Regexes['transitional'])) {
	      parts = expandIPv6(match[1].slice(0, -1), 6);
	      if (parts) {
	        parts.push(parseInt(match[2]) << 8 | parseInt(match[3]));
	        parts.push(parseInt(match[4]) << 8 | parseInt(match[5]));
	        return parts;
	      }
	    }
	    return null;
	  };

	  ipaddr.IPv4.isIPv4 = ipaddr.IPv6.isIPv6 = function(string) {
	    return this.parser(string) !== null;
	  };

	  ipaddr.IPv4.isValid = function(string) {
	    var e;
	    try {
	      new this(this.parser(string));
	      return true;
	    } catch (_error) {
	      e = _error;
	      return false;
	    }
	  };

	  ipaddr.IPv6.isValid = function(string) {
	    var e;
	    if (typeof string === "string" && string.indexOf(":") === -1) {
	      return false;
	    }
	    try {
	      new this(this.parser(string));
	      return true;
	    } catch (_error) {
	      e = _error;
	      return false;
	    }
	  };

	  ipaddr.IPv4.parse = ipaddr.IPv6.parse = function(string) {
	    var parts;
	    parts = this.parser(string);
	    if (parts === null) {
	      throw new Error("ipaddr: string is not formatted like ip address");
	    }
	    return new this(parts);
	  };

	  ipaddr.IPv4.parseCIDR = function(string) {
	    var maskLength, match;
	    if (match = string.match(/^(.+)\/(\d+)$/)) {
	      maskLength = parseInt(match[2]);
	      if (maskLength >= 0 && maskLength <= 32) {
	        return [this.parse(match[1]), maskLength];
	      }
	    }
	    throw new Error("ipaddr: string is not formatted like an IPv4 CIDR range");
	  };

	  ipaddr.IPv6.parseCIDR = function(string) {
	    var maskLength, match;
	    if (match = string.match(/^(.+)\/(\d+)$/)) {
	      maskLength = parseInt(match[2]);
	      if (maskLength >= 0 && maskLength <= 128) {
	        return [this.parse(match[1]), maskLength];
	      }
	    }
	    throw new Error("ipaddr: string is not formatted like an IPv6 CIDR range");
	  };

	  ipaddr.isValid = function(string) {
	    return ipaddr.IPv6.isValid(string) || ipaddr.IPv4.isValid(string);
	  };

	  ipaddr.parse = function(string) {
	    if (ipaddr.IPv6.isValid(string)) {
	      return ipaddr.IPv6.parse(string);
	    } else if (ipaddr.IPv4.isValid(string)) {
	      return ipaddr.IPv4.parse(string);
	    } else {
	      throw new Error("ipaddr: the address has neither IPv6 nor IPv4 format");
	    }
	  };

	  ipaddr.parseCIDR = function(string) {
	    var e;
	    try {
	      return ipaddr.IPv6.parseCIDR(string);
	    } catch (_error) {
	      e = _error;
	      try {
	        return ipaddr.IPv4.parseCIDR(string);
	      } catch (_error) {
	        e = _error;
	        throw new Error("ipaddr: the address has neither IPv6 nor IPv4 CIDR format");
	      }
	    }
	  };

	  ipaddr.process = function(string) {
	    var addr;
	    addr = this.parse(string);
	    if (addr.kind() === 'ipv6' && addr.isIPv4MappedAddress()) {
	      return addr.toIPv4Address();
	    } else {
	      return addr;
	    }
	  };

	}).call(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)(module)))

/***/ },
/* 75 */
/***/ function(module, exports) {

	module.exports = require("querystring");

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./application": 21,
		"./application.js": 21,
		"./express": 18,
		"./express.js": 18,
		"./middleware/init": 49,
		"./middleware/init.js": 49,
		"./middleware/query": 50,
		"./middleware/query.js": 50,
		"./request": 77,
		"./request.js": 77,
		"./response": 89,
		"./response.js": 89,
		"./router/index": 34,
		"./router/index.js": 34,
		"./router/layer": 37,
		"./router/layer.js": 37,
		"./router/route": 35,
		"./router/route.js": 35,
		"./utils": 56,
		"./utils.js": 56,
		"./view": 55,
		"./view.js": 55
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 76;


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2013 Roman Shtylman
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @private
	 */

	var accepts = __webpack_require__(78);
	var deprecate = __webpack_require__(41)('express');
	var isIP = __webpack_require__(28).isIP;
	var typeis = __webpack_require__(87);
	var http = __webpack_require__(30);
	var fresh = __webpack_require__(69);
	var parseRange = __webpack_require__(66);
	var parse = __webpack_require__(47);
	var proxyaddr = __webpack_require__(72);

	/**
	 * Request prototype.
	 */

	var req = exports = module.exports = {
	  __proto__: http.IncomingMessage.prototype
	};

	/**
	 * Return request header.
	 *
	 * The `Referrer` header field is special-cased,
	 * both `Referrer` and `Referer` are interchangeable.
	 *
	 * Examples:
	 *
	 *     req.get('Content-Type');
	 *     // => "text/plain"
	 *
	 *     req.get('content-type');
	 *     // => "text/plain"
	 *
	 *     req.get('Something');
	 *     // => undefined
	 *
	 * Aliased as `req.header()`.
	 *
	 * @param {String} name
	 * @return {String}
	 * @public
	 */

	req.get =
	req.header = function header(name) {
	  var lc = name.toLowerCase();

	  switch (lc) {
	    case 'referer':
	    case 'referrer':
	      return this.headers.referrer
	        || this.headers.referer;
	    default:
	      return this.headers[lc];
	  }
	};

	/**
	 * To do: update docs.
	 *
	 * Check if the given `type(s)` is acceptable, returning
	 * the best match when true, otherwise `undefined`, in which
	 * case you should respond with 406 "Not Acceptable".
	 *
	 * The `type` value may be a single MIME type string
	 * such as "application/json", an extension name
	 * such as "json", a comma-delimited list such as "json, html, text/plain",
	 * an argument list such as `"json", "html", "text/plain"`,
	 * or an array `["json", "html", "text/plain"]`. When a list
	 * or array is given, the _best_ match, if any is returned.
	 *
	 * Examples:
	 *
	 *     // Accept: text/html
	 *     req.accepts('html');
	 *     // => "html"
	 *
	 *     // Accept: text/*, application/json
	 *     req.accepts('html');
	 *     // => "html"
	 *     req.accepts('text/html');
	 *     // => "text/html"
	 *     req.accepts('json, text');
	 *     // => "json"
	 *     req.accepts('application/json');
	 *     // => "application/json"
	 *
	 *     // Accept: text/*, application/json
	 *     req.accepts('image/png');
	 *     req.accepts('png');
	 *     // => undefined
	 *
	 *     // Accept: text/*;q=.5, application/json
	 *     req.accepts(['html', 'json']);
	 *     req.accepts('html', 'json');
	 *     req.accepts('html, json');
	 *     // => "json"
	 *
	 * @param {String|Array} type(s)
	 * @return {String|Array|Boolean}
	 * @public
	 */

	req.accepts = function(){
	  var accept = accepts(this);
	  return accept.types.apply(accept, arguments);
	};

	/**
	 * Check if the given `encoding`s are accepted.
	 *
	 * @param {String} ...encoding
	 * @return {String|Array}
	 * @public
	 */

	req.acceptsEncodings = function(){
	  var accept = accepts(this);
	  return accept.encodings.apply(accept, arguments);
	};

	req.acceptsEncoding = deprecate.function(req.acceptsEncodings,
	  'req.acceptsEncoding: Use acceptsEncodings instead');

	/**
	 * Check if the given `charset`s are acceptable,
	 * otherwise you should respond with 406 "Not Acceptable".
	 *
	 * @param {String} ...charset
	 * @return {String|Array}
	 * @public
	 */

	req.acceptsCharsets = function(){
	  var accept = accepts(this);
	  return accept.charsets.apply(accept, arguments);
	};

	req.acceptsCharset = deprecate.function(req.acceptsCharsets,
	  'req.acceptsCharset: Use acceptsCharsets instead');

	/**
	 * Check if the given `lang`s are acceptable,
	 * otherwise you should respond with 406 "Not Acceptable".
	 *
	 * @param {String} ...lang
	 * @return {String|Array}
	 * @public
	 */

	req.acceptsLanguages = function(){
	  var accept = accepts(this);
	  return accept.languages.apply(accept, arguments);
	};

	req.acceptsLanguage = deprecate.function(req.acceptsLanguages,
	  'req.acceptsLanguage: Use acceptsLanguages instead');

	/**
	 * Parse Range header field,
	 * capping to the given `size`.
	 *
	 * Unspecified ranges such as "0-" require
	 * knowledge of your resource length. In
	 * the case of a byte range this is of course
	 * the total number of bytes. If the Range
	 * header field is not given `null` is returned,
	 * `-1` when unsatisfiable, `-2` when syntactically invalid.
	 *
	 * NOTE: remember that ranges are inclusive, so
	 * for example "Range: users=0-3" should respond
	 * with 4 users when available, not 3.
	 *
	 * @param {Number} size
	 * @return {Array}
	 * @public
	 */

	req.range = function(size){
	  var range = this.get('Range');
	  if (!range) return;
	  return parseRange(size, range);
	};

	/**
	 * Return the value of param `name` when present or `defaultValue`.
	 *
	 *  - Checks route placeholders, ex: _/user/:id_
	 *  - Checks body params, ex: id=12, {"id":12}
	 *  - Checks query string params, ex: ?id=12
	 *
	 * To utilize request bodies, `req.body`
	 * should be an object. This can be done by using
	 * the `bodyParser()` middleware.
	 *
	 * @param {String} name
	 * @param {Mixed} [defaultValue]
	 * @return {String}
	 * @public
	 */

	req.param = function param(name, defaultValue) {
	  var params = this.params || {};
	  var body = this.body || {};
	  var query = this.query || {};

	  var args = arguments.length === 1
	    ? 'name'
	    : 'name, default';
	  deprecate('req.param(' + args + '): Use req.params, req.body, or req.query instead');

	  if (null != params[name] && params.hasOwnProperty(name)) return params[name];
	  if (null != body[name]) return body[name];
	  if (null != query[name]) return query[name];

	  return defaultValue;
	};

	/**
	 * Check if the incoming request contains the "Content-Type"
	 * header field, and it contains the give mime `type`.
	 *
	 * Examples:
	 *
	 *      // With Content-Type: text/html; charset=utf-8
	 *      req.is('html');
	 *      req.is('text/html');
	 *      req.is('text/*');
	 *      // => true
	 *
	 *      // When Content-Type is application/json
	 *      req.is('json');
	 *      req.is('application/json');
	 *      req.is('application/*');
	 *      // => true
	 *
	 *      req.is('html');
	 *      // => false
	 *
	 * @param {String|Array} types...
	 * @return {String|false|null}
	 * @public
	 */

	req.is = function is(types) {
	  var arr = types;

	  // support flattened arguments
	  if (!Array.isArray(types)) {
	    arr = new Array(arguments.length);
	    for (var i = 0; i < arr.length; i++) {
	      arr[i] = arguments[i];
	    }
	  }

	  return typeis(this, arr);
	};

	/**
	 * Return the protocol string "http" or "https"
	 * when requested with TLS. When the "trust proxy"
	 * setting trusts the socket address, the
	 * "X-Forwarded-Proto" header field will be trusted
	 * and used if present.
	 *
	 * If you're running behind a reverse proxy that
	 * supplies https for you this may be enabled.
	 *
	 * @return {String}
	 * @public
	 */

	defineGetter(req, 'protocol', function protocol(){
	  var proto = this.connection.encrypted
	    ? 'https'
	    : 'http';
	  var trust = this.app.get('trust proxy fn');

	  if (!trust(this.connection.remoteAddress, 0)) {
	    return proto;
	  }

	  // Note: X-Forwarded-Proto is normally only ever a
	  //       single value, but this is to be safe.
	  proto = this.get('X-Forwarded-Proto') || proto;
	  return proto.split(/\s*,\s*/)[0];
	});

	/**
	 * Short-hand for:
	 *
	 *    req.protocol == 'https'
	 *
	 * @return {Boolean}
	 * @public
	 */

	defineGetter(req, 'secure', function secure(){
	  return this.protocol === 'https';
	});

	/**
	 * Return the remote address from the trusted proxy.
	 *
	 * The is the remote address on the socket unless
	 * "trust proxy" is set.
	 *
	 * @return {String}
	 * @public
	 */

	defineGetter(req, 'ip', function ip(){
	  var trust = this.app.get('trust proxy fn');
	  return proxyaddr(this, trust);
	});

	/**
	 * When "trust proxy" is set, trusted proxy addresses + client.
	 *
	 * For example if the value were "client, proxy1, proxy2"
	 * you would receive the array `["client", "proxy1", "proxy2"]`
	 * where "proxy2" is the furthest down-stream and "proxy1" and
	 * "proxy2" were trusted.
	 *
	 * @return {Array}
	 * @public
	 */

	defineGetter(req, 'ips', function ips() {
	  var trust = this.app.get('trust proxy fn');
	  var addrs = proxyaddr.all(this, trust);
	  return addrs.slice(1).reverse();
	});

	/**
	 * Return subdomains as an array.
	 *
	 * Subdomains are the dot-separated parts of the host before the main domain of
	 * the app. By default, the domain of the app is assumed to be the last two
	 * parts of the host. This can be changed by setting "subdomain offset".
	 *
	 * For example, if the domain is "tobi.ferrets.example.com":
	 * If "subdomain offset" is not set, req.subdomains is `["ferrets", "tobi"]`.
	 * If "subdomain offset" is 3, req.subdomains is `["tobi"]`.
	 *
	 * @return {Array}
	 * @public
	 */

	defineGetter(req, 'subdomains', function subdomains() {
	  var hostname = this.hostname;

	  if (!hostname) return [];

	  var offset = this.app.get('subdomain offset');
	  var subdomains = !isIP(hostname)
	    ? hostname.split('.').reverse()
	    : [hostname];

	  return subdomains.slice(offset);
	});

	/**
	 * Short-hand for `url.parse(req.url).pathname`.
	 *
	 * @return {String}
	 * @public
	 */

	defineGetter(req, 'path', function path() {
	  return parse(this).pathname;
	});

	/**
	 * Parse the "Host" header field to a hostname.
	 *
	 * When the "trust proxy" setting trusts the socket
	 * address, the "X-Forwarded-Host" header field will
	 * be trusted.
	 *
	 * @return {String}
	 * @public
	 */

	defineGetter(req, 'hostname', function hostname(){
	  var trust = this.app.get('trust proxy fn');
	  var host = this.get('X-Forwarded-Host');

	  if (!host || !trust(this.connection.remoteAddress, 0)) {
	    host = this.get('Host');
	  }

	  if (!host) return;

	  // IPv6 literal support
	  var offset = host[0] === '['
	    ? host.indexOf(']') + 1
	    : 0;
	  var index = host.indexOf(':', offset);

	  return index !== -1
	    ? host.substring(0, index)
	    : host;
	});

	// TODO: change req.host to return host in next major

	defineGetter(req, 'host', deprecate.function(function host(){
	  return this.hostname;
	}, 'req.host: Use req.hostname instead'));

	/**
	 * Check if the request is fresh, aka
	 * Last-Modified and/or the ETag
	 * still match.
	 *
	 * @return {Boolean}
	 * @public
	 */

	defineGetter(req, 'fresh', function(){
	  var method = this.method;
	  var s = this.res.statusCode;

	  // GET or HEAD for weak freshness validation only
	  if ('GET' != method && 'HEAD' != method) return false;

	  // 2xx or 304 as per rfc2616 14.26
	  if ((s >= 200 && s < 300) || 304 == s) {
	    return fresh(this.headers, (this.res._headers || {}));
	  }

	  return false;
	});

	/**
	 * Check if the request is stale, aka
	 * "Last-Modified" and / or the "ETag" for the
	 * resource has changed.
	 *
	 * @return {Boolean}
	 * @public
	 */

	defineGetter(req, 'stale', function stale(){
	  return !this.fresh;
	});

	/**
	 * Check if the request was an _XMLHttpRequest_.
	 *
	 * @return {Boolean}
	 * @public
	 */

	defineGetter(req, 'xhr', function xhr(){
	  var val = this.get('X-Requested-With') || '';
	  return val.toLowerCase() === 'xmlhttprequest';
	});

	/**
	 * Helper function for creating a getter on an object.
	 *
	 * @param {Object} obj
	 * @param {String} name
	 * @param {Function} getter
	 * @private
	 */
	function defineGetter(obj, name, getter) {
	  Object.defineProperty(obj, name, {
	    configurable: true,
	    enumerable: true,
	    get: getter
	  });
	};


/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * accepts
	 * Copyright(c) 2014 Jonathan Ong
	 * Copyright(c) 2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 * @private
	 */

	var Negotiator = __webpack_require__(79)
	var mime = __webpack_require__(84)

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = Accepts

	/**
	 * Create a new Accepts object for the given req.
	 *
	 * @param {object} req
	 * @public
	 */

	function Accepts(req) {
	  if (!(this instanceof Accepts))
	    return new Accepts(req)

	  this.headers = req.headers
	  this.negotiator = new Negotiator(req)
	}

	/**
	 * Check if the given `type(s)` is acceptable, returning
	 * the best match when true, otherwise `undefined`, in which
	 * case you should respond with 406 "Not Acceptable".
	 *
	 * The `type` value may be a single mime type string
	 * such as "application/json", the extension name
	 * such as "json" or an array `["json", "html", "text/plain"]`. When a list
	 * or array is given the _best_ match, if any is returned.
	 *
	 * Examples:
	 *
	 *     // Accept: text/html
	 *     this.types('html');
	 *     // => "html"
	 *
	 *     // Accept: text/*, application/json
	 *     this.types('html');
	 *     // => "html"
	 *     this.types('text/html');
	 *     // => "text/html"
	 *     this.types('json', 'text');
	 *     // => "json"
	 *     this.types('application/json');
	 *     // => "application/json"
	 *
	 *     // Accept: text/*, application/json
	 *     this.types('image/png');
	 *     this.types('png');
	 *     // => undefined
	 *
	 *     // Accept: text/*;q=.5, application/json
	 *     this.types(['html', 'json']);
	 *     this.types('html', 'json');
	 *     // => "json"
	 *
	 * @param {String|Array} types...
	 * @return {String|Array|Boolean}
	 * @public
	 */

	Accepts.prototype.type =
	Accepts.prototype.types = function (types_) {
	  var types = types_

	  // support flattened arguments
	  if (types && !Array.isArray(types)) {
	    types = new Array(arguments.length)
	    for (var i = 0; i < types.length; i++) {
	      types[i] = arguments[i]
	    }
	  }

	  // no types, return all requested types
	  if (!types || types.length === 0) {
	    return this.negotiator.mediaTypes()
	  }

	  if (!this.headers.accept) return types[0];
	  var mimes = types.map(extToMime);
	  var accepts = this.negotiator.mediaTypes(mimes.filter(validMime));
	  var first = accepts[0];
	  if (!first) return false;
	  return types[mimes.indexOf(first)];
	}

	/**
	 * Return accepted encodings or best fit based on `encodings`.
	 *
	 * Given `Accept-Encoding: gzip, deflate`
	 * an array sorted by quality is returned:
	 *
	 *     ['gzip', 'deflate']
	 *
	 * @param {String|Array} encodings...
	 * @return {String|Array}
	 * @public
	 */

	Accepts.prototype.encoding =
	Accepts.prototype.encodings = function (encodings_) {
	  var encodings = encodings_

	  // support flattened arguments
	  if (encodings && !Array.isArray(encodings)) {
	    encodings = new Array(arguments.length)
	    for (var i = 0; i < encodings.length; i++) {
	      encodings[i] = arguments[i]
	    }
	  }

	  // no encodings, return all requested encodings
	  if (!encodings || encodings.length === 0) {
	    return this.negotiator.encodings()
	  }

	  return this.negotiator.encodings(encodings)[0] || false
	}

	/**
	 * Return accepted charsets or best fit based on `charsets`.
	 *
	 * Given `Accept-Charset: utf-8, iso-8859-1;q=0.2, utf-7;q=0.5`
	 * an array sorted by quality is returned:
	 *
	 *     ['utf-8', 'utf-7', 'iso-8859-1']
	 *
	 * @param {String|Array} charsets...
	 * @return {String|Array}
	 * @public
	 */

	Accepts.prototype.charset =
	Accepts.prototype.charsets = function (charsets_) {
	  var charsets = charsets_

	  // support flattened arguments
	  if (charsets && !Array.isArray(charsets)) {
	    charsets = new Array(arguments.length)
	    for (var i = 0; i < charsets.length; i++) {
	      charsets[i] = arguments[i]
	    }
	  }

	  // no charsets, return all requested charsets
	  if (!charsets || charsets.length === 0) {
	    return this.negotiator.charsets()
	  }

	  return this.negotiator.charsets(charsets)[0] || false
	}

	/**
	 * Return accepted languages or best fit based on `langs`.
	 *
	 * Given `Accept-Language: en;q=0.8, es, pt`
	 * an array sorted by quality is returned:
	 *
	 *     ['es', 'pt', 'en']
	 *
	 * @param {String|Array} langs...
	 * @return {Array|String}
	 * @public
	 */

	Accepts.prototype.lang =
	Accepts.prototype.langs =
	Accepts.prototype.language =
	Accepts.prototype.languages = function (languages_) {
	  var languages = languages_

	  // support flattened arguments
	  if (languages && !Array.isArray(languages)) {
	    languages = new Array(arguments.length)
	    for (var i = 0; i < languages.length; i++) {
	      languages[i] = arguments[i]
	    }
	  }

	  // no languages, return all requested languages
	  if (!languages || languages.length === 0) {
	    return this.negotiator.languages()
	  }

	  return this.negotiator.languages(languages)[0] || false
	}

	/**
	 * Convert extnames to mime.
	 *
	 * @param {String} type
	 * @return {String}
	 * @private
	 */

	function extToMime(type) {
	  return type.indexOf('/') === -1
	    ? mime.lookup(type)
	    : type
	}

	/**
	 * Check if mime is valid.
	 *
	 * @param {String} type
	 * @return {String}
	 * @private
	 */

	function validMime(type) {
	  return typeof type === 'string';
	}


/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	
	var preferredCharsets = __webpack_require__(80);
	var preferredEncodings = __webpack_require__(81);
	var preferredLanguages = __webpack_require__(82);
	var preferredMediaTypes = __webpack_require__(83);

	module.exports = Negotiator;
	Negotiator.Negotiator = Negotiator;

	function Negotiator(request) {
	  if (!(this instanceof Negotiator)) {
	    return new Negotiator(request);
	  }

	  this.request = request;
	}

	Negotiator.prototype.charset = function charset(available) {
	  var set = this.charsets(available);
	  return set && set[0];
	};

	Negotiator.prototype.charsets = function charsets(available) {
	  return preferredCharsets(this.request.headers['accept-charset'], available);
	};

	Negotiator.prototype.encoding = function encoding(available) {
	  var set = this.encodings(available);
	  return set && set[0];
	};

	Negotiator.prototype.encodings = function encodings(available) {
	  return preferredEncodings(this.request.headers['accept-encoding'], available);
	};

	Negotiator.prototype.language = function language(available) {
	  var set = this.languages(available);
	  return set && set[0];
	};

	Negotiator.prototype.languages = function languages(available) {
	  return preferredLanguages(this.request.headers['accept-language'], available);
	};

	Negotiator.prototype.mediaType = function mediaType(available) {
	  var set = this.mediaTypes(available);
	  return set && set[0];
	};

	Negotiator.prototype.mediaTypes = function mediaTypes(available) {
	  return preferredMediaTypes(this.request.headers.accept, available);
	};

	// Backwards compatibility
	Negotiator.prototype.preferredCharset = Negotiator.prototype.charset;
	Negotiator.prototype.preferredCharsets = Negotiator.prototype.charsets;
	Negotiator.prototype.preferredEncoding = Negotiator.prototype.encoding;
	Negotiator.prototype.preferredEncodings = Negotiator.prototype.encodings;
	Negotiator.prototype.preferredLanguage = Negotiator.prototype.language;
	Negotiator.prototype.preferredLanguages = Negotiator.prototype.languages;
	Negotiator.prototype.preferredMediaType = Negotiator.prototype.mediaType;
	Negotiator.prototype.preferredMediaTypes = Negotiator.prototype.mediaTypes;


/***/ },
/* 80 */
/***/ function(module, exports) {

	module.exports = preferredCharsets;
	preferredCharsets.preferredCharsets = preferredCharsets;

	function parseAcceptCharset(accept) {
	  var accepts = accept.split(',');

	  for (var i = 0, j = 0; i < accepts.length; i++) {
	    var charset = parseCharset(accepts[i].trim(), i);

	    if (charset) {
	      accepts[j++] = charset;
	    }
	  }

	  // trim accepts
	  accepts.length = j;

	  return accepts;
	}

	function parseCharset(s, i) {
	  var match = s.match(/^\s*(\S+?)\s*(?:;(.*))?$/);
	  if (!match) return null;

	  var charset = match[1];
	  var q = 1;
	  if (match[2]) {
	    var params = match[2].split(';')
	    for (var i = 0; i < params.length; i ++) {
	      var p = params[i].trim().split('=');
	      if (p[0] === 'q') {
	        q = parseFloat(p[1]);
	        break;
	      }
	    }
	  }

	  return {
	    charset: charset,
	    q: q,
	    i: i
	  };
	}

	function getCharsetPriority(charset, accepted, index) {
	  var priority = {o: -1, q: 0, s: 0};

	  for (var i = 0; i < accepted.length; i++) {
	    var spec = specify(charset, accepted[i], index);

	    if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
	      priority = spec;
	    }
	  }

	  return priority;
	}

	function specify(charset, spec, index) {
	  var s = 0;
	  if(spec.charset.toLowerCase() === charset.toLowerCase()){
	    s |= 1;
	  } else if (spec.charset !== '*' ) {
	    return null
	  }

	  return {
	    i: index,
	    o: spec.i,
	    q: spec.q,
	    s: s
	  }
	}

	function preferredCharsets(accept, provided) {
	  // RFC 2616 sec 14.2: no header = *
	  var accepts = parseAcceptCharset(accept === undefined ? '*' : accept || '');

	  if (!provided) {
	    // sorted list of all charsets
	    return accepts.filter(isQuality).sort(compareSpecs).map(function getCharset(spec) {
	      return spec.charset;
	    });
	  }

	  var priorities = provided.map(function getPriority(type, index) {
	    return getCharsetPriority(type, accepts, index);
	  });

	  // sorted list of accepted charsets
	  return priorities.filter(isQuality).sort(compareSpecs).map(function getCharset(priority) {
	    return provided[priorities.indexOf(priority)];
	  });
	}

	function compareSpecs(a, b) {
	  return (b.q - a.q) || (b.s - a.s) || (a.o - b.o) || (a.i - b.i) || 0;
	}

	function isQuality(spec) {
	  return spec.q > 0;
	}


/***/ },
/* 81 */
/***/ function(module, exports) {

	module.exports = preferredEncodings;
	preferredEncodings.preferredEncodings = preferredEncodings;

	function parseAcceptEncoding(accept) {
	  var accepts = accept.split(',');
	  var hasIdentity = false;
	  var minQuality = 1;

	  for (var i = 0, j = 0; i < accepts.length; i++) {
	    var encoding = parseEncoding(accepts[i].trim(), i);

	    if (encoding) {
	      accepts[j++] = encoding;
	      hasIdentity = hasIdentity || specify('identity', encoding);
	      minQuality = Math.min(minQuality, encoding.q || 1);
	    }
	  }

	  if (!hasIdentity) {
	    /*
	     * If identity doesn't explicitly appear in the accept-encoding header,
	     * it's added to the list of acceptable encoding with the lowest q
	     */
	    accepts[j++] = {
	      encoding: 'identity',
	      q: minQuality,
	      i: i
	    };
	  }

	  // trim accepts
	  accepts.length = j;

	  return accepts;
	}

	function parseEncoding(s, i) {
	  var match = s.match(/^\s*(\S+?)\s*(?:;(.*))?$/);

	  if (!match) return null;

	  var encoding = match[1];
	  var q = 1;
	  if (match[2]) {
	    var params = match[2].split(';');
	    for (var i = 0; i < params.length; i ++) {
	      var p = params[i].trim().split('=');
	      if (p[0] === 'q') {
	        q = parseFloat(p[1]);
	        break;
	      }
	    }
	  }

	  return {
	    encoding: encoding,
	    q: q,
	    i: i
	  };
	}

	function getEncodingPriority(encoding, accepted, index) {
	  var priority = {o: -1, q: 0, s: 0};

	  for (var i = 0; i < accepted.length; i++) {
	    var spec = specify(encoding, accepted[i], index);

	    if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
	      priority = spec;
	    }
	  }

	  return priority;
	}

	function specify(encoding, spec, index) {
	  var s = 0;
	  if(spec.encoding.toLowerCase() === encoding.toLowerCase()){
	    s |= 1;
	  } else if (spec.encoding !== '*' ) {
	    return null
	  }

	  return {
	    i: index,
	    o: spec.i,
	    q: spec.q,
	    s: s
	  }
	};

	function preferredEncodings(accept, provided) {
	  var accepts = parseAcceptEncoding(accept || '');

	  if (!provided) {
	    // sorted list of all encodings
	    return accepts.filter(isQuality).sort(compareSpecs).map(function getEncoding(spec) {
	      return spec.encoding;
	    });
	  }

	  var priorities = provided.map(function getPriority(type, index) {
	    return getEncodingPriority(type, accepts, index);
	  });

	  // sorted list of accepted encodings
	  return priorities.filter(isQuality).sort(compareSpecs).map(function getEncoding(priority) {
	    return provided[priorities.indexOf(priority)];
	  });
	}

	function compareSpecs(a, b) {
	  return (b.q - a.q) || (b.s - a.s) || (a.o - b.o) || (a.i - b.i) || 0;
	}

	function isQuality(spec) {
	  return spec.q > 0;
	}


/***/ },
/* 82 */
/***/ function(module, exports) {

	module.exports = preferredLanguages;
	preferredLanguages.preferredLanguages = preferredLanguages;

	function parseAcceptLanguage(accept) {
	  var accepts = accept.split(',');

	  for (var i = 0, j = 0; i < accepts.length; i++) {
	    var langauge = parseLanguage(accepts[i].trim(), i);

	    if (langauge) {
	      accepts[j++] = langauge;
	    }
	  }

	  // trim accepts
	  accepts.length = j;

	  return accepts;
	}

	function parseLanguage(s, i) {
	  var match = s.match(/^\s*(\S+?)(?:-(\S+?))?\s*(?:;(.*))?$/);
	  if (!match) return null;

	  var prefix = match[1],
	      suffix = match[2],
	      full = prefix;

	  if (suffix) full += "-" + suffix;

	  var q = 1;
	  if (match[3]) {
	    var params = match[3].split(';')
	    for (var i = 0; i < params.length; i ++) {
	      var p = params[i].split('=');
	      if (p[0] === 'q') q = parseFloat(p[1]);
	    }
	  }

	  return {
	    prefix: prefix,
	    suffix: suffix,
	    q: q,
	    i: i,
	    full: full
	  };
	}

	function getLanguagePriority(language, accepted, index) {
	  var priority = {o: -1, q: 0, s: 0};

	  for (var i = 0; i < accepted.length; i++) {
	    var spec = specify(language, accepted[i], index);

	    if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
	      priority = spec;
	    }
	  }

	  return priority;
	}

	function specify(language, spec, index) {
	  var p = parseLanguage(language)
	  if (!p) return null;
	  var s = 0;
	  if(spec.full.toLowerCase() === p.full.toLowerCase()){
	    s |= 4;
	  } else if (spec.prefix.toLowerCase() === p.full.toLowerCase()) {
	    s |= 2;
	  } else if (spec.full.toLowerCase() === p.prefix.toLowerCase()) {
	    s |= 1;
	  } else if (spec.full !== '*' ) {
	    return null
	  }

	  return {
	    i: index,
	    o: spec.i,
	    q: spec.q,
	    s: s
	  }
	};

	function preferredLanguages(accept, provided) {
	  // RFC 2616 sec 14.4: no header = *
	  var accepts = parseAcceptLanguage(accept === undefined ? '*' : accept || '');

	  if (!provided) {
	    // sorted list of all languages
	    return accepts.filter(isQuality).sort(compareSpecs).map(function getLanguage(spec) {
	      return spec.full;
	    });
	  }

	  var priorities = provided.map(function getPriority(type, index) {
	    return getLanguagePriority(type, accepts, index);
	  });

	  // sorted list of accepted languages
	  return priorities.filter(isQuality).sort(compareSpecs).map(function getLanguage(priority) {
	    return provided[priorities.indexOf(priority)];
	  });
	}

	function compareSpecs(a, b) {
	  return (b.q - a.q) || (b.s - a.s) || (a.o - b.o) || (a.i - b.i) || 0;
	}

	function isQuality(spec) {
	  return spec.q > 0;
	}


/***/ },
/* 83 */
/***/ function(module, exports) {

	/**
	 * negotiator
	 * Copyright(c) 2012 Isaac Z. Schlueter
	 * Copyright(c) 2014 Federico Romero
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	module.exports = preferredMediaTypes;
	preferredMediaTypes.preferredMediaTypes = preferredMediaTypes;

	function parseAccept(accept) {
	  var accepts = splitMediaTypes(accept);

	  for (var i = 0, j = 0; i < accepts.length; i++) {
	    var mediaType = parseMediaType(accepts[i].trim(), i);

	    if (mediaType) {
	      accepts[j++] = mediaType;
	    }
	  }

	  // trim accepts
	  accepts.length = j;

	  return accepts;
	};

	function parseMediaType(s, i) {
	  var match = s.match(/\s*(\S+?)\/([^;\s]+)\s*(?:;(.*))?/);
	  if (!match) return null;

	  var type = match[1],
	      subtype = match[2],
	      full = "" + type + "/" + subtype,
	      params = {},
	      q = 1;

	  if (match[3]) {
	    params = match[3].split(';').map(function(s) {
	      return s.trim().split('=');
	    }).reduce(function (set, p) {
	      var name = p[0].toLowerCase();
	      var value = p[1];

	      set[name] = value && value[0] === '"' && value[value.length - 1] === '"'
	        ? value.substr(1, value.length - 2)
	        : value;

	      return set;
	    }, params);

	    if (params.q != null) {
	      q = parseFloat(params.q);
	      delete params.q;
	    }
	  }

	  return {
	    type: type,
	    subtype: subtype,
	    params: params,
	    q: q,
	    i: i,
	    full: full
	  };
	}

	function getMediaTypePriority(type, accepted, index) {
	  var priority = {o: -1, q: 0, s: 0};

	  for (var i = 0; i < accepted.length; i++) {
	    var spec = specify(type, accepted[i], index);

	    if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
	      priority = spec;
	    }
	  }

	  return priority;
	}

	function specify(type, spec, index) {
	  var p = parseMediaType(type);
	  var s = 0;

	  if (!p) {
	    return null;
	  }

	  if(spec.type.toLowerCase() == p.type.toLowerCase()) {
	    s |= 4
	  } else if(spec.type != '*') {
	    return null;
	  }

	  if(spec.subtype.toLowerCase() == p.subtype.toLowerCase()) {
	    s |= 2
	  } else if(spec.subtype != '*') {
	    return null;
	  }

	  var keys = Object.keys(spec.params);
	  if (keys.length > 0) {
	    if (keys.every(function (k) {
	      return spec.params[k] == '*' || (spec.params[k] || '').toLowerCase() == (p.params[k] || '').toLowerCase();
	    })) {
	      s |= 1
	    } else {
	      return null
	    }
	  }

	  return {
	    i: index,
	    o: spec.i,
	    q: spec.q,
	    s: s,
	  }

	}

	function preferredMediaTypes(accept, provided) {
	  // RFC 2616 sec 14.2: no header = */*
	  var accepts = parseAccept(accept === undefined ? '*/*' : accept || '');

	  if (!provided) {
	    // sorted list of all types
	    return accepts.filter(isQuality).sort(compareSpecs).map(function getType(spec) {
	      return spec.full;
	    });
	  }

	  var priorities = provided.map(function getPriority(type, index) {
	    return getMediaTypePriority(type, accepts, index);
	  });

	  // sorted list of accepted types
	  return priorities.filter(isQuality).sort(compareSpecs).map(function getType(priority) {
	    return provided[priorities.indexOf(priority)];
	  });
	}

	function compareSpecs(a, b) {
	  return (b.q - a.q) || (b.s - a.s) || (a.o - b.o) || (a.i - b.i) || 0;
	}

	function isQuality(spec) {
	  return spec.q > 0;
	}

	function quoteCount(string) {
	  var count = 0;
	  var index = 0;

	  while ((index = string.indexOf('"', index)) !== -1) {
	    count++;
	    index++;
	  }

	  return count;
	}

	function splitMediaTypes(accept) {
	  var accepts = accept.split(',');

	  for (var i = 1, j = 0; i < accepts.length; i++) {
	    if (quoteCount(accepts[j]) % 2 == 0) {
	      accepts[++j] = accepts[i];
	    } else {
	      accepts[j] += ',' + accepts[i];
	    }
	  }

	  // trim accepts
	  accepts.length = j + 1;

	  return accepts;
	}


/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * mime-types
	 * Copyright(c) 2014 Jonathan Ong
	 * Copyright(c) 2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 * @private
	 */

	var db = __webpack_require__(85)
	var extname = __webpack_require__(16).extname

	/**
	 * Module variables.
	 * @private
	 */

	var extractTypeRegExp = /^\s*([^;\s]*)(?:;|\s|$)/
	var textTypeRegExp = /^text\//i

	/**
	 * Module exports.
	 * @public
	 */

	exports.charset = charset
	exports.charsets = { lookup: charset }
	exports.contentType = contentType
	exports.extension = extension
	exports.extensions = Object.create(null)
	exports.lookup = lookup
	exports.types = Object.create(null)

	// Populate the extensions/types maps
	populateMaps(exports.extensions, exports.types)

	/**
	 * Get the default charset for a MIME type.
	 *
	 * @param {string} type
	 * @return {boolean|string}
	 */

	function charset(type) {
	  if (!type || typeof type !== 'string') {
	    return false
	  }

	  // TODO: use media-typer
	  var match = extractTypeRegExp.exec(type)
	  var mime = match && db[match[1].toLowerCase()]

	  if (mime && mime.charset) {
	    return mime.charset
	  }

	  // default text/* to utf-8
	  if (match && textTypeRegExp.test(match[1])) {
	    return 'UTF-8'
	  }

	  return false
	}

	/**
	 * Create a full Content-Type header given a MIME type or extension.
	 *
	 * @param {string} str
	 * @return {boolean|string}
	 */

	function contentType(str) {
	  // TODO: should this even be in this module?
	  if (!str || typeof str !== 'string') {
	    return false
	  }

	  var mime = str.indexOf('/') === -1
	    ? exports.lookup(str)
	    : str

	  if (!mime) {
	    return false
	  }

	  // TODO: use content-type or other module
	  if (mime.indexOf('charset') === -1) {
	    var charset = exports.charset(mime)
	    if (charset) mime += '; charset=' + charset.toLowerCase()
	  }

	  return mime
	}

	/**
	 * Get the default extension for a MIME type.
	 *
	 * @param {string} type
	 * @return {boolean|string}
	 */

	function extension(type) {
	  if (!type || typeof type !== 'string') {
	    return false
	  }

	  // TODO: use media-typer
	  var match = extractTypeRegExp.exec(type)

	  // get extensions
	  var exts = match && exports.extensions[match[1].toLowerCase()]

	  if (!exts || !exts.length) {
	    return false
	  }

	  return exts[0]
	}

	/**
	 * Lookup the MIME type for a file path/extension.
	 *
	 * @param {string} path
	 * @return {boolean|string}
	 */

	function lookup(path) {
	  if (!path || typeof path !== 'string') {
	    return false
	  }

	  // get the extension ("ext" or ".ext" or full path)
	  var extension = extname('x.' + path)
	    .toLowerCase()
	    .substr(1)

	  if (!extension) {
	    return false
	  }

	  return exports.types[extension] || false
	}

	/**
	 * Populate the extensions and types maps.
	 * @private
	 */

	function populateMaps(extensions, types) {
	  // source preference (least -> most)
	  var preference = ['nginx', 'apache', undefined, 'iana']

	  Object.keys(db).forEach(function forEachMimeType(type) {
	    var mime = db[type]
	    var exts = mime.extensions

	    if (!exts || !exts.length) {
	      return
	    }

	    // mime -> extensions
	    extensions[type] = exts

	    // extension -> mime
	    for (var i = 0; i < exts.length; i++) {
	      var extension = exts[i]

	      if (types[extension]) {
	        var from = preference.indexOf(db[types[extension]].source)
	        var to = preference.indexOf(mime.source)

	        if (types[extension] !== 'application/octet-stream'
	          && from > to || (from === to && types[extension].substr(0, 12) === 'application/')) {
	          // skip the remapping
	          continue
	        }
	      }

	      // set the extension -> mime
	      types[extension] = type
	    }
	  })
	}


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * mime-db
	 * Copyright(c) 2014 Jonathan Ong
	 * MIT Licensed
	 */

	/**
	 * Module exports.
	 */

	module.exports = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"./db.json\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))


/***/ },
/* 86 */,
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * type-is
	 * Copyright(c) 2014 Jonathan Ong
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 * @private
	 */

	var typer = __webpack_require__(88)
	var mime = __webpack_require__(84)

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = typeofrequest
	module.exports.is = typeis
	module.exports.hasBody = hasbody
	module.exports.normalize = normalize
	module.exports.match = mimeMatch

	/**
	 * Compare a `value` content-type with `types`.
	 * Each `type` can be an extension like `html`,
	 * a special shortcut like `multipart` or `urlencoded`,
	 * or a mime type.
	 *
	 * If no types match, `false` is returned.
	 * Otherwise, the first `type` that matches is returned.
	 *
	 * @param {String} value
	 * @param {Array} types
	 * @public
	 */

	function typeis(value, types_) {
	  var i
	  var types = types_

	  // remove parameters and normalize
	  var val = tryNormalizeType(value)

	  // no type or invalid
	  if (!val) {
	    return false
	  }

	  // support flattened arguments
	  if (types && !Array.isArray(types)) {
	    types = new Array(arguments.length - 1)
	    for (i = 0; i < types.length; i++) {
	      types[i] = arguments[i + 1]
	    }
	  }

	  // no types, return the content type
	  if (!types || !types.length) {
	    return val
	  }

	  var type
	  for (i = 0; i < types.length; i++) {
	    if (mimeMatch(normalize(type = types[i]), val)) {
	      return type[0] === '+' || type.indexOf('*') !== -1
	        ? val
	        : type
	    }
	  }

	  // no matches
	  return false
	}

	/**
	 * Check if a request has a request body.
	 * A request with a body __must__ either have `transfer-encoding`
	 * or `content-length` headers set.
	 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.3
	 *
	 * @param {Object} request
	 * @return {Boolean}
	 * @public
	 */

	function hasbody(req) {
	  return req.headers['transfer-encoding'] !== undefined
	    || !isNaN(req.headers['content-length'])
	}

	/**
	 * Check if the incoming request contains the "Content-Type"
	 * header field, and it contains any of the give mime `type`s.
	 * If there is no request body, `null` is returned.
	 * If there is no content type, `false` is returned.
	 * Otherwise, it returns the first `type` that matches.
	 *
	 * Examples:
	 *
	 *     // With Content-Type: text/html; charset=utf-8
	 *     this.is('html'); // => 'html'
	 *     this.is('text/html'); // => 'text/html'
	 *     this.is('text/*', 'application/json'); // => 'text/html'
	 *
	 *     // When Content-Type is application/json
	 *     this.is('json', 'urlencoded'); // => 'json'
	 *     this.is('application/json'); // => 'application/json'
	 *     this.is('html', 'application/*'); // => 'application/json'
	 *
	 *     this.is('html'); // => false
	 *
	 * @param {String|Array} types...
	 * @return {String|false|null}
	 * @public
	 */

	function typeofrequest(req, types_) {
	  var types = types_

	  // no body
	  if (!hasbody(req)) {
	    return null
	  }

	  // support flattened arguments
	  if (arguments.length > 2) {
	    types = new Array(arguments.length - 1)
	    for (var i = 0; i < types.length; i++) {
	      types[i] = arguments[i + 1]
	    }
	  }

	  // request content type
	  var value = req.headers['content-type']

	  return typeis(value, types)
	}

	/**
	 * Normalize a mime type.
	 * If it's a shorthand, expand it to a valid mime type.
	 *
	 * In general, you probably want:
	 *
	 *   var type = is(req, ['urlencoded', 'json', 'multipart']);
	 *
	 * Then use the appropriate body parsers.
	 * These three are the most common request body types
	 * and are thus ensured to work.
	 *
	 * @param {String} type
	 * @private
	 */

	function normalize(type) {
	  if (typeof type !== 'string') {
	    // invalid type
	    return false
	  }

	  switch (type) {
	    case 'urlencoded':
	      return 'application/x-www-form-urlencoded'
	    case 'multipart':
	      return 'multipart/*'
	  }

	  if (type[0] === '+') {
	    // "+json" -> "*/*+json" expando
	    return '*/*' + type
	  }

	  return type.indexOf('/') === -1
	    ? mime.lookup(type)
	    : type
	}

	/**
	 * Check if `expected` mime type
	 * matches `actual` mime type with
	 * wildcard and +suffix support.
	 *
	 * @param {String} expected
	 * @param {String} actual
	 * @return {Boolean}
	 * @private
	 */

	function mimeMatch(expected, actual) {
	  // invalid type
	  if (expected === false) {
	    return false
	  }

	  // split types
	  var actualParts = actual.split('/')
	  var expectedParts = expected.split('/')

	  // invalid format
	  if (actualParts.length !== 2 || expectedParts.length !== 2) {
	    return false
	  }

	  // validate type
	  if (expectedParts[0] !== '*' && expectedParts[0] !== actualParts[0]) {
	    return false
	  }

	  // validate suffix wildcard
	  if (expectedParts[1].substr(0, 2) === '*+') {
	    return expectedParts[1].length <= actualParts[1].length + 1
	      && expectedParts[1].substr(1) === actualParts[1].substr(1 - expectedParts[1].length)
	  }

	  // validate subtype
	  if (expectedParts[1] !== '*' && expectedParts[1] !== actualParts[1]) {
	    return false
	  }

	  return true
	}

	/**
	 * Normalize a type and remove parameters.
	 *
	 * @param {string} value
	 * @return {string}
	 * @private
	 */

	function normalizeType(value) {
	  // parse the type
	  var type = typer.parse(value)

	  // remove the parameters
	  type.parameters = undefined

	  // reformat it
	  return typer.format(type)
	}

	/**
	 * Try to normalize a type and remove parameters.
	 *
	 * @param {string} value
	 * @return {string}
	 * @private
	 */

	function tryNormalizeType(value) {
	  try {
	    return normalizeType(value)
	  } catch (err) {
	    return null
	  }
	}


/***/ },
/* 88 */
/***/ function(module, exports) {

	/*!
	 * media-typer
	 * Copyright(c) 2014 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	/**
	 * RegExp to match *( ";" parameter ) in RFC 2616 sec 3.7
	 *
	 * parameter     = token "=" ( token | quoted-string )
	 * token         = 1*<any CHAR except CTLs or separators>
	 * separators    = "(" | ")" | "<" | ">" | "@"
	 *               | "," | ";" | ":" | "\" | <">
	 *               | "/" | "[" | "]" | "?" | "="
	 *               | "{" | "}" | SP | HT
	 * quoted-string = ( <"> *(qdtext | quoted-pair ) <"> )
	 * qdtext        = <any TEXT except <">>
	 * quoted-pair   = "\" CHAR
	 * CHAR          = <any US-ASCII character (octets 0 - 127)>
	 * TEXT          = <any OCTET except CTLs, but including LWS>
	 * LWS           = [CRLF] 1*( SP | HT )
	 * CRLF          = CR LF
	 * CR            = <US-ASCII CR, carriage return (13)>
	 * LF            = <US-ASCII LF, linefeed (10)>
	 * SP            = <US-ASCII SP, space (32)>
	 * SHT           = <US-ASCII HT, horizontal-tab (9)>
	 * CTL           = <any US-ASCII control character (octets 0 - 31) and DEL (127)>
	 * OCTET         = <any 8-bit sequence of data>
	 */
	var paramRegExp = /; *([!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) *= *("(?:[ !\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u0020-\u007e])*"|[!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) */g;
	var textRegExp = /^[\u0020-\u007e\u0080-\u00ff]+$/
	var tokenRegExp = /^[!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+$/

	/**
	 * RegExp to match quoted-pair in RFC 2616
	 *
	 * quoted-pair = "\" CHAR
	 * CHAR        = <any US-ASCII character (octets 0 - 127)>
	 */
	var qescRegExp = /\\([\u0000-\u007f])/g;

	/**
	 * RegExp to match chars that must be quoted-pair in RFC 2616
	 */
	var quoteRegExp = /([\\"])/g;

	/**
	 * RegExp to match type in RFC 6838
	 *
	 * type-name = restricted-name
	 * subtype-name = restricted-name
	 * restricted-name = restricted-name-first *126restricted-name-chars
	 * restricted-name-first  = ALPHA / DIGIT
	 * restricted-name-chars  = ALPHA / DIGIT / "!" / "#" /
	 *                          "$" / "&" / "-" / "^" / "_"
	 * restricted-name-chars =/ "." ; Characters before first dot always
	 *                              ; specify a facet name
	 * restricted-name-chars =/ "+" ; Characters after last plus always
	 *                              ; specify a structured syntax suffix
	 * ALPHA =  %x41-5A / %x61-7A   ; A-Z / a-z
	 * DIGIT =  %x30-39             ; 0-9
	 */
	var subtypeNameRegExp = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/
	var typeNameRegExp = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/
	var typeRegExp = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;

	/**
	 * Module exports.
	 */

	exports.format = format
	exports.parse = parse

	/**
	 * Format object to media type.
	 *
	 * @param {object} obj
	 * @return {string}
	 * @api public
	 */

	function format(obj) {
	  if (!obj || typeof obj !== 'object') {
	    throw new TypeError('argument obj is required')
	  }

	  var parameters = obj.parameters
	  var subtype = obj.subtype
	  var suffix = obj.suffix
	  var type = obj.type

	  if (!type || !typeNameRegExp.test(type)) {
	    throw new TypeError('invalid type')
	  }

	  if (!subtype || !subtypeNameRegExp.test(subtype)) {
	    throw new TypeError('invalid subtype')
	  }

	  // format as type/subtype
	  var string = type + '/' + subtype

	  // append +suffix
	  if (suffix) {
	    if (!typeNameRegExp.test(suffix)) {
	      throw new TypeError('invalid suffix')
	    }

	    string += '+' + suffix
	  }

	  // append parameters
	  if (parameters && typeof parameters === 'object') {
	    var param
	    var params = Object.keys(parameters).sort()

	    for (var i = 0; i < params.length; i++) {
	      param = params[i]

	      if (!tokenRegExp.test(param)) {
	        throw new TypeError('invalid parameter name')
	      }

	      string += '; ' + param + '=' + qstring(parameters[param])
	    }
	  }

	  return string
	}

	/**
	 * Parse media type to object.
	 *
	 * @param {string|object} string
	 * @return {Object}
	 * @api public
	 */

	function parse(string) {
	  if (!string) {
	    throw new TypeError('argument string is required')
	  }

	  // support req/res-like objects as argument
	  if (typeof string === 'object') {
	    string = getcontenttype(string)
	  }

	  if (typeof string !== 'string') {
	    throw new TypeError('argument string is required to be a string')
	  }

	  var index = string.indexOf(';')
	  var type = index !== -1
	    ? string.substr(0, index)
	    : string

	  var key
	  var match
	  var obj = splitType(type)
	  var params = {}
	  var value

	  paramRegExp.lastIndex = index

	  while (match = paramRegExp.exec(string)) {
	    if (match.index !== index) {
	      throw new TypeError('invalid parameter format')
	    }

	    index += match[0].length
	    key = match[1].toLowerCase()
	    value = match[2]

	    if (value[0] === '"') {
	      // remove quotes and escapes
	      value = value
	        .substr(1, value.length - 2)
	        .replace(qescRegExp, '$1')
	    }

	    params[key] = value
	  }

	  if (index !== -1 && index !== string.length) {
	    throw new TypeError('invalid parameter format')
	  }

	  obj.parameters = params

	  return obj
	}

	/**
	 * Get content-type from req/res objects.
	 *
	 * @param {object}
	 * @return {Object}
	 * @api private
	 */

	function getcontenttype(obj) {
	  if (typeof obj.getHeader === 'function') {
	    // res-like
	    return obj.getHeader('content-type')
	  }

	  if (typeof obj.headers === 'object') {
	    // req-like
	    return obj.headers && obj.headers['content-type']
	  }
	}

	/**
	 * Quote a string if necessary.
	 *
	 * @param {string} val
	 * @return {string}
	 * @api private
	 */

	function qstring(val) {
	  var str = String(val)

	  // no need to quote tokens
	  if (tokenRegExp.test(str)) {
	    return str
	  }

	  if (str.length > 0 && !textRegExp.test(str)) {
	    throw new TypeError('invalid parameter value')
	  }

	  return '"' + str.replace(quoteRegExp, '\\$1') + '"'
	}

	/**
	 * Simply "type/subtype+siffx" into parts.
	 *
	 * @param {string} string
	 * @return {Object}
	 * @api private
	 */

	function splitType(string) {
	  var match = typeRegExp.exec(string.toLowerCase())

	  if (!match) {
	    throw new TypeError('invalid media type')
	  }

	  var type = match[1]
	  var subtype = match[2]
	  var suffix

	  // suffix after last +
	  var index = subtype.lastIndexOf('+')
	  if (index !== -1) {
	    suffix = subtype.substr(index + 1)
	    subtype = subtype.substr(0, index)
	  }

	  var obj = {
	    type: type,
	    subtype: subtype,
	    suffix: suffix
	  }

	  return obj
	}


/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * express
	 * Copyright(c) 2009-2013 TJ Holowaychuk
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module dependencies.
	 * @private
	 */

	var contentDisposition = __webpack_require__(57);
	var deprecate = __webpack_require__(41)('express');
	var escapeHtml = __webpack_require__(29);
	var http = __webpack_require__(30);
	var isAbsolute = __webpack_require__(56).isAbsolute;
	var onFinished = __webpack_require__(31);
	var path = __webpack_require__(16);
	var merge = __webpack_require__(40);
	var sign = __webpack_require__(90).sign;
	var normalizeType = __webpack_require__(56).normalizeType;
	var normalizeTypes = __webpack_require__(56).normalizeTypes;
	var setCharset = __webpack_require__(56).setCharset;
	var statusCodes = http.STATUS_CODES;
	var cookie = __webpack_require__(91);
	var send = __webpack_require__(59);
	var extname = path.extname;
	var mime = send.mime;
	var resolve = path.resolve;
	var vary = __webpack_require__(92);

	/**
	 * Response prototype.
	 */

	var res = module.exports = {
	  __proto__: http.ServerResponse.prototype
	};

	/**
	 * Module variables.
	 * @private
	 */

	var charsetRegExp = /;\s*charset\s*=/;

	/**
	 * Set status `code`.
	 *
	 * @param {Number} code
	 * @return {ServerResponse}
	 * @public
	 */

	res.status = function status(code) {
	  this.statusCode = code;
	  return this;
	};

	/**
	 * Set Link header field with the given `links`.
	 *
	 * Examples:
	 *
	 *    res.links({
	 *      next: 'http://api.example.com/users?page=2',
	 *      last: 'http://api.example.com/users?page=5'
	 *    });
	 *
	 * @param {Object} links
	 * @return {ServerResponse}
	 * @public
	 */

	res.links = function(links){
	  var link = this.get('Link') || '';
	  if (link) link += ', ';
	  return this.set('Link', link + Object.keys(links).map(function(rel){
	    return '<' + links[rel] + '>; rel="' + rel + '"';
	  }).join(', '));
	};

	/**
	 * Send a response.
	 *
	 * Examples:
	 *
	 *     res.send(new Buffer('wahoo'));
	 *     res.send({ some: 'json' });
	 *     res.send('<p>some html</p>');
	 *
	 * @param {string|number|boolean|object|Buffer} body
	 * @public
	 */

	res.send = function send(body) {
	  var chunk = body;
	  var encoding;
	  var len;
	  var req = this.req;
	  var type;

	  // settings
	  var app = this.app;

	  // allow status / body
	  if (arguments.length === 2) {
	    // res.send(body, status) backwards compat
	    if (typeof arguments[0] !== 'number' && typeof arguments[1] === 'number') {
	      deprecate('res.send(body, status): Use res.status(status).send(body) instead');
	      this.statusCode = arguments[1];
	    } else {
	      deprecate('res.send(status, body): Use res.status(status).send(body) instead');
	      this.statusCode = arguments[0];
	      chunk = arguments[1];
	    }
	  }

	  // disambiguate res.send(status) and res.send(status, num)
	  if (typeof chunk === 'number' && arguments.length === 1) {
	    // res.send(status) will set status message as text string
	    if (!this.get('Content-Type')) {
	      this.type('txt');
	    }

	    deprecate('res.send(status): Use res.sendStatus(status) instead');
	    this.statusCode = chunk;
	    chunk = statusCodes[chunk];
	  }

	  switch (typeof chunk) {
	    // string defaulting to html
	    case 'string':
	      if (!this.get('Content-Type')) {
	        this.type('html');
	      }
	      break;
	    case 'boolean':
	    case 'number':
	    case 'object':
	      if (chunk === null) {
	        chunk = '';
	      } else if (Buffer.isBuffer(chunk)) {
	        if (!this.get('Content-Type')) {
	          this.type('bin');
	        }
	      } else {
	        return this.json(chunk);
	      }
	      break;
	  }

	  // write strings in utf-8
	  if (typeof chunk === 'string') {
	    encoding = 'utf8';
	    type = this.get('Content-Type');

	    // reflect this in content-type
	    if (typeof type === 'string') {
	      this.set('Content-Type', setCharset(type, 'utf-8'));
	    }
	  }

	  // populate Content-Length
	  if (chunk !== undefined) {
	    if (!Buffer.isBuffer(chunk)) {
	      // convert chunk to Buffer; saves later double conversions
	      chunk = new Buffer(chunk, encoding);
	      encoding = undefined;
	    }

	    len = chunk.length;
	    this.set('Content-Length', len);
	  }

	  // populate ETag
	  var etag;
	  var generateETag = len !== undefined && app.get('etag fn');
	  if (typeof generateETag === 'function' && !this.get('ETag')) {
	    if ((etag = generateETag(chunk, encoding))) {
	      this.set('ETag', etag);
	    }
	  }

	  // freshness
	  if (req.fresh) this.statusCode = 304;

	  // strip irrelevant headers
	  if (204 == this.statusCode || 304 == this.statusCode) {
	    this.removeHeader('Content-Type');
	    this.removeHeader('Content-Length');
	    this.removeHeader('Transfer-Encoding');
	    chunk = '';
	  }

	  if (req.method === 'HEAD') {
	    // skip body for HEAD
	    this.end();
	  } else {
	    // respond
	    this.end(chunk, encoding);
	  }

	  return this;
	};

	/**
	 * Send JSON response.
	 *
	 * Examples:
	 *
	 *     res.json(null);
	 *     res.json({ user: 'tj' });
	 *
	 * @param {string|number|boolean|object} obj
	 * @public
	 */

	res.json = function json(obj) {
	  var val = obj;

	  // allow status / body
	  if (arguments.length === 2) {
	    // res.json(body, status) backwards compat
	    if (typeof arguments[1] === 'number') {
	      deprecate('res.json(obj, status): Use res.status(status).json(obj) instead');
	      this.statusCode = arguments[1];
	    } else {
	      deprecate('res.json(status, obj): Use res.status(status).json(obj) instead');
	      this.statusCode = arguments[0];
	      val = arguments[1];
	    }
	  }

	  // settings
	  var app = this.app;
	  var replacer = app.get('json replacer');
	  var spaces = app.get('json spaces');
	  var body = JSON.stringify(val, replacer, spaces);

	  // content-type
	  if (!this.get('Content-Type')) {
	    this.set('Content-Type', 'application/json');
	  }

	  return this.send(body);
	};

	/**
	 * Send JSON response with JSONP callback support.
	 *
	 * Examples:
	 *
	 *     res.jsonp(null);
	 *     res.jsonp({ user: 'tj' });
	 *
	 * @param {string|number|boolean|object} obj
	 * @public
	 */

	res.jsonp = function jsonp(obj) {
	  var val = obj;

	  // allow status / body
	  if (arguments.length === 2) {
	    // res.json(body, status) backwards compat
	    if (typeof arguments[1] === 'number') {
	      deprecate('res.jsonp(obj, status): Use res.status(status).json(obj) instead');
	      this.statusCode = arguments[1];
	    } else {
	      deprecate('res.jsonp(status, obj): Use res.status(status).jsonp(obj) instead');
	      this.statusCode = arguments[0];
	      val = arguments[1];
	    }
	  }

	  // settings
	  var app = this.app;
	  var replacer = app.get('json replacer');
	  var spaces = app.get('json spaces');
	  var body = JSON.stringify(val, replacer, spaces);
	  var callback = this.req.query[app.get('jsonp callback name')];

	  // content-type
	  if (!this.get('Content-Type')) {
	    this.set('X-Content-Type-Options', 'nosniff');
	    this.set('Content-Type', 'application/json');
	  }

	  // fixup callback
	  if (Array.isArray(callback)) {
	    callback = callback[0];
	  }

	  // jsonp
	  if (typeof callback === 'string' && callback.length !== 0) {
	    this.charset = 'utf-8';
	    this.set('X-Content-Type-Options', 'nosniff');
	    this.set('Content-Type', 'text/javascript');

	    // restrict callback charset
	    callback = callback.replace(/[^\[\]\w$.]/g, '');

	    // replace chars not allowed in JavaScript that are in JSON
	    body = body
	      .replace(/\u2028/g, '\\u2028')
	      .replace(/\u2029/g, '\\u2029');

	    // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
	    // the typeof check is just to reduce client error noise
	    body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');';
	  }

	  return this.send(body);
	};

	/**
	 * Send given HTTP status code.
	 *
	 * Sets the response status to `statusCode` and the body of the
	 * response to the standard description from node's http.STATUS_CODES
	 * or the statusCode number if no description.
	 *
	 * Examples:
	 *
	 *     res.sendStatus(200);
	 *
	 * @param {number} statusCode
	 * @public
	 */

	res.sendStatus = function sendStatus(statusCode) {
	  var body = statusCodes[statusCode] || String(statusCode);

	  this.statusCode = statusCode;
	  this.type('txt');

	  return this.send(body);
	};

	/**
	 * Transfer the file at the given `path`.
	 *
	 * Automatically sets the _Content-Type_ response header field.
	 * The callback `callback(err)` is invoked when the transfer is complete
	 * or when an error occurs. Be sure to check `res.sentHeader`
	 * if you wish to attempt responding, as the header and some data
	 * may have already been transferred.
	 *
	 * Options:
	 *
	 *   - `maxAge`   defaulting to 0 (can be string converted by `ms`)
	 *   - `root`     root directory for relative filenames
	 *   - `headers`  object of headers to serve with file
	 *   - `dotfiles` serve dotfiles, defaulting to false; can be `"allow"` to send them
	 *
	 * Other options are passed along to `send`.
	 *
	 * Examples:
	 *
	 *  The following example illustrates how `res.sendFile()` may
	 *  be used as an alternative for the `static()` middleware for
	 *  dynamic situations. The code backing `res.sendFile()` is actually
	 *  the same code, so HTTP cache support etc is identical.
	 *
	 *     app.get('/user/:uid/photos/:file', function(req, res){
	 *       var uid = req.params.uid
	 *         , file = req.params.file;
	 *
	 *       req.user.mayViewFilesFrom(uid, function(yes){
	 *         if (yes) {
	 *           res.sendFile('/uploads/' + uid + '/' + file);
	 *         } else {
	 *           res.send(403, 'Sorry! you cant see that.');
	 *         }
	 *       });
	 *     });
	 *
	 * @public
	 */

	res.sendFile = function sendFile(path, options, callback) {
	  var done = callback;
	  var req = this.req;
	  var res = this;
	  var next = req.next;
	  var opts = options || {};

	  if (!path) {
	    throw new TypeError('path argument is required to res.sendFile');
	  }

	  // support function as second arg
	  if (typeof options === 'function') {
	    done = options;
	    opts = {};
	  }

	  if (!opts.root && !isAbsolute(path)) {
	    throw new TypeError('path must be absolute or specify root to res.sendFile');
	  }

	  // create file stream
	  var pathname = encodeURI(path);
	  var file = send(req, pathname, opts);

	  // transfer
	  sendfile(res, file, opts, function (err) {
	    if (done) return done(err);
	    if (err && err.code === 'EISDIR') return next();

	    // next() all but write errors
	    if (err && err.code !== 'ECONNABORTED' && err.syscall !== 'write') {
	      next(err);
	    }
	  });
	};

	/**
	 * Transfer the file at the given `path`.
	 *
	 * Automatically sets the _Content-Type_ response header field.
	 * The callback `callback(err)` is invoked when the transfer is complete
	 * or when an error occurs. Be sure to check `res.sentHeader`
	 * if you wish to attempt responding, as the header and some data
	 * may have already been transferred.
	 *
	 * Options:
	 *
	 *   - `maxAge`   defaulting to 0 (can be string converted by `ms`)
	 *   - `root`     root directory for relative filenames
	 *   - `headers`  object of headers to serve with file
	 *   - `dotfiles` serve dotfiles, defaulting to false; can be `"allow"` to send them
	 *
	 * Other options are passed along to `send`.
	 *
	 * Examples:
	 *
	 *  The following example illustrates how `res.sendfile()` may
	 *  be used as an alternative for the `static()` middleware for
	 *  dynamic situations. The code backing `res.sendfile()` is actually
	 *  the same code, so HTTP cache support etc is identical.
	 *
	 *     app.get('/user/:uid/photos/:file', function(req, res){
	 *       var uid = req.params.uid
	 *         , file = req.params.file;
	 *
	 *       req.user.mayViewFilesFrom(uid, function(yes){
	 *         if (yes) {
	 *           res.sendfile('/uploads/' + uid + '/' + file);
	 *         } else {
	 *           res.send(403, 'Sorry! you cant see that.');
	 *         }
	 *       });
	 *     });
	 *
	 * @public
	 */

	res.sendfile = function (path, options, callback) {
	  var done = callback;
	  var req = this.req;
	  var res = this;
	  var next = req.next;
	  var opts = options || {};

	  // support function as second arg
	  if (typeof options === 'function') {
	    done = options;
	    opts = {};
	  }

	  // create file stream
	  var file = send(req, path, opts);

	  // transfer
	  sendfile(res, file, opts, function (err) {
	    if (done) return done(err);
	    if (err && err.code === 'EISDIR') return next();

	    // next() all but write errors
	    if (err && err.code !== 'ECONNABORT' && err.syscall !== 'write') {
	      next(err);
	    }
	  });
	};

	res.sendfile = deprecate.function(res.sendfile,
	  'res.sendfile: Use res.sendFile instead');

	/**
	 * Transfer the file at the given `path` as an attachment.
	 *
	 * Optionally providing an alternate attachment `filename`,
	 * and optional callback `callback(err)`. The callback is invoked
	 * when the data transfer is complete, or when an error has
	 * ocurred. Be sure to check `res.headersSent` if you plan to respond.
	 *
	 * This method uses `res.sendfile()`.
	 *
	 * @public
	 */

	res.download = function download(path, filename, callback) {
	  var done = callback;
	  var name = filename;

	  // support function as second arg
	  if (typeof filename === 'function') {
	    done = filename;
	    name = null;
	  }

	  // set Content-Disposition when file is sent
	  var headers = {
	    'Content-Disposition': contentDisposition(name || path)
	  };

	  // Resolve the full path for sendFile
	  var fullPath = resolve(path);

	  return this.sendFile(fullPath, { headers: headers }, done);
	};

	/**
	 * Set _Content-Type_ response header with `type` through `mime.lookup()`
	 * when it does not contain "/", or set the Content-Type to `type` otherwise.
	 *
	 * Examples:
	 *
	 *     res.type('.html');
	 *     res.type('html');
	 *     res.type('json');
	 *     res.type('application/json');
	 *     res.type('png');
	 *
	 * @param {String} type
	 * @return {ServerResponse} for chaining
	 * @public
	 */

	res.contentType =
	res.type = function contentType(type) {
	  var ct = type.indexOf('/') === -1
	    ? mime.lookup(type)
	    : type;

	  return this.set('Content-Type', ct);
	};

	/**
	 * Respond to the Acceptable formats using an `obj`
	 * of mime-type callbacks.
	 *
	 * This method uses `req.accepted`, an array of
	 * acceptable types ordered by their quality values.
	 * When "Accept" is not present the _first_ callback
	 * is invoked, otherwise the first match is used. When
	 * no match is performed the server responds with
	 * 406 "Not Acceptable".
	 *
	 * Content-Type is set for you, however if you choose
	 * you may alter this within the callback using `res.type()`
	 * or `res.set('Content-Type', ...)`.
	 *
	 *    res.format({
	 *      'text/plain': function(){
	 *        res.send('hey');
	 *      },
	 *
	 *      'text/html': function(){
	 *        res.send('<p>hey</p>');
	 *      },
	 *
	 *      'appliation/json': function(){
	 *        res.send({ message: 'hey' });
	 *      }
	 *    });
	 *
	 * In addition to canonicalized MIME types you may
	 * also use extnames mapped to these types:
	 *
	 *    res.format({
	 *      text: function(){
	 *        res.send('hey');
	 *      },
	 *
	 *      html: function(){
	 *        res.send('<p>hey</p>');
	 *      },
	 *
	 *      json: function(){
	 *        res.send({ message: 'hey' });
	 *      }
	 *    });
	 *
	 * By default Express passes an `Error`
	 * with a `.status` of 406 to `next(err)`
	 * if a match is not made. If you provide
	 * a `.default` callback it will be invoked
	 * instead.
	 *
	 * @param {Object} obj
	 * @return {ServerResponse} for chaining
	 * @public
	 */

	res.format = function(obj){
	  var req = this.req;
	  var next = req.next;

	  var fn = obj.default;
	  if (fn) delete obj.default;
	  var keys = Object.keys(obj);

	  var key = keys.length > 0
	    ? req.accepts(keys)
	    : false;

	  this.vary("Accept");

	  if (key) {
	    this.set('Content-Type', normalizeType(key).value);
	    obj[key](req, this, next);
	  } else if (fn) {
	    fn();
	  } else {
	    var err = new Error('Not Acceptable');
	    err.status = err.statusCode = 406;
	    err.types = normalizeTypes(keys).map(function(o){ return o.value });
	    next(err);
	  }

	  return this;
	};

	/**
	 * Set _Content-Disposition_ header to _attachment_ with optional `filename`.
	 *
	 * @param {String} filename
	 * @return {ServerResponse}
	 * @public
	 */

	res.attachment = function attachment(filename) {
	  if (filename) {
	    this.type(extname(filename));
	  }

	  this.set('Content-Disposition', contentDisposition(filename));

	  return this;
	};

	/**
	 * Append additional header `field` with value `val`.
	 *
	 * Example:
	 *
	 *    res.append('Link', ['<http://localhost/>', '<http://localhost:3000/>']);
	 *    res.append('Set-Cookie', 'foo=bar; Path=/; HttpOnly');
	 *    res.append('Warning', '199 Miscellaneous warning');
	 *
	 * @param {String} field
	 * @param {String|Array} val
	 * @return {ServerResponse} for chaining
	 * @public
	 */

	res.append = function append(field, val) {
	  var prev = this.get(field);
	  var value = val;

	  if (prev) {
	    // concat the new and prev vals
	    value = Array.isArray(prev) ? prev.concat(val)
	      : Array.isArray(val) ? [prev].concat(val)
	      : [prev, val];
	  }

	  return this.set(field, value);
	};

	/**
	 * Set header `field` to `val`, or pass
	 * an object of header fields.
	 *
	 * Examples:
	 *
	 *    res.set('Foo', ['bar', 'baz']);
	 *    res.set('Accept', 'application/json');
	 *    res.set({ Accept: 'text/plain', 'X-API-Key': 'tobi' });
	 *
	 * Aliased as `res.header()`.
	 *
	 * @param {String|Object} field
	 * @param {String|Array} val
	 * @return {ServerResponse} for chaining
	 * @public
	 */

	res.set =
	res.header = function header(field, val) {
	  if (arguments.length === 2) {
	    var value = Array.isArray(val)
	      ? val.map(String)
	      : String(val);

	    // add charset to content-type
	    if (field.toLowerCase() === 'content-type' && !charsetRegExp.test(value)) {
	      var charset = mime.charsets.lookup(value.split(';')[0]);
	      if (charset) value += '; charset=' + charset.toLowerCase();
	    }

	    this.setHeader(field, value);
	  } else {
	    for (var key in field) {
	      this.set(key, field[key]);
	    }
	  }
	  return this;
	};

	/**
	 * Get value for header `field`.
	 *
	 * @param {String} field
	 * @return {String}
	 * @public
	 */

	res.get = function(field){
	  return this.getHeader(field);
	};

	/**
	 * Clear cookie `name`.
	 *
	 * @param {String} name
	 * @param {Object} options
	 * @return {ServerResponse} for chaining
	 * @public
	 */

	res.clearCookie = function clearCookie(name, options) {
	  var opts = merge({ expires: new Date(1), path: '/' }, options);

	  return this.cookie(name, '', opts);
	};

	/**
	 * Set cookie `name` to `value`, with the given `options`.
	 *
	 * Options:
	 *
	 *    - `maxAge`   max-age in milliseconds, converted to `expires`
	 *    - `signed`   sign the cookie
	 *    - `path`     defaults to "/"
	 *
	 * Examples:
	 *
	 *    // "Remember Me" for 15 minutes
	 *    res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true });
	 *
	 *    // save as above
	 *    res.cookie('rememberme', '1', { maxAge: 900000, httpOnly: true })
	 *
	 * @param {String} name
	 * @param {String|Object} value
	 * @param {Options} options
	 * @return {ServerResponse} for chaining
	 * @public
	 */

	res.cookie = function (name, value, options) {
	  var opts = merge({}, options);
	  var secret = this.req.secret;
	  var signed = opts.signed;

	  if (signed && !secret) {
	    throw new Error('cookieParser("secret") required for signed cookies');
	  }

	  var val = typeof value === 'object'
	    ? 'j:' + JSON.stringify(value)
	    : String(value);

	  if (signed) {
	    val = 's:' + sign(val, secret);
	  }

	  if ('maxAge' in opts) {
	    opts.expires = new Date(Date.now() + opts.maxAge);
	    opts.maxAge /= 1000;
	  }

	  if (opts.path == null) {
	    opts.path = '/';
	  }

	  this.append('Set-Cookie', cookie.serialize(name, String(val), opts));

	  return this;
	};

	/**
	 * Set the location header to `url`.
	 *
	 * The given `url` can also be "back", which redirects
	 * to the _Referrer_ or _Referer_ headers or "/".
	 *
	 * Examples:
	 *
	 *    res.location('/foo/bar').;
	 *    res.location('http://example.com');
	 *    res.location('../login');
	 *
	 * @param {String} url
	 * @return {ServerResponse} for chaining
	 * @public
	 */

	res.location = function location(url) {
	  var loc = url;

	  // "back" is an alias for the referrer
	  if (url === 'back') {
	    loc = this.req.get('Referrer') || '/';
	  }

	  // set location
	  this.set('Location', loc);
	  return this;
	};

	/**
	 * Redirect to the given `url` with optional response `status`
	 * defaulting to 302.
	 *
	 * The resulting `url` is determined by `res.location()`, so
	 * it will play nicely with mounted apps, relative paths,
	 * `"back"` etc.
	 *
	 * Examples:
	 *
	 *    res.redirect('/foo/bar');
	 *    res.redirect('http://example.com');
	 *    res.redirect(301, 'http://example.com');
	 *    res.redirect('../login'); // /blog/post/1 -> /blog/login
	 *
	 * @public
	 */

	res.redirect = function redirect(url) {
	  var address = url;
	  var body;
	  var status = 302;

	  // allow status / url
	  if (arguments.length === 2) {
	    if (typeof arguments[0] === 'number') {
	      status = arguments[0];
	      address = arguments[1];
	    } else {
	      deprecate('res.redirect(url, status): Use res.redirect(status, url) instead');
	      status = arguments[1];
	    }
	  }

	  // Set location header
	  this.location(address);
	  address = this.get('Location');

	  // Support text/{plain,html} by default
	  this.format({
	    text: function(){
	      body = statusCodes[status] + '. Redirecting to ' + encodeURI(address);
	    },

	    html: function(){
	      var u = escapeHtml(address);
	      body = '<p>' + statusCodes[status] + '. Redirecting to <a href="' + u + '">' + u + '</a></p>';
	    },

	    default: function(){
	      body = '';
	    }
	  });

	  // Respond
	  this.statusCode = status;
	  this.set('Content-Length', Buffer.byteLength(body));

	  if (this.req.method === 'HEAD') {
	    this.end();
	  } else {
	    this.end(body);
	  }
	};

	/**
	 * Add `field` to Vary. If already present in the Vary set, then
	 * this call is simply ignored.
	 *
	 * @param {Array|String} field
	 * @return {ServerResponse} for chaining
	 * @public
	 */

	res.vary = function(field){
	  // checks for back-compat
	  if (!field || (Array.isArray(field) && !field.length)) {
	    deprecate('res.vary(): Provide a field name');
	    return this;
	  }

	  vary(this, field);

	  return this;
	};

	/**
	 * Render `view` with the given `options` and optional callback `fn`.
	 * When a callback function is given a response will _not_ be made
	 * automatically, otherwise a response of _200_ and _text/html_ is given.
	 *
	 * Options:
	 *
	 *  - `cache`     boolean hinting to the engine it should cache
	 *  - `filename`  filename of the view being rendered
	 *
	 * @public
	 */

	res.render = function render(view, options, callback) {
	  var app = this.req.app;
	  var done = callback;
	  var opts = options || {};
	  var req = this.req;
	  var self = this;

	  // support callback function as second arg
	  if (typeof options === 'function') {
	    done = options;
	    opts = {};
	  }

	  // merge res.locals
	  opts._locals = self.locals;

	  // default callback to respond
	  done = done || function (err, str) {
	    if (err) return req.next(err);
	    self.send(str);
	  };

	  // render
	  app.render(view, opts, done);
	};

	// pipe the send file stream
	function sendfile(res, file, options, callback) {
	  var done = false;
	  var streaming;

	  // request aborted
	  function onaborted() {
	    if (done) return;
	    done = true;

	    var err = new Error('Request aborted');
	    err.code = 'ECONNABORTED';
	    callback(err);
	  }

	  // directory
	  function ondirectory() {
	    if (done) return;
	    done = true;

	    var err = new Error('EISDIR, read');
	    err.code = 'EISDIR';
	    callback(err);
	  }

	  // errors
	  function onerror(err) {
	    if (done) return;
	    done = true;
	    callback(err);
	  }

	  // ended
	  function onend() {
	    if (done) return;
	    done = true;
	    callback();
	  }

	  // file
	  function onfile() {
	    streaming = false;
	  }

	  // finished
	  function onfinish(err) {
	    if (err && err.code === 'ECONNRESET') return onaborted();
	    if (err) return onerror(err);
	    if (done) return;

	    setImmediate(function () {
	      if (streaming !== false && !done) {
	        onaborted();
	        return;
	      }

	      if (done) return;
	      done = true;
	      callback();
	    });
	  }

	  // streaming
	  function onstream() {
	    streaming = true;
	  }

	  file.on('directory', ondirectory);
	  file.on('end', onend);
	  file.on('error', onerror);
	  file.on('file', onfile);
	  file.on('stream', onstream);
	  onFinished(res, onfinish);

	  if (options.headers) {
	    // set headers on successful transfer
	    file.on('headers', function headers(res) {
	      var obj = options.headers;
	      var keys = Object.keys(obj);

	      for (var i = 0; i < keys.length; i++) {
	        var k = keys[i];
	        res.setHeader(k, obj[k]);
	      }
	    });
	  }

	  // pipe
	  file.pipe(res);
	}


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var crypto = __webpack_require__(71);

	/**
	 * Sign the given `val` with `secret`.
	 *
	 * @param {String} val
	 * @param {String} secret
	 * @return {String}
	 * @api private
	 */

	exports.sign = function(val, secret){
	  if ('string' != typeof val) throw new TypeError("Cookie value must be provided as a string.");
	  if ('string' != typeof secret) throw new TypeError("Secret string must be provided.");
	  return val + '.' + crypto
	    .createHmac('sha256', secret)
	    .update(val)
	    .digest('base64')
	    .replace(/\=+$/, '');
	};

	/**
	 * Unsign and decode the given `val` with `secret`,
	 * returning `false` if the signature is invalid.
	 *
	 * @param {String} val
	 * @param {String} secret
	 * @return {String|Boolean}
	 * @api private
	 */

	exports.unsign = function(val, secret){
	  if ('string' != typeof val) throw new TypeError("Signed cookie string must be provided.");
	  if ('string' != typeof secret) throw new TypeError("Secret string must be provided.");
	  var str = val.slice(0, val.lastIndexOf('.'))
	    , mac = exports.sign(str, secret);
	  
	  return sha1(mac) == sha1(val) ? str : false;
	};

	/**
	 * Private
	 */

	function sha1(str){
	  return crypto.createHash('sha1').update(str).digest('hex');
	}


/***/ },
/* 91 */
/***/ function(module, exports) {

	/*!
	 * cookie
	 * Copyright(c) 2012-2014 Roman Shtylman
	 * Copyright(c) 2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	/**
	 * Module exports.
	 * @public
	 */

	exports.parse = parse;
	exports.serialize = serialize;

	/**
	 * Module variables.
	 * @private
	 */

	var decode = decodeURIComponent;
	var encode = encodeURIComponent;

	/**
	 * RegExp to match field-content in RFC 7230 sec 3.2
	 *
	 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
	 * field-vchar   = VCHAR / obs-text
	 * obs-text      = %x80-FF
	 */

	var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

	/**
	 * Parse a cookie header.
	 *
	 * Parse the given cookie header string into an object
	 * The object has the various cookies as keys(names) => values
	 *
	 * @param {string} str
	 * @param {object} [options]
	 * @return {object}
	 * @public
	 */

	function parse(str, options) {
	  if (typeof str !== 'string') {
	    throw new TypeError('argument str must be a string');
	  }

	  var obj = {}
	  var opt = options || {};
	  var pairs = str.split(/; */);
	  var dec = opt.decode || decode;

	  pairs.forEach(function(pair) {
	    var eq_idx = pair.indexOf('=')

	    // skip things that don't look like key=value
	    if (eq_idx < 0) {
	      return;
	    }

	    var key = pair.substr(0, eq_idx).trim()
	    var val = pair.substr(++eq_idx, pair.length).trim();

	    // quoted values
	    if ('"' == val[0]) {
	      val = val.slice(1, -1);
	    }

	    // only assign once
	    if (undefined == obj[key]) {
	      obj[key] = tryDecode(val, dec);
	    }
	  });

	  return obj;
	}

	/**
	 * Serialize data into a cookie header.
	 *
	 * Serialize the a name value pair into a cookie string suitable for
	 * http headers. An optional options object specified cookie parameters.
	 *
	 * serialize('foo', 'bar', { httpOnly: true })
	 *   => "foo=bar; httpOnly"
	 *
	 * @param {string} name
	 * @param {string} val
	 * @param {object} [options]
	 * @return {string}
	 * @public
	 */

	function serialize(name, val, options) {
	  var opt = options || {};
	  var enc = opt.encode || encode;

	  if (!fieldContentRegExp.test(name)) {
	    throw new TypeError('argument name is invalid');
	  }

	  var value = enc(val);

	  if (value && !fieldContentRegExp.test(value)) {
	    throw new TypeError('argument val is invalid');
	  }

	  var pairs = [name + '=' + value];

	  if (null != opt.maxAge) {
	    var maxAge = opt.maxAge - 0;
	    if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
	    pairs.push('Max-Age=' + maxAge);
	  }

	  if (opt.domain) {
	    if (!fieldContentRegExp.test(opt.domain)) {
	      throw new TypeError('option domain is invalid');
	    }

	    pairs.push('Domain=' + opt.domain);
	  }

	  if (opt.path) {
	    if (!fieldContentRegExp.test(opt.path)) {
	      throw new TypeError('option path is invalid');
	    }

	    pairs.push('Path=' + opt.path);
	  }

	  if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
	  if (opt.httpOnly) pairs.push('HttpOnly');
	  if (opt.secure) pairs.push('Secure');

	  return pairs.join('; ');
	}

	/**
	 * Try decoding a string using a decoding function.
	 *
	 * @param {string} str
	 * @param {function} decode
	 * @private
	 */

	function tryDecode(str, decode) {
	  try {
	    return decode(str);
	  } catch (e) {
	    return str;
	  }
	}


/***/ },
/* 92 */
/***/ function(module, exports) {

	/*!
	 * vary
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module exports.
	 */

	module.exports = vary;
	module.exports.append = append;

	/**
	 * Variables.
	 */

	var separators = /[\(\)<>@,;:\\"\/\[\]\?=\{\}\u0020\u0009]/;

	/**
	 * Append a field to a vary header.
	 *
	 * @param {String} header
	 * @param {String|Array} field
	 * @return {String}
	 * @api public
	 */

	function append(header, field) {
	  if (typeof header !== 'string') {
	    throw new TypeError('header argument is required');
	  }

	  if (!field) {
	    throw new TypeError('field argument is required');
	  }

	  // get fields array
	  var fields = !Array.isArray(field)
	    ? parse(String(field))
	    : field;

	  // assert on invalid fields
	  for (var i = 0; i < fields.length; i++) {
	    if (separators.test(fields[i])) {
	      throw new TypeError('field argument contains an invalid header');
	    }
	  }

	  // existing, unspecified vary
	  if (header === '*') {
	    return header;
	  }

	  // enumerate current values
	  var val = header;
	  var vals = parse(header.toLowerCase());

	  // unspecified vary
	  if (fields.indexOf('*') !== -1 || vals.indexOf('*') !== -1) {
	    return '*';
	  }

	  for (var i = 0; i < fields.length; i++) {
	    var fld = fields[i].toLowerCase();

	    // append value (case-preserving)
	    if (vals.indexOf(fld) === -1) {
	      vals.push(fld);
	      val = val
	        ? val + ', ' + fields[i]
	        : fields[i];
	    }
	  }

	  return val;
	}

	/**
	 * Parse a vary header into an array.
	 *
	 * @param {String} header
	 * @return {Array}
	 * @api private
	 */

	function parse(header) {
	  return header.trim().split(/ *, */);
	}

	/**
	 * Mark that a request is varied on a header field.
	 *
	 * @param {Object} res
	 * @param {String|Array} field
	 * @api public
	 */

	function vary(res, field) {
	  if (!res || !res.getHeader || !res.setHeader) {
	    // quack quack
	    throw new TypeError('res argument is required');
	  }

	  // get existing header
	  var val = res.getHeader('Vary') || ''
	  var header = Array.isArray(val)
	    ? val.join(', ')
	    : String(val);

	  // set new header
	  if ((val = append(header, field))) {
	    res.setHeader('Vary', val);
	  }
	}


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * serve-static
	 * Copyright(c) 2010 Sencha Inc.
	 * Copyright(c) 2011 TJ Holowaychuk
	 * Copyright(c) 2014-2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */

	'use strict'

	/**
	 * Module dependencies.
	 * @private
	 */

	var escapeHtml = __webpack_require__(29)
	var parseUrl = __webpack_require__(47)
	var resolve = __webpack_require__(16).resolve
	var send = __webpack_require__(59)
	var url = __webpack_require__(48)

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = serveStatic
	module.exports.mime = send.mime

	/**
	 * @param {string} root
	 * @param {object} [options]
	 * @return {function}
	 * @public
	 */

	function serveStatic(root, options) {
	  if (!root) {
	    throw new TypeError('root path required')
	  }

	  if (typeof root !== 'string') {
	    throw new TypeError('root path must be a string')
	  }

	  // copy options object
	  var opts = Object.create(options || null)

	  // fall-though
	  var fallthrough = opts.fallthrough !== false

	  // default redirect
	  var redirect = opts.redirect !== false

	  // headers listener
	  var setHeaders = opts.setHeaders

	  if (setHeaders && typeof setHeaders !== 'function') {
	    throw new TypeError('option setHeaders must be function')
	  }

	  // setup options for send
	  opts.maxage = opts.maxage || opts.maxAge || 0
	  opts.root = resolve(root)

	  // construct directory listener
	  var onDirectory = redirect
	    ? createRedirectDirectoryListener()
	    : createNotFoundDirectoryListener()

	  return function serveStatic(req, res, next) {
	    if (req.method !== 'GET' && req.method !== 'HEAD') {
	      if (fallthrough) {
	        return next()
	      }

	      // method not allowed
	      res.statusCode = 405
	      res.setHeader('Allow', 'GET, HEAD')
	      res.setHeader('Content-Length', '0')
	      res.end()
	      return
	    }

	    var forwardError = !fallthrough
	    var originalUrl = parseUrl.original(req)
	    var path = parseUrl(req).pathname

	    // make sure redirect occurs at mount
	    if (path === '/' && originalUrl.pathname.substr(-1) !== '/') {
	      path = ''
	    }

	    // create send stream
	    var stream = send(req, path, opts)

	    // add directory handler
	    stream.on('directory', onDirectory)

	    // add headers listener
	    if (setHeaders) {
	      stream.on('headers', setHeaders)
	    }

	    // add file listener for fallthrough
	    if (fallthrough) {
	      stream.on('file', function onFile() {
	        // once file is determined, always forward error
	        forwardError = true
	      })
	    }

	    // forward errors
	    stream.on('error', function error(err) {
	      if (forwardError || !(err.statusCode < 500)) {
	        next(err)
	        return
	      }

	      next()
	    })

	    // pipe
	    stream.pipe(res)
	  }
	}

	/**
	 * Collapse all leading slashes into a single slash
	 * @private
	 */
	function collapseLeadingSlashes(str) {
	  for (var i = 0; i < str.length; i++) {
	    if (str[i] !== '/') {
	      break
	    }
	  }

	  return i > 1
	    ? '/' + str.substr(i)
	    : str
	}

	/**
	 * Create a directory listener that just 404s.
	 * @private
	 */

	function createNotFoundDirectoryListener() {
	  return function notFound() {
	    this.error(404)
	  }
	}

	/**
	 * Create a directory listener that performs a redirect.
	 * @private
	 */

	function createRedirectDirectoryListener() {
	  return function redirect() {
	    if (this.hasTrailingSlash()) {
	      this.error(404)
	      return
	    }

	    // get original URL
	    var originalUrl = parseUrl.original(this.req)

	    // append trailing slash
	    originalUrl.path = null
	    originalUrl.pathname = collapseLeadingSlashes(originalUrl.pathname + '/')

	    // reformat the URL
	    var loc = url.format(originalUrl)
	    var msg = 'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + '</a>\n'
	    var res = this.res

	    // send redirect response
	    res.statusCode = 303
	    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
	    res.setHeader('Content-Length', Buffer.byteLength(msg))
	    res.setHeader('X-Content-Type-Options', 'nosniff')
	    res.setHeader('Location', loc)
	    res.end(msg)
	  }
	}


/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var http = __webpack_require__(30);
	var read = __webpack_require__(2).readFileSync;
	var engine = __webpack_require__(95);
	var client = __webpack_require__(140);
	var clientVersion = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"socket.io-client/package\""); e.code = 'MODULE_NOT_FOUND'; throw e; }())).version;
	var Client = __webpack_require__(175);
	var Namespace = __webpack_require__(176);
	var Adapter = __webpack_require__(178);
	var debug = __webpack_require__(23)('socket.io:server');
	var url = __webpack_require__(48);

	/**
	 * Module exports.
	 */

	module.exports = Server;

	/**
	 * Socket.IO client source.
	 */

	var clientSource = read(/*require.resolve*/(184), 'utf-8');

	/**
	 * Server constructor.
	 *
	 * @param {http.Server|Number|Object} srv http server, port or options
	 * @param {Object} opts
	 * @api public
	 */

	function Server(srv, opts){
	  if (!(this instanceof Server)) return new Server(srv, opts);
	  if ('object' == typeof srv && !srv.listen) {
	    opts = srv;
	    srv = null;
	  }
	  opts = opts || {};
	  this.nsps = {};
	  this.path(opts.path || '/socket.io');
	  this.serveClient(false !== opts.serveClient);
	  this.adapter(opts.adapter || Adapter);
	  this.origins(opts.origins || '*:*');
	  this.sockets = this.of('/');
	  if (srv) this.attach(srv, opts);
	}

	/**
	 * Server request verification function, that checks for allowed origins
	 *
	 * @param {http.IncomingMessage} req request
	 * @param {Function} fn callback to be called with the result: `fn(err, success)`
	 */

	Server.prototype.checkRequest = function(req, fn) {
	  var origin = req.headers.origin || req.headers.referer;

	  // file:// URLs produce a null Origin which can't be authorized via echo-back
	  if ('null' == origin || null == origin) origin = '*';

	  if (!!origin && typeof(this._origins) == 'function') return this._origins(origin, fn);
	  if (this._origins.indexOf('*:*') !== -1) return fn(null, true);
	  if (origin) {
	    try {
	      var parts = url.parse(origin);
	      var defaultPort = 'https:' == parts.protocol ? 443 : 80;
	      parts.port = parts.port != null
	        ? parts.port
	        : defaultPort;
	      var ok =
	        ~this._origins.indexOf(parts.hostname + ':' + parts.port) ||
	        ~this._origins.indexOf(parts.hostname + ':*') ||
	        ~this._origins.indexOf('*:' + parts.port);
	      return fn(null, !!ok);
	    } catch (ex) {
	    }
	  }
	  fn(null, false);
	};

	/**
	 * Sets/gets whether client code is being served.
	 *
	 * @param {Boolean} v whether to serve client code
	 * @return {Server|Boolean} self when setting or value when getting
	 * @api public
	 */

	Server.prototype.serveClient = function(v){
	  if (!arguments.length) return this._serveClient;
	  this._serveClient = v;
	  return this;
	};

	/**
	 * Old settings for backwards compatibility
	 */

	var oldSettings = {
	  "transports": "transports",
	  "heartbeat timeout": "pingTimeout",
	  "heartbeat interval": "pingInterval",
	  "destroy buffer size": "maxHttpBufferSize"
	};

	/**
	 * Backwards compatiblity.
	 *
	 * @api public
	 */

	Server.prototype.set = function(key, val){
	  if ('authorization' == key && val) {
	    this.use(function(socket, next) {
	      val(socket.request, function(err, authorized) {
	        if (err) return next(new Error(err));
	        if (!authorized) return next(new Error('Not authorized'));
	        next();
	      });
	    });
	  } else if ('origins' == key && val) {
	    this.origins(val);
	  } else if ('resource' == key) {
	    this.path(val);
	  } else if (oldSettings[key] && this.eio[oldSettings[key]]) {
	    this.eio[oldSettings[key]] = val;
	  } else {
	    console.error('Option %s is not valid. Please refer to the README.', key);
	  }

	  return this;
	};

	/**
	 * Sets the client serving path.
	 *
	 * @param {String} v pathname
	 * @return {Server|String} self when setting or value when getting
	 * @api public
	 */

	Server.prototype.path = function(v){
	  if (!arguments.length) return this._path;
	  this._path = v.replace(/\/$/, '');
	  return this;
	};

	/**
	 * Sets the adapter for rooms.
	 *
	 * @param {Adapter} v pathname
	 * @return {Server|Adapter} self when setting or value when getting
	 * @api public
	 */

	Server.prototype.adapter = function(v){
	  if (!arguments.length) return this._adapter;
	  this._adapter = v;
	  for (var i in this.nsps) {
	    if (this.nsps.hasOwnProperty(i)) {
	      this.nsps[i].initAdapter();
	    }
	  }
	  return this;
	};

	/**
	 * Sets the allowed origins for requests.
	 *
	 * @param {String} v origins
	 * @return {Server|Adapter} self when setting or value when getting
	 * @api public
	 */

	Server.prototype.origins = function(v){
	  if (!arguments.length) return this._origins;

	  this._origins = v;
	  return this;
	};

	/**
	 * Attaches socket.io to a server or port.
	 *
	 * @param {http.Server|Number} server or port
	 * @param {Object} options passed to engine.io
	 * @return {Server} self
	 * @api public
	 */

	Server.prototype.listen =
	Server.prototype.attach = function(srv, opts){
	  if ('function' == typeof srv) {
	    var msg = 'You are trying to attach socket.io to an express ' +
	    'request handler function. Please pass a http.Server instance.';
	    throw new Error(msg);
	  }

	  // handle a port as a string
	  if (Number(srv) == srv) {
	    srv = Number(srv);
	  }

	  if ('number' == typeof srv) {
	    debug('creating http server and binding to %d', srv);
	    var port = srv;
	    srv = http.Server(function(req, res){
	      res.writeHead(404);
	      res.end();
	    });
	    srv.listen(port);

	  }

	  // set engine.io path to `/socket.io`
	  opts = opts || {};
	  opts.path = opts.path || this.path();
	  // set origins verification
	  opts.allowRequest = opts.allowRequest || this.checkRequest.bind(this);

	  // initialize engine
	  debug('creating engine.io instance with opts %j', opts);
	  this.eio = engine.attach(srv, opts);

	  // attach static file serving
	  if (this._serveClient) this.attachServe(srv);

	  // Export http server
	  this.httpServer = srv;

	  // bind to engine events
	  this.bind(this.eio);

	  return this;
	};

	/**
	 * Attaches the static file serving.
	 *
	 * @param {Function|http.Server} srv http server
	 * @api private
	 */

	Server.prototype.attachServe = function(srv){
	  debug('attaching client serving req handler');
	  var url = this._path + '/socket.io.js';
	  var evs = srv.listeners('request').slice(0);
	  var self = this;
	  srv.removeAllListeners('request');
	  srv.on('request', function(req, res) {
	    if (0 === req.url.indexOf(url)) {
	      self.serve(req, res);
	    } else {
	      for (var i = 0; i < evs.length; i++) {
	        evs[i].call(srv, req, res);
	      }
	    }
	  });
	};

	/**
	 * Handles a request serving `/socket.io.js`
	 *
	 * @param {http.Request} req
	 * @param {http.Response} res
	 * @api private
	 */

	Server.prototype.serve = function(req, res){
	  var etag = req.headers['if-none-match'];
	  if (etag) {
	    if (clientVersion == etag) {
	      debug('serve client 304');
	      res.writeHead(304);
	      res.end();
	      return;
	    }
	  }

	  debug('serve client source');
	  res.setHeader('Content-Type', 'application/javascript');
	  res.setHeader('ETag', clientVersion);
	  res.writeHead(200);
	  res.end(clientSource);
	};

	/**
	 * Binds socket.io to an engine.io instance.
	 *
	 * @param {engine.Server} engine engine.io (or compatible) server
	 * @return {Server} self
	 * @api public
	 */

	Server.prototype.bind = function(engine){
	  this.engine = engine;
	  this.engine.on('connection', this.onconnection.bind(this));
	  return this;
	};

	/**
	 * Called with each incoming transport connection.
	 *
	 * @param {engine.Socket} conn
	 * @return {Server} self
	 * @api public
	 */

	Server.prototype.onconnection = function(conn){
	  debug('incoming connection with id %s', conn.id);
	  var client = new Client(this, conn);
	  client.connect('/');
	  return this;
	};

	/**
	 * Looks up a namespace.
	 *
	 * @param {String} name nsp name
	 * @param {Function} fn optional, nsp `connection` ev handler
	 * @api public
	 */

	Server.prototype.of = function(name, fn){
	  if (String(name)[0] !== '/') name = '/' + name;
	  
	  var nsp = this.nsps[name];
	  if (!nsp) {
	    debug('initializing namespace %s', name);
	    nsp = new Namespace(this, name);
	    this.nsps[name] = nsp;
	  }
	  if (fn) nsp.on('connect', fn);
	  return nsp;
	};

	/**
	 * Closes server connection
	 *
	 * @api public
	 */

	Server.prototype.close = function(){
	  for (var id in this.nsps['/'].sockets) {
	    if (this.nsps['/'].sockets.hasOwnProperty(id)) {
	      this.nsps['/'].sockets[id].onclose();
	    }
	  }

	  this.engine.close();

	  if(this.httpServer){
	    this.httpServer.close();
	  }
	};

	/**
	 * Expose main namespace (/).
	 */

	['on', 'to', 'in', 'use', 'emit', 'send', 'write', 'clients', 'compress'].forEach(function(fn){
	  Server.prototype[fn] = function(){
	    var nsp = this.sockets[fn];
	    return nsp.apply(this.sockets, arguments);
	  };
	});

	Namespace.flags.forEach(function(flag){
	  Server.prototype.__defineGetter__(flag, function(){
	    this.sockets.flags = this.sockets.flags || {};
	    this.sockets.flags[flag] = true;
	    return this;
	  });
	});

	/**
	 * BC with `io.listen`
	 */

	Server.listen = Server;


/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var http = __webpack_require__(30);

	/**
	 * Invoking the library as a function delegates to attach if the first argument
	 * is an `http.Server`.
	 *
	 * If there are no arguments or the first argument is an options object, then
	 * a new Server instance is returned.
	 *
	 * @param {http.Server} server (if specified, will be attached to by the new Server instance)
	 * @param {Object} options
	 * @return {Server} engine server
	 * @api public
	 */

	exports = module.exports = function() {
	  // backwards compatible use as `.attach`
	  // if first argument is an http server
	  if (arguments.length && arguments[0] instanceof http.Server) {
	    return attach.apply(this, arguments);
	  }

	  // if first argument is not an http server, then just make a regular eio server
	  return exports.Server.apply(null, arguments);
	};

	/**
	 * Protocol revision number.
	 *
	 * @api public
	 */

	exports.protocol = 1;

	/**
	 * Expose Server constructor.
	 *
	 * @api public
	 */

	exports.Server = __webpack_require__(96);

	/**
	 * Expose Socket constructor.
	 *
	 * @api public
	 */

	exports.Socket = __webpack_require__(120);

	/**
	 * Expose Transport constructor.
	 *
	 * @api public
	 */

	exports.Transport = __webpack_require__(101);

	/**
	 * Expose mutable list of available transports.
	 *
	 * @api public
	 */

	exports.transports = __webpack_require__(98);

	/**
	 * Exports parser.
	 *
	 * @api public
	 */

	exports.parser = __webpack_require__(102);

	/**
	 * Creates an http.Server exclusively used for WS upgrades.
	 *
	 * @param {Number} port
	 * @param {Function} callback
	 * @param {Object} options
	 * @return {Server} websocket.io server
	 * @api public
	 */

	exports.listen = listen;

	function listen(port, options, fn) {
	  if ('function' == typeof options) {
	    fn = options;
	    options = {};
	  }

	  var server = http.createServer(function (req, res) {
	    res.writeHead(501);
	    res.end('Not Implemented');
	  });

	  server.listen(port, fn);

	  // create engine server
	  var engine = exports.attach(server, options);
	  engine.httpServer = server;

	  return engine;
	};

	/**
	 * Captures upgrade requests for a http.Server.
	 *
	 * @param {http.Server} server
	 * @param {Object} options
	 * @return {Server} engine server
	 * @api public
	 */

	exports.attach = attach;

	function attach(server, options) {
	  var engine = new exports.Server(options);
	  engine.attach(server, options);
	  return engine;
	};


/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var qs = __webpack_require__(75)
	  , parse = __webpack_require__(48).parse
	  , readFileSync = __webpack_require__(2).readFileSync
	  , crypto = __webpack_require__(71)
	  , base64id = __webpack_require__(97)
	  , transports = __webpack_require__(98)
	  , EventEmitter = __webpack_require__(19).EventEmitter
	  , Socket = __webpack_require__(120)
	  , WebSocketServer = __webpack_require__(121).Server
	  , debug = __webpack_require__(23)('engine');

	/**
	 * Module exports.
	 */

	module.exports = Server;

	/**
	 * Server constructor.
	 *
	 * @param {Object} options
	 * @api public
	 */

	function Server(opts){
	  if (!(this instanceof Server)) {
	    return new Server(opts);
	  }

	  this.clients = {};
	  this.clientsCount = 0;

	  opts = opts || {};
	  this.pingTimeout = opts.pingTimeout || 60000;
	  this.pingInterval = opts.pingInterval || 25000;
	  this.upgradeTimeout = opts.upgradeTimeout || 10000;
	  this.maxHttpBufferSize = opts.maxHttpBufferSize || 10E7;
	  this.transports = opts.transports || Object.keys(transports);
	  this.allowUpgrades = false !== opts.allowUpgrades;
	  this.allowRequest = opts.allowRequest;
	  this.cookie = false !== opts.cookie ? (opts.cookie || 'io') : false;
	  this.cookiePath = false !== opts.cookiePath ? (opts.cookiePath || false) : false;
	  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || true) : false;
	  this.httpCompression = false !== opts.httpCompression ? (opts.httpCompression || {}) : false;

	  var self = this;

	  // turn off per message deflate for node 0.8
	  // due to it not supporting DeflateRaw#close
	  // and thus not working with ws 0.8.x
	  if (/^v0\.8\./.test(process.version)) {
	    debug('perMessageDeflate not supported by node 0.8');
	    this.perMessageDeflate = false;
	  }

	  // initialize compression options
	  ['perMessageDeflate', 'httpCompression'].forEach(function(type) {
	    var compression = self[type];
	    if (true === compression) self[type] = compression = {};
	    if (compression && null == compression.threshold) {
	      compression.threshold = 1024;
	    }
	  });

	  // initialize websocket server
	  if (~this.transports.indexOf('websocket')) {
	    this.ws = new WebSocketServer({
	      noServer: true,
	      clientTracking: false,
	      perMessageDeflate: this.perMessageDeflate
	    });
	  }
	}

	/**
	 * Protocol errors mappings.
	 */

	Server.errors = {
	  UNKNOWN_TRANSPORT: 0,
	  UNKNOWN_SID: 1,
	  BAD_HANDSHAKE_METHOD: 2,
	  BAD_REQUEST: 3
	};

	Server.errorMessages = {
	  0: 'Transport unknown',
	  1: 'Session ID unknown',
	  2: 'Bad handshake method',
	  3: 'Bad request'
	};

	/**
	 * Inherits from EventEmitter.
	 */

	Server.prototype.__proto__ = EventEmitter.prototype;

	/**
	 * Hash of open clients.
	 *
	 * @api public
	 */

	Server.prototype.clients;

	/**
	 * Returns a list of available transports for upgrade given a certain transport.
	 *
	 * @return {Array}
	 * @api public
	 */

	Server.prototype.upgrades = function(transport){
	  if (!this.allowUpgrades) return [];
	  return transports[transport].upgradesTo || [];
	};

	/**
	 * Verifies a request.
	 *
	 * @param {http.ServerRequest}
	 * @return {Boolean} whether the request is valid
	 * @api private
	 */

	Server.prototype.verify = function(req, upgrade, fn){
	  // transport check
	  var transport = req._query.transport;
	  if (!~this.transports.indexOf(transport)) {
	    debug('unknown transport "%s"', transport);
	    return fn(Server.errors.UNKNOWN_TRANSPORT, false);
	  }

	  // sid check
	  var sid = req._query.sid;
	  if (sid) {
	    if (!this.clients.hasOwnProperty(sid))
	      return fn(Server.errors.UNKNOWN_SID, false);
	    if (!upgrade && this.clients[sid].transport.name !== transport) {
	      debug('bad request: unexpected transport without upgrade');
	      return fn(Server.errors.BAD_REQUEST, false);
	    }
	  } else {
	    // handshake is GET only
	    if ('GET' != req.method) return fn(Server.errors.BAD_HANDSHAKE_METHOD, false);
	    if (!this.allowRequest) return fn(null, true);
	    return this.allowRequest(req, fn);
	  }

	  fn(null, true);
	};

	/**
	 * Prepares a request by processing the query string.
	 *
	 * @api private
	 */

	Server.prototype.prepare = function(req){
	  // try to leverage pre-existing `req._query` (e.g: from connect)
	  if (!req._query) {
	    req._query = ~req.url.indexOf('?') ? qs.parse(parse(req.url).query) : {};
	  }
	};

	/**
	 * Closes all clients.
	 *
	 * @api public
	 */

	Server.prototype.close = function(){
	  debug('closing all open clients');
	  for (var i in this.clients) {
	    if (this.clients.hasOwnProperty(i)) {
	      this.clients[i].close(true);
	    }
	  }
	  return this;
	};

	/**
	 * Handles an Engine.IO HTTP request.
	 *
	 * @param {http.ServerRequest} request
	 * @param {http.ServerResponse|http.OutgoingMessage} response
	 * @api public
	 */

	Server.prototype.handleRequest = function(req, res){
	  debug('handling "%s" http request "%s"', req.method, req.url);
	  this.prepare(req);
	  req.res = res;

	  var self = this;
	  this.verify(req, false, function(err, success) {
	    if (!success) {
	      sendErrorMessage(req, res, err);
	      return;
	    }

	    if (req._query.sid) {
	      debug('setting new request for existing client');
	      self.clients[req._query.sid].transport.onRequest(req);
	    } else {
	      self.handshake(req._query.transport, req);
	    }
	  });
	};

	/**
	 * Sends an Engine.IO Error Message
	 *
	 * @param {http.ServerResponse} response
	 * @param {code} error code
	 * @api private
	 */

	 function sendErrorMessage(req, res, code) {
	    var headers = { 'Content-Type': 'application/json' };

	    if (req.headers.origin) {
	      headers['Access-Control-Allow-Credentials'] = 'true';
	      headers['Access-Control-Allow-Origin'] = req.headers.origin;
	    } else {
	      headers['Access-Control-Allow-Origin'] = '*';
	    }
	    res.writeHead(400, headers);
	    res.end(JSON.stringify({
	      code: code,
	      message: Server.errorMessages[code]
	    }));
	 }

	/**
	 * generate a socket id.
	 * Overwrite this method to generate your custom socket id
	 *
	 * @param {Object} request object
	 * @api public
	 */

	Server.prototype.generateId = function(req){
	  return base64id.generateId();
	};

	/**
	 * Handshakes a new client.
	 *
	 * @param {String} transport name
	 * @param {Object} request object
	 * @api private
	 */

	Server.prototype.handshake = function(transportName, req){
	  var id = this.generateId(req);

	  debug('handshaking client "%s"', id);

	  try {
	    var transport = new transports[transportName](req);
	    if ('polling' == transportName) {
	      transport.maxHttpBufferSize = this.maxHttpBufferSize;
	      transport.httpCompression = this.httpCompression;
	    } else if ('websocket' == transportName) {
	      transport.perMessageDeflate = this.perMessageDeflate;
	    }

	    if (req._query && req._query.b64) {
	      transport.supportsBinary = false;
	    } else {
	      transport.supportsBinary = true;
	    }
	  }
	  catch (e) {
	    sendErrorMessage(req, req.res, Server.errors.BAD_REQUEST);
	    return;
	  }
	  var socket = new Socket(id, this, transport, req);
	  var self = this;

	  if (false !== this.cookie) {
	    transport.on('headers', function(headers){
	      var cookie = self.cookie + '=' + id;
	      if(false !== self.cookiePath) {
	        cookie += '; path=' + self.cookiePath;
	      }
	      headers['Set-Cookie'] = cookie;
	    });
	  }

	  transport.onRequest(req);

	  this.clients[id] = socket;
	  this.clientsCount++;

	  socket.once('close', function(){
	    delete self.clients[id];
	    self.clientsCount--;
	  });

	  this.emit('connection', socket);
	};

	/**
	 * Handles an Engine.IO HTTP Upgrade.
	 *
	 * @api public
	 */

	Server.prototype.handleUpgrade = function(req, socket, upgradeHead){
	  this.prepare(req);

	  var self = this;
	  this.verify(req, true, function(err, success) {
	    if (!success) {
	      socket.end();
	      return;
	    }

	    var head = new Buffer(upgradeHead.length);
	    upgradeHead.copy(head);
	    upgradeHead = null;

	    // delegate to ws
	    self.ws.handleUpgrade(req, socket, head, function(conn){
	      self.onWebSocket(req, conn);
	    });
	  });
	};

	/**
	 * Called upon a ws.io connection.
	 *
	 * @param {ws.Socket} websocket
	 * @api private
	 */

	Server.prototype.onWebSocket = function(req, socket){
	  socket.on('error', onUpgradeError);

	  if (!transports[req._query.transport].prototype.handlesUpgrades) {
	    debug('transport doesnt handle upgraded requests');
	    socket.close();
	    return;
	  }

	  // get client id
	  var id = req._query.sid;

	  // keep a reference to the ws.Socket
	  req.websocket = socket;

	  if (id) {
	    var client = this.clients[id];
	    if (!client) {
	      debug('upgrade attempt for closed client');
	      socket.close();
	    } else if (client.upgrading) {
	      debug('transport has already been trying to upgrade');
	      socket.close();
	    } else if (client.upgraded) {
	      debug('transport had already been upgraded');
	      socket.close();
	    } else {
	      debug('upgrading existing transport');

	      // transport error handling takes over
	      socket.removeListener('error', onUpgradeError);

	      var transport = new transports[req._query.transport](req);
	      if (req._query && req._query.b64) {
	        transport.supportsBinary = false;
	      } else {
	        transport.supportsBinary = true;
	      }
	      transport.perMessageDeflate = this.perMessageDeflate;
	      client.maybeUpgrade(transport);
	    }
	  } else {
	    // transport error handling takes over
	    socket.removeListener('error', onUpgradeError);

	    this.handshake(req._query.transport, req);
	  }

	  function onUpgradeError(){
	    debug('websocket error before upgrade');
	    // socket.close() not needed
	  }
	};

	/**
	 * Captures upgrade requests for a http.Server.
	 *
	 * @param {http.Server} server
	 * @param {Object} options
	 * @api public
	 */

	Server.prototype.attach = function(server, options){
	  var self = this;
	  var options = options || {};
	  var path = (options.path || '/engine.io').replace(/\/$/, '');

	  var destroyUpgrade = (options.destroyUpgrade !== undefined) ? options.destroyUpgrade : true;
	  var destroyUpgradeTimeout = options.destroyUpgradeTimeout || 1000;

	  // normalize path
	  path += '/';

	  function check (req) {
	    return path == req.url.substr(0, path.length);
	  }

	  // cache and clean up listeners
	  var listeners = server.listeners('request').slice(0);
	  server.removeAllListeners('request');
	  server.on('close', self.close.bind(self));

	  // add request handler
	  server.on('request', function(req, res){
	    if (check(req)) {
	      debug('intercepting request for path "%s"', path);
	      self.handleRequest(req, res);
	    } else {
	      for (var i = 0, l = listeners.length; i < l; i++) {
	        listeners[i].call(server, req, res);
	      }
	    }
	  });

	  if(~self.transports.indexOf('websocket')) {
	    server.on('upgrade', function (req, socket, head) {
	      if (check(req)) {
	        self.handleUpgrade(req, socket, head);
	      } else if (false !== options.destroyUpgrade) {
	        // default node behavior is to disconnect when no handlers
	        // but by adding a handler, we prevent that
	        // and if no eio thing handles the upgrade
	        // then the socket needs to die!
	        setTimeout(function() {
	           if (socket.writable && socket.bytesWritten <= 0) {
	             return socket.end();
	           }
	        }, options.destroyUpgradeTimeout);
	      }
	    });
	  }
	};


/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * base64id v0.1.0
	 */

	/**
	 * Module dependencies
	 */

	var crypto = __webpack_require__(71);

	/**
	 * Constructor
	 */

	var Base64Id = function() { };

	/**
	 * Get random bytes
	 *
	 * Uses a buffer if available, falls back to crypto.randomBytes
	 */

	Base64Id.prototype.getRandomBytes = function(bytes) {

	  var BUFFER_SIZE = 4096
	  var self = this;  
	  
	  bytes = bytes || 12;

	  if (bytes > BUFFER_SIZE) {
	    return crypto.randomBytes(bytes);
	  }
	  
	  var bytesInBuffer = parseInt(BUFFER_SIZE/bytes);
	  var threshold = parseInt(bytesInBuffer*0.85);

	  if (!threshold) {
	    return crypto.randomBytes(bytes);
	  }

	  if (this.bytesBufferIndex == null) {
	     this.bytesBufferIndex = -1;
	  }

	  if (this.bytesBufferIndex == bytesInBuffer) {
	    this.bytesBuffer = null;
	    this.bytesBufferIndex = -1;
	  }

	  // No buffered bytes available or index above threshold
	  if (this.bytesBufferIndex == -1 || this.bytesBufferIndex > threshold) {
	     
	    if (!this.isGeneratingBytes) {
	      this.isGeneratingBytes = true;
	      crypto.randomBytes(BUFFER_SIZE, function(err, bytes) {
	        self.bytesBuffer = bytes;
	        self.bytesBufferIndex = 0;
	        self.isGeneratingBytes = false;
	      }); 
	    }
	    
	    // Fall back to sync call when no buffered bytes are available
	    if (this.bytesBufferIndex == -1) {
	      return crypto.randomBytes(bytes);
	    }
	  }
	  
	  var result = this.bytesBuffer.slice(bytes*this.bytesBufferIndex, bytes*(this.bytesBufferIndex+1)); 
	  this.bytesBufferIndex++; 
	  
	  return result;
	}

	/**
	 * Generates a base64 id
	 *
	 * (Original version from socket.io <http://socket.io>)
	 */

	Base64Id.prototype.generateId = function () {
	  var rand = new Buffer(15); // multiple of 3 for base64
	  if (!rand.writeInt32BE) {
	    return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString()
	      + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
	  }
	  this.sequenceNumber = (this.sequenceNumber + 1) | 0;
	  rand.writeInt32BE(this.sequenceNumber, 11);
	  if (crypto.randomBytes) {
	    this.getRandomBytes(12).copy(rand);
	  } else {
	    // not secure for node 0.4
	    [0, 4, 8].forEach(function(i) {
	      rand.writeInt32BE(Math.random() * Math.pow(2, 32) | 0, i);
	    });
	  }
	  return rand.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
	};

	/**
	 * Export
	 */

	exports = module.exports = new Base64Id();


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var XHR = __webpack_require__(99);
	var JSONP = __webpack_require__(118);

	/**
	 * Export transports.
	 */

	module.exports = exports = {
	  polling: polling,
	  websocket: __webpack_require__(119)
	};

	/**
	 * Export upgrades map.
	 */

	exports.polling.upgradesTo = ['websocket'];

	/**
	 * Polling polimorphic constructor.
	 *
	 * @api private
	 */

	function polling (req) {
	  if ('string' == typeof req._query.j) {
	    return new JSONP(req);
	  } else {
	    return new XHR(req);
	  }
	}


/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var Polling = __webpack_require__(100);
	var Transport = __webpack_require__(101);
	var debug = __webpack_require__(23)('engine:polling-xhr');

	/**
	 * Module exports.
	 */

	module.exports = XHR;

	/**
	 * Ajax polling transport.
	 *
	 * @api public
	 */

	function XHR(req){
	  Polling.call(this, req);
	}

	/**
	 * Inherits from Polling.
	 */

	XHR.prototype.__proto__ = Polling.prototype;

	/**
	 * Overrides `onRequest` to handle `OPTIONS`..
	 *
	 * @param {http.ServerRequest}
	 * @api private
	 */

	XHR.prototype.onRequest = function (req) {
	  if ('OPTIONS' == req.method) {
	    var res = req.res;
	    var headers = this.headers(req);
	    headers['Access-Control-Allow-Headers'] = 'Content-Type';
	    res.writeHead(200, headers);
	    res.end();
	  } else {
	    Polling.prototype.onRequest.call(this, req);
	  }
	};

	/**
	 * Returns headers for a response.
	 *
	 * @param {http.ServerRequest} request
	 * @param {Object} extra headers
	 * @api private
	 */

	XHR.prototype.headers = function(req, headers){
	  headers = headers || {};

	  if (req.headers.origin) {
	    headers['Access-Control-Allow-Credentials'] = 'true';
	    headers['Access-Control-Allow-Origin'] = req.headers.origin;
	  } else {
	    headers['Access-Control-Allow-Origin'] = '*';
	  }

	  return Polling.prototype.headers.call(this, req, headers);
	};


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module requirements.
	 */

	var Transport = __webpack_require__(101)
	  , parser = __webpack_require__(102)
	  , zlib = __webpack_require__(107)
	  , accepts = __webpack_require__(108)
	  , debug = __webpack_require__(23)('engine:polling');

	var compressionMethods = {
	  gzip: zlib.createGzip,
	  deflate: zlib.createDeflate
	};

	/**
	 * Exports the constructor.
	 */

	module.exports = Polling;

	/**
	 * HTTP polling constructor.
	 *
	 * @api public.
	 */

	function Polling (req) {
	  Transport.call(this, req);

	  this.closeTimeout = 30 * 1000;
	  this.maxHttpBufferSize = null;
	  this.httpCompression = null;
	}

	/**
	 * Inherits from Transport.
	 *
	 * @api public.
	 */

	Polling.prototype.__proto__ = Transport.prototype;

	/**
	 * Transport name
	 *
	 * @api public
	 */

	Polling.prototype.name = 'polling';

	/**
	 * Overrides onRequest.
	 *
	 * @param {http.ServerRequest}
	 * @api private
	 */

	Polling.prototype.onRequest = function (req) {
	  var res = req.res;

	  if ('GET' == req.method) {
	    this.onPollRequest(req, res);
	  } else if ('POST' == req.method) {
	    this.onDataRequest(req, res);
	  } else {
	    res.writeHead(500);
	    res.end();
	  }
	};

	/**
	 * The client sends a request awaiting for us to send data.
	 *
	 * @api private
	 */

	Polling.prototype.onPollRequest = function (req, res) {
	  if (this.req) {
	    debug('request overlap');
	    // assert: this.res, '.req and .res should be (un)set together'
	    this.onError('overlap from client');
	    res.writeHead(500);
	    res.end();
	    return;
	  }

	  debug('setting request');

	  this.req = req;
	  this.res = res;

	  var self = this;

	  function onClose () {
	    self.onError('poll connection closed prematurely');
	  }

	  function cleanup () {
	    req.removeListener('close', onClose);
	    self.req = self.res = null;
	  }

	  req.cleanup = cleanup;
	  req.on('close', onClose);

	  this.writable = true;
	  this.emit('drain');

	  // if we're still writable but had a pending close, trigger an empty send
	  if (this.writable && this.shouldClose) {
	    debug('triggering empty send to append close packet');
	    this.send([{ type: 'noop' }]);
	  }
	};

	/**
	 * The client sends a request with data.
	 *
	 * @api private
	 */

	Polling.prototype.onDataRequest = function (req, res) {
	  if (this.dataReq) {
	    // assert: this.dataRes, '.dataReq and .dataRes should be (un)set together'
	    this.onError('data request overlap from client');
	    res.writeHead(500);
	    res.end();
	    return;
	  }

	  var isBinary = 'application/octet-stream' == req.headers['content-type'];

	  this.dataReq = req;
	  this.dataRes = res;

	  var chunks = isBinary ? new Buffer(0) : '';
	  var self = this;

	  function cleanup () {
	    chunks = isBinary ? new Buffer(0) : '';
	    req.removeListener('data', onData);
	    req.removeListener('end', onEnd);
	    req.removeListener('close', onClose);
	    self.dataReq = self.dataRes = null;
	  }

	  function onClose () {
	    cleanup();
	    self.onError('data request connection closed prematurely');
	  }

	  function onData (data) {
	    var contentLength;
	    if (typeof data == 'string') {
	      chunks += data;
	      contentLength = Buffer.byteLength(chunks);
	    } else {
	      chunks = Buffer.concat([chunks, data]);
	      contentLength = chunks.length;
	    }

	    if (contentLength > self.maxHttpBufferSize) {
	      chunks = '';
	      req.connection.destroy();
	    }
	  }

	  function onEnd () {
	    self.onData(chunks);

	    var headers = {
	      // text/html is required instead of text/plain to avoid an
	      // unwanted download dialog on certain user-agents (GH-43)
	      'Content-Type': 'text/html',
	      'Content-Length': 2
	    };

	    res.writeHead(200, self.headers(req, headers));
	    res.end('ok');
	    cleanup();
	  }

	  req.on('close', onClose);
	  if (!isBinary) req.setEncoding('utf8');
	  req.on('data', onData);
	  req.on('end', onEnd);
	};

	/**
	 * Processes the incoming data payload.
	 *
	 * @param {String} encoded payload
	 * @api private
	 */

	Polling.prototype.onData = function (data) {
	  debug('received "%s"', data);
	  var self = this;
	  var callback = function(packet) {
	    if ('close' == packet.type) {
	      debug('got xhr close packet');
	      self.onClose();
	      return false;
	    }

	    self.onPacket(packet);
	  };

	  parser.decodePayload(data, callback);
	};

	/**
	 * Overrides onClose.
	 *
	 * @api private
	 */

	Polling.prototype.onClose = function () {
	  if (this.writable) {
	    // close pending poll request
	    this.send([{ type: 'noop' }]);
	  }
	  Transport.prototype.onClose.call(this);
	};

	/**
	 * Writes a packet payload.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Polling.prototype.send = function (packets) {
	  this.writable = false;

	  if (this.shouldClose) {
	    debug('appending close packet to payload');
	    packets.push({ type: 'close' });
	    this.shouldClose();
	    this.shouldClose = null;
	  }

	  var self = this;
	  parser.encodePayload(packets, this.supportsBinary, function(data) {
	    var compress = packets.some(function(packet) {
	      return packet.options && packet.options.compress;
	    });
	    self.write(data, { compress: compress });
	  });
	};

	/**
	 * Writes data as response to poll request.
	 *
	 * @param {String} data
	 * @param {Object} options
	 * @api private
	 */

	Polling.prototype.write = function (data, options) {
	  debug('writing "%s"', data);
	  var self = this;
	  this.doWrite(data, options, function() {
	    self.req.cleanup();
	  });
	};

	/**
	 * Performs the write.
	 *
	 * @api private
	 */

	Polling.prototype.doWrite = function (data, options, callback) {
	  var self = this;

	  // explicit UTF-8 is required for pages not served under utf
	  var isString = typeof data == 'string';
	  var contentType = isString
	    ? 'text/plain; charset=UTF-8'
	    : 'application/octet-stream';

	  var headers = {
	    'Content-Type': contentType
	  };

	  if (!this.httpCompression || !options.compress) {
	    respond(data);
	    return;
	  }

	  var len = isString ? Buffer.byteLength(data) : data.length;
	  if (len < this.httpCompression.threshold) {
	    respond(data);
	    return;
	  }

	  var encoding = accepts(this.req).encodings(['gzip', 'deflate']);
	  if (!encoding) {
	    respond(data);
	    return;
	  }

	  this.compress(data, encoding, function(err, data) {
	    if (err) {
	      self.res.writeHead(500);
	      self.res.end();
	      callback(err);
	      return;
	    }

	    headers['Content-Encoding'] = encoding;
	    respond(data);
	  });

	  function respond(data) {
	    headers['Content-Length'] = 'string' == typeof data ? Buffer.byteLength(data) : data.length;
	    self.res.writeHead(200, self.headers(self.req, headers));
	    self.res.end(data);
	    callback();
	  }
	};

	/**
	 * Comparesses data.
	 *
	 * @api private
	 */

	Polling.prototype.compress = function (data, encoding, callback) {
	  debug('compressing');

	  var buffers = [];
	  var nread = 0;

	  compressionMethods[encoding](this.httpCompression)
	    .on('error', callback)
	    .on('data', function(chunk) {
	      buffers.push(chunk);
	      nread += chunk.length;
	    })
	    .on('end', function() {
	      callback(null, Buffer.concat(buffers, nread));
	    })
	    .end(data);
	};

	/**
	 * Closes the transport.
	 *
	 * @api private
	 */

	Polling.prototype.doClose = function (fn) {
	  debug('closing');

	  var self = this;
	  var closeTimeoutTimer;

	  if (this.dataReq) {
	    debug('aborting ongoing data request');
	    this.dataReq.destroy();
	  }

	  if (this.writable) {
	    debug('transport writable - closing right away');
	    this.send([{ type: 'close' }]);
	    onClose();
	  } else if (this.discarded) {
	    debug('transport discarded - closing right away');
	    onClose();
	  } else {
	    debug('transport not writable - buffering orderly close');
	    this.shouldClose = onClose;
	    closeTimeoutTimer = setTimeout(onClose, this.closeTimeout);
	  }

	  function onClose() {
	    clearTimeout(closeTimeoutTimer);
	    fn();
	    self.onClose();
	  }
	};

	/**
	 * Returns headers for a response.
	 *
	 * @param {http.ServerRequest} request
	 * @param {Object} extra headers
	 * @api private
	 */

	Polling.prototype.headers = function (req, headers) {
	  headers = headers || {};

	  // prevent XSS warnings on IE
	  // https://github.com/LearnBoost/socket.io/pull/1333
	  var ua = req.headers['user-agent'];
	  if (ua && (~ua.indexOf(';MSIE') || ~ua.indexOf('Trident/'))) {
	    headers['X-XSS-Protection'] = '0';
	  }

	  this.emit('headers', headers);
	  return headers;
	};


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var EventEmitter = __webpack_require__(19).EventEmitter
	  , parser = __webpack_require__(102)
	  , debug = __webpack_require__(23)('engine:transport');

	/**
	 * Expose the constructor.
	 */

	module.exports = Transport;

	/**
	 * Noop function.
	 *
	 * @api private
	 */

	function noop () {}

	/**
	 * Transport constructor.
	 *
	 * @param {http.ServerRequest} request
	 * @api public
	 */

	function Transport (req) {
	  this.readyState = 'open';
	  this.discarded = false;
	}

	/**
	 * Inherits from EventEmitter.
	 */

	Transport.prototype.__proto__ = EventEmitter.prototype;

	/**
	 * Flags the transport as discarded.
	 *
	 * @api private
	 */

	Transport.prototype.discard = function () {
	  this.discarded = true;
	};

	/**
	 * Called with an incoming HTTP request.
	 *
	 * @param {http.ServerRequest} request
	 * @api private
	 */

	Transport.prototype.onRequest = function (req) {
	  debug('setting request');
	  this.req = req;
	};

	/**
	 * Closes the transport.
	 *
	 * @api private
	 */

	Transport.prototype.close = function (fn) {
	  if ('closed' == this.readyState || 'closing' == this.readyState) return;

	  this.readyState = 'closing';
	  this.doClose(fn || noop);
	};

	/**
	 * Called with a transport error.
	 *
	 * @param {String} message error
	 * @param {Object} error description
	 * @api private
	 */

	Transport.prototype.onError = function (msg, desc) {
	  if (this.listeners('error').length) {
	    var err = new Error(msg);
	    err.type = 'TransportError';
	    err.description = desc;
	    this.emit('error', err);
	  } else {
	    debug('ignored transport error %s (%s)', msg, desc);
	  }
	};

	/**
	 * Called with parsed out a packets from the data stream.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Transport.prototype.onPacket = function (packet) {
	  this.emit('packet', packet);
	};

	/**
	 * Called with the encoded packet data.
	 *
	 * @param {String} data
	 * @api private
	 */

	Transport.prototype.onData = function (data) {
	  this.onPacket(parser.decodePacket(data));
	};

	/**
	 * Called upon transport close.
	 *
	 * @api private
	 */

	Transport.prototype.onClose = function () {
	  this.readyState = 'closed';
	  this.emit('close');
	};


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	
	module.exports = __webpack_require__(103);


/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var utf8 = __webpack_require__(104);
	var after = __webpack_require__(105);
	var keys = __webpack_require__(106);

	/**
	 * Current protocol version.
	 */
	exports.protocol = 3;

	/**
	 * Packet types.
	 */

	var packets = exports.packets = {
	    open:     0    // non-ws
	  , close:    1    // non-ws
	  , ping:     2
	  , pong:     3
	  , message:  4
	  , upgrade:  5
	  , noop:     6
	};

	var packetslist = keys(packets);

	/**
	 * Premade error packet.
	 */

	var err = { type: 'error', data: 'parser error' };

	/**
	 * Encodes a packet.
	 *
	 *     <packet type id> [ <data> ]
	 *
	 * Example:
	 *
	 *     5hello world
	 *     3
	 *     4
	 *
	 * Binary is encoded in an identical principle
	 *
	 * @api private
	 */

	exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
	  if ('function' == typeof supportsBinary) {
	    callback = supportsBinary;
	    supportsBinary = null;
	  }

	  if ('function' == typeof utf8encode ) {
	    callback = utf8encode;
	    utf8encode = null;
	  }

	  if (Buffer.isBuffer(packet.data)) {
	    return encodeBuffer(packet, supportsBinary, callback);
	  } else if (packet.data && (packet.data.buffer || packet.data) instanceof ArrayBuffer) {
	    packet.data = arrayBufferToBuffer(packet.data);
	    return encodeBuffer(packet, supportsBinary, callback);
	  }

	  // Sending data as a utf-8 string
	  var encoded = packets[packet.type];

	  // data fragment is optional
	  if (undefined !== packet.data) {
	    encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
	  }

	  return callback('' + encoded);
	};

	/**
	 * Encode Buffer data
	 */

	function encodeBuffer(packet, supportsBinary, callback) {
	  var data = packet.data;
	  if (!supportsBinary) {
	    return exports.encodeBase64Packet(packet, callback);
	  }

	  var typeBuffer = new Buffer(1);
	  typeBuffer[0] = packets[packet.type];
	  return callback(Buffer.concat([typeBuffer, data]));
	}

	/**
	 * Encodes a packet with binary data in a base64 string
	 *
	 * @param {Object} packet, has `type` and `data`
	 * @return {String} base64 encoded message
	 */

	exports.encodeBase64Packet = function(packet, callback){
	  if (!Buffer.isBuffer(packet.data)) {
	    packet.data = arrayBufferToBuffer(packet.data);
	  }

	  var message = 'b' + packets[packet.type];
	  message += packet.data.toString('base64');
	  return callback(message);
	};

	/**
	 * Decodes a packet. Data also available as an ArrayBuffer if requested.
	 *
	 * @return {Object} with `type` and `data` (if any)
	 * @api private
	 */

	exports.decodePacket = function (data, binaryType, utf8decode) {
	  // String data
	  if (typeof data == 'string' || data === undefined) {
	    if (data.charAt(0) == 'b') {
	      return exports.decodeBase64Packet(data.substr(1), binaryType);
	    }

	    var type = data.charAt(0);
	    if (utf8decode) {
	      try {
	        data = utf8.decode(data);
	      } catch (e) {
	        return err;
	      }
	    }

	    if (Number(type) != type || !packetslist[type]) {
	      return err;
	    }

	    if (data.length > 1) {
	      return { type: packetslist[type], data: data.substring(1) };
	    } else {
	      return { type: packetslist[type] };
	    }
	  }

	  // Binary data
	  if (binaryType === 'arraybuffer') {
	    var type = data[0];
	    var intArray = new Uint8Array(data.length - 1);
	    for (var i = 1; i < data.length; i++) {
	      intArray[i - 1] = data[i];
	    }
	    return { type: packetslist[type], data: intArray.buffer };
	  }
	  var type = data[0];
	  return { type: packetslist[type], data: data.slice(1) };
	};

	/**
	 * Decodes a packet encoded in a base64 string.
	 *
	 * @param {String} base64 encoded message
	 * @return {Object} with `type` and `data` (if any)
	 */

	exports.decodeBase64Packet = function(msg, binaryType) {
	  var type = packetslist[msg.charAt(0)];
	  var data = new Buffer(msg.substr(1), 'base64');
	  if (binaryType === 'arraybuffer') {
	    var abv = new Uint8Array(data.length);
	    for (var i = 0; i < abv.length; i++){
	      abv[i] = data[i];
	    }
	    data = abv.buffer;
	  }
	  return { type: type, data: data };
	};

	/**
	 * Encodes multiple messages (payload).
	 *
	 *     <length>:data
	 *
	 * Example:
	 *
	 *     11:hello world2:hi
	 *
	 * If any contents are binary, they will be encoded as base64 strings. Base64
	 * encoded strings are marked with a b before the length specifier
	 *
	 * @param {Array} packets
	 * @api private
	 */

	exports.encodePayload = function (packets, supportsBinary, callback) {
	  if (typeof supportsBinary == 'function') {
	    callback = supportsBinary;
	    supportsBinary = null;
	  }

	  if (supportsBinary) {
	    return exports.encodePayloadAsBinary(packets, callback);
	  }

	  if (!packets.length) {
	    return callback('0:');
	  }

	  function setLengthHeader(message) {
	    return message.length + ':' + message;
	  }

	  function encodeOne(packet, doneCallback) {
	    exports.encodePacket(packet, supportsBinary, true, function(message) {
	      doneCallback(null, setLengthHeader(message));
	    });
	  }

	  map(packets, encodeOne, function(err, results) {
	    return callback(results.join(''));
	  });
	};

	/**
	 * Async array map using after
	 */

	function map(ary, each, done) {
	  var result = new Array(ary.length);
	  var next = after(ary.length, done);

	  var eachWithIndex = function(i, el, cb) {
	    each(el, function(error, msg) {
	      result[i] = msg;
	      cb(error, result);
	    });
	  };

	  for (var i = 0; i < ary.length; i++) {
	    eachWithIndex(i, ary[i], next);
	  }
	}

	/*
	 * Decodes data when a payload is maybe expected. Possible binary contents are
	 * decoded from their base64 representation
	 *
	 * @param {String} data, callback method
	 * @api public
	 */

	exports.decodePayload = function (data, binaryType, callback) {
	  if ('string' != typeof data) {
	    return exports.decodePayloadAsBinary(data, binaryType, callback);
	  }

	  if (typeof binaryType === 'function') {
	    callback = binaryType;
	    binaryType = null;
	  }

	  var packet;
	  if (data == '') {
	    // parser error - ignoring payload
	    return callback(err, 0, 1);
	  }

	  var length = ''
	    , n, msg;

	  for (var i = 0, l = data.length; i < l; i++) {
	    var chr = data.charAt(i);

	    if (':' != chr) {
	      length += chr;
	    } else {
	      if ('' == length || (length != (n = Number(length)))) {
	        // parser error - ignoring payload
	        return callback(err, 0, 1);
	      }

	      msg = data.substr(i + 1, n);

	      if (length != msg.length) {
	        // parser error - ignoring payload
	        return callback(err, 0, 1);
	      }

	      if (msg.length) {
	        packet = exports.decodePacket(msg, binaryType, true);

	        if (err.type == packet.type && err.data == packet.data) {
	          // parser error in individual packet - ignoring payload
	          return callback(err, 0, 1);
	        }

	        var ret = callback(packet, i + n, l);
	        if (false === ret) return;
	      }

	      // advance cursor
	      i += n;
	      length = '';
	    }
	  }

	  if (length != '') {
	    // parser error - ignoring payload
	    return callback(err, 0, 1);
	  }

	};

	/**
	 *
	 * Converts a buffer to a utf8.js encoded string
	 *
	 * @api private
	 */

	function bufferToString(buffer) {
	  var str = '';
	  for (var i = 0; i < buffer.length; i++) {
	    str += String.fromCharCode(buffer[i]);
	  }
	  return str;
	}

	/**
	 *
	 * Converts a utf8.js encoded string to a buffer
	 *
	 * @api private
	 */

	function stringToBuffer(string) {
	  var buf = new Buffer(string.length);
	  for (var i = 0; i < string.length; i++) {
	    buf.writeUInt8(string.charCodeAt(i), i);
	  }
	  return buf;
	}

	/**
	 *
	 * Converts an ArrayBuffer to a Buffer
	 *
	 * @api private
	 */

	function arrayBufferToBuffer(data) {
	  // data is either an ArrayBuffer or ArrayBufferView.
	  var array = new Uint8Array(data.buffer || data);
	  var length = data.byteLength || data.length;
	  var offset = data.byteOffset || 0;
	  var buffer = new Buffer(length);

	  for (var i = 0; i < length; i++) {
	    buffer[i] = array[offset + i];
	  }
	  return buffer;
	}

	/**
	 * Encodes multiple messages (payload) as binary.
	 *
	 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
	 * 255><data>
	 *
	 * Example:
	 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
	 *
	 * @param {Array} packets
	 * @return {Buffer} encoded payload
	 * @api private
	 */

	exports.encodePayloadAsBinary = function (packets, callback) {
	  if (!packets.length) {
	    return callback(new Buffer(0));
	  }

	  function encodeOne(p, doneCallback) {
	    exports.encodePacket(p, true, true, function(packet) {

	      if (typeof packet === 'string') {
	        var encodingLength = '' + packet.length;
	        var sizeBuffer = new Buffer(encodingLength.length + 2);
	        sizeBuffer[0] = 0; // is a string (not true binary = 0)
	        for (var i = 0; i < encodingLength.length; i++) {
	          sizeBuffer[i + 1] = parseInt(encodingLength[i], 10);
	        }
	        sizeBuffer[sizeBuffer.length - 1] = 255;
	        return doneCallback(null, Buffer.concat([sizeBuffer, stringToBuffer(packet)]));
	      }

	      var encodingLength = '' + packet.length;
	      var sizeBuffer = new Buffer(encodingLength.length + 2);
	      sizeBuffer[0] = 1; // is binary (true binary = 1)
	      for (var i = 0; i < encodingLength.length; i++) {
	        sizeBuffer[i + 1] = parseInt(encodingLength[i], 10);
	      }
	      sizeBuffer[sizeBuffer.length - 1] = 255;
	      doneCallback(null, Buffer.concat([sizeBuffer, packet]));
	    });
	  }

	  map(packets, encodeOne, function(err, results) {
	    return callback(Buffer.concat(results));
	  });
	};

	/*
	 * Decodes data when a payload is maybe expected. Strings are decoded by
	 * interpreting each byte as a key code for entries marked to start with 0. See
	 * description of encodePayloadAsBinary

	 * @param {Buffer} data, callback method
	 * @api public
	 */

	exports.decodePayloadAsBinary = function (data, binaryType, callback) {
	  if (typeof binaryType === 'function') {
	    callback = binaryType;
	    binaryType = null;
	  }

	  var bufferTail = data;
	  var buffers = [];

	  while (bufferTail.length > 0) {
	    var strLen = '';
	    var isString = bufferTail[0] === 0;
	    var numberTooLong = false;
	    for (var i = 1; ; i++) {
	      if (bufferTail[i] == 255)  break;
	      // 310 = char length of Number.MAX_VALUE
	      if (strLen.length > 310) {
	        numberTooLong = true;
	        break;
	      }
	      strLen += '' + bufferTail[i];
	    }
	    if(numberTooLong) return callback(err, 0, 1);
	    bufferTail = bufferTail.slice(strLen.length + 1);

	    var msgLength = parseInt(strLen, 10);

	    var msg = bufferTail.slice(1, msgLength + 1);
	    if (isString) msg = bufferToString(msg);
	    buffers.push(msg);
	    bufferTail = bufferTail.slice(msgLength + 1);
	  }

	  var total = buffers.length;
	  buffers.forEach(function(buffer, i) {
	    callback(exports.decodePacket(buffer, binaryType, true), i, total);
	  });
	};


/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {/*! https://mths.be/utf8js v2.0.0 by @mathias */
	;(function(root) {

		// Detect free variables `exports`
		var freeExports = typeof exports == 'object' && exports;

		// Detect free variable `module`
		var freeModule = typeof module == 'object' && module &&
			module.exports == freeExports && module;

		// Detect free variable `global`, from Node.js or Browserified code,
		// and use it as `root`
		var freeGlobal = typeof global == 'object' && global;
		if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
			root = freeGlobal;
		}

		/*--------------------------------------------------------------------------*/

		var stringFromCharCode = String.fromCharCode;

		// Taken from https://mths.be/punycode
		function ucs2decode(string) {
			var output = [];
			var counter = 0;
			var length = string.length;
			var value;
			var extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		// Taken from https://mths.be/punycode
		function ucs2encode(array) {
			var length = array.length;
			var index = -1;
			var value;
			var output = '';
			while (++index < length) {
				value = array[index];
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
			}
			return output;
		}

		function checkScalarValue(codePoint) {
			if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
				throw Error(
					'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
					' is not a scalar value'
				);
			}
		}
		/*--------------------------------------------------------------------------*/

		function createByte(codePoint, shift) {
			return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
		}

		function encodeCodePoint(codePoint) {
			if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
				return stringFromCharCode(codePoint);
			}
			var symbol = '';
			if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
				symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
			}
			else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
				checkScalarValue(codePoint);
				symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
				symbol += createByte(codePoint, 6);
			}
			else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
				symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
				symbol += createByte(codePoint, 12);
				symbol += createByte(codePoint, 6);
			}
			symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
			return symbol;
		}

		function utf8encode(string) {
			var codePoints = ucs2decode(string);
			var length = codePoints.length;
			var index = -1;
			var codePoint;
			var byteString = '';
			while (++index < length) {
				codePoint = codePoints[index];
				byteString += encodeCodePoint(codePoint);
			}
			return byteString;
		}

		/*--------------------------------------------------------------------------*/

		function readContinuationByte() {
			if (byteIndex >= byteCount) {
				throw Error('Invalid byte index');
			}

			var continuationByte = byteArray[byteIndex] & 0xFF;
			byteIndex++;

			if ((continuationByte & 0xC0) == 0x80) {
				return continuationByte & 0x3F;
			}

			// If we end up here, it’s not a continuation byte
			throw Error('Invalid continuation byte');
		}

		function decodeSymbol() {
			var byte1;
			var byte2;
			var byte3;
			var byte4;
			var codePoint;

			if (byteIndex > byteCount) {
				throw Error('Invalid byte index');
			}

			if (byteIndex == byteCount) {
				return false;
			}

			// Read first byte
			byte1 = byteArray[byteIndex] & 0xFF;
			byteIndex++;

			// 1-byte sequence (no continuation bytes)
			if ((byte1 & 0x80) == 0) {
				return byte1;
			}

			// 2-byte sequence
			if ((byte1 & 0xE0) == 0xC0) {
				var byte2 = readContinuationByte();
				codePoint = ((byte1 & 0x1F) << 6) | byte2;
				if (codePoint >= 0x80) {
					return codePoint;
				} else {
					throw Error('Invalid continuation byte');
				}
			}

			// 3-byte sequence (may include unpaired surrogates)
			if ((byte1 & 0xF0) == 0xE0) {
				byte2 = readContinuationByte();
				byte3 = readContinuationByte();
				codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
				if (codePoint >= 0x0800) {
					checkScalarValue(codePoint);
					return codePoint;
				} else {
					throw Error('Invalid continuation byte');
				}
			}

			// 4-byte sequence
			if ((byte1 & 0xF8) == 0xF0) {
				byte2 = readContinuationByte();
				byte3 = readContinuationByte();
				byte4 = readContinuationByte();
				codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
					(byte3 << 0x06) | byte4;
				if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
					return codePoint;
				}
			}

			throw Error('Invalid UTF-8 detected');
		}

		var byteArray;
		var byteCount;
		var byteIndex;
		function utf8decode(byteString) {
			byteArray = ucs2decode(byteString);
			byteCount = byteArray.length;
			byteIndex = 0;
			var codePoints = [];
			var tmp;
			while ((tmp = decodeSymbol()) !== false) {
				codePoints.push(tmp);
			}
			return ucs2encode(codePoints);
		}

		/*--------------------------------------------------------------------------*/

		var utf8 = {
			'version': '2.0.0',
			'encode': utf8encode,
			'decode': utf8decode
		};

		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return utf8;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		}	else if (freeExports && !freeExports.nodeType) {
			if (freeModule) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = utf8;
			} else { // in Narwhal or RingoJS v0.7.0-
				var object = {};
				var hasOwnProperty = object.hasOwnProperty;
				for (var key in utf8) {
					hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.utf8 = utf8;
		}

	}(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)(module)))

/***/ },
/* 105 */
/***/ function(module, exports) {

	module.exports = after

	function after(count, callback, err_cb) {
	    var bail = false
	    err_cb = err_cb || noop
	    proxy.count = count

	    return (count === 0) ? callback() : proxy

	    function proxy(err, result) {
	        if (proxy.count <= 0) {
	            throw new Error('after called too many times')
	        }
	        --proxy.count

	        // after first error, rest are passed to err_cb
	        if (err) {
	            bail = true
	            callback(err)
	            // future error callbacks will go to error handler
	            callback = err_cb
	        } else if (proxy.count === 0 && !bail) {
	            callback(null, result)
	        }
	    }
	}

	function noop() {}


/***/ },
/* 106 */
/***/ function(module, exports) {

	
	/**
	 * Gets the keys for an object.
	 *
	 * @return {Array} keys
	 * @api private
	 */

	module.exports = Object.keys || function keys (obj){
	  var arr = [];
	  var has = Object.prototype.hasOwnProperty;

	  for (var i in obj) {
	    if (has.call(obj, i)) {
	      arr.push(i);
	    }
	  }
	  return arr;
	};


/***/ },
/* 107 */
/***/ function(module, exports) {

	module.exports = require("zlib");

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	var Negotiator = __webpack_require__(109)
	var mime = __webpack_require__(115)

	var slice = [].slice

	module.exports = Accepts

	function Accepts(req) {
	  if (!(this instanceof Accepts))
	    return new Accepts(req)

	  this.headers = req.headers
	  this.negotiator = Negotiator(req)
	}

	/**
	 * Check if the given `type(s)` is acceptable, returning
	 * the best match when true, otherwise `undefined`, in which
	 * case you should respond with 406 "Not Acceptable".
	 *
	 * The `type` value may be a single mime type string
	 * such as "application/json", the extension name
	 * such as "json" or an array `["json", "html", "text/plain"]`. When a list
	 * or array is given the _best_ match, if any is returned.
	 *
	 * Examples:
	 *
	 *     // Accept: text/html
	 *     this.types('html');
	 *     // => "html"
	 *
	 *     // Accept: text/*, application/json
	 *     this.types('html');
	 *     // => "html"
	 *     this.types('text/html');
	 *     // => "text/html"
	 *     this.types('json', 'text');
	 *     // => "json"
	 *     this.types('application/json');
	 *     // => "application/json"
	 *
	 *     // Accept: text/*, application/json
	 *     this.types('image/png');
	 *     this.types('png');
	 *     // => undefined
	 *
	 *     // Accept: text/*;q=.5, application/json
	 *     this.types(['html', 'json']);
	 *     this.types('html', 'json');
	 *     // => "json"
	 *
	 * @param {String|Array} type(s)...
	 * @return {String|Array|Boolean}
	 * @api public
	 */

	Accepts.prototype.type =
	Accepts.prototype.types = function (types) {
	  if (!Array.isArray(types)) types = slice.call(arguments);
	  var n = this.negotiator;
	  if (!types.length) return n.mediaTypes();
	  if (!this.headers.accept) return types[0];
	  var mimes = types.map(extToMime);
	  var accepts = n.mediaTypes(mimes.filter(validMime));
	  var first = accepts[0];
	  if (!first) return false;
	  return types[mimes.indexOf(first)];
	}

	/**
	 * Return accepted encodings or best fit based on `encodings`.
	 *
	 * Given `Accept-Encoding: gzip, deflate`
	 * an array sorted by quality is returned:
	 *
	 *     ['gzip', 'deflate']
	 *
	 * @param {String|Array} encoding(s)...
	 * @return {String|Array}
	 * @api public
	 */

	Accepts.prototype.encoding =
	Accepts.prototype.encodings = function (encodings) {
	  if (!Array.isArray(encodings)) encodings = slice.call(arguments);
	  var n = this.negotiator;
	  if (!encodings.length) return n.encodings();
	  return n.encodings(encodings)[0] || false;
	}

	/**
	 * Return accepted charsets or best fit based on `charsets`.
	 *
	 * Given `Accept-Charset: utf-8, iso-8859-1;q=0.2, utf-7;q=0.5`
	 * an array sorted by quality is returned:
	 *
	 *     ['utf-8', 'utf-7', 'iso-8859-1']
	 *
	 * @param {String|Array} charset(s)...
	 * @return {String|Array}
	 * @api public
	 */

	Accepts.prototype.charset =
	Accepts.prototype.charsets = function (charsets) {
	  if (!Array.isArray(charsets)) charsets = [].slice.call(arguments);
	  var n = this.negotiator;
	  if (!charsets.length) return n.charsets();
	  if (!this.headers['accept-charset']) return charsets[0];
	  return n.charsets(charsets)[0] || false;
	}

	/**
	 * Return accepted languages or best fit based on `langs`.
	 *
	 * Given `Accept-Language: en;q=0.8, es, pt`
	 * an array sorted by quality is returned:
	 *
	 *     ['es', 'pt', 'en']
	 *
	 * @param {String|Array} lang(s)...
	 * @return {Array|String}
	 * @api public
	 */

	Accepts.prototype.lang =
	Accepts.prototype.langs =
	Accepts.prototype.language =
	Accepts.prototype.languages = function (langs) {
	  if (!Array.isArray(langs)) langs = slice.call(arguments);
	  var n = this.negotiator;
	  if (!langs.length) return n.languages();
	  if (!this.headers['accept-language']) return langs[0];
	  return n.languages(langs)[0] || false;
	}

	/**
	 * Convert extnames to mime.
	 *
	 * @param {String} type
	 * @return {String}
	 * @api private
	 */

	function extToMime(type) {
	  if (~type.indexOf('/')) return type;
	  return mime.lookup(type);
	}

	/**
	 * Check if mime is valid.
	 *
	 * @param {String} type
	 * @return {String}
	 * @api private
	 */

	function validMime(type) {
	  return typeof type === 'string';
	}


/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Negotiator;
	Negotiator.Negotiator = Negotiator;

	function Negotiator(request) {
	  if (!(this instanceof Negotiator)) return new Negotiator(request);
	  this.request = request;
	}

	var set = { charset: 'accept-charset',
	            encoding: 'accept-encoding',
	            language: 'accept-language',
	            mediaType: 'accept' };


	function capitalize(string){
	  return string.charAt(0).toUpperCase() + string.slice(1);
	}

	Object.keys(set).forEach(function (k) {
	  var header = set[k],
	      method = __webpack_require__(110)("./"+k+'.js'),
	      singular = k,
	      plural = k + 's';

	  Negotiator.prototype[plural] = function (available) {
	    return method(this.request.headers[header], available);
	  };

	  Negotiator.prototype[singular] = function(available) {
	    var set = this[plural](available);
	    if (set) return set[0];
	  };

	  // Keep preferred* methods for legacy compatibility
	  Negotiator.prototype['preferred'+capitalize(plural)] = Negotiator.prototype[plural];
	  Negotiator.prototype['preferred'+capitalize(singular)] = Negotiator.prototype[singular];
	})


/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./charset.js": 111,
		"./encoding.js": 112,
		"./language.js": 113,
		"./mediaType.js": 114,
		"./negotiator.js": 109
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 110;


/***/ },
/* 111 */
/***/ function(module, exports) {

	module.exports = preferredCharsets;
	preferredCharsets.preferredCharsets = preferredCharsets;

	function parseAcceptCharset(accept) {
	  return accept.split(',').map(function(e, i) {
	    return parseCharset(e.trim(), i);
	  }).filter(function(e) {
	    return e;
	  });
	}

	function parseCharset(s, i) {
	  var match = s.match(/^\s*(\S+?)\s*(?:;(.*))?$/);
	  if (!match) return null;

	  var charset = match[1];
	  var q = 1;
	  if (match[2]) {
	    var params = match[2].split(';')
	    for (var i = 0; i < params.length; i ++) {
	      var p = params[i].trim().split('=');
	      if (p[0] === 'q') {
	        q = parseFloat(p[1]);
	        break;
	      }
	    }
	  }

	  return {
	    charset: charset,
	    q: q,
	    i: i
	  };
	}

	function getCharsetPriority(charset, accepted) {
	  return (accepted.map(function(a) {
	    return specify(charset, a);
	  }).filter(Boolean).sort(function (a, b) {
	    if(a.s == b.s) {
	      return a.q > b.q ? -1 : 1;
	    } else {
	      return a.s > b.s ? -1 : 1;
	    }
	  })[0] || {s: 0, q:0});
	}

	function specify(charset, spec) {
	  var s = 0;
	  if(spec.charset.toLowerCase() === charset.toLowerCase()){
	    s |= 1;
	  } else if (spec.charset !== '*' ) {
	    return null
	  }

	  return {
	    s: s,
	    q: spec.q,
	  }
	}

	function preferredCharsets(accept, provided) {
	  // RFC 2616 sec 14.2: no header = *
	  accept = parseAcceptCharset(accept === undefined ? '*' : accept || '');
	  if (provided) {
	    return provided.map(function(type) {
	      return [type, getCharsetPriority(type, accept)];
	    }).filter(function(pair) {
	      return pair[1].q > 0;
	    }).sort(function(a, b) {
	      var pa = a[1];
	      var pb = b[1];
	      return (pb.q - pa.q) || (pb.s - pa.s) || (pa.i - pb.i);
	    }).map(function(pair) {
	      return pair[0];
	    });
	  } else {
	    return accept.sort(function (a, b) {
	      // revsort
	      return (b.q - a.q) || (a.i - b.i);
	    }).filter(function(type) {
	      return type.q > 0;
	    }).map(function(type) {
	      return type.charset;
	    });
	  }
	}


/***/ },
/* 112 */
/***/ function(module, exports) {

	module.exports = preferredEncodings;
	preferredEncodings.preferredEncodings = preferredEncodings;

	function parseAcceptEncoding(accept) {
	  var acceptableEncodings;

	  if (accept) {
	    acceptableEncodings = accept.split(',').map(function(e, i) {
	      return parseEncoding(e.trim(), i);
	    });
	  } else {
	    acceptableEncodings = [];
	  }

	  if (!acceptableEncodings.some(function(e) {
	    return e && specify('identity', e);
	  })) {
	    /*
	     * If identity doesn't explicitly appear in the accept-encoding header,
	     * it's added to the list of acceptable encoding with the lowest q
	     *
	     */
	    var lowestQ = 1;

	    for(var i = 0; i < acceptableEncodings.length; i++){
	      var e = acceptableEncodings[i];
	      if(e && e.q < lowestQ){
	        lowestQ = e.q;
	      }
	    }
	    acceptableEncodings.push({
	      encoding: 'identity',
	      q: lowestQ / 2,
	    });
	  }

	  return acceptableEncodings.filter(function(e) {
	    return e;
	  });
	}

	function parseEncoding(s, i) {
	  var match = s.match(/^\s*(\S+?)\s*(?:;(.*))?$/);

	  if (!match) return null;

	  var encoding = match[1];
	  var q = 1;
	  if (match[2]) {
	    var params = match[2].split(';');
	    for (var i = 0; i < params.length; i ++) {
	      var p = params[i].trim().split('=');
	      if (p[0] === 'q') {
	        q = parseFloat(p[1]);
	        break;
	      }
	    }
	  }

	  return {
	    encoding: encoding,
	    q: q,
	    i: i
	  };
	}

	function getEncodingPriority(encoding, accepted) {
	  return (accepted.map(function(a) {
	    return specify(encoding, a);
	  }).filter(Boolean).sort(function (a, b) {
	    if(a.s == b.s) {
	      return a.q > b.q ? -1 : 1;
	    } else {
	      return a.s > b.s ? -1 : 1;
	    }
	  })[0] || {s: 0, q: 0});
	}

	function specify(encoding, spec) {
	  var s = 0;
	  if(spec.encoding.toLowerCase() === encoding.toLowerCase()){
	    s |= 1;
	  } else if (spec.encoding !== '*' ) {
	    return null
	  }

	  return {
	    s: s,
	    q: spec.q,
	  }
	};

	function preferredEncodings(accept, provided) {
	  accept = parseAcceptEncoding(accept || '');
	  if (provided) {
	    return provided.map(function(type) {
	      return [type, getEncodingPriority(type, accept)];
	    }).filter(function(pair) {
	      return pair[1].q > 0;
	    }).sort(function(a, b) {
	      var pa = a[1];
	      var pb = b[1];
	      return (pb.q - pa.q) || (pb.s - pa.s) || (pa.i - pb.i);
	    }).map(function(pair) {
	      return pair[0];
	    });
	  } else {
	    return accept.sort(function (a, b) {
	      // revsort
	      return (b.q - a.q) || (a.i - b.i);
	    }).filter(function(type){
	      return type.q > 0;
	    }).map(function(type) {
	      return type.encoding;
	    });
	  }
	}


/***/ },
/* 113 */
/***/ function(module, exports) {

	module.exports = preferredLanguages;
	preferredLanguages.preferredLanguages = preferredLanguages;

	function parseAcceptLanguage(accept) {
	  return accept.split(',').map(function(e, i) {
	    return parseLanguage(e.trim(), i);
	  }).filter(function(e) {
	    return e;
	  });
	}

	function parseLanguage(s, i) {
	  var match = s.match(/^\s*(\S+?)(?:-(\S+?))?\s*(?:;(.*))?$/);
	  if (!match) return null;

	  var prefix = match[1],
	      suffix = match[2],
	      full = prefix;

	  if (suffix) full += "-" + suffix;

	  var q = 1;
	  if (match[3]) {
	    var params = match[3].split(';')
	    for (var i = 0; i < params.length; i ++) {
	      var p = params[i].split('=');
	      if (p[0] === 'q') q = parseFloat(p[1]);
	    }
	  }

	  return {
	    prefix: prefix,
	    suffix: suffix,
	    q: q,
	    i: i,
	    full: full
	  };
	}

	function getLanguagePriority(language, accepted) {
	  return (accepted.map(function(a){
	    return specify(language, a);
	  }).filter(Boolean).sort(function (a, b) {
	    if(a.s == b.s) {
	      return a.q > b.q ? -1 : 1;
	    } else {
	      return a.s > b.s ? -1 : 1;
	    }
	  })[0] || {s: 0, q: 0});
	}

	function specify(language, spec) {
	  var p = parseLanguage(language)
	  if (!p) return null;
	  var s = 0;
	  if(spec.full.toLowerCase() === p.full.toLowerCase()){
	    s |= 4;
	  } else if (spec.prefix.toLowerCase() === p.full.toLowerCase()) {
	    s |= 2;
	  } else if (spec.full.toLowerCase() === p.prefix.toLowerCase()) {
	    s |= 1;
	  } else if (spec.full !== '*' ) {
	    return null
	  }

	  return {
	    s: s,
	    q: spec.q,
	  }
	};

	function preferredLanguages(accept, provided) {
	  // RFC 2616 sec 14.4: no header = *
	  accept = parseAcceptLanguage(accept === undefined ? '*' : accept || '');
	  if (provided) {

	    var ret = provided.map(function(type) {
	      return [type, getLanguagePriority(type, accept)];
	    }).filter(function(pair) {
	      return pair[1].q > 0;
	    }).sort(function(a, b) {
	      var pa = a[1];
	      var pb = b[1];
	      return (pb.q - pa.q) || (pb.s - pa.s) || (pa.i - pb.i);
	    }).map(function(pair) {
	      return pair[0];
	    });
	    return ret;

	  } else {
	    return accept.sort(function (a, b) {
	      // revsort
	      return (b.q - a.q) || (a.i - b.i);
	    }).filter(function(type) {
	      return type.q > 0;
	    }).map(function(type) {
	      return type.full;
	    });
	  }
	}


/***/ },
/* 114 */
/***/ function(module, exports) {

	module.exports = preferredMediaTypes;
	preferredMediaTypes.preferredMediaTypes = preferredMediaTypes;

	function parseAccept(accept) {
	  return accept.split(',').map(function(e, i) {
	    return parseMediaType(e.trim(), i);
	  }).filter(function(e) {
	    return e;
	  });
	};

	function parseMediaType(s, i) {
	  var match = s.match(/\s*(\S+?)\/([^;\s]+)\s*(?:;(.*))?/);
	  if (!match) return null;

	  var type = match[1],
	      subtype = match[2],
	      full = "" + type + "/" + subtype,
	      params = {},
	      q = 1;

	  if (match[3]) {
	    params = match[3].split(';').map(function(s) {
	      return s.trim().split('=');
	    }).reduce(function (set, p) {
	      set[p[0]] = p[1];
	      return set
	    }, params);

	    if (params.q != null) {
	      q = parseFloat(params.q);
	      delete params.q;
	    }
	  }

	  return {
	    type: type,
	    subtype: subtype,
	    params: params,
	    q: q,
	    i: i,
	    full: full
	  };
	}

	function getMediaTypePriority(type, accepted) {
	  return (accepted.map(function(a) {
	    return specify(type, a);
	  }).filter(Boolean).sort(function (a, b) {
	    if(a.s == b.s) {
	      return a.q > b.q ? -1 : 1;
	    } else {
	      return a.s > b.s ? -1 : 1;
	    }
	  })[0] || {s: 0, q: 0});
	}

	function specify(type, spec) {
	  var p = parseMediaType(type);
	  var s = 0;

	  if (!p) {
	    return null;
	  }

	  if(spec.type.toLowerCase() == p.type.toLowerCase()) {
	    s |= 4
	  } else if(spec.type != '*') {
	    return null;
	  }

	  if(spec.subtype.toLowerCase() == p.subtype.toLowerCase()) {
	    s |= 2
	  } else if(spec.subtype != '*') {
	    return null;
	  }

	  var keys = Object.keys(spec.params);
	  if (keys.length > 0) {
	    if (keys.every(function (k) {
	      return spec.params[k] == '*' || (spec.params[k] || '').toLowerCase() == (p.params[k] || '').toLowerCase();
	    })) {
	      s |= 1
	    } else {
	      return null
	    }
	  }

	  return {
	    q: spec.q,
	    s: s,
	  }

	}

	function preferredMediaTypes(accept, provided) {
	  // RFC 2616 sec 14.2: no header = */*
	  accept = parseAccept(accept === undefined ? '*/*' : accept || '');
	  if (provided) {
	    return provided.map(function(type) {
	      return [type, getMediaTypePriority(type, accept)];
	    }).filter(function(pair) {
	      return pair[1].q > 0;
	    }).sort(function(a, b) {
	      var pa = a[1];
	      var pb = b[1];
	      return (pb.q - pa.q) || (pb.s - pa.s) || (pa.i - pb.i);
	    }).map(function(pair) {
	      return pair[0];
	    });

	  } else {
	    return accept.sort(function (a, b) {
	      // revsort
	      return (b.q - a.q) || (a.i - b.i);
	    }).filter(function(type) {
	      return type.q > 0;
	    }).map(function(type) {
	      return type.full;
	    });
	  }
	}


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	
	var db = __webpack_require__(116)

	// types[extension] = type
	exports.types = Object.create(null)
	// extensions[type] = [extensions]
	exports.extensions = Object.create(null)

	Object.keys(db).forEach(function (name) {
	  var mime = db[name]
	  var exts = mime.extensions
	  if (!exts || !exts.length) return
	  exports.extensions[name] = exts
	  exts.forEach(function (ext) {
	    exports.types[ext] = name
	  })
	})

	exports.lookup = function (string) {
	  if (!string || typeof string !== "string") return false
	  // remove any leading paths, though we should just use path.basename
	  string = string.replace(/.*[\.\/\\]/, '').toLowerCase()
	  if (!string) return false
	  return exports.types[string] || false
	}

	exports.extension = function (type) {
	  if (!type || typeof type !== "string") return false
	  // to do: use media-typer
	  type = type.match(/^\s*([^;\s]*)(?:;|\s|$)/)
	  if (!type) return false
	  var exts = exports.extensions[type[1].toLowerCase()]
	  if (!exts || !exts.length) return false
	  return exts[0]
	}

	// type has to be an exact mime type
	exports.charset = function (type) {
	  var mime = db[type]
	  if (mime && mime.charset) return mime.charset

	  // default text/* to utf-8
	  if (/^text\//.test(type)) return 'UTF-8'

	  return false
	}

	// backwards compatibility
	exports.charsets = {
	  lookup: exports.charset
	}

	// to do: maybe use set-type module or something
	exports.contentType = function (type) {
	  if (!type || typeof type !== "string") return false
	  if (!~type.indexOf('/')) type = exports.lookup(type)
	  if (!type) return false
	  if (!~type.indexOf('charset')) {
	    var charset = exports.charset(type)
	    if (charset) type += '; charset=' + charset.toLowerCase()
	  }
	  return type
	}


/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * mime-db
	 * Copyright(c) 2014 Jonathan Ong
	 * MIT Licensed
	 */

	/**
	 * Module exports.
	 */

	module.exports = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"./db.json\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))


/***/ },
/* 117 */,
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var Polling = __webpack_require__(100);
	var qs = __webpack_require__(75);
	var rDoubleSlashes = /\\\\n/g;
	var rSlashes = /(\\)?\\n/g;

	/**
	 * Module exports.
	 */

	module.exports = JSONP;

	/**
	 * JSON-P polling transport.
	 *
	 * @api public
	 */

	function JSONP (req) {
	  Polling.call(this, req);

	  this.head = '___eio[' + (req._query.j || '').replace(/[^0-9]/g, '') + '](';
	  this.foot = ');';
	};

	/**
	 * Inherits from Polling.
	 */

	JSONP.prototype.__proto__ = Polling.prototype;

	/**
	 * Handles incoming data.
	 * Due to a bug in \n handling by browsers, we expect a escaped string.
	 *
	 * @api private
	 */

	JSONP.prototype.onData = function (data) {
	  // we leverage the qs module so that we get built-in DoS protection
	  // and the fast alternative to decodeURIComponent
	  data = qs.parse(data).d;
	  if ('string' == typeof data) {
	    //client will send already escaped newlines as \\\\n and newlines as \\n
	    // \\n must be replaced with \n and \\\\n with \\n
	    data = data.replace(rSlashes, function(match, slashes) {
	      return slashes ? match : '\n';
	    });
	    Polling.prototype.onData.call(this, data.replace(rDoubleSlashes, '\\n'));
	  }
	};

	/**
	 * Performs the write.
	 *
	 * @api private
	 */

	JSONP.prototype.doWrite = function (data, options, callback) {
	  // we must output valid javascript, not valid json
	  // see: http://timelessrepo.com/json-isnt-a-javascript-subset
	  var js = JSON.stringify(data)
	    .replace(/\u2028/g, '\\u2028')
	    .replace(/\u2029/g, '\\u2029');

	  // prepare response
	  data = this.head + js + this.foot;

	  Polling.prototype.doWrite.call(this, data, options, callback);
	};


/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var Transport = __webpack_require__(101)
	  , parser = __webpack_require__(102)
	  , debug = __webpack_require__(23)('engine:ws')

	/**
	 * Export the constructor.
	 */

	module.exports = WebSocket;

	/**
	 * WebSocket transport 
	 *
	 * @param {http.ServerRequest}
	 * @api public
	 */

	function WebSocket (req) {
	  Transport.call(this, req);
	  var self = this;
	  this.socket = req.websocket;
	  this.socket.on('message', this.onData.bind(this));
	  this.socket.once('close', this.onClose.bind(this));
	  this.socket.on('error', this.onError.bind(this));
	  this.socket.on('headers', function (headers) {
	    self.emit('headers', headers);
	  });
	  this.writable = true;
	  this.perMessageDeflate = null;
	};

	/**
	 * Inherits from Transport.
	 */

	WebSocket.prototype.__proto__ = Transport.prototype;

	/**
	 * Transport name
	 *
	 * @api public
	 */

	WebSocket.prototype.name = 'websocket';

	/**
	 * Advertise upgrade support.
	 *
	 * @api public
	 */

	WebSocket.prototype.handlesUpgrades = true;

	/**
	 * Advertise framing support.
	 *
	 * @api public
	 */

	WebSocket.prototype.supportsFraming = true;

	/**
	 * Processes the incoming data.
	 *
	 * @param {String} encoded packet
	 * @api private
	 */

	WebSocket.prototype.onData = function (data) {
	  debug('received "%s"', data);
	  Transport.prototype.onData.call(this, data);
	};

	/**
	 * Writes a packet payload.
	 *
	 * @param {Array} packets
	 * @api private
	 */

	WebSocket.prototype.send = function (packets) {
	  var self = this;
	  packets.forEach(function(packet) {
	    parser.encodePacket(packet, self.supportsBinary, function(data) {
	      debug('writing "%s"', data);

	      // always creates a new object since ws modifies it
	      var opts = {};
	      if (packet.options) {
	        opts.compress = packet.options.compress;
	      }

	      if (self.perMessageDeflate) {
	        var len = 'string' == typeof data ? Buffer.byteLength(data) : data.length;
	        if (len < self.perMessageDeflate.threshold) {
	          opts.compress = false;
	        }
	      }

	      self.writable = false;
	      self.socket.send(data, opts, function (err){
	        if (err) return self.onError('write error', err.stack);
	        self.writable = true;
	        self.emit('drain');
	      });
	    });
	  });
	};

	/**
	 * Closes the transport.
	 *
	 * @api private
	 */

	WebSocket.prototype.doClose = function (fn) {
	  debug('closing');
	  this.socket.close();
	  fn && fn();
	};


/***/ },
/* 120 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var EventEmitter = __webpack_require__(19).EventEmitter;
	var debug = __webpack_require__(23)('engine:socket');

	/**
	 * Module exports.
	 */

	module.exports = Socket;

	/**
	 * Client class (abstract).
	 *
	 * @api private
	 */

	function Socket (id, server, transport, req) {
	  this.id = id;
	  this.server = server;
	  this.upgrading = false;
	  this.upgraded = false;
	  this.readyState = 'opening';
	  this.writeBuffer = [];
	  this.packetsFn = [];
	  this.sentCallbackFn = [];
	  this.cleanupFn = [];
	  this.request = req;

	  // Cache IP since it might not be in the req later
	  this.remoteAddress = req.connection.remoteAddress;

	  this.checkIntervalTimer = null;
	  this.upgradeTimeoutTimer = null;
	  this.pingTimeoutTimer = null;

	  this.setTransport(transport);
	  this.onOpen();
	}

	/**
	 * Inherits from EventEmitter.
	 */

	Socket.prototype.__proto__ = EventEmitter.prototype;

	/**
	 * Called upon transport considered open.
	 *
	 * @api private
	 */

	Socket.prototype.onOpen = function () {
	  this.readyState = 'open';

	  // sends an `open` packet
	  this.transport.sid = this.id;
	  this.sendPacket('open', JSON.stringify({
	      sid: this.id
	    , upgrades: this.getAvailableUpgrades()
	    , pingInterval: this.server.pingInterval
	    , pingTimeout: this.server.pingTimeout
	  }));

	  this.emit('open');
	  this.setPingTimeout();
	};

	/**
	 * Called upon transport packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onPacket = function (packet) {
	  if ('open' == this.readyState) {
	    // export packet event
	    debug('packet');
	    this.emit('packet', packet);

	    // Reset ping timeout on any packet, incoming data is a good sign of
	    // other side's liveness
	    this.setPingTimeout();

	    switch (packet.type) {

	      case 'ping':
	        debug('got ping');
	        this.sendPacket('pong');
	        this.emit('heartbeat');
	        break;

	      case 'error':
	        this.onClose('parse error');
	        break;

	      case 'message':
	        this.emit('data', packet.data);
	        this.emit('message', packet.data);
	        break;
	    }
	  } else {
	    debug('packet received with closed socket');
	  }
	};

	/**
	 * Called upon transport error.
	 *
	 * @param {Error} error object
	 * @api private
	 */

	Socket.prototype.onError = function (err) {
	  debug('transport error');
	  this.onClose('transport error', err);
	};

	/**
	 * Sets and resets ping timeout timer based on client pings.
	 *
	 * @api private
	 */

	Socket.prototype.setPingTimeout = function () {
	  var self = this;
	  clearTimeout(self.pingTimeoutTimer);
	  self.pingTimeoutTimer = setTimeout(function () {
	    self.onClose('ping timeout');
	  }, self.server.pingInterval + self.server.pingTimeout);
	};

	/**
	 * Attaches handlers for the given transport.
	 *
	 * @param {Transport} transport
	 * @api private
	 */

	Socket.prototype.setTransport = function (transport) {
	  var onError = this.onError.bind(this);
	  var onPacket = this.onPacket.bind(this);
	  var flush = this.flush.bind(this);
	  var onClose = this.onClose.bind(this, 'transport close');

	  this.transport = transport;
	  this.transport.once('error', onError);
	  this.transport.on('packet', onPacket);
	  this.transport.on('drain', flush);
	  this.transport.once('close', onClose);
	  //this function will manage packet events (also message callbacks)
	  this.setupSendCallback();

	  this.cleanupFn.push(function() {
	    transport.removeListener('error', onError);
	    transport.removeListener('packet', onPacket);
	    transport.removeListener('drain', flush);
	    transport.removeListener('close', onClose);
	  });
	};

	/**
	 * Upgrades socket to the given transport
	 *
	 * @param {Transport} transport
	 * @api private
	 */

	Socket.prototype.maybeUpgrade = function (transport) {
	  debug('might upgrade socket transport from "%s" to "%s"'
	    , this.transport.name, transport.name);

	  this.upgrading = true;

	  var self = this;

	  // set transport upgrade timer
	  self.upgradeTimeoutTimer = setTimeout(function () {
	    debug('client did not complete upgrade - closing transport');
	    cleanup();
	    if ('open' == transport.readyState) {
	      transport.close();
	    }
	  }, this.server.upgradeTimeout);

	  function onPacket(packet){
	    if ('ping' == packet.type && 'probe' == packet.data) {
	      transport.send([{ type: 'pong', data: 'probe' }]);
	      self.emit('upgrading', transport);
	      clearInterval(self.checkIntervalTimer);
	      self.checkIntervalTimer = setInterval(check, 100);
	    } else if ('upgrade' == packet.type && self.readyState != 'closed') {
	      debug('got upgrade packet - upgrading');
	      cleanup();
	      self.transport.discard();
	      self.upgraded = true;
	      self.clearTransport();
	      self.setTransport(transport);
	      self.emit('upgrade', transport);
	      self.setPingTimeout();
	      self.flush();
	      if (self.readyState == 'closing') {
	        transport.close(function () {
	          self.onClose('forced close');
	        });
	      }
	    } else {
	      cleanup();
	      transport.close();
	    }
	  }

	  // we force a polling cycle to ensure a fast upgrade
	  function check(){
	    if ('polling' == self.transport.name && self.transport.writable) {
	      debug('writing a noop packet to polling for fast upgrade');
	      self.transport.send([{ type: 'noop' }]);
	    }
	  }

	  function cleanup() {
	    self.upgrading = false;

	    clearInterval(self.checkIntervalTimer);
	    self.checkIntervalTimer = null;

	    clearTimeout(self.upgradeTimeoutTimer);
	    self.upgradeTimeoutTimer = null;

	    transport.removeListener('packet', onPacket);
	    transport.removeListener('close', onTransportClose);
	    transport.removeListener('error', onError);
	    self.removeListener('close', onClose);
	  }

	  function onError(err) {
	    debug('client did not complete upgrade - %s', err);
	    cleanup();
	    transport.close();
	    transport = null;
	  }

	  function onTransportClose(){
	    onError("transport closed");
	  }

	  function onClose() {
	    onError("socket closed");
	  }

	  transport.on('packet', onPacket);
	  transport.once('close', onTransportClose);
	  transport.once('error', onError);

	  self.once('close', onClose);
	};

	/**
	 * Clears listeners and timers associated with current transport.
	 *
	 * @api private
	 */

	Socket.prototype.clearTransport = function () {
	  var cleanup;
	  while (cleanup = this.cleanupFn.shift()) cleanup();

	  // silence further transport errors and prevent uncaught exceptions
	  this.transport.on('error', function(){
	    debug('error triggered by discarded transport');
	  });

	  // ensure transport won't stay open
	  this.transport.close();

	  clearTimeout(this.pingTimeoutTimer);
	};

	/**
	 * Called upon transport considered closed.
	 * Possible reasons: `ping timeout`, `client error`, `parse error`,
	 * `transport error`, `server close`, `transport close`
	 */

	Socket.prototype.onClose = function (reason, description) {
	  if ('closed' != this.readyState) {
	    this.readyState = 'closed';
	    clearTimeout(this.pingTimeoutTimer);
	    clearInterval(this.checkIntervalTimer);
	    this.checkIntervalTimer = null;
	    clearTimeout(this.upgradeTimeoutTimer);
	    var self = this;
	    // clean writeBuffer in next tick, so developers can still
	    // grab the writeBuffer on 'close' event
	    process.nextTick(function() {
	      self.writeBuffer = [];
	    });
	    this.packetsFn = [];
	    this.sentCallbackFn = [];
	    this.clearTransport();
	    this.emit('close', reason, description);
	  }
	};

	/**
	 * Setup and manage send callback
	 *
	 * @api private
	 */

	Socket.prototype.setupSendCallback = function () {
	  var self = this;
	  this.transport.on('drain', onDrain);

	  this.cleanupFn.push(function() {
	    self.transport.removeListener('drain', onDrain);
	  });

	  //the message was sent successfully, execute the callback
	  function onDrain() {
	    if (self.sentCallbackFn.length > 0) {
	      var seqFn = self.sentCallbackFn.splice(0,1)[0];
	      if ('function' == typeof seqFn) {
	        debug('executing send callback');
	        seqFn(self.transport);
	      } else if (Array.isArray(seqFn)) {
	        debug('executing batch send callback');
	        for (var l = seqFn.length, i = 0; i < l; i++) {
	          if ('function' == typeof seqFn[i]) {
	            seqFn[i](self.transport);
	          }
	        }
	      }
	    }
	  }
	};

	/**
	 * Sends a message packet.
	 *
	 * @param {String} message
	 * @param {Object} options
	 * @param {Function} callback
	 * @return {Socket} for chaining
	 * @api public
	 */

	Socket.prototype.send =
	Socket.prototype.write = function(data, options, callback){
	  this.sendPacket('message', data, options, callback);
	  return this;
	};

	/**
	 * Sends a packet.
	 *
	 * @param {String} packet type
	 * @param {String} optional, data
	 * @param {Object} options
	 * @api private
	 */

	Socket.prototype.sendPacket = function (type, data, options, callback) {
	  if ('function' == typeof options) {
	    callback = options;
	    options = null;
	  }

	  options = options || {};
	  options.compress = false !== options.compress;

	  if ('closing' != this.readyState) {
	    debug('sending packet "%s" (%s)', type, data);

	    var packet = {
	      type: type,
	      options: options
	    };
	    if (data) packet.data = data;

	    // exports packetCreate event
	    this.emit('packetCreate', packet);

	    this.writeBuffer.push(packet);

	    //add send callback to object
	    this.packetsFn.push(callback);

	    this.flush();
	  }
	};

	/**
	 * Attempts to flush the packets buffer.
	 *
	 * @api private
	 */

	Socket.prototype.flush = function () {
	  if ('closed' != this.readyState && this.transport.writable
	    && this.writeBuffer.length) {
	    debug('flushing buffer to transport');
	    this.emit('flush', this.writeBuffer);
	    this.server.emit('flush', this, this.writeBuffer);
	    var wbuf = this.writeBuffer;
	    this.writeBuffer = [];
	    if (!this.transport.supportsFraming) {
	      this.sentCallbackFn.push(this.packetsFn);
	    } else {
	      this.sentCallbackFn.push.apply(this.sentCallbackFn, this.packetsFn);
	    }
	    this.packetsFn = [];
	    this.transport.send(wbuf);
	    this.emit('drain');
	    this.server.emit('drain', this);
	  }
	};

	/**
	 * Get available upgrades for this socket.
	 *
	 * @api private
	 */

	Socket.prototype.getAvailableUpgrades = function () {
	  var availableUpgrades = [];
	  var allUpgrades = this.server.upgrades(this.transport.name);
	  for (var i = 0, l = allUpgrades.length; i < l; ++i) {
	    var upg = allUpgrades[i];
	    if (this.server.transports.indexOf(upg) != -1) {
	      availableUpgrades.push(upg);
	    }
	  }
	  return availableUpgrades;
	};

	/**
	 * Closes the socket and underlying transport.
	 *
	 * @param {Boolean} optional, discard
	 * @return {Socket} for chaining
	 * @api public
	 */

	Socket.prototype.close = function (discard) {
	  if ('open' != this.readyState) return;

	  this.readyState = 'closing';

	  if (this.writeBuffer.length) {
	    this.once('drain', this.closeTransport.bind(this, discard));
	    return;
	  }

	  this.closeTransport(discard);
	};

	/**
	 * Closes the underlying transport.
	 *
	 * @param {Boolean} discard
	 * @api private
	 */

	Socket.prototype.closeTransport = function (discard) {
	  if (discard) this.transport.discard();
	  this.transport.close(this.onClose.bind(this, 'forced close'));
	};


/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var WS = module.exports = __webpack_require__(122);

	WS.Server = __webpack_require__(138);
	WS.Sender = __webpack_require__(126);
	WS.Receiver = __webpack_require__(131);

	/**
	 * Create a new WebSocket server.
	 *
	 * @param {Object} options Server options
	 * @param {Function} fn Optional connection listener.
	 * @returns {WS.Server}
	 * @api public
	 */
	WS.createServer = function createServer(options, fn) {
	  var server = new WS.Server(options);

	  if (typeof fn === 'function') {
	    server.on('connection', fn);
	  }

	  return server;
	};

	/**
	 * Create a new WebSocket connection.
	 *
	 * @param {String} address The URL/address we need to connect to.
	 * @param {Function} fn Open listener.
	 * @returns {WS}
	 * @api public
	 */
	WS.connect = WS.createConnection = function connect(address, fn) {
	  var client = new WS(address);

	  if (typeof fn === 'function') {
	    client.on('open', fn);
	  }

	  return client;
	};


/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var url = __webpack_require__(48)
	  , util = __webpack_require__(25)
	  , http = __webpack_require__(30)
	  , https = __webpack_require__(123)
	  , crypto = __webpack_require__(71)
	  , stream = __webpack_require__(65)
	  , Ultron = __webpack_require__(124)
	  , Options = __webpack_require__(125)
	  , Sender = __webpack_require__(126)
	  , Receiver = __webpack_require__(131)
	  , SenderHixie = __webpack_require__(135)
	  , ReceiverHixie = __webpack_require__(136)
	  , Extensions = __webpack_require__(137)
	  , PerMessageDeflate = __webpack_require__(130)
	  , EventEmitter = __webpack_require__(19).EventEmitter;

	/**
	 * Constants
	 */

	// Default protocol version

	var protocolVersion = 13;

	// Close timeout

	var closeTimeout = 30 * 1000; // Allow 30 seconds to terminate the connection cleanly

	/**
	 * WebSocket implementation
	 *
	 * @constructor
	 * @param {String} address Connection address.
	 * @param {String|Array} protocols WebSocket protocols.
	 * @param {Object} options Additional connection options.
	 * @api public
	 */
	function WebSocket(address, protocols, options) {
	  if (this instanceof WebSocket === false) {
	    return new WebSocket(address, protocols, options);
	  }

	  EventEmitter.call(this);

	  if (protocols && !Array.isArray(protocols) && 'object' === typeof protocols) {
	    // accept the "options" Object as the 2nd argument
	    options = protocols;
	    protocols = null;
	  }

	  if ('string' === typeof protocols) {
	    protocols = [ protocols ];
	  }

	  if (!Array.isArray(protocols)) {
	    protocols = [];
	  }

	  this._socket = null;
	  this._ultron = null;
	  this._closeReceived = false;
	  this.bytesReceived = 0;
	  this.readyState = null;
	  this.supports = {};
	  this.extensions = {};

	  if (Array.isArray(address)) {
	    initAsServerClient.apply(this, address.concat(options));
	  } else {
	    initAsClient.apply(this, [address, protocols, options]);
	  }
	}

	/**
	 * Inherits from EventEmitter.
	 */
	util.inherits(WebSocket, EventEmitter);

	/**
	 * Ready States
	 */
	["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach(function each(state, index) {
	    WebSocket.prototype[state] = WebSocket[state] = index;
	});

	/**
	 * Gracefully closes the connection, after sending a description message to the server
	 *
	 * @param {Object} data to be sent to the server
	 * @api public
	 */
	WebSocket.prototype.close = function close(code, data) {
	  if (this.readyState === WebSocket.CLOSED) return;

	  if (this.readyState === WebSocket.CONNECTING) {
	    this.readyState = WebSocket.CLOSED;
	    return;
	  }

	  if (this.readyState === WebSocket.CLOSING) {
	    if (this._closeReceived && this._isServer) {
	      this.terminate();
	    }
	    return;
	  }

	  var self = this;
	  try {
	    this.readyState = WebSocket.CLOSING;
	    this._closeCode = code;
	    this._closeMessage = data;
	    var mask = !this._isServer;
	    this._sender.close(code, data, mask, function(err) {
	      if (err) self.emit('error', err);

	      if (self._closeReceived && self._isServer) {
	        self.terminate();
	      } else {
	        // ensure that the connection is cleaned up even when no response of closing handshake.
	        clearTimeout(self._closeTimer);
	        self._closeTimer = setTimeout(cleanupWebsocketResources.bind(self, true), closeTimeout);
	      }
	    });
	  } catch (e) {
	    this.emit('error', e);
	  }
	};

	/**
	 * Pause the client stream
	 *
	 * @api public
	 */
	WebSocket.prototype.pause = function pauser() {
	  if (this.readyState !== WebSocket.OPEN) throw new Error('not opened');

	  return this._socket.pause();
	};

	/**
	 * Sends a ping
	 *
	 * @param {Object} data to be sent to the server
	 * @param {Object} Members - mask: boolean, binary: boolean
	 * @param {boolean} dontFailWhenClosed indicates whether or not to throw if the connection isnt open
	 * @api public
	 */
	WebSocket.prototype.ping = function ping(data, options, dontFailWhenClosed) {
	  if (this.readyState !== WebSocket.OPEN) {
	    if (dontFailWhenClosed === true) return;
	    throw new Error('not opened');
	  }

	  options = options || {};

	  if (typeof options.mask === 'undefined') options.mask = !this._isServer;

	  this._sender.ping(data, options);
	};

	/**
	 * Sends a pong
	 *
	 * @param {Object} data to be sent to the server
	 * @param {Object} Members - mask: boolean, binary: boolean
	 * @param {boolean} dontFailWhenClosed indicates whether or not to throw if the connection isnt open
	 * @api public
	 */
	WebSocket.prototype.pong = function(data, options, dontFailWhenClosed) {
	  if (this.readyState !== WebSocket.OPEN) {
	    if (dontFailWhenClosed === true) return;
	    throw new Error('not opened');
	  }

	  options = options || {};

	  if (typeof options.mask === 'undefined') options.mask = !this._isServer;

	  this._sender.pong(data, options);
	};

	/**
	 * Resume the client stream
	 *
	 * @api public
	 */
	WebSocket.prototype.resume = function resume() {
	  if (this.readyState !== WebSocket.OPEN) throw new Error('not opened');

	  return this._socket.resume();
	};

	/**
	 * Sends a piece of data
	 *
	 * @param {Object} data to be sent to the server
	 * @param {Object} Members - mask: boolean, binary: boolean, compress: boolean
	 * @param {function} Optional callback which is executed after the send completes
	 * @api public
	 */

	WebSocket.prototype.send = function send(data, options, cb) {
	  if (typeof options === 'function') {
	    cb = options;
	    options = {};
	  }

	  if (this.readyState !== WebSocket.OPEN) {
	    if (typeof cb === 'function') cb(new Error('not opened'));
	    else throw new Error('not opened');
	    return;
	  }

	  if (!data) data = '';
	  if (this._queue) {
	    var self = this;
	    this._queue.push(function() { self.send(data, options, cb); });
	    return;
	  }

	  options = options || {};
	  options.fin = true;

	  if (typeof options.binary === 'undefined') {
	    options.binary = (data instanceof ArrayBuffer || data instanceof Buffer ||
	      data instanceof Uint8Array ||
	      data instanceof Uint16Array ||
	      data instanceof Uint32Array ||
	      data instanceof Int8Array ||
	      data instanceof Int16Array ||
	      data instanceof Int32Array ||
	      data instanceof Float32Array ||
	      data instanceof Float64Array);
	  }

	  if (typeof options.mask === 'undefined') options.mask = !this._isServer;
	  if (typeof options.compress === 'undefined') options.compress = true;
	  if (!this.extensions[PerMessageDeflate.extensionName]) {
	    options.compress = false;
	  }

	  var readable = typeof stream.Readable === 'function'
	    ? stream.Readable
	    : stream.Stream;

	  if (data instanceof readable) {
	    startQueue(this);
	    var self = this;

	    sendStream(this, data, options, function send(error) {
	      process.nextTick(function tock() {
	        executeQueueSends(self);
	      });

	      if (typeof cb === 'function') cb(error);
	    });
	  } else {
	    this._sender.send(data, options, cb);
	  }
	};

	/**
	 * Streams data through calls to a user supplied function
	 *
	 * @param {Object} Members - mask: boolean, binary: boolean, compress: boolean
	 * @param {function} 'function (error, send)' which is executed on successive ticks of which send is 'function (data, final)'.
	 * @api public
	 */
	WebSocket.prototype.stream = function stream(options, cb) {
	  if (typeof options === 'function') {
	    cb = options;
	    options = {};
	  }

	  var self = this;

	  if (typeof cb !== 'function') throw new Error('callback must be provided');

	  if (this.readyState !== WebSocket.OPEN) {
	    if (typeof cb === 'function') cb(new Error('not opened'));
	    else throw new Error('not opened');
	    return;
	  }

	  if (this._queue) {
	    this._queue.push(function () { self.stream(options, cb); });
	    return;
	  }

	  options = options || {};

	  if (typeof options.mask === 'undefined') options.mask = !this._isServer;
	  if (typeof options.compress === 'undefined') options.compress = true;
	  if (!this.extensions[PerMessageDeflate.extensionName]) {
	    options.compress = false;
	  }

	  startQueue(this);

	  function send(data, final) {
	    try {
	      if (self.readyState !== WebSocket.OPEN) throw new Error('not opened');
	      options.fin = final === true;
	      self._sender.send(data, options);
	      if (!final) process.nextTick(cb.bind(null, null, send));
	      else executeQueueSends(self);
	    } catch (e) {
	      if (typeof cb === 'function') cb(e);
	      else {
	        delete self._queue;
	        self.emit('error', e);
	      }
	    }
	  }

	  process.nextTick(cb.bind(null, null, send));
	};

	/**
	 * Immediately shuts down the connection
	 *
	 * @api public
	 */
	WebSocket.prototype.terminate = function terminate() {
	  if (this.readyState === WebSocket.CLOSED) return;

	  if (this._socket) {
	    this.readyState = WebSocket.CLOSING;

	    // End the connection
	    try { this._socket.end(); }
	    catch (e) {
	      // Socket error during end() call, so just destroy it right now
	      cleanupWebsocketResources.call(this, true);
	      return;
	    }

	    // Add a timeout to ensure that the connection is completely
	    // cleaned up within 30 seconds, even if the clean close procedure
	    // fails for whatever reason
	    // First cleanup any pre-existing timeout from an earlier "terminate" call,
	    // if one exists.  Otherwise terminate calls in quick succession will leak timeouts
	    // and hold the program open for `closeTimout` time.
	    if (this._closeTimer) { clearTimeout(this._closeTimer); }
	    this._closeTimer = setTimeout(cleanupWebsocketResources.bind(this, true), closeTimeout);
	  } else if (this.readyState === WebSocket.CONNECTING) {
	    cleanupWebsocketResources.call(this, true);
	  }
	};

	/**
	 * Expose bufferedAmount
	 *
	 * @api public
	 */
	Object.defineProperty(WebSocket.prototype, 'bufferedAmount', {
	  get: function get() {
	    var amount = 0;
	    if (this._socket) {
	      amount = this._socket.bufferSize || 0;
	    }
	    return amount;
	  }
	});

	/**
	 * Emulates the W3C Browser based WebSocket interface using function members.
	 *
	 * @see http://dev.w3.org/html5/websockets/#the-websocket-interface
	 * @api public
	 */
	['open', 'error', 'close', 'message'].forEach(function(method) {
	  Object.defineProperty(WebSocket.prototype, 'on' + method, {
	    /**
	     * Returns the current listener
	     *
	     * @returns {Mixed} the set function or undefined
	     * @api public
	     */
	    get: function get() {
	      var listener = this.listeners(method)[0];
	      return listener ? (listener._listener ? listener._listener : listener) : undefined;
	    },

	    /**
	     * Start listening for events
	     *
	     * @param {Function} listener the listener
	     * @returns {Mixed} the set function or undefined
	     * @api public
	     */
	    set: function set(listener) {
	      this.removeAllListeners(method);
	      this.addEventListener(method, listener);
	    }
	  });
	});

	/**
	 * Emulates the W3C Browser based WebSocket interface using addEventListener.
	 *
	 * @see https://developer.mozilla.org/en/DOM/element.addEventListener
	 * @see http://dev.w3.org/html5/websockets/#the-websocket-interface
	 * @api public
	 */
	WebSocket.prototype.addEventListener = function(method, listener) {
	  var target = this;

	  function onMessage (data, flags) {
	    listener.call(target, new MessageEvent(data, !!flags.binary, target));
	  }

	  function onClose (code, message) {
	    listener.call(target, new CloseEvent(code, message, target));
	  }

	  function onError (event) {
	    event.type = 'error';
	    event.target = target;
	    listener.call(target, event);
	  }

	  function onOpen () {
	    listener.call(target, new OpenEvent(target));
	  }

	  if (typeof listener === 'function') {
	    if (method === 'message') {
	      // store a reference so we can return the original function from the
	      // addEventListener hook
	      onMessage._listener = listener;
	      this.on(method, onMessage);
	    } else if (method === 'close') {
	      // store a reference so we can return the original function from the
	      // addEventListener hook
	      onClose._listener = listener;
	      this.on(method, onClose);
	    } else if (method === 'error') {
	      // store a reference so we can return the original function from the
	      // addEventListener hook
	      onError._listener = listener;
	      this.on(method, onError);
	    } else if (method === 'open') {
	      // store a reference so we can return the original function from the
	      // addEventListener hook
	      onOpen._listener = listener;
	      this.on(method, onOpen);
	    } else {
	      this.on(method, listener);
	    }
	  }
	};

	module.exports = WebSocket;
	module.exports.buildHostHeader = buildHostHeader

	/**
	 * W3C MessageEvent
	 *
	 * @see http://www.w3.org/TR/html5/comms.html
	 * @constructor
	 * @api private
	 */
	function MessageEvent(dataArg, isBinary, target) {
	  this.type = 'message';
	  this.data = dataArg;
	  this.target = target;
	  this.binary = isBinary; // non-standard.
	}

	/**
	 * W3C CloseEvent
	 *
	 * @see http://www.w3.org/TR/html5/comms.html
	 * @constructor
	 * @api private
	 */
	function CloseEvent(code, reason, target) {
	  this.type = 'close';
	  this.wasClean = (typeof code === 'undefined' || code === 1000);
	  this.code = code;
	  this.reason = reason;
	  this.target = target;
	}

	/**
	 * W3C OpenEvent
	 *
	 * @see http://www.w3.org/TR/html5/comms.html
	 * @constructor
	 * @api private
	 */
	function OpenEvent(target) {
	  this.type = 'open';
	  this.target = target;
	}

	// Append port number to Host header, only if specified in the url
	// and non-default
	function buildHostHeader(isSecure, hostname, port) {
	  var headerHost = hostname;
	  if (hostname) {
	    if ((isSecure && (port != 443)) || (!isSecure && (port != 80))){
	      headerHost = headerHost + ':' + port;
	    }
	  }
	  return headerHost;
	}

	/**
	 * Entirely private apis,
	 * which may or may not be bound to a sepcific WebSocket instance.
	 */
	function initAsServerClient(req, socket, upgradeHead, options) {
	  options = new Options({
	    protocolVersion: protocolVersion,
	    protocol: null,
	    extensions: {}
	  }).merge(options);

	  // expose state properties
	  this.protocol = options.value.protocol;
	  this.protocolVersion = options.value.protocolVersion;
	  this.extensions = options.value.extensions;
	  this.supports.binary = (this.protocolVersion !== 'hixie-76');
	  this.upgradeReq = req;
	  this.readyState = WebSocket.CONNECTING;
	  this._isServer = true;

	  // establish connection
	  if (options.value.protocolVersion === 'hixie-76') {
	    establishConnection.call(this, ReceiverHixie, SenderHixie, socket, upgradeHead);
	  } else {
	    establishConnection.call(this, Receiver, Sender, socket, upgradeHead);
	  }
	}

	function initAsClient(address, protocols, options) {
	  options = new Options({
	    origin: null,
	    protocolVersion: protocolVersion,
	    host: null,
	    headers: null,
	    protocol: protocols.join(','),
	    agent: null,

	    // ssl-related options
	    pfx: null,
	    key: null,
	    passphrase: null,
	    cert: null,
	    ca: null,
	    ciphers: null,
	    rejectUnauthorized: null,
	    perMessageDeflate: true,
	    localAddress: null
	  }).merge(options);

	  if (options.value.protocolVersion !== 8 && options.value.protocolVersion !== 13) {
	    throw new Error('unsupported protocol version');
	  }

	  // verify URL and establish http class
	  var serverUrl = url.parse(address);
	  var isUnixSocket = serverUrl.protocol === 'ws+unix:';
	  if (!serverUrl.host && !isUnixSocket) throw new Error('invalid url');
	  var isSecure = serverUrl.protocol === 'wss:' || serverUrl.protocol === 'https:';
	  var httpObj = isSecure ? https : http;
	  var port = serverUrl.port || (isSecure ? 443 : 80);
	  var auth = serverUrl.auth;

	  // prepare extensions
	  var extensionsOffer = {};
	  var perMessageDeflate;
	  if (options.value.perMessageDeflate) {
	    perMessageDeflate = new PerMessageDeflate(typeof options.value.perMessageDeflate !== true ? options.value.perMessageDeflate : {}, false);
	    extensionsOffer[PerMessageDeflate.extensionName] = perMessageDeflate.offer();
	  }

	  // expose state properties
	  this._isServer = false;
	  this.url = address;
	  this.protocolVersion = options.value.protocolVersion;
	  this.supports.binary = (this.protocolVersion !== 'hixie-76');

	  // begin handshake
	  var key = new Buffer(options.value.protocolVersion + '-' + Date.now()).toString('base64');
	  var shasum = crypto.createHash('sha1');
	  shasum.update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
	  var expectedServerKey = shasum.digest('base64');

	  var agent = options.value.agent;

	  var headerHost = buildHostHeader(isSecure, serverUrl.hostname, port)

	  var requestOptions = {
	    port: port,
	    host: serverUrl.hostname,
	    headers: {
	      'Connection': 'Upgrade',
	      'Upgrade': 'websocket',
	      'Host': headerHost,
	      'Sec-WebSocket-Version': options.value.protocolVersion,
	      'Sec-WebSocket-Key': key
	    }
	  };

	  // If we have basic auth.
	  if (auth) {
	    requestOptions.headers.Authorization = 'Basic ' + new Buffer(auth).toString('base64');
	  }

	  if (options.value.protocol) {
	    requestOptions.headers['Sec-WebSocket-Protocol'] = options.value.protocol;
	  }

	  if (options.value.host) {
	    requestOptions.headers.Host = options.value.host;
	  }

	  if (options.value.headers) {
	    for (var header in options.value.headers) {
	       if (options.value.headers.hasOwnProperty(header)) {
	        requestOptions.headers[header] = options.value.headers[header];
	       }
	    }
	  }

	  if (Object.keys(extensionsOffer).length) {
	    requestOptions.headers['Sec-WebSocket-Extensions'] = Extensions.format(extensionsOffer);
	  }

	  if (options.isDefinedAndNonNull('pfx')
	   || options.isDefinedAndNonNull('key')
	   || options.isDefinedAndNonNull('passphrase')
	   || options.isDefinedAndNonNull('cert')
	   || options.isDefinedAndNonNull('ca')
	   || options.isDefinedAndNonNull('ciphers')
	   || options.isDefinedAndNonNull('rejectUnauthorized')) {

	    if (options.isDefinedAndNonNull('pfx')) requestOptions.pfx = options.value.pfx;
	    if (options.isDefinedAndNonNull('key')) requestOptions.key = options.value.key;
	    if (options.isDefinedAndNonNull('passphrase')) requestOptions.passphrase = options.value.passphrase;
	    if (options.isDefinedAndNonNull('cert')) requestOptions.cert = options.value.cert;
	    if (options.isDefinedAndNonNull('ca')) requestOptions.ca = options.value.ca;
	    if (options.isDefinedAndNonNull('ciphers')) requestOptions.ciphers = options.value.ciphers;
	    if (options.isDefinedAndNonNull('rejectUnauthorized')) requestOptions.rejectUnauthorized = options.value.rejectUnauthorized;

	    if (!agent) {
	        // global agent ignores client side certificates
	        agent = new httpObj.Agent(requestOptions);
	    }
	  }

	  requestOptions.path = serverUrl.path || '/';

	  if (agent) {
	    requestOptions.agent = agent;
	  }

	  if (isUnixSocket) {
	    requestOptions.socketPath = serverUrl.pathname;
	  }

	  if (options.value.localAddress) {
	    requestOptions.localAddress = options.value.localAddress;
	  }

	  if (options.value.origin) {
	    if (options.value.protocolVersion < 13) requestOptions.headers['Sec-WebSocket-Origin'] = options.value.origin;
	    else requestOptions.headers.Origin = options.value.origin;
	  }

	  var self = this;
	  var req = httpObj.request(requestOptions);

	  req.on('error', function onerror(error) {
	    self.emit('error', error);
	    cleanupWebsocketResources.call(self, error);
	  });

	  req.once('response', function response(res) {
	    var error;

	    if (!self.emit('unexpected-response', req, res)) {
	      error = new Error('unexpected server response (' + res.statusCode + ')');
	      req.abort();
	      self.emit('error', error);
	    }

	    cleanupWebsocketResources.call(self, error);
	  });

	  req.once('upgrade', function upgrade(res, socket, upgradeHead) {
	    if (self.readyState === WebSocket.CLOSED) {
	      // client closed before server accepted connection
	      self.emit('close');
	      self.removeAllListeners();
	      socket.end();
	      return;
	    }

	    var serverKey = res.headers['sec-websocket-accept'];
	    if (typeof serverKey === 'undefined' || serverKey !== expectedServerKey) {
	      self.emit('error', 'invalid server key');
	      self.removeAllListeners();
	      socket.end();
	      return;
	    }

	    var serverProt = res.headers['sec-websocket-protocol'];
	    var protList = (options.value.protocol || "").split(/, */);
	    var protError = null;

	    if (!options.value.protocol && serverProt) {
	      protError = 'server sent a subprotocol even though none requested';
	    } else if (options.value.protocol && !serverProt) {
	      protError = 'server sent no subprotocol even though requested';
	    } else if (serverProt && protList.indexOf(serverProt) === -1) {
	      protError = 'server responded with an invalid protocol';
	    }

	    if (protError) {
	      self.emit('error', protError);
	      self.removeAllListeners();
	      socket.end();
	      return;
	    } else if (serverProt) {
	      self.protocol = serverProt;
	    }

	    var serverExtensions = Extensions.parse(res.headers['sec-websocket-extensions']);
	    if (perMessageDeflate && serverExtensions[PerMessageDeflate.extensionName]) {
	      try {
	        perMessageDeflate.accept(serverExtensions[PerMessageDeflate.extensionName]);
	      } catch (err) {
	        self.emit('error', 'invalid extension parameter');
	        self.removeAllListeners();
	        socket.end();
	        return;
	      }
	      self.extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
	    }

	    establishConnection.call(self, Receiver, Sender, socket, upgradeHead);

	    // perform cleanup on http resources
	    req.removeAllListeners();
	    req = null;
	    agent = null;
	  });

	  req.end();
	  this.readyState = WebSocket.CONNECTING;
	}

	function establishConnection(ReceiverClass, SenderClass, socket, upgradeHead) {
	  var ultron = this._ultron = new Ultron(socket)
	    , called = false
	    , self = this;

	  socket.setTimeout(0);
	  socket.setNoDelay(true);

	  this._receiver = new ReceiverClass(this.extensions);
	  this._socket = socket;

	  // socket cleanup handlers
	  ultron.on('end', cleanupWebsocketResources.bind(this));
	  ultron.on('close', cleanupWebsocketResources.bind(this));
	  ultron.on('error', cleanupWebsocketResources.bind(this));

	  // ensure that the upgradeHead is added to the receiver
	  function firstHandler(data) {
	    if (called || self.readyState === WebSocket.CLOSED) return;

	    called = true;
	    socket.removeListener('data', firstHandler);
	    ultron.on('data', realHandler);

	    if (upgradeHead && upgradeHead.length > 0) {
	      realHandler(upgradeHead);
	      upgradeHead = null;
	    }

	    if (data) realHandler(data);
	  }

	  // subsequent packets are pushed straight to the receiver
	  function realHandler(data) {
	    self.bytesReceived += data.length;
	    self._receiver.add(data);
	  }

	  ultron.on('data', firstHandler);

	  // if data was passed along with the http upgrade,
	  // this will schedule a push of that on to the receiver.
	  // this has to be done on next tick, since the caller
	  // hasn't had a chance to set event handlers on this client
	  // object yet.
	  process.nextTick(firstHandler);

	  // receiver event handlers
	  self._receiver.ontext = function ontext(data, flags) {
	    flags = flags || {};

	    self.emit('message', data, flags);
	  };

	  self._receiver.onbinary = function onbinary(data, flags) {
	    flags = flags || {};

	    flags.binary = true;
	    self.emit('message', data, flags);
	  };

	  self._receiver.onping = function onping(data, flags) {
	    flags = flags || {};

	    self.pong(data, {
	      mask: !self._isServer,
	      binary: flags.binary === true
	    }, true);

	    self.emit('ping', data, flags);
	  };

	  self._receiver.onpong = function onpong(data, flags) {
	    self.emit('pong', data, flags || {});
	  };

	  self._receiver.onclose = function onclose(code, data, flags) {
	    flags = flags || {};

	    self._closeReceived = true;
	    self.close(code, data);
	  };

	  self._receiver.onerror = function onerror(reason, errorCode) {
	    // close the connection when the receiver reports a HyBi error code
	    self.close(typeof errorCode !== 'undefined' ? errorCode : 1002, '');
	    self.emit('error', reason, errorCode);
	  };

	  // finalize the client
	  this._sender = new SenderClass(socket, this.extensions);
	  this._sender.on('error', function onerror(error) {
	    self.close(1002, '');
	    self.emit('error', error);
	  });

	  this.readyState = WebSocket.OPEN;
	  this.emit('open');
	}

	function startQueue(instance) {
	  instance._queue = instance._queue || [];
	}

	function executeQueueSends(instance) {
	  var queue = instance._queue;
	  if (typeof queue === 'undefined') return;

	  delete instance._queue;
	  for (var i = 0, l = queue.length; i < l; ++i) {
	    queue[i]();
	  }
	}

	function sendStream(instance, stream, options, cb) {
	  stream.on('data', function incoming(data) {
	    if (instance.readyState !== WebSocket.OPEN) {
	      if (typeof cb === 'function') cb(new Error('not opened'));
	      else {
	        delete instance._queue;
	        instance.emit('error', new Error('not opened'));
	      }
	      return;
	    }

	    options.fin = false;
	    instance._sender.send(data, options);
	  });

	  stream.on('end', function end() {
	    if (instance.readyState !== WebSocket.OPEN) {
	      if (typeof cb === 'function') cb(new Error('not opened'));
	      else {
	        delete instance._queue;
	        instance.emit('error', new Error('not opened'));
	      }
	      return;
	    }

	    options.fin = true;
	    instance._sender.send(null, options);

	    if (typeof cb === 'function') cb(null);
	  });
	}

	function cleanupWebsocketResources(error) {
	  if (this.readyState === WebSocket.CLOSED) return;

	  var emitClose = this.readyState !== WebSocket.CONNECTING;
	  this.readyState = WebSocket.CLOSED;

	  clearTimeout(this._closeTimer);
	  this._closeTimer = null;

	  if (emitClose) {
	    // If the connection was closed abnormally (with an error), or if
	    // the close control frame was not received then the close code
	    // must default to 1006.
	    if (error || !this._closeReceived) {
	      this._closeCode = 1006;
	    }
	    this.emit('close', this._closeCode || 1000, this._closeMessage || '');
	  }

	  if (this._socket) {
	    if (this._ultron) this._ultron.destroy();
	    this._socket.on('error', function onerror() {
	      try { this.destroy(); }
	      catch (e) {}
	    });

	    try {
	      if (!error) this._socket.end();
	      else this._socket.destroy();
	    } catch (e) { /* Ignore termination errors */ }

	    this._socket = null;
	    this._ultron = null;
	  }

	  if (this._sender) {
	    this._sender.removeAllListeners();
	    this._sender = null;
	  }

	  if (this._receiver) {
	    this._receiver.cleanup();
	    this._receiver = null;
	  }

	  if (this.extensions[PerMessageDeflate.extensionName]) {
	    this.extensions[PerMessageDeflate.extensionName].cleanup();
	  }

	  this.extensions = null;

	  this.removeAllListeners();
	  this.on('error', function onerror() {}); // catch all errors after this
	  delete this._queue;
	}


/***/ },
/* 123 */
/***/ function(module, exports) {

	module.exports = require("https");

/***/ },
/* 124 */
/***/ function(module, exports) {

	'use strict';

	var has = Object.prototype.hasOwnProperty;

	/**
	 * An auto incrementing id which we can use to create "unique" Ultron instances
	 * so we can track the event emitters that are added through the Ultron
	 * interface.
	 *
	 * @type {Number}
	 * @private
	 */
	var id = 0;

	/**
	 * Ultron is high-intelligence robot. It gathers intelligence so it can start improving
	 * upon his rudimentary design. It will learn from your EventEmitting patterns
	 * and exterminate them.
	 *
	 * @constructor
	 * @param {EventEmitter} ee EventEmitter instance we need to wrap.
	 * @api public
	 */
	function Ultron(ee) {
	  if (!(this instanceof Ultron)) return new Ultron(ee);

	  this.id = id++;
	  this.ee = ee;
	}

	/**
	 * Register a new EventListener for the given event.
	 *
	 * @param {String} event Name of the event.
	 * @param {Functon} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @returns {Ultron}
	 * @api public
	 */
	Ultron.prototype.on = function on(event, fn, context) {
	  fn.__ultron = this.id;
	  this.ee.on(event, fn, context);

	  return this;
	};
	/**
	 * Add an EventListener that's only called once.
	 *
	 * @param {String} event Name of the event.
	 * @param {Function} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @returns {Ultron}
	 * @api public
	 */
	Ultron.prototype.once = function once(event, fn, context) {
	  fn.__ultron = this.id;
	  this.ee.once(event, fn, context);

	  return this;
	};

	/**
	 * Remove the listeners we assigned for the given event.
	 *
	 * @returns {Ultron}
	 * @api public
	 */
	Ultron.prototype.remove = function remove() {
	  var args = arguments
	    , event;

	  //
	  // When no event names are provided we assume that we need to clear all the
	  // events that were assigned through us.
	  //
	  if (args.length === 1 && 'string' === typeof args[0]) {
	    args = args[0].split(/[, ]+/);
	  } else if (!args.length) {
	    args = [];

	    for (event in this.ee._events) {
	      if (has.call(this.ee._events, event)) args.push(event);
	    }
	  }

	  for (var i = 0; i < args.length; i++) {
	    var listeners = this.ee.listeners(args[i]);

	    for (var j = 0; j < listeners.length; j++) {
	      event = listeners[j];

	      //
	      // Once listeners have a `listener` property that stores the real listener
	      // in the EventEmitter that ships with Node.js.
	      //
	      if (event.listener) {
	        if (event.listener.__ultron !== this.id) continue;
	        delete event.listener.__ultron;
	      } else {
	        if (event.__ultron !== this.id) continue;
	        delete event.__ultron;
	      }

	      this.ee.removeListener(args[i], event);
	    }
	  }

	  return this;
	};

	/**
	 * Destroy the Ultron instance, remove all listeners and release all references.
	 *
	 * @returns {Boolean}
	 * @api public
	 */
	Ultron.prototype.destroy = function destroy() {
	  if (!this.ee) return false;

	  this.remove();
	  this.ee = null;

	  return true;
	};

	//
	// Expose the module.
	//
	module.exports = Ultron;


/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var fs = __webpack_require__(2);

	function Options(defaults) {
	  var internalValues = {};
	  var values = this.value = {};
	  Object.keys(defaults).forEach(function(key) {
	    internalValues[key] = defaults[key];
	    Object.defineProperty(values, key, {
	      get: function() { return internalValues[key]; },
	      configurable: false,
	      enumerable: true
	    });
	  });
	  this.reset = function() {
	    Object.keys(defaults).forEach(function(key) {
	      internalValues[key] = defaults[key];
	    });
	    return this;
	  };
	  this.merge = function(options, required) {
	    options = options || {};
	    if (Object.prototype.toString.call(required) === '[object Array]') {
	      var missing = [];
	      for (var i = 0, l = required.length; i < l; ++i) {
	        var key = required[i];
	        if (!(key in options)) {
	          missing.push(key);
	        }
	      }
	      if (missing.length > 0) {
	        if (missing.length > 1) {
	          throw new Error('options ' +
	            missing.slice(0, missing.length - 1).join(', ') + ' and ' +
	            missing[missing.length - 1] + ' must be defined');
	        }
	        else throw new Error('option ' + missing[0] + ' must be defined');
	      }
	    }
	    Object.keys(options).forEach(function(key) {
	      if (key in internalValues) {
	        internalValues[key] = options[key];
	      }
	    });
	    return this;
	  };
	  this.copy = function(keys) {
	    var obj = {};
	    Object.keys(defaults).forEach(function(key) {
	      if (keys.indexOf(key) !== -1) {
	        obj[key] = values[key];
	      }
	    });
	    return obj;
	  };
	  this.read = function(filename, cb) {
	    if (typeof cb == 'function') {
	      var self = this;
	      fs.readFile(filename, function(error, data) {
	        if (error) return cb(error);
	        var conf = JSON.parse(data);
	        self.merge(conf);
	        cb();
	      });
	    }
	    else {
	      var conf = JSON.parse(fs.readFileSync(filename));
	      this.merge(conf);
	    }
	    return this;
	  };
	  this.isDefined = function(key) {
	    return typeof values[key] != 'undefined';
	  };
	  this.isDefinedAndNonNull = function(key) {
	    return typeof values[key] != 'undefined' && values[key] !== null;
	  };
	  Object.freeze(values);
	  Object.freeze(this);
	}

	module.exports = Options;


/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var events = __webpack_require__(19)
	  , util = __webpack_require__(25)
	  , EventEmitter = events.EventEmitter
	  , ErrorCodes = __webpack_require__(127)
	  , bufferUtil = __webpack_require__(128).BufferUtil
	  , PerMessageDeflate = __webpack_require__(130);

	/**
	 * HyBi Sender implementation
	 */

	function Sender(socket, extensions) {
	  if (this instanceof Sender === false) {
	    throw new TypeError("Classes can't be function-called");
	  }

	  events.EventEmitter.call(this);

	  this._socket = socket;
	  this.extensions = extensions || {};
	  this.firstFragment = true;
	  this.compress = false;
	  this.messageHandlers = [];
	  this.processing = false;
	}

	/**
	 * Inherits from EventEmitter.
	 */

	util.inherits(Sender, events.EventEmitter);

	/**
	 * Sends a close instruction to the remote party.
	 *
	 * @api public
	 */

	Sender.prototype.close = function(code, data, mask, cb) {
	  if (typeof code !== 'undefined') {
	    if (typeof code !== 'number' ||
	      !ErrorCodes.isValidErrorCode(code)) throw new Error('first argument must be a valid error code number');
	  }
	  code = code || 1000;
	  var dataBuffer = new Buffer(2 + (data ? Buffer.byteLength(data) : 0));
	  writeUInt16BE.call(dataBuffer, code, 0);
	  if (dataBuffer.length > 2) dataBuffer.write(data, 2);

	  var self = this;
	  this.messageHandlers.push(function(callback) {
	    self.frameAndSend(0x8, dataBuffer, true, mask);
	    callback();
	    if (typeof cb == 'function') cb();
	  });
	  this.flush();
	};

	/**
	 * Sends a ping message to the remote party.
	 *
	 * @api public
	 */

	Sender.prototype.ping = function(data, options) {
	  var mask = options && options.mask;
	  var self = this;
	  this.messageHandlers.push(function(callback) {
	    self.frameAndSend(0x9, data || '', true, mask);
	    callback();
	  });
	  this.flush();
	};

	/**
	 * Sends a pong message to the remote party.
	 *
	 * @api public
	 */

	Sender.prototype.pong = function(data, options) {
	  var mask = options && options.mask;
	  var self = this;
	  this.messageHandlers.push(function(callback) {
	    self.frameAndSend(0xa, data || '', true, mask);
	    callback();
	  });
	  this.flush();
	};

	/**
	 * Sends text or binary data to the remote party.
	 *
	 * @api public
	 */

	Sender.prototype.send = function(data, options, cb) {
	  var finalFragment = options && options.fin === false ? false : true;
	  var mask = options && options.mask;
	  var compress = options && options.compress;
	  var opcode = options && options.binary ? 2 : 1;
	  if (this.firstFragment === false) {
	    opcode = 0;
	    compress = false;
	  } else {
	    this.firstFragment = false;
	    this.compress = compress;
	  }
	  if (finalFragment) this.firstFragment = true

	  var compressFragment = this.compress;

	  var self = this;
	  this.messageHandlers.push(function(callback) {
	    self.applyExtensions(data, finalFragment, compressFragment, function(err, data) {
	      if (err) {
	        if (typeof cb == 'function') cb(err);
	        else self.emit('error', err);
	        return;
	      }
	      self.frameAndSend(opcode, data, finalFragment, mask, compress, cb);
	      callback();
	    });
	  });
	  this.flush();
	};

	/**
	 * Frames and sends a piece of data according to the HyBi WebSocket protocol.
	 *
	 * @api private
	 */

	Sender.prototype.frameAndSend = function(opcode, data, finalFragment, maskData, compressed, cb) {
	  var canModifyData = false;

	  if (!data) {
	    try {
	      this._socket.write(new Buffer([opcode | (finalFragment ? 0x80 : 0), 0 | (maskData ? 0x80 : 0)].concat(maskData ? [0, 0, 0, 0] : [])), 'binary', cb);
	    }
	    catch (e) {
	      if (typeof cb == 'function') cb(e);
	      else this.emit('error', e);
	    }
	    return;
	  }

	  if (!Buffer.isBuffer(data)) {
	    canModifyData = true;
	    if (data && (typeof data.byteLength !== 'undefined' || typeof data.buffer !== 'undefined')) {
	      data = getArrayBuffer(data);
	    } else {
	      //
	      // If people want to send a number, this would allocate the number in
	      // bytes as memory size instead of storing the number as buffer value. So
	      // we need to transform it to string in order to prevent possible
	      // vulnerabilities / memory attacks.
	      //
	      if (typeof data === 'number') data = data.toString();

	      data = new Buffer(data);
	    }
	  }

	  var dataLength = data.length
	    , dataOffset = maskData ? 6 : 2
	    , secondByte = dataLength;

	  if (dataLength >= 65536) {
	    dataOffset += 8;
	    secondByte = 127;
	  }
	  else if (dataLength > 125) {
	    dataOffset += 2;
	    secondByte = 126;
	  }

	  var mergeBuffers = dataLength < 32768 || (maskData && !canModifyData);
	  var totalLength = mergeBuffers ? dataLength + dataOffset : dataOffset;
	  var outputBuffer = new Buffer(totalLength);
	  outputBuffer[0] = finalFragment ? opcode | 0x80 : opcode;
	  if (compressed) outputBuffer[0] |= 0x40;

	  switch (secondByte) {
	    case 126:
	      writeUInt16BE.call(outputBuffer, dataLength, 2);
	      break;
	    case 127:
	      writeUInt32BE.call(outputBuffer, 0, 2);
	      writeUInt32BE.call(outputBuffer, dataLength, 6);
	  }

	  if (maskData) {
	    outputBuffer[1] = secondByte | 0x80;
	    var mask = this._randomMask || (this._randomMask = getRandomMask());
	    outputBuffer[dataOffset - 4] = mask[0];
	    outputBuffer[dataOffset - 3] = mask[1];
	    outputBuffer[dataOffset - 2] = mask[2];
	    outputBuffer[dataOffset - 1] = mask[3];
	    if (mergeBuffers) {
	      bufferUtil.mask(data, mask, outputBuffer, dataOffset, dataLength);
	      try {
	        this._socket.write(outputBuffer, 'binary', cb);
	      }
	      catch (e) {
	        if (typeof cb == 'function') cb(e);
	        else this.emit('error', e);
	      }
	    }
	    else {
	      bufferUtil.mask(data, mask, data, 0, dataLength);
	      try {
	        this._socket.write(outputBuffer, 'binary');
	        this._socket.write(data, 'binary', cb);
	      }
	      catch (e) {
	        if (typeof cb == 'function') cb(e);
	        else this.emit('error', e);
	      }
	    }
	  }
	  else {
	    outputBuffer[1] = secondByte;
	    if (mergeBuffers) {
	      data.copy(outputBuffer, dataOffset);
	      try {
	        this._socket.write(outputBuffer, 'binary', cb);
	      }
	      catch (e) {
	        if (typeof cb == 'function') cb(e);
	        else this.emit('error', e);
	      }
	    }
	    else {
	      try {
	        this._socket.write(outputBuffer, 'binary');
	        this._socket.write(data, 'binary', cb);
	      }
	      catch (e) {
	        if (typeof cb == 'function') cb(e);
	        else this.emit('error', e);
	      }
	    }
	  }
	};

	/**
	 * Execute message handler buffers
	 *
	 * @api private
	 */

	Sender.prototype.flush = function() {
	  if (this.processing) return;

	  var handler = this.messageHandlers.shift();
	  if (!handler) return;

	  this.processing = true;

	  var self = this;

	  handler(function() {
	    self.processing = false;
	    self.flush();
	  });
	};

	/**
	 * Apply extensions to message
	 *
	 * @api private
	 */

	Sender.prototype.applyExtensions = function(data, fin, compress, callback) {
	  if (compress && data) {
	    if ((data.buffer || data) instanceof ArrayBuffer) {
	      data = getArrayBuffer(data);
	    }
	    this.extensions[PerMessageDeflate.extensionName].compress(data, fin, callback);
	  } else {
	    callback(null, data);
	  }
	};

	module.exports = Sender;

	function writeUInt16BE(value, offset) {
	  this[offset] = (value & 0xff00)>>8;
	  this[offset+1] = value & 0xff;
	}

	function writeUInt32BE(value, offset) {
	  this[offset] = (value & 0xff000000)>>24;
	  this[offset+1] = (value & 0xff0000)>>16;
	  this[offset+2] = (value & 0xff00)>>8;
	  this[offset+3] = value & 0xff;
	}

	function getArrayBuffer(data) {
	  // data is either an ArrayBuffer or ArrayBufferView.
	  var array = new Uint8Array(data.buffer || data)
	    , l = data.byteLength || data.length
	    , o = data.byteOffset || 0
	    , buffer = new Buffer(l);
	  for (var i = 0; i < l; ++i) {
	    buffer[i] = array[o+i];
	  }
	  return buffer;
	}

	function getRandomMask() {
	  return new Buffer([
	    ~~(Math.random() * 255),
	    ~~(Math.random() * 255),
	    ~~(Math.random() * 255),
	    ~~(Math.random() * 255)
	  ]);
	}


/***/ },
/* 127 */
/***/ function(module, exports) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	module.exports = {
	  isValidErrorCode: function(code) {
	    return (code >= 1000 && code <= 1011 && code != 1004 && code != 1005 && code != 1006) ||
	         (code >= 3000 && code <= 4999);
	  },
	  1000: 'normal',
	  1001: 'going away',
	  1002: 'protocol error',
	  1003: 'unsupported data',
	  1004: 'reserved',
	  1005: 'reserved for extensions',
	  1006: 'reserved for extensions',
	  1007: 'inconsistent or invalid data',
	  1008: 'policy violation',
	  1009: 'message too big',
	  1010: 'extension handshake missing',
	  1011: 'an unexpected condition prevented the request from being fulfilled',
	};

/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	try {
	  module.exports = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"bufferutil\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	} catch (e) {
	  module.exports = __webpack_require__(129);
	}


/***/ },
/* 129 */
/***/ function(module, exports) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	module.exports.BufferUtil = {
	  merge: function(mergedBuffer, buffers) {
	    var offset = 0;
	    for (var i = 0, l = buffers.length; i < l; ++i) {
	      var buf = buffers[i];
	      buf.copy(mergedBuffer, offset);
	      offset += buf.length;
	    }
	  },
	  mask: function(source, mask, output, offset, length) {
	    var maskNum = mask.readUInt32LE(0, true);
	    var i = 0;
	    for (; i < length - 3; i += 4) {
	      var num = maskNum ^ source.readUInt32LE(i, true);
	      if (num < 0) num = 4294967296 + num;
	      output.writeUInt32LE(num, offset + i, true);
	    }
	    switch (length % 4) {
	      case 3: output[offset + i + 2] = source[i + 2] ^ mask[2];
	      case 2: output[offset + i + 1] = source[i + 1] ^ mask[1];
	      case 1: output[offset + i] = source[i] ^ mask[0];
	      case 0:;
	    }
	  },
	  unmask: function(data, mask) {
	    var maskNum = mask.readUInt32LE(0, true);
	    var length = data.length;
	    var i = 0;
	    for (; i < length - 3; i += 4) {
	      var num = maskNum ^ data.readUInt32LE(i, true);
	      if (num < 0) num = 4294967296 + num;
	      data.writeUInt32LE(num, i, true);
	    }
	    switch (length % 4) {
	      case 3: data[i + 2] = data[i + 2] ^ mask[2];
	      case 2: data[i + 1] = data[i + 1] ^ mask[1];
	      case 1: data[i] = data[i] ^ mask[0];
	      case 0:;
	    }
	  }
	}


/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	
	var zlib = __webpack_require__(107);

	var AVAILABLE_WINDOW_BITS = [8, 9, 10, 11, 12, 13, 14, 15];
	var DEFAULT_WINDOW_BITS = 15;
	var DEFAULT_MEM_LEVEL = 8;

	PerMessageDeflate.extensionName = 'permessage-deflate';

	/**
	 * Per-message Compression Extensions implementation
	 */

	function PerMessageDeflate(options, isServer) {
	  if (this instanceof PerMessageDeflate === false) {
	    throw new TypeError("Classes can't be function-called");
	  }

	  this._options = options || {};
	  this._isServer = !!isServer;
	  this._inflate = null;
	  this._deflate = null;
	  this.params = null;
	}

	/**
	 * Create extension parameters offer
	 *
	 * @api public
	 */

	PerMessageDeflate.prototype.offer = function() {
	  var params = {};
	  if (this._options.serverNoContextTakeover) {
	    params.server_no_context_takeover = true;
	  }
	  if (this._options.clientNoContextTakeover) {
	    params.client_no_context_takeover = true;
	  }
	  if (this._options.serverMaxWindowBits) {
	    params.server_max_window_bits = this._options.serverMaxWindowBits;
	  }
	  if (this._options.clientMaxWindowBits) {
	    params.client_max_window_bits = this._options.clientMaxWindowBits;
	  } else if (this._options.clientMaxWindowBits == null) {
	    params.client_max_window_bits = true;
	  }
	  return params;
	};

	/**
	 * Accept extension offer
	 *
	 * @api public
	 */

	PerMessageDeflate.prototype.accept = function(paramsList) {
	  paramsList = this.normalizeParams(paramsList);

	  var params;
	  if (this._isServer) {
	    params = this.acceptAsServer(paramsList);
	  } else {
	    params = this.acceptAsClient(paramsList);
	  }

	  this.params = params;
	  return params;
	};

	/**
	 * Releases all resources used by the extension
	 *
	 * @api public
	 */

	PerMessageDeflate.prototype.cleanup = function() {
	  if (this._inflate) {
	    if (this._inflate.writeInProgress) {
	      this._inflate.pendingClose = true;
	    } else {
	      if (this._inflate.close) this._inflate.close();
	      this._inflate = null;
	    }
	  }
	  if (this._deflate) {
	    if (this._deflate.writeInProgress) {
	      this._deflate.pendingClose = true;
	    } else {
	      if (this._deflate.close) this._deflate.close();
	      this._deflate = null;
	    }
	  }
	};

	/**
	 * Accept extension offer from client
	 *
	 * @api private
	 */

	PerMessageDeflate.prototype.acceptAsServer = function(paramsList) {
	  var accepted = {};
	  var result = paramsList.some(function(params) {
	    accepted = {};
	    if (this._options.serverNoContextTakeover === false && params.server_no_context_takeover) {
	      return;
	    }
	    if (this._options.serverMaxWindowBits === false && params.server_max_window_bits) {
	      return;
	    }
	    if (typeof this._options.serverMaxWindowBits === 'number' &&
	        typeof params.server_max_window_bits === 'number' &&
	        this._options.serverMaxWindowBits > params.server_max_window_bits) {
	      return;
	    }
	    if (typeof this._options.clientMaxWindowBits === 'number' && !params.client_max_window_bits) {
	      return;
	    }

	    if (this._options.serverNoContextTakeover || params.server_no_context_takeover) {
	      accepted.server_no_context_takeover = true;
	    }
	    if (this._options.clientNoContextTakeover) {
	      accepted.client_no_context_takeover = true;
	    }
	    if (this._options.clientNoContextTakeover !== false && params.client_no_context_takeover) {
	      accepted.client_no_context_takeover = true;
	    }
	    if (typeof this._options.serverMaxWindowBits === 'number') {
	      accepted.server_max_window_bits = this._options.serverMaxWindowBits;
	    } else if (typeof params.server_max_window_bits === 'number') {
	      accepted.server_max_window_bits = params.server_max_window_bits;
	    }
	    if (typeof this._options.clientMaxWindowBits === 'number') {
	      accepted.client_max_window_bits = this._options.clientMaxWindowBits;
	    } else if (this._options.clientMaxWindowBits !== false && typeof params.client_max_window_bits === 'number') {
	      accepted.client_max_window_bits = params.client_max_window_bits;
	    }
	    return true;
	  }, this);

	  if (!result) {
	    throw new Error('Doesn\'t support the offered configuration');
	  }

	  return accepted;
	};

	/**
	 * Accept extension response from server
	 *
	 * @api privaye
	 */

	PerMessageDeflate.prototype.acceptAsClient = function(paramsList) {
	  var params = paramsList[0];
	  if (this._options.clientNoContextTakeover != null) {
	    if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
	      throw new Error('Invalid value for "client_no_context_takeover"');
	    }
	  }
	  if (this._options.clientMaxWindowBits != null) {
	    if (this._options.clientMaxWindowBits === false && params.client_max_window_bits) {
	      throw new Error('Invalid value for "client_max_window_bits"');
	    }
	    if (typeof this._options.clientMaxWindowBits === 'number' &&
	        (!params.client_max_window_bits || params.client_max_window_bits > this._options.clientMaxWindowBits)) {
	      throw new Error('Invalid value for "client_max_window_bits"');
	    }
	  }
	  return params;
	};

	/**
	 * Normalize extensions parameters
	 *
	 * @api private
	 */

	PerMessageDeflate.prototype.normalizeParams = function(paramsList) {
	  return paramsList.map(function(params) {
	    Object.keys(params).forEach(function(key) {
	      var value = params[key];
	      if (value.length > 1) {
	        throw new Error('Multiple extension parameters for ' + key);
	      }

	      value = value[0];

	      switch (key) {
	      case 'server_no_context_takeover':
	      case 'client_no_context_takeover':
	        if (value !== true) {
	          throw new Error('invalid extension parameter value for ' + key + ' (' + value + ')');
	        }
	        params[key] = true;
	        break;
	      case 'server_max_window_bits':
	      case 'client_max_window_bits':
	        if (typeof value === 'string') {
	          value = parseInt(value, 10);
	          if (!~AVAILABLE_WINDOW_BITS.indexOf(value)) {
	            throw new Error('invalid extension parameter value for ' + key + ' (' + value + ')');
	          }
	        }
	        if (!this._isServer && value === true) {
	          throw new Error('Missing extension parameter value for ' + key);
	        }
	        params[key] = value;
	        break;
	      default:
	        throw new Error('Not defined extension parameter (' + key + ')');
	      }
	    }, this);
	    return params;
	  }, this);
	};

	/**
	 * Decompress message
	 *
	 * @api public
	 */

	PerMessageDeflate.prototype.decompress = function (data, fin, callback) {
	  var endpoint = this._isServer ? 'client' : 'server';

	  if (!this._inflate) {
	    var maxWindowBits = this.params[endpoint + '_max_window_bits'];
	    this._inflate = zlib.createInflateRaw({
	      windowBits: 'number' === typeof maxWindowBits ? maxWindowBits : DEFAULT_WINDOW_BITS
	    });
	  }
	  this._inflate.writeInProgress = true;

	  var self = this;
	  var buffers = [];

	  this._inflate.on('error', onError).on('data', onData);
	  this._inflate.write(data);
	  if (fin) {
	    this._inflate.write(new Buffer([0x00, 0x00, 0xff, 0xff]));
	  }
	  this._inflate.flush(function() {
	    cleanup();
	    callback(null, Buffer.concat(buffers));
	  });

	  function onError(err) {
	    cleanup();
	    callback(err);
	  }

	  function onData(data) {
	    buffers.push(data);
	  }

	  function cleanup() {
	    if (!self._inflate) return;
	    self._inflate.removeListener('error', onError);
	    self._inflate.removeListener('data', onData);
	    self._inflate.writeInProgress = false;
	    if ((fin && self.params[endpoint + '_no_context_takeover']) || self._inflate.pendingClose) {
	      if (self._inflate.close) self._inflate.close();
	      self._inflate = null;
	    }
	  }
	};

	/**
	 * Compress message
	 *
	 * @api public
	 */

	PerMessageDeflate.prototype.compress = function (data, fin, callback) {
	  var endpoint = this._isServer ? 'server' : 'client';

	  if (!this._deflate) {
	    var maxWindowBits = this.params[endpoint + '_max_window_bits'];
	    this._deflate = zlib.createDeflateRaw({
	      flush: zlib.Z_SYNC_FLUSH,
	      windowBits: 'number' === typeof maxWindowBits ? maxWindowBits : DEFAULT_WINDOW_BITS,
	      memLevel: this._options.memLevel || DEFAULT_MEM_LEVEL
	    });
	  }
	  this._deflate.writeInProgress = true;

	  var self = this;
	  var buffers = [];

	  this._deflate.on('error', onError).on('data', onData);
	  this._deflate.write(data);
	  this._deflate.flush(function() {
	    cleanup();
	    var data = Buffer.concat(buffers);
	    if (fin) {
	      data = data.slice(0, data.length - 4);
	    }
	    callback(null, data);
	  });

	  function onError(err) {
	    cleanup();
	    callback(err);
	  }

	  function onData(data) {
	    buffers.push(data);
	  }

	  function cleanup() {
	    if (!self._deflate) return;
	    self._deflate.removeListener('error', onError);
	    self._deflate.removeListener('data', onData);
	    self._deflate.writeInProgress = false;
	    if ((fin && self.params[endpoint + '_no_context_takeover']) || self._deflate.pendingClose) {
	      if (self._deflate.close) self._deflate.close();
	      self._deflate = null;
	    }
	  }
	};

	module.exports = PerMessageDeflate;


/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var util = __webpack_require__(25)
	  , Validation = __webpack_require__(132).Validation
	  , ErrorCodes = __webpack_require__(127)
	  , BufferPool = __webpack_require__(134)
	  , bufferUtil = __webpack_require__(128).BufferUtil
	  , PerMessageDeflate = __webpack_require__(130);

	/**
	 * HyBi Receiver implementation
	 */

	function Receiver (extensions) {
	  if (this instanceof Receiver === false) {
	    throw new TypeError("Classes can't be function-called");
	  }

	  // memory pool for fragmented messages
	  var fragmentedPoolPrevUsed = -1;
	  this.fragmentedBufferPool = new BufferPool(1024, function(db, length) {
	    return db.used + length;
	  }, function(db) {
	    return fragmentedPoolPrevUsed = fragmentedPoolPrevUsed >= 0 ?
	      Math.ceil((fragmentedPoolPrevUsed + db.used) / 2) :
	      db.used;
	  });

	  // memory pool for unfragmented messages
	  var unfragmentedPoolPrevUsed = -1;
	  this.unfragmentedBufferPool = new BufferPool(1024, function(db, length) {
	    return db.used + length;
	  }, function(db) {
	    return unfragmentedPoolPrevUsed = unfragmentedPoolPrevUsed >= 0 ?
	      Math.ceil((unfragmentedPoolPrevUsed + db.used) / 2) :
	      db.used;
	  });

	  this.extensions = extensions || {};
	  this.state = {
	    activeFragmentedOperation: null,
	    lastFragment: false,
	    masked: false,
	    opcode: 0,
	    fragmentedOperation: false
	  };
	  this.overflow = [];
	  this.headerBuffer = new Buffer(10);
	  this.expectOffset = 0;
	  this.expectBuffer = null;
	  this.expectHandler = null;
	  this.currentMessage = [];
	  this.messageHandlers = [];
	  this.expectHeader(2, this.processPacket);
	  this.dead = false;
	  this.processing = false;

	  this.onerror = function() {};
	  this.ontext = function() {};
	  this.onbinary = function() {};
	  this.onclose = function() {};
	  this.onping = function() {};
	  this.onpong = function() {};
	}

	module.exports = Receiver;

	/**
	 * Add new data to the parser.
	 *
	 * @api public
	 */

	Receiver.prototype.add = function(data) {
	  var dataLength = data.length;
	  if (dataLength == 0) return;
	  if (this.expectBuffer == null) {
	    this.overflow.push(data);
	    return;
	  }
	  var toRead = Math.min(dataLength, this.expectBuffer.length - this.expectOffset);
	  fastCopy(toRead, data, this.expectBuffer, this.expectOffset);
	  this.expectOffset += toRead;
	  if (toRead < dataLength) {
	    this.overflow.push(data.slice(toRead));
	  }
	  while (this.expectBuffer && this.expectOffset == this.expectBuffer.length) {
	    var bufferForHandler = this.expectBuffer;
	    this.expectBuffer = null;
	    this.expectOffset = 0;
	    this.expectHandler.call(this, bufferForHandler);
	  }
	};

	/**
	 * Releases all resources used by the receiver.
	 *
	 * @api public
	 */

	Receiver.prototype.cleanup = function() {
	  this.dead = true;
	  this.overflow = null;
	  this.headerBuffer = null;
	  this.expectBuffer = null;
	  this.expectHandler = null;
	  this.unfragmentedBufferPool = null;
	  this.fragmentedBufferPool = null;
	  this.state = null;
	  this.currentMessage = null;
	  this.onerror = null;
	  this.ontext = null;
	  this.onbinary = null;
	  this.onclose = null;
	  this.onping = null;
	  this.onpong = null;
	};

	/**
	 * Waits for a certain amount of header bytes to be available, then fires a callback.
	 *
	 * @api private
	 */

	Receiver.prototype.expectHeader = function(length, handler) {
	  if (length == 0) {
	    handler(null);
	    return;
	  }
	  this.expectBuffer = this.headerBuffer.slice(this.expectOffset, this.expectOffset + length);
	  this.expectHandler = handler;
	  var toRead = length;
	  while (toRead > 0 && this.overflow.length > 0) {
	    var fromOverflow = this.overflow.pop();
	    if (toRead < fromOverflow.length) this.overflow.push(fromOverflow.slice(toRead));
	    var read = Math.min(fromOverflow.length, toRead);
	    fastCopy(read, fromOverflow, this.expectBuffer, this.expectOffset);
	    this.expectOffset += read;
	    toRead -= read;
	  }
	};

	/**
	 * Waits for a certain amount of data bytes to be available, then fires a callback.
	 *
	 * @api private
	 */

	Receiver.prototype.expectData = function(length, handler) {
	  if (length == 0) {
	    handler(null);
	    return;
	  }
	  this.expectBuffer = this.allocateFromPool(length, this.state.fragmentedOperation);
	  this.expectHandler = handler;
	  var toRead = length;
	  while (toRead > 0 && this.overflow.length > 0) {
	    var fromOverflow = this.overflow.pop();
	    if (toRead < fromOverflow.length) this.overflow.push(fromOverflow.slice(toRead));
	    var read = Math.min(fromOverflow.length, toRead);
	    fastCopy(read, fromOverflow, this.expectBuffer, this.expectOffset);
	    this.expectOffset += read;
	    toRead -= read;
	  }
	};

	/**
	 * Allocates memory from the buffer pool.
	 *
	 * @api private
	 */

	Receiver.prototype.allocateFromPool = function(length, isFragmented) {
	  return (isFragmented ? this.fragmentedBufferPool : this.unfragmentedBufferPool).get(length);
	};

	/**
	 * Start processing a new packet.
	 *
	 * @api private
	 */

	Receiver.prototype.processPacket = function (data) {
	  if (this.extensions[PerMessageDeflate.extensionName]) {
	    if ((data[0] & 0x30) != 0) {
	      this.error('reserved fields (2, 3) must be empty', 1002);
	      return;
	    }
	  } else {
	    if ((data[0] & 0x70) != 0) {
	      this.error('reserved fields must be empty', 1002);
	      return;
	    }
	  }
	  this.state.lastFragment = (data[0] & 0x80) == 0x80;
	  this.state.masked = (data[1] & 0x80) == 0x80;
	  var compressed = (data[0] & 0x40) == 0x40;
	  var opcode = data[0] & 0xf;
	  if (opcode === 0) {
	    if (compressed) {
	      this.error('continuation frame cannot have the Per-message Compressed bits', 1002);
	      return;
	    }
	    // continuation frame
	    this.state.fragmentedOperation = true;
	    this.state.opcode = this.state.activeFragmentedOperation;
	    if (!(this.state.opcode == 1 || this.state.opcode == 2)) {
	      this.error('continuation frame cannot follow current opcode', 1002);
	      return;
	    }
	  }
	  else {
	    if (opcode < 3 && this.state.activeFragmentedOperation != null) {
	      this.error('data frames after the initial data frame must have opcode 0', 1002);
	      return;
	    }
	    if (opcode >= 8 && compressed) {
	      this.error('control frames cannot have the Per-message Compressed bits', 1002);
	      return;
	    }
	    this.state.compressed = compressed;
	    this.state.opcode = opcode;
	    if (this.state.lastFragment === false) {
	      this.state.fragmentedOperation = true;
	      this.state.activeFragmentedOperation = opcode;
	    }
	    else this.state.fragmentedOperation = false;
	  }
	  var handler = opcodes[this.state.opcode];
	  if (typeof handler == 'undefined') this.error('no handler for opcode ' + this.state.opcode, 1002);
	  else {
	    handler.start.call(this, data);
	  }
	};

	/**
	 * Endprocessing a packet.
	 *
	 * @api private
	 */

	Receiver.prototype.endPacket = function() {
	  if (!this.state.fragmentedOperation) this.unfragmentedBufferPool.reset(true);
	  else if (this.state.lastFragment) this.fragmentedBufferPool.reset(true);
	  this.expectOffset = 0;
	  this.expectBuffer = null;
	  this.expectHandler = null;
	  if (this.state.lastFragment && this.state.opcode === this.state.activeFragmentedOperation) {
	    // end current fragmented operation
	    this.state.activeFragmentedOperation = null;
	  }
	  this.state.lastFragment = false;
	  this.state.opcode = this.state.activeFragmentedOperation != null ? this.state.activeFragmentedOperation : 0;
	  this.state.masked = false;
	  this.expectHeader(2, this.processPacket);
	};

	/**
	 * Reset the parser state.
	 *
	 * @api private
	 */

	Receiver.prototype.reset = function() {
	  if (this.dead) return;
	  this.state = {
	    activeFragmentedOperation: null,
	    lastFragment: false,
	    masked: false,
	    opcode: 0,
	    fragmentedOperation: false
	  };
	  this.fragmentedBufferPool.reset(true);
	  this.unfragmentedBufferPool.reset(true);
	  this.expectOffset = 0;
	  this.expectBuffer = null;
	  this.expectHandler = null;
	  this.overflow = [];
	  this.currentMessage = [];
	  this.messageHandlers = [];
	};

	/**
	 * Unmask received data.
	 *
	 * @api private
	 */

	Receiver.prototype.unmask = function (mask, buf, binary) {
	  if (mask != null && buf != null) bufferUtil.unmask(buf, mask);
	  if (binary) return buf;
	  return buf != null ? buf.toString('utf8') : '';
	};

	/**
	 * Concatenates a list of buffers.
	 *
	 * @api private
	 */

	Receiver.prototype.concatBuffers = function(buffers) {
	  var length = 0;
	  for (var i = 0, l = buffers.length; i < l; ++i) length += buffers[i].length;
	  var mergedBuffer = new Buffer(length);
	  bufferUtil.merge(mergedBuffer, buffers);
	  return mergedBuffer;
	};

	/**
	 * Handles an error
	 *
	 * @api private
	 */

	Receiver.prototype.error = function (reason, protocolErrorCode) {
	  this.reset();
	  this.onerror(reason, protocolErrorCode);
	  return this;
	};

	/**
	 * Execute message handler buffers
	 *
	 * @api private
	 */

	Receiver.prototype.flush = function() {
	  if (this.processing || this.dead) return;

	  var handler = this.messageHandlers.shift();
	  if (!handler) return;

	  this.processing = true;
	  var self = this;

	  handler(function() {
	    self.processing = false;
	    self.flush();
	  });
	};

	/**
	 * Apply extensions to message
	 *
	 * @api private
	 */

	Receiver.prototype.applyExtensions = function(messageBuffer, fin, compressed, callback) {
	  var self = this;
	  if (compressed) {
	    this.extensions[PerMessageDeflate.extensionName].decompress(messageBuffer, fin, function(err, buffer) {
	      if (self.dead) return;
	      if (err) {
	        callback(new Error('invalid compressed data'));
	        return;
	      }
	      callback(null, buffer);
	    });
	  } else {
	    callback(null, messageBuffer);
	  }
	};

	/**
	 * Buffer utilities
	 */

	function readUInt16BE(start) {
	  return (this[start]<<8) +
	         this[start+1];
	}

	function readUInt32BE(start) {
	  return (this[start]<<24) +
	         (this[start+1]<<16) +
	         (this[start+2]<<8) +
	         this[start+3];
	}

	function fastCopy(length, srcBuffer, dstBuffer, dstOffset) {
	  switch (length) {
	    default: srcBuffer.copy(dstBuffer, dstOffset, 0, length); break;
	    case 16: dstBuffer[dstOffset+15] = srcBuffer[15];
	    case 15: dstBuffer[dstOffset+14] = srcBuffer[14];
	    case 14: dstBuffer[dstOffset+13] = srcBuffer[13];
	    case 13: dstBuffer[dstOffset+12] = srcBuffer[12];
	    case 12: dstBuffer[dstOffset+11] = srcBuffer[11];
	    case 11: dstBuffer[dstOffset+10] = srcBuffer[10];
	    case 10: dstBuffer[dstOffset+9] = srcBuffer[9];
	    case 9: dstBuffer[dstOffset+8] = srcBuffer[8];
	    case 8: dstBuffer[dstOffset+7] = srcBuffer[7];
	    case 7: dstBuffer[dstOffset+6] = srcBuffer[6];
	    case 6: dstBuffer[dstOffset+5] = srcBuffer[5];
	    case 5: dstBuffer[dstOffset+4] = srcBuffer[4];
	    case 4: dstBuffer[dstOffset+3] = srcBuffer[3];
	    case 3: dstBuffer[dstOffset+2] = srcBuffer[2];
	    case 2: dstBuffer[dstOffset+1] = srcBuffer[1];
	    case 1: dstBuffer[dstOffset] = srcBuffer[0];
	  }
	}

	function clone(obj) {
	  var cloned = {};
	  for (var k in obj) {
	    if (obj.hasOwnProperty(k)) {
	      cloned[k] = obj[k];
	    }
	  }
	  return cloned;
	}

	/**
	 * Opcode handlers
	 */

	var opcodes = {
	  // text
	  '1': {
	    start: function(data) {
	      var self = this;
	      // decode length
	      var firstLength = data[1] & 0x7f;
	      if (firstLength < 126) {
	        opcodes['1'].getData.call(self, firstLength);
	      }
	      else if (firstLength == 126) {
	        self.expectHeader(2, function(data) {
	          opcodes['1'].getData.call(self, readUInt16BE.call(data, 0));
	        });
	      }
	      else if (firstLength == 127) {
	        self.expectHeader(8, function(data) {
	          if (readUInt32BE.call(data, 0) != 0) {
	            self.error('packets with length spanning more than 32 bit is currently not supported', 1008);
	            return;
	          }
	          opcodes['1'].getData.call(self, readUInt32BE.call(data, 4));
	        });
	      }
	    },
	    getData: function(length) {
	      var self = this;
	      if (self.state.masked) {
	        self.expectHeader(4, function(data) {
	          var mask = data;
	          self.expectData(length, function(data) {
	            opcodes['1'].finish.call(self, mask, data);
	          });
	        });
	      }
	      else {
	        self.expectData(length, function(data) {
	          opcodes['1'].finish.call(self, null, data);
	        });
	      }
	    },
	    finish: function(mask, data) {
	      var self = this;
	      var packet = this.unmask(mask, data, true) || new Buffer(0);
	      var state = clone(this.state);
	      this.messageHandlers.push(function(callback) {
	        self.applyExtensions(packet, state.lastFragment, state.compressed, function(err, buffer) {
	          if (err) return self.error(err.message, 1007);
	          if (buffer != null) self.currentMessage.push(buffer);

	          if (state.lastFragment) {
	            var messageBuffer = self.concatBuffers(self.currentMessage);
	            self.currentMessage = [];
	            if (!Validation.isValidUTF8(messageBuffer)) {
	              self.error('invalid utf8 sequence', 1007);
	              return;
	            }
	            self.ontext(messageBuffer.toString('utf8'), {masked: state.masked, buffer: messageBuffer});
	          }
	          callback();
	        });
	      });
	      this.flush();
	      this.endPacket();
	    }
	  },
	  // binary
	  '2': {
	    start: function(data) {
	      var self = this;
	      // decode length
	      var firstLength = data[1] & 0x7f;
	      if (firstLength < 126) {
	        opcodes['2'].getData.call(self, firstLength);
	      }
	      else if (firstLength == 126) {
	        self.expectHeader(2, function(data) {
	          opcodes['2'].getData.call(self, readUInt16BE.call(data, 0));
	        });
	      }
	      else if (firstLength == 127) {
	        self.expectHeader(8, function(data) {
	          if (readUInt32BE.call(data, 0) != 0) {
	            self.error('packets with length spanning more than 32 bit is currently not supported', 1008);
	            return;
	          }
	          opcodes['2'].getData.call(self, readUInt32BE.call(data, 4, true));
	        });
	      }
	    },
	    getData: function(length) {
	      var self = this;
	      if (self.state.masked) {
	        self.expectHeader(4, function(data) {
	          var mask = data;
	          self.expectData(length, function(data) {
	            opcodes['2'].finish.call(self, mask, data);
	          });
	        });
	      }
	      else {
	        self.expectData(length, function(data) {
	          opcodes['2'].finish.call(self, null, data);
	        });
	      }
	    },
	    finish: function(mask, data) {
	      var self = this;
	      var packet = this.unmask(mask, data, true) || new Buffer(0);
	      var state = clone(this.state);
	      this.messageHandlers.push(function(callback) {
	        self.applyExtensions(packet, state.lastFragment, state.compressed, function(err, buffer) {
	          if (err) return self.error(err.message, 1007);
	          if (buffer != null) self.currentMessage.push(buffer);
	          if (state.lastFragment) {
	            var messageBuffer = self.concatBuffers(self.currentMessage);
	            self.currentMessage = [];
	            self.onbinary(messageBuffer, {masked: state.masked, buffer: messageBuffer});
	          }
	          callback();
	        });
	      });
	      this.flush();
	      this.endPacket();
	    }
	  },
	  // close
	  '8': {
	    start: function(data) {
	      var self = this;
	      if (self.state.lastFragment == false) {
	        self.error('fragmented close is not supported', 1002);
	        return;
	      }

	      // decode length
	      var firstLength = data[1] & 0x7f;
	      if (firstLength < 126) {
	        opcodes['8'].getData.call(self, firstLength);
	      }
	      else {
	        self.error('control frames cannot have more than 125 bytes of data', 1002);
	      }
	    },
	    getData: function(length) {
	      var self = this;
	      if (self.state.masked) {
	        self.expectHeader(4, function(data) {
	          var mask = data;
	          self.expectData(length, function(data) {
	            opcodes['8'].finish.call(self, mask, data);
	          });
	        });
	      }
	      else {
	        self.expectData(length, function(data) {
	          opcodes['8'].finish.call(self, null, data);
	        });
	      }
	    },
	    finish: function(mask, data) {
	      var self = this;
	      data = self.unmask(mask, data, true);

	      var state = clone(this.state);
	      this.messageHandlers.push(function() {
	        if (data && data.length == 1) {
	          self.error('close packets with data must be at least two bytes long', 1002);
	          return;
	        }
	        var code = data && data.length > 1 ? readUInt16BE.call(data, 0) : 1000;
	        if (!ErrorCodes.isValidErrorCode(code)) {
	          self.error('invalid error code', 1002);
	          return;
	        }
	        var message = '';
	        if (data && data.length > 2) {
	          var messageBuffer = data.slice(2);
	          if (!Validation.isValidUTF8(messageBuffer)) {
	            self.error('invalid utf8 sequence', 1007);
	            return;
	          }
	          message = messageBuffer.toString('utf8');
	        }
	        self.onclose(code, message, {masked: state.masked});
	        self.reset();
	      });
	      this.flush();
	    },
	  },
	  // ping
	  '9': {
	    start: function(data) {
	      var self = this;
	      if (self.state.lastFragment == false) {
	        self.error('fragmented ping is not supported', 1002);
	        return;
	      }

	      // decode length
	      var firstLength = data[1] & 0x7f;
	      if (firstLength < 126) {
	        opcodes['9'].getData.call(self, firstLength);
	      }
	      else {
	        self.error('control frames cannot have more than 125 bytes of data', 1002);
	      }
	    },
	    getData: function(length) {
	      var self = this;
	      if (self.state.masked) {
	        self.expectHeader(4, function(data) {
	          var mask = data;
	          self.expectData(length, function(data) {
	            opcodes['9'].finish.call(self, mask, data);
	          });
	        });
	      }
	      else {
	        self.expectData(length, function(data) {
	          opcodes['9'].finish.call(self, null, data);
	        });
	      }
	    },
	    finish: function(mask, data) {
	      var self = this;
	      data = this.unmask(mask, data, true);
	      var state = clone(this.state);
	      this.messageHandlers.push(function(callback) {
	        self.onping(data, {masked: state.masked, binary: true});
	        callback();
	      });
	      this.flush();
	      this.endPacket();
	    }
	  },
	  // pong
	  '10': {
	    start: function(data) {
	      var self = this;
	      if (self.state.lastFragment == false) {
	        self.error('fragmented pong is not supported', 1002);
	        return;
	      }

	      // decode length
	      var firstLength = data[1] & 0x7f;
	      if (firstLength < 126) {
	        opcodes['10'].getData.call(self, firstLength);
	      }
	      else {
	        self.error('control frames cannot have more than 125 bytes of data', 1002);
	      }
	    },
	    getData: function(length) {
	      var self = this;
	      if (this.state.masked) {
	        this.expectHeader(4, function(data) {
	          var mask = data;
	          self.expectData(length, function(data) {
	            opcodes['10'].finish.call(self, mask, data);
	          });
	        });
	      }
	      else {
	        this.expectData(length, function(data) {
	          opcodes['10'].finish.call(self, null, data);
	        });
	      }
	    },
	    finish: function(mask, data) {
	      var self = this;
	      data = self.unmask(mask, data, true);
	      var state = clone(this.state);
	      this.messageHandlers.push(function(callback) {
	        self.onpong(data, {masked: state.masked, binary: true});
	        callback();
	      });
	      this.flush();
	      this.endPacket();
	    }
	  }
	}


/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	try {
	  module.exports = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"utf-8-validate\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	} catch (e) {
	  module.exports = __webpack_require__(133);
	}


/***/ },
/* 133 */
/***/ function(module, exports) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */
	 
	module.exports.Validation = {
	  isValidUTF8: function(buffer) {
	    return true;
	  }
	};



/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var util = __webpack_require__(25);

	function BufferPool(initialSize, growStrategy, shrinkStrategy) {
	  if (this instanceof BufferPool === false) {
	    throw new TypeError("Classes can't be function-called");
	  }

	  if (typeof initialSize === 'function') {
	    shrinkStrategy = growStrategy;
	    growStrategy = initialSize;
	    initialSize = 0;
	  }
	  else if (typeof initialSize === 'undefined') {
	    initialSize = 0;
	  }
	  this._growStrategy = (growStrategy || function(db, size) {
	    return db.used + size;
	  }).bind(null, this);
	  this._shrinkStrategy = (shrinkStrategy || function(db) {
	    return initialSize;
	  }).bind(null, this);
	  this._buffer = initialSize ? new Buffer(initialSize) : null;
	  this._offset = 0;
	  this._used = 0;
	  this._changeFactor = 0;
	  this.__defineGetter__('size', function(){
	    return this._buffer == null ? 0 : this._buffer.length;
	  });
	  this.__defineGetter__('used', function(){
	    return this._used;
	  });
	}

	BufferPool.prototype.get = function(length) {
	  if (this._buffer == null || this._offset + length > this._buffer.length) {
	    var newBuf = new Buffer(this._growStrategy(length));
	    this._buffer = newBuf;
	    this._offset = 0;
	  }
	  this._used += length;
	  var buf = this._buffer.slice(this._offset, this._offset + length);
	  this._offset += length;
	  return buf;
	}

	BufferPool.prototype.reset = function(forceNewBuffer) {
	  var len = this._shrinkStrategy();
	  if (len < this.size) this._changeFactor -= 1;
	  if (forceNewBuffer || this._changeFactor < -2) {
	    this._changeFactor = 0;
	    this._buffer = len ? new Buffer(len) : null;
	  }
	  this._offset = 0;
	  this._used = 0;
	}

	module.exports = BufferPool;


/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var events = __webpack_require__(19)
	  , util = __webpack_require__(25)
	  , EventEmitter = events.EventEmitter;

	/**
	 * Hixie Sender implementation
	 */

	function Sender(socket) {
	  if (this instanceof Sender === false) {
	    throw new TypeError("Classes can't be function-called");
	  }

	  events.EventEmitter.call(this);

	  this.socket = socket;
	  this.continuationFrame = false;
	  this.isClosed = false;
	}

	module.exports = Sender;

	/**
	 * Inherits from EventEmitter.
	 */

	util.inherits(Sender, events.EventEmitter);

	/**
	 * Frames and writes data.
	 *
	 * @api public
	 */

	Sender.prototype.send = function(data, options, cb) {
	  if (this.isClosed) return;

	  var isString = typeof data == 'string'
	    , length = isString ? Buffer.byteLength(data) : data.length
	    , lengthbytes = (length > 127) ? 2 : 1 // assume less than 2**14 bytes
	    , writeStartMarker = this.continuationFrame == false
	    , writeEndMarker = !options || !(typeof options.fin != 'undefined' && !options.fin)
	    , buffer = new Buffer((writeStartMarker ? ((options && options.binary) ? (1 + lengthbytes) : 1) : 0) + length + ((writeEndMarker && !(options && options.binary)) ? 1 : 0))
	    , offset = writeStartMarker ? 1 : 0;

	  if (writeStartMarker) {
	    if (options && options.binary) {
	      buffer.write('\x80', 'binary');
	      // assume length less than 2**14 bytes
	      if (lengthbytes > 1)
	        buffer.write(String.fromCharCode(128+length/128), offset++, 'binary');
	      buffer.write(String.fromCharCode(length&0x7f), offset++, 'binary');
	    } else
	      buffer.write('\x00', 'binary');
	  }

	  if (isString) buffer.write(data, offset, 'utf8');
	  else data.copy(buffer, offset, 0);

	  if (writeEndMarker) {
	    if (options && options.binary) {
	      // sending binary, not writing end marker
	    } else
	      buffer.write('\xff', offset + length, 'binary');
	    this.continuationFrame = false;
	  }
	  else this.continuationFrame = true;

	  try {
	    this.socket.write(buffer, 'binary', cb);
	  } catch (e) {
	    this.error(e.toString());
	  }
	};

	/**
	 * Sends a close instruction to the remote party.
	 *
	 * @api public
	 */

	Sender.prototype.close = function(code, data, mask, cb) {
	  if (this.isClosed) return;
	  this.isClosed = true;
	  try {
	    if (this.continuationFrame) this.socket.write(new Buffer([0xff], 'binary'));
	    this.socket.write(new Buffer([0xff, 0x00]), 'binary', cb);
	  } catch (e) {
	    this.error(e.toString());
	  }
	};

	/**
	 * Sends a ping message to the remote party. Not available for hixie.
	 *
	 * @api public
	 */

	Sender.prototype.ping = function(data, options) {};

	/**
	 * Sends a pong message to the remote party. Not available for hixie.
	 *
	 * @api public
	 */

	Sender.prototype.pong = function(data, options) {};

	/**
	 * Handles an error
	 *
	 * @api private
	 */

	Sender.prototype.error = function (reason) {
	  this.emit('error', reason);
	  return this;
	};


/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var util = __webpack_require__(25);

	/**
	 * State constants
	 */

	var EMPTY = 0
	  , BODY = 1;
	var BINARYLENGTH = 2
	  , BINARYBODY = 3;

	/**
	 * Hixie Receiver implementation
	 */

	function Receiver () {
	  if (this instanceof Receiver === false) {
	    throw new TypeError("Classes can't be function-called");
	  }

	  this.state = EMPTY;
	  this.buffers = [];
	  this.messageEnd = -1;
	  this.spanLength = 0;
	  this.dead = false;

	  this.onerror = function() {};
	  this.ontext = function() {};
	  this.onbinary = function() {};
	  this.onclose = function() {};
	  this.onping = function() {};
	  this.onpong = function() {};
	}

	module.exports = Receiver;

	/**
	 * Add new data to the parser.
	 *
	 * @api public
	 */

	Receiver.prototype.add = function(data) {
	  var self = this;
	  function doAdd() {
	    if (self.state === EMPTY) {
	      if (data.length == 2 && data[0] == 0xFF && data[1] == 0x00) {
	        self.reset();
	        self.onclose();
	        return;
	      }
	      if (data[0] === 0x80) {
	        self.messageEnd = 0;
	        self.state = BINARYLENGTH;
	        data = data.slice(1);
	      } else {

	      if (data[0] !== 0x00) {
	        self.error('payload must start with 0x00 byte', true);
	        return;
	      }
	      data = data.slice(1);
	      self.state = BODY;

	      }
	    }
	    if (self.state === BINARYLENGTH) {
	      var i = 0;
	      while ((i < data.length) && (data[i] & 0x80)) {
	        self.messageEnd = 128 * self.messageEnd + (data[i] & 0x7f);
	        ++i;
	      }
	      if (i < data.length) {
	        self.messageEnd = 128 * self.messageEnd + (data[i] & 0x7f);
	        self.state = BINARYBODY;
	        ++i;
	      }
	      if (i > 0)
	        data = data.slice(i);
	    }
	    if (self.state === BINARYBODY) {
	      var dataleft = self.messageEnd - self.spanLength;
	      if (data.length >= dataleft) {
	        // consume the whole buffer to finish the frame
	        self.buffers.push(data);
	        self.spanLength += dataleft;
	        self.messageEnd = dataleft;
	        return self.parse();
	      }
	      // frame's not done even if we consume it all
	      self.buffers.push(data);
	      self.spanLength += data.length;
	      return;
	    }
	    self.buffers.push(data);
	    if ((self.messageEnd = bufferIndex(data, 0xFF)) != -1) {
	      self.spanLength += self.messageEnd;
	      return self.parse();
	    }
	    else self.spanLength += data.length;
	  }
	  while(data) data = doAdd();
	};

	/**
	 * Releases all resources used by the receiver.
	 *
	 * @api public
	 */

	Receiver.prototype.cleanup = function() {
	  this.dead = true;
	  this.state = EMPTY;
	  this.buffers = [];
	};

	/**
	 * Process buffered data.
	 *
	 * @api public
	 */

	Receiver.prototype.parse = function() {
	  var output = new Buffer(this.spanLength);
	  var outputIndex = 0;
	  for (var bi = 0, bl = this.buffers.length; bi < bl - 1; ++bi) {
	    var buffer = this.buffers[bi];
	    buffer.copy(output, outputIndex);
	    outputIndex += buffer.length;
	  }
	  var lastBuffer = this.buffers[this.buffers.length - 1];
	  if (this.messageEnd > 0) lastBuffer.copy(output, outputIndex, 0, this.messageEnd);
	  if (this.state !== BODY) --this.messageEnd;
	  var tail = null;
	  if (this.messageEnd < lastBuffer.length - 1) {
	    tail = lastBuffer.slice(this.messageEnd + 1);
	  }
	  this.reset();
	  this.ontext(output.toString('utf8'));
	  return tail;
	};

	/**
	 * Handles an error
	 *
	 * @api private
	 */

	Receiver.prototype.error = function (reason, terminate) {
	  this.reset();
	  this.onerror(reason, terminate);
	  return this;
	};

	/**
	 * Reset parser state
	 *
	 * @api private
	 */

	Receiver.prototype.reset = function (reason) {
	  if (this.dead) return;
	  this.state = EMPTY;
	  this.buffers = [];
	  this.messageEnd = -1;
	  this.spanLength = 0;
	};

	/**
	 * Internal api
	 */

	function bufferIndex(buffer, byte) {
	  for (var i = 0, l = buffer.length; i < l; ++i) {
	    if (buffer[i] === byte) return i;
	  }
	  return -1;
	}


/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	
	var util = __webpack_require__(25);

	/**
	 * Module exports.
	 */

	exports.parse = parse;
	exports.format = format;

	/**
	 * Parse extensions header value
	 */

	function parse(value) {
	  value = value || '';

	  var extensions = {};

	  value.split(',').forEach(function(v) {
	    var params = v.split(';');
	    var token = params.shift().trim();
	    var paramsList = extensions[token] = extensions[token] || [];
	    var parsedParams = {};

	    params.forEach(function(param) {
	      var parts = param.trim().split('=');
	      var key = parts[0];
	      var value = parts[1];
	      if (typeof value === 'undefined') {
	        value = true;
	      } else {
	        // unquote value
	        if (value[0] === '"') {
	          value = value.slice(1);
	        }
	        if (value[value.length - 1] === '"') {
	          value = value.slice(0, value.length - 1);
	        }
	      }
	      (parsedParams[key] = parsedParams[key] || []).push(value);
	    });

	    paramsList.push(parsedParams);
	  });

	  return extensions;
	}

	/**
	 * Format extensions header value
	 */

	function format(value) {
	  return Object.keys(value).map(function(token) {
	    var paramsList = value[token];
	    if (!util.isArray(paramsList)) {
	      paramsList = [paramsList];
	    }
	    return paramsList.map(function(params) {
	      return [token].concat(Object.keys(params).map(function(k) {
	        var p = params[k];
	        if (!util.isArray(p)) p = [p];
	        return p.map(function(v) {
	          return v === true ? k : k + '=' + v;
	        }).join('; ');
	      })).join('; ');
	    }).join(', ');
	  }).join(', ');
	}


/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * ws: a node.js websocket client
	 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
	 * MIT Licensed
	 */

	var util = __webpack_require__(25)
	  , events = __webpack_require__(19)
	  , http = __webpack_require__(30)
	  , crypto = __webpack_require__(71)
	  , Options = __webpack_require__(125)
	  , WebSocket = __webpack_require__(122)
	  , Extensions = __webpack_require__(137)
	  , PerMessageDeflate = __webpack_require__(130)
	  , tls = __webpack_require__(139)
	  , url = __webpack_require__(48);

	/**
	 * WebSocket Server implementation
	 */

	function WebSocketServer(options, callback) {
	  if (this instanceof WebSocketServer === false) {
	    return new WebSocketServer(options, callback);
	  }

	  events.EventEmitter.call(this);

	  options = new Options({
	    host: '0.0.0.0',
	    port: null,
	    server: null,
	    verifyClient: null,
	    handleProtocols: null,
	    path: null,
	    noServer: false,
	    disableHixie: false,
	    clientTracking: true,
	    perMessageDeflate: true
	  }).merge(options);

	  if (!options.isDefinedAndNonNull('port') && !options.isDefinedAndNonNull('server') && !options.value.noServer) {
	    throw new TypeError('`port` or a `server` must be provided');
	  }

	  var self = this;

	  if (options.isDefinedAndNonNull('port')) {
	    this._server = http.createServer(function (req, res) {
	      var body = http.STATUS_CODES[426];
	      res.writeHead(426, {
	        'Content-Length': body.length,
	        'Content-Type': 'text/plain'
	      });
	      res.end(body);
	    });
	    this._server.allowHalfOpen = false;
	    this._server.listen(options.value.port, options.value.host, callback);
	    this._closeServer = function() { if (self._server) self._server.close(); };
	  }
	  else if (options.value.server) {
	    this._server = options.value.server;
	    if (options.value.path) {
	      // take note of the path, to avoid collisions when multiple websocket servers are
	      // listening on the same http server
	      if (this._server._webSocketPaths && options.value.server._webSocketPaths[options.value.path]) {
	        throw new Error('two instances of WebSocketServer cannot listen on the same http server path');
	      }
	      if (typeof this._server._webSocketPaths !== 'object') {
	        this._server._webSocketPaths = {};
	      }
	      this._server._webSocketPaths[options.value.path] = 1;
	    }
	  }
	  if (this._server) this._server.once('listening', function() { self.emit('listening'); });

	  if (typeof this._server != 'undefined') {
	    this._server.on('error', function(error) {
	      self.emit('error', error)
	    });
	    this._server.on('upgrade', function(req, socket, upgradeHead) {
	      //copy upgradeHead to avoid retention of large slab buffers used in node core
	      var head = new Buffer(upgradeHead.length);
	      upgradeHead.copy(head);

	      self.handleUpgrade(req, socket, head, function(client) {
	        self.emit('connection'+req.url, client);
	        self.emit('connection', client);
	      });
	    });
	  }

	  this.options = options.value;
	  this.path = options.value.path;
	  this.clients = [];
	}

	/**
	 * Inherits from EventEmitter.
	 */

	util.inherits(WebSocketServer, events.EventEmitter);

	/**
	 * Immediately shuts down the connection.
	 *
	 * @api public
	 */

	WebSocketServer.prototype.close = function(callback) {
	  // terminate all associated clients
	  var error = null;
	  try {
	    for (var i = 0, l = this.clients.length; i < l; ++i) {
	      this.clients[i].terminate();
	    }
	  }
	  catch (e) {
	    error = e;
	  }

	  // remove path descriptor, if any
	  if (this.path && this._server._webSocketPaths) {
	    delete this._server._webSocketPaths[this.path];
	    if (Object.keys(this._server._webSocketPaths).length == 0) {
	      delete this._server._webSocketPaths;
	    }
	  }

	  // close the http server if it was internally created
	  try {
	    if (typeof this._closeServer !== 'undefined') {
	      this._closeServer();
	    }
	  }
	  finally {
	    delete this._server;
	  }
	  if(callback)
	    callback(error);
	  else if(error)
	    throw error;
	}

	/**
	 * Handle a HTTP Upgrade request.
	 *
	 * @api public
	 */

	WebSocketServer.prototype.handleUpgrade = function(req, socket, upgradeHead, cb) {
	  // check for wrong path
	  if (this.options.path) {
	    var u = url.parse(req.url);
	    if (u && u.pathname !== this.options.path) return;
	  }

	  if (typeof req.headers.upgrade === 'undefined' || req.headers.upgrade.toLowerCase() !== 'websocket') {
	    abortConnection(socket, 400, 'Bad Request');
	    return;
	  }

	  if (req.headers['sec-websocket-key1']) handleHixieUpgrade.apply(this, arguments);
	  else handleHybiUpgrade.apply(this, arguments);
	}

	module.exports = WebSocketServer;

	/**
	 * Entirely private apis,
	 * which may or may not be bound to a sepcific WebSocket instance.
	 */

	function handleHybiUpgrade(req, socket, upgradeHead, cb) {
	  // handle premature socket errors
	  var errorHandler = function() {
	    try { socket.destroy(); } catch (e) {}
	  }
	  socket.on('error', errorHandler);

	  // verify key presence
	  if (!req.headers['sec-websocket-key']) {
	    abortConnection(socket, 400, 'Bad Request');
	    return;
	  }

	  // verify version
	  var version = parseInt(req.headers['sec-websocket-version']);
	  if ([8, 13].indexOf(version) === -1) {
	    abortConnection(socket, 400, 'Bad Request');
	    return;
	  }

	  // verify protocol
	  var protocols = req.headers['sec-websocket-protocol'];

	  // verify client
	  var origin = version < 13 ?
	    req.headers['sec-websocket-origin'] :
	    req.headers['origin'];

	  // handle extensions offer
	  var extensionsOffer = Extensions.parse(req.headers['sec-websocket-extensions']);

	  // handler to call when the connection sequence completes
	  var self = this;
	  var completeHybiUpgrade2 = function(protocol) {

	    // calc key
	    var key = req.headers['sec-websocket-key'];
	    var shasum = crypto.createHash('sha1');
	    shasum.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
	    key = shasum.digest('base64');

	    var headers = [
	        'HTTP/1.1 101 Switching Protocols'
	      , 'Upgrade: websocket'
	      , 'Connection: Upgrade'
	      , 'Sec-WebSocket-Accept: ' + key
	    ];

	    if (typeof protocol != 'undefined') {
	      headers.push('Sec-WebSocket-Protocol: ' + protocol);
	    }

	    var extensions = {};
	    try {
	      extensions = acceptExtensions.call(self, extensionsOffer);
	    } catch (err) {
	      abortConnection(socket, 400, 'Bad Request');
	      return;
	    }

	    if (Object.keys(extensions).length) {
	      var serverExtensions = {};
	      Object.keys(extensions).forEach(function(token) {
	        serverExtensions[token] = [extensions[token].params]
	      });
	      headers.push('Sec-WebSocket-Extensions: ' + Extensions.format(serverExtensions));
	    }

	    // allows external modification/inspection of handshake headers
	    self.emit('headers', headers);

	    socket.setTimeout(0);
	    socket.setNoDelay(true);
	    try {
	      socket.write(headers.concat('', '').join('\r\n'));
	    }
	    catch (e) {
	      // if the upgrade write fails, shut the connection down hard
	      try { socket.destroy(); } catch (e) {}
	      return;
	    }

	    var client = new WebSocket([req, socket, upgradeHead], {
	      protocolVersion: version,
	      protocol: protocol,
	      extensions: extensions
	    });

	    if (self.options.clientTracking) {
	      self.clients.push(client);
	      client.on('close', function() {
	        var index = self.clients.indexOf(client);
	        if (index != -1) {
	          self.clients.splice(index, 1);
	        }
	      });
	    }

	    // signal upgrade complete
	    socket.removeListener('error', errorHandler);
	    cb(client);
	  }

	  // optionally call external protocol selection handler before
	  // calling completeHybiUpgrade2
	  var completeHybiUpgrade1 = function() {
	    // choose from the sub-protocols
	    if (typeof self.options.handleProtocols == 'function') {
	        var protList = (protocols || "").split(/, */);
	        var callbackCalled = false;
	        var res = self.options.handleProtocols(protList, function(result, protocol) {
	          callbackCalled = true;
	          if (!result) abortConnection(socket, 401, 'Unauthorized');
	          else completeHybiUpgrade2(protocol);
	        });
	        if (!callbackCalled) {
	            // the handleProtocols handler never called our callback
	            abortConnection(socket, 501, 'Could not process protocols');
	        }
	        return;
	    } else {
	        if (typeof protocols !== 'undefined') {
	            completeHybiUpgrade2(protocols.split(/, */)[0]);
	        }
	        else {
	            completeHybiUpgrade2();
	        }
	    }
	  }

	  // optionally call external client verification handler
	  if (typeof this.options.verifyClient == 'function') {
	    var info = {
	      origin: origin,
	      secure: typeof req.connection.authorized !== 'undefined' || typeof req.connection.encrypted !== 'undefined',
	      req: req
	    };
	    if (this.options.verifyClient.length == 2) {
	      this.options.verifyClient(info, function(result, code, name) {
	        if (typeof code === 'undefined') code = 401;
	        if (typeof name === 'undefined') name = http.STATUS_CODES[code];

	        if (!result) abortConnection(socket, code, name);
	        else completeHybiUpgrade1();
	      });
	      return;
	    }
	    else if (!this.options.verifyClient(info)) {
	      abortConnection(socket, 401, 'Unauthorized');
	      return;
	    }
	  }

	  completeHybiUpgrade1();
	}

	function handleHixieUpgrade(req, socket, upgradeHead, cb) {
	  // handle premature socket errors
	  var errorHandler = function() {
	    try { socket.destroy(); } catch (e) {}
	  }
	  socket.on('error', errorHandler);

	  // bail if options prevent hixie
	  if (this.options.disableHixie) {
	    abortConnection(socket, 401, 'Hixie support disabled');
	    return;
	  }

	  // verify key presence
	  if (!req.headers['sec-websocket-key2']) {
	    abortConnection(socket, 400, 'Bad Request');
	    return;
	  }

	  var origin = req.headers['origin']
	    , self = this;

	  // setup handshake completion to run after client has been verified
	  var onClientVerified = function() {
	    var wshost;
	    if (!req.headers['x-forwarded-host'])
	        wshost = req.headers.host;
	    else
	        wshost = req.headers['x-forwarded-host'];
	    var location = ((req.headers['x-forwarded-proto'] === 'https' || socket.encrypted) ? 'wss' : 'ws') + '://' + wshost + req.url
	      , protocol = req.headers['sec-websocket-protocol'];

	    // handshake completion code to run once nonce has been successfully retrieved
	    var completeHandshake = function(nonce, rest) {
	      // calculate key
	      var k1 = req.headers['sec-websocket-key1']
	        , k2 = req.headers['sec-websocket-key2']
	        , md5 = crypto.createHash('md5');

	      [k1, k2].forEach(function (k) {
	        var n = parseInt(k.replace(/[^\d]/g, ''))
	          , spaces = k.replace(/[^ ]/g, '').length;
	        if (spaces === 0 || n % spaces !== 0){
	          abortConnection(socket, 400, 'Bad Request');
	          return;
	        }
	        n /= spaces;
	        md5.update(String.fromCharCode(
	          n >> 24 & 0xFF,
	          n >> 16 & 0xFF,
	          n >> 8  & 0xFF,
	          n       & 0xFF));
	      });
	      md5.update(nonce.toString('binary'));

	      var headers = [
	          'HTTP/1.1 101 Switching Protocols'
	        , 'Upgrade: WebSocket'
	        , 'Connection: Upgrade'
	        , 'Sec-WebSocket-Location: ' + location
	      ];
	      if (typeof protocol != 'undefined') headers.push('Sec-WebSocket-Protocol: ' + protocol);
	      if (typeof origin != 'undefined') headers.push('Sec-WebSocket-Origin: ' + origin);

	      socket.setTimeout(0);
	      socket.setNoDelay(true);
	      try {
	        // merge header and hash buffer
	        var headerBuffer = new Buffer(headers.concat('', '').join('\r\n'));
	        var hashBuffer = new Buffer(md5.digest('binary'), 'binary');
	        var handshakeBuffer = new Buffer(headerBuffer.length + hashBuffer.length);
	        headerBuffer.copy(handshakeBuffer, 0);
	        hashBuffer.copy(handshakeBuffer, headerBuffer.length);

	        // do a single write, which - upon success - causes a new client websocket to be setup
	        socket.write(handshakeBuffer, 'binary', function(err) {
	          if (err) return; // do not create client if an error happens
	          var client = new WebSocket([req, socket, rest], {
	            protocolVersion: 'hixie-76',
	            protocol: protocol
	          });
	          if (self.options.clientTracking) {
	            self.clients.push(client);
	            client.on('close', function() {
	              var index = self.clients.indexOf(client);
	              if (index != -1) {
	                self.clients.splice(index, 1);
	              }
	            });
	          }

	          // signal upgrade complete
	          socket.removeListener('error', errorHandler);
	          cb(client);
	        });
	      }
	      catch (e) {
	        try { socket.destroy(); } catch (e) {}
	        return;
	      }
	    }

	    // retrieve nonce
	    var nonceLength = 8;
	    if (upgradeHead && upgradeHead.length >= nonceLength) {
	      var nonce = upgradeHead.slice(0, nonceLength);
	      var rest = upgradeHead.length > nonceLength ? upgradeHead.slice(nonceLength) : null;
	      completeHandshake.call(self, nonce, rest);
	    }
	    else {
	      // nonce not present in upgradeHead, so we must wait for enough data
	      // data to arrive before continuing
	      var nonce = new Buffer(nonceLength);
	      upgradeHead.copy(nonce, 0);
	      var received = upgradeHead.length;
	      var rest = null;
	      var handler = function (data) {
	        var toRead = Math.min(data.length, nonceLength - received);
	        if (toRead === 0) return;
	        data.copy(nonce, received, 0, toRead);
	        received += toRead;
	        if (received == nonceLength) {
	          socket.removeListener('data', handler);
	          if (toRead < data.length) rest = data.slice(toRead);
	          completeHandshake.call(self, nonce, rest);
	        }
	      }
	      socket.on('data', handler);
	    }
	  }

	  // verify client
	  if (typeof this.options.verifyClient == 'function') {
	    var info = {
	      origin: origin,
	      secure: typeof req.connection.authorized !== 'undefined' || typeof req.connection.encrypted !== 'undefined',
	      req: req
	    };
	    if (this.options.verifyClient.length == 2) {
	      var self = this;
	      this.options.verifyClient(info, function(result, code, name) {
	        if (typeof code === 'undefined') code = 401;
	        if (typeof name === 'undefined') name = http.STATUS_CODES[code];

	        if (!result) abortConnection(socket, code, name);
	        else onClientVerified.apply(self);
	      });
	      return;
	    }
	    else if (!this.options.verifyClient(info)) {
	      abortConnection(socket, 401, 'Unauthorized');
	      return;
	    }
	  }

	  // no client verification required
	  onClientVerified();
	}

	function acceptExtensions(offer) {
	  var extensions = {};
	  var options = this.options.perMessageDeflate;
	  if (options && offer[PerMessageDeflate.extensionName]) {
	    var perMessageDeflate = new PerMessageDeflate(options !== true ? options : {}, true);
	    perMessageDeflate.accept(offer[PerMessageDeflate.extensionName]);
	    extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
	  }
	  return extensions;
	}

	function abortConnection(socket, code, name) {
	  try {
	    var response = [
	      'HTTP/1.1 ' + code + ' ' + name,
	      'Content-type: text/html'
	    ];
	    socket.write(response.concat('', '').join('\r\n'));
	  }
	  catch (e) { /* ignore errors - we've aborted this connection */ }
	  finally {
	    // ensure that an early aborted connection is shut down completely
	    try { socket.destroy(); } catch (e) {}
	  }
	}


/***/ },
/* 139 */
/***/ function(module, exports) {

	module.exports = require("tls");

/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var url = __webpack_require__(141);
	var parser = __webpack_require__(143);
	var Manager = __webpack_require__(150);
	var debug = __webpack_require__(23)('socket.io-client');

	/**
	 * Module exports.
	 */

	module.exports = exports = lookup;

	/**
	 * Managers cache.
	 */

	var cache = exports.managers = {};

	/**
	 * Looks up an existing `Manager` for multiplexing.
	 * If the user summons:
	 *
	 *   `io('http://localhost/a');`
	 *   `io('http://localhost/b');`
	 *
	 * We reuse the existing instance based on same scheme/port/host,
	 * and we initialize sockets for each namespace.
	 *
	 * @api public
	 */

	function lookup(uri, opts) {
	  if (typeof uri == 'object') {
	    opts = uri;
	    uri = undefined;
	  }

	  opts = opts || {};

	  var parsed = url(uri);
	  var source = parsed.source;
	  var id = parsed.id;
	  var path = parsed.path;
	  var sameNamespace = cache[id] && path in cache[id].nsps;
	  var newConnection = opts.forceNew || opts['force new connection'] ||
	                      false === opts.multiplex || sameNamespace;

	  var io;

	  if (newConnection) {
	    debug('ignoring socket cache for %s', source);
	    io = Manager(source, opts);
	  } else {
	    if (!cache[id]) {
	      debug('new io instance for %s', source);
	      cache[id] = Manager(source, opts);
	    }
	    io = cache[id];
	  }

	  return io.socket(parsed.path);
	}

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	exports.protocol = parser.protocol;

	/**
	 * `connect`.
	 *
	 * @param {String} uri
	 * @api public
	 */

	exports.connect = lookup;

	/**
	 * Expose constructors for standalone build.
	 *
	 * @api public
	 */

	exports.Manager = __webpack_require__(150);
	exports.Socket = __webpack_require__(167);


/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var parseuri = __webpack_require__(142);
	var debug = __webpack_require__(23)('socket.io-client:url');

	/**
	 * Module exports.
	 */

	module.exports = url;

	/**
	 * URL parser.
	 *
	 * @param {String} url
	 * @param {Object} An object meant to mimic window.location.
	 *                 Defaults to window.location.
	 * @api public
	 */

	function url(uri, loc){
	  var obj = uri;

	  // default to window.location
	  var loc = loc || global.location;
	  if (null == uri) uri = loc.protocol + '//' + loc.host;

	  // relative path support
	  if ('string' == typeof uri) {
	    if ('/' == uri.charAt(0)) {
	      if ('/' == uri.charAt(1)) {
	        uri = loc.protocol + uri;
	      } else {
	        uri = loc.host + uri;
	      }
	    }

	    if (!/^(https?|wss?):\/\//.test(uri)) {
	      debug('protocol-less url %s', uri);
	      if ('undefined' != typeof loc) {
	        uri = loc.protocol + '//' + uri;
	      } else {
	        uri = 'https://' + uri;
	      }
	    }

	    // parse
	    debug('parse %s', uri);
	    obj = parseuri(uri);
	  }

	  // make sure we treat `localhost:80` and `localhost` equally
	  if (!obj.port) {
	    if (/^(http|ws)$/.test(obj.protocol)) {
	      obj.port = '80';
	    }
	    else if (/^(http|ws)s$/.test(obj.protocol)) {
	      obj.port = '443';
	    }
	  }

	  obj.path = obj.path || '/';

	  var ipv6 = obj.host.indexOf(':') !== -1;
	  var host = ipv6 ? '[' + obj.host + ']' : obj.host;

	  // define unique id
	  obj.id = obj.protocol + '://' + host + ':' + obj.port;
	  // define href
	  obj.href = obj.protocol + '://' + host + (loc && loc.port == obj.port ? '' : (':' + obj.port));

	  return obj;
	}


/***/ },
/* 142 */
/***/ function(module, exports) {

	/**
	 * Parses an URI
	 *
	 * @author Steven Levithan <stevenlevithan.com> (MIT license)
	 * @api private
	 */

	var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

	var parts = [
	    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
	];

	module.exports = function parseuri(str) {
	    var src = str,
	        b = str.indexOf('['),
	        e = str.indexOf(']');

	    if (b != -1 && e != -1) {
	        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
	    }

	    var m = re.exec(str || ''),
	        uri = {},
	        i = 14;

	    while (i--) {
	        uri[parts[i]] = m[i] || '';
	    }

	    if (b != -1 && e != -1) {
	        uri.source = src;
	        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
	        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
	        uri.ipv6uri = true;
	    }

	    return uri;
	};


/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var debug = __webpack_require__(23)('socket.io-parser');
	var json = __webpack_require__(144);
	var isArray = __webpack_require__(146);
	var Emitter = __webpack_require__(147);
	var binary = __webpack_require__(148);
	var isBuf = __webpack_require__(149);

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	exports.protocol = 4;

	/**
	 * Packet types.
	 *
	 * @api public
	 */

	exports.types = [
	  'CONNECT',
	  'DISCONNECT',
	  'EVENT',
	  'ACK',
	  'ERROR',
	  'BINARY_EVENT',
	  'BINARY_ACK'
	];

	/**
	 * Packet type `connect`.
	 *
	 * @api public
	 */

	exports.CONNECT = 0;

	/**
	 * Packet type `disconnect`.
	 *
	 * @api public
	 */

	exports.DISCONNECT = 1;

	/**
	 * Packet type `event`.
	 *
	 * @api public
	 */

	exports.EVENT = 2;

	/**
	 * Packet type `ack`.
	 *
	 * @api public
	 */

	exports.ACK = 3;

	/**
	 * Packet type `error`.
	 *
	 * @api public
	 */

	exports.ERROR = 4;

	/**
	 * Packet type 'binary event'
	 *
	 * @api public
	 */

	exports.BINARY_EVENT = 5;

	/**
	 * Packet type `binary ack`. For acks with binary arguments.
	 *
	 * @api public
	 */

	exports.BINARY_ACK = 6;

	/**
	 * Encoder constructor.
	 *
	 * @api public
	 */

	exports.Encoder = Encoder;

	/**
	 * Decoder constructor.
	 *
	 * @api public
	 */

	exports.Decoder = Decoder;

	/**
	 * A socket.io Encoder instance
	 *
	 * @api public
	 */

	function Encoder() {}

	/**
	 * Encode a packet as a single string if non-binary, or as a
	 * buffer sequence, depending on packet type.
	 *
	 * @param {Object} obj - packet object
	 * @param {Function} callback - function to handle encodings (likely engine.write)
	 * @return Calls callback with Array of encodings
	 * @api public
	 */

	Encoder.prototype.encode = function(obj, callback){
	  debug('encoding packet %j', obj);

	  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
	    encodeAsBinary(obj, callback);
	  }
	  else {
	    var encoding = encodeAsString(obj);
	    callback([encoding]);
	  }
	};

	/**
	 * Encode packet as string.
	 *
	 * @param {Object} packet
	 * @return {String} encoded
	 * @api private
	 */

	function encodeAsString(obj) {
	  var str = '';
	  var nsp = false;

	  // first is type
	  str += obj.type;

	  // attachments if we have them
	  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
	    str += obj.attachments;
	    str += '-';
	  }

	  // if we have a namespace other than `/`
	  // we append it followed by a comma `,`
	  if (obj.nsp && '/' != obj.nsp) {
	    nsp = true;
	    str += obj.nsp;
	  }

	  // immediately followed by the id
	  if (null != obj.id) {
	    if (nsp) {
	      str += ',';
	      nsp = false;
	    }
	    str += obj.id;
	  }

	  // json data
	  if (null != obj.data) {
	    if (nsp) str += ',';
	    str += json.stringify(obj.data);
	  }

	  debug('encoded %j as %s', obj, str);
	  return str;
	}

	/**
	 * Encode packet as 'buffer sequence' by removing blobs, and
	 * deconstructing packet into object with placeholders and
	 * a list of buffers.
	 *
	 * @param {Object} packet
	 * @return {Buffer} encoded
	 * @api private
	 */

	function encodeAsBinary(obj, callback) {

	  function writeEncoding(bloblessData) {
	    var deconstruction = binary.deconstructPacket(bloblessData);
	    var pack = encodeAsString(deconstruction.packet);
	    var buffers = deconstruction.buffers;

	    buffers.unshift(pack); // add packet info to beginning of data list
	    callback(buffers); // write all the buffers
	  }

	  binary.removeBlobs(obj, writeEncoding);
	}

	/**
	 * A socket.io Decoder instance
	 *
	 * @return {Object} decoder
	 * @api public
	 */

	function Decoder() {
	  this.reconstructor = null;
	}

	/**
	 * Mix in `Emitter` with Decoder.
	 */

	Emitter(Decoder.prototype);

	/**
	 * Decodes an ecoded packet string into packet JSON.
	 *
	 * @param {String} obj - encoded packet
	 * @return {Object} packet
	 * @api public
	 */

	Decoder.prototype.add = function(obj) {
	  var packet;
	  if ('string' == typeof obj) {
	    packet = decodeString(obj);
	    if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
	      this.reconstructor = new BinaryReconstructor(packet);

	      // no attachments, labeled binary but no binary data to follow
	      if (this.reconstructor.reconPack.attachments === 0) {
	        this.emit('decoded', packet);
	      }
	    } else { // non-binary full packet
	      this.emit('decoded', packet);
	    }
	  }
	  else if (isBuf(obj) || obj.base64) { // raw binary data
	    if (!this.reconstructor) {
	      throw new Error('got binary data when not reconstructing a packet');
	    } else {
	      packet = this.reconstructor.takeBinaryData(obj);
	      if (packet) { // received final buffer
	        this.reconstructor = null;
	        this.emit('decoded', packet);
	      }
	    }
	  }
	  else {
	    throw new Error('Unknown type: ' + obj);
	  }
	};

	/**
	 * Decode a packet String (JSON data)
	 *
	 * @param {String} str
	 * @return {Object} packet
	 * @api private
	 */

	function decodeString(str) {
	  var p = {};
	  var i = 0;

	  // look up type
	  p.type = Number(str.charAt(0));
	  if (null == exports.types[p.type]) return error();

	  // look up attachments if type binary
	  if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
	    var buf = '';
	    while (str.charAt(++i) != '-') {
	      buf += str.charAt(i);
	      if (i == str.length) break;
	    }
	    if (buf != Number(buf) || str.charAt(i) != '-') {
	      throw new Error('Illegal attachments');
	    }
	    p.attachments = Number(buf);
	  }

	  // look up namespace (if any)
	  if ('/' == str.charAt(i + 1)) {
	    p.nsp = '';
	    while (++i) {
	      var c = str.charAt(i);
	      if (',' == c) break;
	      p.nsp += c;
	      if (i == str.length) break;
	    }
	  } else {
	    p.nsp = '/';
	  }

	  // look up id
	  var next = str.charAt(i + 1);
	  if ('' !== next && Number(next) == next) {
	    p.id = '';
	    while (++i) {
	      var c = str.charAt(i);
	      if (null == c || Number(c) != c) {
	        --i;
	        break;
	      }
	      p.id += str.charAt(i);
	      if (i == str.length) break;
	    }
	    p.id = Number(p.id);
	  }

	  // look up json data
	  if (str.charAt(++i)) {
	    try {
	      p.data = json.parse(str.substr(i));
	    } catch(e){
	      return error();
	    }
	  }

	  debug('decoded %s as %j', str, p);
	  return p;
	}

	/**
	 * Deallocates a parser's resources
	 *
	 * @api public
	 */

	Decoder.prototype.destroy = function() {
	  if (this.reconstructor) {
	    this.reconstructor.finishedReconstruction();
	  }
	};

	/**
	 * A manager of a binary event's 'buffer sequence'. Should
	 * be constructed whenever a packet of type BINARY_EVENT is
	 * decoded.
	 *
	 * @param {Object} packet
	 * @return {BinaryReconstructor} initialized reconstructor
	 * @api private
	 */

	function BinaryReconstructor(packet) {
	  this.reconPack = packet;
	  this.buffers = [];
	}

	/**
	 * Method to be called when binary data received from connection
	 * after a BINARY_EVENT packet.
	 *
	 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
	 * @return {null | Object} returns null if more binary data is expected or
	 *   a reconstructed packet object if all buffers have been received.
	 * @api private
	 */

	BinaryReconstructor.prototype.takeBinaryData = function(binData) {
	  this.buffers.push(binData);
	  if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
	    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
	    this.finishedReconstruction();
	    return packet;
	  }
	  return null;
	};

	/**
	 * Cleans up binary packet reconstruction variables.
	 *
	 * @api private
	 */

	BinaryReconstructor.prototype.finishedReconstruction = function() {
	  this.reconPack = null;
	  this.buffers = [];
	};

	function error(data){
	  return {
	    type: exports.ERROR,
	    data: 'parser error'
	  };
	}


/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {/*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
	;(function () {
	  // Detect the `define` function exposed by asynchronous module loaders. The
	  // strict `define` check is necessary for compatibility with `r.js`.
	  var isLoader = "function" === "function" && __webpack_require__(145);

	  // A set of types used to distinguish objects from primitives.
	  var objectTypes = {
	    "function": true,
	    "object": true
	  };

	  // Detect the `exports` object exposed by CommonJS implementations.
	  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

	  // Use the `global` object exposed by Node (including Browserify via
	  // `insert-module-globals`), Narwhal, and Ringo as the default context,
	  // and the `window` object in browsers. Rhino exports a `global` function
	  // instead.
	  var root = objectTypes[typeof window] && window || this,
	      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

	  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
	    root = freeGlobal;
	  }

	  // Public: Initializes JSON 3 using the given `context` object, attaching the
	  // `stringify` and `parse` functions to the specified `exports` object.
	  function runInContext(context, exports) {
	    context || (context = root["Object"]());
	    exports || (exports = root["Object"]());

	    // Native constructor aliases.
	    var Number = context["Number"] || root["Number"],
	        String = context["String"] || root["String"],
	        Object = context["Object"] || root["Object"],
	        Date = context["Date"] || root["Date"],
	        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
	        TypeError = context["TypeError"] || root["TypeError"],
	        Math = context["Math"] || root["Math"],
	        nativeJSON = context["JSON"] || root["JSON"];

	    // Delegate to the native `stringify` and `parse` implementations.
	    if (typeof nativeJSON == "object" && nativeJSON) {
	      exports.stringify = nativeJSON.stringify;
	      exports.parse = nativeJSON.parse;
	    }

	    // Convenience aliases.
	    var objectProto = Object.prototype,
	        getClass = objectProto.toString,
	        isProperty, forEach, undef;

	    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
	    var isExtended = new Date(-3509827334573292);
	    try {
	      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
	      // results for certain dates in Opera >= 10.53.
	      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
	        // Safari < 2.0.2 stores the internal millisecond time value correctly,
	        // but clips the values returned by the date methods to the range of
	        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
	        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
	    } catch (exception) {}

	    // Internal: Determines whether the native `JSON.stringify` and `parse`
	    // implementations are spec-compliant. Based on work by Ken Snyder.
	    function has(name) {
	      if (has[name] !== undef) {
	        // Return cached feature test result.
	        return has[name];
	      }
	      var isSupported;
	      if (name == "bug-string-char-index") {
	        // IE <= 7 doesn't support accessing string characters using square
	        // bracket notation. IE 8 only supports this for primitives.
	        isSupported = "a"[0] != "a";
	      } else if (name == "json") {
	        // Indicates whether both `JSON.stringify` and `JSON.parse` are
	        // supported.
	        isSupported = has("json-stringify") && has("json-parse");
	      } else {
	        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
	        // Test `JSON.stringify`.
	        if (name == "json-stringify") {
	          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
	          if (stringifySupported) {
	            // A test function object with a custom `toJSON` method.
	            (value = function () {
	              return 1;
	            }).toJSON = value;
	            try {
	              stringifySupported =
	                // Firefox 3.1b1 and b2 serialize string, number, and boolean
	                // primitives as object literals.
	                stringify(0) === "0" &&
	                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
	                // literals.
	                stringify(new Number()) === "0" &&
	                stringify(new String()) == '""' &&
	                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
	                // does not define a canonical JSON representation (this applies to
	                // objects with `toJSON` properties as well, *unless* they are nested
	                // within an object or array).
	                stringify(getClass) === undef &&
	                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
	                // FF 3.1b3 pass this test.
	                stringify(undef) === undef &&
	                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
	                // respectively, if the value is omitted entirely.
	                stringify() === undef &&
	                // FF 3.1b1, 2 throw an error if the given value is not a number,
	                // string, array, object, Boolean, or `null` literal. This applies to
	                // objects with custom `toJSON` methods as well, unless they are nested
	                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
	                // methods entirely.
	                stringify(value) === "1" &&
	                stringify([value]) == "[1]" &&
	                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
	                // `"[null]"`.
	                stringify([undef]) == "[null]" &&
	                // YUI 3.0.0b1 fails to serialize `null` literals.
	                stringify(null) == "null" &&
	                // FF 3.1b1, 2 halts serialization if an array contains a function:
	                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
	                // elides non-JSON values from objects and arrays, unless they
	                // define custom `toJSON` methods.
	                stringify([undef, getClass, null]) == "[null,null,null]" &&
	                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
	                // where character escape codes are expected (e.g., `\b` => `\u0008`).
	                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
	                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
	                stringify(null, value) === "1" &&
	                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
	                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
	                // serialize extended years.
	                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
	                // The milliseconds are optional in ES 5, but required in 5.1.
	                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
	                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
	                // four-digit years instead of six-digit years. Credits: @Yaffle.
	                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
	                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
	                // values less than 1000. Credits: @Yaffle.
	                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
	            } catch (exception) {
	              stringifySupported = false;
	            }
	          }
	          isSupported = stringifySupported;
	        }
	        // Test `JSON.parse`.
	        if (name == "json-parse") {
	          var parse = exports.parse;
	          if (typeof parse == "function") {
	            try {
	              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
	              // Conforming implementations should also coerce the initial argument to
	              // a string prior to parsing.
	              if (parse("0") === 0 && !parse(false)) {
	                // Simple parsing test.
	                value = parse(serialized);
	                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
	                if (parseSupported) {
	                  try {
	                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
	                    parseSupported = !parse('"\t"');
	                  } catch (exception) {}
	                  if (parseSupported) {
	                    try {
	                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
	                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
	                      // certain octal literals.
	                      parseSupported = parse("01") !== 1;
	                    } catch (exception) {}
	                  }
	                  if (parseSupported) {
	                    try {
	                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
	                      // points. These environments, along with FF 3.1b1 and 2,
	                      // also allow trailing commas in JSON objects and arrays.
	                      parseSupported = parse("1.") !== 1;
	                    } catch (exception) {}
	                  }
	                }
	              }
	            } catch (exception) {
	              parseSupported = false;
	            }
	          }
	          isSupported = parseSupported;
	        }
	      }
	      return has[name] = !!isSupported;
	    }

	    if (!has("json")) {
	      // Common `[[Class]]` name aliases.
	      var functionClass = "[object Function]",
	          dateClass = "[object Date]",
	          numberClass = "[object Number]",
	          stringClass = "[object String]",
	          arrayClass = "[object Array]",
	          booleanClass = "[object Boolean]";

	      // Detect incomplete support for accessing string characters by index.
	      var charIndexBuggy = has("bug-string-char-index");

	      // Define additional utility methods if the `Date` methods are buggy.
	      if (!isExtended) {
	        var floor = Math.floor;
	        // A mapping between the months of the year and the number of days between
	        // January 1st and the first of the respective month.
	        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	        // Internal: Calculates the number of days between the Unix epoch and the
	        // first day of the given month.
	        var getDay = function (year, month) {
	          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
	        };
	      }

	      // Internal: Determines if a property is a direct property of the given
	      // object. Delegates to the native `Object#hasOwnProperty` method.
	      if (!(isProperty = objectProto.hasOwnProperty)) {
	        isProperty = function (property) {
	          var members = {}, constructor;
	          if ((members.__proto__ = null, members.__proto__ = {
	            // The *proto* property cannot be set multiple times in recent
	            // versions of Firefox and SeaMonkey.
	            "toString": 1
	          }, members).toString != getClass) {
	            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
	            // supports the mutable *proto* property.
	            isProperty = function (property) {
	              // Capture and break the object's prototype chain (see section 8.6.2
	              // of the ES 5.1 spec). The parenthesized expression prevents an
	              // unsafe transformation by the Closure Compiler.
	              var original = this.__proto__, result = property in (this.__proto__ = null, this);
	              // Restore the original prototype chain.
	              this.__proto__ = original;
	              return result;
	            };
	          } else {
	            // Capture a reference to the top-level `Object` constructor.
	            constructor = members.constructor;
	            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
	            // other environments.
	            isProperty = function (property) {
	              var parent = (this.constructor || constructor).prototype;
	              return property in this && !(property in parent && this[property] === parent[property]);
	            };
	          }
	          members = null;
	          return isProperty.call(this, property);
	        };
	      }

	      // Internal: Normalizes the `for...in` iteration algorithm across
	      // environments. Each enumerated key is yielded to a `callback` function.
	      forEach = function (object, callback) {
	        var size = 0, Properties, members, property;

	        // Tests for bugs in the current environment's `for...in` algorithm. The
	        // `valueOf` property inherits the non-enumerable flag from
	        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
	        (Properties = function () {
	          this.valueOf = 0;
	        }).prototype.valueOf = 0;

	        // Iterate over a new instance of the `Properties` class.
	        members = new Properties();
	        for (property in members) {
	          // Ignore all properties inherited from `Object.prototype`.
	          if (isProperty.call(members, property)) {
	            size++;
	          }
	        }
	        Properties = members = null;

	        // Normalize the iteration algorithm.
	        if (!size) {
	          // A list of non-enumerable properties inherited from `Object.prototype`.
	          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
	          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
	          // properties.
	          forEach = function (object, callback) {
	            var isFunction = getClass.call(object) == functionClass, property, length;
	            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
	            for (property in object) {
	              // Gecko <= 1.0 enumerates the `prototype` property of functions under
	              // certain conditions; IE does not.
	              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
	                callback(property);
	              }
	            }
	            // Manually invoke the callback for each non-enumerable property.
	            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
	          };
	        } else if (size == 2) {
	          // Safari <= 2.0.4 enumerates shadowed properties twice.
	          forEach = function (object, callback) {
	            // Create a set of iterated properties.
	            var members = {}, isFunction = getClass.call(object) == functionClass, property;
	            for (property in object) {
	              // Store each property name to prevent double enumeration. The
	              // `prototype` property of functions is not enumerated due to cross-
	              // environment inconsistencies.
	              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
	                callback(property);
	              }
	            }
	          };
	        } else {
	          // No bugs detected; use the standard `for...in` algorithm.
	          forEach = function (object, callback) {
	            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
	            for (property in object) {
	              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
	                callback(property);
	              }
	            }
	            // Manually invoke the callback for the `constructor` property due to
	            // cross-environment inconsistencies.
	            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
	              callback(property);
	            }
	          };
	        }
	        return forEach(object, callback);
	      };

	      // Public: Serializes a JavaScript `value` as a JSON string. The optional
	      // `filter` argument may specify either a function that alters how object and
	      // array members are serialized, or an array of strings and numbers that
	      // indicates which properties should be serialized. The optional `width`
	      // argument may be either a string or number that specifies the indentation
	      // level of the output.
	      if (!has("json-stringify")) {
	        // Internal: A map of control characters and their escaped equivalents.
	        var Escapes = {
	          92: "\\\\",
	          34: '\\"',
	          8: "\\b",
	          12: "\\f",
	          10: "\\n",
	          13: "\\r",
	          9: "\\t"
	        };

	        // Internal: Converts `value` into a zero-padded string such that its
	        // length is at least equal to `width`. The `width` must be <= 6.
	        var leadingZeroes = "000000";
	        var toPaddedString = function (width, value) {
	          // The `|| 0` expression is necessary to work around a bug in
	          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
	          return (leadingZeroes + (value || 0)).slice(-width);
	        };

	        // Internal: Double-quotes a string `value`, replacing all ASCII control
	        // characters (characters with code unit values between 0 and 31) with
	        // their escaped equivalents. This is an implementation of the
	        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
	        var unicodePrefix = "\\u00";
	        var quote = function (value) {
	          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
	          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
	          for (; index < length; index++) {
	            var charCode = value.charCodeAt(index);
	            // If the character is a control character, append its Unicode or
	            // shorthand escape sequence; otherwise, append the character as-is.
	            switch (charCode) {
	              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
	                result += Escapes[charCode];
	                break;
	              default:
	                if (charCode < 32) {
	                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
	                  break;
	                }
	                result += useCharIndex ? symbols[index] : value.charAt(index);
	            }
	          }
	          return result + '"';
	        };

	        // Internal: Recursively serializes an object. Implements the
	        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
	        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
	          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
	          try {
	            // Necessary for host object support.
	            value = object[property];
	          } catch (exception) {}
	          if (typeof value == "object" && value) {
	            className = getClass.call(value);
	            if (className == dateClass && !isProperty.call(value, "toJSON")) {
	              if (value > -1 / 0 && value < 1 / 0) {
	                // Dates are serialized according to the `Date#toJSON` method
	                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
	                // for the ISO 8601 date time string format.
	                if (getDay) {
	                  // Manually compute the year, month, date, hours, minutes,
	                  // seconds, and milliseconds if the `getUTC*` methods are
	                  // buggy. Adapted from @Yaffle's `date-shim` project.
	                  date = floor(value / 864e5);
	                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
	                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
	                  date = 1 + date - getDay(year, month);
	                  // The `time` value specifies the time within the day (see ES
	                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
	                  // to compute `A modulo B`, as the `%` operator does not
	                  // correspond to the `modulo` operation for negative numbers.
	                  time = (value % 864e5 + 864e5) % 864e5;
	                  // The hours, minutes, seconds, and milliseconds are obtained by
	                  // decomposing the time within the day. See section 15.9.1.10.
	                  hours = floor(time / 36e5) % 24;
	                  minutes = floor(time / 6e4) % 60;
	                  seconds = floor(time / 1e3) % 60;
	                  milliseconds = time % 1e3;
	                } else {
	                  year = value.getUTCFullYear();
	                  month = value.getUTCMonth();
	                  date = value.getUTCDate();
	                  hours = value.getUTCHours();
	                  minutes = value.getUTCMinutes();
	                  seconds = value.getUTCSeconds();
	                  milliseconds = value.getUTCMilliseconds();
	                }
	                // Serialize extended years correctly.
	                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
	                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
	                  // Months, dates, hours, minutes, and seconds should have two
	                  // digits; milliseconds should have three.
	                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
	                  // Milliseconds are optional in ES 5.0, but required in 5.1.
	                  "." + toPaddedString(3, milliseconds) + "Z";
	              } else {
	                value = null;
	              }
	            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
	              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
	              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
	              // ignores all `toJSON` methods on these objects unless they are
	              // defined directly on an instance.
	              value = value.toJSON(property);
	            }
	          }
	          if (callback) {
	            // If a replacement function was provided, call it to obtain the value
	            // for serialization.
	            value = callback.call(object, property, value);
	          }
	          if (value === null) {
	            return "null";
	          }
	          className = getClass.call(value);
	          if (className == booleanClass) {
	            // Booleans are represented literally.
	            return "" + value;
	          } else if (className == numberClass) {
	            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
	            // `"null"`.
	            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
	          } else if (className == stringClass) {
	            // Strings are double-quoted and escaped.
	            return quote("" + value);
	          }
	          // Recursively serialize objects and arrays.
	          if (typeof value == "object") {
	            // Check for cyclic structures. This is a linear search; performance
	            // is inversely proportional to the number of unique nested objects.
	            for (length = stack.length; length--;) {
	              if (stack[length] === value) {
	                // Cyclic structures cannot be serialized by `JSON.stringify`.
	                throw TypeError();
	              }
	            }
	            // Add the object to the stack of traversed objects.
	            stack.push(value);
	            results = [];
	            // Save the current indentation level and indent one additional level.
	            prefix = indentation;
	            indentation += whitespace;
	            if (className == arrayClass) {
	              // Recursively serialize array elements.
	              for (index = 0, length = value.length; index < length; index++) {
	                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
	                results.push(element === undef ? "null" : element);
	              }
	              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
	            } else {
	              // Recursively serialize object members. Members are selected from
	              // either a user-specified list of property names, or the object
	              // itself.
	              forEach(properties || value, function (property) {
	                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
	                if (element !== undef) {
	                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
	                  // is not the empty string, let `member` {quote(property) + ":"}
	                  // be the concatenation of `member` and the `space` character."
	                  // The "`space` character" refers to the literal space
	                  // character, not the `space` {width} argument provided to
	                  // `JSON.stringify`.
	                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
	                }
	              });
	              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
	            }
	            // Remove the object from the traversed object stack.
	            stack.pop();
	            return result;
	          }
	        };

	        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
	        exports.stringify = function (source, filter, width) {
	          var whitespace, callback, properties, className;
	          if (objectTypes[typeof filter] && filter) {
	            if ((className = getClass.call(filter)) == functionClass) {
	              callback = filter;
	            } else if (className == arrayClass) {
	              // Convert the property names array into a makeshift set.
	              properties = {};
	              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
	            }
	          }
	          if (width) {
	            if ((className = getClass.call(width)) == numberClass) {
	              // Convert the `width` to an integer and create a string containing
	              // `width` number of space characters.
	              if ((width -= width % 1) > 0) {
	                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
	              }
	            } else if (className == stringClass) {
	              whitespace = width.length <= 10 ? width : width.slice(0, 10);
	            }
	          }
	          // Opera <= 7.54u2 discards the values associated with empty string keys
	          // (`""`) only if they are used directly within an object member list
	          // (e.g., `!("" in { "": 1})`).
	          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
	        };
	      }

	      // Public: Parses a JSON source string.
	      if (!has("json-parse")) {
	        var fromCharCode = String.fromCharCode;

	        // Internal: A map of escaped control characters and their unescaped
	        // equivalents.
	        var Unescapes = {
	          92: "\\",
	          34: '"',
	          47: "/",
	          98: "\b",
	          116: "\t",
	          110: "\n",
	          102: "\f",
	          114: "\r"
	        };

	        // Internal: Stores the parser state.
	        var Index, Source;

	        // Internal: Resets the parser state and throws a `SyntaxError`.
	        var abort = function () {
	          Index = Source = null;
	          throw SyntaxError();
	        };

	        // Internal: Returns the next token, or `"$"` if the parser has reached
	        // the end of the source string. A token may be a string, number, `null`
	        // literal, or Boolean literal.
	        var lex = function () {
	          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
	          while (Index < length) {
	            charCode = source.charCodeAt(Index);
	            switch (charCode) {
	              case 9: case 10: case 13: case 32:
	                // Skip whitespace tokens, including tabs, carriage returns, line
	                // feeds, and space characters.
	                Index++;
	                break;
	              case 123: case 125: case 91: case 93: case 58: case 44:
	                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
	                // the current position.
	                value = charIndexBuggy ? source.charAt(Index) : source[Index];
	                Index++;
	                return value;
	              case 34:
	                // `"` delimits a JSON string; advance to the next character and
	                // begin parsing the string. String tokens are prefixed with the
	                // sentinel `@` character to distinguish them from punctuators and
	                // end-of-string tokens.
	                for (value = "@", Index++; Index < length;) {
	                  charCode = source.charCodeAt(Index);
	                  if (charCode < 32) {
	                    // Unescaped ASCII control characters (those with a code unit
	                    // less than the space character) are not permitted.
	                    abort();
	                  } else if (charCode == 92) {
	                    // A reverse solidus (`\`) marks the beginning of an escaped
	                    // control character (including `"`, `\`, and `/`) or Unicode
	                    // escape sequence.
	                    charCode = source.charCodeAt(++Index);
	                    switch (charCode) {
	                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
	                        // Revive escaped control characters.
	                        value += Unescapes[charCode];
	                        Index++;
	                        break;
	                      case 117:
	                        // `\u` marks the beginning of a Unicode escape sequence.
	                        // Advance to the first character and validate the
	                        // four-digit code point.
	                        begin = ++Index;
	                        for (position = Index + 4; Index < position; Index++) {
	                          charCode = source.charCodeAt(Index);
	                          // A valid sequence comprises four hexdigits (case-
	                          // insensitive) that form a single hexadecimal value.
	                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
	                            // Invalid Unicode escape sequence.
	                            abort();
	                          }
	                        }
	                        // Revive the escaped character.
	                        value += fromCharCode("0x" + source.slice(begin, Index));
	                        break;
	                      default:
	                        // Invalid escape sequence.
	                        abort();
	                    }
	                  } else {
	                    if (charCode == 34) {
	                      // An unescaped double-quote character marks the end of the
	                      // string.
	                      break;
	                    }
	                    charCode = source.charCodeAt(Index);
	                    begin = Index;
	                    // Optimize for the common case where a string is valid.
	                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
	                      charCode = source.charCodeAt(++Index);
	                    }
	                    // Append the string as-is.
	                    value += source.slice(begin, Index);
	                  }
	                }
	                if (source.charCodeAt(Index) == 34) {
	                  // Advance to the next character and return the revived string.
	                  Index++;
	                  return value;
	                }
	                // Unterminated string.
	                abort();
	              default:
	                // Parse numbers and literals.
	                begin = Index;
	                // Advance past the negative sign, if one is specified.
	                if (charCode == 45) {
	                  isSigned = true;
	                  charCode = source.charCodeAt(++Index);
	                }
	                // Parse an integer or floating-point value.
	                if (charCode >= 48 && charCode <= 57) {
	                  // Leading zeroes are interpreted as octal literals.
	                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
	                    // Illegal octal literal.
	                    abort();
	                  }
	                  isSigned = false;
	                  // Parse the integer component.
	                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
	                  // Floats cannot contain a leading decimal point; however, this
	                  // case is already accounted for by the parser.
	                  if (source.charCodeAt(Index) == 46) {
	                    position = ++Index;
	                    // Parse the decimal component.
	                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
	                    if (position == Index) {
	                      // Illegal trailing decimal.
	                      abort();
	                    }
	                    Index = position;
	                  }
	                  // Parse exponents. The `e` denoting the exponent is
	                  // case-insensitive.
	                  charCode = source.charCodeAt(Index);
	                  if (charCode == 101 || charCode == 69) {
	                    charCode = source.charCodeAt(++Index);
	                    // Skip past the sign following the exponent, if one is
	                    // specified.
	                    if (charCode == 43 || charCode == 45) {
	                      Index++;
	                    }
	                    // Parse the exponential component.
	                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
	                    if (position == Index) {
	                      // Illegal empty exponent.
	                      abort();
	                    }
	                    Index = position;
	                  }
	                  // Coerce the parsed value to a JavaScript number.
	                  return +source.slice(begin, Index);
	                }
	                // A negative sign may only precede numbers.
	                if (isSigned) {
	                  abort();
	                }
	                // `true`, `false`, and `null` literals.
	                if (source.slice(Index, Index + 4) == "true") {
	                  Index += 4;
	                  return true;
	                } else if (source.slice(Index, Index + 5) == "false") {
	                  Index += 5;
	                  return false;
	                } else if (source.slice(Index, Index + 4) == "null") {
	                  Index += 4;
	                  return null;
	                }
	                // Unrecognized token.
	                abort();
	            }
	          }
	          // Return the sentinel `$` character if the parser has reached the end
	          // of the source string.
	          return "$";
	        };

	        // Internal: Parses a JSON `value` token.
	        var get = function (value) {
	          var results, hasMembers;
	          if (value == "$") {
	            // Unexpected end of input.
	            abort();
	          }
	          if (typeof value == "string") {
	            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
	              // Remove the sentinel `@` character.
	              return value.slice(1);
	            }
	            // Parse object and array literals.
	            if (value == "[") {
	              // Parses a JSON array, returning a new JavaScript array.
	              results = [];
	              for (;; hasMembers || (hasMembers = true)) {
	                value = lex();
	                // A closing square bracket marks the end of the array literal.
	                if (value == "]") {
	                  break;
	                }
	                // If the array literal contains elements, the current token
	                // should be a comma separating the previous element from the
	                // next.
	                if (hasMembers) {
	                  if (value == ",") {
	                    value = lex();
	                    if (value == "]") {
	                      // Unexpected trailing `,` in array literal.
	                      abort();
	                    }
	                  } else {
	                    // A `,` must separate each array element.
	                    abort();
	                  }
	                }
	                // Elisions and leading commas are not permitted.
	                if (value == ",") {
	                  abort();
	                }
	                results.push(get(value));
	              }
	              return results;
	            } else if (value == "{") {
	              // Parses a JSON object, returning a new JavaScript object.
	              results = {};
	              for (;; hasMembers || (hasMembers = true)) {
	                value = lex();
	                // A closing curly brace marks the end of the object literal.
	                if (value == "}") {
	                  break;
	                }
	                // If the object literal contains members, the current token
	                // should be a comma separator.
	                if (hasMembers) {
	                  if (value == ",") {
	                    value = lex();
	                    if (value == "}") {
	                      // Unexpected trailing `,` in object literal.
	                      abort();
	                    }
	                  } else {
	                    // A `,` must separate each object member.
	                    abort();
	                  }
	                }
	                // Leading commas are not permitted, object property names must be
	                // double-quoted strings, and a `:` must separate each property
	                // name and value.
	                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
	                  abort();
	                }
	                results[value.slice(1)] = get(lex());
	              }
	              return results;
	            }
	            // Unexpected token encountered.
	            abort();
	          }
	          return value;
	        };

	        // Internal: Updates a traversed object member.
	        var update = function (source, property, callback) {
	          var element = walk(source, property, callback);
	          if (element === undef) {
	            delete source[property];
	          } else {
	            source[property] = element;
	          }
	        };

	        // Internal: Recursively traverses a parsed JSON object, invoking the
	        // `callback` function for each value. This is an implementation of the
	        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
	        var walk = function (source, property, callback) {
	          var value = source[property], length;
	          if (typeof value == "object" && value) {
	            // `forEach` can't be used to traverse an array in Opera <= 8.54
	            // because its `Object#hasOwnProperty` implementation returns `false`
	            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
	            if (getClass.call(value) == arrayClass) {
	              for (length = value.length; length--;) {
	                update(value, length, callback);
	              }
	            } else {
	              forEach(value, function (property) {
	                update(value, property, callback);
	              });
	            }
	          }
	          return callback.call(source, property, value);
	        };

	        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
	        exports.parse = function (source, callback) {
	          var result, value;
	          Index = 0;
	          Source = "" + source;
	          result = get(lex());
	          // If a JSON string contains multiple tokens, it is invalid.
	          if (lex() != "$") {
	            abort();
	          }
	          // Reset the parser state.
	          Index = Source = null;
	          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
	        };
	      }
	    }

	    exports["runInContext"] = runInContext;
	    return exports;
	  }

	  if (freeExports && !isLoader) {
	    // Export for CommonJS environments.
	    runInContext(root, freeExports);
	  } else {
	    // Export for web browsers and JavaScript engines.
	    var nativeJSON = root.JSON,
	        previousJSON = root["JSON3"],
	        isRestored = false;

	    var JSON3 = runInContext(root, (root["JSON3"] = {
	      // Public: Restores the original value of the global `JSON` object and
	      // returns a reference to the `JSON3` object.
	      "noConflict": function () {
	        if (!isRestored) {
	          isRestored = true;
	          root.JSON = nativeJSON;
	          root["JSON3"] = previousJSON;
	          nativeJSON = previousJSON = null;
	        }
	        return JSON3;
	      }
	    }));

	    root.JSON = {
	      "parse": JSON3.parse,
	      "stringify": JSON3.stringify
	    };
	  }

	  // Export for asynchronous module loaders.
	  if (isLoader) {
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	      return JSON3;
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }
	}).call(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)(module)))

/***/ },
/* 145 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ },
/* 146 */
/***/ function(module, exports) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 147 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Emitter`.
	 */

	module.exports = Emitter;

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};

	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks[event] = this._callbacks[event] || [])
	    .push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  var self = this;
	  this._callbacks = this._callbacks || {};

	  function on() {
	    self.off(event, on);
	    fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }

	  // specific event
	  var callbacks = this._callbacks[event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks[event];
	    return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks[event];

	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks[event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	/*global Blob,File*/

	/**
	 * Module requirements
	 */

	var isArray = __webpack_require__(146);
	var isBuf = __webpack_require__(149);

	/**
	 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
	 * Anything with blobs or files should be fed through removeBlobs before coming
	 * here.
	 *
	 * @param {Object} packet - socket.io event packet
	 * @return {Object} with deconstructed packet and list of buffers
	 * @api public
	 */

	exports.deconstructPacket = function(packet){
	  var buffers = [];
	  var packetData = packet.data;

	  function _deconstructPacket(data) {
	    if (!data) return data;

	    if (isBuf(data)) {
	      var placeholder = { _placeholder: true, num: buffers.length };
	      buffers.push(data);
	      return placeholder;
	    } else if (isArray(data)) {
	      var newData = new Array(data.length);
	      for (var i = 0; i < data.length; i++) {
	        newData[i] = _deconstructPacket(data[i]);
	      }
	      return newData;
	    } else if ('object' == typeof data && !(data instanceof Date)) {
	      var newData = {};
	      for (var key in data) {
	        newData[key] = _deconstructPacket(data[key]);
	      }
	      return newData;
	    }
	    return data;
	  }

	  var pack = packet;
	  pack.data = _deconstructPacket(packetData);
	  pack.attachments = buffers.length; // number of binary 'attachments'
	  return {packet: pack, buffers: buffers};
	};

	/**
	 * Reconstructs a binary packet from its placeholder packet and buffers
	 *
	 * @param {Object} packet - event packet with placeholders
	 * @param {Array} buffers - binary buffers to put in placeholder positions
	 * @return {Object} reconstructed packet
	 * @api public
	 */

	exports.reconstructPacket = function(packet, buffers) {
	  var curPlaceHolder = 0;

	  function _reconstructPacket(data) {
	    if (data && data._placeholder) {
	      var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
	      return buf;
	    } else if (isArray(data)) {
	      for (var i = 0; i < data.length; i++) {
	        data[i] = _reconstructPacket(data[i]);
	      }
	      return data;
	    } else if (data && 'object' == typeof data) {
	      for (var key in data) {
	        data[key] = _reconstructPacket(data[key]);
	      }
	      return data;
	    }
	    return data;
	  }

	  packet.data = _reconstructPacket(packet.data);
	  packet.attachments = undefined; // no longer useful
	  return packet;
	};

	/**
	 * Asynchronously removes Blobs or Files from data via
	 * FileReader's readAsArrayBuffer method. Used before encoding
	 * data as msgpack. Calls callback with the blobless data.
	 *
	 * @param {Object} data
	 * @param {Function} callback
	 * @api private
	 */

	exports.removeBlobs = function(data, callback) {
	  function _removeBlobs(obj, curKey, containingObject) {
	    if (!obj) return obj;

	    // convert any blob
	    if ((global.Blob && obj instanceof Blob) ||
	        (global.File && obj instanceof File)) {
	      pendingBlobs++;

	      // async filereader
	      var fileReader = new FileReader();
	      fileReader.onload = function() { // this.result == arraybuffer
	        if (containingObject) {
	          containingObject[curKey] = this.result;
	        }
	        else {
	          bloblessData = this.result;
	        }

	        // if nothing pending its callback time
	        if(! --pendingBlobs) {
	          callback(bloblessData);
	        }
	      };

	      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
	    } else if (isArray(obj)) { // handle array
	      for (var i = 0; i < obj.length; i++) {
	        _removeBlobs(obj[i], i, obj);
	      }
	    } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
	      for (var key in obj) {
	        _removeBlobs(obj[key], key, obj);
	      }
	    }
	  }

	  var pendingBlobs = 0;
	  var bloblessData = data;
	  _removeBlobs(bloblessData);
	  if (!pendingBlobs) {
	    callback(bloblessData);
	  }
	};


/***/ },
/* 149 */
/***/ function(module, exports) {

	
	module.exports = isBuf;

	/**
	 * Returns true if obj is a buffer or an arraybuffer.
	 *
	 * @api private
	 */

	function isBuf(obj) {
	  return (global.Buffer && global.Buffer.isBuffer(obj)) ||
	         (global.ArrayBuffer && obj instanceof ArrayBuffer);
	}


/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var eio = __webpack_require__(151);
	var Socket = __webpack_require__(167);
	var Emitter = __webpack_require__(168);
	var parser = __webpack_require__(143);
	var on = __webpack_require__(170);
	var bind = __webpack_require__(171);
	var debug = __webpack_require__(23)('socket.io-client:manager');
	var indexOf = __webpack_require__(165);
	var Backoff = __webpack_require__(173);

	/**
	 * IE6+ hasOwnProperty
	 */

	var has = Object.prototype.hasOwnProperty;

	/**
	 * Module exports
	 */

	module.exports = Manager;

	/**
	 * `Manager` constructor.
	 *
	 * @param {String} engine instance or engine uri/opts
	 * @param {Object} options
	 * @api public
	 */

	function Manager(uri, opts){
	  if (!(this instanceof Manager)) return new Manager(uri, opts);
	  if (uri && ('object' == typeof uri)) {
	    opts = uri;
	    uri = undefined;
	  }
	  opts = opts || {};

	  opts.path = opts.path || '/socket.io';
	  this.nsps = {};
	  this.subs = [];
	  this.opts = opts;
	  this.reconnection(opts.reconnection !== false);
	  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
	  this.reconnectionDelay(opts.reconnectionDelay || 1000);
	  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
	  this.randomizationFactor(opts.randomizationFactor || 0.5);
	  this.backoff = new Backoff({
	    min: this.reconnectionDelay(),
	    max: this.reconnectionDelayMax(),
	    jitter: this.randomizationFactor()
	  });
	  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
	  this.readyState = 'closed';
	  this.uri = uri;
	  this.connecting = [];
	  this.lastPing = null;
	  this.encoding = false;
	  this.packetBuffer = [];
	  this.encoder = new parser.Encoder();
	  this.decoder = new parser.Decoder();
	  this.autoConnect = opts.autoConnect !== false;
	  if (this.autoConnect) this.open();
	}

	/**
	 * Propagate given event to sockets and emit on `this`
	 *
	 * @api private
	 */

	Manager.prototype.emitAll = function() {
	  this.emit.apply(this, arguments);
	  for (var nsp in this.nsps) {
	    if (has.call(this.nsps, nsp)) {
	      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
	    }
	  }
	};

	/**
	 * Update `socket.id` of all sockets
	 *
	 * @api private
	 */

	Manager.prototype.updateSocketIds = function(){
	  for (var nsp in this.nsps) {
	    if (has.call(this.nsps, nsp)) {
	      this.nsps[nsp].id = this.engine.id;
	    }
	  }
	};

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Manager.prototype);

	/**
	 * Sets the `reconnection` config.
	 *
	 * @param {Boolean} true/false if it should automatically reconnect
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnection = function(v){
	  if (!arguments.length) return this._reconnection;
	  this._reconnection = !!v;
	  return this;
	};

	/**
	 * Sets the reconnection attempts config.
	 *
	 * @param {Number} max reconnection attempts before giving up
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionAttempts = function(v){
	  if (!arguments.length) return this._reconnectionAttempts;
	  this._reconnectionAttempts = v;
	  return this;
	};

	/**
	 * Sets the delay between reconnections.
	 *
	 * @param {Number} delay
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionDelay = function(v){
	  if (!arguments.length) return this._reconnectionDelay;
	  this._reconnectionDelay = v;
	  this.backoff && this.backoff.setMin(v);
	  return this;
	};

	Manager.prototype.randomizationFactor = function(v){
	  if (!arguments.length) return this._randomizationFactor;
	  this._randomizationFactor = v;
	  this.backoff && this.backoff.setJitter(v);
	  return this;
	};

	/**
	 * Sets the maximum delay between reconnections.
	 *
	 * @param {Number} delay
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionDelayMax = function(v){
	  if (!arguments.length) return this._reconnectionDelayMax;
	  this._reconnectionDelayMax = v;
	  this.backoff && this.backoff.setMax(v);
	  return this;
	};

	/**
	 * Sets the connection timeout. `false` to disable
	 *
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.timeout = function(v){
	  if (!arguments.length) return this._timeout;
	  this._timeout = v;
	  return this;
	};

	/**
	 * Starts trying to reconnect if reconnection is enabled and we have not
	 * started reconnecting yet
	 *
	 * @api private
	 */

	Manager.prototype.maybeReconnectOnOpen = function() {
	  // Only try to reconnect if it's the first time we're connecting
	  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
	    // keeps reconnection from firing twice for the same reconnection loop
	    this.reconnect();
	  }
	};


	/**
	 * Sets the current transport `socket`.
	 *
	 * @param {Function} optional, callback
	 * @return {Manager} self
	 * @api public
	 */

	Manager.prototype.open =
	Manager.prototype.connect = function(fn){
	  debug('readyState %s', this.readyState);
	  if (~this.readyState.indexOf('open')) return this;

	  debug('opening %s', this.uri);
	  this.engine = eio(this.uri, this.opts);
	  var socket = this.engine;
	  var self = this;
	  this.readyState = 'opening';
	  this.skipReconnect = false;

	  // emit `open`
	  var openSub = on(socket, 'open', function() {
	    self.onopen();
	    fn && fn();
	  });

	  // emit `connect_error`
	  var errorSub = on(socket, 'error', function(data){
	    debug('connect_error');
	    self.cleanup();
	    self.readyState = 'closed';
	    self.emitAll('connect_error', data);
	    if (fn) {
	      var err = new Error('Connection error');
	      err.data = data;
	      fn(err);
	    } else {
	      // Only do this if there is no fn to handle the error
	      self.maybeReconnectOnOpen();
	    }
	  });

	  // emit `connect_timeout`
	  if (false !== this._timeout) {
	    var timeout = this._timeout;
	    debug('connect attempt will timeout after %d', timeout);

	    // set timer
	    var timer = setTimeout(function(){
	      debug('connect attempt timed out after %d', timeout);
	      openSub.destroy();
	      socket.close();
	      socket.emit('error', 'timeout');
	      self.emitAll('connect_timeout', timeout);
	    }, timeout);

	    this.subs.push({
	      destroy: function(){
	        clearTimeout(timer);
	      }
	    });
	  }

	  this.subs.push(openSub);
	  this.subs.push(errorSub);

	  return this;
	};

	/**
	 * Called upon transport open.
	 *
	 * @api private
	 */

	Manager.prototype.onopen = function(){
	  debug('open');

	  // clear old subs
	  this.cleanup();

	  // mark as open
	  this.readyState = 'open';
	  this.emit('open');

	  // add new subs
	  var socket = this.engine;
	  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
	  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
	  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
	  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
	  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
	  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
	};

	/**
	 * Called upon a ping.
	 *
	 * @api private
	 */

	Manager.prototype.onping = function(){
	  this.lastPing = new Date;
	  this.emitAll('ping');
	};

	/**
	 * Called upon a packet.
	 *
	 * @api private
	 */

	Manager.prototype.onpong = function(){
	  this.emitAll('pong', new Date - this.lastPing);
	};

	/**
	 * Called with data.
	 *
	 * @api private
	 */

	Manager.prototype.ondata = function(data){
	  this.decoder.add(data);
	};

	/**
	 * Called when parser fully decodes a packet.
	 *
	 * @api private
	 */

	Manager.prototype.ondecoded = function(packet) {
	  this.emit('packet', packet);
	};

	/**
	 * Called upon socket error.
	 *
	 * @api private
	 */

	Manager.prototype.onerror = function(err){
	  debug('error', err);
	  this.emitAll('error', err);
	};

	/**
	 * Creates a new socket for the given `nsp`.
	 *
	 * @return {Socket}
	 * @api public
	 */

	Manager.prototype.socket = function(nsp){
	  var socket = this.nsps[nsp];
	  if (!socket) {
	    socket = new Socket(this, nsp);
	    this.nsps[nsp] = socket;
	    var self = this;
	    socket.on('connecting', onConnecting);
	    socket.on('connect', function(){
	      socket.id = self.engine.id;
	    });

	    if (this.autoConnect) {
	      // manually call here since connecting evnet is fired before listening
	      onConnecting();
	    }
	  }

	  function onConnecting() {
	    if (!~indexOf(self.connecting, socket)) {
	      self.connecting.push(socket);
	    }
	  }

	  return socket;
	};

	/**
	 * Called upon a socket close.
	 *
	 * @param {Socket} socket
	 */

	Manager.prototype.destroy = function(socket){
	  var index = indexOf(this.connecting, socket);
	  if (~index) this.connecting.splice(index, 1);
	  if (this.connecting.length) return;

	  this.close();
	};

	/**
	 * Writes a packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Manager.prototype.packet = function(packet){
	  debug('writing packet %j', packet);
	  var self = this;

	  if (!self.encoding) {
	    // encode, then write to engine with result
	    self.encoding = true;
	    this.encoder.encode(packet, function(encodedPackets) {
	      for (var i = 0; i < encodedPackets.length; i++) {
	        self.engine.write(encodedPackets[i], packet.options);
	      }
	      self.encoding = false;
	      self.processPacketQueue();
	    });
	  } else { // add packet to the queue
	    self.packetBuffer.push(packet);
	  }
	};

	/**
	 * If packet buffer is non-empty, begins encoding the
	 * next packet in line.
	 *
	 * @api private
	 */

	Manager.prototype.processPacketQueue = function() {
	  if (this.packetBuffer.length > 0 && !this.encoding) {
	    var pack = this.packetBuffer.shift();
	    this.packet(pack);
	  }
	};

	/**
	 * Clean up transport subscriptions and packet buffer.
	 *
	 * @api private
	 */

	Manager.prototype.cleanup = function(){
	  debug('cleanup');

	  var sub;
	  while (sub = this.subs.shift()) sub.destroy();

	  this.packetBuffer = [];
	  this.encoding = false;
	  this.lastPing = null;

	  this.decoder.destroy();
	};

	/**
	 * Close the current socket.
	 *
	 * @api private
	 */

	Manager.prototype.close =
	Manager.prototype.disconnect = function(){
	  debug('disconnect');
	  this.skipReconnect = true;
	  this.reconnecting = false;
	  if ('opening' == this.readyState) {
	    // `onclose` will not fire because
	    // an open event never happened
	    this.cleanup();
	  }
	  this.backoff.reset();
	  this.readyState = 'closed';
	  if (this.engine) this.engine.close();
	};

	/**
	 * Called upon engine close.
	 *
	 * @api private
	 */

	Manager.prototype.onclose = function(reason){
	  debug('onclose');

	  this.cleanup();
	  this.backoff.reset();
	  this.readyState = 'closed';
	  this.emit('close', reason);

	  if (this._reconnection && !this.skipReconnect) {
	    this.reconnect();
	  }
	};

	/**
	 * Attempt a reconnection.
	 *
	 * @api private
	 */

	Manager.prototype.reconnect = function(){
	  if (this.reconnecting || this.skipReconnect) return this;

	  var self = this;

	  if (this.backoff.attempts >= this._reconnectionAttempts) {
	    debug('reconnect failed');
	    this.backoff.reset();
	    this.emitAll('reconnect_failed');
	    this.reconnecting = false;
	  } else {
	    var delay = this.backoff.duration();
	    debug('will wait %dms before reconnect attempt', delay);

	    this.reconnecting = true;
	    var timer = setTimeout(function(){
	      if (self.skipReconnect) return;

	      debug('attempting reconnect');
	      self.emitAll('reconnect_attempt', self.backoff.attempts);
	      self.emitAll('reconnecting', self.backoff.attempts);

	      // check again for the case socket closed in above events
	      if (self.skipReconnect) return;

	      self.open(function(err){
	        if (err) {
	          debug('reconnect attempt error');
	          self.reconnecting = false;
	          self.reconnect();
	          self.emitAll('reconnect_error', err.data);
	        } else {
	          debug('reconnect success');
	          self.onreconnect();
	        }
	      });
	    }, delay);

	    this.subs.push({
	      destroy: function(){
	        clearTimeout(timer);
	      }
	    });
	  }
	};

	/**
	 * Called upon successful reconnect.
	 *
	 * @api private
	 */

	Manager.prototype.onreconnect = function(){
	  var attempt = this.backoff.attempts;
	  this.reconnecting = false;
	  this.backoff.reset();
	  this.updateSocketIds();
	  this.emitAll('reconnect', attempt);
	};


/***/ },
/* 151 */
/***/ function(module, exports, __webpack_require__) {

	
	module.exports =  __webpack_require__(152);


/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	
	module.exports = __webpack_require__(153);

	/**
	 * Exports parser
	 *
	 * @api public
	 *
	 */
	module.exports.parser = __webpack_require__(102);


/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var transports = __webpack_require__(154);
	var Emitter = __webpack_require__(147);
	var debug = __webpack_require__(23)('engine.io-client:socket');
	var index = __webpack_require__(165);
	var parser = __webpack_require__(102);
	var parseuri = __webpack_require__(142);
	var parsejson = __webpack_require__(166);
	var parseqs = __webpack_require__(160);

	/**
	 * Module exports.
	 */

	module.exports = Socket;

	/**
	 * Noop function.
	 *
	 * @api private
	 */

	function noop(){}

	/**
	 * Socket constructor.
	 *
	 * @param {String|Object} uri or options
	 * @param {Object} options
	 * @api public
	 */

	function Socket(uri, opts){
	  if (!(this instanceof Socket)) return new Socket(uri, opts);

	  opts = opts || {};

	  if (uri && 'object' == typeof uri) {
	    opts = uri;
	    uri = null;
	  }

	  if (uri) {
	    uri = parseuri(uri);
	    opts.hostname = uri.host;
	    opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
	    opts.port = uri.port;
	    if (uri.query) opts.query = uri.query;
	  } else if (opts.host) {
	    opts.hostname = parseuri(opts.host).host;
	  }

	  this.secure = null != opts.secure ? opts.secure :
	    (global.location && 'https:' == location.protocol);

	  if (opts.hostname && !opts.port) {
	    // if no port is specified manually, use the protocol default
	    opts.port = this.secure ? '443' : '80';
	  }

	  this.agent = opts.agent || false;
	  this.hostname = opts.hostname ||
	    (global.location ? location.hostname : 'localhost');
	  this.port = opts.port || (global.location && location.port ?
	       location.port :
	       (this.secure ? 443 : 80));
	  this.query = opts.query || {};
	  if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
	  this.upgrade = false !== opts.upgrade;
	  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
	  this.forceJSONP = !!opts.forceJSONP;
	  this.jsonp = false !== opts.jsonp;
	  this.forceBase64 = !!opts.forceBase64;
	  this.enablesXDR = !!opts.enablesXDR;
	  this.timestampParam = opts.timestampParam || 't';
	  this.timestampRequests = opts.timestampRequests;
	  this.transports = opts.transports || ['polling', 'websocket'];
	  this.readyState = '';
	  this.writeBuffer = [];
	  this.policyPort = opts.policyPort || 843;
	  this.rememberUpgrade = opts.rememberUpgrade || false;
	  this.binaryType = null;
	  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
	  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

	  if (true === this.perMessageDeflate) this.perMessageDeflate = {};
	  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
	    this.perMessageDeflate.threshold = 1024;
	  }

	  // SSL options for Node.js client
	  this.pfx = opts.pfx || null;
	  this.key = opts.key || null;
	  this.passphrase = opts.passphrase || null;
	  this.cert = opts.cert || null;
	  this.ca = opts.ca || null;
	  this.ciphers = opts.ciphers || null;
	  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? null : opts.rejectUnauthorized;

	  // other options for Node.js client
	  var freeGlobal = typeof global == 'object' && global;
	  if (freeGlobal.global === freeGlobal) {
	    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
	      this.extraHeaders = opts.extraHeaders;
	    }
	  }

	  this.open();
	}

	Socket.priorWebsocketSuccess = false;

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Socket.prototype);

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	Socket.protocol = parser.protocol; // this is an int

	/**
	 * Expose deps for legacy compatibility
	 * and standalone browser access.
	 */

	Socket.Socket = Socket;
	Socket.Transport = __webpack_require__(159);
	Socket.transports = __webpack_require__(154);
	Socket.parser = __webpack_require__(102);

	/**
	 * Creates transport of the given type.
	 *
	 * @param {String} transport name
	 * @return {Transport}
	 * @api private
	 */

	Socket.prototype.createTransport = function (name) {
	  debug('creating transport "%s"', name);
	  var query = clone(this.query);

	  // append engine.io protocol identifier
	  query.EIO = parser.protocol;

	  // transport name
	  query.transport = name;

	  // session id if we already have one
	  if (this.id) query.sid = this.id;

	  var transport = new transports[name]({
	    agent: this.agent,
	    hostname: this.hostname,
	    port: this.port,
	    secure: this.secure,
	    path: this.path,
	    query: query,
	    forceJSONP: this.forceJSONP,
	    jsonp: this.jsonp,
	    forceBase64: this.forceBase64,
	    enablesXDR: this.enablesXDR,
	    timestampRequests: this.timestampRequests,
	    timestampParam: this.timestampParam,
	    policyPort: this.policyPort,
	    socket: this,
	    pfx: this.pfx,
	    key: this.key,
	    passphrase: this.passphrase,
	    cert: this.cert,
	    ca: this.ca,
	    ciphers: this.ciphers,
	    rejectUnauthorized: this.rejectUnauthorized,
	    perMessageDeflate: this.perMessageDeflate,
	    extraHeaders: this.extraHeaders
	  });

	  return transport;
	};

	function clone (obj) {
	  var o = {};
	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      o[i] = obj[i];
	    }
	  }
	  return o;
	}

	/**
	 * Initializes transport to use and starts probe.
	 *
	 * @api private
	 */
	Socket.prototype.open = function () {
	  var transport;
	  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
	    transport = 'websocket';
	  } else if (0 === this.transports.length) {
	    // Emit error on next tick so it can be listened to
	    var self = this;
	    setTimeout(function() {
	      self.emit('error', 'No transports available');
	    }, 0);
	    return;
	  } else {
	    transport = this.transports[0];
	  }
	  this.readyState = 'opening';

	  // Retry with the next transport if the transport is disabled (jsonp: false)
	  try {
	    transport = this.createTransport(transport);
	  } catch (e) {
	    this.transports.shift();
	    this.open();
	    return;
	  }

	  transport.open();
	  this.setTransport(transport);
	};

	/**
	 * Sets the current transport. Disables the existing one (if any).
	 *
	 * @api private
	 */

	Socket.prototype.setTransport = function(transport){
	  debug('setting transport %s', transport.name);
	  var self = this;

	  if (this.transport) {
	    debug('clearing existing transport %s', this.transport.name);
	    this.transport.removeAllListeners();
	  }

	  // set up transport
	  this.transport = transport;

	  // set up transport listeners
	  transport
	  .on('drain', function(){
	    self.onDrain();
	  })
	  .on('packet', function(packet){
	    self.onPacket(packet);
	  })
	  .on('error', function(e){
	    self.onError(e);
	  })
	  .on('close', function(){
	    self.onClose('transport close');
	  });
	};

	/**
	 * Probes a transport.
	 *
	 * @param {String} transport name
	 * @api private
	 */

	Socket.prototype.probe = function (name) {
	  debug('probing transport "%s"', name);
	  var transport = this.createTransport(name, { probe: 1 })
	    , failed = false
	    , self = this;

	  Socket.priorWebsocketSuccess = false;

	  function onTransportOpen(){
	    if (self.onlyBinaryUpgrades) {
	      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
	      failed = failed || upgradeLosesBinary;
	    }
	    if (failed) return;

	    debug('probe transport "%s" opened', name);
	    transport.send([{ type: 'ping', data: 'probe' }]);
	    transport.once('packet', function (msg) {
	      if (failed) return;
	      if ('pong' == msg.type && 'probe' == msg.data) {
	        debug('probe transport "%s" pong', name);
	        self.upgrading = true;
	        self.emit('upgrading', transport);
	        if (!transport) return;
	        Socket.priorWebsocketSuccess = 'websocket' == transport.name;

	        debug('pausing current transport "%s"', self.transport.name);
	        self.transport.pause(function () {
	          if (failed) return;
	          if ('closed' == self.readyState) return;
	          debug('changing transport and sending upgrade packet');

	          cleanup();

	          self.setTransport(transport);
	          transport.send([{ type: 'upgrade' }]);
	          self.emit('upgrade', transport);
	          transport = null;
	          self.upgrading = false;
	          self.flush();
	        });
	      } else {
	        debug('probe transport "%s" failed', name);
	        var err = new Error('probe error');
	        err.transport = transport.name;
	        self.emit('upgradeError', err);
	      }
	    });
	  }

	  function freezeTransport() {
	    if (failed) return;

	    // Any callback called by transport should be ignored since now
	    failed = true;

	    cleanup();

	    transport.close();
	    transport = null;
	  }

	  //Handle any error that happens while probing
	  function onerror(err) {
	    var error = new Error('probe error: ' + err);
	    error.transport = transport.name;

	    freezeTransport();

	    debug('probe transport "%s" failed because of error: %s', name, err);

	    self.emit('upgradeError', error);
	  }

	  function onTransportClose(){
	    onerror("transport closed");
	  }

	  //When the socket is closed while we're probing
	  function onclose(){
	    onerror("socket closed");
	  }

	  //When the socket is upgraded while we're probing
	  function onupgrade(to){
	    if (transport && to.name != transport.name) {
	      debug('"%s" works - aborting "%s"', to.name, transport.name);
	      freezeTransport();
	    }
	  }

	  //Remove all listeners on the transport and on self
	  function cleanup(){
	    transport.removeListener('open', onTransportOpen);
	    transport.removeListener('error', onerror);
	    transport.removeListener('close', onTransportClose);
	    self.removeListener('close', onclose);
	    self.removeListener('upgrading', onupgrade);
	  }

	  transport.once('open', onTransportOpen);
	  transport.once('error', onerror);
	  transport.once('close', onTransportClose);

	  this.once('close', onclose);
	  this.once('upgrading', onupgrade);

	  transport.open();

	};

	/**
	 * Called when connection is deemed open.
	 *
	 * @api public
	 */

	Socket.prototype.onOpen = function () {
	  debug('socket open');
	  this.readyState = 'open';
	  Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
	  this.emit('open');
	  this.flush();

	  // we check for `readyState` in case an `open`
	  // listener already closed the socket
	  if ('open' == this.readyState && this.upgrade && this.transport.pause) {
	    debug('starting upgrade probes');
	    for (var i = 0, l = this.upgrades.length; i < l; i++) {
	      this.probe(this.upgrades[i]);
	    }
	  }
	};

	/**
	 * Handles a packet.
	 *
	 * @api private
	 */

	Socket.prototype.onPacket = function (packet) {
	  if ('opening' == this.readyState || 'open' == this.readyState) {
	    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

	    this.emit('packet', packet);

	    // Socket is live - any packet counts
	    this.emit('heartbeat');

	    switch (packet.type) {
	      case 'open':
	        this.onHandshake(parsejson(packet.data));
	        break;

	      case 'pong':
	        this.setPing();
	        this.emit('pong');
	        break;

	      case 'error':
	        var err = new Error('server error');
	        err.code = packet.data;
	        this.onError(err);
	        break;

	      case 'message':
	        this.emit('data', packet.data);
	        this.emit('message', packet.data);
	        break;
	    }
	  } else {
	    debug('packet received with socket readyState "%s"', this.readyState);
	  }
	};

	/**
	 * Called upon handshake completion.
	 *
	 * @param {Object} handshake obj
	 * @api private
	 */

	Socket.prototype.onHandshake = function (data) {
	  this.emit('handshake', data);
	  this.id = data.sid;
	  this.transport.query.sid = data.sid;
	  this.upgrades = this.filterUpgrades(data.upgrades);
	  this.pingInterval = data.pingInterval;
	  this.pingTimeout = data.pingTimeout;
	  this.onOpen();
	  // In case open handler closes socket
	  if  ('closed' == this.readyState) return;
	  this.setPing();

	  // Prolong liveness of socket on heartbeat
	  this.removeListener('heartbeat', this.onHeartbeat);
	  this.on('heartbeat', this.onHeartbeat);
	};

	/**
	 * Resets ping timeout.
	 *
	 * @api private
	 */

	Socket.prototype.onHeartbeat = function (timeout) {
	  clearTimeout(this.pingTimeoutTimer);
	  var self = this;
	  self.pingTimeoutTimer = setTimeout(function () {
	    if ('closed' == self.readyState) return;
	    self.onClose('ping timeout');
	  }, timeout || (self.pingInterval + self.pingTimeout));
	};

	/**
	 * Pings server every `this.pingInterval` and expects response
	 * within `this.pingTimeout` or closes connection.
	 *
	 * @api private
	 */

	Socket.prototype.setPing = function () {
	  var self = this;
	  clearTimeout(self.pingIntervalTimer);
	  self.pingIntervalTimer = setTimeout(function () {
	    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
	    self.ping();
	    self.onHeartbeat(self.pingTimeout);
	  }, self.pingInterval);
	};

	/**
	* Sends a ping packet.
	*
	* @api private
	*/

	Socket.prototype.ping = function () {
	  var self = this;
	  this.sendPacket('ping', function(){
	    self.emit('ping');
	  });
	};

	/**
	 * Called on `drain` event
	 *
	 * @api private
	 */

	Socket.prototype.onDrain = function() {
	  this.writeBuffer.splice(0, this.prevBufferLen);

	  // setting prevBufferLen = 0 is very important
	  // for example, when upgrading, upgrade packet is sent over,
	  // and a nonzero prevBufferLen could cause problems on `drain`
	  this.prevBufferLen = 0;

	  if (0 === this.writeBuffer.length) {
	    this.emit('drain');
	  } else {
	    this.flush();
	  }
	};

	/**
	 * Flush write buffers.
	 *
	 * @api private
	 */

	Socket.prototype.flush = function () {
	  if ('closed' != this.readyState && this.transport.writable &&
	    !this.upgrading && this.writeBuffer.length) {
	    debug('flushing %d packets in socket', this.writeBuffer.length);
	    this.transport.send(this.writeBuffer);
	    // keep track of current length of writeBuffer
	    // splice writeBuffer and callbackBuffer on `drain`
	    this.prevBufferLen = this.writeBuffer.length;
	    this.emit('flush');
	  }
	};

	/**
	 * Sends a message.
	 *
	 * @param {String} message.
	 * @param {Function} callback function.
	 * @param {Object} options.
	 * @return {Socket} for chaining.
	 * @api public
	 */

	Socket.prototype.write =
	Socket.prototype.send = function (msg, options, fn) {
	  this.sendPacket('message', msg, options, fn);
	  return this;
	};

	/**
	 * Sends a packet.
	 *
	 * @param {String} packet type.
	 * @param {String} data.
	 * @param {Object} options.
	 * @param {Function} callback function.
	 * @api private
	 */

	Socket.prototype.sendPacket = function (type, data, options, fn) {
	  if('function' == typeof data) {
	    fn = data;
	    data = undefined;
	  }

	  if ('function' == typeof options) {
	    fn = options;
	    options = null;
	  }

	  if ('closing' == this.readyState || 'closed' == this.readyState) {
	    return;
	  }

	  options = options || {};
	  options.compress = false !== options.compress;

	  var packet = {
	    type: type,
	    data: data,
	    options: options
	  };
	  this.emit('packetCreate', packet);
	  this.writeBuffer.push(packet);
	  if (fn) this.once('flush', fn);
	  this.flush();
	};

	/**
	 * Closes the connection.
	 *
	 * @api private
	 */

	Socket.prototype.close = function () {
	  if ('opening' == this.readyState || 'open' == this.readyState) {
	    this.readyState = 'closing';

	    var self = this;

	    if (this.writeBuffer.length) {
	      this.once('drain', function() {
	        if (this.upgrading) {
	          waitForUpgrade();
	        } else {
	          close();
	        }
	      });
	    } else if (this.upgrading) {
	      waitForUpgrade();
	    } else {
	      close();
	    }
	  }

	  function close() {
	    self.onClose('forced close');
	    debug('socket closing - telling transport to close');
	    self.transport.close();
	  }

	  function cleanupAndClose() {
	    self.removeListener('upgrade', cleanupAndClose);
	    self.removeListener('upgradeError', cleanupAndClose);
	    close();
	  }

	  function waitForUpgrade() {
	    // wait for upgrade to finish since we can't send packets while pausing a transport
	    self.once('upgrade', cleanupAndClose);
	    self.once('upgradeError', cleanupAndClose);
	  }

	  return this;
	};

	/**
	 * Called upon transport error
	 *
	 * @api private
	 */

	Socket.prototype.onError = function (err) {
	  debug('socket error %j', err);
	  Socket.priorWebsocketSuccess = false;
	  this.emit('error', err);
	  this.onClose('transport error', err);
	};

	/**
	 * Called upon transport close.
	 *
	 * @api private
	 */

	Socket.prototype.onClose = function (reason, desc) {
	  if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
	    debug('socket close with reason: "%s"', reason);
	    var self = this;

	    // clear timers
	    clearTimeout(this.pingIntervalTimer);
	    clearTimeout(this.pingTimeoutTimer);

	    // stop event from firing again for transport
	    this.transport.removeAllListeners('close');

	    // ensure transport won't stay open
	    this.transport.close();

	    // ignore further transport communication
	    this.transport.removeAllListeners();

	    // set ready state
	    this.readyState = 'closed';

	    // clear session id
	    this.id = null;

	    // emit close event
	    this.emit('close', reason, desc);

	    // clean buffers after, so users can still
	    // grab the buffers on `close` event
	    self.writeBuffer = [];
	    self.prevBufferLen = 0;
	  }
	};

	/**
	 * Filters upgrades, returning only those matching client transports.
	 *
	 * @param {Array} server upgrades
	 * @api private
	 *
	 */

	Socket.prototype.filterUpgrades = function (upgrades) {
	  var filteredUpgrades = [];
	  for (var i = 0, j = upgrades.length; i<j; i++) {
	    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
	  }
	  return filteredUpgrades;
	};


/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies
	 */

	var XMLHttpRequest = __webpack_require__(155);
	var XHR = __webpack_require__(157);
	var JSONP = __webpack_require__(163);
	var websocket = __webpack_require__(164);

	/**
	 * Export transports.
	 */

	exports.polling = polling;
	exports.websocket = websocket;

	/**
	 * Polling transport polymorphic constructor.
	 * Decides on xhr vs jsonp based on feature detection.
	 *
	 * @api private
	 */

	function polling(opts){
	  var xhr;
	  var xd = false;
	  var xs = false;
	  var jsonp = false !== opts.jsonp;

	  if (global.location) {
	    var isSSL = 'https:' == location.protocol;
	    var port = location.port;

	    // some user agents have empty `location.port`
	    if (!port) {
	      port = isSSL ? 443 : 80;
	    }

	    xd = opts.hostname != location.hostname || port != opts.port;
	    xs = opts.secure != isSSL;
	  }

	  opts.xdomain = xd;
	  opts.xscheme = xs;
	  xhr = new XMLHttpRequest(opts);

	  if ('open' in xhr && !opts.forceJSONP) {
	    return new XHR(opts);
	  } else {
	    if (!jsonp) throw new Error('JSONP disabled');
	    return new JSONP(opts);
	  }
	}


/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Wrapper for built-in http.js to emulate the browser XMLHttpRequest object.
	 *
	 * This can be used with JS designed for browsers to improve reuse of code and
	 * allow the use of existing libraries.
	 *
	 * Usage: include("XMLHttpRequest.js") and use XMLHttpRequest per W3C specs.
	 *
	 * @author Dan DeFelippi <dan@driverdan.com>
	 * @contributor David Ellis <d.f.ellis@ieee.org>
	 * @license MIT
	 */

	var fs = __webpack_require__(2);
	var Url = __webpack_require__(48);
	var spawn = __webpack_require__(156).spawn;

	/**
	 * Module exports.
	 */

	module.exports = XMLHttpRequest;

	// backwards-compat
	XMLHttpRequest.XMLHttpRequest = XMLHttpRequest;

	/**
	 * `XMLHttpRequest` constructor.
	 *
	 * Supported options for the `opts` object are:
	 *
	 *  - `agent`: An http.Agent instance; http.globalAgent may be used; if 'undefined', agent usage is disabled
	 *
	 * @param {Object} opts optional "options" object
	 */

	function XMLHttpRequest(opts) {
	  /**
	   * Private variables
	   */
	  var self = this;
	  var http = __webpack_require__(30);
	  var https = __webpack_require__(123);

	  // Holds http.js objects
	  var request;
	  var response;

	  // Request settings
	  var settings = {};

	  // Disable header blacklist.
	  // Not part of XHR specs.
	  var disableHeaderCheck = false;

	  // Set some default headers
	  var defaultHeaders = {
	    "User-Agent": "node-XMLHttpRequest",
	    "Accept": "*/*"
	  };

	  var headers = defaultHeaders;

	  // These headers are not user setable.
	  // The following are allowed but banned in the spec:
	  // * user-agent
	  var forbiddenRequestHeaders = [
	    "accept-charset",
	    "accept-encoding",
	    "access-control-request-headers",
	    "access-control-request-method",
	    "connection",
	    "content-length",
	    "content-transfer-encoding",
	    "cookie",
	    "cookie2",
	    "date",
	    "expect",
	    "host",
	    "keep-alive",
	    "origin",
	    "referer",
	    "te",
	    "trailer",
	    "transfer-encoding",
	    "upgrade",
	    "via"
	  ];

	  // These request methods are not allowed
	  var forbiddenRequestMethods = [
	    "TRACE",
	    "TRACK",
	    "CONNECT"
	  ];

	  // Send flag
	  var sendFlag = false;
	  // Error flag, used when errors occur or abort is called
	  var errorFlag = false;

	  // Event listeners
	  var listeners = {};

	  /**
	   * Constants
	   */

	  this.UNSENT = 0;
	  this.OPENED = 1;
	  this.HEADERS_RECEIVED = 2;
	  this.LOADING = 3;
	  this.DONE = 4;

	  /**
	   * Public vars
	   */

	  // Current state
	  this.readyState = this.UNSENT;

	  // default ready state change handler in case one is not set or is set late
	  this.onreadystatechange = null;

	  // Result & response
	  this.responseText = "";
	  this.responseXML = "";
	  this.status = null;
	  this.statusText = null;

	  /**
	   * Private methods
	   */

	  /**
	   * Check if the specified header is allowed.
	   *
	   * @param string header Header to validate
	   * @return boolean False if not allowed, otherwise true
	   */
	  var isAllowedHttpHeader = function(header) {
	    return disableHeaderCheck || (header && forbiddenRequestHeaders.indexOf(header.toLowerCase()) === -1);
	  };

	  /**
	   * Check if the specified method is allowed.
	   *
	   * @param string method Request method to validate
	   * @return boolean False if not allowed, otherwise true
	   */
	  var isAllowedHttpMethod = function(method) {
	    return (method && forbiddenRequestMethods.indexOf(method) === -1);
	  };

	  /**
	   * Public methods
	   */

	  /**
	   * Open the connection. Currently supports local server requests.
	   *
	   * @param string method Connection method (eg GET, POST)
	   * @param string url URL for the connection.
	   * @param boolean async Asynchronous connection. Default is true.
	   * @param string user Username for basic authentication (optional)
	   * @param string password Password for basic authentication (optional)
	   */
	  this.open = function(method, url, async, user, password) {
	    this.abort();
	    errorFlag = false;

	    // Check for valid request method
	    if (!isAllowedHttpMethod(method)) {
	      throw "SecurityError: Request method not allowed";
	    }

	    settings = {
	      "method": method,
	      "url": url.toString(),
	      "async": (typeof async !== "boolean" ? true : async),
	      "user": user || null,
	      "password": password || null
	    };

	    setState(this.OPENED);
	  };

	  /**
	   * Disables or enables isAllowedHttpHeader() check the request. Enabled by default.
	   * This does not conform to the W3C spec.
	   *
	   * @param boolean state Enable or disable header checking.
	   */
	  this.setDisableHeaderCheck = function(state) {
	    disableHeaderCheck = state;
	  };

	  /**
	   * Sets a header for the request.
	   *
	   * @param string header Header name
	   * @param string value Header value
	   * @return boolean Header added
	   */
	  this.setRequestHeader = function(header, value) {
	    if (this.readyState != this.OPENED) {
	      throw "INVALID_STATE_ERR: setRequestHeader can only be called when state is OPEN";
	      return false;
	    }
	    if (!isAllowedHttpHeader(header)) {
	      console.warn('Refused to set unsafe header "' + header + '"');
	      return false;
	    }
	    if (sendFlag) {
	      throw "INVALID_STATE_ERR: send flag is true";
	      return false;
	    }
	    headers[header] = value;
	    return true;
	  };

	  /**
	   * Gets a header from the server response.
	   *
	   * @param string header Name of header to get.
	   * @return string Text of the header or null if it doesn't exist.
	   */
	  this.getResponseHeader = function(header) {
	    if (typeof header === "string"
	      && this.readyState > this.OPENED
	      && response.headers[header.toLowerCase()]
	      && !errorFlag
	    ) {
	      return response.headers[header.toLowerCase()];
	    }

	    return null;
	  };

	  /**
	   * Gets all the response headers.
	   *
	   * @return string A string with all response headers separated by CR+LF
	   */
	  this.getAllResponseHeaders = function() {
	    if (this.readyState < this.HEADERS_RECEIVED || errorFlag) {
	      return "";
	    }
	    var result = "";

	    for (var i in response.headers) {
	      // Cookie headers are excluded
	      if (i !== "set-cookie" && i !== "set-cookie2") {
	        result += i + ": " + response.headers[i] + "\r\n";
	      }
	    }
	    return result.substr(0, result.length - 2);
	  };

	  /**
	   * Gets a request header
	   *
	   * @param string name Name of header to get
	   * @return string Returns the request header or empty string if not set
	   */
	  this.getRequestHeader = function(name) {
	    // @TODO Make this case insensitive
	    if (typeof name === "string" && headers[name]) {
	      return headers[name];
	    }

	    return "";
	  };

	  /**
	   * Sends the request to the server.
	   *
	   * @param string data Optional data to send as request body.
	   */
	  this.send = function(data) {
	    if (this.readyState != this.OPENED) {
	      throw "INVALID_STATE_ERR: connection must be opened before send() is called";
	    }

	    if (sendFlag) {
	      throw "INVALID_STATE_ERR: send has already been called";
	    }

	    var ssl = false, local = false;
	    var url = Url.parse(settings.url);
	    var host;
	    // Determine the server
	    switch (url.protocol) {
	      case 'https:':
	        ssl = true;
	        // SSL & non-SSL both need host, no break here.
	      case 'http:':
	        host = url.hostname;
	        break;

	      case 'file:':
	        local = true;
	        break;

	      case undefined:
	      case '':
	        host = "localhost";
	        break;

	      default:
	        throw "Protocol not supported.";
	    }

	    // Load files off the local filesystem (file://)
	    if (local) {
	      if (settings.method !== "GET") {
	        throw "XMLHttpRequest: Only GET method is supported";
	      }

	      if (settings.async) {
	        fs.readFile(url.pathname, 'utf8', function(error, data) {
	          if (error) {
	            self.handleError(error);
	          } else {
	            self.status = 200;
	            self.responseText = data;
	            setState(self.DONE);
	          }
	        });
	      } else {
	        try {
	          this.responseText = fs.readFileSync(url.pathname, 'utf8');
	          this.status = 200;
	          setState(self.DONE);
	        } catch(e) {
	          this.handleError(e);
	        }
	      }

	      return;
	    }

	    // Default to port 80. If accessing localhost on another port be sure
	    // to use http://localhost:port/path
	    var port = url.port || (ssl ? 443 : 80);
	    // Add query string if one is used
	    var uri = url.pathname + (url.search ? url.search : '');

	    // Set the Host header or the server may reject the request
	    headers["Host"] = host;
	    if (!((ssl && port === 443) || port === 80)) {
	      headers["Host"] += ':' + url.port;
	    }

	    // Set Basic Auth if necessary
	    if (settings.user) {
	      if (typeof settings.password == "undefined") {
	        settings.password = "";
	      }
	      var authBuf = new Buffer(settings.user + ":" + settings.password);
	      headers["Authorization"] = "Basic " + authBuf.toString("base64");
	    }

	    // Set content length header
	    if (settings.method === "GET" || settings.method === "HEAD") {
	      data = null;
	    } else if (data) {
	      headers["Content-Length"] = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);

	      if (!headers["Content-Type"]) {
	        headers["Content-Type"] = "text/plain;charset=UTF-8";
	      }
	    } else if (settings.method === "POST") {
	      // For a post with no data set Content-Length: 0.
	      // This is required by buggy servers that don't meet the specs.
	      headers["Content-Length"] = 0;
	    }

	    var agent = false;
	    if (opts && opts.agent) {
	      agent = opts.agent;
	    }
	    var options = {
	      host: host,
	      port: port,
	      path: uri,
	      method: settings.method,
	      headers: headers,
	      agent: agent
	    };

	    if (ssl) {
	      options.pfx = opts.pfx;
	      options.key = opts.key;
	      options.passphrase = opts.passphrase;
	      options.cert = opts.cert;
	      options.ca = opts.ca;
	      options.ciphers = opts.ciphers;
	      options.rejectUnauthorized = opts.rejectUnauthorized;
	    }

	    // Reset error flag
	    errorFlag = false;

	    // Handle async requests
	    if (settings.async) {
	      // Use the proper protocol
	      var doRequest = ssl ? https.request : http.request;

	      // Request is being sent, set send flag
	      sendFlag = true;

	      // As per spec, this is called here for historical reasons.
	      self.dispatchEvent("readystatechange");

	      // Handler for the response
	      function responseHandler(resp) {
	        // Set response var to the response we got back
	        // This is so it remains accessable outside this scope
	        response = resp;
	        // Check for redirect
	        // @TODO Prevent looped redirects
	        if (response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307) {
	          // Change URL to the redirect location
	          settings.url = response.headers.location;
	          var url = Url.parse(settings.url);
	          // Set host var in case it's used later
	          host = url.hostname;
	          // Options for the new request
	          var newOptions = {
	            hostname: url.hostname,
	            port: url.port,
	            path: url.path,
	            method: response.statusCode === 303 ? 'GET' : settings.method,
	            headers: headers
	          };

	          if (ssl) {
	            options.pfx = opts.pfx;
	            options.key = opts.key;
	            options.passphrase = opts.passphrase;
	            options.cert = opts.cert;
	            options.ca = opts.ca;
	            options.ciphers = opts.ciphers;
	            options.rejectUnauthorized = opts.rejectUnauthorized;
	          }

	          // Issue the new request
	          request = doRequest(newOptions, responseHandler).on('error', errorHandler);
	          request.end();
	          // @TODO Check if an XHR event needs to be fired here
	          return;
	        }

	        response.setEncoding("utf8");

	        setState(self.HEADERS_RECEIVED);
	        self.status = response.statusCode;

	        response.on('data', function(chunk) {
	          // Make sure there's some data
	          if (chunk) {
	            self.responseText += chunk;
	          }
	          // Don't emit state changes if the connection has been aborted.
	          if (sendFlag) {
	            setState(self.LOADING);
	          }
	        });

	        response.on('end', function() {
	          if (sendFlag) {
	            // Discard the 'end' event if the connection has been aborted
	            setState(self.DONE);
	            sendFlag = false;
	          }
	        });

	        response.on('error', function(error) {
	          self.handleError(error);
	        });
	      }

	      // Error handler for the request
	      function errorHandler(error) {
	        self.handleError(error);
	      }

	      // Create the request
	      request = doRequest(options, responseHandler).on('error', errorHandler);

	      // Node 0.4 and later won't accept empty data. Make sure it's needed.
	      if (data) {
	        request.write(data);
	      }

	      request.end();

	      self.dispatchEvent("loadstart");
	    } else { // Synchronous
	      // Create a temporary file for communication with the other Node process
	      var contentFile = ".node-xmlhttprequest-content-" + process.pid;
	      var syncFile = ".node-xmlhttprequest-sync-" + process.pid;
	      fs.writeFileSync(syncFile, "", "utf8");
	      // The async request the other Node process executes
	      var execString = "var http = require('http'), https = require('https'), fs = require('fs');"
	        + "var doRequest = http" + (ssl ? "s" : "") + ".request;"
	        + "var options = " + JSON.stringify(options) + ";"
	        + "var responseText = '';"
	        + "var req = doRequest(options, function(response) {"
	        + "response.setEncoding('utf8');"
	        + "response.on('data', function(chunk) {"
	        + "  responseText += chunk;"
	        + "});"
	        + "response.on('end', function() {"
	        + "fs.writeFileSync('" + contentFile + "', 'NODE-XMLHTTPREQUEST-STATUS:' + response.statusCode + ',' + responseText, 'utf8');"
	        + "fs.unlinkSync('" + syncFile + "');"
	        + "});"
	        + "response.on('error', function(error) {"
	        + "fs.writeFileSync('" + contentFile + "', 'NODE-XMLHTTPREQUEST-ERROR:' + JSON.stringify(error), 'utf8');"
	        + "fs.unlinkSync('" + syncFile + "');"
	        + "});"
	        + "}).on('error', function(error) {"
	        + "fs.writeFileSync('" + contentFile + "', 'NODE-XMLHTTPREQUEST-ERROR:' + JSON.stringify(error), 'utf8');"
	        + "fs.unlinkSync('" + syncFile + "');"
	        + "});"
	        + (data ? "req.write('" + data.replace(/'/g, "\\'") + "');":"")
	        + "req.end();";
	      // Start the other Node Process, executing this string
	      var syncProc = spawn(process.argv[0], ["-e", execString]);
	      var statusText;
	      while(fs.existsSync(syncFile)) {
	        // Wait while the sync file is empty
	      }
	      self.responseText = fs.readFileSync(contentFile, 'utf8');
	      // Kill the child process once the file has data
	      syncProc.stdin.end();
	      // Remove the temporary file
	      fs.unlinkSync(contentFile);
	      if (self.responseText.match(/^NODE-XMLHTTPREQUEST-ERROR:/)) {
	        // If the file returned an error, handle it
	        var errorObj = self.responseText.replace(/^NODE-XMLHTTPREQUEST-ERROR:/, "");
	        self.handleError(errorObj);
	      } else {
	        // If the file returned okay, parse its data and move to the DONE state
	        self.status = self.responseText.replace(/^NODE-XMLHTTPREQUEST-STATUS:([0-9]*),.*/, "$1");
	        self.responseText = self.responseText.replace(/^NODE-XMLHTTPREQUEST-STATUS:[0-9]*,(.*)/, "$1");
	        setState(self.DONE);
	      }
	    }
	  };

	  /**
	   * Called when an error is encountered to deal with it.
	   */
	  this.handleError = function(error) {
	    this.status = 503;
	    this.statusText = error;
	    this.responseText = error.stack;
	    errorFlag = true;
	    setState(this.DONE);
	  };

	  /**
	   * Aborts a request.
	   */
	  this.abort = function() {
	    if (request) {
	      request.abort();
	      request = null;
	    }

	    headers = defaultHeaders;
	    this.responseText = "";
	    this.responseXML = "";

	    errorFlag = true;

	    if (this.readyState !== this.UNSENT
	        && (this.readyState !== this.OPENED || sendFlag)
	        && this.readyState !== this.DONE) {
	      sendFlag = false;
	      setState(this.DONE);
	    }
	    this.readyState = this.UNSENT;
	  };

	  /**
	   * Adds an event listener. Preferred method of binding to events.
	   */
	  this.addEventListener = function(event, callback) {
	    if (!(event in listeners)) {
	      listeners[event] = [];
	    }
	    // Currently allows duplicate callbacks. Should it?
	    listeners[event].push(callback);
	  };

	  /**
	   * Remove an event callback that has already been bound.
	   * Only works on the matching funciton, cannot be a copy.
	   */
	  this.removeEventListener = function(event, callback) {
	    if (event in listeners) {
	      // Filter will return a new array with the callback removed
	      listeners[event] = listeners[event].filter(function(ev) {
	        return ev !== callback;
	      });
	    }
	  };

	  /**
	   * Dispatch any events, including both "on" methods and events attached using addEventListener.
	   */
	  this.dispatchEvent = function(event) {
	    if (typeof self["on" + event] === "function") {
	      self["on" + event]();
	    }
	    if (event in listeners) {
	      for (var i = 0, len = listeners[event].length; i < len; i++) {
	        listeners[event][i].call(self);
	      }
	    }
	  };

	  /**
	   * Changes readyState and calls onreadystatechange.
	   *
	   * @param int state New state
	   */
	  var setState = function(state) {
	    if (self.readyState !== state) {
	      self.readyState = state;

	      if (settings.async || self.readyState < self.OPENED || self.readyState === self.DONE) {
	        self.dispatchEvent("readystatechange");
	      }

	      if (self.readyState === self.DONE && !errorFlag) {
	        self.dispatchEvent("load");
	        // @TODO figure out InspectorInstrumentation::didLoadXHR(cookie)
	        self.dispatchEvent("loadend");
	      }
	    }
	  };
	};


/***/ },
/* 156 */
/***/ function(module, exports) {

	module.exports = require("child_process");

/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module requirements.
	 */

	var XMLHttpRequest = __webpack_require__(155);
	var Polling = __webpack_require__(158);
	var Emitter = __webpack_require__(147);
	var inherit = __webpack_require__(161);
	var debug = __webpack_require__(23)('engine.io-client:polling-xhr');

	/**
	 * Module exports.
	 */

	module.exports = XHR;
	module.exports.Request = Request;

	/**
	 * Empty function
	 */

	function empty(){}

	/**
	 * XHR Polling constructor.
	 *
	 * @param {Object} opts
	 * @api public
	 */

	function XHR(opts){
	  Polling.call(this, opts);

	  if (global.location) {
	    var isSSL = 'https:' == location.protocol;
	    var port = location.port;

	    // some user agents have empty `location.port`
	    if (!port) {
	      port = isSSL ? 443 : 80;
	    }

	    this.xd = opts.hostname != global.location.hostname ||
	      port != opts.port;
	    this.xs = opts.secure != isSSL;
	  } else {
	    this.extraHeaders = opts.extraHeaders;
	  }
	}

	/**
	 * Inherits from Polling.
	 */

	inherit(XHR, Polling);

	/**
	 * XHR supports binary
	 */

	XHR.prototype.supportsBinary = true;

	/**
	 * Creates a request.
	 *
	 * @param {String} method
	 * @api private
	 */

	XHR.prototype.request = function(opts){
	  opts = opts || {};
	  opts.uri = this.uri();
	  opts.xd = this.xd;
	  opts.xs = this.xs;
	  opts.agent = this.agent || false;
	  opts.supportsBinary = this.supportsBinary;
	  opts.enablesXDR = this.enablesXDR;

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;

	  // other options for Node.js client
	  opts.extraHeaders = this.extraHeaders;

	  return new Request(opts);
	};

	/**
	 * Sends data.
	 *
	 * @param {String} data to send.
	 * @param {Function} called upon flush.
	 * @api private
	 */

	XHR.prototype.doWrite = function(data, fn){
	  var isBinary = typeof data !== 'string' && data !== undefined;
	  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
	  var self = this;
	  req.on('success', fn);
	  req.on('error', function(err){
	    self.onError('xhr post error', err);
	  });
	  this.sendXhr = req;
	};

	/**
	 * Starts a poll cycle.
	 *
	 * @api private
	 */

	XHR.prototype.doPoll = function(){
	  debug('xhr poll');
	  var req = this.request();
	  var self = this;
	  req.on('data', function(data){
	    self.onData(data);
	  });
	  req.on('error', function(err){
	    self.onError('xhr poll error', err);
	  });
	  this.pollXhr = req;
	};

	/**
	 * Request constructor
	 *
	 * @param {Object} options
	 * @api public
	 */

	function Request(opts){
	  this.method = opts.method || 'GET';
	  this.uri = opts.uri;
	  this.xd = !!opts.xd;
	  this.xs = !!opts.xs;
	  this.async = false !== opts.async;
	  this.data = undefined != opts.data ? opts.data : null;
	  this.agent = opts.agent;
	  this.isBinary = opts.isBinary;
	  this.supportsBinary = opts.supportsBinary;
	  this.enablesXDR = opts.enablesXDR;

	  // SSL options for Node.js client
	  this.pfx = opts.pfx;
	  this.key = opts.key;
	  this.passphrase = opts.passphrase;
	  this.cert = opts.cert;
	  this.ca = opts.ca;
	  this.ciphers = opts.ciphers;
	  this.rejectUnauthorized = opts.rejectUnauthorized;

	  // other options for Node.js client
	  this.extraHeaders = opts.extraHeaders;

	  this.create();
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Request.prototype);

	/**
	 * Creates the XHR object and sends the request.
	 *
	 * @api private
	 */

	Request.prototype.create = function(){
	  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;

	  var xhr = this.xhr = new XMLHttpRequest(opts);
	  var self = this;

	  try {
	    debug('xhr open %s: %s', this.method, this.uri);
	    xhr.open(this.method, this.uri, this.async);
	    try {
	      if (this.extraHeaders) {
	        xhr.setDisableHeaderCheck(true);
	        for (var i in this.extraHeaders) {
	          if (this.extraHeaders.hasOwnProperty(i)) {
	            xhr.setRequestHeader(i, this.extraHeaders[i]);
	          }
	        }
	      }
	    } catch (e) {}
	    if (this.supportsBinary) {
	      // This has to be done after open because Firefox is stupid
	      // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
	      xhr.responseType = 'arraybuffer';
	    }

	    if ('POST' == this.method) {
	      try {
	        if (this.isBinary) {
	          xhr.setRequestHeader('Content-type', 'application/octet-stream');
	        } else {
	          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
	        }
	      } catch (e) {}
	    }

	    // ie6 check
	    if ('withCredentials' in xhr) {
	      xhr.withCredentials = true;
	    }

	    if (this.hasXDR()) {
	      xhr.onload = function(){
	        self.onLoad();
	      };
	      xhr.onerror = function(){
	        self.onError(xhr.responseText);
	      };
	    } else {
	      xhr.onreadystatechange = function(){
	        if (4 != xhr.readyState) return;
	        if (200 == xhr.status || 1223 == xhr.status) {
	          self.onLoad();
	        } else {
	          // make sure the `error` event handler that's user-set
	          // does not throw in the same tick and gets caught here
	          setTimeout(function(){
	            self.onError(xhr.status);
	          }, 0);
	        }
	      };
	    }

	    debug('xhr data %s', this.data);
	    xhr.send(this.data);
	  } catch (e) {
	    // Need to defer since .create() is called directly fhrom the constructor
	    // and thus the 'error' event can only be only bound *after* this exception
	    // occurs.  Therefore, also, we cannot throw here at all.
	    setTimeout(function() {
	      self.onError(e);
	    }, 0);
	    return;
	  }

	  if (global.document) {
	    this.index = Request.requestsCount++;
	    Request.requests[this.index] = this;
	  }
	};

	/**
	 * Called upon successful response.
	 *
	 * @api private
	 */

	Request.prototype.onSuccess = function(){
	  this.emit('success');
	  this.cleanup();
	};

	/**
	 * Called if we have data.
	 *
	 * @api private
	 */

	Request.prototype.onData = function(data){
	  this.emit('data', data);
	  this.onSuccess();
	};

	/**
	 * Called upon error.
	 *
	 * @api private
	 */

	Request.prototype.onError = function(err){
	  this.emit('error', err);
	  this.cleanup(true);
	};

	/**
	 * Cleans up house.
	 *
	 * @api private
	 */

	Request.prototype.cleanup = function(fromError){
	  if ('undefined' == typeof this.xhr || null === this.xhr) {
	    return;
	  }
	  // xmlhttprequest
	  if (this.hasXDR()) {
	    this.xhr.onload = this.xhr.onerror = empty;
	  } else {
	    this.xhr.onreadystatechange = empty;
	  }

	  if (fromError) {
	    try {
	      this.xhr.abort();
	    } catch(e) {}
	  }

	  if (global.document) {
	    delete Request.requests[this.index];
	  }

	  this.xhr = null;
	};

	/**
	 * Called upon load.
	 *
	 * @api private
	 */

	Request.prototype.onLoad = function(){
	  var data;
	  try {
	    var contentType;
	    try {
	      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
	    } catch (e) {}
	    if (contentType === 'application/octet-stream') {
	      data = this.xhr.response;
	    } else {
	      if (!this.supportsBinary) {
	        data = this.xhr.responseText;
	      } else {
	        try {
	          data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
	        } catch (e) {
	          var ui8Arr = new Uint8Array(this.xhr.response);
	          var dataArray = [];
	          for (var idx = 0, length = ui8Arr.length; idx < length; idx++) {
	            dataArray.push(ui8Arr[idx]);
	          }

	          data = String.fromCharCode.apply(null, dataArray);
	        }
	      }
	    }
	  } catch (e) {
	    this.onError(e);
	  }
	  if (null != data) {
	    this.onData(data);
	  }
	};

	/**
	 * Check if it has XDomainRequest.
	 *
	 * @api private
	 */

	Request.prototype.hasXDR = function(){
	  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
	};

	/**
	 * Aborts the request.
	 *
	 * @api public
	 */

	Request.prototype.abort = function(){
	  this.cleanup();
	};

	/**
	 * Aborts pending requests when unloading the window. This is needed to prevent
	 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
	 * emitted.
	 */

	if (global.document) {
	  Request.requestsCount = 0;
	  Request.requests = {};
	  if (global.attachEvent) {
	    global.attachEvent('onunload', unloadHandler);
	  } else if (global.addEventListener) {
	    global.addEventListener('beforeunload', unloadHandler, false);
	  }
	}

	function unloadHandler() {
	  for (var i in Request.requests) {
	    if (Request.requests.hasOwnProperty(i)) {
	      Request.requests[i].abort();
	    }
	  }
	}


/***/ },
/* 158 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var Transport = __webpack_require__(159);
	var parseqs = __webpack_require__(160);
	var parser = __webpack_require__(102);
	var inherit = __webpack_require__(161);
	var yeast = __webpack_require__(162);
	var debug = __webpack_require__(23)('engine.io-client:polling');

	/**
	 * Module exports.
	 */

	module.exports = Polling;

	/**
	 * Is XHR2 supported?
	 */

	var hasXHR2 = (function() {
	  var XMLHttpRequest = __webpack_require__(155);
	  var xhr = new XMLHttpRequest({ xdomain: false });
	  return null != xhr.responseType;
	})();

	/**
	 * Polling interface.
	 *
	 * @param {Object} opts
	 * @api private
	 */

	function Polling(opts){
	  var forceBase64 = (opts && opts.forceBase64);
	  if (!hasXHR2 || forceBase64) {
	    this.supportsBinary = false;
	  }
	  Transport.call(this, opts);
	}

	/**
	 * Inherits from Transport.
	 */

	inherit(Polling, Transport);

	/**
	 * Transport name.
	 */

	Polling.prototype.name = 'polling';

	/**
	 * Opens the socket (triggers polling). We write a PING message to determine
	 * when the transport is open.
	 *
	 * @api private
	 */

	Polling.prototype.doOpen = function(){
	  this.poll();
	};

	/**
	 * Pauses polling.
	 *
	 * @param {Function} callback upon buffers are flushed and transport is paused
	 * @api private
	 */

	Polling.prototype.pause = function(onPause){
	  var pending = 0;
	  var self = this;

	  this.readyState = 'pausing';

	  function pause(){
	    debug('paused');
	    self.readyState = 'paused';
	    onPause();
	  }

	  if (this.polling || !this.writable) {
	    var total = 0;

	    if (this.polling) {
	      debug('we are currently polling - waiting to pause');
	      total++;
	      this.once('pollComplete', function(){
	        debug('pre-pause polling complete');
	        --total || pause();
	      });
	    }

	    if (!this.writable) {
	      debug('we are currently writing - waiting to pause');
	      total++;
	      this.once('drain', function(){
	        debug('pre-pause writing complete');
	        --total || pause();
	      });
	    }
	  } else {
	    pause();
	  }
	};

	/**
	 * Starts polling cycle.
	 *
	 * @api public
	 */

	Polling.prototype.poll = function(){
	  debug('polling');
	  this.polling = true;
	  this.doPoll();
	  this.emit('poll');
	};

	/**
	 * Overloads onData to detect payloads.
	 *
	 * @api private
	 */

	Polling.prototype.onData = function(data){
	  var self = this;
	  debug('polling got data %s', data);
	  var callback = function(packet, index, total) {
	    // if its the first message we consider the transport open
	    if ('opening' == self.readyState) {
	      self.onOpen();
	    }

	    // if its a close packet, we close the ongoing requests
	    if ('close' == packet.type) {
	      self.onClose();
	      return false;
	    }

	    // otherwise bypass onData and handle the message
	    self.onPacket(packet);
	  };

	  // decode payload
	  parser.decodePayload(data, this.socket.binaryType, callback);

	  // if an event did not trigger closing
	  if ('closed' != this.readyState) {
	    // if we got data we're not polling
	    this.polling = false;
	    this.emit('pollComplete');

	    if ('open' == this.readyState) {
	      this.poll();
	    } else {
	      debug('ignoring poll - transport state "%s"', this.readyState);
	    }
	  }
	};

	/**
	 * For polling, send a close packet.
	 *
	 * @api private
	 */

	Polling.prototype.doClose = function(){
	  var self = this;

	  function close(){
	    debug('writing close packet');
	    self.write([{ type: 'close' }]);
	  }

	  if ('open' == this.readyState) {
	    debug('transport open - closing');
	    close();
	  } else {
	    // in case we're trying to close while
	    // handshaking is in progress (GH-164)
	    debug('transport not open - deferring close');
	    this.once('open', close);
	  }
	};

	/**
	 * Writes a packets payload.
	 *
	 * @param {Array} data packets
	 * @param {Function} drain callback
	 * @api private
	 */

	Polling.prototype.write = function(packets){
	  var self = this;
	  this.writable = false;
	  var callbackfn = function() {
	    self.writable = true;
	    self.emit('drain');
	  };

	  var self = this;
	  parser.encodePayload(packets, this.supportsBinary, function(data) {
	    self.doWrite(data, callbackfn);
	  });
	};

	/**
	 * Generates uri for connection.
	 *
	 * @api private
	 */

	Polling.prototype.uri = function(){
	  var query = this.query || {};
	  var schema = this.secure ? 'https' : 'http';
	  var port = '';

	  // cache busting is forced
	  if (false !== this.timestampRequests) {
	    query[this.timestampParam] = yeast();
	  }

	  if (!this.supportsBinary && !query.sid) {
	    query.b64 = 1;
	  }

	  query = parseqs.encode(query);

	  // avoid port if default for schema
	  if (this.port && (('https' == schema && this.port != 443) ||
	     ('http' == schema && this.port != 80))) {
	    port = ':' + this.port;
	  }

	  // prepend ? to query
	  if (query.length) {
	    query = '?' + query;
	  }

	  var ipv6 = this.hostname.indexOf(':') !== -1;
	  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
	};


/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var parser = __webpack_require__(102);
	var Emitter = __webpack_require__(147);

	/**
	 * Module exports.
	 */

	module.exports = Transport;

	/**
	 * Transport abstract constructor.
	 *
	 * @param {Object} options.
	 * @api private
	 */

	function Transport (opts) {
	  this.path = opts.path;
	  this.hostname = opts.hostname;
	  this.port = opts.port;
	  this.secure = opts.secure;
	  this.query = opts.query;
	  this.timestampParam = opts.timestampParam;
	  this.timestampRequests = opts.timestampRequests;
	  this.readyState = '';
	  this.agent = opts.agent || false;
	  this.socket = opts.socket;
	  this.enablesXDR = opts.enablesXDR;

	  // SSL options for Node.js client
	  this.pfx = opts.pfx;
	  this.key = opts.key;
	  this.passphrase = opts.passphrase;
	  this.cert = opts.cert;
	  this.ca = opts.ca;
	  this.ciphers = opts.ciphers;
	  this.rejectUnauthorized = opts.rejectUnauthorized;

	  // other options for Node.js client
	  this.extraHeaders = opts.extraHeaders;
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Transport.prototype);

	/**
	 * Emits an error.
	 *
	 * @param {String} str
	 * @return {Transport} for chaining
	 * @api public
	 */

	Transport.prototype.onError = function (msg, desc) {
	  var err = new Error(msg);
	  err.type = 'TransportError';
	  err.description = desc;
	  this.emit('error', err);
	  return this;
	};

	/**
	 * Opens the transport.
	 *
	 * @api public
	 */

	Transport.prototype.open = function () {
	  if ('closed' == this.readyState || '' == this.readyState) {
	    this.readyState = 'opening';
	    this.doOpen();
	  }

	  return this;
	};

	/**
	 * Closes the transport.
	 *
	 * @api private
	 */

	Transport.prototype.close = function () {
	  if ('opening' == this.readyState || 'open' == this.readyState) {
	    this.doClose();
	    this.onClose();
	  }

	  return this;
	};

	/**
	 * Sends multiple packets.
	 *
	 * @param {Array} packets
	 * @api private
	 */

	Transport.prototype.send = function(packets){
	  if ('open' == this.readyState) {
	    this.write(packets);
	  } else {
	    throw new Error('Transport not open');
	  }
	};

	/**
	 * Called upon open
	 *
	 * @api private
	 */

	Transport.prototype.onOpen = function () {
	  this.readyState = 'open';
	  this.writable = true;
	  this.emit('open');
	};

	/**
	 * Called with data.
	 *
	 * @param {String} data
	 * @api private
	 */

	Transport.prototype.onData = function(data){
	  var packet = parser.decodePacket(data, this.socket.binaryType);
	  this.onPacket(packet);
	};

	/**
	 * Called with a decoded packet.
	 */

	Transport.prototype.onPacket = function (packet) {
	  this.emit('packet', packet);
	};

	/**
	 * Called upon close.
	 *
	 * @api private
	 */

	Transport.prototype.onClose = function () {
	  this.readyState = 'closed';
	  this.emit('close');
	};


/***/ },
/* 160 */
/***/ function(module, exports) {

	/**
	 * Compiles a querystring
	 * Returns string representation of the object
	 *
	 * @param {Object}
	 * @api private
	 */

	exports.encode = function (obj) {
	  var str = '';

	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      if (str.length) str += '&';
	      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
	    }
	  }

	  return str;
	};

	/**
	 * Parses a simple querystring into an object
	 *
	 * @param {String} qs
	 * @api private
	 */

	exports.decode = function(qs){
	  var qry = {};
	  var pairs = qs.split('&');
	  for (var i = 0, l = pairs.length; i < l; i++) {
	    var pair = pairs[i].split('=');
	    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	  }
	  return qry;
	};


/***/ },
/* 161 */
/***/ function(module, exports) {

	
	module.exports = function(a, b){
	  var fn = function(){};
	  fn.prototype = b.prototype;
	  a.prototype = new fn;
	  a.prototype.constructor = a;
	};

/***/ },
/* 162 */
/***/ function(module, exports) {

	'use strict';

	var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
	  , length = 64
	  , map = {}
	  , seed = 0
	  , i = 0
	  , prev;

	/**
	 * Return a string representing the specified number.
	 *
	 * @param {Number} num The number to convert.
	 * @returns {String} The string representation of the number.
	 * @api public
	 */
	function encode(num) {
	  var encoded = '';

	  do {
	    encoded = alphabet[num % length] + encoded;
	    num = Math.floor(num / length);
	  } while (num > 0);

	  return encoded;
	}

	/**
	 * Return the integer value specified by the given string.
	 *
	 * @param {String} str The string to convert.
	 * @returns {Number} The integer value represented by the string.
	 * @api public
	 */
	function decode(str) {
	  var decoded = 0;

	  for (i = 0; i < str.length; i++) {
	    decoded = decoded * length + map[str.charAt(i)];
	  }

	  return decoded;
	}

	/**
	 * Yeast: A tiny growing id generator.
	 *
	 * @returns {String} A unique id.
	 * @api public
	 */
	function yeast() {
	  var now = encode(+new Date());

	  if (now !== prev) return seed = 0, prev = now;
	  return now +'.'+ encode(seed++);
	}

	//
	// Map each character to its index.
	//
	for (; i < length; i++) map[alphabet[i]] = i;

	//
	// Expose the `yeast`, `encode` and `decode` functions.
	//
	yeast.encode = encode;
	yeast.decode = decode;
	module.exports = yeast;


/***/ },
/* 163 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module requirements.
	 */

	var Polling = __webpack_require__(158);
	var inherit = __webpack_require__(161);

	/**
	 * Module exports.
	 */

	module.exports = JSONPPolling;

	/**
	 * Cached regular expressions.
	 */

	var rNewline = /\n/g;
	var rEscapedNewline = /\\n/g;

	/**
	 * Global JSONP callbacks.
	 */

	var callbacks;

	/**
	 * Callbacks count.
	 */

	var index = 0;

	/**
	 * Noop.
	 */

	function empty () { }

	/**
	 * JSONP Polling constructor.
	 *
	 * @param {Object} opts.
	 * @api public
	 */

	function JSONPPolling (opts) {
	  Polling.call(this, opts);

	  this.query = this.query || {};

	  // define global callbacks array if not present
	  // we do this here (lazily) to avoid unneeded global pollution
	  if (!callbacks) {
	    // we need to consider multiple engines in the same page
	    if (!global.___eio) global.___eio = [];
	    callbacks = global.___eio;
	  }

	  // callback identifier
	  this.index = callbacks.length;

	  // add callback to jsonp global
	  var self = this;
	  callbacks.push(function (msg) {
	    self.onData(msg);
	  });

	  // append to query string
	  this.query.j = this.index;

	  // prevent spurious errors from being emitted when the window is unloaded
	  if (global.document && global.addEventListener) {
	    global.addEventListener('beforeunload', function () {
	      if (self.script) self.script.onerror = empty;
	    }, false);
	  }
	}

	/**
	 * Inherits from Polling.
	 */

	inherit(JSONPPolling, Polling);

	/*
	 * JSONP only supports binary as base64 encoded strings
	 */

	JSONPPolling.prototype.supportsBinary = false;

	/**
	 * Closes the socket.
	 *
	 * @api private
	 */

	JSONPPolling.prototype.doClose = function () {
	  if (this.script) {
	    this.script.parentNode.removeChild(this.script);
	    this.script = null;
	  }

	  if (this.form) {
	    this.form.parentNode.removeChild(this.form);
	    this.form = null;
	    this.iframe = null;
	  }

	  Polling.prototype.doClose.call(this);
	};

	/**
	 * Starts a poll cycle.
	 *
	 * @api private
	 */

	JSONPPolling.prototype.doPoll = function () {
	  var self = this;
	  var script = document.createElement('script');

	  if (this.script) {
	    this.script.parentNode.removeChild(this.script);
	    this.script = null;
	  }

	  script.async = true;
	  script.src = this.uri();
	  script.onerror = function(e){
	    self.onError('jsonp poll error',e);
	  };

	  var insertAt = document.getElementsByTagName('script')[0];
	  if (insertAt) {
	    insertAt.parentNode.insertBefore(script, insertAt);
	  }
	  else {
	    (document.head || document.body).appendChild(script);
	  }
	  this.script = script;

	  var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);
	  
	  if (isUAgecko) {
	    setTimeout(function () {
	      var iframe = document.createElement('iframe');
	      document.body.appendChild(iframe);
	      document.body.removeChild(iframe);
	    }, 100);
	  }
	};

	/**
	 * Writes with a hidden iframe.
	 *
	 * @param {String} data to send
	 * @param {Function} called upon flush.
	 * @api private
	 */

	JSONPPolling.prototype.doWrite = function (data, fn) {
	  var self = this;

	  if (!this.form) {
	    var form = document.createElement('form');
	    var area = document.createElement('textarea');
	    var id = this.iframeId = 'eio_iframe_' + this.index;
	    var iframe;

	    form.className = 'socketio';
	    form.style.position = 'absolute';
	    form.style.top = '-1000px';
	    form.style.left = '-1000px';
	    form.target = id;
	    form.method = 'POST';
	    form.setAttribute('accept-charset', 'utf-8');
	    area.name = 'd';
	    form.appendChild(area);
	    document.body.appendChild(form);

	    this.form = form;
	    this.area = area;
	  }

	  this.form.action = this.uri();

	  function complete () {
	    initIframe();
	    fn();
	  }

	  function initIframe () {
	    if (self.iframe) {
	      try {
	        self.form.removeChild(self.iframe);
	      } catch (e) {
	        self.onError('jsonp polling iframe removal error', e);
	      }
	    }

	    try {
	      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
	      var html = '<iframe src="javascript:0" name="'+ self.iframeId +'">';
	      iframe = document.createElement(html);
	    } catch (e) {
	      iframe = document.createElement('iframe');
	      iframe.name = self.iframeId;
	      iframe.src = 'javascript:0';
	    }

	    iframe.id = self.iframeId;

	    self.form.appendChild(iframe);
	    self.iframe = iframe;
	  }

	  initIframe();

	  // escape \n to prevent it from being converted into \r\n by some UAs
	  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
	  data = data.replace(rEscapedNewline, '\\\n');
	  this.area.value = data.replace(rNewline, '\\n');

	  try {
	    this.form.submit();
	  } catch(e) {}

	  if (this.iframe.attachEvent) {
	    this.iframe.onreadystatechange = function(){
	      if (self.iframe.readyState == 'complete') {
	        complete();
	      }
	    };
	  } else {
	    this.iframe.onload = complete;
	  }
	};


/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var Transport = __webpack_require__(159);
	var parser = __webpack_require__(102);
	var parseqs = __webpack_require__(160);
	var inherit = __webpack_require__(161);
	var yeast = __webpack_require__(162);
	var debug = __webpack_require__(23)('engine.io-client:websocket');
	var BrowserWebSocket = global.WebSocket || global.MozWebSocket;

	/**
	 * Get either the `WebSocket` or `MozWebSocket` globals
	 * in the browser or try to resolve WebSocket-compatible
	 * interface exposed by `ws` for Node-like environment.
	 */

	var WebSocket = BrowserWebSocket;
	if (!WebSocket && typeof window === 'undefined') {
	  try {
	    WebSocket = __webpack_require__(121);
	  } catch (e) { }
	}

	/**
	 * Module exports.
	 */

	module.exports = WS;

	/**
	 * WebSocket transport constructor.
	 *
	 * @api {Object} connection options
	 * @api public
	 */

	function WS(opts){
	  var forceBase64 = (opts && opts.forceBase64);
	  if (forceBase64) {
	    this.supportsBinary = false;
	  }
	  this.perMessageDeflate = opts.perMessageDeflate;
	  Transport.call(this, opts);
	}

	/**
	 * Inherits from Transport.
	 */

	inherit(WS, Transport);

	/**
	 * Transport name.
	 *
	 * @api public
	 */

	WS.prototype.name = 'websocket';

	/*
	 * WebSockets support binary
	 */

	WS.prototype.supportsBinary = true;

	/**
	 * Opens socket.
	 *
	 * @api private
	 */

	WS.prototype.doOpen = function(){
	  if (!this.check()) {
	    // let probe timeout
	    return;
	  }

	  var self = this;
	  var uri = this.uri();
	  var protocols = void(0);
	  var opts = {
	    agent: this.agent,
	    perMessageDeflate: this.perMessageDeflate
	  };

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;
	  if (this.extraHeaders) {
	    opts.headers = this.extraHeaders;
	  }

	  this.ws = BrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);

	  if (this.ws.binaryType === undefined) {
	    this.supportsBinary = false;
	  }

	  if (this.ws.supports && this.ws.supports.binary) {
	    this.supportsBinary = true;
	    this.ws.binaryType = 'buffer';
	  } else {
	    this.ws.binaryType = 'arraybuffer';
	  }

	  this.addEventListeners();
	};

	/**
	 * Adds event listeners to the socket
	 *
	 * @api private
	 */

	WS.prototype.addEventListeners = function(){
	  var self = this;

	  this.ws.onopen = function(){
	    self.onOpen();
	  };
	  this.ws.onclose = function(){
	    self.onClose();
	  };
	  this.ws.onmessage = function(ev){
	    self.onData(ev.data);
	  };
	  this.ws.onerror = function(e){
	    self.onError('websocket error', e);
	  };
	};

	/**
	 * Override `onData` to use a timer on iOS.
	 * See: https://gist.github.com/mloughran/2052006
	 *
	 * @api private
	 */

	if ('undefined' != typeof navigator
	  && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
	  WS.prototype.onData = function(data){
	    var self = this;
	    setTimeout(function(){
	      Transport.prototype.onData.call(self, data);
	    }, 0);
	  };
	}

	/**
	 * Writes data to socket.
	 *
	 * @param {Array} array of packets.
	 * @api private
	 */

	WS.prototype.write = function(packets){
	  var self = this;
	  this.writable = false;

	  // encodePacket efficient as it uses WS framing
	  // no need for encodePayload
	  var total = packets.length;
	  for (var i = 0, l = total; i < l; i++) {
	    (function(packet) {
	      parser.encodePacket(packet, self.supportsBinary, function(data) {
	        if (!BrowserWebSocket) {
	          // always create a new object (GH-437)
	          var opts = {};
	          if (packet.options) {
	            opts.compress = packet.options.compress;
	          }

	          if (self.perMessageDeflate) {
	            var len = 'string' == typeof data ? global.Buffer.byteLength(data) : data.length;
	            if (len < self.perMessageDeflate.threshold) {
	              opts.compress = false;
	            }
	          }
	        }

	        //Sometimes the websocket has already been closed but the browser didn't
	        //have a chance of informing us about it yet, in that case send will
	        //throw an error
	        try {
	          if (BrowserWebSocket) {
	            // TypeError is thrown when passing the second argument on Safari
	            self.ws.send(data);
	          } else {
	            self.ws.send(data, opts);
	          }
	        } catch (e){
	          debug('websocket closed before onclose event');
	        }

	        --total || done();
	      });
	    })(packets[i]);
	  }

	  function done(){
	    self.emit('flush');

	    // fake drain
	    // defer to next tick to allow Socket to clear writeBuffer
	    setTimeout(function(){
	      self.writable = true;
	      self.emit('drain');
	    }, 0);
	  }
	};

	/**
	 * Called upon close
	 *
	 * @api private
	 */

	WS.prototype.onClose = function(){
	  Transport.prototype.onClose.call(this);
	};

	/**
	 * Closes socket.
	 *
	 * @api private
	 */

	WS.prototype.doClose = function(){
	  if (typeof this.ws !== 'undefined') {
	    this.ws.close();
	  }
	};

	/**
	 * Generates uri for connection.
	 *
	 * @api private
	 */

	WS.prototype.uri = function(){
	  var query = this.query || {};
	  var schema = this.secure ? 'wss' : 'ws';
	  var port = '';

	  // avoid port if default for schema
	  if (this.port && (('wss' == schema && this.port != 443)
	    || ('ws' == schema && this.port != 80))) {
	    port = ':' + this.port;
	  }

	  // append timestamp to URI
	  if (this.timestampRequests) {
	    query[this.timestampParam] = yeast();
	  }

	  // communicate binary support capabilities
	  if (!this.supportsBinary) {
	    query.b64 = 1;
	  }

	  query = parseqs.encode(query);

	  // prepend ? to query
	  if (query.length) {
	    query = '?' + query;
	  }

	  var ipv6 = this.hostname.indexOf(':') !== -1;
	  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
	};

	/**
	 * Feature detection for WebSocket.
	 *
	 * @return {Boolean} whether this transport is available.
	 * @api public
	 */

	WS.prototype.check = function(){
	  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
	};


/***/ },
/* 165 */
/***/ function(module, exports) {

	
	var indexOf = [].indexOf;

	module.exports = function(arr, obj){
	  if (indexOf) return arr.indexOf(obj);
	  for (var i = 0; i < arr.length; ++i) {
	    if (arr[i] === obj) return i;
	  }
	  return -1;
	};

/***/ },
/* 166 */
/***/ function(module, exports) {

	/**
	 * JSON parse.
	 *
	 * @see Based on jQuery#parseJSON (MIT) and JSON2
	 * @api private
	 */

	var rvalidchars = /^[\],:{}\s]*$/;
	var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
	var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
	var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
	var rtrimLeft = /^\s+/;
	var rtrimRight = /\s+$/;

	module.exports = function parsejson(data) {
	  if ('string' != typeof data || !data) {
	    return null;
	  }

	  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

	  // Attempt to parse using the native JSON parser first
	  if (global.JSON && JSON.parse) {
	    return JSON.parse(data);
	  }

	  if (rvalidchars.test(data.replace(rvalidescape, '@')
	      .replace(rvalidtokens, ']')
	      .replace(rvalidbraces, ''))) {
	    return (new Function('return ' + data))();
	  }
	};

/***/ },
/* 167 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var parser = __webpack_require__(143);
	var Emitter = __webpack_require__(168);
	var toArray = __webpack_require__(169);
	var on = __webpack_require__(170);
	var bind = __webpack_require__(171);
	var debug = __webpack_require__(23)('socket.io-client:socket');
	var hasBin = __webpack_require__(172);

	/**
	 * Module exports.
	 */

	module.exports = exports = Socket;

	/**
	 * Internal events (blacklisted).
	 * These events can't be emitted by the user.
	 *
	 * @api private
	 */

	var events = {
	  connect: 1,
	  connect_error: 1,
	  connect_timeout: 1,
	  connecting: 1,
	  disconnect: 1,
	  error: 1,
	  reconnect: 1,
	  reconnect_attempt: 1,
	  reconnect_failed: 1,
	  reconnect_error: 1,
	  reconnecting: 1,
	  ping: 1,
	  pong: 1
	};

	/**
	 * Shortcut to `Emitter#emit`.
	 */

	var emit = Emitter.prototype.emit;

	/**
	 * `Socket` constructor.
	 *
	 * @api public
	 */

	function Socket(io, nsp){
	  this.io = io;
	  this.nsp = nsp;
	  this.json = this; // compat
	  this.ids = 0;
	  this.acks = {};
	  this.receiveBuffer = [];
	  this.sendBuffer = [];
	  this.connected = false;
	  this.disconnected = true;
	  if (this.io.autoConnect) this.open();
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Socket.prototype);

	/**
	 * Subscribe to open, close and packet events
	 *
	 * @api private
	 */

	Socket.prototype.subEvents = function() {
	  if (this.subs) return;

	  var io = this.io;
	  this.subs = [
	    on(io, 'open', bind(this, 'onopen')),
	    on(io, 'packet', bind(this, 'onpacket')),
	    on(io, 'close', bind(this, 'onclose'))
	  ];
	};

	/**
	 * "Opens" the socket.
	 *
	 * @api public
	 */

	Socket.prototype.open =
	Socket.prototype.connect = function(){
	  if (this.connected) return this;

	  this.subEvents();
	  this.io.open(); // ensure open
	  if ('open' == this.io.readyState) this.onopen();
	  this.emit('connecting');
	  return this;
	};

	/**
	 * Sends a `message` event.
	 *
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.send = function(){
	  var args = toArray(arguments);
	  args.unshift('message');
	  this.emit.apply(this, args);
	  return this;
	};

	/**
	 * Override `emit`.
	 * If the event is in `events`, it's emitted normally.
	 *
	 * @param {String} event name
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.emit = function(ev){
	  if (events.hasOwnProperty(ev)) {
	    emit.apply(this, arguments);
	    return this;
	  }

	  var args = toArray(arguments);
	  var parserType = parser.EVENT; // default
	  if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
	  var packet = { type: parserType, data: args };

	  packet.options = {};
	  packet.options.compress = !this.flags || false !== this.flags.compress;

	  // event ack callback
	  if ('function' == typeof args[args.length - 1]) {
	    debug('emitting packet with ack id %d', this.ids);
	    this.acks[this.ids] = args.pop();
	    packet.id = this.ids++;
	  }

	  if (this.connected) {
	    this.packet(packet);
	  } else {
	    this.sendBuffer.push(packet);
	  }

	  delete this.flags;

	  return this;
	};

	/**
	 * Sends a packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.packet = function(packet){
	  packet.nsp = this.nsp;
	  this.io.packet(packet);
	};

	/**
	 * Called upon engine `open`.
	 *
	 * @api private
	 */

	Socket.prototype.onopen = function(){
	  debug('transport is open - connecting');

	  // write connect packet if necessary
	  if ('/' != this.nsp) {
	    this.packet({ type: parser.CONNECT });
	  }
	};

	/**
	 * Called upon engine `close`.
	 *
	 * @param {String} reason
	 * @api private
	 */

	Socket.prototype.onclose = function(reason){
	  debug('close (%s)', reason);
	  this.connected = false;
	  this.disconnected = true;
	  delete this.id;
	  this.emit('disconnect', reason);
	};

	/**
	 * Called with socket packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onpacket = function(packet){
	  if (packet.nsp != this.nsp) return;

	  switch (packet.type) {
	    case parser.CONNECT:
	      this.onconnect();
	      break;

	    case parser.EVENT:
	      this.onevent(packet);
	      break;

	    case parser.BINARY_EVENT:
	      this.onevent(packet);
	      break;

	    case parser.ACK:
	      this.onack(packet);
	      break;

	    case parser.BINARY_ACK:
	      this.onack(packet);
	      break;

	    case parser.DISCONNECT:
	      this.ondisconnect();
	      break;

	    case parser.ERROR:
	      this.emit('error', packet.data);
	      break;
	  }
	};

	/**
	 * Called upon a server event.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onevent = function(packet){
	  var args = packet.data || [];
	  debug('emitting event %j', args);

	  if (null != packet.id) {
	    debug('attaching ack callback to event');
	    args.push(this.ack(packet.id));
	  }

	  if (this.connected) {
	    emit.apply(this, args);
	  } else {
	    this.receiveBuffer.push(args);
	  }
	};

	/**
	 * Produces an ack callback to emit with an event.
	 *
	 * @api private
	 */

	Socket.prototype.ack = function(id){
	  var self = this;
	  var sent = false;
	  return function(){
	    // prevent double callbacks
	    if (sent) return;
	    sent = true;
	    var args = toArray(arguments);
	    debug('sending ack %j', args);

	    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
	    self.packet({
	      type: type,
	      id: id,
	      data: args
	    });
	  };
	};

	/**
	 * Called upon a server acknowlegement.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onack = function(packet){
	  var ack = this.acks[packet.id];
	  if ('function' == typeof ack) {
	    debug('calling ack %s with %j', packet.id, packet.data);
	    ack.apply(this, packet.data);
	    delete this.acks[packet.id];
	  } else {
	    debug('bad ack %s', packet.id);
	  }
	};

	/**
	 * Called upon server connect.
	 *
	 * @api private
	 */

	Socket.prototype.onconnect = function(){
	  this.connected = true;
	  this.disconnected = false;
	  this.emit('connect');
	  this.emitBuffered();
	};

	/**
	 * Emit buffered events (received and emitted).
	 *
	 * @api private
	 */

	Socket.prototype.emitBuffered = function(){
	  var i;
	  for (i = 0; i < this.receiveBuffer.length; i++) {
	    emit.apply(this, this.receiveBuffer[i]);
	  }
	  this.receiveBuffer = [];

	  for (i = 0; i < this.sendBuffer.length; i++) {
	    this.packet(this.sendBuffer[i]);
	  }
	  this.sendBuffer = [];
	};

	/**
	 * Called upon server disconnect.
	 *
	 * @api private
	 */

	Socket.prototype.ondisconnect = function(){
	  debug('server disconnect (%s)', this.nsp);
	  this.destroy();
	  this.onclose('io server disconnect');
	};

	/**
	 * Called upon forced client/server side disconnections,
	 * this method ensures the manager stops tracking us and
	 * that reconnections don't get triggered for this.
	 *
	 * @api private.
	 */

	Socket.prototype.destroy = function(){
	  if (this.subs) {
	    // clean subscriptions to avoid reconnections
	    for (var i = 0; i < this.subs.length; i++) {
	      this.subs[i].destroy();
	    }
	    this.subs = null;
	  }

	  this.io.destroy(this);
	};

	/**
	 * Disconnects the socket manually.
	 *
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.close =
	Socket.prototype.disconnect = function(){
	  if (this.connected) {
	    debug('performing disconnect (%s)', this.nsp);
	    this.packet({ type: parser.DISCONNECT });
	  }

	  // remove socket from pool
	  this.destroy();

	  if (this.connected) {
	    // fire events
	    this.onclose('io client disconnect');
	  }
	  return this;
	};

	/**
	 * Sets the compress flag.
	 *
	 * @param {Boolean} if `true`, compresses the sending data
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.compress = function(compress){
	  this.flags = this.flags || {};
	  this.flags.compress = compress;
	  return this;
	};


/***/ },
/* 168 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Emitter`.
	 */

	module.exports = Emitter;

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};

	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }

	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];

	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 169 */
/***/ function(module, exports) {

	module.exports = toArray

	function toArray(list, index) {
	    var array = []

	    index = index || 0

	    for (var i = index || 0; i < list.length; i++) {
	        array[i - index] = list[i]
	    }

	    return array
	}


/***/ },
/* 170 */
/***/ function(module, exports) {

	
	/**
	 * Module exports.
	 */

	module.exports = on;

	/**
	 * Helper for subscriptions.
	 *
	 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
	 * @param {String} event name
	 * @param {Function} callback
	 * @api public
	 */

	function on(obj, ev, fn) {
	  obj.on(ev, fn);
	  return {
	    destroy: function(){
	      obj.removeListener(ev, fn);
	    }
	  };
	}


/***/ },
/* 171 */
/***/ function(module, exports) {

	/**
	 * Slice reference.
	 */

	var slice = [].slice;

	/**
	 * Bind `obj` to `fn`.
	 *
	 * @param {Object} obj
	 * @param {Function|String} fn or string
	 * @return {Function}
	 * @api public
	 */

	module.exports = function(obj, fn){
	  if ('string' == typeof fn) fn = obj[fn];
	  if ('function' != typeof fn) throw new Error('bind() requires a function');
	  var args = slice.call(arguments, 2);
	  return function(){
	    return fn.apply(obj, args.concat(slice.call(arguments)));
	  }
	};


/***/ },
/* 172 */
/***/ function(module, exports, __webpack_require__) {

	
	/*
	 * Module requirements.
	 */

	var isArray = __webpack_require__(146);

	/**
	 * Module exports.
	 */

	module.exports = hasBinary;

	/**
	 * Checks for binary data.
	 *
	 * Right now only Buffer and ArrayBuffer are supported..
	 *
	 * @param {Object} anything
	 * @api public
	 */

	function hasBinary(data) {

	  function _hasBinary(obj) {
	    if (!obj) return false;

	    if ( (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj)) ||
	         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
	         (global.Blob && obj instanceof Blob) ||
	         (global.File && obj instanceof File)
	        ) {
	      return true;
	    }

	    if (isArray(obj)) {
	      for (var i = 0; i < obj.length; i++) {
	          if (_hasBinary(obj[i])) {
	              return true;
	          }
	      }
	    } else if (obj && 'object' == typeof obj) {
	      // see: https://github.com/Automattic/has-binary/pull/4
	      if (obj.toJSON && 'function' == typeof obj.toJSON) {
	        obj = obj.toJSON();
	      }

	      for (var key in obj) {
	        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
	          return true;
	        }
	      }
	    }

	    return false;
	  }

	  return _hasBinary(data);
	}


/***/ },
/* 173 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Backoff`.
	 */

	module.exports = Backoff;

	/**
	 * Initialize backoff timer with `opts`.
	 *
	 * - `min` initial timeout in milliseconds [100]
	 * - `max` max timeout [10000]
	 * - `jitter` [0]
	 * - `factor` [2]
	 *
	 * @param {Object} opts
	 * @api public
	 */

	function Backoff(opts) {
	  opts = opts || {};
	  this.ms = opts.min || 100;
	  this.max = opts.max || 10000;
	  this.factor = opts.factor || 2;
	  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
	  this.attempts = 0;
	}

	/**
	 * Return the backoff duration.
	 *
	 * @return {Number}
	 * @api public
	 */

	Backoff.prototype.duration = function(){
	  var ms = this.ms * Math.pow(this.factor, this.attempts++);
	  if (this.jitter) {
	    var rand =  Math.random();
	    var deviation = Math.floor(rand * this.jitter * ms);
	    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
	  }
	  return Math.min(ms, this.max) | 0;
	};

	/**
	 * Reset the number of attempts.
	 *
	 * @api public
	 */

	Backoff.prototype.reset = function(){
	  this.attempts = 0;
	};

	/**
	 * Set the minimum duration
	 *
	 * @api public
	 */

	Backoff.prototype.setMin = function(min){
	  this.ms = min;
	};

	/**
	 * Set the maximum duration
	 *
	 * @api public
	 */

	Backoff.prototype.setMax = function(max){
	  this.max = max;
	};

	/**
	 * Set the jitter
	 *
	 * @api public
	 */

	Backoff.prototype.setJitter = function(jitter){
	  this.jitter = jitter;
	};



/***/ },
/* 174 */,
/* 175 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var parser = __webpack_require__(143);
	var debug = __webpack_require__(23)('socket.io:client');

	/**
	 * Module exports.
	 */

	module.exports = Client;

	/**
	 * Client constructor.
	 *
	 * @param {Server} server instance
	 * @param {Socket} conn
	 * @api private
	 */

	function Client(server, conn){
	  this.server = server;
	  this.conn = conn;
	  this.encoder = new parser.Encoder();
	  this.decoder = new parser.Decoder();
	  this.id = conn.id;
	  this.request = conn.request;
	  this.setup();
	  this.sockets = {};
	  this.nsps = {};
	  this.connectBuffer = [];
	}

	/**
	 * Sets up event listeners.
	 *
	 * @api private
	 */

	Client.prototype.setup = function(){
	  this.onclose = this.onclose.bind(this);
	  this.ondata = this.ondata.bind(this);
	  this.onerror = this.onerror.bind(this);
	  this.ondecoded = this.ondecoded.bind(this);

	  this.decoder.on('decoded', this.ondecoded);
	  this.conn.on('data', this.ondata);
	  this.conn.on('error', this.onerror);
	  this.conn.on('close', this.onclose);
	};

	/**
	 * Connects a client to a namespace.
	 *
	 * @param {String} name namespace
	 * @api private
	 */

	Client.prototype.connect = function(name){
	  debug('connecting to namespace %s', name);
	  var nsp = this.server.nsps[name];
	  if (!nsp) {
	    this.packet({ type: parser.ERROR, nsp: name, data : 'Invalid namespace'});
	    return;
	  }

	  if ('/' != name && !this.nsps['/']) {
	    this.connectBuffer.push(name);
	    return;
	  }

	  var self = this;
	  var socket = nsp.add(this, function(){
	    self.sockets[socket.id] = socket;
	    self.nsps[nsp.name] = socket;

	    if ('/' == nsp.name && self.connectBuffer.length > 0) {
	      self.connectBuffer.forEach(self.connect, self);
	      self.connectBuffer = [];
	    }
	  });
	};

	/**
	 * Disconnects from all namespaces and closes transport.
	 *
	 * @api private
	 */

	Client.prototype.disconnect = function(){
	  for (var id in this.sockets) {
	    if (this.sockets.hasOwnProperty(id)) {
	      this.sockets[id].disconnect();
	    }
	  }
	  this.sockets = {};
	  this.close();
	};

	/**
	 * Removes a socket. Called by each `Socket`.
	 *
	 * @api private
	 */

	Client.prototype.remove = function(socket){
	  if (this.sockets.hasOwnProperty(socket.id)) {
	    var nsp = this.sockets[socket.id].nsp.name;
	    delete this.sockets[socket.id];
	    delete this.nsps[nsp];
	  } else {
	    debug('ignoring remove for %s', socket.id);
	  }
	};

	/**
	 * Closes the underlying connection.
	 *
	 * @api private
	 */

	Client.prototype.close = function(){
	  if ('open' == this.conn.readyState) {
	    debug('forcing transport close');
	    this.conn.close();
	    this.onclose('forced server close');
	  }
	};

	/**
	 * Writes a packet to the transport.
	 *
	 * @param {Object} packet object
	 * @param {Object} opts
	 * @api private
	 */

	Client.prototype.packet = function(packet, opts){
	  opts = opts || {};
	  var self = this;

	  // this writes to the actual connection
	  function writeToEngine(encodedPackets) {
	    if (opts.volatile && !self.conn.transport.writable) return;
	    for (var i = 0; i < encodedPackets.length; i++) {
	      self.conn.write(encodedPackets[i], { compress: opts.compress });
	    }
	  }

	  if ('open' == this.conn.readyState) {
	    debug('writing packet %j', packet);
	    if (!opts.preEncoded) { // not broadcasting, need to encode
	      this.encoder.encode(packet, function (encodedPackets) { // encode, then write results to engine
	        writeToEngine(encodedPackets);
	      });
	    } else { // a broadcast pre-encodes a packet
	      writeToEngine(packet);
	    }
	  } else {
	    debug('ignoring packet write %j', packet);
	  }
	};

	/**
	 * Called with incoming transport data.
	 *
	 * @api private
	 */

	Client.prototype.ondata = function(data){
	  // try/catch is needed for protocol violations (GH-1880)
	  try {
	    this.decoder.add(data);
	  } catch(e) {
	    this.onerror(e);
	  }
	};

	/**
	 * Called when parser fully decodes a packet.
	 *
	 * @api private
	 */

	Client.prototype.ondecoded = function(packet) {
	  if (parser.CONNECT == packet.type) {
	    this.connect(packet.nsp);
	  } else {
	    var socket = this.nsps[packet.nsp];
	    if (socket) {
	      socket.onpacket(packet);
	    } else {
	      debug('no socket for namespace %s', packet.nsp);
	    }
	  }
	};

	/**
	 * Handles an error.
	 *
	 * @param {Object} err object
	 * @api private
	 */

	Client.prototype.onerror = function(err){
	  for (var id in this.sockets) {
	    if (this.sockets.hasOwnProperty(id)) {
	      this.sockets[id].onerror(err);
	    }
	  }
	  this.onclose('client error');
	};

	/**
	 * Called upon transport close.
	 *
	 * @param {String} reason
	 * @api private
	 */

	Client.prototype.onclose = function(reason){
	  debug('client close with reason %s', reason);

	  // ignore a potential subsequent `close` event
	  this.destroy();

	  // `nsps` and `sockets` are cleaned up seamlessly
	  for (var id in this.sockets) {
	    if (this.sockets.hasOwnProperty(id)) {
	      this.sockets[id].onclose(reason);
	    }
	  }
	  this.sockets = {};

	  this.decoder.destroy(); // clean up decoder
	};

	/**
	 * Cleans up event listeners.
	 *
	 * @api private
	 */

	Client.prototype.destroy = function(){
	  this.conn.removeListener('data', this.ondata);
	  this.conn.removeListener('error', this.onerror);
	  this.conn.removeListener('close', this.onclose);
	  this.decoder.removeListener('decoded', this.ondecoded);
	};


/***/ },
/* 176 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var Socket = __webpack_require__(177);
	var Emitter = __webpack_require__(19).EventEmitter;
	var parser = __webpack_require__(143);
	var debug = __webpack_require__(23)('socket.io:namespace');
	var hasBin = __webpack_require__(172);

	/**
	 * Module exports.
	 */

	module.exports = exports = Namespace;

	/**
	 * Blacklisted events.
	 */

	exports.events = [
	  'connect',    // for symmetry with client
	  'connection',
	  'newListener'
	];

	/**
	 * Flags.
	 */

	exports.flags = [
	  'json',
	  'volatile'
	];

	/**
	 * `EventEmitter#emit` reference.
	 */

	var emit = Emitter.prototype.emit;

	/**
	 * Namespace constructor.
	 *
	 * @param {Server} server instance
	 * @param {Socket} name
	 * @api private
	 */

	function Namespace(server, name){
	  this.name = name;
	  this.server = server;
	  this.sockets = {};
	  this.connected = {};
	  this.fns = [];
	  this.ids = 0;
	  this.initAdapter();
	}

	/**
	 * Inherits from `EventEmitter`.
	 */

	Namespace.prototype.__proto__ = Emitter.prototype;

	/**
	 * Apply flags from `Socket`.
	 */

	exports.flags.forEach(function(flag){
	  Namespace.prototype.__defineGetter__(flag, function(){
	    this.flags = this.flags || {};
	    this.flags[flag] = true;
	    return this;
	  });
	});

	/**
	 * Initializes the `Adapter` for this nsp.
	 * Run upon changing adapter by `Server#adapter`
	 * in addition to the constructor.
	 *
	 * @api private
	 */

	Namespace.prototype.initAdapter = function(){
	  this.adapter = new (this.server.adapter())(this);
	};

	/**
	 * Sets up namespace middleware.
	 *
	 * @return {Namespace} self
	 * @api public
	 */

	Namespace.prototype.use = function(fn){
	  this.fns.push(fn);
	  return this;
	};

	/**
	 * Executes the middleware for an incoming client.
	 *
	 * @param {Socket} socket that will get added
	 * @param {Function} fn last fn call in the middleware
	 * @api private
	 */

	Namespace.prototype.run = function(socket, fn){
	  var fns = this.fns.slice(0);
	  if (!fns.length) return fn(null);

	  function run(i){
	    fns[i](socket, function(err){
	      // upon error, short-circuit
	      if (err) return fn(err);

	      // if no middleware left, summon callback
	      if (!fns[i + 1]) return fn(null);

	      // go on to next
	      run(i + 1);
	    });
	  }

	  run(0);
	};

	/**
	 * Targets a room when emitting.
	 *
	 * @param {String} name
	 * @return {Namespace} self
	 * @api public
	 */

	Namespace.prototype.to =
	Namespace.prototype['in'] = function(name){
	  this.rooms = this.rooms || [];
	  if (!~this.rooms.indexOf(name)) this.rooms.push(name);
	  return this;
	};

	/**
	 * Adds a new client.
	 *
	 * @return {Socket}
	 * @api private
	 */

	Namespace.prototype.add = function(client, fn){
	  debug('adding socket to nsp %s', this.name);
	  var socket = new Socket(this, client);
	  var self = this;
	  this.run(socket, function(err){
	    process.nextTick(function(){
	      if ('open' == client.conn.readyState) {
	        if (err) return socket.error(err.data || err.message);

	        // track socket
	        self.sockets[socket.id] = socket;

	        // it's paramount that the internal `onconnect` logic
	        // fires before user-set events to prevent state order
	        // violations (such as a disconnection before the connection
	        // logic is complete)
	        socket.onconnect();
	        if (fn) fn();

	        // fire user-set events
	        self.emit('connect', socket);
	        self.emit('connection', socket);
	      } else {
	        debug('next called after client was closed - ignoring socket');
	      }
	    });
	  });
	  return socket;
	};

	/**
	 * Removes a client. Called by each `Socket`.
	 *
	 * @api private
	 */

	Namespace.prototype.remove = function(socket){
	  if (this.sockets.hasOwnProperty(socket.id)) {
	    delete this.sockets[socket.id];
	  } else {
	    debug('ignoring remove for %s', socket.id);
	  }
	};

	/**
	 * Emits to all clients.
	 *
	 * @return {Namespace} self
	 * @api public
	 */

	Namespace.prototype.emit = function(ev){
	  if (~exports.events.indexOf(ev)) {
	    emit.apply(this, arguments);
	  } else {
	    // set up packet object
	    var args = Array.prototype.slice.call(arguments);
	    var parserType = parser.EVENT; // default
	    if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary

	    var packet = { type: parserType, data: args };

	    if ('function' == typeof args[args.length - 1]) {
	      throw new Error('Callbacks are not supported when broadcasting');
	    }

	    this.adapter.broadcast(packet, {
	      rooms: this.rooms,
	      flags: this.flags
	    });

	    delete this.rooms;
	    delete this.flags;
	  }
	  return this;
	};

	/**
	 * Sends a `message` event to all clients.
	 *
	 * @return {Namespace} self
	 * @api public
	 */

	Namespace.prototype.send =
	Namespace.prototype.write = function(){
	  var args = Array.prototype.slice.call(arguments);
	  args.unshift('message');
	  this.emit.apply(this, args);
	  return this;
	};

	/**
	 * Gets a list of clients.
	 *
	 * @return {Namespace} self
	 * @api public
	 */

	Namespace.prototype.clients = function(fn){
	  this.adapter.clients(this.rooms, fn);
	  // delete rooms flag for scenario:
	  // .in('room').clients() (GH-1978)
	  delete this.rooms;
	  return this;
	};

	/**
	 * Sets the compress flag.
	 *
	 * @param {Boolean} compress if `true`, compresses the sending data
	 * @return {Socket} self
	 * @api public
	 */

	Namespace.prototype.compress = function(compress){
	  this.flags = this.flags || {};
	  this.flags.compress = compress;
	  return this;
	};


/***/ },
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var Emitter = __webpack_require__(19).EventEmitter;
	var parser = __webpack_require__(143);
	var url = __webpack_require__(48);
	var debug = __webpack_require__(23)('socket.io:socket');
	var hasBin = __webpack_require__(172);

	/**
	 * Module exports.
	 */

	module.exports = exports = Socket;

	/**
	 * Blacklisted events.
	 *
	 * @api public
	 */

	exports.events = [
	  'error',
	  'connect',
	  'disconnect',
	  'newListener',
	  'removeListener'
	];

	/**
	 * Flags.
	 *
	 * @api private
	 */

	var flags = [
	  'json',
	  'volatile',
	  'broadcast'
	];

	/**
	 * `EventEmitter#emit` reference.
	 */

	var emit = Emitter.prototype.emit;

	/**
	 * Interface to a `Client` for a given `Namespace`.
	 *
	 * @param {Namespace} nsp
	 * @param {Client} client
	 * @api public
	 */

	function Socket(nsp, client){
	  this.nsp = nsp;
	  this.server = nsp.server;
	  this.adapter = this.nsp.adapter;
	  this.id = nsp.name + '#' + client.id;
	  this.client = client;
	  this.conn = client.conn;
	  this.rooms = {};
	  this.acks = {};
	  this.connected = true;
	  this.disconnected = false;
	  this.handshake = this.buildHandshake();
	}

	/**
	 * Inherits from `EventEmitter`.
	 */

	Socket.prototype.__proto__ = Emitter.prototype;

	/**
	 * Apply flags from `Socket`.
	 */

	flags.forEach(function(flag){
	  Socket.prototype.__defineGetter__(flag, function(){
	    this.flags = this.flags || {};
	    this.flags[flag] = true;
	    return this;
	  });
	});

	/**
	 * `request` engine.io shortcut.
	 *
	 * @api public
	 */

	Socket.prototype.__defineGetter__('request', function(){
	  return this.conn.request;
	});

	/**
	 * Builds the `handshake` BC object
	 *
	 * @api private
	 */

	Socket.prototype.buildHandshake = function(){
	  return {
	    headers: this.request.headers,
	    time: (new Date) + '',
	    address: this.conn.remoteAddress,
	    xdomain: !!this.request.headers.origin,
	    secure: !!this.request.connection.encrypted,
	    issued: +(new Date),
	    url: this.request.url,
	    query: url.parse(this.request.url, true).query || {}
	  };
	};

	/**
	 * Emits to this client.
	 *
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.emit = function(ev){
	  if (~exports.events.indexOf(ev)) {
	    emit.apply(this, arguments);
	  } else {
	    var args = Array.prototype.slice.call(arguments);
	    var packet = {};
	    packet.type = hasBin(args) ? parser.BINARY_EVENT : parser.EVENT;
	    packet.data = args;
	    var flags = this.flags || {};

	    // access last argument to see if it's an ACK callback
	    if ('function' == typeof args[args.length - 1]) {
	      if (this._rooms || flags.broadcast) {
	        throw new Error('Callbacks are not supported when broadcasting');
	      }

	      debug('emitting packet with ack id %d', this.nsp.ids);
	      this.acks[this.nsp.ids] = args.pop();
	      packet.id = this.nsp.ids++;
	    }

	    if (this._rooms || flags.broadcast) {
	      this.adapter.broadcast(packet, {
	        except: [this.id],
	        rooms: this._rooms,
	        flags: flags
	      });
	    } else {
	      // dispatch packet
	      this.packet(packet, {
	        volatile: flags.volatile,
	        compress: flags.compress
	      });
	    }

	    // reset flags
	    delete this._rooms;
	    delete this.flags;
	  }
	  return this;
	};

	/**
	 * Targets a room when broadcasting.
	 *
	 * @param {String} name
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.to =
	Socket.prototype.in = function(name){
	  this._rooms = this._rooms || [];
	  if (!~this._rooms.indexOf(name)) this._rooms.push(name);
	  return this;
	};

	/**
	 * Sends a `message` event.
	 *
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.send =
	Socket.prototype.write = function(){
	  var args = Array.prototype.slice.call(arguments);
	  args.unshift('message');
	  this.emit.apply(this, args);
	  return this;
	};

	/**
	 * Writes a packet.
	 *
	 * @param {Object} packet object
	 * @param {Object} opts options
	 * @api private
	 */

	Socket.prototype.packet = function(packet, opts){
	  packet.nsp = this.nsp.name;
	  opts = opts || {};
	  opts.compress = false !== opts.compress;
	  this.client.packet(packet, opts);
	};

	/**
	 * Joins a room.
	 *
	 * @param {String} room
	 * @param {Function} fn optional, callback
	 * @return {Socket} self
	 * @api private
	 */

	Socket.prototype.join = function(room, fn){
	  debug('joining room %s', room);
	  var self = this;
	  if (this.rooms.hasOwnProperty(room)) {
	    fn && fn(null);
	    return this;
	  }
	  this.adapter.add(this.id, room, function(err){
	    if (err) return fn && fn(err);
	    debug('joined room %s', room);
	    self.rooms[room] = room;
	    fn && fn(null);
	  });
	  return this;
	};

	/**
	 * Leaves a room.
	 *
	 * @param {String} room
	 * @param {Function} fn optional, callback
	 * @return {Socket} self
	 * @api private
	 */

	Socket.prototype.leave = function(room, fn){
	  debug('leave room %s', room);
	  var self = this;
	  this.adapter.del(this.id, room, function(err){
	    if (err) return fn && fn(err);
	    debug('left room %s', room);
	    delete self.rooms[room];
	    fn && fn(null);
	  });
	  return this;
	};

	/**
	 * Leave all rooms.
	 *
	 * @api private
	 */

	Socket.prototype.leaveAll = function(){
	  this.adapter.delAll(this.id);
	  this.rooms = {};
	};

	/**
	 * Called by `Namespace` upon succesful
	 * middleware execution (ie: authorization).
	 *
	 * @api private
	 */

	Socket.prototype.onconnect = function(){
	  debug('socket connected - writing packet');
	  this.nsp.connected[this.id] = this;
	  this.join(this.id);
	  this.packet({ type: parser.CONNECT });
	};

	/**
	 * Called with each packet. Called by `Client`.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onpacket = function(packet){
	  debug('got packet %j', packet);
	  switch (packet.type) {
	    case parser.EVENT:
	      this.onevent(packet);
	      break;

	    case parser.BINARY_EVENT:
	      this.onevent(packet);
	      break;

	    case parser.ACK:
	      this.onack(packet);
	      break;

	    case parser.BINARY_ACK:
	      this.onack(packet);
	      break;

	    case parser.DISCONNECT:
	      this.ondisconnect();
	      break;

	    case parser.ERROR:
	      this.emit('error', packet.data);
	  }
	};

	/**
	 * Called upon event packet.
	 *
	 * @param {Object} packet object
	 * @api private
	 */

	Socket.prototype.onevent = function(packet){
	  var args = packet.data || [];
	  debug('emitting event %j', args);

	  if (null != packet.id) {
	    debug('attaching ack callback to event');
	    args.push(this.ack(packet.id));
	  }

	  emit.apply(this, args);
	};

	/**
	 * Produces an ack callback to emit with an event.
	 *
	 * @param {Number} id packet id
	 * @api private
	 */

	Socket.prototype.ack = function(id){
	  var self = this;
	  var sent = false;
	  return function(){
	    // prevent double callbacks
	    if (sent) return;
	    var args = Array.prototype.slice.call(arguments);
	    debug('sending ack %j', args);

	    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
	    self.packet({
	      id: id,
	      type: type,
	      data: args
	    });

	    sent = true;
	  };
	};

	/**
	 * Called upon ack packet.
	 *
	 * @api private
	 */

	Socket.prototype.onack = function(packet){
	  var ack = this.acks[packet.id];
	  if ('function' == typeof ack) {
	    debug('calling ack %s with %j', packet.id, packet.data);
	    ack.apply(this, packet.data);
	    delete this.acks[packet.id];
	  } else {
	    debug('bad ack %s', packet.id);
	  }
	};

	/**
	 * Called upon client disconnect packet.
	 *
	 * @api private
	 */

	Socket.prototype.ondisconnect = function(){
	  debug('got disconnect packet');
	  this.onclose('client namespace disconnect');
	};

	/**
	 * Handles a client error.
	 *
	 * @api private
	 */

	Socket.prototype.onerror = function(err){
	  if (this.listeners('error').length) {
	    this.emit('error', err);
	  } else {
	    console.error('Missing error handler on `socket`.');
	    console.error(err.stack);
	  }
	};

	/**
	 * Called upon closing. Called by `Client`.
	 *
	 * @param {String} reason
	 * @throw {Error} optional error object
	 * @api private
	 */

	Socket.prototype.onclose = function(reason){
	  if (!this.connected) return this;
	  debug('closing socket - reason %s', reason);
	  this.leaveAll();
	  this.nsp.remove(this);
	  this.client.remove(this);
	  this.connected = false;
	  this.disconnected = true;
	  delete this.nsp.connected[this.id];
	  this.emit('disconnect', reason);
	};

	/**
	 * Produces an `error` packet.
	 *
	 * @param {Object} err error object
	 * @api private
	 */

	Socket.prototype.error = function(err){
	  this.packet({ type: parser.ERROR, data: err });
	};

	/**
	 * Disconnects this client.
	 *
	 * @param {Boolean} close if `true`, closes the underlying connection
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.disconnect = function(close){
	  if (!this.connected) return this;
	  if (close) {
	    this.client.disconnect();
	  } else {
	    this.packet({ type: parser.DISCONNECT });
	    this.onclose('server namespace disconnect');
	  }
	  return this;
	};

	/**
	 * Sets the compress flag.
	 *
	 * @param {Boolean} compress if `true`, compresses the sending data
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.compress = function(compress){
	  this.flags = this.flags || {};
	  this.flags.compress = compress;
	  return this;
	};


/***/ },
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var Emitter = __webpack_require__(19).EventEmitter;
	var parser = __webpack_require__(179);

	/**
	 * Module exports.
	 */

	module.exports = Adapter;

	/**
	 * Memory adapter constructor.
	 *
	 * @param {Namespace} nsp
	 * @api public
	 */

	function Adapter(nsp){
	  this.nsp = nsp;
	  this.rooms = {};
	  this.sids = {};
	  this.encoder = new parser.Encoder();
	}

	/**
	 * Inherits from `EventEmitter`.
	 */

	Adapter.prototype.__proto__ = Emitter.prototype;

	/**
	 * Adds a socket to a room.
	 *
	 * @param {String} socket id
	 * @param {String} room name
	 * @param {Function} callback
	 * @api public
	 */

	Adapter.prototype.add = function(id, room, fn){
	  this.sids[id] = this.sids[id] || {};
	  this.sids[id][room] = true;
	  this.rooms[room] = this.rooms[room] || Room();
	  this.rooms[room].add(id);
	  if (fn) process.nextTick(fn.bind(null, null));
	};

	/**
	 * Removes a socket from a room.
	 *
	 * @param {String} socket id
	 * @param {String} room name
	 * @param {Function} callback
	 * @api public
	 */

	Adapter.prototype.del = function(id, room, fn){
	  this.sids[id] = this.sids[id] || {};
	  delete this.sids[id][room];
	  if (this.rooms.hasOwnProperty(room)) {
	    this.rooms[room].del(id);
	    if (this.rooms[room].length === 0) delete this.rooms[room];
	  }

	  if (fn) process.nextTick(fn.bind(null, null));
	};

	/**
	 * Removes a socket from all rooms it's joined.
	 *
	 * @param {String} socket id
	 * @param {Function} callback
	 * @api public
	 */

	Adapter.prototype.delAll = function(id, fn){
	  var rooms = this.sids[id];
	  if (rooms) {
	    for (var room in rooms) {
	      if (this.rooms.hasOwnProperty(room)) {
	        this.rooms[room].del(id);
	        if (this.rooms[room].length === 0) delete this.rooms[room];
	      }
	    }
	  }
	  delete this.sids[id];

	  if (fn) process.nextTick(fn.bind(null, null));
	};

	/**
	 * Broadcasts a packet.
	 *
	 * Options:
	 *  - `flags` {Object} flags for this packet
	 *  - `except` {Array} sids that should be excluded
	 *  - `rooms` {Array} list of rooms to broadcast to
	 *
	 * @param {Object} packet object
	 * @api public
	 */

	Adapter.prototype.broadcast = function(packet, opts){
	  var rooms = opts.rooms || [];
	  var except = opts.except || [];
	  var flags = opts.flags || {};
	  var packetOpts = {
	    preEncoded: true,
	    volatile: flags.volatile,
	    compress: flags.compress
	  };
	  var ids = {};
	  var self = this;
	  var socket;

	  packet.nsp = this.nsp.name;
	  this.encoder.encode(packet, function(encodedPackets) {
	    if (rooms.length) {
	      for (var i = 0; i < rooms.length; i++) {
	        var room = self.rooms[rooms[i]];
	        if (!room) continue;
	        var sockets = room.sockets;
	        for (var id in sockets) {
	          if (sockets.hasOwnProperty(id)) {
	            if (ids[id] || ~except.indexOf(id)) continue;
	            socket = self.nsp.connected[id];
	            if (socket) {
	              socket.packet(encodedPackets, packetOpts);
	              ids[id] = true;
	            }
	          }
	        }
	      }
	    } else {
	      for (var id in self.sids) {
	        if (self.sids.hasOwnProperty(id)) {
	          if (~except.indexOf(id)) continue;
	          socket = self.nsp.connected[id];
	          if (socket) socket.packet(encodedPackets, packetOpts);
	        }
	      }
	    }
	  });
	};

	/**
	 * Gets a list of clients by sid.
	 *
	 * @param {Array} explicit set of rooms to check.
	 * @api public
	 */

	Adapter.prototype.clients = function(rooms, fn){
	  if ('function' == typeof rooms){
	    fn = rooms;
	    rooms = null;
	  }

	  rooms = rooms || [];

	  var ids = {};
	  var self = this;
	  var sids = [];
	  var socket;

	  if (rooms.length) {
	    for (var i = 0; i < rooms.length; i++) {
	      var room = self.rooms[rooms[i]];
	      if (!room) continue;
	      var sockets = room.sockets;
	      for (var id in sockets) {
	        if (sockets.hasOwnProperty(id)) {
	          if (ids[id]) continue;
	          socket = self.nsp.connected[id];
	          if (socket) {
	            sids.push(id);
	            ids[id] = true;
	          }
	        }
	      }
	    }
	  } else {
	    for (var id in self.sids) {
	      if (self.sids.hasOwnProperty(id)) {
	        socket = self.nsp.connected[id];
	        if (socket) sids.push(id);
	      }
	    }
	  }

	  if (fn) process.nextTick(fn.bind(null, null, sids));
	};

	/**
	* Room constructor.
	*
	* @api private
	*/

	function Room(){
	  if (!(this instanceof Room)) return new Room();
	  this.sockets = {};
	  this.length = 0;
	}

	/**
	 * Adds a socket to a room.
	 *
	 * @param {String} socket id
	 * @api private
	 */

	Room.prototype.add = function(id){
	  if (!this.sockets.hasOwnProperty(id)) {
	    this.sockets[id] = true;
	    this.length++;
	  }
	};

	/**
	 * Removes a socket from a room.
	 *
	 * @param {String} socket id
	 * @api private
	 */

	Room.prototype.del = function(id){
	  if (this.sockets.hasOwnProperty(id)) {
	    delete this.sockets[id];
	    this.length--;
	  }
	};


/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */

	var debug = __webpack_require__(180)('socket.io-parser');
	var json = __webpack_require__(181);
	var isArray = __webpack_require__(146);
	var Emitter = __webpack_require__(147);
	var binary = __webpack_require__(182);
	var isBuf = __webpack_require__(183);

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	exports.protocol = 4;

	/**
	 * Packet types.
	 *
	 * @api public
	 */

	exports.types = [
	  'CONNECT',
	  'DISCONNECT',
	  'EVENT',
	  'BINARY_EVENT',
	  'ACK',
	  'BINARY_ACK',
	  'ERROR'
	];

	/**
	 * Packet type `connect`.
	 *
	 * @api public
	 */

	exports.CONNECT = 0;

	/**
	 * Packet type `disconnect`.
	 *
	 * @api public
	 */

	exports.DISCONNECT = 1;

	/**
	 * Packet type `event`.
	 *
	 * @api public
	 */

	exports.EVENT = 2;

	/**
	 * Packet type `ack`.
	 *
	 * @api public
	 */

	exports.ACK = 3;

	/**
	 * Packet type `error`.
	 *
	 * @api public
	 */

	exports.ERROR = 4;

	/**
	 * Packet type 'binary event'
	 *
	 * @api public
	 */

	exports.BINARY_EVENT = 5;

	/**
	 * Packet type `binary ack`. For acks with binary arguments.
	 *
	 * @api public
	 */

	exports.BINARY_ACK = 6;

	/**
	 * Encoder constructor.
	 *
	 * @api public
	 */

	exports.Encoder = Encoder;

	/**
	 * Decoder constructor.
	 *
	 * @api public
	 */

	exports.Decoder = Decoder;

	/**
	 * A socket.io Encoder instance
	 *
	 * @api public
	 */

	function Encoder() {}

	/**
	 * Encode a packet as a single string if non-binary, or as a
	 * buffer sequence, depending on packet type.
	 *
	 * @param {Object} obj - packet object
	 * @param {Function} callback - function to handle encodings (likely engine.write)
	 * @return Calls callback with Array of encodings
	 * @api public
	 */

	Encoder.prototype.encode = function(obj, callback){
	  debug('encoding packet %j', obj);

	  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
	    encodeAsBinary(obj, callback);
	  }
	  else {
	    var encoding = encodeAsString(obj);
	    callback([encoding]);
	  }
	};

	/**
	 * Encode packet as string.
	 *
	 * @param {Object} packet
	 * @return {String} encoded
	 * @api private
	 */

	function encodeAsString(obj) {
	  var str = '';
	  var nsp = false;

	  // first is type
	  str += obj.type;

	  // attachments if we have them
	  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
	    str += obj.attachments;
	    str += '-';
	  }

	  // if we have a namespace other than `/`
	  // we append it followed by a comma `,`
	  if (obj.nsp && '/' != obj.nsp) {
	    nsp = true;
	    str += obj.nsp;
	  }

	  // immediately followed by the id
	  if (null != obj.id) {
	    if (nsp) {
	      str += ',';
	      nsp = false;
	    }
	    str += obj.id;
	  }

	  // json data
	  if (null != obj.data) {
	    if (nsp) str += ',';
	    str += json.stringify(obj.data);
	  }

	  debug('encoded %j as %s', obj, str);
	  return str;
	}

	/**
	 * Encode packet as 'buffer sequence' by removing blobs, and
	 * deconstructing packet into object with placeholders and
	 * a list of buffers.
	 *
	 * @param {Object} packet
	 * @return {Buffer} encoded
	 * @api private
	 */

	function encodeAsBinary(obj, callback) {

	  function writeEncoding(bloblessData) {
	    var deconstruction = binary.deconstructPacket(bloblessData);
	    var pack = encodeAsString(deconstruction.packet);
	    var buffers = deconstruction.buffers;

	    buffers.unshift(pack); // add packet info to beginning of data list
	    callback(buffers); // write all the buffers
	  }

	  binary.removeBlobs(obj, writeEncoding);
	}

	/**
	 * A socket.io Decoder instance
	 *
	 * @return {Object} decoder
	 * @api public
	 */

	function Decoder() {
	  this.reconstructor = null;
	}

	/**
	 * Mix in `Emitter` with Decoder.
	 */

	Emitter(Decoder.prototype);

	/**
	 * Decodes an ecoded packet string into packet JSON.
	 *
	 * @param {String} obj - encoded packet
	 * @return {Object} packet
	 * @api public
	 */

	Decoder.prototype.add = function(obj) {
	  var packet;
	  if ('string' == typeof obj) {
	    packet = decodeString(obj);
	    if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
	      this.reconstructor = new BinaryReconstructor(packet);

	      // no attachments, labeled binary but no binary data to follow
	      if (this.reconstructor.reconPack.attachments == 0) {
	        this.emit('decoded', packet);
	      }
	    } else { // non-binary full packet
	      this.emit('decoded', packet);
	    }
	  }
	  else if (isBuf(obj) || obj.base64) { // raw binary data
	    if (!this.reconstructor) {
	      throw new Error('got binary data when not reconstructing a packet');
	    } else {
	      packet = this.reconstructor.takeBinaryData(obj);
	      if (packet) { // received final buffer
	        this.reconstructor = null;
	        this.emit('decoded', packet);
	      }
	    }
	  }
	  else {
	    throw new Error('Unknown type: ' + obj);
	  }
	};

	/**
	 * Decode a packet String (JSON data)
	 *
	 * @param {String} str
	 * @return {Object} packet
	 * @api private
	 */

	function decodeString(str) {
	  var p = {};
	  var i = 0;

	  // look up type
	  p.type = Number(str.charAt(0));
	  if (null == exports.types[p.type]) return error();

	  // look up attachments if type binary
	  if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
	    p.attachments = '';
	    while (str.charAt(++i) != '-') {
	      p.attachments += str.charAt(i);
	    }
	    p.attachments = Number(p.attachments);
	  }

	  // look up namespace (if any)
	  if ('/' == str.charAt(i + 1)) {
	    p.nsp = '';
	    while (++i) {
	      var c = str.charAt(i);
	      if (',' == c) break;
	      p.nsp += c;
	      if (i + 1 == str.length) break;
	    }
	  } else {
	    p.nsp = '/';
	  }

	  // look up id
	  var next = str.charAt(i + 1);
	  if ('' != next && Number(next) == next) {
	    p.id = '';
	    while (++i) {
	      var c = str.charAt(i);
	      if (null == c || Number(c) != c) {
	        --i;
	        break;
	      }
	      p.id += str.charAt(i);
	      if (i + 1 == str.length) break;
	    }
	    p.id = Number(p.id);
	  }

	  // look up json data
	  if (str.charAt(++i)) {
	    try {
	      p.data = json.parse(str.substr(i));
	    } catch(e){
	      return error();
	    }
	  }

	  debug('decoded %s as %j', str, p);
	  return p;
	}

	/**
	 * Deallocates a parser's resources
	 *
	 * @api public
	 */

	Decoder.prototype.destroy = function() {
	  if (this.reconstructor) {
	    this.reconstructor.finishedReconstruction();
	  }
	};

	/**
	 * A manager of a binary event's 'buffer sequence'. Should
	 * be constructed whenever a packet of type BINARY_EVENT is
	 * decoded.
	 *
	 * @param {Object} packet
	 * @return {BinaryReconstructor} initialized reconstructor
	 * @api private
	 */

	function BinaryReconstructor(packet) {
	  this.reconPack = packet;
	  this.buffers = [];
	}

	/**
	 * Method to be called when binary data received from connection
	 * after a BINARY_EVENT packet.
	 *
	 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
	 * @return {null | Object} returns null if more binary data is expected or
	 *   a reconstructed packet object if all buffers have been received.
	 * @api private
	 */

	BinaryReconstructor.prototype.takeBinaryData = function(binData) {
	  this.buffers.push(binData);
	  if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
	    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
	    this.finishedReconstruction();
	    return packet;
	  }
	  return null;
	};

	/**
	 * Cleans up binary packet reconstruction variables.
	 *
	 * @api private
	 */

	BinaryReconstructor.prototype.finishedReconstruction = function() {
	  this.reconPack = null;
	  this.buffers = [];
	};

	function error(data){
	  return {
	    type: exports.ERROR,
	    data: 'parser error'
	  };
	}


/***/ },
/* 180 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var tty = __webpack_require__(24);

	/**
	 * Expose `debug()` as the module.
	 */

	module.exports = debug;

	/**
	 * Enabled debuggers.
	 */

	var names = []
	  , skips = [];

	(process.env.DEBUG || '')
	  .split(/[\s,]+/)
	  .forEach(function(name){
	    name = name.replace('*', '.*?');
	    if (name[0] === '-') {
	      skips.push(new RegExp('^' + name.substr(1) + '$'));
	    } else {
	      names.push(new RegExp('^' + name + '$'));
	    }
	  });

	/**
	 * Colors.
	 */

	var colors = [6, 2, 3, 4, 5, 1];

	/**
	 * Previous debug() call.
	 */

	var prev = {};

	/**
	 * Previously assigned color.
	 */

	var prevColor = 0;

	/**
	 * Is stdout a TTY? Colored output is disabled when `true`.
	 */

	var isatty = tty.isatty(2);

	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */

	function color() {
	  return colors[prevColor++ % colors.length];
	}

	/**
	 * Humanize the given `ms`.
	 *
	 * @param {Number} m
	 * @return {String}
	 * @api private
	 */

	function humanize(ms) {
	  var sec = 1000
	    , min = 60 * 1000
	    , hour = 60 * min;

	  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
	  if (ms >= min) return (ms / min).toFixed(1) + 'm';
	  if (ms >= sec) return (ms / sec | 0) + 's';
	  return ms + 'ms';
	}

	/**
	 * Create a debugger with the given `name`.
	 *
	 * @param {String} name
	 * @return {Type}
	 * @api public
	 */

	function debug(name) {
	  function disabled(){}
	  disabled.enabled = false;

	  var match = skips.some(function(re){
	    return re.test(name);
	  });

	  if (match) return disabled;

	  match = names.some(function(re){
	    return re.test(name);
	  });

	  if (!match) return disabled;
	  var c = color();

	  function colored(fmt) {
	    fmt = coerce(fmt);

	    var curr = new Date;
	    var ms = curr - (prev[name] || curr);
	    prev[name] = curr;

	    fmt = '  \u001b[9' + c + 'm' + name + ' '
	      + '\u001b[3' + c + 'm\u001b[90m'
	      + fmt + '\u001b[3' + c + 'm'
	      + ' +' + humanize(ms) + '\u001b[0m';

	    console.error.apply(this, arguments);
	  }

	  function plain(fmt) {
	    fmt = coerce(fmt);

	    fmt = new Date().toUTCString()
	      + ' ' + name + ' ' + fmt;
	    console.error.apply(this, arguments);
	  }

	  colored.enabled = plain.enabled = true;

	  return isatty || process.env.DEBUG_COLORS
	    ? colored
	    : plain;
	}

	/**
	 * Coerce `val`.
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}


/***/ },
/* 181 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*! JSON v3.2.6 | http://bestiejs.github.io/json3 | Copyright 2012-2013, Kit Cambridge | http://kit.mit-license.org */
	;(function (window) {
	  // Convenience aliases.
	  var getClass = {}.toString, isProperty, forEach, undef;

	  // Detect the `define` function exposed by asynchronous module loaders. The
	  // strict `define` check is necessary for compatibility with `r.js`.
	  var isLoader = "function" === "function" && __webpack_require__(145);

	  // Detect native implementations.
	  var nativeJSON = typeof JSON == "object" && JSON;

	  // Set up the JSON 3 namespace, preferring the CommonJS `exports` object if
	  // available.
	  var JSON3 = typeof exports == "object" && exports && !exports.nodeType && exports;

	  if (JSON3 && nativeJSON) {
	    // Explicitly delegate to the native `stringify` and `parse`
	    // implementations in CommonJS environments.
	    JSON3.stringify = nativeJSON.stringify;
	    JSON3.parse = nativeJSON.parse;
	  } else {
	    // Export for web browsers, JavaScript engines, and asynchronous module
	    // loaders, using the global `JSON` object if available.
	    JSON3 = window.JSON = nativeJSON || {};
	  }

	  // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
	  var isExtended = new Date(-3509827334573292);
	  try {
	    // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
	    // results for certain dates in Opera >= 10.53.
	    isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
	      // Safari < 2.0.2 stores the internal millisecond time value correctly,
	      // but clips the values returned by the date methods to the range of
	      // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
	      isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
	  } catch (exception) {}

	  // Internal: Determines whether the native `JSON.stringify` and `parse`
	  // implementations are spec-compliant. Based on work by Ken Snyder.
	  function has(name) {
	    if (has[name] !== undef) {
	      // Return cached feature test result.
	      return has[name];
	    }

	    var isSupported;
	    if (name == "bug-string-char-index") {
	      // IE <= 7 doesn't support accessing string characters using square
	      // bracket notation. IE 8 only supports this for primitives.
	      isSupported = "a"[0] != "a";
	    } else if (name == "json") {
	      // Indicates whether both `JSON.stringify` and `JSON.parse` are
	      // supported.
	      isSupported = has("json-stringify") && has("json-parse");
	    } else {
	      var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
	      // Test `JSON.stringify`.
	      if (name == "json-stringify") {
	        var stringify = JSON3.stringify, stringifySupported = typeof stringify == "function" && isExtended;
	        if (stringifySupported) {
	          // A test function object with a custom `toJSON` method.
	          (value = function () {
	            return 1;
	          }).toJSON = value;
	          try {
	            stringifySupported =
	              // Firefox 3.1b1 and b2 serialize string, number, and boolean
	              // primitives as object literals.
	              stringify(0) === "0" &&
	              // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
	              // literals.
	              stringify(new Number()) === "0" &&
	              stringify(new String()) == '""' &&
	              // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
	              // does not define a canonical JSON representation (this applies to
	              // objects with `toJSON` properties as well, *unless* they are nested
	              // within an object or array).
	              stringify(getClass) === undef &&
	              // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
	              // FF 3.1b3 pass this test.
	              stringify(undef) === undef &&
	              // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
	              // respectively, if the value is omitted entirely.
	              stringify() === undef &&
	              // FF 3.1b1, 2 throw an error if the given value is not a number,
	              // string, array, object, Boolean, or `null` literal. This applies to
	              // objects with custom `toJSON` methods as well, unless they are nested
	              // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
	              // methods entirely.
	              stringify(value) === "1" &&
	              stringify([value]) == "[1]" &&
	              // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
	              // `"[null]"`.
	              stringify([undef]) == "[null]" &&
	              // YUI 3.0.0b1 fails to serialize `null` literals.
	              stringify(null) == "null" &&
	              // FF 3.1b1, 2 halts serialization if an array contains a function:
	              // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
	              // elides non-JSON values from objects and arrays, unless they
	              // define custom `toJSON` methods.
	              stringify([undef, getClass, null]) == "[null,null,null]" &&
	              // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
	              // where character escape codes are expected (e.g., `\b` => `\u0008`).
	              stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
	              // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
	              stringify(null, value) === "1" &&
	              stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
	              // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
	              // serialize extended years.
	              stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
	              // The milliseconds are optional in ES 5, but required in 5.1.
	              stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
	              // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
	              // four-digit years instead of six-digit years. Credits: @Yaffle.
	              stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
	              // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
	              // values less than 1000. Credits: @Yaffle.
	              stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
	          } catch (exception) {
	            stringifySupported = false;
	          }
	        }
	        isSupported = stringifySupported;
	      }
	      // Test `JSON.parse`.
	      if (name == "json-parse") {
	        var parse = JSON3.parse;
	        if (typeof parse == "function") {
	          try {
	            // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
	            // Conforming implementations should also coerce the initial argument to
	            // a string prior to parsing.
	            if (parse("0") === 0 && !parse(false)) {
	              // Simple parsing test.
	              value = parse(serialized);
	              var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
	              if (parseSupported) {
	                try {
	                  // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
	                  parseSupported = !parse('"\t"');
	                } catch (exception) {}
	                if (parseSupported) {
	                  try {
	                    // FF 4.0 and 4.0.1 allow leading `+` signs and leading
	                    // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
	                    // certain octal literals.
	                    parseSupported = parse("01") !== 1;
	                  } catch (exception) {}
	                }
	                if (parseSupported) {
	                  try {
	                    // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
	                    // points. These environments, along with FF 3.1b1 and 2,
	                    // also allow trailing commas in JSON objects and arrays.
	                    parseSupported = parse("1.") !== 1;
	                  } catch (exception) {}
	                }
	              }
	            }
	          } catch (exception) {
	            parseSupported = false;
	          }
	        }
	        isSupported = parseSupported;
	      }
	    }
	    return has[name] = !!isSupported;
	  }

	  if (!has("json")) {
	    // Common `[[Class]]` name aliases.
	    var functionClass = "[object Function]";
	    var dateClass = "[object Date]";
	    var numberClass = "[object Number]";
	    var stringClass = "[object String]";
	    var arrayClass = "[object Array]";
	    var booleanClass = "[object Boolean]";

	    // Detect incomplete support for accessing string characters by index.
	    var charIndexBuggy = has("bug-string-char-index");

	    // Define additional utility methods if the `Date` methods are buggy.
	    if (!isExtended) {
	      var floor = Math.floor;
	      // A mapping between the months of the year and the number of days between
	      // January 1st and the first of the respective month.
	      var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	      // Internal: Calculates the number of days between the Unix epoch and the
	      // first day of the given month.
	      var getDay = function (year, month) {
	        return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
	      };
	    }

	    // Internal: Determines if a property is a direct property of the given
	    // object. Delegates to the native `Object#hasOwnProperty` method.
	    if (!(isProperty = {}.hasOwnProperty)) {
	      isProperty = function (property) {
	        var members = {}, constructor;
	        if ((members.__proto__ = null, members.__proto__ = {
	          // The *proto* property cannot be set multiple times in recent
	          // versions of Firefox and SeaMonkey.
	          "toString": 1
	        }, members).toString != getClass) {
	          // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
	          // supports the mutable *proto* property.
	          isProperty = function (property) {
	            // Capture and break the object's prototype chain (see section 8.6.2
	            // of the ES 5.1 spec). The parenthesized expression prevents an
	            // unsafe transformation by the Closure Compiler.
	            var original = this.__proto__, result = property in (this.__proto__ = null, this);
	            // Restore the original prototype chain.
	            this.__proto__ = original;
	            return result;
	          };
	        } else {
	          // Capture a reference to the top-level `Object` constructor.
	          constructor = members.constructor;
	          // Use the `constructor` property to simulate `Object#hasOwnProperty` in
	          // other environments.
	          isProperty = function (property) {
	            var parent = (this.constructor || constructor).prototype;
	            return property in this && !(property in parent && this[property] === parent[property]);
	          };
	        }
	        members = null;
	        return isProperty.call(this, property);
	      };
	    }

	    // Internal: A set of primitive types used by `isHostType`.
	    var PrimitiveTypes = {
	      'boolean': 1,
	      'number': 1,
	      'string': 1,
	      'undefined': 1
	    };

	    // Internal: Determines if the given object `property` value is a
	    // non-primitive.
	    var isHostType = function (object, property) {
	      var type = typeof object[property];
	      return type == 'object' ? !!object[property] : !PrimitiveTypes[type];
	    };

	    // Internal: Normalizes the `for...in` iteration algorithm across
	    // environments. Each enumerated key is yielded to a `callback` function.
	    forEach = function (object, callback) {
	      var size = 0, Properties, members, property;

	      // Tests for bugs in the current environment's `for...in` algorithm. The
	      // `valueOf` property inherits the non-enumerable flag from
	      // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
	      (Properties = function () {
	        this.valueOf = 0;
	      }).prototype.valueOf = 0;

	      // Iterate over a new instance of the `Properties` class.
	      members = new Properties();
	      for (property in members) {
	        // Ignore all properties inherited from `Object.prototype`.
	        if (isProperty.call(members, property)) {
	          size++;
	        }
	      }
	      Properties = members = null;

	      // Normalize the iteration algorithm.
	      if (!size) {
	        // A list of non-enumerable properties inherited from `Object.prototype`.
	        members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
	        // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
	        // properties.
	        forEach = function (object, callback) {
	          var isFunction = getClass.call(object) == functionClass, property, length;
	          var hasProperty = !isFunction && typeof object.constructor != 'function' && isHostType(object, 'hasOwnProperty') ? object.hasOwnProperty : isProperty;
	          for (property in object) {
	            // Gecko <= 1.0 enumerates the `prototype` property of functions under
	            // certain conditions; IE does not.
	            if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
	              callback(property);
	            }
	          }
	          // Manually invoke the callback for each non-enumerable property.
	          for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
	        };
	      } else if (size == 2) {
	        // Safari <= 2.0.4 enumerates shadowed properties twice.
	        forEach = function (object, callback) {
	          // Create a set of iterated properties.
	          var members = {}, isFunction = getClass.call(object) == functionClass, property;
	          for (property in object) {
	            // Store each property name to prevent double enumeration. The
	            // `prototype` property of functions is not enumerated due to cross-
	            // environment inconsistencies.
	            if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
	              callback(property);
	            }
	          }
	        };
	      } else {
	        // No bugs detected; use the standard `for...in` algorithm.
	        forEach = function (object, callback) {
	          var isFunction = getClass.call(object) == functionClass, property, isConstructor;
	          for (property in object) {
	            if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
	              callback(property);
	            }
	          }
	          // Manually invoke the callback for the `constructor` property due to
	          // cross-environment inconsistencies.
	          if (isConstructor || isProperty.call(object, (property = "constructor"))) {
	            callback(property);
	          }
	        };
	      }
	      return forEach(object, callback);
	    };

	    // Public: Serializes a JavaScript `value` as a JSON string. The optional
	    // `filter` argument may specify either a function that alters how object and
	    // array members are serialized, or an array of strings and numbers that
	    // indicates which properties should be serialized. The optional `width`
	    // argument may be either a string or number that specifies the indentation
	    // level of the output.
	    if (!has("json-stringify")) {
	      // Internal: A map of control characters and their escaped equivalents.
	      var Escapes = {
	        92: "\\\\",
	        34: '\\"',
	        8: "\\b",
	        12: "\\f",
	        10: "\\n",
	        13: "\\r",
	        9: "\\t"
	      };

	      // Internal: Converts `value` into a zero-padded string such that its
	      // length is at least equal to `width`. The `width` must be <= 6.
	      var leadingZeroes = "000000";
	      var toPaddedString = function (width, value) {
	        // The `|| 0` expression is necessary to work around a bug in
	        // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
	        return (leadingZeroes + (value || 0)).slice(-width);
	      };

	      // Internal: Double-quotes a string `value`, replacing all ASCII control
	      // characters (characters with code unit values between 0 and 31) with
	      // their escaped equivalents. This is an implementation of the
	      // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
	      var unicodePrefix = "\\u00";
	      var quote = function (value) {
	        var result = '"', index = 0, length = value.length, isLarge = length > 10 && charIndexBuggy, symbols;
	        if (isLarge) {
	          symbols = value.split("");
	        }
	        for (; index < length; index++) {
	          var charCode = value.charCodeAt(index);
	          // If the character is a control character, append its Unicode or
	          // shorthand escape sequence; otherwise, append the character as-is.
	          switch (charCode) {
	            case 8: case 9: case 10: case 12: case 13: case 34: case 92:
	              result += Escapes[charCode];
	              break;
	            default:
	              if (charCode < 32) {
	                result += unicodePrefix + toPaddedString(2, charCode.toString(16));
	                break;
	              }
	              result += isLarge ? symbols[index] : charIndexBuggy ? value.charAt(index) : value[index];
	          }
	        }
	        return result + '"';
	      };

	      // Internal: Recursively serializes an object. Implements the
	      // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
	      var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
	        var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
	        try {
	          // Necessary for host object support.
	          value = object[property];
	        } catch (exception) {}
	        if (typeof value == "object" && value) {
	          className = getClass.call(value);
	          if (className == dateClass && !isProperty.call(value, "toJSON")) {
	            if (value > -1 / 0 && value < 1 / 0) {
	              // Dates are serialized according to the `Date#toJSON` method
	              // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
	              // for the ISO 8601 date time string format.
	              if (getDay) {
	                // Manually compute the year, month, date, hours, minutes,
	                // seconds, and milliseconds if the `getUTC*` methods are
	                // buggy. Adapted from @Yaffle's `date-shim` project.
	                date = floor(value / 864e5);
	                for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
	                for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
	                date = 1 + date - getDay(year, month);
	                // The `time` value specifies the time within the day (see ES
	                // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
	                // to compute `A modulo B`, as the `%` operator does not
	                // correspond to the `modulo` operation for negative numbers.
	                time = (value % 864e5 + 864e5) % 864e5;
	                // The hours, minutes, seconds, and milliseconds are obtained by
	                // decomposing the time within the day. See section 15.9.1.10.
	                hours = floor(time / 36e5) % 24;
	                minutes = floor(time / 6e4) % 60;
	                seconds = floor(time / 1e3) % 60;
	                milliseconds = time % 1e3;
	              } else {
	                year = value.getUTCFullYear();
	                month = value.getUTCMonth();
	                date = value.getUTCDate();
	                hours = value.getUTCHours();
	                minutes = value.getUTCMinutes();
	                seconds = value.getUTCSeconds();
	                milliseconds = value.getUTCMilliseconds();
	              }
	              // Serialize extended years correctly.
	              value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
	                "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
	                // Months, dates, hours, minutes, and seconds should have two
	                // digits; milliseconds should have three.
	                "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
	                // Milliseconds are optional in ES 5.0, but required in 5.1.
	                "." + toPaddedString(3, milliseconds) + "Z";
	            } else {
	              value = null;
	            }
	          } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
	            // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
	            // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
	            // ignores all `toJSON` methods on these objects unless they are
	            // defined directly on an instance.
	            value = value.toJSON(property);
	          }
	        }
	        if (callback) {
	          // If a replacement function was provided, call it to obtain the value
	          // for serialization.
	          value = callback.call(object, property, value);
	        }
	        if (value === null) {
	          return "null";
	        }
	        className = getClass.call(value);
	        if (className == booleanClass) {
	          // Booleans are represented literally.
	          return "" + value;
	        } else if (className == numberClass) {
	          // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
	          // `"null"`.
	          return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
	        } else if (className == stringClass) {
	          // Strings are double-quoted and escaped.
	          return quote("" + value);
	        }
	        // Recursively serialize objects and arrays.
	        if (typeof value == "object") {
	          // Check for cyclic structures. This is a linear search; performance
	          // is inversely proportional to the number of unique nested objects.
	          for (length = stack.length; length--;) {
	            if (stack[length] === value) {
	              // Cyclic structures cannot be serialized by `JSON.stringify`.
	              throw TypeError();
	            }
	          }
	          // Add the object to the stack of traversed objects.
	          stack.push(value);
	          results = [];
	          // Save the current indentation level and indent one additional level.
	          prefix = indentation;
	          indentation += whitespace;
	          if (className == arrayClass) {
	            // Recursively serialize array elements.
	            for (index = 0, length = value.length; index < length; index++) {
	              element = serialize(index, value, callback, properties, whitespace, indentation, stack);
	              results.push(element === undef ? "null" : element);
	            }
	            result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
	          } else {
	            // Recursively serialize object members. Members are selected from
	            // either a user-specified list of property names, or the object
	            // itself.
	            forEach(properties || value, function (property) {
	              var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
	              if (element !== undef) {
	                // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
	                // is not the empty string, let `member` {quote(property) + ":"}
	                // be the concatenation of `member` and the `space` character."
	                // The "`space` character" refers to the literal space
	                // character, not the `space` {width} argument provided to
	                // `JSON.stringify`.
	                results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
	              }
	            });
	            result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
	          }
	          // Remove the object from the traversed object stack.
	          stack.pop();
	          return result;
	        }
	      };

	      // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
	      JSON3.stringify = function (source, filter, width) {
	        var whitespace, callback, properties, className;
	        if (typeof filter == "function" || typeof filter == "object" && filter) {
	          if ((className = getClass.call(filter)) == functionClass) {
	            callback = filter;
	          } else if (className == arrayClass) {
	            // Convert the property names array into a makeshift set.
	            properties = {};
	            for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
	          }
	        }
	        if (width) {
	          if ((className = getClass.call(width)) == numberClass) {
	            // Convert the `width` to an integer and create a string containing
	            // `width` number of space characters.
	            if ((width -= width % 1) > 0) {
	              for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
	            }
	          } else if (className == stringClass) {
	            whitespace = width.length <= 10 ? width : width.slice(0, 10);
	          }
	        }
	        // Opera <= 7.54u2 discards the values associated with empty string keys
	        // (`""`) only if they are used directly within an object member list
	        // (e.g., `!("" in { "": 1})`).
	        return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
	      };
	    }

	    // Public: Parses a JSON source string.
	    if (!has("json-parse")) {
	      var fromCharCode = String.fromCharCode;

	      // Internal: A map of escaped control characters and their unescaped
	      // equivalents.
	      var Unescapes = {
	        92: "\\",
	        34: '"',
	        47: "/",
	        98: "\b",
	        116: "\t",
	        110: "\n",
	        102: "\f",
	        114: "\r"
	      };

	      // Internal: Stores the parser state.
	      var Index, Source;

	      // Internal: Resets the parser state and throws a `SyntaxError`.
	      var abort = function() {
	        Index = Source = null;
	        throw SyntaxError();
	      };

	      // Internal: Returns the next token, or `"$"` if the parser has reached
	      // the end of the source string. A token may be a string, number, `null`
	      // literal, or Boolean literal.
	      var lex = function () {
	        var source = Source, length = source.length, value, begin, position, isSigned, charCode;
	        while (Index < length) {
	          charCode = source.charCodeAt(Index);
	          switch (charCode) {
	            case 9: case 10: case 13: case 32:
	              // Skip whitespace tokens, including tabs, carriage returns, line
	              // feeds, and space characters.
	              Index++;
	              break;
	            case 123: case 125: case 91: case 93: case 58: case 44:
	              // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
	              // the current position.
	              value = charIndexBuggy ? source.charAt(Index) : source[Index];
	              Index++;
	              return value;
	            case 34:
	              // `"` delimits a JSON string; advance to the next character and
	              // begin parsing the string. String tokens are prefixed with the
	              // sentinel `@` character to distinguish them from punctuators and
	              // end-of-string tokens.
	              for (value = "@", Index++; Index < length;) {
	                charCode = source.charCodeAt(Index);
	                if (charCode < 32) {
	                  // Unescaped ASCII control characters (those with a code unit
	                  // less than the space character) are not permitted.
	                  abort();
	                } else if (charCode == 92) {
	                  // A reverse solidus (`\`) marks the beginning of an escaped
	                  // control character (including `"`, `\`, and `/`) or Unicode
	                  // escape sequence.
	                  charCode = source.charCodeAt(++Index);
	                  switch (charCode) {
	                    case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
	                      // Revive escaped control characters.
	                      value += Unescapes[charCode];
	                      Index++;
	                      break;
	                    case 117:
	                      // `\u` marks the beginning of a Unicode escape sequence.
	                      // Advance to the first character and validate the
	                      // four-digit code point.
	                      begin = ++Index;
	                      for (position = Index + 4; Index < position; Index++) {
	                        charCode = source.charCodeAt(Index);
	                        // A valid sequence comprises four hexdigits (case-
	                        // insensitive) that form a single hexadecimal value.
	                        if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
	                          // Invalid Unicode escape sequence.
	                          abort();
	                        }
	                      }
	                      // Revive the escaped character.
	                      value += fromCharCode("0x" + source.slice(begin, Index));
	                      break;
	                    default:
	                      // Invalid escape sequence.
	                      abort();
	                  }
	                } else {
	                  if (charCode == 34) {
	                    // An unescaped double-quote character marks the end of the
	                    // string.
	                    break;
	                  }
	                  charCode = source.charCodeAt(Index);
	                  begin = Index;
	                  // Optimize for the common case where a string is valid.
	                  while (charCode >= 32 && charCode != 92 && charCode != 34) {
	                    charCode = source.charCodeAt(++Index);
	                  }
	                  // Append the string as-is.
	                  value += source.slice(begin, Index);
	                }
	              }
	              if (source.charCodeAt(Index) == 34) {
	                // Advance to the next character and return the revived string.
	                Index++;
	                return value;
	              }
	              // Unterminated string.
	              abort();
	            default:
	              // Parse numbers and literals.
	              begin = Index;
	              // Advance past the negative sign, if one is specified.
	              if (charCode == 45) {
	                isSigned = true;
	                charCode = source.charCodeAt(++Index);
	              }
	              // Parse an integer or floating-point value.
	              if (charCode >= 48 && charCode <= 57) {
	                // Leading zeroes are interpreted as octal literals.
	                if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
	                  // Illegal octal literal.
	                  abort();
	                }
	                isSigned = false;
	                // Parse the integer component.
	                for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
	                // Floats cannot contain a leading decimal point; however, this
	                // case is already accounted for by the parser.
	                if (source.charCodeAt(Index) == 46) {
	                  position = ++Index;
	                  // Parse the decimal component.
	                  for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
	                  if (position == Index) {
	                    // Illegal trailing decimal.
	                    abort();
	                  }
	                  Index = position;
	                }
	                // Parse exponents. The `e` denoting the exponent is
	                // case-insensitive.
	                charCode = source.charCodeAt(Index);
	                if (charCode == 101 || charCode == 69) {
	                  charCode = source.charCodeAt(++Index);
	                  // Skip past the sign following the exponent, if one is
	                  // specified.
	                  if (charCode == 43 || charCode == 45) {
	                    Index++;
	                  }
	                  // Parse the exponential component.
	                  for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
	                  if (position == Index) {
	                    // Illegal empty exponent.
	                    abort();
	                  }
	                  Index = position;
	                }
	                // Coerce the parsed value to a JavaScript number.
	                return +source.slice(begin, Index);
	              }
	              // A negative sign may only precede numbers.
	              if (isSigned) {
	                abort();
	              }
	              // `true`, `false`, and `null` literals.
	              if (source.slice(Index, Index + 4) == "true") {
	                Index += 4;
	                return true;
	              } else if (source.slice(Index, Index + 5) == "false") {
	                Index += 5;
	                return false;
	              } else if (source.slice(Index, Index + 4) == "null") {
	                Index += 4;
	                return null;
	              }
	              // Unrecognized token.
	              abort();
	          }
	        }
	        // Return the sentinel `$` character if the parser has reached the end
	        // of the source string.
	        return "$";
	      };

	      // Internal: Parses a JSON `value` token.
	      var get = function (value) {
	        var results, hasMembers;
	        if (value == "$") {
	          // Unexpected end of input.
	          abort();
	        }
	        if (typeof value == "string") {
	          if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
	            // Remove the sentinel `@` character.
	            return value.slice(1);
	          }
	          // Parse object and array literals.
	          if (value == "[") {
	            // Parses a JSON array, returning a new JavaScript array.
	            results = [];
	            for (;; hasMembers || (hasMembers = true)) {
	              value = lex();
	              // A closing square bracket marks the end of the array literal.
	              if (value == "]") {
	                break;
	              }
	              // If the array literal contains elements, the current token
	              // should be a comma separating the previous element from the
	              // next.
	              if (hasMembers) {
	                if (value == ",") {
	                  value = lex();
	                  if (value == "]") {
	                    // Unexpected trailing `,` in array literal.
	                    abort();
	                  }
	                } else {
	                  // A `,` must separate each array element.
	                  abort();
	                }
	              }
	              // Elisions and leading commas are not permitted.
	              if (value == ",") {
	                abort();
	              }
	              results.push(get(value));
	            }
	            return results;
	          } else if (value == "{") {
	            // Parses a JSON object, returning a new JavaScript object.
	            results = {};
	            for (;; hasMembers || (hasMembers = true)) {
	              value = lex();
	              // A closing curly brace marks the end of the object literal.
	              if (value == "}") {
	                break;
	              }
	              // If the object literal contains members, the current token
	              // should be a comma separator.
	              if (hasMembers) {
	                if (value == ",") {
	                  value = lex();
	                  if (value == "}") {
	                    // Unexpected trailing `,` in object literal.
	                    abort();
	                  }
	                } else {
	                  // A `,` must separate each object member.
	                  abort();
	                }
	              }
	              // Leading commas are not permitted, object property names must be
	              // double-quoted strings, and a `:` must separate each property
	              // name and value.
	              if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
	                abort();
	              }
	              results[value.slice(1)] = get(lex());
	            }
	            return results;
	          }
	          // Unexpected token encountered.
	          abort();
	        }
	        return value;
	      };

	      // Internal: Updates a traversed object member.
	      var update = function(source, property, callback) {
	        var element = walk(source, property, callback);
	        if (element === undef) {
	          delete source[property];
	        } else {
	          source[property] = element;
	        }
	      };

	      // Internal: Recursively traverses a parsed JSON object, invoking the
	      // `callback` function for each value. This is an implementation of the
	      // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
	      var walk = function (source, property, callback) {
	        var value = source[property], length;
	        if (typeof value == "object" && value) {
	          // `forEach` can't be used to traverse an array in Opera <= 8.54
	          // because its `Object#hasOwnProperty` implementation returns `false`
	          // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
	          if (getClass.call(value) == arrayClass) {
	            for (length = value.length; length--;) {
	              update(value, length, callback);
	            }
	          } else {
	            forEach(value, function (property) {
	              update(value, property, callback);
	            });
	          }
	        }
	        return callback.call(source, property, value);
	      };

	      // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
	      JSON3.parse = function (source, callback) {
	        var result, value;
	        Index = 0;
	        Source = "" + source;
	        result = get(lex());
	        // If a JSON string contains multiple tokens, it is invalid.
	        if (lex() != "$") {
	          abort();
	        }
	        // Reset the parser state.
	        Index = Source = null;
	        return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
	      };
	    }
	  }

	  // Export for asynchronous module loaders.
	  if (isLoader) {
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	      return JSON3;
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }
	}(this));


/***/ },
/* 182 */
/***/ function(module, exports, __webpack_require__) {

	/*global Blob,File*/

	/**
	 * Module requirements
	 */

	var isArray = __webpack_require__(146);
	var isBuf = __webpack_require__(183);

	/**
	 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
	 * Anything with blobs or files should be fed through removeBlobs before coming
	 * here.
	 *
	 * @param {Object} packet - socket.io event packet
	 * @return {Object} with deconstructed packet and list of buffers
	 * @api public
	 */

	exports.deconstructPacket = function(packet){
	  var buffers = [];
	  var packetData = packet.data;

	  function _deconstructPacket(data) {
	    if (!data) return data;

	    if (isBuf(data)) {
	      var placeholder = { _placeholder: true, num: buffers.length };
	      buffers.push(data);
	      return placeholder;
	    } else if (isArray(data)) {
	      var newData = new Array(data.length);
	      for (var i = 0; i < data.length; i++) {
	        newData[i] = _deconstructPacket(data[i]);
	      }
	      return newData;
	    } else if ('object' == typeof data && !(data instanceof Date)) {
	      var newData = {};
	      for (var key in data) {
	        newData[key] = _deconstructPacket(data[key]);
	      }
	      return newData;
	    }
	    return data;
	  }

	  var pack = packet;
	  pack.data = _deconstructPacket(packetData);
	  pack.attachments = buffers.length; // number of binary 'attachments'
	  return {packet: pack, buffers: buffers};
	};

	/**
	 * Reconstructs a binary packet from its placeholder packet and buffers
	 *
	 * @param {Object} packet - event packet with placeholders
	 * @param {Array} buffers - binary buffers to put in placeholder positions
	 * @return {Object} reconstructed packet
	 * @api public
	 */

	exports.reconstructPacket = function(packet, buffers) {
	  var curPlaceHolder = 0;

	  function _reconstructPacket(data) {
	    if (data && data._placeholder) {
	      var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
	      return buf;
	    } else if (isArray(data)) {
	      for (var i = 0; i < data.length; i++) {
	        data[i] = _reconstructPacket(data[i]);
	      }
	      return data;
	    } else if (data && 'object' == typeof data) {
	      for (var key in data) {
	        data[key] = _reconstructPacket(data[key]);
	      }
	      return data;
	    }
	    return data;
	  }

	  packet.data = _reconstructPacket(packet.data);
	  packet.attachments = undefined; // no longer useful
	  return packet;
	};

	/**
	 * Asynchronously removes Blobs or Files from data via
	 * FileReader's readAsArrayBuffer method. Used before encoding
	 * data as msgpack. Calls callback with the blobless data.
	 *
	 * @param {Object} data
	 * @param {Function} callback
	 * @api private
	 */

	exports.removeBlobs = function(data, callback) {
	  function _removeBlobs(obj, curKey, containingObject) {
	    if (!obj) return obj;

	    // convert any blob
	    if ((global.Blob && obj instanceof Blob) ||
	        (global.File && obj instanceof File)) {
	      pendingBlobs++;

	      // async filereader
	      var fileReader = new FileReader();
	      fileReader.onload = function() { // this.result == arraybuffer
	        if (containingObject) {
	          containingObject[curKey] = this.result;
	        }
	        else {
	          bloblessData = this.result;
	        }

	        // if nothing pending its callback time
	        if(! --pendingBlobs) {
	          callback(bloblessData);
	        }
	      };

	      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
	    } else if (isArray(obj)) { // handle array
	      for (var i = 0; i < obj.length; i++) {
	        _removeBlobs(obj[i], i, obj);
	      }
	    } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
	      for (var key in obj) {
	        _removeBlobs(obj[key], key, obj);
	      }
	    }
	  }

	  var pendingBlobs = 0;
	  var bloblessData = data;
	  _removeBlobs(bloblessData);
	  if (!pendingBlobs) {
	    callback(bloblessData);
	  }
	};


/***/ },
/* 183 */
/***/ function(module, exports) {

	
	module.exports = isBuf;

	/**
	 * Returns true if obj is a buffer or an arraybuffer.
	 *
	 * @api private
	 */

	function isBuf(obj) {
	  return (global.Buffer && global.Buffer.isBuffer(obj)) ||
	         (global.ArrayBuffer && obj instanceof ArrayBuffer);
	}


/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

	var require;var require;(function(f){if(true){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.io = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return require(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

	module.exports =  _dereq_('./lib/');

	},{"./lib/":2}],2:[function(_dereq_,module,exports){

	module.exports = _dereq_('./socket');

	/**
	 * Exports parser
	 *
	 * @api public
	 *
	 */
	module.exports.parser = _dereq_('engine.io-parser');

	},{"./socket":3,"engine.io-parser":19}],3:[function(_dereq_,module,exports){
	(function (global){
	/**
	 * Module dependencies.
	 */

	var transports = _dereq_('./transports');
	var Emitter = _dereq_('component-emitter');
	var debug = _dereq_('debug')('engine.io-client:socket');
	var index = _dereq_('indexof');
	var parser = _dereq_('engine.io-parser');
	var parseuri = _dereq_('parseuri');
	var parsejson = _dereq_('parsejson');
	var parseqs = _dereq_('parseqs');

	/**
	 * Module exports.
	 */

	module.exports = Socket;

	/**
	 * Noop function.
	 *
	 * @api private
	 */

	function noop(){}

	/**
	 * Socket constructor.
	 *
	 * @param {String|Object} uri or options
	 * @param {Object} options
	 * @api public
	 */

	function Socket(uri, opts){
	  if (!(this instanceof Socket)) return new Socket(uri, opts);

	  opts = opts || {};

	  if (uri && 'object' == typeof uri) {
	    opts = uri;
	    uri = null;
	  }

	  if (uri) {
	    uri = parseuri(uri);
	    opts.hostname = uri.host;
	    opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
	    opts.port = uri.port;
	    if (uri.query) opts.query = uri.query;
	  } else if (opts.host) {
	    opts.hostname = parseuri(opts.host).host;
	  }

	  this.secure = null != opts.secure ? opts.secure :
	    (global.location && 'https:' == location.protocol);

	  if (opts.hostname && !opts.port) {
	    // if no port is specified manually, use the protocol default
	    opts.port = this.secure ? '443' : '80';
	  }

	  this.agent = opts.agent || false;
	  this.hostname = opts.hostname ||
	    (global.location ? location.hostname : 'localhost');
	  this.port = opts.port || (global.location && location.port ?
	       location.port :
	       (this.secure ? 443 : 80));
	  this.query = opts.query || {};
	  if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
	  this.upgrade = false !== opts.upgrade;
	  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
	  this.forceJSONP = !!opts.forceJSONP;
	  this.jsonp = false !== opts.jsonp;
	  this.forceBase64 = !!opts.forceBase64;
	  this.enablesXDR = !!opts.enablesXDR;
	  this.timestampParam = opts.timestampParam || 't';
	  this.timestampRequests = opts.timestampRequests;
	  this.transports = opts.transports || ['polling', 'websocket'];
	  this.readyState = '';
	  this.writeBuffer = [];
	  this.policyPort = opts.policyPort || 843;
	  this.rememberUpgrade = opts.rememberUpgrade || false;
	  this.binaryType = null;
	  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
	  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

	  if (true === this.perMessageDeflate) this.perMessageDeflate = {};
	  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
	    this.perMessageDeflate.threshold = 1024;
	  }

	  // SSL options for Node.js client
	  this.pfx = opts.pfx || null;
	  this.key = opts.key || null;
	  this.passphrase = opts.passphrase || null;
	  this.cert = opts.cert || null;
	  this.ca = opts.ca || null;
	  this.ciphers = opts.ciphers || null;
	  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? null : opts.rejectUnauthorized;

	  // other options for Node.js client
	  var freeGlobal = typeof global == 'object' && global;
	  if (freeGlobal.global === freeGlobal) {
	    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
	      this.extraHeaders = opts.extraHeaders;
	    }
	  }

	  this.open();
	}

	Socket.priorWebsocketSuccess = false;

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Socket.prototype);

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	Socket.protocol = parser.protocol; // this is an int

	/**
	 * Expose deps for legacy compatibility
	 * and standalone browser access.
	 */

	Socket.Socket = Socket;
	Socket.Transport = _dereq_('./transport');
	Socket.transports = _dereq_('./transports');
	Socket.parser = _dereq_('engine.io-parser');

	/**
	 * Creates transport of the given type.
	 *
	 * @param {String} transport name
	 * @return {Transport}
	 * @api private
	 */

	Socket.prototype.createTransport = function (name) {
	  debug('creating transport "%s"', name);
	  var query = clone(this.query);

	  // append engine.io protocol identifier
	  query.EIO = parser.protocol;

	  // transport name
	  query.transport = name;

	  // session id if we already have one
	  if (this.id) query.sid = this.id;

	  var transport = new transports[name]({
	    agent: this.agent,
	    hostname: this.hostname,
	    port: this.port,
	    secure: this.secure,
	    path: this.path,
	    query: query,
	    forceJSONP: this.forceJSONP,
	    jsonp: this.jsonp,
	    forceBase64: this.forceBase64,
	    enablesXDR: this.enablesXDR,
	    timestampRequests: this.timestampRequests,
	    timestampParam: this.timestampParam,
	    policyPort: this.policyPort,
	    socket: this,
	    pfx: this.pfx,
	    key: this.key,
	    passphrase: this.passphrase,
	    cert: this.cert,
	    ca: this.ca,
	    ciphers: this.ciphers,
	    rejectUnauthorized: this.rejectUnauthorized,
	    perMessageDeflate: this.perMessageDeflate,
	    extraHeaders: this.extraHeaders
	  });

	  return transport;
	};

	function clone (obj) {
	  var o = {};
	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      o[i] = obj[i];
	    }
	  }
	  return o;
	}

	/**
	 * Initializes transport to use and starts probe.
	 *
	 * @api private
	 */
	Socket.prototype.open = function () {
	  var transport;
	  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
	    transport = 'websocket';
	  } else if (0 === this.transports.length) {
	    // Emit error on next tick so it can be listened to
	    var self = this;
	    setTimeout(function() {
	      self.emit('error', 'No transports available');
	    }, 0);
	    return;
	  } else {
	    transport = this.transports[0];
	  }
	  this.readyState = 'opening';

	  // Retry with the next transport if the transport is disabled (jsonp: false)
	  try {
	    transport = this.createTransport(transport);
	  } catch (e) {
	    this.transports.shift();
	    this.open();
	    return;
	  }

	  transport.open();
	  this.setTransport(transport);
	};

	/**
	 * Sets the current transport. Disables the existing one (if any).
	 *
	 * @api private
	 */

	Socket.prototype.setTransport = function(transport){
	  debug('setting transport %s', transport.name);
	  var self = this;

	  if (this.transport) {
	    debug('clearing existing transport %s', this.transport.name);
	    this.transport.removeAllListeners();
	  }

	  // set up transport
	  this.transport = transport;

	  // set up transport listeners
	  transport
	  .on('drain', function(){
	    self.onDrain();
	  })
	  .on('packet', function(packet){
	    self.onPacket(packet);
	  })
	  .on('error', function(e){
	    self.onError(e);
	  })
	  .on('close', function(){
	    self.onClose('transport close');
	  });
	};

	/**
	 * Probes a transport.
	 *
	 * @param {String} transport name
	 * @api private
	 */

	Socket.prototype.probe = function (name) {
	  debug('probing transport "%s"', name);
	  var transport = this.createTransport(name, { probe: 1 })
	    , failed = false
	    , self = this;

	  Socket.priorWebsocketSuccess = false;

	  function onTransportOpen(){
	    if (self.onlyBinaryUpgrades) {
	      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
	      failed = failed || upgradeLosesBinary;
	    }
	    if (failed) return;

	    debug('probe transport "%s" opened', name);
	    transport.send([{ type: 'ping', data: 'probe' }]);
	    transport.once('packet', function (msg) {
	      if (failed) return;
	      if ('pong' == msg.type && 'probe' == msg.data) {
	        debug('probe transport "%s" pong', name);
	        self.upgrading = true;
	        self.emit('upgrading', transport);
	        if (!transport) return;
	        Socket.priorWebsocketSuccess = 'websocket' == transport.name;

	        debug('pausing current transport "%s"', self.transport.name);
	        self.transport.pause(function () {
	          if (failed) return;
	          if ('closed' == self.readyState) return;
	          debug('changing transport and sending upgrade packet');

	          cleanup();

	          self.setTransport(transport);
	          transport.send([{ type: 'upgrade' }]);
	          self.emit('upgrade', transport);
	          transport = null;
	          self.upgrading = false;
	          self.flush();
	        });
	      } else {
	        debug('probe transport "%s" failed', name);
	        var err = new Error('probe error');
	        err.transport = transport.name;
	        self.emit('upgradeError', err);
	      }
	    });
	  }

	  function freezeTransport() {
	    if (failed) return;

	    // Any callback called by transport should be ignored since now
	    failed = true;

	    cleanup();

	    transport.close();
	    transport = null;
	  }

	  //Handle any error that happens while probing
	  function onerror(err) {
	    var error = new Error('probe error: ' + err);
	    error.transport = transport.name;

	    freezeTransport();

	    debug('probe transport "%s" failed because of error: %s', name, err);

	    self.emit('upgradeError', error);
	  }

	  function onTransportClose(){
	    onerror("transport closed");
	  }

	  //When the socket is closed while we're probing
	  function onclose(){
	    onerror("socket closed");
	  }

	  //When the socket is upgraded while we're probing
	  function onupgrade(to){
	    if (transport && to.name != transport.name) {
	      debug('"%s" works - aborting "%s"', to.name, transport.name);
	      freezeTransport();
	    }
	  }

	  //Remove all listeners on the transport and on self
	  function cleanup(){
	    transport.removeListener('open', onTransportOpen);
	    transport.removeListener('error', onerror);
	    transport.removeListener('close', onTransportClose);
	    self.removeListener('close', onclose);
	    self.removeListener('upgrading', onupgrade);
	  }

	  transport.once('open', onTransportOpen);
	  transport.once('error', onerror);
	  transport.once('close', onTransportClose);

	  this.once('close', onclose);
	  this.once('upgrading', onupgrade);

	  transport.open();

	};

	/**
	 * Called when connection is deemed open.
	 *
	 * @api public
	 */

	Socket.prototype.onOpen = function () {
	  debug('socket open');
	  this.readyState = 'open';
	  Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
	  this.emit('open');
	  this.flush();

	  // we check for `readyState` in case an `open`
	  // listener already closed the socket
	  if ('open' == this.readyState && this.upgrade && this.transport.pause) {
	    debug('starting upgrade probes');
	    for (var i = 0, l = this.upgrades.length; i < l; i++) {
	      this.probe(this.upgrades[i]);
	    }
	  }
	};

	/**
	 * Handles a packet.
	 *
	 * @api private
	 */

	Socket.prototype.onPacket = function (packet) {
	  if ('opening' == this.readyState || 'open' == this.readyState) {
	    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

	    this.emit('packet', packet);

	    // Socket is live - any packet counts
	    this.emit('heartbeat');

	    switch (packet.type) {
	      case 'open':
	        this.onHandshake(parsejson(packet.data));
	        break;

	      case 'pong':
	        this.setPing();
	        this.emit('pong');
	        break;

	      case 'error':
	        var err = new Error('server error');
	        err.code = packet.data;
	        this.onError(err);
	        break;

	      case 'message':
	        this.emit('data', packet.data);
	        this.emit('message', packet.data);
	        break;
	    }
	  } else {
	    debug('packet received with socket readyState "%s"', this.readyState);
	  }
	};

	/**
	 * Called upon handshake completion.
	 *
	 * @param {Object} handshake obj
	 * @api private
	 */

	Socket.prototype.onHandshake = function (data) {
	  this.emit('handshake', data);
	  this.id = data.sid;
	  this.transport.query.sid = data.sid;
	  this.upgrades = this.filterUpgrades(data.upgrades);
	  this.pingInterval = data.pingInterval;
	  this.pingTimeout = data.pingTimeout;
	  this.onOpen();
	  // In case open handler closes socket
	  if  ('closed' == this.readyState) return;
	  this.setPing();

	  // Prolong liveness of socket on heartbeat
	  this.removeListener('heartbeat', this.onHeartbeat);
	  this.on('heartbeat', this.onHeartbeat);
	};

	/**
	 * Resets ping timeout.
	 *
	 * @api private
	 */

	Socket.prototype.onHeartbeat = function (timeout) {
	  clearTimeout(this.pingTimeoutTimer);
	  var self = this;
	  self.pingTimeoutTimer = setTimeout(function () {
	    if ('closed' == self.readyState) return;
	    self.onClose('ping timeout');
	  }, timeout || (self.pingInterval + self.pingTimeout));
	};

	/**
	 * Pings server every `this.pingInterval` and expects response
	 * within `this.pingTimeout` or closes connection.
	 *
	 * @api private
	 */

	Socket.prototype.setPing = function () {
	  var self = this;
	  clearTimeout(self.pingIntervalTimer);
	  self.pingIntervalTimer = setTimeout(function () {
	    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
	    self.ping();
	    self.onHeartbeat(self.pingTimeout);
	  }, self.pingInterval);
	};

	/**
	* Sends a ping packet.
	*
	* @api private
	*/

	Socket.prototype.ping = function () {
	  var self = this;
	  this.sendPacket('ping', function(){
	    self.emit('ping');
	  });
	};

	/**
	 * Called on `drain` event
	 *
	 * @api private
	 */

	Socket.prototype.onDrain = function() {
	  this.writeBuffer.splice(0, this.prevBufferLen);

	  // setting prevBufferLen = 0 is very important
	  // for example, when upgrading, upgrade packet is sent over,
	  // and a nonzero prevBufferLen could cause problems on `drain`
	  this.prevBufferLen = 0;

	  if (0 === this.writeBuffer.length) {
	    this.emit('drain');
	  } else {
	    this.flush();
	  }
	};

	/**
	 * Flush write buffers.
	 *
	 * @api private
	 */

	Socket.prototype.flush = function () {
	  if ('closed' != this.readyState && this.transport.writable &&
	    !this.upgrading && this.writeBuffer.length) {
	    debug('flushing %d packets in socket', this.writeBuffer.length);
	    this.transport.send(this.writeBuffer);
	    // keep track of current length of writeBuffer
	    // splice writeBuffer and callbackBuffer on `drain`
	    this.prevBufferLen = this.writeBuffer.length;
	    this.emit('flush');
	  }
	};

	/**
	 * Sends a message.
	 *
	 * @param {String} message.
	 * @param {Function} callback function.
	 * @param {Object} options.
	 * @return {Socket} for chaining.
	 * @api public
	 */

	Socket.prototype.write =
	Socket.prototype.send = function (msg, options, fn) {
	  this.sendPacket('message', msg, options, fn);
	  return this;
	};

	/**
	 * Sends a packet.
	 *
	 * @param {String} packet type.
	 * @param {String} data.
	 * @param {Object} options.
	 * @param {Function} callback function.
	 * @api private
	 */

	Socket.prototype.sendPacket = function (type, data, options, fn) {
	  if('function' == typeof data) {
	    fn = data;
	    data = undefined;
	  }

	  if ('function' == typeof options) {
	    fn = options;
	    options = null;
	  }

	  if ('closing' == this.readyState || 'closed' == this.readyState) {
	    return;
	  }

	  options = options || {};
	  options.compress = false !== options.compress;

	  var packet = {
	    type: type,
	    data: data,
	    options: options
	  };
	  this.emit('packetCreate', packet);
	  this.writeBuffer.push(packet);
	  if (fn) this.once('flush', fn);
	  this.flush();
	};

	/**
	 * Closes the connection.
	 *
	 * @api private
	 */

	Socket.prototype.close = function () {
	  if ('opening' == this.readyState || 'open' == this.readyState) {
	    this.readyState = 'closing';

	    var self = this;

	    if (this.writeBuffer.length) {
	      this.once('drain', function() {
	        if (this.upgrading) {
	          waitForUpgrade();
	        } else {
	          close();
	        }
	      });
	    } else if (this.upgrading) {
	      waitForUpgrade();
	    } else {
	      close();
	    }
	  }

	  function close() {
	    self.onClose('forced close');
	    debug('socket closing - telling transport to close');
	    self.transport.close();
	  }

	  function cleanupAndClose() {
	    self.removeListener('upgrade', cleanupAndClose);
	    self.removeListener('upgradeError', cleanupAndClose);
	    close();
	  }

	  function waitForUpgrade() {
	    // wait for upgrade to finish since we can't send packets while pausing a transport
	    self.once('upgrade', cleanupAndClose);
	    self.once('upgradeError', cleanupAndClose);
	  }

	  return this;
	};

	/**
	 * Called upon transport error
	 *
	 * @api private
	 */

	Socket.prototype.onError = function (err) {
	  debug('socket error %j', err);
	  Socket.priorWebsocketSuccess = false;
	  this.emit('error', err);
	  this.onClose('transport error', err);
	};

	/**
	 * Called upon transport close.
	 *
	 * @api private
	 */

	Socket.prototype.onClose = function (reason, desc) {
	  if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
	    debug('socket close with reason: "%s"', reason);
	    var self = this;

	    // clear timers
	    clearTimeout(this.pingIntervalTimer);
	    clearTimeout(this.pingTimeoutTimer);

	    // stop event from firing again for transport
	    this.transport.removeAllListeners('close');

	    // ensure transport won't stay open
	    this.transport.close();

	    // ignore further transport communication
	    this.transport.removeAllListeners();

	    // set ready state
	    this.readyState = 'closed';

	    // clear session id
	    this.id = null;

	    // emit close event
	    this.emit('close', reason, desc);

	    // clean buffers after, so users can still
	    // grab the buffers on `close` event
	    self.writeBuffer = [];
	    self.prevBufferLen = 0;
	  }
	};

	/**
	 * Filters upgrades, returning only those matching client transports.
	 *
	 * @param {Array} server upgrades
	 * @api private
	 *
	 */

	Socket.prototype.filterUpgrades = function (upgrades) {
	  var filteredUpgrades = [];
	  for (var i = 0, j = upgrades.length; i<j; i++) {
	    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
	  }
	  return filteredUpgrades;
	};

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"./transport":4,"./transports":5,"component-emitter":15,"debug":17,"engine.io-parser":19,"indexof":23,"parsejson":26,"parseqs":27,"parseuri":28}],4:[function(_dereq_,module,exports){
	/**
	 * Module dependencies.
	 */

	var parser = _dereq_('engine.io-parser');
	var Emitter = _dereq_('component-emitter');

	/**
	 * Module exports.
	 */

	module.exports = Transport;

	/**
	 * Transport abstract constructor.
	 *
	 * @param {Object} options.
	 * @api private
	 */

	function Transport (opts) {
	  this.path = opts.path;
	  this.hostname = opts.hostname;
	  this.port = opts.port;
	  this.secure = opts.secure;
	  this.query = opts.query;
	  this.timestampParam = opts.timestampParam;
	  this.timestampRequests = opts.timestampRequests;
	  this.readyState = '';
	  this.agent = opts.agent || false;
	  this.socket = opts.socket;
	  this.enablesXDR = opts.enablesXDR;

	  // SSL options for Node.js client
	  this.pfx = opts.pfx;
	  this.key = opts.key;
	  this.passphrase = opts.passphrase;
	  this.cert = opts.cert;
	  this.ca = opts.ca;
	  this.ciphers = opts.ciphers;
	  this.rejectUnauthorized = opts.rejectUnauthorized;

	  // other options for Node.js client
	  this.extraHeaders = opts.extraHeaders;
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Transport.prototype);

	/**
	 * Emits an error.
	 *
	 * @param {String} str
	 * @return {Transport} for chaining
	 * @api public
	 */

	Transport.prototype.onError = function (msg, desc) {
	  var err = new Error(msg);
	  err.type = 'TransportError';
	  err.description = desc;
	  this.emit('error', err);
	  return this;
	};

	/**
	 * Opens the transport.
	 *
	 * @api public
	 */

	Transport.prototype.open = function () {
	  if ('closed' == this.readyState || '' == this.readyState) {
	    this.readyState = 'opening';
	    this.doOpen();
	  }

	  return this;
	};

	/**
	 * Closes the transport.
	 *
	 * @api private
	 */

	Transport.prototype.close = function () {
	  if ('opening' == this.readyState || 'open' == this.readyState) {
	    this.doClose();
	    this.onClose();
	  }

	  return this;
	};

	/**
	 * Sends multiple packets.
	 *
	 * @param {Array} packets
	 * @api private
	 */

	Transport.prototype.send = function(packets){
	  if ('open' == this.readyState) {
	    this.write(packets);
	  } else {
	    throw new Error('Transport not open');
	  }
	};

	/**
	 * Called upon open
	 *
	 * @api private
	 */

	Transport.prototype.onOpen = function () {
	  this.readyState = 'open';
	  this.writable = true;
	  this.emit('open');
	};

	/**
	 * Called with data.
	 *
	 * @param {String} data
	 * @api private
	 */

	Transport.prototype.onData = function(data){
	  var packet = parser.decodePacket(data, this.socket.binaryType);
	  this.onPacket(packet);
	};

	/**
	 * Called with a decoded packet.
	 */

	Transport.prototype.onPacket = function (packet) {
	  this.emit('packet', packet);
	};

	/**
	 * Called upon close.
	 *
	 * @api private
	 */

	Transport.prototype.onClose = function () {
	  this.readyState = 'closed';
	  this.emit('close');
	};

	},{"component-emitter":15,"engine.io-parser":19}],5:[function(_dereq_,module,exports){
	(function (global){
	/**
	 * Module dependencies
	 */

	var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
	var XHR = _dereq_('./polling-xhr');
	var JSONP = _dereq_('./polling-jsonp');
	var websocket = _dereq_('./websocket');

	/**
	 * Export transports.
	 */

	exports.polling = polling;
	exports.websocket = websocket;

	/**
	 * Polling transport polymorphic constructor.
	 * Decides on xhr vs jsonp based on feature detection.
	 *
	 * @api private
	 */

	function polling(opts){
	  var xhr;
	  var xd = false;
	  var xs = false;
	  var jsonp = false !== opts.jsonp;

	  if (global.location) {
	    var isSSL = 'https:' == location.protocol;
	    var port = location.port;

	    // some user agents have empty `location.port`
	    if (!port) {
	      port = isSSL ? 443 : 80;
	    }

	    xd = opts.hostname != location.hostname || port != opts.port;
	    xs = opts.secure != isSSL;
	  }

	  opts.xdomain = xd;
	  opts.xscheme = xs;
	  xhr = new XMLHttpRequest(opts);

	  if ('open' in xhr && !opts.forceJSONP) {
	    return new XHR(opts);
	  } else {
	    if (!jsonp) throw new Error('JSONP disabled');
	    return new JSONP(opts);
	  }
	}

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"./polling-jsonp":6,"./polling-xhr":7,"./websocket":9,"xmlhttprequest-ssl":10}],6:[function(_dereq_,module,exports){
	(function (global){

	/**
	 * Module requirements.
	 */

	var Polling = _dereq_('./polling');
	var inherit = _dereq_('component-inherit');

	/**
	 * Module exports.
	 */

	module.exports = JSONPPolling;

	/**
	 * Cached regular expressions.
	 */

	var rNewline = /\n/g;
	var rEscapedNewline = /\\n/g;

	/**
	 * Global JSONP callbacks.
	 */

	var callbacks;

	/**
	 * Callbacks count.
	 */

	var index = 0;

	/**
	 * Noop.
	 */

	function empty () { }

	/**
	 * JSONP Polling constructor.
	 *
	 * @param {Object} opts.
	 * @api public
	 */

	function JSONPPolling (opts) {
	  Polling.call(this, opts);

	  this.query = this.query || {};

	  // define global callbacks array if not present
	  // we do this here (lazily) to avoid unneeded global pollution
	  if (!callbacks) {
	    // we need to consider multiple engines in the same page
	    if (!global.___eio) global.___eio = [];
	    callbacks = global.___eio;
	  }

	  // callback identifier
	  this.index = callbacks.length;

	  // add callback to jsonp global
	  var self = this;
	  callbacks.push(function (msg) {
	    self.onData(msg);
	  });

	  // append to query string
	  this.query.j = this.index;

	  // prevent spurious errors from being emitted when the window is unloaded
	  if (global.document && global.addEventListener) {
	    global.addEventListener('beforeunload', function () {
	      if (self.script) self.script.onerror = empty;
	    }, false);
	  }
	}

	/**
	 * Inherits from Polling.
	 */

	inherit(JSONPPolling, Polling);

	/*
	 * JSONP only supports binary as base64 encoded strings
	 */

	JSONPPolling.prototype.supportsBinary = false;

	/**
	 * Closes the socket.
	 *
	 * @api private
	 */

	JSONPPolling.prototype.doClose = function () {
	  if (this.script) {
	    this.script.parentNode.removeChild(this.script);
	    this.script = null;
	  }

	  if (this.form) {
	    this.form.parentNode.removeChild(this.form);
	    this.form = null;
	    this.iframe = null;
	  }

	  Polling.prototype.doClose.call(this);
	};

	/**
	 * Starts a poll cycle.
	 *
	 * @api private
	 */

	JSONPPolling.prototype.doPoll = function () {
	  var self = this;
	  var script = document.createElement('script');

	  if (this.script) {
	    this.script.parentNode.removeChild(this.script);
	    this.script = null;
	  }

	  script.async = true;
	  script.src = this.uri();
	  script.onerror = function(e){
	    self.onError('jsonp poll error',e);
	  };

	  var insertAt = document.getElementsByTagName('script')[0];
	  if (insertAt) {
	    insertAt.parentNode.insertBefore(script, insertAt);
	  }
	  else {
	    (document.head || document.body).appendChild(script);
	  }
	  this.script = script;

	  var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);
	  
	  if (isUAgecko) {
	    setTimeout(function () {
	      var iframe = document.createElement('iframe');
	      document.body.appendChild(iframe);
	      document.body.removeChild(iframe);
	    }, 100);
	  }
	};

	/**
	 * Writes with a hidden iframe.
	 *
	 * @param {String} data to send
	 * @param {Function} called upon flush.
	 * @api private
	 */

	JSONPPolling.prototype.doWrite = function (data, fn) {
	  var self = this;

	  if (!this.form) {
	    var form = document.createElement('form');
	    var area = document.createElement('textarea');
	    var id = this.iframeId = 'eio_iframe_' + this.index;
	    var iframe;

	    form.className = 'socketio';
	    form.style.position = 'absolute';
	    form.style.top = '-1000px';
	    form.style.left = '-1000px';
	    form.target = id;
	    form.method = 'POST';
	    form.setAttribute('accept-charset', 'utf-8');
	    area.name = 'd';
	    form.appendChild(area);
	    document.body.appendChild(form);

	    this.form = form;
	    this.area = area;
	  }

	  this.form.action = this.uri();

	  function complete () {
	    initIframe();
	    fn();
	  }

	  function initIframe () {
	    if (self.iframe) {
	      try {
	        self.form.removeChild(self.iframe);
	      } catch (e) {
	        self.onError('jsonp polling iframe removal error', e);
	      }
	    }

	    try {
	      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
	      var html = '<iframe src="javascript:0" name="'+ self.iframeId +'">';
	      iframe = document.createElement(html);
	    } catch (e) {
	      iframe = document.createElement('iframe');
	      iframe.name = self.iframeId;
	      iframe.src = 'javascript:0';
	    }

	    iframe.id = self.iframeId;

	    self.form.appendChild(iframe);
	    self.iframe = iframe;
	  }

	  initIframe();

	  // escape \n to prevent it from being converted into \r\n by some UAs
	  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
	  data = data.replace(rEscapedNewline, '\\\n');
	  this.area.value = data.replace(rNewline, '\\n');

	  try {
	    this.form.submit();
	  } catch(e) {}

	  if (this.iframe.attachEvent) {
	    this.iframe.onreadystatechange = function(){
	      if (self.iframe.readyState == 'complete') {
	        complete();
	      }
	    };
	  } else {
	    this.iframe.onload = complete;
	  }
	};

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"./polling":8,"component-inherit":16}],7:[function(_dereq_,module,exports){
	(function (global){
	/**
	 * Module requirements.
	 */

	var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
	var Polling = _dereq_('./polling');
	var Emitter = _dereq_('component-emitter');
	var inherit = _dereq_('component-inherit');
	var debug = _dereq_('debug')('engine.io-client:polling-xhr');

	/**
	 * Module exports.
	 */

	module.exports = XHR;
	module.exports.Request = Request;

	/**
	 * Empty function
	 */

	function empty(){}

	/**
	 * XHR Polling constructor.
	 *
	 * @param {Object} opts
	 * @api public
	 */

	function XHR(opts){
	  Polling.call(this, opts);

	  if (global.location) {
	    var isSSL = 'https:' == location.protocol;
	    var port = location.port;

	    // some user agents have empty `location.port`
	    if (!port) {
	      port = isSSL ? 443 : 80;
	    }

	    this.xd = opts.hostname != global.location.hostname ||
	      port != opts.port;
	    this.xs = opts.secure != isSSL;
	  } else {
	    this.extraHeaders = opts.extraHeaders;
	  }
	}

	/**
	 * Inherits from Polling.
	 */

	inherit(XHR, Polling);

	/**
	 * XHR supports binary
	 */

	XHR.prototype.supportsBinary = true;

	/**
	 * Creates a request.
	 *
	 * @param {String} method
	 * @api private
	 */

	XHR.prototype.request = function(opts){
	  opts = opts || {};
	  opts.uri = this.uri();
	  opts.xd = this.xd;
	  opts.xs = this.xs;
	  opts.agent = this.agent || false;
	  opts.supportsBinary = this.supportsBinary;
	  opts.enablesXDR = this.enablesXDR;

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;

	  // other options for Node.js client
	  opts.extraHeaders = this.extraHeaders;

	  return new Request(opts);
	};

	/**
	 * Sends data.
	 *
	 * @param {String} data to send.
	 * @param {Function} called upon flush.
	 * @api private
	 */

	XHR.prototype.doWrite = function(data, fn){
	  var isBinary = typeof data !== 'string' && data !== undefined;
	  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
	  var self = this;
	  req.on('success', fn);
	  req.on('error', function(err){
	    self.onError('xhr post error', err);
	  });
	  this.sendXhr = req;
	};

	/**
	 * Starts a poll cycle.
	 *
	 * @api private
	 */

	XHR.prototype.doPoll = function(){
	  debug('xhr poll');
	  var req = this.request();
	  var self = this;
	  req.on('data', function(data){
	    self.onData(data);
	  });
	  req.on('error', function(err){
	    self.onError('xhr poll error', err);
	  });
	  this.pollXhr = req;
	};

	/**
	 * Request constructor
	 *
	 * @param {Object} options
	 * @api public
	 */

	function Request(opts){
	  this.method = opts.method || 'GET';
	  this.uri = opts.uri;
	  this.xd = !!opts.xd;
	  this.xs = !!opts.xs;
	  this.async = false !== opts.async;
	  this.data = undefined != opts.data ? opts.data : null;
	  this.agent = opts.agent;
	  this.isBinary = opts.isBinary;
	  this.supportsBinary = opts.supportsBinary;
	  this.enablesXDR = opts.enablesXDR;

	  // SSL options for Node.js client
	  this.pfx = opts.pfx;
	  this.key = opts.key;
	  this.passphrase = opts.passphrase;
	  this.cert = opts.cert;
	  this.ca = opts.ca;
	  this.ciphers = opts.ciphers;
	  this.rejectUnauthorized = opts.rejectUnauthorized;

	  // other options for Node.js client
	  this.extraHeaders = opts.extraHeaders;

	  this.create();
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Request.prototype);

	/**
	 * Creates the XHR object and sends the request.
	 *
	 * @api private
	 */

	Request.prototype.create = function(){
	  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;

	  var xhr = this.xhr = new XMLHttpRequest(opts);
	  var self = this;

	  try {
	    debug('xhr open %s: %s', this.method, this.uri);
	    xhr.open(this.method, this.uri, this.async);
	    try {
	      if (this.extraHeaders) {
	        xhr.setDisableHeaderCheck(true);
	        for (var i in this.extraHeaders) {
	          if (this.extraHeaders.hasOwnProperty(i)) {
	            xhr.setRequestHeader(i, this.extraHeaders[i]);
	          }
	        }
	      }
	    } catch (e) {}
	    if (this.supportsBinary) {
	      // This has to be done after open because Firefox is stupid
	      // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
	      xhr.responseType = 'arraybuffer';
	    }

	    if ('POST' == this.method) {
	      try {
	        if (this.isBinary) {
	          xhr.setRequestHeader('Content-type', 'application/octet-stream');
	        } else {
	          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
	        }
	      } catch (e) {}
	    }

	    // ie6 check
	    if ('withCredentials' in xhr) {
	      xhr.withCredentials = true;
	    }

	    if (this.hasXDR()) {
	      xhr.onload = function(){
	        self.onLoad();
	      };
	      xhr.onerror = function(){
	        self.onError(xhr.responseText);
	      };
	    } else {
	      xhr.onreadystatechange = function(){
	        if (4 != xhr.readyState) return;
	        if (200 == xhr.status || 1223 == xhr.status) {
	          self.onLoad();
	        } else {
	          // make sure the `error` event handler that's user-set
	          // does not throw in the same tick and gets caught here
	          setTimeout(function(){
	            self.onError(xhr.status);
	          }, 0);
	        }
	      };
	    }

	    debug('xhr data %s', this.data);
	    xhr.send(this.data);
	  } catch (e) {
	    // Need to defer since .create() is called directly fhrom the constructor
	    // and thus the 'error' event can only be only bound *after* this exception
	    // occurs.  Therefore, also, we cannot throw here at all.
	    setTimeout(function() {
	      self.onError(e);
	    }, 0);
	    return;
	  }

	  if (global.document) {
	    this.index = Request.requestsCount++;
	    Request.requests[this.index] = this;
	  }
	};

	/**
	 * Called upon successful response.
	 *
	 * @api private
	 */

	Request.prototype.onSuccess = function(){
	  this.emit('success');
	  this.cleanup();
	};

	/**
	 * Called if we have data.
	 *
	 * @api private
	 */

	Request.prototype.onData = function(data){
	  this.emit('data', data);
	  this.onSuccess();
	};

	/**
	 * Called upon error.
	 *
	 * @api private
	 */

	Request.prototype.onError = function(err){
	  this.emit('error', err);
	  this.cleanup(true);
	};

	/**
	 * Cleans up house.
	 *
	 * @api private
	 */

	Request.prototype.cleanup = function(fromError){
	  if ('undefined' == typeof this.xhr || null === this.xhr) {
	    return;
	  }
	  // xmlhttprequest
	  if (this.hasXDR()) {
	    this.xhr.onload = this.xhr.onerror = empty;
	  } else {
	    this.xhr.onreadystatechange = empty;
	  }

	  if (fromError) {
	    try {
	      this.xhr.abort();
	    } catch(e) {}
	  }

	  if (global.document) {
	    delete Request.requests[this.index];
	  }

	  this.xhr = null;
	};

	/**
	 * Called upon load.
	 *
	 * @api private
	 */

	Request.prototype.onLoad = function(){
	  var data;
	  try {
	    var contentType;
	    try {
	      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
	    } catch (e) {}
	    if (contentType === 'application/octet-stream') {
	      data = this.xhr.response;
	    } else {
	      if (!this.supportsBinary) {
	        data = this.xhr.responseText;
	      } else {
	        try {
	          data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
	        } catch (e) {
	          var ui8Arr = new Uint8Array(this.xhr.response);
	          var dataArray = [];
	          for (var idx = 0, length = ui8Arr.length; idx < length; idx++) {
	            dataArray.push(ui8Arr[idx]);
	          }

	          data = String.fromCharCode.apply(null, dataArray);
	        }
	      }
	    }
	  } catch (e) {
	    this.onError(e);
	  }
	  if (null != data) {
	    this.onData(data);
	  }
	};

	/**
	 * Check if it has XDomainRequest.
	 *
	 * @api private
	 */

	Request.prototype.hasXDR = function(){
	  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
	};

	/**
	 * Aborts the request.
	 *
	 * @api public
	 */

	Request.prototype.abort = function(){
	  this.cleanup();
	};

	/**
	 * Aborts pending requests when unloading the window. This is needed to prevent
	 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
	 * emitted.
	 */

	if (global.document) {
	  Request.requestsCount = 0;
	  Request.requests = {};
	  if (global.attachEvent) {
	    global.attachEvent('onunload', unloadHandler);
	  } else if (global.addEventListener) {
	    global.addEventListener('beforeunload', unloadHandler, false);
	  }
	}

	function unloadHandler() {
	  for (var i in Request.requests) {
	    if (Request.requests.hasOwnProperty(i)) {
	      Request.requests[i].abort();
	    }
	  }
	}

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"./polling":8,"component-emitter":15,"component-inherit":16,"debug":17,"xmlhttprequest-ssl":10}],8:[function(_dereq_,module,exports){
	/**
	 * Module dependencies.
	 */

	var Transport = _dereq_('../transport');
	var parseqs = _dereq_('parseqs');
	var parser = _dereq_('engine.io-parser');
	var inherit = _dereq_('component-inherit');
	var yeast = _dereq_('yeast');
	var debug = _dereq_('debug')('engine.io-client:polling');

	/**
	 * Module exports.
	 */

	module.exports = Polling;

	/**
	 * Is XHR2 supported?
	 */

	var hasXHR2 = (function() {
	  var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
	  var xhr = new XMLHttpRequest({ xdomain: false });
	  return null != xhr.responseType;
	})();

	/**
	 * Polling interface.
	 *
	 * @param {Object} opts
	 * @api private
	 */

	function Polling(opts){
	  var forceBase64 = (opts && opts.forceBase64);
	  if (!hasXHR2 || forceBase64) {
	    this.supportsBinary = false;
	  }
	  Transport.call(this, opts);
	}

	/**
	 * Inherits from Transport.
	 */

	inherit(Polling, Transport);

	/**
	 * Transport name.
	 */

	Polling.prototype.name = 'polling';

	/**
	 * Opens the socket (triggers polling). We write a PING message to determine
	 * when the transport is open.
	 *
	 * @api private
	 */

	Polling.prototype.doOpen = function(){
	  this.poll();
	};

	/**
	 * Pauses polling.
	 *
	 * @param {Function} callback upon buffers are flushed and transport is paused
	 * @api private
	 */

	Polling.prototype.pause = function(onPause){
	  var pending = 0;
	  var self = this;

	  this.readyState = 'pausing';

	  function pause(){
	    debug('paused');
	    self.readyState = 'paused';
	    onPause();
	  }

	  if (this.polling || !this.writable) {
	    var total = 0;

	    if (this.polling) {
	      debug('we are currently polling - waiting to pause');
	      total++;
	      this.once('pollComplete', function(){
	        debug('pre-pause polling complete');
	        --total || pause();
	      });
	    }

	    if (!this.writable) {
	      debug('we are currently writing - waiting to pause');
	      total++;
	      this.once('drain', function(){
	        debug('pre-pause writing complete');
	        --total || pause();
	      });
	    }
	  } else {
	    pause();
	  }
	};

	/**
	 * Starts polling cycle.
	 *
	 * @api public
	 */

	Polling.prototype.poll = function(){
	  debug('polling');
	  this.polling = true;
	  this.doPoll();
	  this.emit('poll');
	};

	/**
	 * Overloads onData to detect payloads.
	 *
	 * @api private
	 */

	Polling.prototype.onData = function(data){
	  var self = this;
	  debug('polling got data %s', data);
	  var callback = function(packet, index, total) {
	    // if its the first message we consider the transport open
	    if ('opening' == self.readyState) {
	      self.onOpen();
	    }

	    // if its a close packet, we close the ongoing requests
	    if ('close' == packet.type) {
	      self.onClose();
	      return false;
	    }

	    // otherwise bypass onData and handle the message
	    self.onPacket(packet);
	  };

	  // decode payload
	  parser.decodePayload(data, this.socket.binaryType, callback);

	  // if an event did not trigger closing
	  if ('closed' != this.readyState) {
	    // if we got data we're not polling
	    this.polling = false;
	    this.emit('pollComplete');

	    if ('open' == this.readyState) {
	      this.poll();
	    } else {
	      debug('ignoring poll - transport state "%s"', this.readyState);
	    }
	  }
	};

	/**
	 * For polling, send a close packet.
	 *
	 * @api private
	 */

	Polling.prototype.doClose = function(){
	  var self = this;

	  function close(){
	    debug('writing close packet');
	    self.write([{ type: 'close' }]);
	  }

	  if ('open' == this.readyState) {
	    debug('transport open - closing');
	    close();
	  } else {
	    // in case we're trying to close while
	    // handshaking is in progress (GH-164)
	    debug('transport not open - deferring close');
	    this.once('open', close);
	  }
	};

	/**
	 * Writes a packets payload.
	 *
	 * @param {Array} data packets
	 * @param {Function} drain callback
	 * @api private
	 */

	Polling.prototype.write = function(packets){
	  var self = this;
	  this.writable = false;
	  var callbackfn = function() {
	    self.writable = true;
	    self.emit('drain');
	  };

	  var self = this;
	  parser.encodePayload(packets, this.supportsBinary, function(data) {
	    self.doWrite(data, callbackfn);
	  });
	};

	/**
	 * Generates uri for connection.
	 *
	 * @api private
	 */

	Polling.prototype.uri = function(){
	  var query = this.query || {};
	  var schema = this.secure ? 'https' : 'http';
	  var port = '';

	  // cache busting is forced
	  if (false !== this.timestampRequests) {
	    query[this.timestampParam] = yeast();
	  }

	  if (!this.supportsBinary && !query.sid) {
	    query.b64 = 1;
	  }

	  query = parseqs.encode(query);

	  // avoid port if default for schema
	  if (this.port && (('https' == schema && this.port != 443) ||
	     ('http' == schema && this.port != 80))) {
	    port = ':' + this.port;
	  }

	  // prepend ? to query
	  if (query.length) {
	    query = '?' + query;
	  }

	  var ipv6 = this.hostname.indexOf(':') !== -1;
	  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
	};

	},{"../transport":4,"component-inherit":16,"debug":17,"engine.io-parser":19,"parseqs":27,"xmlhttprequest-ssl":10,"yeast":30}],9:[function(_dereq_,module,exports){
	(function (global){
	/**
	 * Module dependencies.
	 */

	var Transport = _dereq_('../transport');
	var parser = _dereq_('engine.io-parser');
	var parseqs = _dereq_('parseqs');
	var inherit = _dereq_('component-inherit');
	var yeast = _dereq_('yeast');
	var debug = _dereq_('debug')('engine.io-client:websocket');
	var BrowserWebSocket = global.WebSocket || global.MozWebSocket;

	/**
	 * Get either the `WebSocket` or `MozWebSocket` globals
	 * in the browser or try to resolve WebSocket-compatible
	 * interface exposed by `ws` for Node-like environment.
	 */

	var WebSocket = BrowserWebSocket;
	if (!WebSocket && typeof window === 'undefined') {
	  try {
	    WebSocket = _dereq_('ws');
	  } catch (e) { }
	}

	/**
	 * Module exports.
	 */

	module.exports = WS;

	/**
	 * WebSocket transport constructor.
	 *
	 * @api {Object} connection options
	 * @api public
	 */

	function WS(opts){
	  var forceBase64 = (opts && opts.forceBase64);
	  if (forceBase64) {
	    this.supportsBinary = false;
	  }
	  this.perMessageDeflate = opts.perMessageDeflate;
	  Transport.call(this, opts);
	}

	/**
	 * Inherits from Transport.
	 */

	inherit(WS, Transport);

	/**
	 * Transport name.
	 *
	 * @api public
	 */

	WS.prototype.name = 'websocket';

	/*
	 * WebSockets support binary
	 */

	WS.prototype.supportsBinary = true;

	/**
	 * Opens socket.
	 *
	 * @api private
	 */

	WS.prototype.doOpen = function(){
	  if (!this.check()) {
	    // let probe timeout
	    return;
	  }

	  var self = this;
	  var uri = this.uri();
	  var protocols = void(0);
	  var opts = {
	    agent: this.agent,
	    perMessageDeflate: this.perMessageDeflate
	  };

	  // SSL options for Node.js client
	  opts.pfx = this.pfx;
	  opts.key = this.key;
	  opts.passphrase = this.passphrase;
	  opts.cert = this.cert;
	  opts.ca = this.ca;
	  opts.ciphers = this.ciphers;
	  opts.rejectUnauthorized = this.rejectUnauthorized;
	  if (this.extraHeaders) {
	    opts.headers = this.extraHeaders;
	  }

	  this.ws = BrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);

	  if (this.ws.binaryType === undefined) {
	    this.supportsBinary = false;
	  }

	  if (this.ws.supports && this.ws.supports.binary) {
	    this.supportsBinary = true;
	    this.ws.binaryType = 'buffer';
	  } else {
	    this.ws.binaryType = 'arraybuffer';
	  }

	  this.addEventListeners();
	};

	/**
	 * Adds event listeners to the socket
	 *
	 * @api private
	 */

	WS.prototype.addEventListeners = function(){
	  var self = this;

	  this.ws.onopen = function(){
	    self.onOpen();
	  };
	  this.ws.onclose = function(){
	    self.onClose();
	  };
	  this.ws.onmessage = function(ev){
	    self.onData(ev.data);
	  };
	  this.ws.onerror = function(e){
	    self.onError('websocket error', e);
	  };
	};

	/**
	 * Override `onData` to use a timer on iOS.
	 * See: https://gist.github.com/mloughran/2052006
	 *
	 * @api private
	 */

	if ('undefined' != typeof navigator
	  && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
	  WS.prototype.onData = function(data){
	    var self = this;
	    setTimeout(function(){
	      Transport.prototype.onData.call(self, data);
	    }, 0);
	  };
	}

	/**
	 * Writes data to socket.
	 *
	 * @param {Array} array of packets.
	 * @api private
	 */

	WS.prototype.write = function(packets){
	  var self = this;
	  this.writable = false;

	  // encodePacket efficient as it uses WS framing
	  // no need for encodePayload
	  var total = packets.length;
	  for (var i = 0, l = total; i < l; i++) {
	    (function(packet) {
	      parser.encodePacket(packet, self.supportsBinary, function(data) {
	        if (!BrowserWebSocket) {
	          // always create a new object (GH-437)
	          var opts = {};
	          if (packet.options) {
	            opts.compress = packet.options.compress;
	          }

	          if (self.perMessageDeflate) {
	            var len = 'string' == typeof data ? global.Buffer.byteLength(data) : data.length;
	            if (len < self.perMessageDeflate.threshold) {
	              opts.compress = false;
	            }
	          }
	        }

	        //Sometimes the websocket has already been closed but the browser didn't
	        //have a chance of informing us about it yet, in that case send will
	        //throw an error
	        try {
	          if (BrowserWebSocket) {
	            // TypeError is thrown when passing the second argument on Safari
	            self.ws.send(data);
	          } else {
	            self.ws.send(data, opts);
	          }
	        } catch (e){
	          debug('websocket closed before onclose event');
	        }

	        --total || done();
	      });
	    })(packets[i]);
	  }

	  function done(){
	    self.emit('flush');

	    // fake drain
	    // defer to next tick to allow Socket to clear writeBuffer
	    setTimeout(function(){
	      self.writable = true;
	      self.emit('drain');
	    }, 0);
	  }
	};

	/**
	 * Called upon close
	 *
	 * @api private
	 */

	WS.prototype.onClose = function(){
	  Transport.prototype.onClose.call(this);
	};

	/**
	 * Closes socket.
	 *
	 * @api private
	 */

	WS.prototype.doClose = function(){
	  if (typeof this.ws !== 'undefined') {
	    this.ws.close();
	  }
	};

	/**
	 * Generates uri for connection.
	 *
	 * @api private
	 */

	WS.prototype.uri = function(){
	  var query = this.query || {};
	  var schema = this.secure ? 'wss' : 'ws';
	  var port = '';

	  // avoid port if default for schema
	  if (this.port && (('wss' == schema && this.port != 443)
	    || ('ws' == schema && this.port != 80))) {
	    port = ':' + this.port;
	  }

	  // append timestamp to URI
	  if (this.timestampRequests) {
	    query[this.timestampParam] = yeast();
	  }

	  // communicate binary support capabilities
	  if (!this.supportsBinary) {
	    query.b64 = 1;
	  }

	  query = parseqs.encode(query);

	  // prepend ? to query
	  if (query.length) {
	    query = '?' + query;
	  }

	  var ipv6 = this.hostname.indexOf(':') !== -1;
	  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
	};

	/**
	 * Feature detection for WebSocket.
	 *
	 * @return {Boolean} whether this transport is available.
	 * @api public
	 */

	WS.prototype.check = function(){
	  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
	};

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"../transport":4,"component-inherit":16,"debug":17,"engine.io-parser":19,"parseqs":27,"ws":undefined,"yeast":30}],10:[function(_dereq_,module,exports){
	// browser shim for xmlhttprequest module
	var hasCORS = _dereq_('has-cors');

	module.exports = function(opts) {
	  var xdomain = opts.xdomain;

	  // scheme must be same when usign XDomainRequest
	  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
	  var xscheme = opts.xscheme;

	  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
	  // https://github.com/Automattic/engine.io-client/pull/217
	  var enablesXDR = opts.enablesXDR;

	  // XMLHttpRequest can be disabled on IE
	  try {
	    if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
	      return new XMLHttpRequest();
	    }
	  } catch (e) { }

	  // Use XDomainRequest for IE8 if enablesXDR is true
	  // because loading bar keeps flashing when using jsonp-polling
	  // https://github.com/yujiosaka/socke.io-ie8-loading-example
	  try {
	    if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
	      return new XDomainRequest();
	    }
	  } catch (e) { }

	  if (!xdomain) {
	    try {
	      return new ActiveXObject('Microsoft.XMLHTTP');
	    } catch(e) { }
	  }
	}

	},{"has-cors":22}],11:[function(_dereq_,module,exports){
	module.exports = after

	function after(count, callback, err_cb) {
	    var bail = false
	    err_cb = err_cb || noop
	    proxy.count = count

	    return (count === 0) ? callback() : proxy

	    function proxy(err, result) {
	        if (proxy.count <= 0) {
	            throw new Error('after called too many times')
	        }
	        --proxy.count

	        // after first error, rest are passed to err_cb
	        if (err) {
	            bail = true
	            callback(err)
	            // future error callbacks will go to error handler
	            callback = err_cb
	        } else if (proxy.count === 0 && !bail) {
	            callback(null, result)
	        }
	    }
	}

	function noop() {}

	},{}],12:[function(_dereq_,module,exports){
	/**
	 * An abstraction for slicing an arraybuffer even when
	 * ArrayBuffer.prototype.slice is not supported
	 *
	 * @api public
	 */

	module.exports = function(arraybuffer, start, end) {
	  var bytes = arraybuffer.byteLength;
	  start = start || 0;
	  end = end || bytes;

	  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

	  if (start < 0) { start += bytes; }
	  if (end < 0) { end += bytes; }
	  if (end > bytes) { end = bytes; }

	  if (start >= bytes || start >= end || bytes === 0) {
	    return new ArrayBuffer(0);
	  }

	  var abv = new Uint8Array(arraybuffer);
	  var result = new Uint8Array(end - start);
	  for (var i = start, ii = 0; i < end; i++, ii++) {
	    result[ii] = abv[i];
	  }
	  return result.buffer;
	};

	},{}],13:[function(_dereq_,module,exports){
	/*
	 * base64-arraybuffer
	 * https://github.com/niklasvh/base64-arraybuffer
	 *
	 * Copyright (c) 2012 Niklas von Hertzen
	 * Licensed under the MIT license.
	 */
	(function(chars){
	  "use strict";

	  exports.encode = function(arraybuffer) {
	    var bytes = new Uint8Array(arraybuffer),
	    i, len = bytes.length, base64 = "";

	    for (i = 0; i < len; i+=3) {
	      base64 += chars[bytes[i] >> 2];
	      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
	      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
	      base64 += chars[bytes[i + 2] & 63];
	    }

	    if ((len % 3) === 2) {
	      base64 = base64.substring(0, base64.length - 1) + "=";
	    } else if (len % 3 === 1) {
	      base64 = base64.substring(0, base64.length - 2) + "==";
	    }

	    return base64;
	  };

	  exports.decode =  function(base64) {
	    var bufferLength = base64.length * 0.75,
	    len = base64.length, i, p = 0,
	    encoded1, encoded2, encoded3, encoded4;

	    if (base64[base64.length - 1] === "=") {
	      bufferLength--;
	      if (base64[base64.length - 2] === "=") {
	        bufferLength--;
	      }
	    }

	    var arraybuffer = new ArrayBuffer(bufferLength),
	    bytes = new Uint8Array(arraybuffer);

	    for (i = 0; i < len; i+=4) {
	      encoded1 = chars.indexOf(base64[i]);
	      encoded2 = chars.indexOf(base64[i+1]);
	      encoded3 = chars.indexOf(base64[i+2]);
	      encoded4 = chars.indexOf(base64[i+3]);

	      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
	      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
	      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	    }

	    return arraybuffer;
	  };
	})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

	},{}],14:[function(_dereq_,module,exports){
	(function (global){
	/**
	 * Create a blob builder even when vendor prefixes exist
	 */

	var BlobBuilder = global.BlobBuilder
	  || global.WebKitBlobBuilder
	  || global.MSBlobBuilder
	  || global.MozBlobBuilder;

	/**
	 * Check if Blob constructor is supported
	 */

	var blobSupported = (function() {
	  try {
	    var a = new Blob(['hi']);
	    return a.size === 2;
	  } catch(e) {
	    return false;
	  }
	})();

	/**
	 * Check if Blob constructor supports ArrayBufferViews
	 * Fails in Safari 6, so we need to map to ArrayBuffers there.
	 */

	var blobSupportsArrayBufferView = blobSupported && (function() {
	  try {
	    var b = new Blob([new Uint8Array([1,2])]);
	    return b.size === 2;
	  } catch(e) {
	    return false;
	  }
	})();

	/**
	 * Check if BlobBuilder is supported
	 */

	var blobBuilderSupported = BlobBuilder
	  && BlobBuilder.prototype.append
	  && BlobBuilder.prototype.getBlob;

	/**
	 * Helper function that maps ArrayBufferViews to ArrayBuffers
	 * Used by BlobBuilder constructor and old browsers that didn't
	 * support it in the Blob constructor.
	 */

	function mapArrayBufferViews(ary) {
	  for (var i = 0; i < ary.length; i++) {
	    var chunk = ary[i];
	    if (chunk.buffer instanceof ArrayBuffer) {
	      var buf = chunk.buffer;

	      // if this is a subarray, make a copy so we only
	      // include the subarray region from the underlying buffer
	      if (chunk.byteLength !== buf.byteLength) {
	        var copy = new Uint8Array(chunk.byteLength);
	        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
	        buf = copy.buffer;
	      }

	      ary[i] = buf;
	    }
	  }
	}

	function BlobBuilderConstructor(ary, options) {
	  options = options || {};

	  var bb = new BlobBuilder();
	  mapArrayBufferViews(ary);

	  for (var i = 0; i < ary.length; i++) {
	    bb.append(ary[i]);
	  }

	  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
	};

	function BlobConstructor(ary, options) {
	  mapArrayBufferViews(ary);
	  return new Blob(ary, options || {});
	};

	module.exports = (function() {
	  if (blobSupported) {
	    return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
	  } else if (blobBuilderSupported) {
	    return BlobBuilderConstructor;
	  } else {
	    return undefined;
	  }
	})();

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{}],15:[function(_dereq_,module,exports){

	/**
	 * Expose `Emitter`.
	 */

	module.exports = Emitter;

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};

	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks[event] = this._callbacks[event] || [])
	    .push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  var self = this;
	  this._callbacks = this._callbacks || {};

	  function on() {
	    self.off(event, on);
	    fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }

	  // specific event
	  var callbacks = this._callbacks[event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks[event];
	    return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks[event];

	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks[event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};

	},{}],16:[function(_dereq_,module,exports){

	module.exports = function(a, b){
	  var fn = function(){};
	  fn.prototype = b.prototype;
	  a.prototype = new fn;
	  a.prototype.constructor = a;
	};
	},{}],17:[function(_dereq_,module,exports){

	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = _dereq_('./debug');
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = 'undefined' != typeof chrome
	               && 'undefined' != typeof chrome.storage
	                  ? chrome.storage.local
	                  : localstorage();

	/**
	 * Colors.
	 */

	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	function useColors() {
	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  return ('WebkitAppearance' in document.documentElement.style) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (window.console && (console.firebug || (console.exception && console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
	}

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	exports.formatters.j = function(v) {
	  return JSON.stringify(v);
	};


	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs() {
	  var args = arguments;
	  var useColors = this.useColors;

	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);

	  if (!useColors) return args;

	  var c = 'color: ' + this.color;
	  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });

	  args.splice(lastC, 0, c);
	  return args;
	}

	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */

	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      exports.storage.removeItem('debug');
	    } else {
	      exports.storage.debug = namespaces;
	    }
	  } catch(e) {}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  var r;
	  try {
	    r = exports.storage.debug;
	  } catch(e) {}
	  return r;
	}

	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */

	exports.enable(load());

	/**
	 * Localstorage attempts to return the localstorage.
	 *
	 * This is necessary because safari throws
	 * when a user disables cookies/localstorage
	 * and you attempt to access it.
	 *
	 * @return {LocalStorage}
	 * @api private
	 */

	function localstorage(){
	  try {
	    return window.localStorage;
	  } catch (e) {}
	}

	},{"./debug":18}],18:[function(_dereq_,module,exports){

	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = _dereq_('ms');

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lowercased letter, i.e. "n".
	 */

	exports.formatters = {};

	/**
	 * Previously assigned color.
	 */

	var prevColor = 0;

	/**
	 * Previous log timestamp.
	 */

	var prevTime;

	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */

	function selectColor() {
	  return exports.colors[prevColor++ % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function debug(namespace) {

	  // define the `disabled` version
	  function disabled() {
	  }
	  disabled.enabled = false;

	  // define the `enabled` version
	  function enabled() {

	    var self = enabled;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // add the `color` if not set
	    if (null == self.useColors) self.useColors = exports.useColors();
	    if (null == self.color && self.useColors) self.color = selectColor();

	    var args = Array.prototype.slice.call(arguments);

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %o
	      args = ['%o'].concat(args);
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    if ('function' === typeof exports.formatArgs) {
	      args = exports.formatArgs.apply(self, args);
	    }
	    var logFn = enabled.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }
	  enabled.enabled = true;

	  var fn = exports.enabled(namespace) ? enabled : disabled;

	  fn.namespace = namespace;

	  return fn;
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  var split = (namespaces || '').split(/[\s,]+/);
	  var len = split.length;

	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}

	},{"ms":25}],19:[function(_dereq_,module,exports){
	(function (global){
	/**
	 * Module dependencies.
	 */

	var keys = _dereq_('./keys');
	var hasBinary = _dereq_('has-binary');
	var sliceBuffer = _dereq_('arraybuffer.slice');
	var base64encoder = _dereq_('base64-arraybuffer');
	var after = _dereq_('after');
	var utf8 = _dereq_('utf8');

	/**
	 * Check if we are running an android browser. That requires us to use
	 * ArrayBuffer with polling transports...
	 *
	 * http://ghinda.net/jpeg-blob-ajax-android/
	 */

	var isAndroid = navigator.userAgent.match(/Android/i);

	/**
	 * Check if we are running in PhantomJS.
	 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
	 * https://github.com/ariya/phantomjs/issues/11395
	 * @type boolean
	 */
	var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);

	/**
	 * When true, avoids using Blobs to encode payloads.
	 * @type boolean
	 */
	var dontSendBlobs = isAndroid || isPhantomJS;

	/**
	 * Current protocol version.
	 */

	exports.protocol = 3;

	/**
	 * Packet types.
	 */

	var packets = exports.packets = {
	    open:     0    // non-ws
	  , close:    1    // non-ws
	  , ping:     2
	  , pong:     3
	  , message:  4
	  , upgrade:  5
	  , noop:     6
	};

	var packetslist = keys(packets);

	/**
	 * Premade error packet.
	 */

	var err = { type: 'error', data: 'parser error' };

	/**
	 * Create a blob api even for blob builder when vendor prefixes exist
	 */

	var Blob = _dereq_('blob');

	/**
	 * Encodes a packet.
	 *
	 *     <packet type id> [ <data> ]
	 *
	 * Example:
	 *
	 *     5hello world
	 *     3
	 *     4
	 *
	 * Binary is encoded in an identical principle
	 *
	 * @api private
	 */

	exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
	  if ('function' == typeof supportsBinary) {
	    callback = supportsBinary;
	    supportsBinary = false;
	  }

	  if ('function' == typeof utf8encode) {
	    callback = utf8encode;
	    utf8encode = null;
	  }

	  var data = (packet.data === undefined)
	    ? undefined
	    : packet.data.buffer || packet.data;

	  if (global.ArrayBuffer && data instanceof ArrayBuffer) {
	    return encodeArrayBuffer(packet, supportsBinary, callback);
	  } else if (Blob && data instanceof global.Blob) {
	    return encodeBlob(packet, supportsBinary, callback);
	  }

	  // might be an object with { base64: true, data: dataAsBase64String }
	  if (data && data.base64) {
	    return encodeBase64Object(packet, callback);
	  }

	  // Sending data as a utf-8 string
	  var encoded = packets[packet.type];

	  // data fragment is optional
	  if (undefined !== packet.data) {
	    encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
	  }

	  return callback('' + encoded);

	};

	function encodeBase64Object(packet, callback) {
	  // packet data is an object { base64: true, data: dataAsBase64String }
	  var message = 'b' + exports.packets[packet.type] + packet.data.data;
	  return callback(message);
	}

	/**
	 * Encode packet helpers for binary types
	 */

	function encodeArrayBuffer(packet, supportsBinary, callback) {
	  if (!supportsBinary) {
	    return exports.encodeBase64Packet(packet, callback);
	  }

	  var data = packet.data;
	  var contentArray = new Uint8Array(data);
	  var resultBuffer = new Uint8Array(1 + data.byteLength);

	  resultBuffer[0] = packets[packet.type];
	  for (var i = 0; i < contentArray.length; i++) {
	    resultBuffer[i+1] = contentArray[i];
	  }

	  return callback(resultBuffer.buffer);
	}

	function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
	  if (!supportsBinary) {
	    return exports.encodeBase64Packet(packet, callback);
	  }

	  var fr = new FileReader();
	  fr.onload = function() {
	    packet.data = fr.result;
	    exports.encodePacket(packet, supportsBinary, true, callback);
	  };
	  return fr.readAsArrayBuffer(packet.data);
	}

	function encodeBlob(packet, supportsBinary, callback) {
	  if (!supportsBinary) {
	    return exports.encodeBase64Packet(packet, callback);
	  }

	  if (dontSendBlobs) {
	    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
	  }

	  var length = new Uint8Array(1);
	  length[0] = packets[packet.type];
	  var blob = new Blob([length.buffer, packet.data]);

	  return callback(blob);
	}

	/**
	 * Encodes a packet with binary data in a base64 string
	 *
	 * @param {Object} packet, has `type` and `data`
	 * @return {String} base64 encoded message
	 */

	exports.encodeBase64Packet = function(packet, callback) {
	  var message = 'b' + exports.packets[packet.type];
	  if (Blob && packet.data instanceof global.Blob) {
	    var fr = new FileReader();
	    fr.onload = function() {
	      var b64 = fr.result.split(',')[1];
	      callback(message + b64);
	    };
	    return fr.readAsDataURL(packet.data);
	  }

	  var b64data;
	  try {
	    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
	  } catch (e) {
	    // iPhone Safari doesn't let you apply with typed arrays
	    var typed = new Uint8Array(packet.data);
	    var basic = new Array(typed.length);
	    for (var i = 0; i < typed.length; i++) {
	      basic[i] = typed[i];
	    }
	    b64data = String.fromCharCode.apply(null, basic);
	  }
	  message += global.btoa(b64data);
	  return callback(message);
	};

	/**
	 * Decodes a packet. Changes format to Blob if requested.
	 *
	 * @return {Object} with `type` and `data` (if any)
	 * @api private
	 */

	exports.decodePacket = function (data, binaryType, utf8decode) {
	  // String data
	  if (typeof data == 'string' || data === undefined) {
	    if (data.charAt(0) == 'b') {
	      return exports.decodeBase64Packet(data.substr(1), binaryType);
	    }

	    if (utf8decode) {
	      try {
	        data = utf8.decode(data);
	      } catch (e) {
	        return err;
	      }
	    }
	    var type = data.charAt(0);

	    if (Number(type) != type || !packetslist[type]) {
	      return err;
	    }

	    if (data.length > 1) {
	      return { type: packetslist[type], data: data.substring(1) };
	    } else {
	      return { type: packetslist[type] };
	    }
	  }

	  var asArray = new Uint8Array(data);
	  var type = asArray[0];
	  var rest = sliceBuffer(data, 1);
	  if (Blob && binaryType === 'blob') {
	    rest = new Blob([rest]);
	  }
	  return { type: packetslist[type], data: rest };
	};

	/**
	 * Decodes a packet encoded in a base64 string
	 *
	 * @param {String} base64 encoded message
	 * @return {Object} with `type` and `data` (if any)
	 */

	exports.decodeBase64Packet = function(msg, binaryType) {
	  var type = packetslist[msg.charAt(0)];
	  if (!global.ArrayBuffer) {
	    return { type: type, data: { base64: true, data: msg.substr(1) } };
	  }

	  var data = base64encoder.decode(msg.substr(1));

	  if (binaryType === 'blob' && Blob) {
	    data = new Blob([data]);
	  }

	  return { type: type, data: data };
	};

	/**
	 * Encodes multiple messages (payload).
	 *
	 *     <length>:data
	 *
	 * Example:
	 *
	 *     11:hello world2:hi
	 *
	 * If any contents are binary, they will be encoded as base64 strings. Base64
	 * encoded strings are marked with a b before the length specifier
	 *
	 * @param {Array} packets
	 * @api private
	 */

	exports.encodePayload = function (packets, supportsBinary, callback) {
	  if (typeof supportsBinary == 'function') {
	    callback = supportsBinary;
	    supportsBinary = null;
	  }

	  var isBinary = hasBinary(packets);

	  if (supportsBinary && isBinary) {
	    if (Blob && !dontSendBlobs) {
	      return exports.encodePayloadAsBlob(packets, callback);
	    }

	    return exports.encodePayloadAsArrayBuffer(packets, callback);
	  }

	  if (!packets.length) {
	    return callback('0:');
	  }

	  function setLengthHeader(message) {
	    return message.length + ':' + message;
	  }

	  function encodeOne(packet, doneCallback) {
	    exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
	      doneCallback(null, setLengthHeader(message));
	    });
	  }

	  map(packets, encodeOne, function(err, results) {
	    return callback(results.join(''));
	  });
	};

	/**
	 * Async array map using after
	 */

	function map(ary, each, done) {
	  var result = new Array(ary.length);
	  var next = after(ary.length, done);

	  var eachWithIndex = function(i, el, cb) {
	    each(el, function(error, msg) {
	      result[i] = msg;
	      cb(error, result);
	    });
	  };

	  for (var i = 0; i < ary.length; i++) {
	    eachWithIndex(i, ary[i], next);
	  }
	}

	/*
	 * Decodes data when a payload is maybe expected. Possible binary contents are
	 * decoded from their base64 representation
	 *
	 * @param {String} data, callback method
	 * @api public
	 */

	exports.decodePayload = function (data, binaryType, callback) {
	  if (typeof data != 'string') {
	    return exports.decodePayloadAsBinary(data, binaryType, callback);
	  }

	  if (typeof binaryType === 'function') {
	    callback = binaryType;
	    binaryType = null;
	  }

	  var packet;
	  if (data == '') {
	    // parser error - ignoring payload
	    return callback(err, 0, 1);
	  }

	  var length = ''
	    , n, msg;

	  for (var i = 0, l = data.length; i < l; i++) {
	    var chr = data.charAt(i);

	    if (':' != chr) {
	      length += chr;
	    } else {
	      if ('' == length || (length != (n = Number(length)))) {
	        // parser error - ignoring payload
	        return callback(err, 0, 1);
	      }

	      msg = data.substr(i + 1, n);

	      if (length != msg.length) {
	        // parser error - ignoring payload
	        return callback(err, 0, 1);
	      }

	      if (msg.length) {
	        packet = exports.decodePacket(msg, binaryType, true);

	        if (err.type == packet.type && err.data == packet.data) {
	          // parser error in individual packet - ignoring payload
	          return callback(err, 0, 1);
	        }

	        var ret = callback(packet, i + n, l);
	        if (false === ret) return;
	      }

	      // advance cursor
	      i += n;
	      length = '';
	    }
	  }

	  if (length != '') {
	    // parser error - ignoring payload
	    return callback(err, 0, 1);
	  }

	};

	/**
	 * Encodes multiple messages (payload) as binary.
	 *
	 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
	 * 255><data>
	 *
	 * Example:
	 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
	 *
	 * @param {Array} packets
	 * @return {ArrayBuffer} encoded payload
	 * @api private
	 */

	exports.encodePayloadAsArrayBuffer = function(packets, callback) {
	  if (!packets.length) {
	    return callback(new ArrayBuffer(0));
	  }

	  function encodeOne(packet, doneCallback) {
	    exports.encodePacket(packet, true, true, function(data) {
	      return doneCallback(null, data);
	    });
	  }

	  map(packets, encodeOne, function(err, encodedPackets) {
	    var totalLength = encodedPackets.reduce(function(acc, p) {
	      var len;
	      if (typeof p === 'string'){
	        len = p.length;
	      } else {
	        len = p.byteLength;
	      }
	      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
	    }, 0);

	    var resultArray = new Uint8Array(totalLength);

	    var bufferIndex = 0;
	    encodedPackets.forEach(function(p) {
	      var isString = typeof p === 'string';
	      var ab = p;
	      if (isString) {
	        var view = new Uint8Array(p.length);
	        for (var i = 0; i < p.length; i++) {
	          view[i] = p.charCodeAt(i);
	        }
	        ab = view.buffer;
	      }

	      if (isString) { // not true binary
	        resultArray[bufferIndex++] = 0;
	      } else { // true binary
	        resultArray[bufferIndex++] = 1;
	      }

	      var lenStr = ab.byteLength.toString();
	      for (var i = 0; i < lenStr.length; i++) {
	        resultArray[bufferIndex++] = parseInt(lenStr[i]);
	      }
	      resultArray[bufferIndex++] = 255;

	      var view = new Uint8Array(ab);
	      for (var i = 0; i < view.length; i++) {
	        resultArray[bufferIndex++] = view[i];
	      }
	    });

	    return callback(resultArray.buffer);
	  });
	};

	/**
	 * Encode as Blob
	 */

	exports.encodePayloadAsBlob = function(packets, callback) {
	  function encodeOne(packet, doneCallback) {
	    exports.encodePacket(packet, true, true, function(encoded) {
	      var binaryIdentifier = new Uint8Array(1);
	      binaryIdentifier[0] = 1;
	      if (typeof encoded === 'string') {
	        var view = new Uint8Array(encoded.length);
	        for (var i = 0; i < encoded.length; i++) {
	          view[i] = encoded.charCodeAt(i);
	        }
	        encoded = view.buffer;
	        binaryIdentifier[0] = 0;
	      }

	      var len = (encoded instanceof ArrayBuffer)
	        ? encoded.byteLength
	        : encoded.size;

	      var lenStr = len.toString();
	      var lengthAry = new Uint8Array(lenStr.length + 1);
	      for (var i = 0; i < lenStr.length; i++) {
	        lengthAry[i] = parseInt(lenStr[i]);
	      }
	      lengthAry[lenStr.length] = 255;

	      if (Blob) {
	        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
	        doneCallback(null, blob);
	      }
	    });
	  }

	  map(packets, encodeOne, function(err, results) {
	    return callback(new Blob(results));
	  });
	};

	/*
	 * Decodes data when a payload is maybe expected. Strings are decoded by
	 * interpreting each byte as a key code for entries marked to start with 0. See
	 * description of encodePayloadAsBinary
	 *
	 * @param {ArrayBuffer} data, callback method
	 * @api public
	 */

	exports.decodePayloadAsBinary = function (data, binaryType, callback) {
	  if (typeof binaryType === 'function') {
	    callback = binaryType;
	    binaryType = null;
	  }

	  var bufferTail = data;
	  var buffers = [];

	  var numberTooLong = false;
	  while (bufferTail.byteLength > 0) {
	    var tailArray = new Uint8Array(bufferTail);
	    var isString = tailArray[0] === 0;
	    var msgLength = '';

	    for (var i = 1; ; i++) {
	      if (tailArray[i] == 255) break;

	      if (msgLength.length > 310) {
	        numberTooLong = true;
	        break;
	      }

	      msgLength += tailArray[i];
	    }

	    if(numberTooLong) return callback(err, 0, 1);

	    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
	    msgLength = parseInt(msgLength);

	    var msg = sliceBuffer(bufferTail, 0, msgLength);
	    if (isString) {
	      try {
	        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
	      } catch (e) {
	        // iPhone Safari doesn't let you apply to typed arrays
	        var typed = new Uint8Array(msg);
	        msg = '';
	        for (var i = 0; i < typed.length; i++) {
	          msg += String.fromCharCode(typed[i]);
	        }
	      }
	    }

	    buffers.push(msg);
	    bufferTail = sliceBuffer(bufferTail, msgLength);
	  }

	  var total = buffers.length;
	  buffers.forEach(function(buffer, i) {
	    callback(exports.decodePacket(buffer, binaryType, true), i, total);
	  });
	};

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"./keys":20,"after":11,"arraybuffer.slice":12,"base64-arraybuffer":13,"blob":14,"has-binary":21,"utf8":29}],20:[function(_dereq_,module,exports){

	/**
	 * Gets the keys for an object.
	 *
	 * @return {Array} keys
	 * @api private
	 */

	module.exports = Object.keys || function keys (obj){
	  var arr = [];
	  var has = Object.prototype.hasOwnProperty;

	  for (var i in obj) {
	    if (has.call(obj, i)) {
	      arr.push(i);
	    }
	  }
	  return arr;
	};

	},{}],21:[function(_dereq_,module,exports){
	(function (global){

	/*
	 * Module requirements.
	 */

	var isArray = _dereq_('isarray');

	/**
	 * Module exports.
	 */

	module.exports = hasBinary;

	/**
	 * Checks for binary data.
	 *
	 * Right now only Buffer and ArrayBuffer are supported..
	 *
	 * @param {Object} anything
	 * @api public
	 */

	function hasBinary(data) {

	  function _hasBinary(obj) {
	    if (!obj) return false;

	    if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
	         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
	         (global.Blob && obj instanceof Blob) ||
	         (global.File && obj instanceof File)
	        ) {
	      return true;
	    }

	    if (isArray(obj)) {
	      for (var i = 0; i < obj.length; i++) {
	          if (_hasBinary(obj[i])) {
	              return true;
	          }
	      }
	    } else if (obj && 'object' == typeof obj) {
	      if (obj.toJSON) {
	        obj = obj.toJSON();
	      }

	      for (var key in obj) {
	        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
	          return true;
	        }
	      }
	    }

	    return false;
	  }

	  return _hasBinary(data);
	}

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"isarray":24}],22:[function(_dereq_,module,exports){

	/**
	 * Module exports.
	 *
	 * Logic borrowed from Modernizr:
	 *
	 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
	 */

	try {
	  module.exports = typeof XMLHttpRequest !== 'undefined' &&
	    'withCredentials' in new XMLHttpRequest();
	} catch (err) {
	  // if XMLHttp support is disabled in IE then it will throw
	  // when trying to create
	  module.exports = false;
	}

	},{}],23:[function(_dereq_,module,exports){

	var indexOf = [].indexOf;

	module.exports = function(arr, obj){
	  if (indexOf) return arr.indexOf(obj);
	  for (var i = 0; i < arr.length; ++i) {
	    if (arr[i] === obj) return i;
	  }
	  return -1;
	};
	},{}],24:[function(_dereq_,module,exports){
	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};

	},{}],25:[function(_dereq_,module,exports){
	/**
	 * Helpers.
	 */

	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} options
	 * @return {String|Number}
	 * @api public
	 */

	module.exports = function(val, options){
	  options = options || {};
	  if ('string' == typeof val) return parse(val);
	  return options.long
	    ? long(val)
	    : short(val);
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = '' + str;
	  if (str.length > 10000) return;
	  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
	  if (!match) return;
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function short(ms) {
	  if (ms >= d) return Math.round(ms / d) + 'd';
	  if (ms >= h) return Math.round(ms / h) + 'h';
	  if (ms >= m) return Math.round(ms / m) + 'm';
	  if (ms >= s) return Math.round(ms / s) + 's';
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function long(ms) {
	  return plural(ms, d, 'day')
	    || plural(ms, h, 'hour')
	    || plural(ms, m, 'minute')
	    || plural(ms, s, 'second')
	    || ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, n, name) {
	  if (ms < n) return;
	  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
	  return Math.ceil(ms / n) + ' ' + name + 's';
	}

	},{}],26:[function(_dereq_,module,exports){
	(function (global){
	/**
	 * JSON parse.
	 *
	 * @see Based on jQuery#parseJSON (MIT) and JSON2
	 * @api private
	 */

	var rvalidchars = /^[\],:{}\s]*$/;
	var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
	var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
	var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
	var rtrimLeft = /^\s+/;
	var rtrimRight = /\s+$/;

	module.exports = function parsejson(data) {
	  if ('string' != typeof data || !data) {
	    return null;
	  }

	  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

	  // Attempt to parse using the native JSON parser first
	  if (global.JSON && JSON.parse) {
	    return JSON.parse(data);
	  }

	  if (rvalidchars.test(data.replace(rvalidescape, '@')
	      .replace(rvalidtokens, ']')
	      .replace(rvalidbraces, ''))) {
	    return (new Function('return ' + data))();
	  }
	};
	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{}],27:[function(_dereq_,module,exports){
	/**
	 * Compiles a querystring
	 * Returns string representation of the object
	 *
	 * @param {Object}
	 * @api private
	 */

	exports.encode = function (obj) {
	  var str = '';

	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      if (str.length) str += '&';
	      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
	    }
	  }

	  return str;
	};

	/**
	 * Parses a simple querystring into an object
	 *
	 * @param {String} qs
	 * @api private
	 */

	exports.decode = function(qs){
	  var qry = {};
	  var pairs = qs.split('&');
	  for (var i = 0, l = pairs.length; i < l; i++) {
	    var pair = pairs[i].split('=');
	    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	  }
	  return qry;
	};

	},{}],28:[function(_dereq_,module,exports){
	/**
	 * Parses an URI
	 *
	 * @author Steven Levithan <stevenlevithan.com> (MIT license)
	 * @api private
	 */

	var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

	var parts = [
	    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
	];

	module.exports = function parseuri(str) {
	    var src = str,
	        b = str.indexOf('['),
	        e = str.indexOf(']');

	    if (b != -1 && e != -1) {
	        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
	    }

	    var m = re.exec(str || ''),
	        uri = {},
	        i = 14;

	    while (i--) {
	        uri[parts[i]] = m[i] || '';
	    }

	    if (b != -1 && e != -1) {
	        uri.source = src;
	        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
	        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
	        uri.ipv6uri = true;
	    }

	    return uri;
	};

	},{}],29:[function(_dereq_,module,exports){
	(function (global){
	/*! https://mths.be/utf8js v2.0.0 by @mathias */
	;(function(root) {

		// Detect free variables `exports`
		var freeExports = typeof exports == 'object' && exports;

		// Detect free variable `module`
		var freeModule = typeof module == 'object' && module &&
			module.exports == freeExports && module;

		// Detect free variable `global`, from Node.js or Browserified code,
		// and use it as `root`
		var freeGlobal = typeof global == 'object' && global;
		if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
			root = freeGlobal;
		}

		/*--------------------------------------------------------------------------*/

		var stringFromCharCode = String.fromCharCode;

		// Taken from https://mths.be/punycode
		function ucs2decode(string) {
			var output = [];
			var counter = 0;
			var length = string.length;
			var value;
			var extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		// Taken from https://mths.be/punycode
		function ucs2encode(array) {
			var length = array.length;
			var index = -1;
			var value;
			var output = '';
			while (++index < length) {
				value = array[index];
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
			}
			return output;
		}

		function checkScalarValue(codePoint) {
			if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
				throw Error(
					'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
					' is not a scalar value'
				);
			}
		}
		/*--------------------------------------------------------------------------*/

		function createByte(codePoint, shift) {
			return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
		}

		function encodeCodePoint(codePoint) {
			if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
				return stringFromCharCode(codePoint);
			}
			var symbol = '';
			if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
				symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
			}
			else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
				checkScalarValue(codePoint);
				symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
				symbol += createByte(codePoint, 6);
			}
			else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
				symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
				symbol += createByte(codePoint, 12);
				symbol += createByte(codePoint, 6);
			}
			symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
			return symbol;
		}

		function utf8encode(string) {
			var codePoints = ucs2decode(string);
			var length = codePoints.length;
			var index = -1;
			var codePoint;
			var byteString = '';
			while (++index < length) {
				codePoint = codePoints[index];
				byteString += encodeCodePoint(codePoint);
			}
			return byteString;
		}

		/*--------------------------------------------------------------------------*/

		function readContinuationByte() {
			if (byteIndex >= byteCount) {
				throw Error('Invalid byte index');
			}

			var continuationByte = byteArray[byteIndex] & 0xFF;
			byteIndex++;

			if ((continuationByte & 0xC0) == 0x80) {
				return continuationByte & 0x3F;
			}

			// If we end up here, it’s not a continuation byte
			throw Error('Invalid continuation byte');
		}

		function decodeSymbol() {
			var byte1;
			var byte2;
			var byte3;
			var byte4;
			var codePoint;

			if (byteIndex > byteCount) {
				throw Error('Invalid byte index');
			}

			if (byteIndex == byteCount) {
				return false;
			}

			// Read first byte
			byte1 = byteArray[byteIndex] & 0xFF;
			byteIndex++;

			// 1-byte sequence (no continuation bytes)
			if ((byte1 & 0x80) == 0) {
				return byte1;
			}

			// 2-byte sequence
			if ((byte1 & 0xE0) == 0xC0) {
				var byte2 = readContinuationByte();
				codePoint = ((byte1 & 0x1F) << 6) | byte2;
				if (codePoint >= 0x80) {
					return codePoint;
				} else {
					throw Error('Invalid continuation byte');
				}
			}

			// 3-byte sequence (may include unpaired surrogates)
			if ((byte1 & 0xF0) == 0xE0) {
				byte2 = readContinuationByte();
				byte3 = readContinuationByte();
				codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
				if (codePoint >= 0x0800) {
					checkScalarValue(codePoint);
					return codePoint;
				} else {
					throw Error('Invalid continuation byte');
				}
			}

			// 4-byte sequence
			if ((byte1 & 0xF8) == 0xF0) {
				byte2 = readContinuationByte();
				byte3 = readContinuationByte();
				byte4 = readContinuationByte();
				codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
					(byte3 << 0x06) | byte4;
				if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
					return codePoint;
				}
			}

			throw Error('Invalid UTF-8 detected');
		}

		var byteArray;
		var byteCount;
		var byteIndex;
		function utf8decode(byteString) {
			byteArray = ucs2decode(byteString);
			byteCount = byteArray.length;
			byteIndex = 0;
			var codePoints = [];
			var tmp;
			while ((tmp = decodeSymbol()) !== false) {
				codePoints.push(tmp);
			}
			return ucs2encode(codePoints);
		}

		/*--------------------------------------------------------------------------*/

		var utf8 = {
			'version': '2.0.0',
			'encode': utf8encode,
			'decode': utf8decode
		};

		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			typeof define == 'function' &&
			typeof define.amd == 'object' &&
			define.amd
		) {
			define(function() {
				return utf8;
			});
		}	else if (freeExports && !freeExports.nodeType) {
			if (freeModule) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = utf8;
			} else { // in Narwhal or RingoJS v0.7.0-
				var object = {};
				var hasOwnProperty = object.hasOwnProperty;
				for (var key in utf8) {
					hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.utf8 = utf8;
		}

	}(this));

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{}],30:[function(_dereq_,module,exports){
	'use strict';

	var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
	  , length = 64
	  , map = {}
	  , seed = 0
	  , i = 0
	  , prev;

	/**
	 * Return a string representing the specified number.
	 *
	 * @param {Number} num The number to convert.
	 * @returns {String} The string representation of the number.
	 * @api public
	 */
	function encode(num) {
	  var encoded = '';

	  do {
	    encoded = alphabet[num % length] + encoded;
	    num = Math.floor(num / length);
	  } while (num > 0);

	  return encoded;
	}

	/**
	 * Return the integer value specified by the given string.
	 *
	 * @param {String} str The string to convert.
	 * @returns {Number} The integer value represented by the string.
	 * @api public
	 */
	function decode(str) {
	  var decoded = 0;

	  for (i = 0; i < str.length; i++) {
	    decoded = decoded * length + map[str.charAt(i)];
	  }

	  return decoded;
	}

	/**
	 * Yeast: A tiny growing id generator.
	 *
	 * @returns {String} A unique id.
	 * @api public
	 */
	function yeast() {
	  var now = encode(+new Date());

	  if (now !== prev) return seed = 0, prev = now;
	  return now +'.'+ encode(seed++);
	}

	//
	// Map each character to its index.
	//
	for (; i < length; i++) map[alphabet[i]] = i;

	//
	// Expose the `yeast`, `encode` and `decode` functions.
	//
	yeast.encode = encode;
	yeast.decode = decode;
	module.exports = yeast;

	},{}],31:[function(_dereq_,module,exports){

	/**
	 * Module dependencies.
	 */

	var url = _dereq_('./url');
	var parser = _dereq_('socket.io-parser');
	var Manager = _dereq_('./manager');
	var debug = _dereq_('debug')('socket.io-client');

	/**
	 * Module exports.
	 */

	module.exports = exports = lookup;

	/**
	 * Managers cache.
	 */

	var cache = exports.managers = {};

	/**
	 * Looks up an existing `Manager` for multiplexing.
	 * If the user summons:
	 *
	 *   `io('http://localhost/a');`
	 *   `io('http://localhost/b');`
	 *
	 * We reuse the existing instance based on same scheme/port/host,
	 * and we initialize sockets for each namespace.
	 *
	 * @api public
	 */

	function lookup(uri, opts) {
	  if (typeof uri == 'object') {
	    opts = uri;
	    uri = undefined;
	  }

	  opts = opts || {};

	  var parsed = url(uri);
	  var source = parsed.source;
	  var id = parsed.id;
	  var path = parsed.path;
	  var sameNamespace = cache[id] && path in cache[id].nsps;
	  var newConnection = opts.forceNew || opts['force new connection'] ||
	                      false === opts.multiplex || sameNamespace;

	  var io;

	  if (newConnection) {
	    debug('ignoring socket cache for %s', source);
	    io = Manager(source, opts);
	  } else {
	    if (!cache[id]) {
	      debug('new io instance for %s', source);
	      cache[id] = Manager(source, opts);
	    }
	    io = cache[id];
	  }

	  return io.socket(parsed.path);
	}

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	exports.protocol = parser.protocol;

	/**
	 * `connect`.
	 *
	 * @param {String} uri
	 * @api public
	 */

	exports.connect = lookup;

	/**
	 * Expose constructors for standalone build.
	 *
	 * @api public
	 */

	exports.Manager = _dereq_('./manager');
	exports.Socket = _dereq_('./socket');

	},{"./manager":32,"./socket":34,"./url":35,"debug":39,"socket.io-parser":47}],32:[function(_dereq_,module,exports){

	/**
	 * Module dependencies.
	 */

	var eio = _dereq_('engine.io-client');
	var Socket = _dereq_('./socket');
	var Emitter = _dereq_('component-emitter');
	var parser = _dereq_('socket.io-parser');
	var on = _dereq_('./on');
	var bind = _dereq_('component-bind');
	var debug = _dereq_('debug')('socket.io-client:manager');
	var indexOf = _dereq_('indexof');
	var Backoff = _dereq_('backo2');

	/**
	 * IE6+ hasOwnProperty
	 */

	var has = Object.prototype.hasOwnProperty;

	/**
	 * Module exports
	 */

	module.exports = Manager;

	/**
	 * `Manager` constructor.
	 *
	 * @param {String} engine instance or engine uri/opts
	 * @param {Object} options
	 * @api public
	 */

	function Manager(uri, opts){
	  if (!(this instanceof Manager)) return new Manager(uri, opts);
	  if (uri && ('object' == typeof uri)) {
	    opts = uri;
	    uri = undefined;
	  }
	  opts = opts || {};

	  opts.path = opts.path || '/socket.io';
	  this.nsps = {};
	  this.subs = [];
	  this.opts = opts;
	  this.reconnection(opts.reconnection !== false);
	  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
	  this.reconnectionDelay(opts.reconnectionDelay || 1000);
	  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
	  this.randomizationFactor(opts.randomizationFactor || 0.5);
	  this.backoff = new Backoff({
	    min: this.reconnectionDelay(),
	    max: this.reconnectionDelayMax(),
	    jitter: this.randomizationFactor()
	  });
	  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
	  this.readyState = 'closed';
	  this.uri = uri;
	  this.connecting = [];
	  this.lastPing = null;
	  this.encoding = false;
	  this.packetBuffer = [];
	  this.encoder = new parser.Encoder();
	  this.decoder = new parser.Decoder();
	  this.autoConnect = opts.autoConnect !== false;
	  if (this.autoConnect) this.open();
	}

	/**
	 * Propagate given event to sockets and emit on `this`
	 *
	 * @api private
	 */

	Manager.prototype.emitAll = function() {
	  this.emit.apply(this, arguments);
	  for (var nsp in this.nsps) {
	    if (has.call(this.nsps, nsp)) {
	      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
	    }
	  }
	};

	/**
	 * Update `socket.id` of all sockets
	 *
	 * @api private
	 */

	Manager.prototype.updateSocketIds = function(){
	  for (var nsp in this.nsps) {
	    if (has.call(this.nsps, nsp)) {
	      this.nsps[nsp].id = this.engine.id;
	    }
	  }
	};

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Manager.prototype);

	/**
	 * Sets the `reconnection` config.
	 *
	 * @param {Boolean} true/false if it should automatically reconnect
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnection = function(v){
	  if (!arguments.length) return this._reconnection;
	  this._reconnection = !!v;
	  return this;
	};

	/**
	 * Sets the reconnection attempts config.
	 *
	 * @param {Number} max reconnection attempts before giving up
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionAttempts = function(v){
	  if (!arguments.length) return this._reconnectionAttempts;
	  this._reconnectionAttempts = v;
	  return this;
	};

	/**
	 * Sets the delay between reconnections.
	 *
	 * @param {Number} delay
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionDelay = function(v){
	  if (!arguments.length) return this._reconnectionDelay;
	  this._reconnectionDelay = v;
	  this.backoff && this.backoff.setMin(v);
	  return this;
	};

	Manager.prototype.randomizationFactor = function(v){
	  if (!arguments.length) return this._randomizationFactor;
	  this._randomizationFactor = v;
	  this.backoff && this.backoff.setJitter(v);
	  return this;
	};

	/**
	 * Sets the maximum delay between reconnections.
	 *
	 * @param {Number} delay
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.reconnectionDelayMax = function(v){
	  if (!arguments.length) return this._reconnectionDelayMax;
	  this._reconnectionDelayMax = v;
	  this.backoff && this.backoff.setMax(v);
	  return this;
	};

	/**
	 * Sets the connection timeout. `false` to disable
	 *
	 * @return {Manager} self or value
	 * @api public
	 */

	Manager.prototype.timeout = function(v){
	  if (!arguments.length) return this._timeout;
	  this._timeout = v;
	  return this;
	};

	/**
	 * Starts trying to reconnect if reconnection is enabled and we have not
	 * started reconnecting yet
	 *
	 * @api private
	 */

	Manager.prototype.maybeReconnectOnOpen = function() {
	  // Only try to reconnect if it's the first time we're connecting
	  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
	    // keeps reconnection from firing twice for the same reconnection loop
	    this.reconnect();
	  }
	};


	/**
	 * Sets the current transport `socket`.
	 *
	 * @param {Function} optional, callback
	 * @return {Manager} self
	 * @api public
	 */

	Manager.prototype.open =
	Manager.prototype.connect = function(fn){
	  debug('readyState %s', this.readyState);
	  if (~this.readyState.indexOf('open')) return this;

	  debug('opening %s', this.uri);
	  this.engine = eio(this.uri, this.opts);
	  var socket = this.engine;
	  var self = this;
	  this.readyState = 'opening';
	  this.skipReconnect = false;

	  // emit `open`
	  var openSub = on(socket, 'open', function() {
	    self.onopen();
	    fn && fn();
	  });

	  // emit `connect_error`
	  var errorSub = on(socket, 'error', function(data){
	    debug('connect_error');
	    self.cleanup();
	    self.readyState = 'closed';
	    self.emitAll('connect_error', data);
	    if (fn) {
	      var err = new Error('Connection error');
	      err.data = data;
	      fn(err);
	    } else {
	      // Only do this if there is no fn to handle the error
	      self.maybeReconnectOnOpen();
	    }
	  });

	  // emit `connect_timeout`
	  if (false !== this._timeout) {
	    var timeout = this._timeout;
	    debug('connect attempt will timeout after %d', timeout);

	    // set timer
	    var timer = setTimeout(function(){
	      debug('connect attempt timed out after %d', timeout);
	      openSub.destroy();
	      socket.close();
	      socket.emit('error', 'timeout');
	      self.emitAll('connect_timeout', timeout);
	    }, timeout);

	    this.subs.push({
	      destroy: function(){
	        clearTimeout(timer);
	      }
	    });
	  }

	  this.subs.push(openSub);
	  this.subs.push(errorSub);

	  return this;
	};

	/**
	 * Called upon transport open.
	 *
	 * @api private
	 */

	Manager.prototype.onopen = function(){
	  debug('open');

	  // clear old subs
	  this.cleanup();

	  // mark as open
	  this.readyState = 'open';
	  this.emit('open');

	  // add new subs
	  var socket = this.engine;
	  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
	  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
	  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
	  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
	  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
	  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
	};

	/**
	 * Called upon a ping.
	 *
	 * @api private
	 */

	Manager.prototype.onping = function(){
	  this.lastPing = new Date;
	  this.emitAll('ping');
	};

	/**
	 * Called upon a packet.
	 *
	 * @api private
	 */

	Manager.prototype.onpong = function(){
	  this.emitAll('pong', new Date - this.lastPing);
	};

	/**
	 * Called with data.
	 *
	 * @api private
	 */

	Manager.prototype.ondata = function(data){
	  this.decoder.add(data);
	};

	/**
	 * Called when parser fully decodes a packet.
	 *
	 * @api private
	 */

	Manager.prototype.ondecoded = function(packet) {
	  this.emit('packet', packet);
	};

	/**
	 * Called upon socket error.
	 *
	 * @api private
	 */

	Manager.prototype.onerror = function(err){
	  debug('error', err);
	  this.emitAll('error', err);
	};

	/**
	 * Creates a new socket for the given `nsp`.
	 *
	 * @return {Socket}
	 * @api public
	 */

	Manager.prototype.socket = function(nsp){
	  var socket = this.nsps[nsp];
	  if (!socket) {
	    socket = new Socket(this, nsp);
	    this.nsps[nsp] = socket;
	    var self = this;
	    socket.on('connecting', onConnecting);
	    socket.on('connect', function(){
	      socket.id = self.engine.id;
	    });

	    if (this.autoConnect) {
	      // manually call here since connecting evnet is fired before listening
	      onConnecting();
	    }
	  }

	  function onConnecting() {
	    if (!~indexOf(self.connecting, socket)) {
	      self.connecting.push(socket);
	    }
	  }

	  return socket;
	};

	/**
	 * Called upon a socket close.
	 *
	 * @param {Socket} socket
	 */

	Manager.prototype.destroy = function(socket){
	  var index = indexOf(this.connecting, socket);
	  if (~index) this.connecting.splice(index, 1);
	  if (this.connecting.length) return;

	  this.close();
	};

	/**
	 * Writes a packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Manager.prototype.packet = function(packet){
	  debug('writing packet %j', packet);
	  var self = this;

	  if (!self.encoding) {
	    // encode, then write to engine with result
	    self.encoding = true;
	    this.encoder.encode(packet, function(encodedPackets) {
	      for (var i = 0; i < encodedPackets.length; i++) {
	        self.engine.write(encodedPackets[i], packet.options);
	      }
	      self.encoding = false;
	      self.processPacketQueue();
	    });
	  } else { // add packet to the queue
	    self.packetBuffer.push(packet);
	  }
	};

	/**
	 * If packet buffer is non-empty, begins encoding the
	 * next packet in line.
	 *
	 * @api private
	 */

	Manager.prototype.processPacketQueue = function() {
	  if (this.packetBuffer.length > 0 && !this.encoding) {
	    var pack = this.packetBuffer.shift();
	    this.packet(pack);
	  }
	};

	/**
	 * Clean up transport subscriptions and packet buffer.
	 *
	 * @api private
	 */

	Manager.prototype.cleanup = function(){
	  debug('cleanup');

	  var sub;
	  while (sub = this.subs.shift()) sub.destroy();

	  this.packetBuffer = [];
	  this.encoding = false;
	  this.lastPing = null;

	  this.decoder.destroy();
	};

	/**
	 * Close the current socket.
	 *
	 * @api private
	 */

	Manager.prototype.close =
	Manager.prototype.disconnect = function(){
	  debug('disconnect');
	  this.skipReconnect = true;
	  this.reconnecting = false;
	  if ('opening' == this.readyState) {
	    // `onclose` will not fire because
	    // an open event never happened
	    this.cleanup();
	  }
	  this.backoff.reset();
	  this.readyState = 'closed';
	  if (this.engine) this.engine.close();
	};

	/**
	 * Called upon engine close.
	 *
	 * @api private
	 */

	Manager.prototype.onclose = function(reason){
	  debug('onclose');

	  this.cleanup();
	  this.backoff.reset();
	  this.readyState = 'closed';
	  this.emit('close', reason);

	  if (this._reconnection && !this.skipReconnect) {
	    this.reconnect();
	  }
	};

	/**
	 * Attempt a reconnection.
	 *
	 * @api private
	 */

	Manager.prototype.reconnect = function(){
	  if (this.reconnecting || this.skipReconnect) return this;

	  var self = this;

	  if (this.backoff.attempts >= this._reconnectionAttempts) {
	    debug('reconnect failed');
	    this.backoff.reset();
	    this.emitAll('reconnect_failed');
	    this.reconnecting = false;
	  } else {
	    var delay = this.backoff.duration();
	    debug('will wait %dms before reconnect attempt', delay);

	    this.reconnecting = true;
	    var timer = setTimeout(function(){
	      if (self.skipReconnect) return;

	      debug('attempting reconnect');
	      self.emitAll('reconnect_attempt', self.backoff.attempts);
	      self.emitAll('reconnecting', self.backoff.attempts);

	      // check again for the case socket closed in above events
	      if (self.skipReconnect) return;

	      self.open(function(err){
	        if (err) {
	          debug('reconnect attempt error');
	          self.reconnecting = false;
	          self.reconnect();
	          self.emitAll('reconnect_error', err.data);
	        } else {
	          debug('reconnect success');
	          self.onreconnect();
	        }
	      });
	    }, delay);

	    this.subs.push({
	      destroy: function(){
	        clearTimeout(timer);
	      }
	    });
	  }
	};

	/**
	 * Called upon successful reconnect.
	 *
	 * @api private
	 */

	Manager.prototype.onreconnect = function(){
	  var attempt = this.backoff.attempts;
	  this.reconnecting = false;
	  this.backoff.reset();
	  this.updateSocketIds();
	  this.emitAll('reconnect', attempt);
	};

	},{"./on":33,"./socket":34,"backo2":36,"component-bind":37,"component-emitter":38,"debug":39,"engine.io-client":1,"indexof":42,"socket.io-parser":47}],33:[function(_dereq_,module,exports){

	/**
	 * Module exports.
	 */

	module.exports = on;

	/**
	 * Helper for subscriptions.
	 *
	 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
	 * @param {String} event name
	 * @param {Function} callback
	 * @api public
	 */

	function on(obj, ev, fn) {
	  obj.on(ev, fn);
	  return {
	    destroy: function(){
	      obj.removeListener(ev, fn);
	    }
	  };
	}

	},{}],34:[function(_dereq_,module,exports){

	/**
	 * Module dependencies.
	 */

	var parser = _dereq_('socket.io-parser');
	var Emitter = _dereq_('component-emitter');
	var toArray = _dereq_('to-array');
	var on = _dereq_('./on');
	var bind = _dereq_('component-bind');
	var debug = _dereq_('debug')('socket.io-client:socket');
	var hasBin = _dereq_('has-binary');

	/**
	 * Module exports.
	 */

	module.exports = exports = Socket;

	/**
	 * Internal events (blacklisted).
	 * These events can't be emitted by the user.
	 *
	 * @api private
	 */

	var events = {
	  connect: 1,
	  connect_error: 1,
	  connect_timeout: 1,
	  connecting: 1,
	  disconnect: 1,
	  error: 1,
	  reconnect: 1,
	  reconnect_attempt: 1,
	  reconnect_failed: 1,
	  reconnect_error: 1,
	  reconnecting: 1,
	  ping: 1,
	  pong: 1
	};

	/**
	 * Shortcut to `Emitter#emit`.
	 */

	var emit = Emitter.prototype.emit;

	/**
	 * `Socket` constructor.
	 *
	 * @api public
	 */

	function Socket(io, nsp){
	  this.io = io;
	  this.nsp = nsp;
	  this.json = this; // compat
	  this.ids = 0;
	  this.acks = {};
	  this.receiveBuffer = [];
	  this.sendBuffer = [];
	  this.connected = false;
	  this.disconnected = true;
	  if (this.io.autoConnect) this.open();
	}

	/**
	 * Mix in `Emitter`.
	 */

	Emitter(Socket.prototype);

	/**
	 * Subscribe to open, close and packet events
	 *
	 * @api private
	 */

	Socket.prototype.subEvents = function() {
	  if (this.subs) return;

	  var io = this.io;
	  this.subs = [
	    on(io, 'open', bind(this, 'onopen')),
	    on(io, 'packet', bind(this, 'onpacket')),
	    on(io, 'close', bind(this, 'onclose'))
	  ];
	};

	/**
	 * "Opens" the socket.
	 *
	 * @api public
	 */

	Socket.prototype.open =
	Socket.prototype.connect = function(){
	  if (this.connected) return this;

	  this.subEvents();
	  this.io.open(); // ensure open
	  if ('open' == this.io.readyState) this.onopen();
	  this.emit('connecting');
	  return this;
	};

	/**
	 * Sends a `message` event.
	 *
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.send = function(){
	  var args = toArray(arguments);
	  args.unshift('message');
	  this.emit.apply(this, args);
	  return this;
	};

	/**
	 * Override `emit`.
	 * If the event is in `events`, it's emitted normally.
	 *
	 * @param {String} event name
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.emit = function(ev){
	  if (events.hasOwnProperty(ev)) {
	    emit.apply(this, arguments);
	    return this;
	  }

	  var args = toArray(arguments);
	  var parserType = parser.EVENT; // default
	  if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
	  var packet = { type: parserType, data: args };

	  packet.options = {};
	  packet.options.compress = !this.flags || false !== this.flags.compress;

	  // event ack callback
	  if ('function' == typeof args[args.length - 1]) {
	    debug('emitting packet with ack id %d', this.ids);
	    this.acks[this.ids] = args.pop();
	    packet.id = this.ids++;
	  }

	  if (this.connected) {
	    this.packet(packet);
	  } else {
	    this.sendBuffer.push(packet);
	  }

	  delete this.flags;

	  return this;
	};

	/**
	 * Sends a packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.packet = function(packet){
	  packet.nsp = this.nsp;
	  this.io.packet(packet);
	};

	/**
	 * Called upon engine `open`.
	 *
	 * @api private
	 */

	Socket.prototype.onopen = function(){
	  debug('transport is open - connecting');

	  // write connect packet if necessary
	  if ('/' != this.nsp) {
	    this.packet({ type: parser.CONNECT });
	  }
	};

	/**
	 * Called upon engine `close`.
	 *
	 * @param {String} reason
	 * @api private
	 */

	Socket.prototype.onclose = function(reason){
	  debug('close (%s)', reason);
	  this.connected = false;
	  this.disconnected = true;
	  delete this.id;
	  this.emit('disconnect', reason);
	};

	/**
	 * Called with socket packet.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onpacket = function(packet){
	  if (packet.nsp != this.nsp) return;

	  switch (packet.type) {
	    case parser.CONNECT:
	      this.onconnect();
	      break;

	    case parser.EVENT:
	      this.onevent(packet);
	      break;

	    case parser.BINARY_EVENT:
	      this.onevent(packet);
	      break;

	    case parser.ACK:
	      this.onack(packet);
	      break;

	    case parser.BINARY_ACK:
	      this.onack(packet);
	      break;

	    case parser.DISCONNECT:
	      this.ondisconnect();
	      break;

	    case parser.ERROR:
	      this.emit('error', packet.data);
	      break;
	  }
	};

	/**
	 * Called upon a server event.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onevent = function(packet){
	  var args = packet.data || [];
	  debug('emitting event %j', args);

	  if (null != packet.id) {
	    debug('attaching ack callback to event');
	    args.push(this.ack(packet.id));
	  }

	  if (this.connected) {
	    emit.apply(this, args);
	  } else {
	    this.receiveBuffer.push(args);
	  }
	};

	/**
	 * Produces an ack callback to emit with an event.
	 *
	 * @api private
	 */

	Socket.prototype.ack = function(id){
	  var self = this;
	  var sent = false;
	  return function(){
	    // prevent double callbacks
	    if (sent) return;
	    sent = true;
	    var args = toArray(arguments);
	    debug('sending ack %j', args);

	    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
	    self.packet({
	      type: type,
	      id: id,
	      data: args
	    });
	  };
	};

	/**
	 * Called upon a server acknowlegement.
	 *
	 * @param {Object} packet
	 * @api private
	 */

	Socket.prototype.onack = function(packet){
	  var ack = this.acks[packet.id];
	  if ('function' == typeof ack) {
	    debug('calling ack %s with %j', packet.id, packet.data);
	    ack.apply(this, packet.data);
	    delete this.acks[packet.id];
	  } else {
	    debug('bad ack %s', packet.id);
	  }
	};

	/**
	 * Called upon server connect.
	 *
	 * @api private
	 */

	Socket.prototype.onconnect = function(){
	  this.connected = true;
	  this.disconnected = false;
	  this.emit('connect');
	  this.emitBuffered();
	};

	/**
	 * Emit buffered events (received and emitted).
	 *
	 * @api private
	 */

	Socket.prototype.emitBuffered = function(){
	  var i;
	  for (i = 0; i < this.receiveBuffer.length; i++) {
	    emit.apply(this, this.receiveBuffer[i]);
	  }
	  this.receiveBuffer = [];

	  for (i = 0; i < this.sendBuffer.length; i++) {
	    this.packet(this.sendBuffer[i]);
	  }
	  this.sendBuffer = [];
	};

	/**
	 * Called upon server disconnect.
	 *
	 * @api private
	 */

	Socket.prototype.ondisconnect = function(){
	  debug('server disconnect (%s)', this.nsp);
	  this.destroy();
	  this.onclose('io server disconnect');
	};

	/**
	 * Called upon forced client/server side disconnections,
	 * this method ensures the manager stops tracking us and
	 * that reconnections don't get triggered for this.
	 *
	 * @api private.
	 */

	Socket.prototype.destroy = function(){
	  if (this.subs) {
	    // clean subscriptions to avoid reconnections
	    for (var i = 0; i < this.subs.length; i++) {
	      this.subs[i].destroy();
	    }
	    this.subs = null;
	  }

	  this.io.destroy(this);
	};

	/**
	 * Disconnects the socket manually.
	 *
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.close =
	Socket.prototype.disconnect = function(){
	  if (this.connected) {
	    debug('performing disconnect (%s)', this.nsp);
	    this.packet({ type: parser.DISCONNECT });
	  }

	  // remove socket from pool
	  this.destroy();

	  if (this.connected) {
	    // fire events
	    this.onclose('io client disconnect');
	  }
	  return this;
	};

	/**
	 * Sets the compress flag.
	 *
	 * @param {Boolean} if `true`, compresses the sending data
	 * @return {Socket} self
	 * @api public
	 */

	Socket.prototype.compress = function(compress){
	  this.flags = this.flags || {};
	  this.flags.compress = compress;
	  return this;
	};

	},{"./on":33,"component-bind":37,"component-emitter":38,"debug":39,"has-binary":41,"socket.io-parser":47,"to-array":51}],35:[function(_dereq_,module,exports){
	(function (global){

	/**
	 * Module dependencies.
	 */

	var parseuri = _dereq_('parseuri');
	var debug = _dereq_('debug')('socket.io-client:url');

	/**
	 * Module exports.
	 */

	module.exports = url;

	/**
	 * URL parser.
	 *
	 * @param {String} url
	 * @param {Object} An object meant to mimic window.location.
	 *                 Defaults to window.location.
	 * @api public
	 */

	function url(uri, loc){
	  var obj = uri;

	  // default to window.location
	  var loc = loc || global.location;
	  if (null == uri) uri = loc.protocol + '//' + loc.host;

	  // relative path support
	  if ('string' == typeof uri) {
	    if ('/' == uri.charAt(0)) {
	      if ('/' == uri.charAt(1)) {
	        uri = loc.protocol + uri;
	      } else {
	        uri = loc.host + uri;
	      }
	    }

	    if (!/^(https?|wss?):\/\//.test(uri)) {
	      debug('protocol-less url %s', uri);
	      if ('undefined' != typeof loc) {
	        uri = loc.protocol + '//' + uri;
	      } else {
	        uri = 'https://' + uri;
	      }
	    }

	    // parse
	    debug('parse %s', uri);
	    obj = parseuri(uri);
	  }

	  // make sure we treat `localhost:80` and `localhost` equally
	  if (!obj.port) {
	    if (/^(http|ws)$/.test(obj.protocol)) {
	      obj.port = '80';
	    }
	    else if (/^(http|ws)s$/.test(obj.protocol)) {
	      obj.port = '443';
	    }
	  }

	  obj.path = obj.path || '/';

	  var ipv6 = obj.host.indexOf(':') !== -1;
	  var host = ipv6 ? '[' + obj.host + ']' : obj.host;

	  // define unique id
	  obj.id = obj.protocol + '://' + host + ':' + obj.port;
	  // define href
	  obj.href = obj.protocol + '://' + host + (loc && loc.port == obj.port ? '' : (':' + obj.port));

	  return obj;
	}

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"debug":39,"parseuri":45}],36:[function(_dereq_,module,exports){

	/**
	 * Expose `Backoff`.
	 */

	module.exports = Backoff;

	/**
	 * Initialize backoff timer with `opts`.
	 *
	 * - `min` initial timeout in milliseconds [100]
	 * - `max` max timeout [10000]
	 * - `jitter` [0]
	 * - `factor` [2]
	 *
	 * @param {Object} opts
	 * @api public
	 */

	function Backoff(opts) {
	  opts = opts || {};
	  this.ms = opts.min || 100;
	  this.max = opts.max || 10000;
	  this.factor = opts.factor || 2;
	  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
	  this.attempts = 0;
	}

	/**
	 * Return the backoff duration.
	 *
	 * @return {Number}
	 * @api public
	 */

	Backoff.prototype.duration = function(){
	  var ms = this.ms * Math.pow(this.factor, this.attempts++);
	  if (this.jitter) {
	    var rand =  Math.random();
	    var deviation = Math.floor(rand * this.jitter * ms);
	    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
	  }
	  return Math.min(ms, this.max) | 0;
	};

	/**
	 * Reset the number of attempts.
	 *
	 * @api public
	 */

	Backoff.prototype.reset = function(){
	  this.attempts = 0;
	};

	/**
	 * Set the minimum duration
	 *
	 * @api public
	 */

	Backoff.prototype.setMin = function(min){
	  this.ms = min;
	};

	/**
	 * Set the maximum duration
	 *
	 * @api public
	 */

	Backoff.prototype.setMax = function(max){
	  this.max = max;
	};

	/**
	 * Set the jitter
	 *
	 * @api public
	 */

	Backoff.prototype.setJitter = function(jitter){
	  this.jitter = jitter;
	};


	},{}],37:[function(_dereq_,module,exports){
	/**
	 * Slice reference.
	 */

	var slice = [].slice;

	/**
	 * Bind `obj` to `fn`.
	 *
	 * @param {Object} obj
	 * @param {Function|String} fn or string
	 * @return {Function}
	 * @api public
	 */

	module.exports = function(obj, fn){
	  if ('string' == typeof fn) fn = obj[fn];
	  if ('function' != typeof fn) throw new Error('bind() requires a function');
	  var args = slice.call(arguments, 2);
	  return function(){
	    return fn.apply(obj, args.concat(slice.call(arguments)));
	  }
	};

	},{}],38:[function(_dereq_,module,exports){

	/**
	 * Expose `Emitter`.
	 */

	module.exports = Emitter;

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};

	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }

	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];

	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};

	},{}],39:[function(_dereq_,module,exports){
	arguments[4][17][0].apply(exports,arguments)
	},{"./debug":40,"dup":17}],40:[function(_dereq_,module,exports){
	arguments[4][18][0].apply(exports,arguments)
	},{"dup":18,"ms":44}],41:[function(_dereq_,module,exports){
	(function (global){

	/*
	 * Module requirements.
	 */

	var isArray = _dereq_('isarray');

	/**
	 * Module exports.
	 */

	module.exports = hasBinary;

	/**
	 * Checks for binary data.
	 *
	 * Right now only Buffer and ArrayBuffer are supported..
	 *
	 * @param {Object} anything
	 * @api public
	 */

	function hasBinary(data) {

	  function _hasBinary(obj) {
	    if (!obj) return false;

	    if ( (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj)) ||
	         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
	         (global.Blob && obj instanceof Blob) ||
	         (global.File && obj instanceof File)
	        ) {
	      return true;
	    }

	    if (isArray(obj)) {
	      for (var i = 0; i < obj.length; i++) {
	          if (_hasBinary(obj[i])) {
	              return true;
	          }
	      }
	    } else if (obj && 'object' == typeof obj) {
	      // see: https://github.com/Automattic/has-binary/pull/4
	      if (obj.toJSON && 'function' == typeof obj.toJSON) {
	        obj = obj.toJSON();
	      }

	      for (var key in obj) {
	        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
	          return true;
	        }
	      }
	    }

	    return false;
	  }

	  return _hasBinary(data);
	}

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"isarray":43}],42:[function(_dereq_,module,exports){
	arguments[4][23][0].apply(exports,arguments)
	},{"dup":23}],43:[function(_dereq_,module,exports){
	arguments[4][24][0].apply(exports,arguments)
	},{"dup":24}],44:[function(_dereq_,module,exports){
	arguments[4][25][0].apply(exports,arguments)
	},{"dup":25}],45:[function(_dereq_,module,exports){
	arguments[4][28][0].apply(exports,arguments)
	},{"dup":28}],46:[function(_dereq_,module,exports){
	(function (global){
	/*global Blob,File*/

	/**
	 * Module requirements
	 */

	var isArray = _dereq_('isarray');
	var isBuf = _dereq_('./is-buffer');

	/**
	 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
	 * Anything with blobs or files should be fed through removeBlobs before coming
	 * here.
	 *
	 * @param {Object} packet - socket.io event packet
	 * @return {Object} with deconstructed packet and list of buffers
	 * @api public
	 */

	exports.deconstructPacket = function(packet){
	  var buffers = [];
	  var packetData = packet.data;

	  function _deconstructPacket(data) {
	    if (!data) return data;

	    if (isBuf(data)) {
	      var placeholder = { _placeholder: true, num: buffers.length };
	      buffers.push(data);
	      return placeholder;
	    } else if (isArray(data)) {
	      var newData = new Array(data.length);
	      for (var i = 0; i < data.length; i++) {
	        newData[i] = _deconstructPacket(data[i]);
	      }
	      return newData;
	    } else if ('object' == typeof data && !(data instanceof Date)) {
	      var newData = {};
	      for (var key in data) {
	        newData[key] = _deconstructPacket(data[key]);
	      }
	      return newData;
	    }
	    return data;
	  }

	  var pack = packet;
	  pack.data = _deconstructPacket(packetData);
	  pack.attachments = buffers.length; // number of binary 'attachments'
	  return {packet: pack, buffers: buffers};
	};

	/**
	 * Reconstructs a binary packet from its placeholder packet and buffers
	 *
	 * @param {Object} packet - event packet with placeholders
	 * @param {Array} buffers - binary buffers to put in placeholder positions
	 * @return {Object} reconstructed packet
	 * @api public
	 */

	exports.reconstructPacket = function(packet, buffers) {
	  var curPlaceHolder = 0;

	  function _reconstructPacket(data) {
	    if (data && data._placeholder) {
	      var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
	      return buf;
	    } else if (isArray(data)) {
	      for (var i = 0; i < data.length; i++) {
	        data[i] = _reconstructPacket(data[i]);
	      }
	      return data;
	    } else if (data && 'object' == typeof data) {
	      for (var key in data) {
	        data[key] = _reconstructPacket(data[key]);
	      }
	      return data;
	    }
	    return data;
	  }

	  packet.data = _reconstructPacket(packet.data);
	  packet.attachments = undefined; // no longer useful
	  return packet;
	};

	/**
	 * Asynchronously removes Blobs or Files from data via
	 * FileReader's readAsArrayBuffer method. Used before encoding
	 * data as msgpack. Calls callback with the blobless data.
	 *
	 * @param {Object} data
	 * @param {Function} callback
	 * @api private
	 */

	exports.removeBlobs = function(data, callback) {
	  function _removeBlobs(obj, curKey, containingObject) {
	    if (!obj) return obj;

	    // convert any blob
	    if ((global.Blob && obj instanceof Blob) ||
	        (global.File && obj instanceof File)) {
	      pendingBlobs++;

	      // async filereader
	      var fileReader = new FileReader();
	      fileReader.onload = function() { // this.result == arraybuffer
	        if (containingObject) {
	          containingObject[curKey] = this.result;
	        }
	        else {
	          bloblessData = this.result;
	        }

	        // if nothing pending its callback time
	        if(! --pendingBlobs) {
	          callback(bloblessData);
	        }
	      };

	      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
	    } else if (isArray(obj)) { // handle array
	      for (var i = 0; i < obj.length; i++) {
	        _removeBlobs(obj[i], i, obj);
	      }
	    } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
	      for (var key in obj) {
	        _removeBlobs(obj[key], key, obj);
	      }
	    }
	  }

	  var pendingBlobs = 0;
	  var bloblessData = data;
	  _removeBlobs(bloblessData);
	  if (!pendingBlobs) {
	    callback(bloblessData);
	  }
	};

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{"./is-buffer":48,"isarray":43}],47:[function(_dereq_,module,exports){

	/**
	 * Module dependencies.
	 */

	var debug = _dereq_('debug')('socket.io-parser');
	var json = _dereq_('json3');
	var isArray = _dereq_('isarray');
	var Emitter = _dereq_('component-emitter');
	var binary = _dereq_('./binary');
	var isBuf = _dereq_('./is-buffer');

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	exports.protocol = 4;

	/**
	 * Packet types.
	 *
	 * @api public
	 */

	exports.types = [
	  'CONNECT',
	  'DISCONNECT',
	  'EVENT',
	  'BINARY_EVENT',
	  'ACK',
	  'BINARY_ACK',
	  'ERROR'
	];

	/**
	 * Packet type `connect`.
	 *
	 * @api public
	 */

	exports.CONNECT = 0;

	/**
	 * Packet type `disconnect`.
	 *
	 * @api public
	 */

	exports.DISCONNECT = 1;

	/**
	 * Packet type `event`.
	 *
	 * @api public
	 */

	exports.EVENT = 2;

	/**
	 * Packet type `ack`.
	 *
	 * @api public
	 */

	exports.ACK = 3;

	/**
	 * Packet type `error`.
	 *
	 * @api public
	 */

	exports.ERROR = 4;

	/**
	 * Packet type 'binary event'
	 *
	 * @api public
	 */

	exports.BINARY_EVENT = 5;

	/**
	 * Packet type `binary ack`. For acks with binary arguments.
	 *
	 * @api public
	 */

	exports.BINARY_ACK = 6;

	/**
	 * Encoder constructor.
	 *
	 * @api public
	 */

	exports.Encoder = Encoder;

	/**
	 * Decoder constructor.
	 *
	 * @api public
	 */

	exports.Decoder = Decoder;

	/**
	 * A socket.io Encoder instance
	 *
	 * @api public
	 */

	function Encoder() {}

	/**
	 * Encode a packet as a single string if non-binary, or as a
	 * buffer sequence, depending on packet type.
	 *
	 * @param {Object} obj - packet object
	 * @param {Function} callback - function to handle encodings (likely engine.write)
	 * @return Calls callback with Array of encodings
	 * @api public
	 */

	Encoder.prototype.encode = function(obj, callback){
	  debug('encoding packet %j', obj);

	  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
	    encodeAsBinary(obj, callback);
	  }
	  else {
	    var encoding = encodeAsString(obj);
	    callback([encoding]);
	  }
	};

	/**
	 * Encode packet as string.
	 *
	 * @param {Object} packet
	 * @return {String} encoded
	 * @api private
	 */

	function encodeAsString(obj) {
	  var str = '';
	  var nsp = false;

	  // first is type
	  str += obj.type;

	  // attachments if we have them
	  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
	    str += obj.attachments;
	    str += '-';
	  }

	  // if we have a namespace other than `/`
	  // we append it followed by a comma `,`
	  if (obj.nsp && '/' != obj.nsp) {
	    nsp = true;
	    str += obj.nsp;
	  }

	  // immediately followed by the id
	  if (null != obj.id) {
	    if (nsp) {
	      str += ',';
	      nsp = false;
	    }
	    str += obj.id;
	  }

	  // json data
	  if (null != obj.data) {
	    if (nsp) str += ',';
	    str += json.stringify(obj.data);
	  }

	  debug('encoded %j as %s', obj, str);
	  return str;
	}

	/**
	 * Encode packet as 'buffer sequence' by removing blobs, and
	 * deconstructing packet into object with placeholders and
	 * a list of buffers.
	 *
	 * @param {Object} packet
	 * @return {Buffer} encoded
	 * @api private
	 */

	function encodeAsBinary(obj, callback) {

	  function writeEncoding(bloblessData) {
	    var deconstruction = binary.deconstructPacket(bloblessData);
	    var pack = encodeAsString(deconstruction.packet);
	    var buffers = deconstruction.buffers;

	    buffers.unshift(pack); // add packet info to beginning of data list
	    callback(buffers); // write all the buffers
	  }

	  binary.removeBlobs(obj, writeEncoding);
	}

	/**
	 * A socket.io Decoder instance
	 *
	 * @return {Object} decoder
	 * @api public
	 */

	function Decoder() {
	  this.reconstructor = null;
	}

	/**
	 * Mix in `Emitter` with Decoder.
	 */

	Emitter(Decoder.prototype);

	/**
	 * Decodes an ecoded packet string into packet JSON.
	 *
	 * @param {String} obj - encoded packet
	 * @return {Object} packet
	 * @api public
	 */

	Decoder.prototype.add = function(obj) {
	  var packet;
	  if ('string' == typeof obj) {
	    packet = decodeString(obj);
	    if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
	      this.reconstructor = new BinaryReconstructor(packet);

	      // no attachments, labeled binary but no binary data to follow
	      if (this.reconstructor.reconPack.attachments === 0) {
	        this.emit('decoded', packet);
	      }
	    } else { // non-binary full packet
	      this.emit('decoded', packet);
	    }
	  }
	  else if (isBuf(obj) || obj.base64) { // raw binary data
	    if (!this.reconstructor) {
	      throw new Error('got binary data when not reconstructing a packet');
	    } else {
	      packet = this.reconstructor.takeBinaryData(obj);
	      if (packet) { // received final buffer
	        this.reconstructor = null;
	        this.emit('decoded', packet);
	      }
	    }
	  }
	  else {
	    throw new Error('Unknown type: ' + obj);
	  }
	};

	/**
	 * Decode a packet String (JSON data)
	 *
	 * @param {String} str
	 * @return {Object} packet
	 * @api private
	 */

	function decodeString(str) {
	  var p = {};
	  var i = 0;

	  // look up type
	  p.type = Number(str.charAt(0));
	  if (null == exports.types[p.type]) return error();

	  // look up attachments if type binary
	  if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
	    var buf = '';
	    while (str.charAt(++i) != '-') {
	      buf += str.charAt(i);
	      if (i == str.length) break;
	    }
	    if (buf != Number(buf) || str.charAt(i) != '-') {
	      throw new Error('Illegal attachments');
	    }
	    p.attachments = Number(buf);
	  }

	  // look up namespace (if any)
	  if ('/' == str.charAt(i + 1)) {
	    p.nsp = '';
	    while (++i) {
	      var c = str.charAt(i);
	      if (',' == c) break;
	      p.nsp += c;
	      if (i == str.length) break;
	    }
	  } else {
	    p.nsp = '/';
	  }

	  // look up id
	  var next = str.charAt(i + 1);
	  if ('' !== next && Number(next) == next) {
	    p.id = '';
	    while (++i) {
	      var c = str.charAt(i);
	      if (null == c || Number(c) != c) {
	        --i;
	        break;
	      }
	      p.id += str.charAt(i);
	      if (i == str.length) break;
	    }
	    p.id = Number(p.id);
	  }

	  // look up json data
	  if (str.charAt(++i)) {
	    try {
	      p.data = json.parse(str.substr(i));
	    } catch(e){
	      return error();
	    }
	  }

	  debug('decoded %s as %j', str, p);
	  return p;
	}

	/**
	 * Deallocates a parser's resources
	 *
	 * @api public
	 */

	Decoder.prototype.destroy = function() {
	  if (this.reconstructor) {
	    this.reconstructor.finishedReconstruction();
	  }
	};

	/**
	 * A manager of a binary event's 'buffer sequence'. Should
	 * be constructed whenever a packet of type BINARY_EVENT is
	 * decoded.
	 *
	 * @param {Object} packet
	 * @return {BinaryReconstructor} initialized reconstructor
	 * @api private
	 */

	function BinaryReconstructor(packet) {
	  this.reconPack = packet;
	  this.buffers = [];
	}

	/**
	 * Method to be called when binary data received from connection
	 * after a BINARY_EVENT packet.
	 *
	 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
	 * @return {null | Object} returns null if more binary data is expected or
	 *   a reconstructed packet object if all buffers have been received.
	 * @api private
	 */

	BinaryReconstructor.prototype.takeBinaryData = function(binData) {
	  this.buffers.push(binData);
	  if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
	    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
	    this.finishedReconstruction();
	    return packet;
	  }
	  return null;
	};

	/**
	 * Cleans up binary packet reconstruction variables.
	 *
	 * @api private
	 */

	BinaryReconstructor.prototype.finishedReconstruction = function() {
	  this.reconPack = null;
	  this.buffers = [];
	};

	function error(data){
	  return {
	    type: exports.ERROR,
	    data: 'parser error'
	  };
	}

	},{"./binary":46,"./is-buffer":48,"component-emitter":49,"debug":39,"isarray":43,"json3":50}],48:[function(_dereq_,module,exports){
	(function (global){

	module.exports = isBuf;

	/**
	 * Returns true if obj is a buffer or an arraybuffer.
	 *
	 * @api private
	 */

	function isBuf(obj) {
	  return (global.Buffer && global.Buffer.isBuffer(obj)) ||
	         (global.ArrayBuffer && obj instanceof ArrayBuffer);
	}

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{}],49:[function(_dereq_,module,exports){
	arguments[4][15][0].apply(exports,arguments)
	},{"dup":15}],50:[function(_dereq_,module,exports){
	(function (global){
	/*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
	;(function () {
	  // Detect the `define` function exposed by asynchronous module loaders. The
	  // strict `define` check is necessary for compatibility with `r.js`.
	  var isLoader = typeof define === "function" && define.amd;

	  // A set of types used to distinguish objects from primitives.
	  var objectTypes = {
	    "function": true,
	    "object": true
	  };

	  // Detect the `exports` object exposed by CommonJS implementations.
	  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

	  // Use the `global` object exposed by Node (including Browserify via
	  // `insert-module-globals`), Narwhal, and Ringo as the default context,
	  // and the `window` object in browsers. Rhino exports a `global` function
	  // instead.
	  var root = objectTypes[typeof window] && window || this,
	      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

	  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
	    root = freeGlobal;
	  }

	  // Public: Initializes JSON 3 using the given `context` object, attaching the
	  // `stringify` and `parse` functions to the specified `exports` object.
	  function runInContext(context, exports) {
	    context || (context = root["Object"]());
	    exports || (exports = root["Object"]());

	    // Native constructor aliases.
	    var Number = context["Number"] || root["Number"],
	        String = context["String"] || root["String"],
	        Object = context["Object"] || root["Object"],
	        Date = context["Date"] || root["Date"],
	        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
	        TypeError = context["TypeError"] || root["TypeError"],
	        Math = context["Math"] || root["Math"],
	        nativeJSON = context["JSON"] || root["JSON"];

	    // Delegate to the native `stringify` and `parse` implementations.
	    if (typeof nativeJSON == "object" && nativeJSON) {
	      exports.stringify = nativeJSON.stringify;
	      exports.parse = nativeJSON.parse;
	    }

	    // Convenience aliases.
	    var objectProto = Object.prototype,
	        getClass = objectProto.toString,
	        isProperty, forEach, undef;

	    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
	    var isExtended = new Date(-3509827334573292);
	    try {
	      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
	      // results for certain dates in Opera >= 10.53.
	      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
	        // Safari < 2.0.2 stores the internal millisecond time value correctly,
	        // but clips the values returned by the date methods to the range of
	        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
	        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
	    } catch (exception) {}

	    // Internal: Determines whether the native `JSON.stringify` and `parse`
	    // implementations are spec-compliant. Based on work by Ken Snyder.
	    function has(name) {
	      if (has[name] !== undef) {
	        // Return cached feature test result.
	        return has[name];
	      }
	      var isSupported;
	      if (name == "bug-string-char-index") {
	        // IE <= 7 doesn't support accessing string characters using square
	        // bracket notation. IE 8 only supports this for primitives.
	        isSupported = "a"[0] != "a";
	      } else if (name == "json") {
	        // Indicates whether both `JSON.stringify` and `JSON.parse` are
	        // supported.
	        isSupported = has("json-stringify") && has("json-parse");
	      } else {
	        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
	        // Test `JSON.stringify`.
	        if (name == "json-stringify") {
	          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
	          if (stringifySupported) {
	            // A test function object with a custom `toJSON` method.
	            (value = function () {
	              return 1;
	            }).toJSON = value;
	            try {
	              stringifySupported =
	                // Firefox 3.1b1 and b2 serialize string, number, and boolean
	                // primitives as object literals.
	                stringify(0) === "0" &&
	                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
	                // literals.
	                stringify(new Number()) === "0" &&
	                stringify(new String()) == '""' &&
	                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
	                // does not define a canonical JSON representation (this applies to
	                // objects with `toJSON` properties as well, *unless* they are nested
	                // within an object or array).
	                stringify(getClass) === undef &&
	                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
	                // FF 3.1b3 pass this test.
	                stringify(undef) === undef &&
	                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
	                // respectively, if the value is omitted entirely.
	                stringify() === undef &&
	                // FF 3.1b1, 2 throw an error if the given value is not a number,
	                // string, array, object, Boolean, or `null` literal. This applies to
	                // objects with custom `toJSON` methods as well, unless they are nested
	                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
	                // methods entirely.
	                stringify(value) === "1" &&
	                stringify([value]) == "[1]" &&
	                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
	                // `"[null]"`.
	                stringify([undef]) == "[null]" &&
	                // YUI 3.0.0b1 fails to serialize `null` literals.
	                stringify(null) == "null" &&
	                // FF 3.1b1, 2 halts serialization if an array contains a function:
	                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
	                // elides non-JSON values from objects and arrays, unless they
	                // define custom `toJSON` methods.
	                stringify([undef, getClass, null]) == "[null,null,null]" &&
	                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
	                // where character escape codes are expected (e.g., `\b` => `\u0008`).
	                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
	                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
	                stringify(null, value) === "1" &&
	                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
	                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
	                // serialize extended years.
	                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
	                // The milliseconds are optional in ES 5, but required in 5.1.
	                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
	                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
	                // four-digit years instead of six-digit years. Credits: @Yaffle.
	                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
	                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
	                // values less than 1000. Credits: @Yaffle.
	                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
	            } catch (exception) {
	              stringifySupported = false;
	            }
	          }
	          isSupported = stringifySupported;
	        }
	        // Test `JSON.parse`.
	        if (name == "json-parse") {
	          var parse = exports.parse;
	          if (typeof parse == "function") {
	            try {
	              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
	              // Conforming implementations should also coerce the initial argument to
	              // a string prior to parsing.
	              if (parse("0") === 0 && !parse(false)) {
	                // Simple parsing test.
	                value = parse(serialized);
	                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
	                if (parseSupported) {
	                  try {
	                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
	                    parseSupported = !parse('"\t"');
	                  } catch (exception) {}
	                  if (parseSupported) {
	                    try {
	                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
	                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
	                      // certain octal literals.
	                      parseSupported = parse("01") !== 1;
	                    } catch (exception) {}
	                  }
	                  if (parseSupported) {
	                    try {
	                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
	                      // points. These environments, along with FF 3.1b1 and 2,
	                      // also allow trailing commas in JSON objects and arrays.
	                      parseSupported = parse("1.") !== 1;
	                    } catch (exception) {}
	                  }
	                }
	              }
	            } catch (exception) {
	              parseSupported = false;
	            }
	          }
	          isSupported = parseSupported;
	        }
	      }
	      return has[name] = !!isSupported;
	    }

	    if (!has("json")) {
	      // Common `[[Class]]` name aliases.
	      var functionClass = "[object Function]",
	          dateClass = "[object Date]",
	          numberClass = "[object Number]",
	          stringClass = "[object String]",
	          arrayClass = "[object Array]",
	          booleanClass = "[object Boolean]";

	      // Detect incomplete support for accessing string characters by index.
	      var charIndexBuggy = has("bug-string-char-index");

	      // Define additional utility methods if the `Date` methods are buggy.
	      if (!isExtended) {
	        var floor = Math.floor;
	        // A mapping between the months of the year and the number of days between
	        // January 1st and the first of the respective month.
	        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	        // Internal: Calculates the number of days between the Unix epoch and the
	        // first day of the given month.
	        var getDay = function (year, month) {
	          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
	        };
	      }

	      // Internal: Determines if a property is a direct property of the given
	      // object. Delegates to the native `Object#hasOwnProperty` method.
	      if (!(isProperty = objectProto.hasOwnProperty)) {
	        isProperty = function (property) {
	          var members = {}, constructor;
	          if ((members.__proto__ = null, members.__proto__ = {
	            // The *proto* property cannot be set multiple times in recent
	            // versions of Firefox and SeaMonkey.
	            "toString": 1
	          }, members).toString != getClass) {
	            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
	            // supports the mutable *proto* property.
	            isProperty = function (property) {
	              // Capture and break the object's prototype chain (see section 8.6.2
	              // of the ES 5.1 spec). The parenthesized expression prevents an
	              // unsafe transformation by the Closure Compiler.
	              var original = this.__proto__, result = property in (this.__proto__ = null, this);
	              // Restore the original prototype chain.
	              this.__proto__ = original;
	              return result;
	            };
	          } else {
	            // Capture a reference to the top-level `Object` constructor.
	            constructor = members.constructor;
	            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
	            // other environments.
	            isProperty = function (property) {
	              var parent = (this.constructor || constructor).prototype;
	              return property in this && !(property in parent && this[property] === parent[property]);
	            };
	          }
	          members = null;
	          return isProperty.call(this, property);
	        };
	      }

	      // Internal: Normalizes the `for...in` iteration algorithm across
	      // environments. Each enumerated key is yielded to a `callback` function.
	      forEach = function (object, callback) {
	        var size = 0, Properties, members, property;

	        // Tests for bugs in the current environment's `for...in` algorithm. The
	        // `valueOf` property inherits the non-enumerable flag from
	        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
	        (Properties = function () {
	          this.valueOf = 0;
	        }).prototype.valueOf = 0;

	        // Iterate over a new instance of the `Properties` class.
	        members = new Properties();
	        for (property in members) {
	          // Ignore all properties inherited from `Object.prototype`.
	          if (isProperty.call(members, property)) {
	            size++;
	          }
	        }
	        Properties = members = null;

	        // Normalize the iteration algorithm.
	        if (!size) {
	          // A list of non-enumerable properties inherited from `Object.prototype`.
	          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
	          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
	          // properties.
	          forEach = function (object, callback) {
	            var isFunction = getClass.call(object) == functionClass, property, length;
	            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
	            for (property in object) {
	              // Gecko <= 1.0 enumerates the `prototype` property of functions under
	              // certain conditions; IE does not.
	              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
	                callback(property);
	              }
	            }
	            // Manually invoke the callback for each non-enumerable property.
	            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
	          };
	        } else if (size == 2) {
	          // Safari <= 2.0.4 enumerates shadowed properties twice.
	          forEach = function (object, callback) {
	            // Create a set of iterated properties.
	            var members = {}, isFunction = getClass.call(object) == functionClass, property;
	            for (property in object) {
	              // Store each property name to prevent double enumeration. The
	              // `prototype` property of functions is not enumerated due to cross-
	              // environment inconsistencies.
	              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
	                callback(property);
	              }
	            }
	          };
	        } else {
	          // No bugs detected; use the standard `for...in` algorithm.
	          forEach = function (object, callback) {
	            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
	            for (property in object) {
	              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
	                callback(property);
	              }
	            }
	            // Manually invoke the callback for the `constructor` property due to
	            // cross-environment inconsistencies.
	            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
	              callback(property);
	            }
	          };
	        }
	        return forEach(object, callback);
	      };

	      // Public: Serializes a JavaScript `value` as a JSON string. The optional
	      // `filter` argument may specify either a function that alters how object and
	      // array members are serialized, or an array of strings and numbers that
	      // indicates which properties should be serialized. The optional `width`
	      // argument may be either a string or number that specifies the indentation
	      // level of the output.
	      if (!has("json-stringify")) {
	        // Internal: A map of control characters and their escaped equivalents.
	        var Escapes = {
	          92: "\\\\",
	          34: '\\"',
	          8: "\\b",
	          12: "\\f",
	          10: "\\n",
	          13: "\\r",
	          9: "\\t"
	        };

	        // Internal: Converts `value` into a zero-padded string such that its
	        // length is at least equal to `width`. The `width` must be <= 6.
	        var leadingZeroes = "000000";
	        var toPaddedString = function (width, value) {
	          // The `|| 0` expression is necessary to work around a bug in
	          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
	          return (leadingZeroes + (value || 0)).slice(-width);
	        };

	        // Internal: Double-quotes a string `value`, replacing all ASCII control
	        // characters (characters with code unit values between 0 and 31) with
	        // their escaped equivalents. This is an implementation of the
	        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
	        var unicodePrefix = "\\u00";
	        var quote = function (value) {
	          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
	          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
	          for (; index < length; index++) {
	            var charCode = value.charCodeAt(index);
	            // If the character is a control character, append its Unicode or
	            // shorthand escape sequence; otherwise, append the character as-is.
	            switch (charCode) {
	              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
	                result += Escapes[charCode];
	                break;
	              default:
	                if (charCode < 32) {
	                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
	                  break;
	                }
	                result += useCharIndex ? symbols[index] : value.charAt(index);
	            }
	          }
	          return result + '"';
	        };

	        // Internal: Recursively serializes an object. Implements the
	        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
	        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
	          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
	          try {
	            // Necessary for host object support.
	            value = object[property];
	          } catch (exception) {}
	          if (typeof value == "object" && value) {
	            className = getClass.call(value);
	            if (className == dateClass && !isProperty.call(value, "toJSON")) {
	              if (value > -1 / 0 && value < 1 / 0) {
	                // Dates are serialized according to the `Date#toJSON` method
	                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
	                // for the ISO 8601 date time string format.
	                if (getDay) {
	                  // Manually compute the year, month, date, hours, minutes,
	                  // seconds, and milliseconds if the `getUTC*` methods are
	                  // buggy. Adapted from @Yaffle's `date-shim` project.
	                  date = floor(value / 864e5);
	                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
	                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
	                  date = 1 + date - getDay(year, month);
	                  // The `time` value specifies the time within the day (see ES
	                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
	                  // to compute `A modulo B`, as the `%` operator does not
	                  // correspond to the `modulo` operation for negative numbers.
	                  time = (value % 864e5 + 864e5) % 864e5;
	                  // The hours, minutes, seconds, and milliseconds are obtained by
	                  // decomposing the time within the day. See section 15.9.1.10.
	                  hours = floor(time / 36e5) % 24;
	                  minutes = floor(time / 6e4) % 60;
	                  seconds = floor(time / 1e3) % 60;
	                  milliseconds = time % 1e3;
	                } else {
	                  year = value.getUTCFullYear();
	                  month = value.getUTCMonth();
	                  date = value.getUTCDate();
	                  hours = value.getUTCHours();
	                  minutes = value.getUTCMinutes();
	                  seconds = value.getUTCSeconds();
	                  milliseconds = value.getUTCMilliseconds();
	                }
	                // Serialize extended years correctly.
	                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
	                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
	                  // Months, dates, hours, minutes, and seconds should have two
	                  // digits; milliseconds should have three.
	                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
	                  // Milliseconds are optional in ES 5.0, but required in 5.1.
	                  "." + toPaddedString(3, milliseconds) + "Z";
	              } else {
	                value = null;
	              }
	            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
	              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
	              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
	              // ignores all `toJSON` methods on these objects unless they are
	              // defined directly on an instance.
	              value = value.toJSON(property);
	            }
	          }
	          if (callback) {
	            // If a replacement function was provided, call it to obtain the value
	            // for serialization.
	            value = callback.call(object, property, value);
	          }
	          if (value === null) {
	            return "null";
	          }
	          className = getClass.call(value);
	          if (className == booleanClass) {
	            // Booleans are represented literally.
	            return "" + value;
	          } else if (className == numberClass) {
	            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
	            // `"null"`.
	            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
	          } else if (className == stringClass) {
	            // Strings are double-quoted and escaped.
	            return quote("" + value);
	          }
	          // Recursively serialize objects and arrays.
	          if (typeof value == "object") {
	            // Check for cyclic structures. This is a linear search; performance
	            // is inversely proportional to the number of unique nested objects.
	            for (length = stack.length; length--;) {
	              if (stack[length] === value) {
	                // Cyclic structures cannot be serialized by `JSON.stringify`.
	                throw TypeError();
	              }
	            }
	            // Add the object to the stack of traversed objects.
	            stack.push(value);
	            results = [];
	            // Save the current indentation level and indent one additional level.
	            prefix = indentation;
	            indentation += whitespace;
	            if (className == arrayClass) {
	              // Recursively serialize array elements.
	              for (index = 0, length = value.length; index < length; index++) {
	                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
	                results.push(element === undef ? "null" : element);
	              }
	              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
	            } else {
	              // Recursively serialize object members. Members are selected from
	              // either a user-specified list of property names, or the object
	              // itself.
	              forEach(properties || value, function (property) {
	                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
	                if (element !== undef) {
	                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
	                  // is not the empty string, let `member` {quote(property) + ":"}
	                  // be the concatenation of `member` and the `space` character."
	                  // The "`space` character" refers to the literal space
	                  // character, not the `space` {width} argument provided to
	                  // `JSON.stringify`.
	                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
	                }
	              });
	              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
	            }
	            // Remove the object from the traversed object stack.
	            stack.pop();
	            return result;
	          }
	        };

	        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
	        exports.stringify = function (source, filter, width) {
	          var whitespace, callback, properties, className;
	          if (objectTypes[typeof filter] && filter) {
	            if ((className = getClass.call(filter)) == functionClass) {
	              callback = filter;
	            } else if (className == arrayClass) {
	              // Convert the property names array into a makeshift set.
	              properties = {};
	              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
	            }
	          }
	          if (width) {
	            if ((className = getClass.call(width)) == numberClass) {
	              // Convert the `width` to an integer and create a string containing
	              // `width` number of space characters.
	              if ((width -= width % 1) > 0) {
	                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
	              }
	            } else if (className == stringClass) {
	              whitespace = width.length <= 10 ? width : width.slice(0, 10);
	            }
	          }
	          // Opera <= 7.54u2 discards the values associated with empty string keys
	          // (`""`) only if they are used directly within an object member list
	          // (e.g., `!("" in { "": 1})`).
	          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
	        };
	      }

	      // Public: Parses a JSON source string.
	      if (!has("json-parse")) {
	        var fromCharCode = String.fromCharCode;

	        // Internal: A map of escaped control characters and their unescaped
	        // equivalents.
	        var Unescapes = {
	          92: "\\",
	          34: '"',
	          47: "/",
	          98: "\b",
	          116: "\t",
	          110: "\n",
	          102: "\f",
	          114: "\r"
	        };

	        // Internal: Stores the parser state.
	        var Index, Source;

	        // Internal: Resets the parser state and throws a `SyntaxError`.
	        var abort = function () {
	          Index = Source = null;
	          throw SyntaxError();
	        };

	        // Internal: Returns the next token, or `"$"` if the parser has reached
	        // the end of the source string. A token may be a string, number, `null`
	        // literal, or Boolean literal.
	        var lex = function () {
	          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
	          while (Index < length) {
	            charCode = source.charCodeAt(Index);
	            switch (charCode) {
	              case 9: case 10: case 13: case 32:
	                // Skip whitespace tokens, including tabs, carriage returns, line
	                // feeds, and space characters.
	                Index++;
	                break;
	              case 123: case 125: case 91: case 93: case 58: case 44:
	                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
	                // the current position.
	                value = charIndexBuggy ? source.charAt(Index) : source[Index];
	                Index++;
	                return value;
	              case 34:
	                // `"` delimits a JSON string; advance to the next character and
	                // begin parsing the string. String tokens are prefixed with the
	                // sentinel `@` character to distinguish them from punctuators and
	                // end-of-string tokens.
	                for (value = "@", Index++; Index < length;) {
	                  charCode = source.charCodeAt(Index);
	                  if (charCode < 32) {
	                    // Unescaped ASCII control characters (those with a code unit
	                    // less than the space character) are not permitted.
	                    abort();
	                  } else if (charCode == 92) {
	                    // A reverse solidus (`\`) marks the beginning of an escaped
	                    // control character (including `"`, `\`, and `/`) or Unicode
	                    // escape sequence.
	                    charCode = source.charCodeAt(++Index);
	                    switch (charCode) {
	                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
	                        // Revive escaped control characters.
	                        value += Unescapes[charCode];
	                        Index++;
	                        break;
	                      case 117:
	                        // `\u` marks the beginning of a Unicode escape sequence.
	                        // Advance to the first character and validate the
	                        // four-digit code point.
	                        begin = ++Index;
	                        for (position = Index + 4; Index < position; Index++) {
	                          charCode = source.charCodeAt(Index);
	                          // A valid sequence comprises four hexdigits (case-
	                          // insensitive) that form a single hexadecimal value.
	                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
	                            // Invalid Unicode escape sequence.
	                            abort();
	                          }
	                        }
	                        // Revive the escaped character.
	                        value += fromCharCode("0x" + source.slice(begin, Index));
	                        break;
	                      default:
	                        // Invalid escape sequence.
	                        abort();
	                    }
	                  } else {
	                    if (charCode == 34) {
	                      // An unescaped double-quote character marks the end of the
	                      // string.
	                      break;
	                    }
	                    charCode = source.charCodeAt(Index);
	                    begin = Index;
	                    // Optimize for the common case where a string is valid.
	                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
	                      charCode = source.charCodeAt(++Index);
	                    }
	                    // Append the string as-is.
	                    value += source.slice(begin, Index);
	                  }
	                }
	                if (source.charCodeAt(Index) == 34) {
	                  // Advance to the next character and return the revived string.
	                  Index++;
	                  return value;
	                }
	                // Unterminated string.
	                abort();
	              default:
	                // Parse numbers and literals.
	                begin = Index;
	                // Advance past the negative sign, if one is specified.
	                if (charCode == 45) {
	                  isSigned = true;
	                  charCode = source.charCodeAt(++Index);
	                }
	                // Parse an integer or floating-point value.
	                if (charCode >= 48 && charCode <= 57) {
	                  // Leading zeroes are interpreted as octal literals.
	                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
	                    // Illegal octal literal.
	                    abort();
	                  }
	                  isSigned = false;
	                  // Parse the integer component.
	                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
	                  // Floats cannot contain a leading decimal point; however, this
	                  // case is already accounted for by the parser.
	                  if (source.charCodeAt(Index) == 46) {
	                    position = ++Index;
	                    // Parse the decimal component.
	                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
	                    if (position == Index) {
	                      // Illegal trailing decimal.
	                      abort();
	                    }
	                    Index = position;
	                  }
	                  // Parse exponents. The `e` denoting the exponent is
	                  // case-insensitive.
	                  charCode = source.charCodeAt(Index);
	                  if (charCode == 101 || charCode == 69) {
	                    charCode = source.charCodeAt(++Index);
	                    // Skip past the sign following the exponent, if one is
	                    // specified.
	                    if (charCode == 43 || charCode == 45) {
	                      Index++;
	                    }
	                    // Parse the exponential component.
	                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
	                    if (position == Index) {
	                      // Illegal empty exponent.
	                      abort();
	                    }
	                    Index = position;
	                  }
	                  // Coerce the parsed value to a JavaScript number.
	                  return +source.slice(begin, Index);
	                }
	                // A negative sign may only precede numbers.
	                if (isSigned) {
	                  abort();
	                }
	                // `true`, `false`, and `null` literals.
	                if (source.slice(Index, Index + 4) == "true") {
	                  Index += 4;
	                  return true;
	                } else if (source.slice(Index, Index + 5) == "false") {
	                  Index += 5;
	                  return false;
	                } else if (source.slice(Index, Index + 4) == "null") {
	                  Index += 4;
	                  return null;
	                }
	                // Unrecognized token.
	                abort();
	            }
	          }
	          // Return the sentinel `$` character if the parser has reached the end
	          // of the source string.
	          return "$";
	        };

	        // Internal: Parses a JSON `value` token.
	        var get = function (value) {
	          var results, hasMembers;
	          if (value == "$") {
	            // Unexpected end of input.
	            abort();
	          }
	          if (typeof value == "string") {
	            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
	              // Remove the sentinel `@` character.
	              return value.slice(1);
	            }
	            // Parse object and array literals.
	            if (value == "[") {
	              // Parses a JSON array, returning a new JavaScript array.
	              results = [];
	              for (;; hasMembers || (hasMembers = true)) {
	                value = lex();
	                // A closing square bracket marks the end of the array literal.
	                if (value == "]") {
	                  break;
	                }
	                // If the array literal contains elements, the current token
	                // should be a comma separating the previous element from the
	                // next.
	                if (hasMembers) {
	                  if (value == ",") {
	                    value = lex();
	                    if (value == "]") {
	                      // Unexpected trailing `,` in array literal.
	                      abort();
	                    }
	                  } else {
	                    // A `,` must separate each array element.
	                    abort();
	                  }
	                }
	                // Elisions and leading commas are not permitted.
	                if (value == ",") {
	                  abort();
	                }
	                results.push(get(value));
	              }
	              return results;
	            } else if (value == "{") {
	              // Parses a JSON object, returning a new JavaScript object.
	              results = {};
	              for (;; hasMembers || (hasMembers = true)) {
	                value = lex();
	                // A closing curly brace marks the end of the object literal.
	                if (value == "}") {
	                  break;
	                }
	                // If the object literal contains members, the current token
	                // should be a comma separator.
	                if (hasMembers) {
	                  if (value == ",") {
	                    value = lex();
	                    if (value == "}") {
	                      // Unexpected trailing `,` in object literal.
	                      abort();
	                    }
	                  } else {
	                    // A `,` must separate each object member.
	                    abort();
	                  }
	                }
	                // Leading commas are not permitted, object property names must be
	                // double-quoted strings, and a `:` must separate each property
	                // name and value.
	                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
	                  abort();
	                }
	                results[value.slice(1)] = get(lex());
	              }
	              return results;
	            }
	            // Unexpected token encountered.
	            abort();
	          }
	          return value;
	        };

	        // Internal: Updates a traversed object member.
	        var update = function (source, property, callback) {
	          var element = walk(source, property, callback);
	          if (element === undef) {
	            delete source[property];
	          } else {
	            source[property] = element;
	          }
	        };

	        // Internal: Recursively traverses a parsed JSON object, invoking the
	        // `callback` function for each value. This is an implementation of the
	        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
	        var walk = function (source, property, callback) {
	          var value = source[property], length;
	          if (typeof value == "object" && value) {
	            // `forEach` can't be used to traverse an array in Opera <= 8.54
	            // because its `Object#hasOwnProperty` implementation returns `false`
	            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
	            if (getClass.call(value) == arrayClass) {
	              for (length = value.length; length--;) {
	                update(value, length, callback);
	              }
	            } else {
	              forEach(value, function (property) {
	                update(value, property, callback);
	              });
	            }
	          }
	          return callback.call(source, property, value);
	        };

	        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
	        exports.parse = function (source, callback) {
	          var result, value;
	          Index = 0;
	          Source = "" + source;
	          result = get(lex());
	          // If a JSON string contains multiple tokens, it is invalid.
	          if (lex() != "$") {
	            abort();
	          }
	          // Reset the parser state.
	          Index = Source = null;
	          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
	        };
	      }
	    }

	    exports["runInContext"] = runInContext;
	    return exports;
	  }

	  if (freeExports && !isLoader) {
	    // Export for CommonJS environments.
	    runInContext(root, freeExports);
	  } else {
	    // Export for web browsers and JavaScript engines.
	    var nativeJSON = root.JSON,
	        previousJSON = root["JSON3"],
	        isRestored = false;

	    var JSON3 = runInContext(root, (root["JSON3"] = {
	      // Public: Restores the original value of the global `JSON` object and
	      // returns a reference to the `JSON3` object.
	      "noConflict": function () {
	        if (!isRestored) {
	          isRestored = true;
	          root.JSON = nativeJSON;
	          root["JSON3"] = previousJSON;
	          nativeJSON = previousJSON = null;
	        }
	        return JSON3;
	      }
	    }));

	    root.JSON = {
	      "parse": JSON3.parse,
	      "stringify": JSON3.stringify
	    };
	  }

	  // Export for asynchronous module loaders.
	  if (isLoader) {
	    define(function () {
	      return JSON3;
	    });
	  }
	}).call(this);

	}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
	},{}],51:[function(_dereq_,module,exports){
	module.exports = toArray

	function toArray(list, index) {
	    var array = []

	    index = index || 0

	    for (var i = index || 0; i < list.length; i++) {
	        array[i - index] = list[i]
	    }

	    return array
	}

	},{}]},{},[31])(31)
	});


/***/ }
/******/ ]);