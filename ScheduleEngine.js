exports.SchedulingEngine = function(places, priority, days, startDate, startTime, endTime){
	return new Scheduler(places, priority, days, startDate, startTime, endTime);
}


const PRIORITY = {
	ACTION : "a",
	FUN : "f",
	HOLIDAY : "h",
	LEISURE : "l",
	NIGHT : "n",
	SPORT : "s"
}


var Scheduler = function(places, priority, days, startDate, startTime, endTime){
	this.places = places;
	this.zones = {};
	this.priority = priority;
	this.days = days;
	this.startDate = startDate;
	startTime = !!startTime ? startTime : 800;
	endTime = !!endTime ? endTime : 2600;

	this.timeTables = new Array();

	for(var i=0; i < days; i++){
		this.timeTables[i] = new TimeTable(startTime, endTime);
	}
}

Scheduler.prototype.createZones = function(){
	var curPlace;
	for (var i = 0; i < this.places.length; i++) {
		curPlace = this.places[i];
		if (this.zones.hasOwnProperty(curPlace.zone)){
			this.zones[curPlace.zone].push(curPlace)
		}else{
			this.zones[curPlace.zone] = [curPlace];
		}
	};
}

Scheduler.prototype.addPriority = function(){
	var curPlace;
	for (var i = 0; i < this.places.length; i++) {
		curPlace = this.places[i];
		curPlace.topPriority = curPlace.ranking[this.priority];
	};
}

Scheduler.prototype.sortZones = function(){
	var curZone;
	for(var zone in this.zones){
		curZone = this.zones[zone];
		curZone.sort(function(a, b){			
			var priority = b.topPriority - a.topPriority;
			if(priority === 0){
				return b.duration - a.duration;
			}
			return priority
		});
		this.zones[zone] = curZone;
	}
}

Scheduler.prototype.pruneZones = function(max){
	max = !!max ? max : 9;
	var curZone;
	for(var zone in this.zones){
		curZone = this.zones[zone];
		curZone = curZone.slice(0, max);
		this.zones[zone] = curZone;
	}
	return this.zones;
}

Scheduler.prototype.timeTablesToList = function(){
	var timeTable;
	var placeDict = {};
	var day = [];
	var days = [];

	for (var i = 0; i < this.timeTables.length; i++) {
		timeTable = this.timeTables[i];
		for(var j = 0; j < timeTable.numOfSlot; j++){
			if(timeTable.slots[j] !== undefined && placeDict[timeTable.slots[j]._id] !== 1){
				day.push(timeTable.slots[j]);
				placeDict[timeTable.slots[j]._id] = 1;
			}
		}

		days.push(day);
		day = [];
	}

	return days;
}

Scheduler.prototype.schedule = function(){
	/* Hey computer make me a trip :( */
	this.addPriority();
	this.createZones();
	this.sortZones();
	var garbage = [];
	var waste;
	var zones = [];
	var zoneObj;

	for(var zone in this.zones){
		zoneObj = {}
		zoneObj.id = zone;
		zoneObj.priority = this.zones[zone].reduce(function(pValue, cPlace, cIndex, array){
			return pValue + cPlace.topPriority;
		}, 0);


		zones.push(zoneObj);
	}

	zones.sort(function(a, b){return b.priority - a.priority});

	for(var i = 0; i < this.days; i++){
		console.log("Day" , i);
		curZone = this.zones[zones[i].id];
		waste = this.dailyScheduler(curZone, this.timeTables[i]);
		garbage = garbage.concat(waste);
		
		// waste = this.dailyMeal(this.timeTables[i], 1130, 1500, "lunch" + i);
		// garbage = garbage.concat(waste);

		// waste = this.dailyMeal(this.timeTables[i], 1900, 2000, "dinner" + i);
		// garbage = garbage.concat(waste);		
	}

	garbage.sort(function(a, b){
		var priority = b.topPriority - a.topPriority;
		if(priority === 0){
			return b.duration - a.duration;
		}
		return priority
	});

	var freeTimes = [];
	var goodGarbage = []
	for (var i = 0; i < this.timeTables.length ; i++){
		freeTimes = this.timeTables[i].emptyContinousSpace();
		for(var j = 0; j < freeTimes.length; j++ ){
			this.findPlacesForTime(freeTimes[j][0], freeTimes[j][1], garbage, this.timeTables[i], 1);
		}

		freeTimes = this.timeTables[i].emptyContinousSpace();
		for(var j = 0; j < freeTimes.length; j++ ){
			this.findPlacesForTime(freeTimes[j][0], freeTimes[j][1], garbage, this.timeTables[i], 0.8);
		}

		freeTimes = this.timeTables[i].emptyContinousSpace();
		for(var j = 0; j < freeTimes.length; j++ ){
			this.findPlacesForTime(freeTimes[j][0], freeTimes[j][1], garbage, this.timeTables[i], 0.6);
		}
	}

	return this.timeTablesToList();
}

