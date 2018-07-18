dynamicCal.filter('range', function () {
    return function (input, startArgv, endArgv, stepArgv) {
        var start = startArgv;
        var end   = endArgv;
        var step  = stepArgv;
        if (stepArgv == undefined) step = 1;
        if (endArgv == undefined) {
            start = 0;
            end = startArgv;
        }
        for (var i = start; i < end; i += step)
            input.push(i);
        return input;
    };
}); //end range filter 