dynamicCal.filter('numberOfWeeks', function () {
    /**
     * @param {Array} set is a set of items
     * @param {Date} startDate is now a depricated argument
     * @param {Date} endDate is now a depricate argument
     * @returns {Array} returns an array to be used in the angular filter
     */
    return function (set, startDate, endDate) {
        var array = new Array();
        for (var i = 0 ; i < 4; i++) {
            array.push([2, 3, 4, 5, 6]);
        }
        set = array;
        return array;        
    };
}); //end number of weeks filter