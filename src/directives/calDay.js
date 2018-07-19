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
            if (scope.day.date < today) {
                elem.addClass("cal-past");
            }
            if (scope.day.date.getTime() == today.getTime()) {
                elem.addClass("cal-today");
            }
            scope.cellHeight     = scope.calendar.cellHeight;
            scope.fullDaysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            scope.daysOfWeek     = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            /**
             * @returns {JQueryObj} the array representing the overlay as a JQuery or JQlite objecct, or empty if no matching elements
             */
            function getOverlay() {
                var allLabels = elem.find('label');
                for (var i = 0; i < allLabels.length; i++) {
                    var current_label = $_(allLabels[i]);
                    if(current_label.hasClass("cal-overlay")) {
                        return current_label;
                    }
                }
                var allDivs = elem.find('div');
                for (var i = 0; i < allDivs.length; i++) {
                    var current_div = $_(allDivs[i]);
                    if (current_div.hasClass("cal-container")) {
                        var overlay = $_('<label class="cal-overlay" ></label>');
                        current_div.prepend(overlay);
                        return overlay;
                    }
                }
                return [];
            }
            var startY, startTop, startBottom, overlay;
            /**
             * If there is no overlay currently, then we get the overlay to avoid a null error.
             * The overlay is then removed via its remove method.
             */
            function removeOverlay() {
                if (overlay == undefined || overlay.length == 0) {
                    overlay = getOverlay();
                }
                overlay.remove();
            }
            /**
             * @param {MouseEvent} e is the mouse event object 
             * This method is registered to the event where we move the event selection out of the current date and into one on the left or right. 
             * Then we remove the current overlay and unbind/kill the current mouse event handlers.
             */
            function mouseout(e) {        
                var targetContainer = $_(e.relatedTarget); // Get Container where mouse moved to
                for (var depth = 0; depth < 10 && !targetContainer.hasClass("cal-container") ; depth++) {
                    targetContainer = targetContainer.parent();
                }
                // Get Initial container
                var overlayContainer = overlay.parent();
                // If mouse moved out of initial container remove overlay
                if (!overlayContainer[0].isSameNode(targetContainer[0])) {
                    //remove the overlay and unbind the mouse event functions
                    removeOverlay();
                    elem.off('mouseup', mouseup);
                    elem.off('mousemove', mousemove);
                    elem.off('mouseout', mouseout);
                }
            }
            var startPageTop, startPageBottom, cellHeight;
            /**
             * @see deleteOverlay
             */
            elem.on('mousedown', function (e) {
                deleteOverlay();
                if (scope.onTimeSelect != undefined && scope.onTimeSelect.constructor == Function) {
                    var target = $_(e.target);
                    //The following creates the shaded overlay we see when we drag the mouse down the day times to create an event
                    if (target.hasClass('cal-hourMark') || target.hasClass('cal-halfHourMark')) {
                        startY          = e.pageY;
                        cellHeight      = e.target.offsetHeight;
                        startPageTop    = startY - e.offsetY;
                        startPageBottom = startPageTop + cellHeight;
                        startTop        = e.target.offsetTop;
                        startBottom     = startTop + cellHeight;
                        
                        overlay = getOverlay();
                        overlay.css('top', e.target.offsetTop + "px").css('height', e.target.offsetHeight + "px");
                        // Register mouse events
                        elem.on('mouseup', mouseup);
                        elem.on('mousemove', mousemove);
                        elem.on('mouseout', mouseout);
                    }
                }
            });
            /**
             * @see removeOverlay
             * Remove the current overlay and then unbind/kill the deleteoverlay function from the mousedown event
             */
            function deleteOverlay() { 
                removeOverlay();
                $document.off('mousedown', deleteOverlay);
            }
            /** 
             * @param {MouseEvent} e is the mouse event that comes in when there is a mouse movement
             * When we are selecting a time from the calendar to create an event, this method changes the overlay height to follow the mouse.
             * It defaults to selecting the half-hour or hour-mark the mouse is currently in.
             */ 
            function mousemove(e) {
                var overlayHeight, overlayTop;
                if (e.pageY >= startPageTop) {
                    overlayHeight = Math.ceil((e.pageY - startPageTop) / scope.cellHeight) * scope.cellHeight;
                    overlayTop    = startTop;
                }
                else {
                    overlayHeight = Math.ceil((startPageBottom - e.pageY) / cellHeight) * cellHeight;
                    overlayTop    = startBottom - overlayHeight;
                }
                overlay.css('top', overlayTop + "px").css('height', overlayHeight + "px");
            }
            /** 
             * @param {MouseEvent} e is the mouse event that comes in when there is a mouse movement
             * We moved the event, so now we need to save these changes.
             */ 
            function mouseup(e) {
                var start = (overlay[0].offsetTop / cellHeight / 2) + 5;
                var end   = start + (overlay[0].offsetHeight / cellHeight / 2);
                /*
                 * Here we set the hours to the floor of the time and the minutes to time % 1 * 60 for the following reason:
                 * Say we have 5.5 as our time, that's 5 hours and 30 minutes, so floor(5.5) -> 5 which we set for the hours, and
                 * 5.5 % 1 -> .5 so .5 * 60 -> 30 which is what we set for the minutes. 
                 */
                var startHours   = Math.floor(start);
                var startMinutes = start % 1 * 60;
                var endHours     = Math.floor(end);
                var endMinutes   = end % 1 * 60;

                var startDate = new Date(scope.date); //create a deep copy of the start date
                startDate.setHours(startHours, startMinutes, 0, 0);
                
                var endDate = new Date(startDate);
                endDate.setHours(endHours, endMinutes);

                if (scope.onTimeSelect != undefined && scope.onTimeSelect.constructor == Function) {
                    scope.onTimeSelect(startDate, endDate);
                }
                // Register event hanlders 
                elem.off('mouseup', mouseup);
                elem.off('mousemove', mousemove);
                elem.off('mouseout', mouseout);
                $document.on('mousedown', deleteOverlay);
            }
            scope.$on("CAL-DATE-CHANGE", function () {
                if ($_(elem)[0] == $_(calEventHandler.destDayElem)[0]) {
                    try{ //try to update the calendar from the date change
                        calEventHandler.event.start.setDate(scope.date.getDate());
                        calEventHandler.event.start.setMonth(scope.date.getMonth());
                        calEventHandler.event.start.setYear(scope.date.getFullYear());
                        calEventHandler.event.end.setDate(scope.date.getDate());
                        calEventHandler.event.end.setMonth(scope.date.getMonth());
                        calEventHandler.event.end.setYear(scope.date.getFullYear());
                    }
                    catch (ex) {
                        console.log("Error in changing the calendar date: ", ex);
                    }
                    var divs = $_(calEventHandler.destDayElem).find('div');
                    var i    = 0;
                    var done = false;
                    while (!done && i < divs.length) {
                        var cur = $_(divs[i]);
                        if (cur.hasClass('cal-container')) {
                            cur.append(calEventHandler.eventElem);
                            done = true;
                        } else {
                            i++;
                        }
                    }
                }
            });
        }
    };
}]); //end call day directive

dynamicCal.controller("calDayCtrl", ["$scope", function ($scope) {
    $scope.date   = $scope.day.date;
    $scope.events = $scope.day.events;
    this.sortDay  = function () {
        $scope.day.sort();
    }
}]); //end cal day conroller