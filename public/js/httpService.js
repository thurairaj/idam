angular.module('travora')

.service('httpService', ['$http', function($http){
	this.get = function(url){
		return $http({
			method: 'GET',
			url: url
		})
	}

	this.post = function(url, json){
		return $http({
			method: 'POST',
			url: url,
			data: json,
			headers : {
				'Content-Type': 'application/json'
			} 
		})
	}
}])