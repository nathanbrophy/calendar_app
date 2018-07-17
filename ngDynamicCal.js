var dynamicCal = angular.module("dynamicCal", []);

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
        link: function (scope, elem, attrs, controller) {














        }
    }
}]);




dynamicCal.controller('calCalendarCtrl', ["$scope", '$timeout', 'calDayObject', function ($scope, $timeout, calDayObject) {
    if ($scope.config == null) $scope.config = {};
    this.calendar = $scope.config;
    this.onEventChange = $scope.onEventChange;
    this.eventDateChange = function (event) {
        var weeks = $scope.view.weeks;
        if (weeks != undefined) {
            for (var i = 0; i < weeks.length; i++) {
                for (var j = 0; j < weeks[i].length; j++) {
                    weeks[i][j].removeEvent(event);
                    if ($scope.isSameDay(weeks[i][j].date, event.start)) {
                        weeks[i][j].addEvent(event);
                    }
                }
            }
        }
    }



    $scope.count = 0;
    $scope.$watchCollection('events', function (newVal, oldVal) {
        $scope.updateEvents($scope.count);
    }, true);


    $scope.isDate = function (date) {
        return date.constructor === Date;
    }
    $scope.dayEvents = [];
    $scope.lastLength = 0;


    $scope.isSameDay = function (date1, date2) {
        return date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear();
    }

    $scope.updateEvents = function (c) {

        if ($scope.events != undefined) {
            var eventCopy = [].concat($scope.events);

            eventCopy.sort(function (a, b) {
                var startDif = a.start.getTime() - b.start.getTime();
                if (startDif != 0) return startDif;
                else return a.end.getTime() - b.end.getTime();
            });


            var eventIndex = 0;
            var weeks = $scope.view.weeks;
            if (weeks != undefined) {
                for (var i = 0; i < weeks.length; i++) {
                    for (var j = 0; j < weeks[i].length; j++) {
                        if (!weeks[i][j].isPlaceholder) {
                            var events = [];
                            var nextDay = new Date(weeks[i][j].date.getFullYear(), weeks[i][j].date.getMonth(), weeks[i][j].date.getDate() + 1);
                            while (eventIndex < eventCopy.length && eventCopy[eventIndex].start.getTime() < nextDay.getTime()) {
                                if ($scope.isSameDay(eventCopy[eventIndex].start, weeks[i][j].date)) {
                                    events.push(eventCopy[eventIndex]);
                                }
                                eventIndex++;
                            }
                            weeks[i][j].setEvents(events);
                        }
                    }
                }
            }
        }
    }


    var today = new Date();
    today.setHours(0, 0, 0, 0);
    $scope.today = today;

    var config = $scope.config != null ? $scope.config : {};
    if (config.editStep == undefined) config.editStep = .5;
    if (config.viewStart == undefined) config.viewStart = 0;
    if (config.viewEnd == undefined) config.viewEnd = 24;
    if (config.durration == undefined) config.durration = "week";
    if (config.type == undefined) config.type = "schedule";
    if (config.canChangeType == undefined) config.canChangeType = true;
    if (config.date == undefined) config.date = new Date(today);
    if (config.showHead == undefined) config.showHead = true;
    if (config.cellHeight == undefined) config.cellHeight = 20;
    //if (config. == undefined) config. = ;

    config.title = "";
    config.startDate = new Date(today);
    config.endDate = new Date(today);
    config.today = today;
    config.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    config.daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    config.prev = function () {
        this.moveView(-1);
    };
    config.next = function () {
        this.moveView(1);
    };
    config.goToToday = function () {
        console.log(this.today);
        this.changeDate(this.today);
    };
    config.changeDate = function (date) {
        this.date = new Date(date);
        this.load();
    };
    config.moveView = function (multilpier) {
        switch (this.durration) {
            case "month":
                this.date.setDate(1);
                this.date.setMonth(this.date.getMonth() + (1 * multilpier));
                break;
            case "day":
                this.date.setDate(this.date.getDate() + (1 * multilpier));
                break;
            default:
                this.date.setDate(this.date.getDate() + (7 * multilpier));
        }
        this.load();
    };
    config.load = function (durration) {
        if (durration != undefined) this.durration = durration;
        this.days = [];
        this.date.setHours(0, 0, 0, 0);
        var startDate = new Date(this.date);
        var endDate = new Date(this.date);
        switch (this.durration) {
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
        var oldStartDate = this.startDate;
        var oldEndDate = this.endDate;

        this.startDate = startDate;
        this.endDate = endDate;


        console.log("load", startDate, endDate);

        var beginning = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - startDate.getDay());
        var end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + (6 - endDate.getDay()))
        var numberOfWeeks = Math.ceil((((end.getTime() - beginning.getTime()) / 1000 / 60 / 60 / 24)) / 7);

        if (numberOfWeeks == 1) {
            beginning = new Date(startDate);
            end = new Date(endDate);
        }


        weekArray = new Array(numberOfWeeks);
        var cur = new Date(beginning);
        for (var i = 0; i < numberOfWeeks; i++) {
            weekArray[i] = new Array();
            for (var j = 0; j < 7 && cur <= end; j++) {
                weekArray[i].push(new calDayObject(cur, !(cur >= startDate && cur <= endDate)));
                //if (cur >= startDate && cur <= endDate) {
                //    weekArray[i].push({ date: new Date(cur), events: [] });
                //}
                //else weekArray[i].push({ date: -cur.getDate(), events: [] });
                cur.setDate(cur.getDate() + 1);
            }
        }
        this.weeks = weekArray;
        if (numberOfWeeks == this.startDate.getMonth()) {
            window.lastWeeks = window.weeks;
            window.weeks = JSON.stringify(weekArray);
            console.log("=====", weekArray);//startDate, endDate);
        }

        $scope.updateEvents(-1);

        if (oldEndDate.getTime() != this.endDate.getTime() || oldStartDate.getTime() != this.startDate.getTime()) {
            if ($scope.onViewChange != undefined && $scope.onViewChange.constructor == Function) {
                //console.log("TEST", this.endDate, this.startDate);
                var _this = this;
                $timeout(function () {
                    $scope.onViewChange(_this.startDate, _this.endDate);
                }, 0);
            }
        }
        $timeout(function () { $scope.$apply(); });
    };

    $scope.view = config;

    $scope.$watch('[view.viewStart, view.viewEnd, view.durration,view.date.getTime()]', function (n, o) {
        console.log("duration changed", n, o);
        $scope.view.load($scope.view.durration);
    });
    $scope.view.load();

}]);

