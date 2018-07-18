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
    "<div style='position: relative; display:inline-block;text-align:center;'><strong>{{ event.event.empName }}</strong></br> {{ event.event.title }}</br> {{event.event.start | date : \'h:mm a\'}} to {{event.event.end| date : \'h:mm a\'}} </div>'");
}]);