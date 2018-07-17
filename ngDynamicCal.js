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
}]);

//Set up and register the controller 
dynamicCal.controller('calCalendarCtrl', ["$scope", '$timeout', 'calDayObject', function ($scope, $timeout, calDayObject) {
    if ($scope.config == null) $scope.config = {};
    this.calendar = $scope.config;
    this.onEventChange = $scope.onEventChange;

    /**
     * @param event is the event object coming in from the calendar (most likely a person's schedule time)
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
     * @param obj is the event's date to be checked
     * @returns {Boolean} true or false depending on whether or not the objects constructor is a Date or not.
     */
    $scope.isDate = function (obj) {
        return obj.constructor === Date;
    }

    $scope.dayEvents = [];
    $scope.lastLength = 0;

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
                                if ($scope.isSameDay(eventCopy[eventIndex].start, day.date)) {
                                    events.push(eventCopy[eventIndex]);
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
    config.startDate = new Date(today); //make a copy of the current date to default the startDate to 
    config.endDate = new Date(today);   //make a copy of the current date to default the endDate to
    config.today = today;
    config.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
     */
    config.changeDate = function (date) { 
        this.date = new Date(date); //make a copy of the incoming date object to store in our object date field
        this.load();
    };
    /**
     * @param {number} multiplier is essentially the step forward that we want to move 
     */
    config.moveView = function (multilpier) {
        switch (this.durration) {
            case "month":
                this.date.setDate(1); //changing the month so change the current day to th 1st 
                //we use 1 * multiplier here to take advantage of JS implicit type conversions (in case the multiplier comes in as a string from a json object)
                this.date.setMonth(this.date.getMonth() + (1 * multilpier)); 
                break;
            case "day":
                //we use 1 * multiplier here to take advantage of JS implicit type conversions (in case the multiplier comes in as a string from a json object)
                this.date.setDate(this.date.getDate() + (1 * multilpier));
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
        if (durration != undefined) this.durration = durration;
        this.days = [];
        this.date.setHours(0, 0, 0, 0);
        var startDate = new Date(this.date);
        var endDate = new Date(this.date);
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
        var end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + (6 - endDate.getDay()));
        //get the number of fractional weeks in the current month and then round up
        var numberOfWeeks = Math.ceil((((end.getTime() - beginning.getTime()) / 1000 / 60 / 60 / 24)) / 7);

        if (numberOfWeeks == 1) { //this means we are in week view 
            beginning = new Date(startDate);
            end = new Date(endDate);
        }


        var calendarMonth = new Array(numberOfWeeks);   //this is our month, it's an array of all of the weeks in that month
        var cur = new Date(beginning);                  //this is the begining of the current calendar view
        for (var i = 0; i < numberOfWeeks; i++) {       //loop through the number of weeks in the month
            calendarMonth[i] = new Array();             //create a new array of days to be stored in our weeks
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
            console.log("=====", calendarMonth);//startDate, endDate);
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

}]);

dynamicCal.directive('calDay', ['$document', 'calEventHandler', function ($document, calEventHandler) {
    return {
        restrict: 'E',
        templateUrl: 'calDay.html',
        require: ['^calCalendar'],
        scope: {
            calendar: '=calendar',
            day: '=day',
            onEventClick: '=onEventClick',
            onEventChange: '=onEventChange',
            onTimeSelect: '=onTimeSelect',
            startTime: '=startTime',
            endTime: '=endTime'
        },
        controller: 'calDayCtrl',
        link: function (scope, elem, attrs, controller) {
            var today = new Date(); 
            today.setHours(0, 0, 0, 0);
            if (scope.day.date < today) elem.addClass("cal-past");
            if (scope.day.date.getTime() == today.getTime()) elem.addClass("cal-today");

            scope.cellHeight = scope.calendar.cellHeight;
            scope.fullDaysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            scope.daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            /**
             * @returns {Array} the array representing the overlay object in DOM standards, or empty if no matching elements
             */
            function getOverlay() {
                var allLabels = elem.find('label');
                for (var i = 0 ; i < allLabels.length; i++) {
                    if(angular.element(allLabels[i]).hasClass("cal-overlay")) return angular.element(allLabels[i]);
                }
                var allDivs = elem.find('div');
                for (var i = 0 ; i < allDivs.length; i++) {
                    if ($_(allDivs[i]).hasClass("cal-container")) {
                        var overlay = $_('<label class="cal-overlay" ></label>');
                        $_(allDivs[i]).prepend(overlay);
                        return overlay;
                    }
                }
                return [];
            }
 
            /** 
             * The following mouse events are used to control what happens when a calendar dat object is clicked and dragged to a new time.
             */

            var startY, startTop, startBottom, overlay;

            /**
             * If there is no overlay currently, then we get the overlay to avoid a null error.
             * The overlay is then removed via its remove method.
             */
            function removeOverlay() {
                if (overlay == undefined || overlay.length == 0) overlay = getOverlay()
                overlay.remove();
            }

            /**
             * @param {MouseEvent} e is the mouse event object 
             * Here we are checking to see if the mouse is in a container/event or not in the calendar.
             * This method also handles the case that there is an overlay. 
             */
            function mouseout(e) {
                // Get Container where mouse moved to
                var targetContainer = $_(e.relatedTarget);
                for (var depth = 0; depth < 10 && !targetContainer.hasClass("cal-container") ; depth++) {
                    targetContainer = targetContainer.parent();
                }
                // Get Initial container
                var overlayContainer = overlay.parent();
                
                // If mouse moved out of initial container remove overlay
                if (!overlayContainer[0].isSameNode(targetContainer[0])) {
                    //remove the overlay and register the mouse event functions
                    removeOverlay();
                    elem.off('mouseup', mouseup);
                    elem.off('mousemove', mousemove);
                    elem.off('mouseout', mouseout);
                }
            }

            elem.on('mousedown', function (e) { removeOverlay();  } );

            var startPageTop, startPageBottom, cellHeight;
            elem.on('mousedown', function (e) {
                $document.off('mousedown', deleteOverlay);
                if (scope.onTimeSelect != undefined && scope.onTimeSelect.constructor == Function) {
                    var target = $_(e.target);
                    if (target.hasClass('cal-hourMark') || target.hasClass('cal-halfHourMark')) {

                        startY          = e.pageY;
                        startPageTop    = startY - e.offsetY;
                        startPageBottom = startPageTop + e.target.offsetHeight;
                        startTop        = e.target.offsetTop;
                        startBottom     = startTop + e.target.offsetHeight;
                        cellHeight      = e.target.offsetHeight;

                        overlay = getOverlay();
                        overlay.css('top', e.target.offsetTop + "px").css('height', e.target.offsetHeight + "px");

                        // Set up events
                        elem.on('mouseup', mouseup);
                        elem.on('mousemove', mousemove);
                        elem.on('mouseout', mouseout);
                    }
                }
            });

            /**
             * @see removeOverlay
             */
            function deleteOverlay() { //here we register the remove overlay function to the off mousedown event
                removeOverlay();
                $document.off('mousedown', deleteOverlay);
            }

            /** 
             * @param {MouseEvent} e is the mouse event that comes in when there is a mouse movement
             * If we move an event on top of another or move an overlayed event, then we need to update the overlay heights
             */ 
            function mousemove(e) {
                var overlayHeight, overlayTop;
                if (e.pageY >= startPageTop) {
                    overlayHeight = Math.ceil((e.pageY - startPageTop) / scope.cellHeight) * scope.cellHeight;
                    overlayTop = startTop;
                }
                else {
                    overlayHeight = Math.ceil((startPageBottom - e.pageY) / cellHeight) * cellHeight;
                    overlayTop = startBottom - overlayHeight;
                }
                overlay.css('top', overlayTop + "px").css('height', overlayHeight + "px");
            }

            /** 
             * @param {MouseEvent} e is the mouse event that comes in when there is a mouse movement
             * We moved the event, so now we need to save these changes.
             */ 
            function mouseup(e) {
                var start = (overlay[0].offsetTop / cellHeight / 2) + 5;
                var end = start + (overlay[0].offsetHeight / cellHeight / 2);
                var startDate = new Date(scope.date); //create a deep copy of the start date
                startDate.setHours(0, 0, 0, 0);
                startDate.setHours(Math.floor(start));
                startDate.setMinutes(start * 60);
                
                var endDate = new Date(startDate);
                endDate.setHours(Math.floor(end));
                endDate.setMinutes(end * 60);

                if (scope.onTimeSelect != undefined && scope.onTimeSelect.constructor == Function) {
                    scope.onTimeSelect(startDate, endDate);
                }

                elem.off('mouseup', mouseup);
                elem.off('mousemove', mousemove);
                elem.off('mouseout', mouseout);
                $document.on('mousedown', deleteOverlay);
            }

            scope.$on("CAL-DATE-CHANGE", function () {
                if ($_(elem)[0] == $_(calEventHandler.destDayElem)[0]) {
                    try{ //try to update the calendar event
                        calEventHandler.event.start.setDate(scope.date.getDate());
                        calEventHandler.event.start.setMonth(scope.date.getMonth());
                        calEventHandler.event.start.setYear(scope.date.getFullYear());
                        calEventHandler.event.end.setDate(scope.date.getDate());
                        calEventHandler.event.end.setMonth(scope.date.getMonth());
                        calEventHandler.event.end.setYear(scope.date.getFullYear());
                    }
                    catch (ex) {
                        console.log("Error :(", ex);
                    }
                    var divs = $_(calEventHandler.destDayElem).find('div');
                    for (var i = 0; i < divs.length; i++) {
                        if ($_(divs[i]).hasClass('cal-container')) {
                            $_(divs[i]).append(calEventHandler.eventElem);
                            break;
                        }
                    }
                }
                else if ($_(elem)[0] == $_(calEventHandler.srcDayElem)[0]) {
                }
            });
        }
    };
}]); //end call day directive

dynamicCal.controller("calDayCtrl", ["$scope", function ($scope) {
    $scope.date = $scope.day.date;
    $scope.events = $scope.day.events;
    //console.log($scope.day, $scope.date, $scope.events);
    this.sortDay = function () {
        $scope.day.sort();
    }
}]);
dynamicCal.directive('calEvent', ['$document', '$templateCache', 'calEventHandler', '$timeout', function ($document, $templateCache, calEventHandler, $timeout) {
    /**
     * @param {Event} event is the event that we are currently inspecting
     * @param {number} callHeight is the minimum height a cell can be
     * @returns {number} the height of the current event
     */
    var getHeight = function (event, cellHeight) {
        var startHours = event.start.getHours() + event.start.getMinutes() / 60;
        var endHours   = event.end.getHours() + event.end.getMinutes() / 60;
        if (endHours == 0 && event.start < event.end) endHours = 24;
        var height = (endHours - startHours) * (2 * cellHeight);
        if (height <= 0) height = cellHeight;  // Min height of cellHeight
        return height;
    }
    /**
     * @param {Event} event is the event that we are currently inspecting
     * @param {number} cellHeight is the minimum height a cell can be
     * @param {Date} startTime is the date object representing the start time of the cell
     * @returns {number} position of the top of the cell 
     */
    var getTop = function (event, cellHeight, startTime) {
        var startHours = event.start.getHours() + event.start.getMinutes() / 60;
        return (startHours - startTime) * 2 * cellHeight;
    }
    return {
        restrict: 'E',
        scope: {
            calendar: '=calendar',
            event: '=event',
            onEventClick: '=onEventClick',
            onEventChange: '=onEventChange',
            eventLeft: '=eventLeft',
            eventWidth: '=eventWidth',
            startTime: '=startTime',
            endTime: '=endTime'
        },        
        require: ['^calCalendar', '^calDay'],
        template: "<div class='cal-event-wrapper'><ng-include src='templateUrl'></ng-include> <label ng-show='event.edit' class='cal-resize'></label></div>",
        link: function (scope, elem, attrs, controllers) {
            var calController = controllers[0];
            var dayController = controllers[1];
            scope.cellHeight = calController.calendar.cellHeight;
            scope.templateUrl = "calEvent.html";
            if (calController.calendar.eventTemplateUrl != null) scope.templateUrl = calController.calendar.eventTemplateUrl;
            else if (calController.calendar.eventTemplate != null) {
                var tempUrl = "calEventTemplate";
                $templateCache.put(tempUrl, calController.calendar.eventTemplate);
                scope.templateUrl = tempUrl;
            }
            elem.addClass("cal-event");
            if (scope.event.group != undefined) elem.addClass("cal-group-" + (scope.event.group % 20));
            var startY = 0, y = 0;
            function setDimentions() {
                y = getTop(scope.event, scope.cellHeight, scope.startTime); // elem, { viewStart: scope.startTime, viewEnd: scope.endTime }); //scope.calendar);
                elem.css("height", getHeight(scope.event, scope.cellHeight) + "px"); //elem, { viewStart: scope.startTime, viewEnd: scope.endTime }) + "px"); //scope.calendar) + "px");
                elem.css("top", y + "px");
                stepPx = 2 * scope.cellHeight * scope.calendar.editStep;
                elem.css("width", scope.eventWidth);
                elem.css("left", scope.eventLeft);
            }
            //When the times of an event change, we need to update the size of the cell to reflect that 
            scope.$watch("[startTime, endTime]", function (newVal, oldVal, scope) {
                setDimentions();
            });
            //Here we specify to watch with angular equality instead of reference equality
            scope.$watch("[event.start, event.end, eventWidth, eventLeft]", function (newVal, oldVal, scope) {
                setDimentions();
                if (!calEventHandler.isChanging) {
                    var oldDate = new Date(oldVal[0]); 
                    oldDate.setHours(0, 0, 0, 0);
                    var newDate = new Date(newVal[0]); 
                    newDate.setHours(0, 0, 0, 0);
                    if (newDate.getTime() != oldDate.getTime()) {
                        calController.eventDateChange(scope.event);
                    }
                    dayController.sortDay();
                }
                if ((scope.event.end.getTime() - scope.event.start.getTime()) <= 0) {
                    scope.event.end.setHours(scope.event.start.getHours(), scope.event.start.getMinutes());
                }
            }, true);
            var stepPx = scope.cellHeight * 2 * scope.calendar.editStep;
            $timeout(setupEventChange, 0);
            function setupEventChange() {               
                var parent = elem;
                //let's loop through the DOM to find the element we need!
                while (parent[0].tagName != "CAL-CALENDAR" && parent.length != 0) {
                    parent = parent.parent();
                }
                var dayElements    = parent.find('cal-day');
                var startStartTime = new Date(scope.event.start);
                var startEndTime   = new Date(scope.event.end);

                var clickStart, topStart, topEnd, clickEnd, originParent;

                elem.on('click', function () {
                    if(!scope.event.edit) {
                        if (!isChanged() && scope.onEventClick != undefined && scope.onEventClick.constructor == Function)
                            scope.onEventClick(scope.event);
                    }
                })

                elem.on('mousedown', function (e) {
                    closeTip(); // close hover tip
                    if (scope.event.edit && scope.calendar.type != "list") {
                        calEventHandler.start(scope.event, elem);
                        startStartTime = new Date(scope.event.start);
                        startEndTime   = new Date(scope.event.end);

                        calEventHandler.isChanging = true;
                        originParent = findParentDay(elem);
                        e.preventDefault();

                        clickStart = e.pageY - elem.parent()[0].offsetTop;
                        topStart = elem[0].offsetTop;

                        dayElements.on("mouseenter", mouseenter);
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }
                });


                function findParentDay(elem) {
                    var count = 10;
                    var dayElem = $_(elem)[0];
                    while (count > 0 && dayElem.tagName != "CAL-DAY") {
                        dayElem = $_(dayElem).parent()[0];
                        count--;
                    }
                    if (dayElem.tagName != "CAL-DAY") dayElem = $_(elem).parent()[0];
                    return dayElem;
                }

                function mouseenter(e, b, c, d) {
                    console.log("mouseenter");
                    var destElem = findParentDay(e.target);
                    var srcElem = findParentDay(elem);
                    calEventHandler.dateChange(scope.event, elem, srcElem, destElem);
                }

                function mousemove(e) {
                    elem.addClass("cal-dragging");
                    clickEnd = e.pageY - elem.parent()[0].offsetTop;
                    topEnd = clickEnd - (clickStart - topStart);
                    var pxMoveOffset = topEnd;

                    //var newHour = Math.max(scope.calendar.viewStart, Math.ceil(pxMoveOffset / (stepPx + 0.0)) * scope.calendar.editStep + scope.calendar.viewStart);
                    var newHour = Math.max(scope.startTime, Math.ceil(pxMoveOffset / (stepPx + 0.0)) * scope.calendar.editStep + scope.startTime);


                    //console.log("Mousemove", newHour, eventLength, scope.calendar.viewStart, pxMoveOffset, stepPx, Math.ceil(pxMoveOffset / (stepPx + 0.0)) * scope.calendar.editStep + scope.calendar.viewStart);
                    var eventLength = (scope.event.end.getTime() - scope.event.start.getTime()) / 1000 / 60 / 60;
                    //newHour = Math.min(newHour, scope.calendar.viewEnd - eventLength);
                    newHour = Math.min(newHour, scope.endTime - eventLength);

                    scope.event.start.setHours(Math.floor(newHour));
                    scope.event.start.setMinutes(newHour % 1 * 60);
                    scope.event.end.setTime(scope.event.start.getTime() + (startEndTime.getTime() - startStartTime.getTime()));


                    scope.$apply();
                }

                function isChanged() {
                    return startStartTime.getTime() != scope.event.start.getTime() || startEndTime.getTime() != scope.event.end.getTime();
                }

                function revert() {
                    calEventHandler.isChanging = true;
                    scope.event.start = new Date(startStartTime);
                    scope.event.end = new Date(startEndTime);
                    //scope.$apply();

                    calEventHandler.dateChange(scope.event, elem, null, null);
                    calEventHandler.isChanging = false;
                }

                function mouseup() {
                    closeTip();
                    elem.removeClass("cal-dragging").removeClass("cal-resizing");
                    calEventHandler.isChanging = false;
                    //delete scope.event.startChanging;
                    if (isChanged()) {
                        if (scope.onEventChange != undefined && scope.onEventChange(scope.event, startStartTime, startEndTime) == false) {
                            revert();
                        }
                        else {
                            var oldDate = new Date(calEventHandler.originStart); oldDate.setHours(0, 0, 0, 0);
                            var newDate = new Date(scope.event.start); newDate.setHours(0, 0, 0, 0);
                            if (oldDate.getTime() != newDate.getTime()) {
                                calController.eventDateChange(scope.event);
                            }
                            else {
                                //console.log("fail", oldDate, newDate);
                            }
                        }
                        dayController.sortDay();
                        scope.$apply();
                    }
                    else {
                        if (scope.onEventClick != undefined && scope.onEventClick.constructor == Function)
                            scope.onEventClick(scope.event);
                    }
                    $document.off('mousemove', resizeMousemove);
                    $document.off('mousemove', mousemove);
                    dayElements.off('mouseenter', mouseenter);
                    $document.off('mouseup', mouseup);
                }


                elem.find('label').on('mousedown', function (e) {
                    closeTip();
                    if (scope.event.edit && scope.calendar.type != "list") {
                        calEventHandler.isChanging = true;
                        e.stopPropagation();
                        startY = e.pageY;
                        startEndTime = new Date(scope.event.end);
                        $document.on('mousemove', resizeMousemove);
                        $document.on('mouseup', mouseup);
                    }
                });

                function resizeMousemove(e) {
                    elem.addClass("cal-resizing");


                    var addedHours = Math.ceil((e.pageY - startY) / (stepPx + 0.0)) * scope.calendar.editStep;
                    var startEndHours = startEndTime.getHours() + (startEndTime.getMinutes() / 60);
                    if (startEndHours == 0 && startEndTime > scope.event.start) startEndHours = 24;
                    var totalHours = startEndHours + addedHours;
                    totalHours = Math.max(totalHours, .5);
                    //console.log("resize:", startEndTime.getHours() + (startEndTime.getMinutes() / 60), startEndTime); //startY, e.pageY, stepPx, scope.calendar.editStep, addedHours, startEndTime.getHours() + (startEndTime.getMinutes() / 60), totalHours);
                    
                    console.log("resizeMousemove", addedHours, totalHours, scope.endTime);

                    //if (totalHours <= scope.calendar.viewEnd) {
                    if (totalHours <= scope.endTime) {
                        if (scope.event.end.getHours() == 0 && scope.event.end.getMinutes() == 0 && scope.event.start < scope.event.end && totalHours != 24) {
                            console.log("subtract one day", scope.event.end);
                            scope.event.end.setDate(scope.event.end.getDate() - 1);
                            console.log("subtract one day", scope.event.end);
                        }
                        if (!(scope.event.end.getHours() == 0 && Math.floor(totalHours) == 24)) scope.event.end.setHours(Math.floor(totalHours));
                        //if (startEndHours == 24) scope.event.end.setDate(scope.event.end.getDate() - 1);
    
                        if (scope.event.end.getMinutes() != totalHours % 1 * 60) scope.event.end.setMinutes(totalHours % 1 * 60);
                        scope.$apply();
                    }
                }


                //Hover over events
                var timeout;
                var time = 500;
                elem.on("mouseenter", function (e) {
                    //timeout = $timeout(function(){
                        openTip(e);
                    //}, time);
                });
                elem.on("mouseleave", function (e) {
                    closeTip(e);
                });

                var tip;
                var tipstartX, tipstartY;
                function openTip(e) {
                    
                    //timeout = $timeout(function () {
                        if (scope.event.hoverHtml != undefined) {
                            if (!elem.hasClass("cal-dragging") && !elem.hasClass("cal-resizing")) {
                                tip = angular.element("<div class='cal-calendar-event-tip'>" + scope.event.hoverHtml + "</div>");
                                $document.find('body').eq(0).append(tip);
                                $document.on("mousemove", setTipPosition);
                                tip.css("top", (e.pageY) + "px").css("left", (e.pageX + 10) + "px");
                            }
                        }
                    //}, time);
                }
                function closeTip() {
                    $timeout.cancel(timeout);
                    if (tip != undefined) {
                        tip.off("mouseover", openTip);
                        tip.remove();
                        $document.off("mousemove", setTipPosition);
                    }
                }
                function setTipPosition(e) {
                    if (tip != undefined) {
                        tip.css("top", (e.pageY) + "px").css("left", (e.pageX + 10) + "px");
                    }
                }
            }
        }
    }
}]);

dynamicCal.directive('calHeader', ['$templateCache', function ($templateCache) {

    return {
        restrict: 'E',
        template: "<ng-include src='templateUrl'/> ",  //
        require: ['^calCalendar'],
        scope: {
            //calendar: '=calendar',
            calendar: '=config'
        },
        controller: 'calHeaderCtr',
        link: function (scope, elem, attrs, controller) {
            
        }
    }
}]);

dynamicCal.controller("calHeaderCtr", ["$scope", function ($scope) {
    var contr = this;
    $scope.$watch('calendar', function () { contr.calendar = $scope.calendar; })


    var tempUrl = 'calDefaultHeaderUrl';
    if ($scope.calendar != undefined) {
        var template = $scope.calendar.headerTemplate;
        var templateUrl = $scope.calendar.headerTemplateUrl;
    }

    if (templateUrl == null || templateUrl == undefined || templateUrl == "") {
        if (template == null || template == undefined || template == "") templateUrl = "calHeader.html";
        else {
            $templateCache.put(tempUrl, template);
            templateUrl = tempUrl;
        }
        //scope.templateUrl = tempUrl;
    }
    $scope.templateUrl = templateUrl;

}]);



dynamicCal.directive('calPrevious', function () {
    return {
        require: ['^calHeader'],
        link: function (scope, elem, attrs, controller) {
            elem.on('click', function () {
                controller[0].calendar.prev();
            });
        }
    }
});
dynamicCal.directive('calNext', function () {
    return {
        require: ['^calHeader'],
        link: function (scope, elem, attrs, controller) {
            elem.on('click', function () {
                controller[0].calendar.next();
            });
        }
    }
});
dynamicCal.directive('calToday', function () {
    return {
        require: ['^calHeader'],
        compile: function (el, attrs) {
            console.log("IN COMPILE");
            return function (scope, elem, attrs, controller) {
                console.log("IN LINK");
                elem.on('click', function () {
                    if(!(scope.calendar.today >= scope.calendar.startDate && scope.calendar.today <= scope.calendar.endDate)){
                        console.log("hey");
                        controller[0].calendar.goToToday();
                        scope.$apply();
                    }
                });
                scope.calendar = controller[0].calendar;
            }
        },
        //link: function (scope, elem, attrs, controller) {
        //    console.log("IN LINK");
        //    elem.on('click', function () {
        //        console.log("hey");
        //        controller[0].calendar.goToToday();
        //    });
        //}      
    }
});
dynamicCal.directive('calTitle', function () {
    return {
        require: ['^calHeader'],
        template: "{{ctrl.calendar.title}}",
        link: function (scope, elem, attrs, controller) {
            elem.on('click', function () {
                controller[0].calendar.today();
            });
            scope.ctrl = controller[0];
        }
    }
});

dynamicCal.directive('calViewToggle', function () {
    return {
        require: ['^calHeader'],
        link: function (scope, elem, attrs, controller) {
            scope.calListClasses = attrs.calListClass == undefined ? [] : attrs.calListClass.split(' ');
            scope.calScheduleClasses = attrs.calScheduleClass == undefined ? [] : attrs.calScheduleClass.split(' ');
            elem.on('click', function () {
                console.log("hey", controller[0].calendar);
                if (scope.ctrl.calendar.type == "list") controller[0].calendar.type = "schedule";
                else scope.ctrl.calendar.type = "list";
                scope.$apply();
            });
            scope.ctrl = controller[0];
            scope.$watch('ctrl.calendar.type', function () {

                if (scope.ctrl.calendar.type == 'list') for (var i = 0; i < scope.calListClasses.length; i++) elem.addClass(scope.calListClasses[i]);
                else for (var i = 0; i < scope.calListClasses.length; i++) elem.removeClass(scope.calListClasses[i]);
                if (scope.ctrl.calendar.type == 'schedule') for (var i = 0; i < scope.calScheduleClasses.length; i++) elem.addClass(scope.calScheduleClasses[i]);
                else for (var i = 0; i < scope.calScheduleClasses.length; i++) elem.removeClass(scope.calScheduleClasses[i]);
                console.log("type changed");
            })
        }
    }
});



dynamicCal.directive('calDurrationBtn', function () {
    return {
        require: ['^calHeader'],
        //template: '{{durration}} hey',
        link: function (scope, elem, attrs, controller) {
            var dur = attrs.calDurrationBtn.toLowerCase();
            //console.log(dur);
            if (dur != "week" && dur != "day" && dur != "month") throw "calDurrationBtn must be either 'month', 'week', or 'day'";
            scope.durration = dur;
            console.log("dur", dur, scope.durration);
            scope.$watch('durration', function () { console.log("durration changed", scope.durration, dur); })

            scope.selectedClasses = attrs.calSelectedClass == undefined ? [] : attrs.calSelectedClass.split(' ');

            scope.ctrl = controller[0];
            elem.on('click', function () {
                scope.ctrl.calendar.durration = dur;
                scope.$apply();
            });
            scope.$watch('ctrl.calendar.durration', function () {
                console.log(dur, scope.ctrl.calendar.durration);
                if (scope.ctrl.calendar.durration == dur) for (var i = 0; i < scope.selectedClasses.length; i++) elem.addClass(scope.selectedClasses[i]);
                else for (var i = 0; i < scope.selectedClasses.length; i++) elem.removeClass(scope.selectedClasses[i]);
            })
        }
    }
});




dynamicCal.directive('calWeek', function ($document, calEventHandler, $timeout) {
    return {
        restrict: 'E',
        templateUrl: 'calWeek.html',
        scope: {
            calendar: '=calendar',
            days: '=days',

            onEventClick: '=onEventClick',
            onEventChange: '=onEventChange',
            onTimeSelect: '=onTimeSelect'
        },
        require: ['^calCalendar'],
        controller: 'calWeekCtrl',
        //controller: "calCalendarCtrl",
        link: function (scope, elem, attrs, controller) {
        }
    }
});

dynamicCal.controller('calWeekCtrl', ["$scope", function ($scope) {

    $scope.start = $scope.calendar.viewStart;
    $scope.end = $scope.calendar.viewEnd;

    var dif = $scope.end - $scope.start;
    $scope.down = function () {
        $scope.end = Math.min(24, $scope.end + 1);
        $scope.start = $scope.end - dif;
    }
    $scope.up = function () {
        $scope.start = Math.max(0, $scope.start - 1);
        $scope.end = $scope.start + dif;
    }
}]);

dynamicCal.factory('calDayObject', function () {

    function EventWrapper(event) {
        this.event = event;
        this.location = { left: "0%", width: "100%" };
        this.levelWidth = 1;
    }
    var Day = function (date, isPlaceholder) {
        this.date = new Date(date);
        this.date.setHours(0, 0, 0, 0);
        this.isPlaceholder = isPlaceholder == true;
        this.events = [];
    }

    Day.prototype.setEvents = function (events) {
        if (events == null) this.events = [];
        else {
            this.events = new Array(events.length);
            for (var i = 0; i < events.length; i++) {
                this.events[i] = new EventWrapper(events[i]);
            }
            this.sort();
        }
    }
    Day.prototype.addEvent = function (event) {
        this.events.push(new EventWrapper(event));
    }
    Day.prototype.removeEvent = function (event) {
        var changed = false;
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].event == event) {
                this.events.splice(i, 1);
                changed = true;
                i--;
            }
        }
        if (changed) this.sort();
    }



    function isOverlap(event, otherEvents){
        for (var i=0; i< otherEvents.length; i++) {
            if(event.event.start < otherEvents[i].event.end && event.event.end > otherEvents[i].event.start) return true;
        }
        return false;
    }

    function buildSortLevels(events){
        var levels = [];
        var event, i, j;
        for (i = 0; i < events.length; i++) {
            event = events[i];
            for(j = 0; j < levels.length; j++){
                if (!isOverlap(event, levels[j])) {
                    break;
                }
            }
            (levels[j] || (levels[j] = [])).push(event);
        }    
        return levels;
    }



    var eventCount = 0;
    Day.prototype.sort = function (reorder) {


        if (this.events.length != eventCount) {
            eventCount = this.events.length;
            for (var i = 0; i < this.events.length; i++) {
                this.events[i].tieBreaker = i;
            }
        }



        if (reorder == null) reorder = true;
        if (reorder) {
            this.events.sort(function (a, b) {
                var startDif = a.event.start.getTime() - b.event.start.getTime();
                if (startDif != 0) return startDif;
                var endDif = a.event.end.getTime() - b.event.end.getTime();
                if (endDif != 0) return endDif;
                else return a.tieBreaker - b.tieBreaker;
            });
        }

        var eventList = [].concat(this.events);

        eventList.sort(function (a, b) {
            var aLength = a.event.end.getTime() - a.event.start.getTime();
            var bLength = b.event.end.getTime() - b.event.start.getTime();
            if (aLength != bLength) return bLength - aLength;
            else return a.event.start.getTime() - b.event.start.getTime();
        });


        var levels = buildSortLevels(eventList);

        var k;
        for (var i = levels.length - 2; i >= 0; i--) {
            for (var j = 0; j < levels[i].length; j++) {
                levels[i][j].levelWidth = 1;
                for(k = i + 1; k < levels.length; k++){
                    if (isOverlap(levels[i][j], levels[k])) break;
                }
                levels[i][j].levelWidth = k - i;
            }
        }


        for (var i = 0; i < levels.length; i++) {
            for (var j = 0; j < levels[i].length; j++) {
                levels[i][j].location = {
                    left: ((92 / levels.length * i) + 4) + "%",
                    width: ((92 / levels.length * levels[i][j].levelWidth)) + "%"
                };
            }
        }

        //var col = 0;
        //var cols = [];
        //while (eventList.length > 0) {
        //    cols.push(eventList.splice(0, 1));
        //    var top = cols[col][0].event.start.getTime();
        //    var bottom = cols[col][0].event.end.getTime();
        //    for (var k = 0; k < eventList.length; k++) {
        //        if (eventList[k].event.end.getTime() <= top || eventList[k].event.start.getTime() >= bottom) {
        //            var newEvent = eventList.splice(k, 1)[0];
        //            top = Math.min(top, newEvent.event.start.getTime());
        //            bottom = Math.max(bottom, newEvent.event.end.getTime());
        //            cols[col].push(newEvent);
        //            k--;
        //        }
        //    }
        //}
        //for (var k = 0; k < cols.length; k++) {
        //    for (var l = 0; l < cols[k].length; l++) {
        //        cols[k][l].location = { left: (100 / cols.length * k) + "%", width: (100 / cols.length) + "%" };
        //    }
        //}

    }













    //Day.prototype.sort = function (reorder) {
    //    if(reorder == null) reorder = true;
    //    if (reorder) {
    //        this.events.sort(function (a, b) {
    //            var startDif = a.event.start.getTime() - b.event.start.getTime();
    //            if (startDif != 0) return startDif;
    //            else return a.event.end.getTime() - b.event.end.getTime();
    //        });
    //    }

    //    var eventList = [].concat(this.events);



    //    eventList.sort(function (a, b) {
    //        var aLength = a.event.end.getTime() - a.event.start.getTime();
    //        var bLength = b.event.end.getTime() - b.event.start.getTime();
    //        if (aLength != bLength) return bLength - aLength;
    //        else return a.event.start.getTime() - b.event.start.getTime();
    //    });

    //    var col = 0;
    //    var cols = [];
    //    while(eventList.length > 0){
    //        cols.push(eventList.splice(0, 1));
    //        var top = cols[col][0].event.start.getTime();
    //        var bottom = cols[col][0].event.end.getTime();
    //        for (var k = 0; k < eventList.length; k++) {
    //            if (eventList[k].event.end.getTime() <= top || eventList[k].event.start.getTime() >= bottom) {
    //                var newEvent = eventList.splice(k, 1)[0];
    //                top = Math.min(top, newEvent.event.start.getTime());
    //                bottom = Math.max(bottom, newEvent.event.end.getTime());
    //                cols[col].push(newEvent);
    //                k--;
    //            }
    //        }
    //    }
    //    for (var k = 0; k < cols.length; k++) {
    //        for (var l = 0; l < cols[k].length; l++) {
    //            cols[k][l].location = { left: (100 / cols.length * k) + "%", width: (100 / cols.length) + "%" };
    //        }
    //    }

    //    //*************************************

    //    //var eventList = [].concat(this.events);
    //    //eventList.sort(function (a, b) {
    //    //    var startDif = a.event.start.getTime() - b.event.start.getTime();
    //    //    if (startDif != 0) return startDif;
    //    //    else return a.event.end.getTime() - b.event.end.getTime();
    //    //});

    //    //var rowStart = 0;
    //    //var latest = 0;
    //    //for (var k = 0; k <= eventList.length; k++) {
    //    //    if (k == eventList.length || eventList[k].event.start.getTime() > latest) {
    //    //        var widthPercent = 100 / (k - rowStart);
    //    //        for (var m = rowStart; m < k; m++) {
    //    //            eventList[m].location.width = widthPercent;
    //    //            eventList[m].location.left = (m - rowStart) * widthPercent;
    //    //            eventList[m].location.left = eventList[m].location.left + "%";
    //    //            eventList[m].location.width = eventList[m].location.width + "%";
    //    //        }
    //    //        rowStart = k;
    //    //    }
    //    //    if (k != eventList.length && eventList[k].event.end.getTime() > latest) {
    //    //        latest = eventList[k].event.end.getTime();
    //    //    }
    //    //}
    //}

    return Day;
})

