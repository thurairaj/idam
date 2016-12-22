angular.module('travora')

.controller("homeController", function($scope, $location, httpService, ResultFactory){
	$scope.search = function(){
		// json payload for our post
		var jsonPayload = {
			place: selectedPlace._id,
			date: $scope.date,
			days: $scope.days,
			lifestyle: $scope.lifestyle,
			starttime: '10:00 AM'
		}
		console.log(jsonPayload);
		
		ResultFactory.searchItin(jsonPayload, '/list')	;	
	}

	$scope.subscribe = function(){
		// json payload for our post
		var jsonPayload = {
			email: $scope.email
		}

		// specify FQDN because we don't have local database
		httpService.post('/subscribe', jsonPayload)
		.then(function(successResponse){
			if(successResponse.status == 200){
				$scope.subscribeStatus = 'Successfully Subscribed'
			}else{
				$scope.subscribeStatus = 'Failed to Subscribe (Non 200)'
			}
		}, function(errorResponse){
			console.log('POST /subscribe failed in homeController')
			console.log('Server returned ' + errorResponse.status + ' ' + errorResponse.statusText)

			$scope.subscribeStatus = 'Failed to Subscribe (Server Error)'
		})
	}
})