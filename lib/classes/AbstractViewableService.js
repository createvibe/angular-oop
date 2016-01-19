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
	 * @private
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
	 */
	traverseSuper: function() {
		var super_ = this.constructor.super_;

		// make sure expose is an array, and make sure it doesn't share the reference on its prototype
		if (!(this.expose instanceof Array)) {
			this.expose = [];
		} else {
			this.expose = this.expose.slice();
		}

		// make sure watch is an array, and make sure it doesn't share the reference on its prototype
		if (!(this.watch instanceof Array)) {
			this.watch = [];
		} else {
			this.watch = this.watch.slice();
		}

		// traverse all the way up the super hierarchy and merge expose and watch with this instance
		while (super_) {
			if (super_.prototype.expose) {
				this.expose = this.expose.concat(super_.prototype.expose);
			}
			if (super_.prototype.watch) {
				this.watch = this.watch.concat(super_.prototype.watch);
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
	 * Get the viewable scope
	 * @protected
	 * @param {Object|undefined} scope Optional force a specific scope for the view
	 * @returns {Object|null}
	 */
	getViewableScope: function(scope){
		return scope || this.service('$scope') || null;
	},

	/**
	 * Initialize the scope for this controller
	 * @protected
	 * @param {Object|undefined} scope To ensure a specific scope, you can pass it in
	 * @return {void}
	 */
	initScope: function(scope) {
		var i,
			len,
			varName,
			hash,
			nameReg = /([\._\-][a-z])/g;

		scope = this.getViewableScope(scope);

		// add all of the exposed variable members onto the attached scope
		if (scope) {
			if (this.expose instanceof Array) {
				hash = {};
				for (i = 0, len = this.expose.length; i < len; i++) {
					varName = this.expose[i].replace(nameReg, function(match) {
						return match.replace(/[\._\-]/,'').toUpperCase();
					});
					if (!hash[varName]) {
						if (typeof this[this.expose[i]] === 'function') {
							// expose a function, bind it to this instance though, not the scope
							scope[varName] = this[this.expose[i]].bind(this);
						} else if (typeof this[this.expose[i]] !== 'undefined') {
							// expose a member variable, look for the service first
							scope[varName] = this.service(this.expose[i]) || this[this.expose[i]];
						}
						hash[varName] = 1;
					}
				}
			}
			if (this.watch instanceof Array) {
				hash = {};
				for (i = 0, len = this.watch.length; i < len; i++) {
					if (typeof this[this.watch[i]] !== 'undefined') {
						varName = this.watch[i].replace(nameReg, function(match) {
							return match.replace(/[\._\-]/, '').toUpperCase();
						});
						if (!hash[varName]) {
							(function(self, name, idx) {
								var onChangeFunc = 'onScopeChange' + name.substr(0, 1).toUpperCase() + name.substr(1);
								scope.$watch(name, function(oldValue, newValue) {
									if (oldValue !== newValue) {
										self[self.watch[idx]] = newValue;
										if (typeof self[onChangeFunc] === 'function') {
											self[onChangeFunc](oldValue, newValue);
										}
									}
								});
							})(this, varName, i);
							hash[varName] = 1;
						}
					}
				}
			}
		}

		// observe variables attached to the scope
		this.observeExposed();
	},

	/**
	 * Observe the exposed variables, so that when changes are made, they are reflected in the scope
	 * 	This automatically watches for changes to exposed variables and applies them to the scope
	 * 	This uses the observable pattern, not a function check like angular
	 *
	 * @protected
	 * @returns {void}
	 */
	observeExposed: function() {
		var self = this,
			scope = this.service('$scope');

		if (this._observing || scope === undefined || !(this.expose instanceof Array)) {
			return;
		}

		if (typeof Object.observe === 'function') {
			Object.observe(this, function(changes) {
				var i,
					len = changes.length;

				for (i = 0; i < len; i++) {
					if (self.expose.indexOf(changes[i].name) !== -1) {
						if (typeof self[changes[i].name] === 'function') {
							scope[changes[i].name] = self[changes[i].name].bind(self);
						} else {
							scope[changes[i].name] = self[changes[i].name];
						}
					}
				}
			});
		} else {
			this.expose.forEach(function(key) {

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