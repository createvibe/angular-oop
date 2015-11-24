/**
 *
 * @author Anthony Matarazzo <email@anthonymatarazzo.com>
 */

'use strict';


// local modules
var AbstractService = require('./AbstractService'),
	applyConstructor = require('../utils/applyConstructor');

/**
 * AbstractFilter provides an abstraction for filters
 *
 * 	NOTE: Angular filters should be a 'pure function'
 *
 * 	This abstract class is here for a common way to bind that function to
 * 	an object scope for access to object members.  The object is only
 * 	instantiated once, unless it's $stateful, in which case it would be
 * 	instantiated every time it gets called.
 *
 * @constructor
 */
function AbstractFilter() {

  if (!(this instanceof AbstractFilter)) {
		return applyConstructor(AbstractFilter, arguments);
  }

	AbstractService.apply(this, arguments);
}

/**
 * Factory method to retrieve this filter with injected service arguments
 * @static
 * @returns {Function}
 */
AbstractFilter.$factory = function(construct) {
	var func = function() {
		var obj = new construct();
		if (obj instanceof AbstractService) {
			obj.injectServices.apply(obj, arguments);
		}
		obj.init();
		// the filter function is bound to the object instance so you can reference 'this'
		return obj.filter.bind(obj);
	};
	func.$inject = construct.$inject;
	return func;
};

// extends AbstractService
angular.inherits(AbstractFilter, AbstractService, {

	/**
	 * Initialize this filter
	 * @returns {void}
	 */
	init: function() {
		// empty placeholder
	},

	/**
	 * The filter function - this is what is actually executed by angular
	 * @param {string|object|*} input
	 * @returns {*}
	 */
	filter: function(input) {
		return input;
	}

});



module.exports = AbstractFilter;