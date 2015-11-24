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
	 * Array of methods to expose to the $scope (view)
	 * @protected
	 * @type {string[]|null}
	 */
	expose: null,

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
			exposedName;

		scope = this.getViewableScope(scope);

		// add all of the exposed variable members onto the attached scope
		if (scope && (this.expose instanceof Array)) {
			for (i = 0, len = this.expose.length; i < len; i++) {
				exposedName = this.expose[i].replace(/([\._\-][a-z])/g, function(match) {
					return match.replace(/[\._\-]/,'').toUpperCase();
				});
				if (typeof this[this.expose[i]] === 'function') {
					// expose a function, bind it to this instance though, not the scope
					scope[exposedName] = this[this.expose[i]].bind(this);
				} else if (typeof this[this.expose[i]] !== 'undefined') {
					// expose a member variable, look for the service first
					scope[exposedName] = this.service(this.expose[i]) || this[this.expose[i]];
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
	 * 	TODO : maybe make a new property 'watch[]' and only apply observable on the watched + exposed variables
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