Scheduler.prototype.findPlacesForTime = function(stime, etime, places, timeTable, fitTime){
	stime = parseInt(stime);
	etime = parseInt(etime);
	var index = 0;
	var placeStartTime, placeEndTime, place, startIndex, endIndex, duration;
	var returnPlaces = [];
	while(stime < etime && index < places.length){
		place = places[index];
		duration = Math.floor( place.duration * fitTime );
		try{
			placeStartTime = parseInt(place.opening_hours["0"]["0"].open);
			placeEndTime = parseInt(place.opening_hours["0"]["0"].close);
			placeDurationEnd = TimeTable.prototype.addTime(stime, duration);
		}catch(err){
			index += 1;
			continue;
		}
		if(placeStartTime >= stime && placeDurationEnd <=  placeEndTime && placeDurationEnd <= etime && !place.used){
			returnPlaces.push(places[index]);
			places[index].used = true;
			timeTable.niceFit(placeStartTime, placeDurationEnd, place)
			stime = placeDurationEnd;
		}


		index += 1;
	}
}

Scheduler.prototype.dailyScheduler = function(places, timetable){
	var returnPlaces = [];
	for(var i = 0; i < places.length ; i++){
		if(!timetable.addPlace(places[i])){
			returnPlaces.push(places[i]);
		}
	}

	return returnPlaces;
}

// Scheduler.prototype.dailyMeal = function(timetable, mealStartTime, mealEndTime, id){
// 	var meal = {};
// 	var returnList = [];
// 	meal._id = "meal_" + id;
// 	meal.optimal_hours = {};
// 	meal.optimal_hours.open = mealStartTime;
// 	meal.optimal_hours.close = mealEndTime;
// 	meal.duration = 60;
// 	console.log(meal)
// 	if(timetable.addPlace(meal))return [];

// 	//there is no place for meal;	
// 	var placesAtMealTime = [];
// 	var placesAtMealTimeDict = {}
// 	var id, place;
// 	var mealStartTime = timetable.slotIndex(mealStartTime);
// 	var mealEndTime = timetable.lastSlotIndex(mealEndTime);
// 	var maxStartTime = timetable.indexToTime(mealEndTime - 1);

	
// 	for(var i = mealStartTime; i <= mealEndTime ; i++){
// 		place = timetable.slots[i];
// 		if(!place) continue;

// 		if(!placesAtMealTimeDict[place._id]){
// 			place.mealCollision = i;
// 			placesAtMealTime.push(place);
// 			placesAtMealTimeDict[place._id] = 1;
// 		}else{
// 			placesAtMealTimeDict[place._id] += 1;
// 		}
// 	}

// 	placesAtMealTime.sort(function(a,b){
// 		return placesAtMealTimeDict[b._id] - placesAtMealTimeDict[a._id]
// 	});

// 	var countDuration;

// 	for(var i = 0; i < placesAtMealTime.length; i++){
// 		place = placesAtMealTime[i];
// 		if(countDuration >= meal.duration)break;

// 		timetable.removePlace(place._id);
// 		returnList.push(place);
// 		countDuration += placesAtMealTimeDict[place._id] * 30;
// 	}

// 	var result = timetable.addPlace(meal);
// 	console.log(result)
// 	return returnList;

// }


var TimeTable = function(startTime, endTime){
	this.startTime = startTime;
	this.endTime = endTime;
	this.numOfSlot = this.lastSlotIndex(this.endTime)
	this.slots = [];
}

TimeTable.prototype.indexToTime = function(index){
	var hour = ~~(index / 2);
	var minute = index % 2;
	return this.addTime(this.startTime, hour*60 + minute*30);

}

TimeTable.prototype.slotIndex = function(time){
	return (2 * ( ~~(time / 100) - ~~(this.startTime / 100) ) ) + Math.floor(((time % 100) - (this.startTime % 100)) / 30); 
}

TimeTable.prototype.overlapDuration = function(placeA, placeB){
	var aStime = placeA.optimal_hours.open;
	var aEtime = placeA.optimal_hours.close;

	var bStime = placeB.optimal_hours.open;
	var bEtime = placeB.optimal_hours.close;
}

TimeTable.prototype.lastSlotIndex = function(time){
	var minutes =  Math.abs( (time % 100) - (this.startTime % 100) );
	if(minutes === 0 || minutes === 30){
		return this.slotIndex(time) - 1;
	}

	return this.slotIndex(time);
}

