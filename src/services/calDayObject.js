dynamicCal.factory('calDayObject', function () {

    /**
     * @param {Event} event is the event object coming in that we wish to wrap
     */
    function EventWrapper(event) {
        this.event = event;
        this.location = { left: "0%", width: "100%" };
        this.levelWidth = 1;
    }
    /**
     * @param {Date} date is the date object coming in from the calendar event
     * @param {Boolean} isPlaceholder is a boolean value that tells us whether or not the event is an actual event with data we care about or not 
     */
    var Day = function (date, isPlaceholder) {
        this.date = new Date(date);
        this.date.setHours(0, 0, 0, 0);
        this.isPlaceholder = isPlaceholder == true; //keep boolean check here to take advantage of JS typing system (in case the second param is falsy we can convert to a bool here)
        this.events = [];
    }
    /**
     * @param {Array} events is the array of events in the calendar
     */
    Day.prototype.setEvents = function (events) {
        if (events == null) {
            this.events = [];
        }
        else {
            this.events = new Array(events.length);
            for (var i = 0; i < events.length; i++) {
                this.events[i] = new EventWrapper(events[i]);
            }
            this.sort();
        }
    }
    /**
     * @param {Event} event is the calendar event object that we wish to add to the events list
     */
    Day.prototype.addEvent = function (event) {
        this.events.push(new EventWrapper(event));
    }
    /**
     * @param {Event} event is the calendar event object we wish to remove from the list of calendar events 
     */
    Day.prototype.removeEvent = function (event) {
        var changed = false;
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].event == event) {
                this.events.splice(i, 1);
                changed = true;
                i--;
            }
        }
        if (changed) {
            this.sort();
        }
    }
    /**
     * @param {Event} event is the object of interest, we look to see if the times associated to it overlap any other event
     * @param {Array} otherEvents is the array of all the other events in the calendar that we use to see if event overlaps any of them
     * @returns {Boolean} whether or not the current event of interest overlaps any of the other events in the calendar
     */
    function isOverlap(event, otherEvents){
        for (var i=0; i< otherEvents.length; i++) {
            if(event.event.start < otherEvents[i].event.end && event.event.end > otherEvents[i].event.start) {
                return true;;
            }
        }
        return false;
    }
    /**
     * @param {Array} events is all the events in the calendar that we need to sift through to level out any overlaps before we sort
     * @returns {Array} an array of the levels of overlay we have to sort through 
     */
    function buildSortLevels(events){
        var levels = [];
        var event, i, j;
        for (i = 0; i < events.length; i++) {
            event = events[i];
            j = 0;
            var done = false;
            while(!done && j < levels.length){
                if (!isOverlap(event, levels[j])) { //check to see if we found what we're looking for, if so we are done! 
                    done = true;
                }
                else { //we did not find what we were looking so increment j so we can look again! 
                    j++;
                }
            }
            /*
             * This does the same as the following, just in an optimized fashion:
             * if levels[j] has something in it then push the event on there else set levels[j] to [] then push event onto that.
             */
            (levels[j] || (levels[j] = [])).push(event);
        }    
        return levels;
    }

    var eventCount = 0;
    /**
     * @param {Event} current is the calendar event object we are using in the sorting function
     * @param {Event} other is the other calendar event object we are using in the sorting function 
     * @returns {number} a number for use in the array sort method to test which is greater, current or other 
     * Function checks the difference between the events start times, if they are the same then we check the end times, 
     * if the end times are the same, then since we can reorder, we check the tie breaker.  The function returns the rank based on which
     * of the previous three cases is non-zero first.
     */
    var reorderEvents = function (current, other) {
        var startDif = current.event.start.getTime() - other.event.start.getTime();
        if (startDif != 0) {
            return startDif;
        }
        var endDif = current.event.end.getTime() - other.event.end.getTime();
        if (endDif != 0) {
            return endDif;
        }
        else {
            return current.tieBreaker - other.tieBreaker;
        }
    };
    /**
     * @param {Event} current is the calendar event object we are using in the sorting function
     * @param {Event} other is the other calendar event object we are using in the sorting function 
     * @returns {number} a number for use in the array sort method to test which is greater, current or other 
     * Function checks the difference between the length of the events, and uses that to test rank.  If the two events have the 
     * same length, then the time of day they begin at is used to assign a rank.  We cannot use the tie breaker here because we are not 
     * allowed to reorder. 
     */
    var sortEvents = function(current, other) {
        var currentLength = current.event.end.getTime() - current.event.start.getTime();
        var otherLength = other.event.end.getTime() - other.event.start.getTime();
        if (currentLength != otherLength) {
            return otherLength - currentLength;
        }
        else {
            return current.event.start.getTime() - other.event.start.getTime();
        }
    };
    /**
     * @param {Boolean} reorder is a flag that's let's us know if we should reorder the events in the list or not
     */
    Day.prototype.sort = function (reorder) {
        if (this.events.length != eventCount) {
            eventCount = this.events.length;
            for (var i = 0; i < this.events.length; i++) {
                this.events[i].tieBreaker = i;    //in case of a tie we set a property of that event to its original position in the array 
            }
        }
        if (reorder == null) reorder = true;
        if (reorder) {                           //here we can go ahead and reorder those events!
            this.events.sort(reorderEvents);
        }
        var eventList = [].concat(this.events);  //create a deep copy of the events list 
        eventList.sort(sortEvents);              //sort the event list
        var levels = buildSortLevels(eventList); //get the levels we need to sort through
        var k;
        for (var i = levels.length - 2; i >= 0; i--) {
            var level = levels[i];
            for (var j = 0; j < level.length; j++) {
                var done = false;
                var event = level[j];
                event.levelWidth = 1;
                k = i + 1
                while(!done && k < levels.length){
                    if (isOverlap(event, levels[k])) {
                        done = true;
                    }
                    else {
                        k++;
                    }
                }
                event.levelWidth = k - i;
            }
        }
        for (var i = 0; i < levels.length; i++) {
            var level = levels[i];
            for (var j = 0; j < level.length; j++) {
                level[j].location = {
                    left: ((92 / levels.length * i) + 4) + "%",
                    width: ((92 / levels.length * level[j].levelWidth)) + "%"
                };
            }
        }
    } //end sort function 

    return Day;
}); //end cal day object factory