/**
 *
 * @author Anthony Matarazzo <email@anthonymatarazzo.com>
 */

'use strict';


// local modules
var AbstractService = require('./AbstractService');


/**
 * AbstractViewableService provides common logic for all viewable services (controllers, directives)
 * @constructor
 */
function AbstractViewableService() {
	AbstractService.apply(this, arguments);
	if (arguments.length !== 0) {

		// traverse super classes and merge expose, watch, etc. onto this instance
		// this also helps to destroy object references across inherited classes on the prototype
		this.traverseSuper();

		// initialize the scope by exposing data and watching for changes from scope data
		// this keeps the scope in sync with the object and keeps two-way binding from breaking
		this.initScope();

	}
}

// extends AbstractService injects $scope
angular.inherits(AbstractViewableService, AbstractService, ['$scope'], {
	/**
	 * Know if this object is already being observed
	 * @protected
	 * @type {boolean}
	 */
	_observing: false,

	/**
	 * Array of methods and properties to expose to the $scope (view)
	 * @protected
	 * @type {string[]|null}
	 */
	expose: null,

	/**
	 * Array of properties to watch on the $scope (view)
	 * 	when changes are made to scope scalar variables, the changes get applied back to the object
	 *
	 * @protected
	 * @type {string[]|null}
	 */
	watch: null,

	/**
	 * Traverse the super classes all the way up the tree and merge expose, watch, etc onto this class
	 * 	Each class should only inject what it needs
	 * 	If a class inherits from another class, it should also inherit that class' injected services
	 * 	This also helps to destroy object references across inherited classes on the prototype
	 *
	 * @protected
	 * @param {Object|undefined} [obj] The object to traverse, if not given 'this' is used
	 * @return {void}
	 */
	traverseSuper: function(obj) {
		if (!obj) {
			obj = this;
		}

		var super_ = obj.constructor.super_;

		// make sure expose is an array, and make sure it doesn't share the reference on its prototype
		if (!(obj.expose instanceof Array)) {
			obj.expose = [];
		} else {
			obj.expose = obj.expose.slice();
		}

		// make sure watch is an array, and make sure it doesn't share the reference on its prototype
		if (!(obj.watch instanceof Array)) {
			obj.watch = [];
		} else {
			obj.watch = obj.watch.slice();
		}

		// traverse all the way up the super hierarchy and merge expose and watch with this instance
		while (super_) {
			if (super_.prototype.expose) {
				obj.expose = obj.expose.concat(super_.prototype.expose);
			}
			if (super_.prototype.watch) {
				obj.watch = obj.watch.concat(super_.prototype.watch);
			}
			super_ = super_.super_;
		}
	},

	/**
	 * {@inheritdoc}
	 */
	addService: function(name, service) {
		if (name === '$scope' && !this.service(name)) {
			AbstractService.prototype.addService.apply(this, arguments);
			this.initScope();
			this.observeExposed();
			return this;
		}
		return AbstractService.prototype.addService.apply(this, arguments);
	},

	/**
	 * Get the controller name as defined in the controller statement using 'controller as' syntax
	 * @protected
	 * @return {string|null}
	 */
	getControllerName: function() {
		return null;
	},

	/**
	 * Get the viewable scope
	 * @protected
	 * @param {Object|undefined} scope Optional force a specific scope for the view
	 * @return {Object|null}
	 */
	getViewableScope: function(scope){
		var name;

		if (!scope) {
			scope = this.service('$scope') || null;
		}

		if (!scope) {
			return null;
		}

		// NOTE: we are doing this so that only exposed variables are added to the scope and not the entire object!
		name = this.getControllerName();
		if (name && name.length !== 0) {
			scope = scope[name] = scope.$new(false, scope.$parent);
		}

		// return our [new] scope
		return scope;
	},

	/**
	 * Initialize the scope for this controller
	 * @protected
	 * @param {Object|undefined} [scope] To ensure a specific scope, you can pass it in
	 * @param {Array|undefined} [expose] Array of exposed members, otherwise this.expose is used
	 * @param {Array|undefined} [watch] Array of members to watch, otherwise this.watch is used
	 * @return {void}
	 */
	initScope: function(scope, expose, watch) {
		var i,
			len,
			varName,
			hash;

		scope = this.getViewableScope(scope);

		if (!scope) {
			return;
		}

		// add all of the exposed variable members onto the attached scope
		if (!expose) {
			expose = this.expose;
		}
		if (scope && expose instanceof Array) {
			hash = {};
			for (i = 0, len = expose.length; i < len; i++) {
				varName = this.getScopeKey(expose[i]);
				if (!hash[varName]) {
					if (typeof this[expose[i]] === 'function') {
						// expose a function, bind it to this instance though, not the scope
						scope[varName] = this[expose[i]].bind(this);
					} else if (typeof this[expose[i]] !== 'undefined') {
						// expose a member variable
						scope[varName] = this[expose[i]];
					} else if (this.service(expose[i])) {
						// expose a service
						scope[varName] = this.service(expose[i]);
					}
					hash[varName] = 1;
				}
			}
		}

		// watch for scope variable changes when applicable
		if (!watch) {
			watch = this.watch;
		}
		if (scope && watch instanceof Array) {
			hash = {};
			for (i = 0, len = watch.length; i < len; i++) {
				if (typeof this[watch[i]] !== 'undefined') {
					varName = this.getFullScopeKey(watch[i]);
					if (!hash[varName]) {
						(function watchScope(self, scope, scopeKey, dataKey) {
							var key = scopeKey;
							var idx = scopeKey.indexOf('.');
							if (idx !== -1) {
								key = scopeKey.substr(idx + 1);
							}
							var onChangeFunc = 'onScopeChange' + key.substr(0, 1).toUpperCase() + key.substr(1);
							scope.$watch(scopeKey, function(newValue, oldValue) {
								self[dataKey] = newValue;
								if (typeof self[onChangeFunc] === 'function') {
									self[onChangeFunc].apply(self, arguments);
								}
							}, true);
						}(this, scope, varName, watch[i]));
						hash[varName] = 1;
					}
				}
			}
		}

		// observe variables attached to the scope
		this.observeExposed(expose);
	},

	/**
	 * The the scope key for a given data key
	 * @param {string} name The name to parse
	 * @return {*}
	 */
	getScopeKey: function getScopeKey(name) {
		return name.replace(/([\._\-][a-z])/g, function (match) {
			return match.replace(/[\._\-]/, '').toUpperCase();
		});
	},

	/**
	 * Get the full scope key, including controllerAs
	 * @param {string} name
	 * @return {*}
	 */
	getFullScopeKey: function getFullScopeKey(name) {
		var prefix = '',
			controllerName = this.getControllerName();

		if (controllerName && controllerName.length !== 0) {
			prefix = controllerName + '.';
		}

		return prefix + this.getScopeKey(name);
	},

	/**
	 * Observe the exposed variables, so that when changes are made, they are reflected in the scope
	 * 	This automatically watches for changes to exposed variables and applies them to the scope
	 * 	This uses the observable pattern, not a function check like angular
	 *
	 * @protected
	 * @param {Array|undefined} [expose] Array of exposed members, otherwise this.expose is used
	 * @return {void}
	 */
	observeExposed: function(expose) {
		var self = this,
			scope = this.service('$scope');

		if (!expose) {
			expose = this.expose;
		}

		if (this._observing || scope === undefined || !(expose instanceof Array)) {
			return;
		}

		if (typeof Object.observe === 'function') {
			Object.observe(this, function(changes) {
				var i,
					len = changes.length;

				for (i = 0; i < len; i++) {
					if (expose.indexOf(changes[i].name) !== -1) {
						if (typeof self[changes[i].name] === 'function') {
							scope[changes[i].name] = self[changes[i].name].bind(self);
						} else {
							scope[changes[i].name] = self[changes[i].name];
						}
					}
				}
			});
		} else {
			expose.forEach(function(key) {

				// change the variable on this object to a different name so we can observe it with getter / setter
				var temp = self[key];
				delete self[key];
				self['_observe_' + key + '__'] = temp;
				temp = null;

				// getter / setter to bind the scope to the variable
				self.defineProperty(self, key, {
					get: function() {
						return self['_observe_' + key + '__'];
					},
					set: function(val) {
						if (typeof val === 'function') {
							val = val.bind(self);
						}
						scope[key] = val;
						self['_observe_' + key + '__'] = val;
					}
				});

			});
		}

		this._observing = true;
	}
});



module.exports = AbstractViewableService;