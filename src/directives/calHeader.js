dynamicCal.directive('calHeader', ['$templateCache', function ($templateCache) {
    return {
        restrict: 'E',
        template: "<ng-include src='templateUrl'/> ",  
        require: ['^calCalendar'],
        scope: {
            calendar: '=config'
        },
        controller: 'calHeaderCtr',
        link: function (scope, elem, attrs, controller) {}
    }
}]); //end calHeader directive 

dynamicCal.controller("calHeaderCtr", ["$scope", function ($scope) {
    var contr = this;
    $scope.$watch('calendar', function () { 
        contr.calendar = $scope.calendar; 
    });

    var tempUrl = 'calDefaultHeaderUrl';
    if ($scope.calendar != undefined) {
        var template    = $scope.calendar.headerTemplate;
        var templateUrl = $scope.calendar.headerTemplateUrl;
    }

    if (!templateUrl) {
        if (!template) { 
            templateUrl = "calHeader.html";
        }
        else {
            $templateCache.put(tempUrl, template);
            templateUrl = tempUrl;
        }
    }
    $scope.templateUrl = templateUrl;
}]); //end calendar header controller

dynamicCal.directive('calPrevious', function () { //directive to handle the previous arrow in the calendar header
    return {
        require: ['^calHeader'],
        link: function (scope, elem, attrs, controller) {
            elem.on('click', function () {
                controller[0].calendar.prev();
            });
        }
    }
}); //end calPrevious directive

dynamicCal.directive('calNext', function () { //directive to handle the next arrow in the calendar header
    return {
        require: ['^calHeader'],
        link: function (scope, elem, attrs, controller) {
            elem.on('click', function () {
                controller[0].calendar.next();
            });
        }
    }
}); //end calNext directive

dynamicCal.directive('calToday', function () { //directive to handle the today button in the calendar header
    return {
        require: ['^calHeader'],
        compile: function (el, attrs) {
            return function (scope, elem, attrs, controller) {
                elem.on('click', function () {
                    if(!(scope.calendar.today >= scope.calendar.startDate && scope.calendar.today <= scope.calendar.endDate)){
                        controller[0].calendar.goToToday();
                        scope.$apply();
                    }
                });
                scope.calendar = controller[0].calendar;
            }
        },    
    }
}); //end calToday directive

dynamicCal.directive('calTitle', function () { //directive to handle the title display in the calendar header 
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
}); //end calTitle directive 

dynamicCal.directive('calViewToggle', function () {
    return {
        require: ['^calHeader'],
        link: function (scope, elem, attrs, controller) {
            scope.calListClasses     = attrs.calListClass == undefined ? [] : attrs.calListClass.split(' ');
            scope.calScheduleClasses = attrs.calScheduleClass == undefined ? [] : attrs.calScheduleClass.split(' ');
            elem.on('click', function () {
                if (scope.ctrl.calendar.type == "list") controller[0].calendar.type = "schedule";
                else scope.ctrl.calendar.type = "list";
                scope.$apply();
            });
            scope.ctrl = controller[0];
            scope.$watch('ctrl.calendar.type', function () {
                if (scope.ctrl.calendar.type == 'list') { 
                    for (var i = 0; i < scope.calListClasses.length; i++) {
                        elem.addClass(scope.calListClasses[i]);
                    }
                }
                else {
                    for (var i = 0; i < scope.calListClasses.length; i++) {
                        elem.removeClass(scope.calListClasses[i]);
                    }
                }
                if (scope.ctrl.calendar.type == 'schedule') {
                    for (var i = 0; i < scope.calScheduleClasses.length; i++) {
                        elem.addClass(scope.calScheduleClasses[i]);
                    }
                }
                else {
                    for (var i = 0; i < scope.calScheduleClasses.length; i++) {
                        elem.removeClass(scope.calScheduleClasses[i]);
                    }
                }
            });
        }
    }
});//end calendar view toggle directive

dynamicCal.directive('calDurrationBtn', function () {
    return {
        require: ['^calHeader'],
        link: function (scope, elem, attrs, controller) {
            var dur = attrs.calDurrationBtn.toLowerCase();
            if (dur != "week" && dur != "day" && dur != "month") { //This should never happen, but it's the case that our calendar has an invalid duration set
                throw "calDurrationBtn must be either 'month', 'week', or 'day'";
            }
            scope.durration = dur;
            scope.$watch('durration', function () { console.log("durration changed", scope.durration, dur); })

            scope.selectedClasses = attrs.calSelectedClass == undefined ? [] : attrs.calSelectedClass.split(' ');

            scope.ctrl = controller[0];
            elem.on('click', function () {
                scope.ctrl.calendar.durration = dur;
                scope.$apply();
            });
            scope.$watch('ctrl.calendar.durration', function () {
                if (scope.ctrl.calendar.durration == dur) {
                    for (var i = 0; i < scope.selectedClasses.length; i++) {
                        elem.addClass(scope.selectedClasses[i]);
                    }
                }
                else {
                    for (var i = 0; i < scope.selectedClasses.length; i++) {
                        elem.removeClass(scope.selectedClasses[i]);
                    }
                }
            });
        }
    }
}); //end cal durration button directive