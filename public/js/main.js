app.directive('rightSidebar', function() {
  	return {
  		replace : true, 
  		transclude: false, 
    	templateUrl : "pages/right-side-bar.html"
  	};
})

app.directive('leftSidebar', function() {
  	return { 
  		replace : true, 
  		transclude: false, 
    	templateUrl : "pages/left-side-bar.html"
  	};
})

app.directive('mapPlace', function(){
	return{
		require : '^^uiGmapGoogleMap',
		restrict : 'E',
		scope : {
			place : '=',
			maps : '=',
			index : '=',
			details : '=',
			pindex : '='
		},
		link: function(scope,element, attr, controllers){
			var pI = scope.pindex;
			var map;
			var watch = scope.$watch('details', function(){
				map = scope.maps[pI];
				console.log("map is for " , scope.index);
				if(map){
					if(scope.place.routes){
						console.log("map is ok for " , scope.index);
						createPolyline(scope.place.routes, map, scope.place, scope.index);
					}
				}
			})

			/*scope.curMap = controllers.getMap;
			if(scope.curMap()){
				scope.map = scope.curMap();

			}else{
				var watch = scope.$watch('details', function(){
					scope.map = scope.curMap();
					if(scope.map){
						if(scope.place.routes){
							createPolyline(scope.place.routes, scope.map, scope.place, scope.index);
						}
						watch();
					}
				})
			}*/
		}
	}
})


function createPolyline(directionResult, map, place, index) {
	//if( index != 8)return;
	var colIndex  = index % 6;

	var borderline = new google.maps.Polyline({
	  path: google.maps.geometry.encoding.decodePath(directionResult.routes[0].overview_polyline.points),
	  strokeColor: "#333",
	  strokeOpacity: 1,
	  strokeWeight: 8
	});

	var line = new google.maps.Polyline({
	  path: google.maps.geometry.encoding.decodePath(directionResult.routes[0].overview_polyline.points),
	  strokeColor: "#E0B1C7",
	  strokeOpacity: 1,
	  strokeWeight: 7,
	  zIndex : index
	});

	google.maps.event.addListener(line, 'mouseover', function(latlng) {
        line.setOptions({strokeColor: '#FF0089', zIndex : 99});
        //xline.setMap(map);
    });

    google.maps.event.addListener(line, 'mouseout', function(latlng) {
        line.setOptions({strokeColor: "#E0B1C7", zIndex : index});
        //xline.setMap(null);
    });

	line.setMap(map);
	borderline.setMap(map);

	var marker, contentString, infowindow, image; 
	for (var i = 0; i < line.getPath().length; i++) {
  		if(i == 0){
  			image = {
  				url : "img/icons/map" + (index+1) + ".png",
  				scaledSize : new google.maps.Size(50, 50),
  				anchor: new google.maps.Point(25, 25)
  			}
      		marker = new google.maps.Marker({
				icon: image,
				position: line.getPath().getAt(i),
				map: map
      	    });

      	    contentString = "<div class='mapInfoWindow'>" +
		      	    			"<h4>" + index + " "+ place.name + "</h4>"  +
	      	    				"<div class='mapDesc'>" + 
		      	    				"<p>" + place.description + "</p>" + 
		      	    				"<p>" + 
		      	    					"On <b>" + "28 Aug 2016" + 
		      	    					"</b>"  + ", this place opens from" + "<b>" + "8:00 AM" + "</b>" + " to " + "<b>" + "6:00pm" + "</b>" +
		      	    				"</p>"+
		      	    				"<p>" + "This place has <b>free entrance</b>" + "</p>" + 
		      	    			"</div>" +
		      	    			"<div class='mapImg'>" +
		      	    				"<img src='" + place.photo + "'>" +
		      	    			"</div>" +
		      	    		"</div>"

      	    infowindow = new google.maps.InfoWindow({
				content: contentString,
				maxWidth : 600
			});

      		marker.addListener('click', function() {
				infowindow.open(map, marker);
			});

			marker.addListener('mouseover', function(){
				line.setOptions({strokeColor: '#FF0089', zIndex : 99});
			});

			marker.addListener('mouseout', function(){
				line.setOptions({strokeColor: "#E0B1C7", zIndex : index});
			})
		}
	}
}