/**
 *
 * @author Anthony Matarazzo <email@anthonymatarazzo.com>
 */

'use strict';


/**
 * AbstractService provides common functionality for all services
 * @constructor
 */
function AbstractService() {
	this._services = {};
	if (arguments.length !== 0) {
		this.injectServices.apply(this, arguments);
	}
}


/**
 * Factory method to retrieve this service with injected service arguments
 * @static
 * @returns {Function}
 */
AbstractService.$factory = function(construct) {
	var func = function() {
		var obj = new construct;
		if (obj instanceof AbstractService) {
			obj.injectServices.apply(obj, arguments);
		}
		return obj;
	};
	if (construct.$inject) {
		func.$inject = construct.$inject;
	}
	return func;
};

/**
 * Services injected into this service
 * @type {Object}
 * @protected
 */
AbstractService.prototype._services = {};

/**
 * Inject constructor arguments into this instance, based on
 * 	the static $inject array attached to this class
 *
 * @protected
 * @return {void}
 */
AbstractService.prototype.injectServices = function() {
	var i,
		len;

	if (arguments.length === 0) {
		return;
	}

	for (i = 0, len = this.constructor.$inject.length; i < len; i++) {
		this._services[this.constructor.$inject[i]] = arguments[i];
	}
};

/**
 * Get an injected service by its name
 * @param {string} name
 * @returns {*|undefined}
 */
AbstractService.prototype.service = function(name) {
	if (this._services[name] !== undefined) {
		return this._services[name];
	}
	if (name.charAt(0) !== '$' &&
		this._services['$' + name] !== undefined) {

		return this._services['$' + name];
	}
	if (name.substr(-8) !== '.service' &&
		this._services[name + '.service'] !== undefined) {

		return this._services[name + '.service'];
	}
	return undefined;
};

/**
 * Add a service dependency
 *
 * 	NOTE: this should be avoided, use dependency injection if you can.
 * 	This is here for factories to inject services after instantiation
 *
 * @param {string} name The name of the service
 * @param {*} service The service value
 * @returns {AbstractService}
 */
AbstractService.prototype.addService = function(name, service) {
	if (this._services[name] === undefined) {
		this._services[name] = service;
	}
	return this;
};



module.exports = AbstractService;