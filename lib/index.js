/**
 * Angular OOP Extension Module
 * @author Anthony Matarazzo <email@anthonymatarazzo.com>
 */

'use strict';

// include inheritance module
require('angular-inherits');

// export our classes
module.exports = {
	AbstractService: require('./classes/AbstractService'),
	AbstractViewableService: require('./classes/AbstractViewableService'),
	AbstractDirective: require('./classes/AbstractDirective'),
	AbstractController: require('./classes/AbstractController'),
	AbstractFilter: require('./classes/AbstractFilter')
};

// get our angular instance
if (typeof angular === 'undefined') {
	angular = require('angular');
}

// attach classes onto the angular object
for (var m in module.exports) {
	angular[m] = module.exports[m];
}

// include our module and configuration, etc.
require('./module');
require('./config');