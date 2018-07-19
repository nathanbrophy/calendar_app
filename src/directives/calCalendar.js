/**
 * @author Nathan Brophy
 * @version v1.0.0
 */
const $_       = angular.element;
var dynamicCal = angular.module("dynamicCal", []); //register the module

//Register the calendar directive 
dynamicCal.directive('calCalendar', ['$document', 'calEventHandler', 'calDayObject', '$timeout', function ($document, calEventHandler, calDayObject, $timeout) {
    return {
        restrict: 'E',
        scope: {
            events: '=?events',
            config: '=?config',
            onViewChange: '=?onViewChange',
            onEventChange: '=?onEventChange',
            onEventClick: '=?onEventClick',
            onTimeSelect: '=?onTimeSelect',
            loading: '=?loading'
        },
        controller: "calCalendarCtrl",
        templateUrl: 'calCalendar.html', //App/Shared/mavCalendar/calCalendar.html',
        link: function (scope, elem, attrs, controller) {}
    }
}]); //end cal calendar directive 

//Set up and register the controller 
dynamicCal.controller('calCalendarCtrl', ["$scope", '$timeout', 'calDayObject', function ($scope, $timeout, calDayObject) {
    if($scope.config == null) $scope.config = {};
    this.calendar = $scope.config;
    this.onEventChange = $scope.onEventChange;
    /**
     * @param {Event} event is the event object coming in from the calendar (most likely a person's schedule time information)
     * If there is a date change when someone edits their schedule, then here we update the events in the scope to reflect
     * the new changes.  
     */
    this.eventDateChange = function (event) {
        var weeks = $scope.view.weeks;
        if (weeks != undefined) {
            for (var i = 0; i < weeks.length; i++) {
                var current_week = weeks[i];
                for (var j = 0; j < current_week.length; j++) {
                    var current_day = current_week[j];
                    current_day.removeEvent(event);
                    if ($scope.isSameDay(current_day.date, event.start)) {
                        current_day.addEvent(event);
                    }
                }
            }
        }
    }
    $scope.count = 0; //global control to track the number of events to be updated
    $scope.$watchCollection('events', function (newVal, oldVal) {  //watch the events collection for changes, and dynamically update when changes occur.
        $scope.updateEvents();
    }, true);
    /**
     * @param {Object} obj is the event's date to be checked
     * @returns {Boolean} true or false depending on whether or not the objects constructor is a Date or not.
     */
    $scope.isDate = function (obj) {
        return obj.constructor === Date;
    }
    /**
     * @param {Date} date1 is one of the dates that we are checking for equality for 
     * @param {Date} date2 is the other date that we are checking equality against
     * @returns {Boolean} true or false depending on whether the dates are the same or not  
     */
    $scope.isSameDay = function (date1, date2) {
        return date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear();
    }
    /**
     * Function to update the events displayed in the current calendar view
     */
    $scope.updateEvents = function () {
        /**
         * @param {Event} event is a calendar event taken in from the array of events
         * @param {Event} other is a calendar event taken in from the array of events 
         * @returns {number} returns the difference of event's time and other's time to be used in the array sort method
         * In case of collision with the events being started at the same time, but ending at different times, the end times 
         * are then used instead of the start times as the sort values.  
         */
        var event_sorter = function(event, other){
            var start_time_difference = event.start.getTime() - other.start.getTime();
            return (start_time_difference != 0) ? start_time_difference : event.end.getTime() - other.end.getTime();
        };
        if ($scope.events != undefined) {
            var eventCopy = $scope.events.slice();
            eventCopy.sort(event_sorter);

            var eventIndex = 0;
            var weeks = $scope.view.weeks;
            if (weeks != undefined) {
                for (var i = 0; i < weeks.length; i++) {
                    var current_week = weeks[i];
                    for (var j = 0; j < current_week.length; j++) {
                        var day = current_week[j];
                        if (!day.isPlaceholder) { //make sure the day is actually an event we care about
                            var events = [];
                            var nextDay = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate() + 1);
                            while (eventIndex < eventCopy.length && eventCopy[eventIndex].start.getTime() < nextDay.getTime()) {
                                var coppied_event = eventCopy[eventIndex];
                                if ($scope.isSameDay(coppied_event.start, day.date)) {
                                    events.push(coppied_event);
                                }
                                eventIndex++;
                            }
                            day.setEvents(events);  //set the day's events to the ones found in the porevious loop
                        }
                    }
                }
            }
        }
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    $scope.today = today;
    //Object to hold the default configuration settings.  Date is not included becase we don't want to use the memory associated with 
    //creating and storing that date object copy unless we need to.
    const CONFIG_DEFAULTS = {
        'editStep'      : .5,
        'viewStart'     : 0,
        'viewEnd'       : 24,
        'durration'     : 'week',
        'configType'    : 'schedule',
        'canChangeType' : true,
        'showHead'      : true,
        'cellHeight'    : 20
    };
                                                                          //get the config options, and set defaults for null values
    var config = $scope.config != null ? $scope.config : {};              //get the calendar configurations
    if (config.editStep == undefined)      config.editStep      = CONFIG_DEFAULTS.editStep;        //set the default for editStep
    if (config.viewStart == undefined)     config.viewStart     = CONFIG_DEFAULTS.viewStart;       //set the default for viewStart
    if (config.viewEnd == undefined)       config.viewEnd       = CONFIG_DEFAULTS.viewEnd;         //set the default for viewEnd
    if (config.durration == undefined)     config.durration     = CONFIG_DEFAULTS.durration;       //set the default for durration
    if (config.type == undefined)          config.type          = CONFIG_DEFAULTS.configType;      //set the default for type
    if (config.canChangeType == undefined) config.canChangeType = CONFIG_DEFAULTS.canChangeType;   //set the default for canChangeType
    if (config.date == undefined)          config.date          = new Date(today);                 //set the default for date
    if (config.showHead == undefined)      config.showHead      = CONFIG_DEFAULTS.showHead;        //set the default for showHead
    if (config.cellHeight == undefined)    config.cellHeight    = CONFIG_DEFAULTS.cellHeight;      //set the default for cellHeight

    config.title = "";
    config.startDate  = new Date(today); //make a copy of the current date to default the startDate to 
    config.endDate    = new Date(today); //make a copy of the current date to default the endDate to
    config.today      = today;
    config.months     = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    config.daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    config.prev = function () { //function that moves the current calendar week back one 
        this.moveView(-1);
    };
    config.next = function () { //function that moves the current calendar week forward one
        this.moveView(1);
    };
    config.goToToday = function () { //function that moves the current calendar to the current date
        this.changeDate(this.today);
    };
    /**
     * @param {Date} date is the date object coming in that we wish to change the calendar view to 
     * @see this.load
     */
    config.changeDate = function (date) { 
        this.date = new Date(date); //make a copy of the incoming date object to store in our object date field
        this.load();
    };
    /**
     * @param {number} multiplier is essentially the step forward that we want to move 
     * @see this.load()
     */
    config.moveView = function (multilpier) {
        switch (this.durration) {
            case "month":
                this.date.setDate(1); //changing the month so change the current day to th 1st 
                this.date.setMonth(this.date.getMonth() +  multilpier); 
                break;
            case "day":
                this.date.setDate(this.date.getDate() +  multilpier);
                break;
            default: //"week"
                //The default is week, so we advance or backtrack the calendar by 7 days
                this.date.setDate(this.date.getDate() + (7 * multilpier));
        }
        this.load(); //load the calendar in after we change the object fields 
    };
    /**
     * @param {String} durration is an optional parameter that can be used to change the current duration of the calendar before we load new content in
     */
    config.load = function (durration) {
        if (durration != undefined) {
            this.durration = durration;
        }
        this.days = [];
        this.date.setHours(0, 0, 0, 0);
        var startDate = new Date(this.date);
        var endDate   = new Date(this.date);
        switch (this.durration) { //set the calendar title based on the duration in the configuration and change the date variables
            case "month":
                startDate.setDate(1);
                endDate.setMonth(endDate.getMonth() + 1);
                endDate.setDate(0);
                this.title = this.months[startDate.getMonth()] + " " + startDate.getFullYear();
                break;
            case "day":
                this.title = (startDate.getTime() == this.today.getTime() ? "Today" : this.daysOfWeek[startDate.getDay()] + ", " + this.months[startDate.getMonth()] + " " + startDate.getDate() + ", " + startDate.getFullYear())
                break;
            default:
                startDate.setDate(startDate.getDate() - startDate.getDay());
                endDate.setDate(endDate.getDate() + 6 - endDate.getDay());
                this.title = this.months[startDate.getMonth()] + " " + startDate.getDate() + ", " + startDate.getFullYear() + " - " + this.months[endDate.getMonth()] + " " + endDate.getDate() + ", " + endDate.getFullYear()
        }
        //keep track of the old start and end dates before updating them
        var oldStartDate = this.startDate;
        var oldEndDate   = this.endDate;
        //update the start and end dates to reflect the changes made by the switch 
        this.startDate = startDate;
        this.endDate   = endDate;

        var beginning = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - startDate.getDay());
        var end       = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + (6 - endDate.getDay()));
        //get the number of fractional weeks in the current month and then round up
        var numberOfWeeks = Math.ceil((((end.getTime() - beginning.getTime()) / 1000 / 60 / 60 / 24)) / 7);

        if (numberOfWeeks == 1) { //this means we are in week view 
            beginning = new Date(startDate);
            end       = new Date(endDate);
        }

        var calendarMonth = [];   //this is our month, it's an array of all of the weeks in that month
        var cur           = new Date(beginning);        //this is the begining of the current calendar view
        for (var i = 0; i < numberOfWeeks; i++) {       //loop through the number of weeks in the month
            calendarMonth.push(new Array());            //create a new array of days to be stored in our weeks
            for (var j = 0; j < 7 && cur <= end; j++) { //loop through the number of days in a week or until end of month
                var calendarDay = new calDayObject(cur, !(cur >= startDate && cur <= endDate))
                calendarMonth[i].push(calendarDay);
                cur.setDate(cur.getDate() + 1);         //advance cur to be the next day in the month
            }
        }
        this.weeks = calendarMonth;
        if (numberOfWeeks == this.startDate.getMonth()) {
            window.lastWeeks = window.weeks;
            window.weeks = JSON.stringify(calendarMonth);
        }

        $scope.updateEvents(); //update the shown events in the calendar view

        if (oldEndDate.getTime() != this.endDate.getTime() || oldStartDate.getTime() != this.startDate.getTime()) {
            //check to make sure there was actually a change in the dates to display, and that it's safe to use the view change function
            if ($scope.onViewChange != undefined && $scope.onViewChange.constructor == Function) {
                var _this = this;
                $timeout(function () { //here is where we actually change the view 
                    $scope.onViewChange(_this.startDate, _this.endDate);
                }, 0);
            }
        }
        $timeout(function () { $scope.$apply(); }); //apply and digest the changes made in the previous update in the root
    }; //end load method

    $scope.view = config; //update the current view to match the newly created config options 
    /**
     * Here we are watching the specific fields of the view after we update it to match our new config.
     * When there is a change detected by $watch, we fire off our callback function that loads the view with the new config.
     */
    $scope.$watch('[view.viewStart, view.viewEnd, view.durration,view.date.getTime()]', function (newVal, oldVal, scope) {
        //we use scope and not $scope here because it is safer to pass it in through the callback and let angular do resolutions
        scope.view.load(scope.view.durration);
    });
    $scope.view.load(); //fire off the load event if there isn't a change in one of the fields i.e. initial view
}]); //end cal calendar controller 