TimeTable.prototype.militaryToStandard =  function (fourDigitTime) {
	fourDigitTime = fourDigitTime < 999 ? "0" + fourDigitTime.toString(): fourDigitTime.toString();
    	var hours24 = parseInt(fourDigitTime.substring(0, 2),10);
    	var hours = ((hours24 + 11) % 12) + 1;
    	var amPm = hours24 > 11 ? 'pm' : 'am';
    	var minutes = fourDigitTime.substring(2);

	return hours + ':' + minutes + amPm;
}

TimeTable.prototype.addTime = function(time, inc){
	var newMinute = time % 100 + inc;
	var newHour =  ~~( time / 100 ) + ~~( newMinute / 60 );
	var newTime = newHour * 100 + newMinute % 60;
	return newTime;
}

TimeTable.prototype.collisionList = function(stime, etime){
	var sIndex = this.slotIndex(stime);
	var eIndex = this.lastSlotIndex(etime);
	var possibleCollision = [];

	for (var i = sIndex; i <= eIndex; i++) {
		if(!!this.slots[i]){
			possibleCollision.push(i);
		} 
	}

	return possibleCollision;
}

TimeTable.prototype.isPossibleFit = function(stime, etime){
	var possibleCollision = this.collisionList(stime,etime);
	var originalPossibleCollision = possibleCollision;
	if(possibleCollision.length === 0) return [true, possibleCollision];

	var sIndex = this.slotIndex(stime);
	var eIndex = this.lastSlotIndex(etime);

	if(sIndex - eIndex < 4 || possibleCollision.length > 2) return [false, possibleCollision];

	possibleCollision.pop(eIndex);
	possibleCollision.pop(sIndex);
	if(possibleCollision.length === 0) return [true, originalPossibleCollision];
}


TimeTable.prototype.addPlace = function(place){
	var etime = this.addTime(place.optimal_hours.open, place.duration);
	var stime = parseInt(place.optimal_hours.open);
	var result;
	console.log("Start position: ", place.optimal_hours);
	while(etime <= parseInt(place.optimal_hours.close)){
		result = this.isPossibleFit(stime, etime);
		if(result[0] && result[1].length == 0){
			this.niceFit(stime, etime, place)
			console.log(place.name, etime, stime, 'true');
			return true;
		}else if(result[0]){
			this.forceFit(stime, etime, place);
			console.log(place.name, etime, stime, 'true');
			return true;
		}else{
			console.log(place.name, etime, stime, 'false');
			stime = this.addTime(stime, 30);
			etime = this.addTime(stime, place.duration);
		}

	}

	return false;
}

TimeTable.prototype.removePlace = function(placeID){
	for(var i=0; i < this.numOfSlot; i++){
		if(this.slots[i] && this.slots[i]._id === placeID){
			this.slots[i] = undefined;
		}
	}
}

TimeTable.prototype.niceFit = function(stime, etime, place){
	var sIndex = this.slotIndex(stime);
	var eIndex = this.lastSlotIndex(etime);
	place.fit = {};
	place.fit.go = this.militaryToStandard(parseInt(stime));
	place.fit.leave = this.militaryToStandard(parseInt(etime));
	for (var i = sIndex; i <= eIndex; i++) {
		this.slots[i] = place;
	}
}

TimeTable.prototype.forceFit = function(stime,etime,place){
	var sIndex = this.slotIndex(stime);
	var eIndex = this.slotIndex(etime);
	place.compromise = true;

	if(!!this.slots[sIndex] && !!this.slots[eIndex]){
		this.slots[sIndex].compromise = true;
		this.slots[eIndex].compromise = true;
		this.niceFit(this.indexToTime(sIndex+1), this.indexToTime(eIndex-1));
	}else if(!!this.slots[sIndex]){
		this.slots[sIndex].compromise = true;
		this.niceFit(this.indexToTime(sIndex+1), etime);
	}else{
		this.slots[eIndex].compromise = true;
		this.niceFit(stime, this.indexToTime(eIndex-1));
	}

	return;
}

TimeTable.prototype.emptyContinousSpace = function(){
	var continuoues = false;
	var returnList = [];
	var startTime, endTime;
	for(var i =0; i < this.numOfSlot; i++){
		if(!this.slots[i] && !continuoues){
			startTime = this.indexToTime(i);
			continuoues = true;
		}else if(this.slots[i] && continuoues){
			continuoues = false;
			endTime = this.indexToTime(i);
			returnList.push([startTime, endTime]);
		}

	}

	if(continuoues){
		endTime = this.indexToTime(this.numOfSlot);
		returnList.push([startTime, endTime]);
	}

	return returnList;
}


//var schedule = new Scheduler(places, PRIORITY.HOLIDAY, 3, 20160712);	
//schedule.schedule();
//console.log(schedule.timeTablesToList());
