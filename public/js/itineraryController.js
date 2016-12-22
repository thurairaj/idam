app.controller("itineraryController", function($scope, httpService, ResultFactory, $moment){
	$scope.search = function(){
		// json payload for our post
		var jsonPayload = {
			place: $scope.place,
			date: $scope.date,
			days: $scope.days,
			lifestyle: $scope.lifestyle,
			starttime: $scope.starttime
		}

		ResultFactory.searchItin(jsonPayload);
	}
})

app.controller('listCtrl', function($scope, httpService, ResultFactory, $moment){
	$scope.toggleShowMore = ResultFactory.setPlaceShowMore;
	$scope.itin = ResultFactory.getItin;

	$scope.searchSingle = function(dayIndex, placeIndex, mode){
		// json payload for our post
		var jsonPayload = {
			mode: mode,
			dI : dayIndex,
			pI : placeIndex
		}

		ResultFactory.searchSingle(jsonPayload);
	}

	$scope.getHourMinute = function(min){
		var duration = $moment.duration(min, "minutes");
		var hours = duration.hours();
		var minutes = duration.minutes();

		hourStr = hours > 0 ? ( hours + " hour" + ( hours > 1 ? "s " : " ")) : "";
		minuteStr = minutes > 0 ? ( minutes + " minute" + ( minutes > 1 ? "s " : " ")) : "";
		return hourStr + minuteStr;
	}

	$scope.getOperatingHours = function(dayIndex, operatingHours){
		var dayofweek = parseInt($moment($scope.date).format('d')) + dayIndex

		if(!operatingHours[dayofweek].open && !operatingHours[dayofweek].close){
			return 'Closed'
		}else if(!operatingHours[dayofweek].close){
			return '24 Hours'
		}else{
			var open = $moment(operatingHours[dayofweek].open, 'HHmm').format('h:mm A')
			var close = $moment(operatingHours[dayofweek].close, 'HHmm').format('h:mm A')

			return open + '-' + close
		}
	}
})

app.controller("someController", function(uiGmapIsReady, $scope, ResultFactory){
	$scope.cityDetails = ResultFactory.getItinMetaData;
	$scope.itin = ResultFactory.getItin;
	$scope.maps = [];
	$scope.details = "";

    uiGmapIsReady.promise(ResultFactory.getItinDays()).then(function(instances) {
        instances.forEach(function(inst) {
        	console.log("fuck me");
            var map = inst.map;
            var uuid = map.uiGmap_id;
            var mapInstanceNumber = inst.instance; // Starts at 1.
            $scope.maps[mapInstanceNumber-1] = inst.map
            if($scope.maps.length >= ResultFactory.getItinDays()){
            	$scope.details = "ready";
            }
        });
    });
});