dynamicCal.factory('calEventHandler', ['$rootScope', function ($rootScope) {
    return {
        event: null,
        destDayElem: null,
        srcDayElem: null,
        eventElem: null,
        isChanging: false,
        originElem: null,
        originStart: null,
        originEnd: null,

        dateChange: function (event, eventElem, srcElem, dstElem) {
            console.log("DATE CHANGE!");
            this.event = event;
            this.srcDayElem = srcElem;
            this.eventElem = eventElem;
            this.destDayElem = dstElem;
            $rootScope.$broadcast("CAL-DATE-CHANGE");
        },
        start: function (event, elem) {
            console.log("START!");
            this.originElem = elem;
            this.originStart = new Date(event.start);
            this.originEnd = new Date(event.end);
            this.event = event;
        },
        done: function () {
            console.log("DONE!");
            this.event = null;
            this.destDayElem = null;
            this.srcDayElem = null;
            this.eventElem = null;
            this.isChanging = false;
        }
    }
}])


dynamicCal.filter('numberOfWeeks', function () {
    return function (set, startDate, endDate) {

        var beginning = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - startDate.getDay());
        var end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + (6 - endDate.getDay()))
        var numberOfWeeks = (((end.getTime() - beginning.getTime()) / 1000 / 60 / 60 / 24) + 1) / 7;

        //if (numberOfWeeks == 1) {
        //    beginning = new Date(startDate);
        //    end = new Date(endDate);
        //}

        //weekArray = new Array(numberOfWeeks);
        //var cur = new Date(beginning);
        //for (var i = 0; i < numberOfWeeks; i++){
        //    weekArray[i] = new Array();
        //    for (var j = 0; j < 7 && cur <= end; j++) {
        //        if (cur >= startDate && cur <= endDate) weekArray[i].push(new Date(cur));
        //        else weekArray[i].push(null);
        //    }
        //}
        //return weekArray;








        //if (numberOfWeeks == 1) {
        //    beginning = new Date(startDate);
        //    end = new Date(endDate);
        //}

        //var weekArray = new Array(numberOfWeeks);
        //var cur = new Date(beginning);
        //for (var i = 0; i < numberOfWeeks; i++) {
            
        //    weekArray[i] = new Array(7);
        //    for (var j = 0 ; j < 7; j++) {
        //        weekArray[i][j] = i + " " + j;
        //    }

        //    //for (var j = 0; j < 7 && cur <= end; j++) {
        //    //    if (cur >= startDate && cur <= endDate) weekArray[i].push(2);
        //    //    else weekArray[i].push(-1);
        //    //}
        //    //cur.setDate(cur.getDate() + 1);
        //}
        //return weekArray;




        var array = new Array();
        for (var i = 0 ; i < 4; i++) {
            array.push([2, 3, 4, 5, 6]);
            //array.push(new Array());
            //for (var j = 0; j < 5; j++) {
            //    array[i].push(j);
            //}
        }
        set = array;
        return array;




        //var endWeekEnd = (endDate.getTime() / 1000 / 60 / 60 / 24) + (6 - endDate.getDay());
        //var startWeekStart = (startDate.getTime() / 1000 / 60 / 60 / 24) - startDate.getDay();
        //numberOfWeeks = (endWeekEnd - startWeekStart + 1) / 7;
        
    };
});

