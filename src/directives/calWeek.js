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
        link: function (scope, elem, attrs, controller) {}
    }
}); //end the calendar week directive 

dynamicCal.controller('calWeekCtrl', ["$scope", function ($scope) {

    $scope.start = $scope.calendar.viewStart;
    $scope.end   = $scope.calendar.viewEnd;

    var dif = $scope.end - $scope.start;
    $scope.down = function () {
        $scope.end   = Math.min(24, $scope.end + 1);
        $scope.start = $scope.end - dif;
    }
    $scope.up = function () {
        $scope.start = Math.max(0, $scope.start - 1);
        $scope.end   = $scope.start + dif;
    }
}]); //end calendar week controler