/**
 *
 * @author Anthony Matarazzo <email@anthonymatarazzo.com>
 */

'use strict';


// local modules
var AbstractViewableService = require('./AbstractViewableService');


/**
 * AbstractController provides common functionality that controllers can take advantage of
 * NOTE: Controllers must have a scope
 * @constructor
 */
function AbstractController() {
	// controllers need the same foundation as viewable services
	AbstractViewableService.apply(this, arguments);

	// all controllers should have a scope
	// if the scope is injected, initialize the controller
	if (this.service('$scope')) {
		this.init();
	}
}

// extends AbstractViewableService
angular.inherits(AbstractController, AbstractViewableService, {

	/**
	 * The controller statement as defined using 'controller as' syntax
	 * @private
	 * @type {string}
	 */
	_controllerStatement: '',

	/**
	 * The controller name as defined in the controller statement using 'controller as' syntax
	 * @private
	 * @type {string|null}
	 */
	_controllerName: null,

	/**
	 * This controller name
	 * @type {string|null}
	 */
	name: null,

	/**
	 * Data to resolve before the controller
	 * @type {Object|null}
	 */
	resolve: null,

	/**
	 * Initialize this view
	 * @protected
	 * @return {void}
	 */
	init: function() {
		// emit the event stating that this controller has been initialized
		this.service('$scope').$emit('ctrl:init', [this.name || this.constructor.name, this]);
	},

	/**
	 * {@inheritdoc}
	 */
	initScope: function(scope) {
		// calling parent method for scalability
		scope = AbstractViewableService.prototype.getViewableScope.call(this, scope);

		// pull out the controller statement from the scope and assign it to our controller instance
		this._controllerStatement = scope._controllerStatement || '';

		// call and return value from parent
		return AbstractViewableService.prototype.initScope.call(this, scope);
	},

	/**
	 * Get the controller name as defined in the controller statement using 'controller as' syntax
	 * @protected
	 * @return {string|null}
	 */
	getControllerName: function() {
		if (!this._controllerName) {
			var idx = this._controllerStatement.toLowerCase().indexOf(' as ');
			if (idx !== -1){
				this._controllerName = this._controllerStatement.substr(idx + 4);
			}
		}
		return this._controllerName;
	},

	/**
	 * {@inheritdoc}
	 */
	getViewableScope: function(scope) {
		var name;

		// get the viewable scope from parent
		scope = AbstractViewableService.prototype.getViewableScope.apply(this, arguments);

		if (!scope) {
			return null;
		}

		// NOTE: we are doing this so that only exposed variables are added to the scope and not the entire controller!
		name = this.getControllerName();
		if (name) {
			scope = scope[name] = {};
		}

		// return our [new] scope
		return scope;
	}
});



module.exports = AbstractController;