dynamicCal.directive('calDay', ['$document', 'calEventHandler', function ($document, calEventHandler) {
    return {
        restrict: 'E',
        templateUrl: 'calDay.html',
        //template: ' <div class="cal-day-header">{{ date.getDate() }} - {{events.length}} Events</div> \
        //<div class="cal-container"> \
        //    <div class="cal-calendar-grid"> \
        //        <div ng-repeat="i in [] | range:calendar.viewStart:calendar.viewEnd:.5" ng-class="cal-hourMark : i % 1 == 0, cal-halfHourMark : i % 1 != 0"></div> \
        //    </div> \
        //    <cal-event ng-repeat="event in events" event="event.event" calendar="calendar" on-event-change="onEventChange" on-event-click="onEventClick" event-left="event.location.left" event-width="event.location.width"></cal-event> \
        //</div> \
        //',
        require: ['^calCalendar'],
        scope: {
            calendar: '=calendar',
            //date: '=date',
            //events: '=events',
            day: '=day',
            onEventClick: '=onEventClick',
            onEventChange: '=onEventChange',
            onTimeSelect: '=onTimeSelect',
            startTime: '=startTime',
            endTime: '=endTime'
        },
        controller: 'calDayCtrl',
        link: function (scope, elem, attrs, controller) {
            //console.log("Day");
            var today = new Date(); today.setHours(0, 0, 0, 0);
            if (scope.day.date < today) elem.addClass("cal-past");
            if (scope.day.date.getTime() == today.getTime()) elem.addClass("cal-today");

            //scope.cellHeight = controller[0].cellHeight;
            scope.cellHeight = scope.calendar.cellHeight;
            scope.fullDaysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            scope.daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            var $_ = angular.element;
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


            var startY, startTop, startBottom, overlay;

            function removeOverlay() {
                if (overlay == undefined || overlay.length == 0) overlay = getOverlay()
                overlay.remove();
            }



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

                        startY = e.pageY;
                        startPageTop = startY - e.offsetY;
                        startPageBottom = startPageTop + e.target.offsetHeight;
                        startTop = e.target.offsetTop;
                        startBottom = startTop + e.target.offsetHeight;
                        cellHeight = e.target.offsetHeight;

                        overlay = getOverlay();
                        overlay.css('top', e.target.offsetTop + "px").css('height', e.target.offsetHeight + "px");


                        // Set up events
                        elem.on('mouseup', mouseup);
                        elem.on('mousemove', mousemove);
                        elem.on('mouseout', mouseout);
                    }
                }
            });

            function deleteOverlay() { 
                removeOverlay();
                $document.off('mousedown', deleteOverlay);
            }

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


            function mouseup(e) {
                var start = (overlay[0].offsetTop / cellHeight / 2) + 5;
                var end = start + (overlay[0].offsetHeight / cellHeight / 2);
                var startDate = new Date(scope.date);
                startDate.setHours(0, 0, 0, 0);
                startDate.setHours(Math.floor(start));
                startDate.setMinutes(start % 1 * 60);
                
                var endDate = new Date(startDate);
                endDate.setHours(Math.floor(end));
                endDate.setMinutes(end % 1 * 60);

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
                    try{
                        calEventHandler.event.start.setDate(scope.date.getDate());
                        calEventHandler.event.start.setMonth(scope.date.getMonth());
                        calEventHandler.event.start.setYear(scope.date.getFullYear());
                        calEventHandler.event.end.setDate(scope.date.getDate());
                        calEventHandler.event.end.setMonth(scope.date.getMonth());
                        calEventHandler.event.end.setYear(scope.date.getFullYear());
                        //calEventHandler.event.date.setDate(scope.date.getDate());
                        //calEventHandler.event.date.setMonth(scope.date.getMonth());
                        //calEventHandler.event.date.setYear(scope.date.getFullYear());
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
}]);


