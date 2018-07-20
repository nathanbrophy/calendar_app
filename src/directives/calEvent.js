dynamicCal.directive('calEvent', ['$document', '$templateCache', 'calEventHandler', '$timeout', function ($document, $templateCache, calEventHandler, $timeout) {
    /**
     * @param {EventWrapper} event is the event that we are currently inspecting
     * @param {number} callHeight is the height of a cell in the calendar grid
     * @returns {number} the height of the current event
     */
    var getHeight = function (event, cellHeight) {
        var startHours = event.start.getHours() + event.start.getMinutes() / 60;
        var endHours   = event.end.getHours() + event.end.getMinutes() / 60;
        if (endHours == 0 && event.start < event.end) endHours = 24;
        var height = (endHours - startHours) * (2 * cellHeight); //*2 because we are in half hour incraments
        if (height <= 0) height = cellHeight;  // Min height of cellHeight
        return height;
    }
    /**
     * @param {EventWrapper} event is the event that we are currently inspecting
     * @param {number} cellHeight is the height of a cell in the calendar grid
     * @param {Date} startTime is the date object representing the start time of the cell
     * @returns {number} position of the top of the cell 
     */
    var getTop = function (event, cellHeight, startTime) {
        var startHours = event.start.getHours() + event.start.getMinutes() / 60;
        return (startHours - startTime) * 2 * cellHeight; //*2 because we are in half hour incraments 
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
            var calController = controllers[0]; //calCalendar.js
            var dayController = controllers[1]; //calDay.js
            scope.cellHeight  = calController.calendar.cellHeight;
            scope.templateUrl = "calEvent.html";
            if (calController.calendar.eventTemplateUrl != null) scope.templateUrl = calController.calendar.eventTemplateUrl;
            else if (calController.calendar.eventTemplate != null) {
                var tempUrl = "calEventTemplate";
                $templateCache.put(tempUrl, calController.calendar.eventTemplate);
                scope.templateUrl = tempUrl;
            }
            elem.addClass("cal-event");
            if (scope.event.group != undefined) {
                elem.addClass("cal-group-" + (scope.event.group % 20));
            }
            var startY = 0, y = 0;
            var stepPx = scope.cellHeight * 2 * scope.calendar.editStep; //*2 because we are in half hour incraments
            /**
             * Set the dimentions of the curent event to fit nicely in our calendar grid, and display with the correct height
             */
            function setDimentions() {
                y = getTop(scope.event, scope.cellHeight, scope.startTime); 
                elem.css("height", getHeight(scope.event, scope.cellHeight) + "px"); 
                elem.css("top", y + "px");
                stepPx = 2 * scope.cellHeight * scope.calendar.editStep; //*2 because we are in half hour incraments
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
            $timeout(setupEventChange, 0);
            function setupEventChange() {               
                var parent = elem;
                //let's bubble up through the DOM to find the element we need! Length check comes first so we avoid a null reference error
                while (parent.length != 0 && parent[0].tagName != "CAL-CALENDAR") {
                    parent = parent.parent();
                }
                var dayElements     = parent.find('cal-day');
                var originStartTime = new Date(scope.event.start); //control to track the original state of the event object
                var originEndTime   = new Date(scope.event.end);   //control to track the original state of the event object

                var clickStart, topStart, topEnd, clickEnd, originParent;

                elem.on('click', function () {
                    if(!scope.event.edit) {
                        if (!isChanged() && scope.onEventClick != undefined && scope.onEventClick.constructor == Function) {
                            scope.onEventClick(scope.event);
                        }
                    }
                });
                /**
                 * @param {MouseEvent} e is the mouse event object coming in from the click
                 * First we close the tip popup, then get everything set up so the calendar event can be resized.
                 */
                elem.on('mousedown', function (e) {
                    closeTip(); // close hover tip
                    if (scope.event.edit && scope.calendar.type != "list") {
                        calEventHandler.start(scope.event, elem);
                        originStartTime = new Date(scope.event.start);
                        originEndTime   = new Date(scope.event.end);

                        calEventHandler.isChanging = true;
                        originParent = findParentDay(elem);
                        e.preventDefault();

                        clickStart = e.pageY - elem.parent()[0].offsetTop;
                        topStart   = elem[0].offsetTop;

                        dayElements.on("mouseenter", mouseenter);
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }
                });
                /**
                 * @param {DOMelem} elem is a DOM element that we use the angular element attribute to find the parent calendar day element 
                 * @returns {DOMelem} the parent element that is a calendar day of an element 
                 * Since these events are coming in from our clicks, we need to bubble up through the DOM to find the parent element to see any noticeable changes we make
                 */
                function findParentDay(elem) {
                    var count = 0;
                    var parent = $_(elem)[0];
                    while (count < 10 && parent.tagName != "CAL-DAY") { //count < 10 because that is the deepest layer we can get with the calendar 
                        parent = $_(parent).parent()[0];
                        count++;
                    }
                    return parent.tagName == "CAL-DAY" ? parent : $_(elem).parent()[0];
                }
                /**
                 * @returns {Boolean} whether or not the event that moved or was edited was changed or dragged back to its original spot.  
                 */
                function isChanged() {
                    return originStartTime.getTime() != scope.event.start.getTime() || originEndTime.getTime() != scope.event.end.getTime();
                }
                /**
                 * This is a function to revert an event back to the original before the move. 
                 * Using the global controls originStartTime and originEndTime that track the event's original state. 
                 */
                function revert() {
                    calEventHandler.isChanging = true;
                    scope.event.start = new Date(originStartTime);
                    scope.event.end   = new Date(originEndTime);

                    calEventHandler.dateChange(scope.event, elem, null, null);
                    calEventHandler.isChanging = false;
                }
                /**
                 * @param {MouseEvent} e is the mouse event object coming in 
                 * @param b is now deprecated, but kept for cross platform support
                 * @param c is now deprecated, but kept for cross platform support
                 * @param d is now deprecated, but kept for cross platform support
                 * This function handles when we are dragging an event to a new time and we move it left or right to change the date of the event.
                 */
                function mouseenter(e, b, c, d) {
                    var destElem = findParentDay(e.target); //find the parent of the element the mouse entered
                    var srcElem  = findParentDay(elem);      //find the parent of the element the mouse is dragging 
                    calEventHandler.dateChange(scope.event, elem, srcElem, destElem); //update the event to have the new date 
                }
                /**
                 * @param {MouseEvent} e is the mouseevent object coming in 
                 * This function is meant to handle what happens when we click and drag the calendar event around the screen.
                 */
                function mousemove(e) {
                    elem.addClass("cal-dragging");
                    clickEnd = e.pageY - elem.parent()[0].offsetTop;
                    topEnd   = clickEnd - (clickStart - topStart);
                    var newHour     = Math.max(scope.startTime, Math.ceil(topEnd / stepPx) * scope.calendar.editStep + scope.startTime);
                    var eventLength = (scope.event.end.getTime() - scope.event.start.getTime()) / 1000 / 60 / 60; //time in ms / ms / s / m
                    newHour = Math.min(newHour, scope.endTime - eventLength);
                    scope.event.start.setHours(Math.floor(newHour));
                    scope.event.start.setMinutes(newHour % 1 * 60); //%1 to isolate the decimal part of the float
                    scope.event.end.setTime(scope.event.start.getTime() + (originEndTime.getTime() - originStartTime.getTime()));
                    scope.$apply();
                }
                /**
                 * This function handles what happens when we let go of the mouse left click, and applies our changes made to the event, after closing the popup tip.
                 */
                function mouseup() {
                    closeTip();
                    elem.removeClass("cal-dragging").removeClass("cal-resizing"); //mark the calendar event as done being moved.
                    calEventHandler.isChanging = false; 
                    if (isChanged()) {
                        if (scope.onEventChange != undefined && scope.onEventChange(scope.event, originStartTime, originEndTime) == false) {
                            revert(); //in this case nothing was really changed, so we revert the event back to how it was before editing.  
                        }
                        else { //Here things were changed with the event, so we go ahead and prep the changes! 
                            var oldDate = new Date(calEventHandler.originStart); 
                            oldDate.setHours(0, 0, 0, 0);
                            var newDate = new Date(scope.event.start); 
                            newDate.setHours(0, 0, 0, 0);
                            if (oldDate.getTime() != newDate.getTime()) { //Change the event date! 
                                calController.eventDateChange(scope.event);
                            }
                        }
                        dayController.sortDay();
                        scope.$apply(); //apply the schanges to the scope to save everything! 
                    }
                    else {
                        if (scope.onEventClick != undefined && scope.onEventClick.constructor == Function) {
                            scope.onEventClick(scope.event);
                        }
                    }
                    $document.off('mousemove', resizeMousemove);
                    $document.off('mousemove', mousemove);
                    dayElements.off('mouseenter', mouseenter);
                    $document.off('mouseup', mouseup);
                } //end mouseUp

                elem.find('label').on('mousedown', function (e) {
                    closeTip();
                    if (scope.event.edit && scope.calendar.type != "list") {
                        calEventHandler.isChanging = true;
                        e.stopPropagation();
                        startY = e.pageY;
                        originEndTime = new Date(scope.event.end);
                        $document.on('mousemove', resizeMousemove);
                        $document.on('mouseup', mouseup);
                    }
                });
                /**
                 * @param {MouseEvent} e is the mouse event object coming in 
                 * Function to handle what to do when we click the top or bottom of the calendar event to shrink or grow the event.
                 * We change the hours of the event dynamically depending on where the mouse is on the screen with respect to the origin position
                 */
                function resizeMousemove(e) {
                    elem.addClass("cal-resizing");
                    var addedHours = Math.ceil((e.pageY - startY) / stepPx) * scope.calendar.editStep;
                    var startEndHours = originEndTime.getHours() + (originEndTime.getMinutes() / 60);
                    if (startEndHours == 0 && originEndTime > scope.event.start) startEndHours = 24;
                    var totalHours = startEndHours + addedHours;
                    totalHours = Math.max(totalHours, .5);
                    if (totalHours <= scope.endTime) {
                        if (scope.event.end.getHours() == 0 && scope.event.end.getMinutes() == 0 && scope.event.start < scope.event.end && totalHours != 24) {
                            scope.event.end.setDate(scope.event.end.getDate() - 1);
                        }
                        if (!(scope.event.end.getHours() == 0 && Math.floor(totalHours) == 24)) scope.event.end.setHours(Math.floor(totalHours));    
                        if (scope.event.end.getMinutes() != totalHours % 1 * 60) scope.event.end.setMinutes(totalHours % 1 * 60);
                        scope.$apply();
                    }
                }
                //Hover over events
                //The tip is the little pop up box that appears when the mouse enters an event that gives a short description of it. 
                var timeout;
                var time = 500;
                elem.on("mouseenter", function (e) {
                    openTip(e);
                });
                elem.on("mouseleave", function (e) {
                    closeTip(e);
                });
                var tip, tipstartX, tipstartY;
                /**
                 * This is a function that handles displaying the tip which is a small description of the event that pops up on mouseenter.
                 * @param {Event} e is the event object coming in 
                 * @see setTipPosition
                 */
                function openTip(e) {
                    if (scope.event.hoverHtml != undefined) {
                        if (!elem.hasClass("cal-dragging") && !elem.hasClass("cal-resizing")) { //make sure we aren't moving the event around
                            tip = $_("<div class='cal-calendar-event-tip'>" + scope.event.hoverHtml + "</div>");
                            $document.find('body').eq(0).append(tip);
                            $document.on("mousemove", setTipPosition);
                            setTipPosition(e);
                        }
                    }
                }
                /**
                 * Function to remove the tip popup from the event display when the mouse leaves the event body.
                 */
                function closeTip() {
                    $timeout.cancel(timeout);
                    if (tip != undefined) {
                        tip.off("mouseover", openTip);
                        tip.remove();
                        $document.off("mousemove", setTipPosition);
                    }
                }
                /**
                 * @param {Event} e is the event object coming in 
                 * Function to set the position of the tip popup display.
                 */
                function setTipPosition(e) {
                    if (tip != undefined) {
                        tip.css("top", (e.pageY) + "px").css("left", (e.pageX + 10) + "px");
                    }
                }
            }
        }
    }
}]); //end calEvent directive 