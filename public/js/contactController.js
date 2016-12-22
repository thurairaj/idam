angular.module('travora')

.controller("contactController", function($scope, uiGmapGoogleMapApi){
	// coordinates for 222 College St Toronto
	var coordinates = {
		latitude: 43.658786,
		longitude: -79.397525
	}

	$scope.map = {
		center: coordinates,
		zoom: 15
	}

	$scope.options = {
		scrollwheel: false
	}

	$scope.marker = {
		id: 0,
		coords: coordinates
	}
})