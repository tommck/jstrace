/// <reference path="../jquery-1.7.1.js" />
/// <reference path="../Trace.js" />
/// <reference path="../MicrosoftAjax.js" />

/*global Trace, jQuery */
(function (global, undefined) {
    "use strict";

    var _tracer = new Trace('TestModule');

    // add to global
    global.TestModule = function () {
        return {
            foo: function () {
                for (var key in Trace.Levels) {
                    if (key !== 'off') { // can't use off
                        var tmpKey = key;
                        if (Trace.Levels.hasOwnProperty(tmpKey) === true) {
                            _tracer[tmpKey]('testing:', tmpKey);
                        }
                    }
                }
            }
        };
    };
} (this));
