var app = angular.module('travora', ['ngRoute', 'uiGmapgoogle-maps', 'angular-momentjs'])

app.config(function(uiGmapGoogleMapApiProvider){
	uiGmapGoogleMapApiProvider.configure({
		key: 'AIzaSyCGn2K5__OBAp9oQfq4xcm82xMczTQYabw',
		v: '3.25', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
	})
})

.config(function($momentProvider){
	$momentProvider.asyncLoading(false)
	.scriptUrl('http://cdnjs.cloudflare.com/ajax/libs/moment.js/2.5.1/moment.min.js')
})

app.config(function($routeProvider, $locationProvider){
	$routeProvider
	.when('/', {
		templateUrl: 'pages/home.html',
		controller: 'homeController'
	})
	.when('/about', {
		templateUrl: 'pages/about.html'
	})
	.when('/contact', {
		templateUrl: 'pages/contact.html',
		controller: 'contactController'
	})
	.when('/itinerary', {
		templateUrl: 'pages/itinerary.html',
		controller: 'itineraryController'
	})
	.when('/list', {
		templateUrl: 'pages/itinerary.html',
		controller: 'itineraryController'
	})
	.when('/map', {
		templateUrl: 'pages/map.html',
		controller: 'itineraryController'
	})

	$locationProvider.html5Mode(true)
})