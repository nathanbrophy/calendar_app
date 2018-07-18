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
                /*
                 * Here we set the hours to the floor of the time and the minutes to time % 1 * 60 for the following reason:
                 * Say we have 5.5 as our time, that's 5 hours and 30 minutes, so floor(5.5) -> 5 which we set for the hours, and
                 * 5.5 % 1 -> .5 so .5 * 60 -> 30 which is what we set for the minutes. 
                 */
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
    this.sortDay = function () {
        $scope.day.sort();
    }
}]); //end cal day conroller