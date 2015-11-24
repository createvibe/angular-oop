/**
 *
 * @author Anthony Matarazzo <email@anthonymatarazzo.com>
 */

'use strict';

/**
 * applyConstructor returns a new instance of the provided constructor with the provided arguments applied.
 * @function
 */
function applyConstructor(constructor, args) {
	if (Object.prototype.toString.call(args) === '[object Arguments]') {
		args = [].slice.call(args);
	} else if (!(args instanceof Array)) {
		args = [];
	}

	return new (Function.bind.apply(constructor, [null].concat(args)))();
}



module.exports = applyConstructor;
