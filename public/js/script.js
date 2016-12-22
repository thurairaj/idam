var app = angular.module('idam', ['uiGmapgoogle-maps', 'ui.bootstrap', 'ngCookies']);

app.config(function(uiGmapGoogleMapApiProvider) {
	uiGmapGoogleMapApiProvider.configure({
		key: 'AIzaSyCFE-WSovc86ahZHTZEdQUNIheF0JwW244',
		v: '3.20', //defaults to latest 3.X anyhow
		libraries: 'places,weather,geometry,visualization'
	});
})

app.controller('mainCtrl', ['$scope', '$http', 'uiGmapGoogleMapApi', '$cookies', function($scope, $http, uiGmapGoogleMapApi, $cookies){
	$scope.inputs = {
		address : [],
		interest : "",
		latlons : []
	}

    $scope.intro = !$cookies.get('intro');
    $cookies.put('intro',true);

	$scope.map = { 
		center: { latitude: 43.761539, longitude: -79.411079 }, 
		zoom: 11,
		control : {},
		options : {
			mapTypeControl : false
		},
		markers : []
	};


	$scope.outputs = {
		searchPlaces : [],
		placeMarkers : [],
		curCentroid : {},
		curCentMarker : null
	}

	$scope.load = {
		places : false
	}

	$scope.isClosed = {
		search : false,
		result : true
	}

	$scope.errorMessage = {
		general : "",
		address : {}
	};

	$scope.mysanta = function(){
		$http({
			method: "POST",
			url: "/getMySecretSanta",
			headers : {'Content-Type': 'application/json'} 
		}).success(function(response){
			if(response.status == "ERROR"){
				$scope.errorMessage = response.message;
			}else{
				$scope.secretsanta = response.data;
				$scope.open = true;
			}
		})
	}

	$scope.formatRating = function(rating){
		return parseInt(rating).toFixed(1).toString();
	}

	$scope.zoomToPlace = function(place){
		var map = $scope.map.control.getGMap();
		map.panTo(place.geometry.location);
		map.setZoom(16)
	}

	$scope.searchMidPoint = function(){
		//TODO : clean latlons
		//TODO : send ajax request for the places without latlons
		$scope.load.places = true;
		var address;
		for(var i=0; i < $scope.inputs.address.length; i++){
			address = $scope.inputs.address[i];
			if(address != "" && !$scope.inputs.latlons[i]){
				$scope.errorMessage.address[i] = "Please choose one of the prompted address"
				return;
			}
		}

		var cleanLatLons = $scope.inputs.latlons.filter(function(value){
			return !!value && !!value.lat && !!value.lon;
		})
		//check for at least a place
		if(cleanLatLons.length < 1){
			$scope.errorMessage.general  = "Please give at least two locations";
			return false;
		}
		//check for category
		if($scope.inputs.interest == ""){
			$scope.errorMessage.category  = "Please choose a category";
			return false;
		}

		//check are done : more checks are suppose to be perform before here
		var centroid = get_centroid(cleanLatLons);
		$scope.outputs.curCentroid = centroid;
		startGetPlace(centroid);
	}

	$scope.removeElement = function(key){
		key = parseInt(key, 10);
		var map = $scope.map.control.getGMap()
		var bounds = new google.maps.LatLngBounds();
		var marker;

		$scope.map.markers.map(function(x){
		 	if(!!x){
				x.setMap(null);
		 	}
		});

		$scope.map.markers.splice(key, 1);
		$scope.inputs.address.splice(key, 1);
		$scope.inputs.latlons.splice(key, 1);

		 $scope.map.markers.map(function(x, index){
		 	if(!!x){
		 		x.setLabel((index+1).toString());
				x.setMap(map);
		 		bounds.extend(x.getPosition());
		 	}
		});

		if ($scope.map.markers.length > 1) map.fitBounds(bounds);
	}

	$scope.categoryCheck = function(){
		if ($scope.inputs.interest != ""){
			$scope.errorMessage.category = null;
		}
		return
	}

	$scope.moreInfo = function(key){
		$scope.outputs.searchPlaces[key].moreInfo.requesting = true;

		var callback = function(result,status){
			result.formatted_hours = !!result.opening_hours && !!result.opening_hours.weekday_text ? result.opening_hours.weekday_text.map(
				function(x){
					var index = x.indexOf(":"); var day = x.substring(0,index); var time = x.substring(index+1);
					return {day : day, time : time}
				}
			) : [];
			$scope.outputs.searchPlaces[key].moreInfo.details = result;
			$scope.outputs.searchPlaces[key].moreInfo.open = true;
			$scope.outputs.searchPlaces[key].moreInfo.requesting = false;
			$scope.$apply();
		}

		if(!!$scope.outputs.searchPlaces[key] && $scope.outputs.searchPlaces[key].place_id){

			if(!!$scope.outputs.searchPlaces[key].moreInfo.details){
				$scope.outputs.searchPlaces[key].moreInfo.open = !$scope.outputs.searchPlaces[key].moreInfo.open;
				$scope.outputs.searchPlaces[key].moreInfo.requesting = false;
				return
			}
			var request = {
				placeId : $scope.outputs.searchPlaces[key].place_id
			}

			service = new google.maps.places.PlacesService($scope.map.control.getGMap());
			service.getDetails(request, callback);
		}
	}

	//TODO : onblur address check latlons is entered or not
	//TODO : remove address

	var get_centroid = function(latlons){
		var avgX = sumX = avgY = sumY = avgZ = sumZ = 0;
		var latlon, lat, lon;
		for(var i=0; i < latlons.length; i++){
			latlon = latlons[i];
			lat = latlon.lat.toRadians();
			lon = latlon.lon.toRadians();

			sumX += Math.cos(lat) * Math.cos(lon);
			sumY += Math.cos(lat) * Math.sin(lon);
			sumZ += Math.sin(lat)
		}

		avgX = sumX / latlons.length;
		avgY = sumY / latlons.length;
		avgZ = sumZ / latlons.length;
		var centerLon = Math.atan2(avgY, avgX);
		var centerLat = Math.atan2(avgZ, Math.sqrt(Math.pow(avgX,2) + Math.pow(avgY,2)));
		
		if ($scope.outputs.curCentMarker){
			$scope.outputs.curCentMarker.setMap(null);
		}

		$scope.outputs.curCentMarker = new google.maps.Marker({
		    position: {
				lat : centerLat.toDegree(),
				lng : centerLon.toDegree()
			},
		    map: $scope.map.control.getGMap(),
		    title: 'Center Point',
		    draggable : true,
		});

		$scope.outputs.curCentMarker.addListener('dragend', function() {
			$scope.outputs.curCentroid = {lat : $scope.outputs.curCentMarker.getPosition().lat(), lng : $scope.outputs.curCentMarker.getPosition().lng()}
		    startGetPlace($scope.outputs.curCentroid);
		});

		return {
			lat : centerLat.toDegree(),
			lng : centerLon.toDegree()
		}
	}

	var get_distance = function(pointOne, pointTwo){
		var R = 6371000;
		var latPointOne  = pointOne.lat.toRadians();
		var latPointTwo = pointTwo.lat.toRadians();

		var latDiff = (pointTwo.lat - pointOne.lat).toRadians();
		var lonDiff = (pointTwo.lng - pointOne.lng).toRadians();

		var a = Math.sin(latDiff/2) * Math.sin(latDiff/2) +
					Math.cos(latPointTwo) * Math.cos(latPointOne) *
					Math.sin(lonDiff/2) * Math.sin(lonDiff/2)
		var c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
		var d = R * c;
		return d
	}

	var placeAPIResponse = function(result, status){
		var radiusLimit = 2000;
		$scope.outputs.searchPlaces = result.map(function(x){
			x.distanceFromCenter = get_distance(x.geometry.location.toJSON(), $scope.outputs.curCentroid);
			x.moreInfo = {
				open : false,
				requesting : false
			}
			return x
		});

		if(result.length > 0){
			radiusLimit *= 2;
			while($scope.outputs.searchPlaces.length == 0){
				$scope.outputs.searchPlaces = result.map(function(x){ return x.distanceFromCenter < radiusLimit});
			}
		}

		$scope.isClosed.result = false;
		$scope.isClosed.search = true;
		$scope.load.places = false;
		applyPlaceMarker();
		$scope.$apply();
		console.log(result, status);
	}

	var applyPlaceMarker = function(){
		var limit = Math.min($scope.outputs.searchPlaces.length, 10);
		var place;
		var map = $scope.map.control.getGMap();
		var bound = new google.maps.LatLngBounds();
		
		$scope.outputs.placeMarkers.map(function(x){if (!!x) x.setMap(null)});
		for(var i = 0; i < limit; i++){
			place = $scope.outputs.searchPlaces[i];
			$scope.outputs.placeMarkers[i] = new google.maps.Marker({
				map: map,
				icon: new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/"+(i+1).toString()+"/0093ff/000000/05497b"),
				title: place.name,
				position: place.geometry.location
			});
			bound.extend(place.geometry.location)
		}

		for (var key = 0; key < $scope.map.markers.length; key++) {
			if(!!$scope.map.markers[key]){
				bound.extend($scope.map.markers[key].getPosition());
			}
		}


		map.fitBounds(bound);
	}

	var startGetPlace = function(centroid){
		var request = {
			location: new google.maps.LatLng(centroid.lat,centroid.lng),
			rankBy: google.maps.places.RankBy.DISTANCE,
			keyword: $scope.inputs.interest
		};
		var service = new google.maps.places.PlacesService($scope.map.control.getGMap());
		service.nearbySearch(request, placeAPIResponse);
	}

	uiGmapGoogleMapApi.then(function(maps) {
		$scope.$watchCollection('inputs.address', function(list){
			//filter name with empty strings
			if(list.length < 10 && !list.filter(function(member){ return !member}).length){
				$scope.inputs.address.push('');
			}
		})
	});
}])

