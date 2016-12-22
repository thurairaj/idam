'use strict'

const request = require('request')
const _ = require('underscore')
const async = require('async')

const KEY = 'AIzaSyBiTQkALXbuSINIC8Bsz4R2VpYS_L6m6S0'
const url = 'https://maps.googleapis.com/maps/api/directions/json?v=3.24&traffic_model=best_guess&departure_time=now'

exports.RouterEngine = function(doc){
	return new RouterEngine(doc)
}

var RouterEngine = function(doc){
	this.doc = doc
	this.tasks = []
}

RouterEngine.prototype.routeAll = function(cb){
	var Doc = this.doc
	var Tasks = this.tasks

	_.each(this.doc.days, function(day, dayIndex){
		_.each(day.places, function(place, placeIndex){
			if(placeIndex < day.places.length - 1){
				Tasks.push(function(callback){
					var payload = url + '&key=' + KEY + '&origin=place_id:' + place._id + '&destination=place_id:' + day.places[placeIndex+1]._id + '&mode=' + place.mode

					request.get(payload, function(error, result, body){
						if(error) return callback(null)
						var routes = JSON.parse(body).routes
						
						if(routes.length > 0){
							Doc.days[dayIndex].places[placeIndex].routes = JSON.parse(body);
							Doc.days[dayIndex].places[placeIndex].routes.request = {
								origin : place._id,
								destination: day.places[placeIndex+1]._id,
								travelMode : place.mode,
								result : result
							}
							Doc.days[dayIndex].places[placeIndex].traveltime = parseInt(routes[0].legs[0].duration.value/60)
							callback(null)
						}else{
							place.mode = 'transit'
							var payload = url + '&key=' + KEY + '&origin=place_id:' + place._id + '&destination=place_id:' + day.places[placeIndex+1]._id + '&mode=' + place.mode

							request.get(payload, function(error, result, body){
								if(error) return callback(null)
								var routes = JSON.parse(body).routes
								console.log(body)
							
								Doc.days[dayIndex].places[placeIndex].routes = routes
								Doc.days[dayIndex].places[placeIndex].traveltime = parseInt(routes[0].legs[0].duration.value/60)
								callback(null)
							})
						}
					})
				})
			}
		})
	})

	async.parallel(this.tasks, function(err){
		if(err) console.log(err)
		cb(Doc)
	})
}