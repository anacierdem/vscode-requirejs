define(['models/animal'], function (Animal) {
	function Fox () {
		Animal.call(this, 'Fox');
	}

	Fox.prototype = Object.create(Animal.prototype);
	Fox.prototype.constructor = Fox;

	return Fox;
});
