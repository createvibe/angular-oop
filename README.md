# angular-oop
Object Oriented Programming approach in AngularJS

This library exists to help write reusable, more extensible code in AngularJS.

In my observation, AngularJS 1.x doesn't make it very straight forward to write extensible OO code.  It seems to
promote a more procedural approach, keeping things encapsulated in functions and nested functions, which makes it very
hard to reuse things and extend individual components.  This obviously depends on how you work with Angular, so the
purpose of this library to help make this process easier.

AngularJS also promotes the use of controllerAs to get around nested scope issues, but it puts the entire controller
object onto the scope.  There is no way to hide members from the scope and only expose what you want exposed, unless
you declare private, nested, methods inside your controller or viewable service (directive, etc).

Take the following example:

	angular.module('app').controller('MyController', ['$http', function MyController($scope) {

		var vm = this;

		vm.method = method;

		function method() {
			return $http.get('/foo').then(function(data) {
				vm.foo = data;
				notExposed();
				return data;
			});
		}

		function notExposed() {
			console.log('foo is', vm.foo');
		}


	}]);


Now see this using angular-oop:

	var AbstractController = require('angular-oop').AbstractController;

	function MyController() { }

	angular.inherits(MyController, AbstractController, ['$http'], {

		foo: null,

		expose: ['method', 'foo'],

		method: function() {
			return this.service('$http').get('/foo').then(function(data) {
				this.foo = data;
				this.notExposed();
				return data;
			}.bind(this));
		},

		notExposed: function() {
			// this is not exposed to scope
			console.log('foo is', this.foo);
		}

	});

	module.exports = MyController;

Now see how you can extend this controller to take advantage of reusable code, using CommonJS:

	var MyController = require('MyController.js');

	function OtherController() {
		MyController.apply(this, arguments);
	}

	angular.inherits(OtherController, MyController, ['$http'], {

		expose: ['doSomething'],

		doSomething: function() {
			return this.method().then(function(data) {

				return this.notExposedComputeMethod(data);

			}.bind(this));
		},

		notExposedComputeMethod: function(data) {
			// compute data and modify it some how
			data.num *= 5;
			return data;
		}

	});

	module.exports = OtherController;

Attach the controller to angular:

	angular.module('app').controller('OtherController', require('OtherController.js'));

You can install this module using NPM: `npm install angular-oop`

This library is intended to be used with browserify.