dynamicCal.controller("calDayCtrl", ["$scope", function ($scope) {
    $scope.date = $scope.day.date;
    $scope.events = $scope.day.events;
    //console.log($scope.day, $scope.date, $scope.events);
    this.sortDay = function () {
        $scope.day.sort();
    }
}]);
dynamicCal.directive('calEvent', ['$document', '$templateCache', 'calEventHandler', '$timeout', function ($document, $templateCache, calEventHandler, $timeout) {


    var getHeight = function (event, cellHeight) {
        var startHours = event.start.getHours() + event.start.getMinutes() / 60;
        var endHours = event.end.getHours() + event.end.getMinutes() / 60;
        if (endHours == 0 && event.start < event.end) endHours = 24;
        var height = (endHours - startHours) * (2 * cellHeight);
        if (height <= 0) height = cellHeight;  // Min height of cellHeight
        return height;
    }
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

        //templateUrl: 'calEvent.html',
        template: "<div class='cal-event-wrapper'><ng-include src='templateUrl'></ng-include> <label ng-show='event.edit' class='cal-resize'></label></div>",

        link: function (scope, elem, attrs, controllers) {
            //console.log("Event", elem);
            //console.log("Event", scope.onEventChange);
            var $_ = angular.element;
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

                //console.log("SET DIMENTIONS", "height=" + getHeight(scope.event, scope.cellHeight), "top=" + y, "start=" + scope.event.start.getDate() + " " + scope.event.start.getHours() + ":" + scope.event.start.getMinutes(), "end=" + scope.event.end.getDate() + " " + scope.event.end.getHours() + ":" + scope.event.end.getMinutes());
                //if(elem.parent().length > 0)
                //    stepPx = elem.parent()[0].offsetHeight / ((scope.endTime - scope.startTime) / scope.calendar.editStep);// ((scope.calendar.viewEnd - scope.calendar.viewStart) / scope.calendar.editStep);
                elem.css("width", scope.eventWidth);
                elem.css("left", scope.eventLeft);
            }
            scope.$watch("[startTime, endTime]", function (newVal, oldVal) {
                setDimentions();
            });
            scope.$watch("[event.start, event.end, eventWidth, eventLeft]", function (newVal, oldVal) {
                setDimentions();
                if (!calEventHandler.isChanging) {
                    var oldDate = new Date(oldVal[0]); oldDate.setHours(0, 0, 0, 0);
                    var newDate = new Date(newVal[0]); newDate.setHours(0, 0, 0, 0);
                    if (newDate.getTime() != oldDate.getTime()) {
                        calController.eventDateChange(scope.event);
                    }
                    dayController.sortDay();
                }
                // Make 30 minute minimum
                //if ((scope.event.end.getTime() - scope.event.start.getTime()) / 60000 < 30) {
                //    scope.event.end.setHours(scope.event.start.getHours(), scope.event.start.getMinutes() + 30);
                //}
                if ((scope.event.end.getTime() - scope.event.start.getTime()) <= 0) {
                    scope.event.end.setHours(scope.event.start.getHours(), scope.event.start.getMinutes());
                }
            }, true);

            var stepPx = scope.cellHeight * 2 * scope.calendar.editStep;
            console.log("hey");
            $timeout(setupEventChange, 0);
            function setupEventChange() {
                
                var parent = elem;
                while (parent[0].tagName != "CAL-CALENDAR") {
                    parent = parent.parent();
                    if (parent.length == 0) break;
                }

                var dayElements = parent.find('cal-day')
                //var dayElements = parent;
                //if (parent.length == 0) dayElements = parent.find('cal-day')

                var startStartTime = new Date(scope.event.start);
                var startEndTime = new Date(scope.event.end);

                var clickStart, topStart, topEnd, clickEnd;
                var originParent;

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
                        startEndTime = new Date(scope.event.end);

                        calEventHandler.isChanging = true;

                        originParent = findParentDay(elem);


                        e.preventDefault();


                        clickStart = e.pageY - elem.parent()[0].offsetTop;
                        topStart = elem[0].offsetTop;// - elem.parent()[0].offsetTop;

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