dynamicCal.filter('range', function () {
    return function (input, a, b, c) {
        var start = a;
        var end = b;
        var step = c;
        if (c == undefined) step = 1;
        if (b == undefined) {
            start = 0;
            end = a;
        }
        for (var i = start; i < end; i += step)
            input.push(i);
        return input;
    };
});



angular.module('dynamicCal').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('calCalendar.html',
    "<cal-header config=\"config\" ng-show=\"view.showHead\"></cal-header>\r" +
    "\n" +
    "\r" +
    "\n" +
    "<div class=\"cal-calendar\" ng-class=\"[view.type + 'View', view.durration]\">\r" +
    "\n" +
    "\t<cal-week ng-repeat=\"week in view.weeks\" calendar=\"view\" days=\"week\" on-event-click=\"onEventClick\" on-event-change=\"onEventChange\" on-time-select=\"onTimeSelect\"></cal-week>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "\r" +
    "\n"
  );


  $templateCache.put('calDay.html',
    "<div class=\"cal-day-header\">\r" +
    "\n" +
    "\t<div>\r" +
    "\n" +
    "\t\t<span class=\"dayOfWeek\">{{daysOfWeek[date.getDay()]}}</span> <span class=\"month\">{{ (date.getMonth() + 1) + \"/\" }}</span><span class=\"date\">{{date.getDate() }}</span>\r" +
    "\n" +
    "\t</div>\r" +
    "\n" +
    "\t<div>\r" +
    "\n" +
    "\t</div>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "<div class=\"cal-container\">\r" +
    "\n" +
    "\t<div class=\"cal-calendar-grid\">\r" +
    "\n" +
    "\t\t<div ng-repeat=\"i in [] | range:calendar.viewStart:calendar.viewEnd:.5\" ng-class=\"{ 'cal-hourMark' : i % 1 == 0, 'cal-halfHourMark' : i % 1 != 0 }\" ng-style=\"{height: calendar.cellHeight + 'px'}\"></div><!--ng-class=\"i % 1 == 0 ? 'cal-hourMark' : 'cal-halfHourMark'\"></div>-->\r" +
    "\n" +
    "\t</div>\r" +
    "\n" +
	"\t<cal-event popover-placement=\"bottom\" uib-popover-template=\"\'popover.html\'\" popover-popup-delay=\"500\" popover-trigger=\"mouseenter\" ng-repeat=\"event in day.events\" event=\"event.event\" ng-class=\"event.event.class\" calendar=\"calendar\" on-event-change=\"onEventChange\" on-event-click=\"onEventClick\" event-left=\"event.location.left\" event-width=\"event.location.width\" start-time=\"startTime\" end-time=\"endTime\"> \r\n" +
    "\n" +
    "\t</cal-event>\r" +
    "\n" +
    "</div>"
  );
        
  $templateCache.put('calEvent.html',            
    "\r" +
    "\n" +
    "    <div class=\"cal-event-head\">{{ (event.start.getHours() % 12 == 0 ? 12 : event.start.getHours() % 12) + \":\" + (event.start.getMinutes() < 10 ? \"0\" : \"\") + event.start.getMinutes() + \" - \" + (event.end.getHours() % 12 == 0 ? 12 : event.end.getHours() % 12) + \":\" + (event.end.getMinutes() < 10 ? \"0\" : \"\") + event.end.getMinutes() }}</div>\r" +
    "\n" +
    "    <div class=\"cal-event-body\">{{ event.empName }}<br />{{ event.title }}</div>\r" +
    "\n" +
    "    <!--<label ng-show=\"event.edit\" class=\"cal-resize\"></label>-->\r" +
    "\n"
  );


  $templateCache.put('calHeader.html',
    "<div class=\"cal-header\">\r" +
    "\n" +
    "    <h1 cal-title></h1>\r" +
    "\n" +
    "    <div>\r" +
    "\n" +
    "        <div class=\"left\">\r" +
    "\n" +
    "            <button cal-today>Today</button>\r" +
    "\n" +
    "            <button cal-previous>Prev</button>\r" +
    "\n" +
    "            <button cal-next>Next</button>\r" +
    "\n" +
    "        </div>\r" +
    "\n" +
    "        <div class=\"right\">\r" +
    "\n" +
    "            <button cal-view-toggle cal-list-class=\"on\" cal-schedule-class=\"\">List View</button>\r" +
    "\n" +
    "            <button cal-durration-btn=\"month\" cal-selected-class=\"on\">Month</button>\r" +
    "\n" +
    "            <button cal-durration-btn=\"week\" cal-selected-class=\"on\">Week</button>\r" +
    "\n" +
    "            <button cal-durration-btn=\"day\" cal-selected-class=\"on\">Day</button>\r" +
    "\n" +
    "        </div>\r" +
    "\n" +
    "    </div>\r" +
    "\n" +
    "</div>"
  );

  $templateCache.put('calWeek.html',
    " <table>\r" +
    "\n" +
    "\t<tr>\r" +
    "\n" +
    "\t\t<td>\r" +
    "\n" +
    "\t\t\t<div class=\"cal-timelabel\">\r" +
    "\n" +
    "\t\t\t\t<div class=\"cal-day-header\">\r" +
    "\n" +
    "                    <div class=\"cal-down\" ng-click=\"down()\" ng-hide=\"end == 24\"></div>\r" +
    "\n" +
    "                    <div class=\"cal-up\" ng-click=\"up()\" ng-hide=\"start == 0\"></div>\r" +
    "\n" +
    "                </div>\r" +
    "\n" +
    "\t\t\t\t<div class=\"cal-calendar-grid\">\r" +
    "\n" +
    "\t\t\t\t\t<div ng-repeat=\"i in [] | range:start:end:.5\" class=\"{{i%1==0?'cal-hourMark':'cal-halfHourMark'}}\" ng-style=\"{height: calendar.cellHeight + 'px'}\">\r" +
    "\n" +
    "\t\t\t\t\t\t<div>{{ (i+.5)%1 == 0 && (i+.5) != end ? ((i+.5) % 12 == 0 ? \"12\" : (i+.5) % 12) + ((i+.5) >= 12 ? \" pm\" : \" am\") : '' }}</div>\r" +
    "\n" +
    "\t\t\t\t\t</div>\r" +
    "\n" +
    "\t\t\t\t</div>\r" +
    "\n" +
    "\t\t\t</div>\r" +
    "\n" +
    "\t\t</td>\r" +
    "\n" +
    "\t\t<!--<td ng-repeat=\"index in [] | range:(week * 7): Math.min(calendar.days.length, (week * 7) + 7 )\" class=\"cal-day\" ng-class=\"{ 'cal-placeholder' : calendar.days[index].isPlaceholder, 'cal-past' : calendar.days[index].date.getTime() < calendar.today.getTime(), 'cal-today' : calendar.days[index].date.getTime() == calendar.today.getTime() }\">-->\r" +
    "\n" +
    "\t\t<td ng-repeat=\"day in days\" class=\"cal-day\" ng-class=\"{ 'cal-placeholder' : day.isPlaceholder , 'cal-past' : day.date.getTime() < today.getTime(), 'cal-today' : day.date.getTime() == today.getTime() }\">\r" +
    "\n" +
    "\t\t\t<cal-day calendar=\"calendar\" day=\"day\" on-event-click=\"onEventClick\" on-event-change=\"onEventChange\" on-time-select=\"onTimeSelect\" start-time=\"start\" end-time=\"end\"></cal-day>\r" +
    "\n" +
    "\t\t</td>\r" +
    "\n" +
    "\t</tr>\r" +
    "\n" +
    "</table>"
  );

  $templateCache.put('popover.html',
    "<div style='position: relative; display:inline-block;text-align:center;'><strong>{{ event.event.empName }}</strong></br> {{ event.event.title }}</br> {{event.event.start | date : \'h:mm a\'}} to {{event.event.end| date : \'h:mm a\'}} </div>'")

 //  $templateCache.put('popover.html',
	// "<div style='display::inline-block;text-align:center;'><strong>{{ event.event.empName }}</strong></br> {{ event.event.title }}</br> {{event.event.start | date : \'h:mm a\'}} to {{event.event.end| date : \'h:mm a\'}}</div>'");

}]);
