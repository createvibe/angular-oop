/**
 *
 * @author Anthony Matarazzo <email@anthonymatarazzo.com>
 */

'use strict';


// local modules
var AbstractService = require('./AbstractService'),
	AbstractViewableService = require('./AbstractViewableService'),
	applyConstructor = require('../utils/applyConstructor');



/**
 * AbstractDirective provides common functionality that directives can take advantage of
 * @constructor
 */
function AbstractDirective() {

  if (!(this instanceof this)) {
		return applyConstructor(AbstractService, arguments);
  }

	// directives need the same foundation as viewable services
	AbstractViewableService.apply(this, arguments);

	if (this.isolated && !(this.scope instanceof Object)) {
		this.scope = {};
	}

}

/**
 * This directive name
 * @type {string|null}
 */
AbstractDirective.$name = null;

/**
 * Factory method to retrieve this service with injected service arguments
 * @static
 * @returns {Function}
 */
AbstractDirective.$factory = function(construct) {
	var func = function() {
		var obj = new construct;
		if (obj instanceof AbstractService) {
			obj.injectServices.apply(obj, arguments);
		}
		// angular invokes a reference to obj.link in the wrong scope -.-
		if (typeof obj.link === 'function') {
			obj.link = obj.link.bind(obj);
		}
		return obj;
	};
	func.$inject = construct.$inject;
	return func;
};

// extends AbstractViewableService
angular.inherits(AbstractDirective, AbstractViewableService, {
	/**
	 * Restrict this directive to attributes, elements, classes
	 * @type {string}
	 */
	restrict: 'AEC',

	/**
	 * Linked scope variables on the directive (do not confuse it with the $scope service!)
	 * @type {Object|null}
	 */
	scope: null,

	/**
	 * Know if this is an isolated scope (must be set before instantiation - changes are ignored)
	 * @type {boolean}
	 */
	isolated: true,

	/**
	 * Apply logic to the directive when attached to an element (fires after template*)
	 * 	NOTE: if you overload this, you need to either call initScope yourself or make sure you call parent::link
	 * @param {Object} scope The angular scope
	 * @param {Object} elem The element this directive is attached to
	 * @param {Object} attr The directive attribute values
	 * @return {void}
	 */
	link: function(scope, elem, attr) {
		// initialize watched members on the scope for each linked-directive
		this.initScope(scope);
	},

	/**
	 * Parse the attribute value given for this directive
	 * @param {Object} elem
	 * @param {Object} attr
	 * @return {String|Object|Array}
	 */
	parseAttribute: function(elem, attr) {
		try {
			return JSON.parse(attr[this.constructor.$name]);
		} catch (e) {
			return attr[this.constructor.$name];
		}
	}

});



module.exports = AbstractDirective;