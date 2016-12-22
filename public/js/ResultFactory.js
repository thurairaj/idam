app.factory('ResultFactory', function($http, $location, $moment){
	var itin = {
		days : [],
		meta : {},
		search : {}
	};

	var search = {}

	var setStartTime = function(sDI, sPI){
		var day, place, prev;
		//if sDI is given you only adjuct start time for that particular date
		daysLength = !!sDI ? sDI + 1 : itin.days.length;
		sDI = !!sDI ? sDI : 0;
		sPI = !!sPI ? sPI : 0;

		for(var dI = sDI; dI < daysLength; dI++){
			day = itin.days[dI];
			day.places[0].starttime = $moment(itin.meta.starttime, 'h :mm A');
			day.places[0].starttimeText = day.places[0].starttime.format('h :mm A');

			for(var pI = sPI+1, prevI = sPI; pI < day.places.length; pI++, prevI++){
				prev = day.places[prevI];
				day.places[pI].starttime = prev.starttime.clone().add(prev.traveltime + prev.duration, 'm');
				day.places[pI].starttimeText = day.places[pI].starttime.format('h :mm A');
			}
		}
	}

	return {
		setResult: function(r){
			this.result = r
		},
		getResult: function(){
			return this.result
		},
		searchItin: function(payload, next){
			search = payload;
			search.status = "OPEN";
			$http({
				method: "POST",
				url: "/search",
				data: payload,
				headers : {'Content-Type': 'application/json'} 
			}).success(function(response){
				search.status = "SUCCESS";
				itin.days = response.days;
				itin.meta = {name : response.name, coordinates : response.coordinates, starttime : response.starttime};
				setStartTime();
				if(next) $location.url(next);
			})
		},
		searchSingle: function(payload, next){
			payload.origin = itin.days[payload.dI].places[payload.pI]._id;
			payload.dest = itin.days[payload.dI].places[payload.pI+1]._id;

			$http({
				method: "POST",
				url: "/searchSingle",
				data: payload,
				headers : {'Content-Type': 'application/json'} 
			}).success(function(response){
				search.status = "SUCCESS";
				itin.days[payload.dI].places[payload.pI].routes = response.routes;
				itin.days[payload.dI].places[payload.pI].traveltime = parseInt(response.routes[0].legs[0].duration.value/60);
				itin.days[payload.dI].places[payload.pI].mode = payload.mode;
				setStartTime(payload.dI, payload.pI);
				if(next) $location.url(next);
			})
		},
		getItin: function(){
			return itin.days
		},
		getItinDays: function(){
			return itin.days.length;
		},
		getItinMetaData: function(){
			return itin.meta;
		},

		setPlaceShowMore: function(dayIndex, placeIndex){
			if(!!itin.days[dayIndex] && !!itin.days[dayIndex].places[placeIndex]){
				itin.days[dayIndex].places[placeIndex].showmore = !itin.days[dayIndex].places[placeIndex].showmore;
			}
		},
		getPlaceShowMore: function(dayIndex, placeIndex){
			if(!!itin.days[dayIndex] && !!itin.days[dayIndex].places[placeIndex]) return itin.days[dayIndex].places[placeIndex].showmore;
			else return null;	
		}
	}
})