app.directive('addressSearchBox', function(){
	return{
		restrict : 'A',
		transclude : true, 
		link: function(scope, element, attrs, controllers) {
			var sb = new google.maps.places.SearchBox(element[0]);
			var map = scope.$parent.map.control.getGMap();
			

			map.addListener('bounds_changed', function() {
			  sb.setBounds(map.getBounds());
			});

			sb.addListener('places_changed', function() {
				var key = scope.key
				var places = sb.getPlaces();
				var customLatLon = {
					lat : "",
					lon : ""
				}

				if(places.length < 1){
					return;
				}

				if(scope.$parent.map.markers[key]){
					scope.$parent.map.markers[key].setMap(null);
				}
				
				var place = places[0];
				var bounds = new google.maps.LatLngBounds();
				var icon = {
					url: place.icon,
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(25, 25)
				};

				if (!place.geometry) {
					console.log("Returned place contains no geometry");
					return;
				}

				customLatLon.lat = place.geometry.location.lat()
				customLatLon.lon = place.geometry.location.lng();
				scope.$parent.inputs.latlons[key] = customLatLon; 
				scope.$parent.inputs.address[key] = place.formatted_address
				scope.$parent.errorMessage.address[key] = null;
				scope.$parent.map.markers[key] = new google.maps.Marker({
					map: map,
					label: (key+1).toString(),
					title: place.name,
					position: place.geometry.location
				});

				for (var key in scope.$parent.map.markers) {
					if (scope.$parent.map.markers.hasOwnProperty(key)) {
						bounds.extend(scope.$parent.map.markers[key].getPosition());
					}
				}
				map.fitBounds(bounds);
			})
		}
	}
})


//helper function
if (Number.prototype.toRadians === undefined) {
	Number.prototype.toRadians = function() { return this * Math.PI / 180; };
}

if (Number.prototype.toDegree === undefined) {
	Number.prototype.toDegree = function() { return this *180 /  Math.PI ; };
}