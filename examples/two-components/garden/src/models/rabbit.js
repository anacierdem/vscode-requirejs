define(['nature/models/animal'], function (Animal) {
	function Rabbit () {
		Animal.call(this, 'Rabbit');
	}

	Rabbit.prototype = Object.create(Animal.prototype);
	Rabbit.prototype.constructor = Rabbit;

	return Rabbit;
});
