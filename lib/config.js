/**
 *
 * @author Anthony Matarazzo <email@anthonymatarazzo.com>
 */

'use strict';

angular.module('ngOOP')
	.config(['$provide', function($provide) {
		$provide.decorator('$controller', ['$delegate', function($delegate) {
			return function(constructor, locals, later, indent) {
				if (typeof constructor === 'string') {
					locals.$scope._controllerStatement = constructor;
				}
				return $delegate(constructor, locals, later, indent);
			};
		}]);
	}]);