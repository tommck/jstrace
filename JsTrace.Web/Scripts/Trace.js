/*!
* jsTrace - v1.5 - 11/24/2014
* http://tommck.github.io/jstrace
*
* Copyright (c) 2011-2104 Tom McKearney (thomas.mckearney@appliedis.com)
* Dual licensed under the MIT and GPL licenses.
*
* Internals are based on the 'ba-debug' project by Ben Alman
* http://benalman.com/projects/javascript-debug-console-log/
* 
* ORIGINAL Copyright notice is below 
*
* JavaScript Debug - v0.4 - 6/22/2010
* http://benalman.com/projects/javascript-debug-console-log/
* 
* Copyright (c) 2010 "Cowboy" Ben Alman
* Dual licensed under the MIT and GPL licenses.
* http://benalman.com/about/license/
* 
* With lots of help from Paul Irish!
* http://paulirish.com/
*/
(function (global, undefined) {
    "use strict";
    // private, shared members go here.
    var _levels = ['off', 'error', 'warn', 'info', 'debug', 'log'],
        _passThroughMethods = ['assert', 'clear', 'count', 'dir', 'dirxml',
            'exception', 'group', 'groupCollapsed', 'groupEnd', 'profile',
            'profileEnd', 'table', 'time', 'timeEnd', 'trace'],
        _traceLevels = {},
        _logMessages = [], // array for all the log messages
        _maxLogLength = 1000,
        _defaultTraceLevel = 1, // error
        _callbackFunc, // call for every log message (and all previous ones)
        _callbackForce = false, // always use callback?
        _con = global && global.console;

    // Declare the base object here
    var Trace = function (module, opts) {
        /// <summary>
        ///     Class for switched diagnostic information
        /// <para>(Must be created with "new" syntax)</para>
        /// <para>Provides the following logging methods:</para>
        /// <para> - error()</para>
        /// <para> - warn()</para>
        /// <para> - info()</para>
        /// <para> - debug()</para>
        /// <para> - log()</para>
        /// <para>Switch Level is changed by calling: </para>
        /// <para> - Trace.traceLevel([moduleName], Trace.Levels.[level])</para>
        /// </summary>
        /// <param name="module" mayBeNull="false" optional="false">
        ///     The module name
        /// </param>
        /// <param name="opts" optional="true">
        ///     Options variable (currently unused)
        /// </param>

        if (!(this instanceof Trace)) {
            throw new Error('Trace object must be initialised with the "new" keyword.');
        }

        if (typeof module === 'undefined') {
            throw new Error('You must pass the module name');
        }

        // add the passthrough methods here
        _createPassthroughMethods(module, this);

        // add the level-specific methods here.
        _createLevelMethods(module, this);

        return this;
    };

    // declare public static Methods
    Trace.defaultLevel = function (newLevel) {
        /// <summary>
        ///     set or get the default Trace Level for all modules.
        /// </summary>
        /// <param name="newLevel" mayBeNull="true" optional="true" type="Trace.Levels">
        ///     the level to set
        /// </param>
        /// <signature>
        ///     <summary>Gets the current Default Trace Level</summary>
        ///     <returns type="Trace.Levels" />
        /// </signature>
        /// <signature>
        ///     <summary>Sets the current Default Trace Level</summary>
        ///         <param name="newLevel" type="Trace.Levels|String">
        ///             the level to set
        ///         </param>
        ///         <returns type="undefined"/>
        /// </signature>
        if (newLevel !== undefined) {
            if (newLevel === null) {
                throw new Error('null is an invalid trace level');
            }
            // it's a setter
            _defaultTraceLevel = coerceTraceLevel(newLevel);
        }
        else {
            return _defaultTraceLevel;
        }
    };

    Trace.traceLevel = function (module, newLevel, asString) {
        /// <summary>
        ///     set or get the Trace Level for a particular module
        /// </summary>
        /// <param name="module" type="string" mayBeNull="false" optional="false">
        ///     The module in question
        /// </param>
        /// <param name="newLevel" mayBeNull="true" optional="true" type="Trace.Levels">
        ///     the level to set
        /// </param>
        /// <param name="asString" mayBeNull="true" optional="true" type="Boolean">
        ///     whether or not to return the value as a string
        /// </param>
        /// <returns type="Trace.Levels|String|undefined">
        ///     the current Level for the module, or nothing, if newLevel is defined
        /// </returns>
        /// <signature>
        ///     <summary>Gets the current TraceLevel</summary>
        ///         <param name="module" type="string" mayBeNull="false" optional="false">
        ///             The module whose Trace Level we're getting
        ///         </param>
        ///         <param name="asString" mayBeNull="true" optional="true" type="Boolean">
        ///             whether or not to return the value as a string
        ///         </param>
        ///     <returns type="Trace.Levels|String" />
        /// </signature>
        /// <signature>
        ///     <summary>Sets the value</summary>
        ///         <param name="module" type="string" mayBeNull="false" optional="false">
        ///             The module whose Trace Level we're setting
        ///         </param>
        ///         <param name="newLevel" type="Trace.Levels|String">
        ///             the level to set
        ///         </param>
        ///         <returns type="undefined"/>
        /// </signature>


        // the parameters are declared just so we can get nice intellisense.
        // since we have alternate signatures, we process the params for real, here:
        var args = Array.prototype.slice.call(arguments);
        module = args.shift();
        newLevel = undefined;
        asString = false;

        if (args.length > 0) {
            if (typeof args[0] === 'boolean') {
                asString = args.shift();
            }
            else {
                newLevel = args.shift();
            }
        }
        if (newLevel === undefined) {
            // return the current level or _defaultTraceLevel if it's not set
            var numeric = _traceLevels[module] !== undefined ?
                _traceLevels[module] : _defaultTraceLevel;

            if (asString === true) {
                return _levels[numeric];
            }
            return numeric;
        }
        _traceLevels[module] = coerceTraceLevel(newLevel);
    };

    Trace.shouldTrace = function (module, level) {
        /// <summary>
        ///     Returns whether or not tracing should be happening for a particular module
        ///     and level based on the current settings.
        ///     <para>
        ///         Mostly used for filtering messages in the callback from the outside.
        ///     </para>
        /// </summary>
        /// <param name="module" type="string" mayBeNull="false" optional="false">
        ///     The module name.
        /// </param>
        /// <param name="level" mayBeNull="false" optional="false" type="Trace.Levels|string">
        ///     The level of the message to be traced.
        /// </param>
        /// <returns type="Boolean">
        ///     Whether or not messages for that module and level should be logged.
        /// </returns>
        if (typeof module === 'undefined' || module === null) {
            throw new Error('You must pass a module name');
        }
        if (typeof level === 'undefined' || level === null) {
            throw new Error('You must pass a level');
        }
        var levNum = (typeof level === 'number') ? level : _levels.indexOf(level);
        var should = false;
        if (isNaN(levNum) === true) {
            throw new Error('"' + levNum + '" is not a valid Trace Level');
        }
        else {
            var currLevel = Trace.traceLevel(module);
            should = levNum <= currLevel;
        }
        return should;
    };

    Trace.resetToDefault = function (moduleNames) {
        /// <summary>
        /// Resets the specified modules to the default level.  
        /// <para>If no module names are passed, all modules are reset</para>
        /// </summary>
        /// <signature>
        ///     <summary>
        ///         Resets all modules to the default level.  
        ///     </summary>
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Resets the specified module to the default level.  
        ///     </summary>
        ///     <param name="moduleName" optional="false" type="string" mayBeNull="false">
        ///         The Module name to reset
        ///     </param>
        ///     <param name="additionalNames" optional="true" parameterArray="true">
        ///         Additional Module name(s) to be reset
        ///         <para>(just keep adding them w/ commas in between)</para>
        ///     </param>
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Resets the specified modules to the default level.  
        ///     </summary>
        ///     <param name="moduleNames" optional="false" parameterArray="true" elementType="string" elementMayBeNull="false">
        ///         The list of Module names to reset
        ///     </param>
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Resets the specified modules to the default level.  
        ///     </summary>
        ///     <param name="moduleNames" optional="false" parameterArray="true" elementType="string" elementMayBeNull="false">
        ///         The list of Module names to reset
        ///     </param>
        /// </signature>
        if (moduleNames === undefined) {
            // easy, delete them all
            _traceLevels = {};
        }
        else {
            var parmType = typeof moduleNames;
            if (parmType === 'string') {
                // use the arguments collection and get all the strings
                var arr = [].slice.call(arguments);

                for (var i = 0; i < arr.length; i += 1) {
                    delete _traceLevels[arr[i]];
                }
            }
            else if (moduleNames instanceof Array) {
                // delete them all
                for (var j = 0; j < moduleNames.length; j += 1) {
                    var name = moduleNames[j];
                    // TODO: Do I need to bother checking for string/null here?
                    delete _traceLevels[name];
                }
            }
            else {
                throw new Error('Invalid type passed to resetToDefault: ' + parmType);
            }
        }
    };

    Trace.setCallback = function (callback, force, limit) {
        /// <summary>
        ///     Set the callback function for all trace messages in the system
        ///     <para></para>
        ///     <para>signature should look like:</para>
        ///     <para>         fn(module, level, objects)</para>
        ///     <para></para>
        ///     <para>NOTE: This is called for EVERY message, without filtering</para>
        ///     <para>If you need to filter, use Trace.shouldTrace() inside your callback</para>
        /// </summary>
        /// <param name="callback" type="function" mayBeNull="false" optional="true">
        ///     The function to call for each trace message in the system.
        ///     <para>If no callback is passed, the current callback is removed</para>
        /// </param>
        /// <param name="force" type="Boolean" mayBeNull="false" optional="true">
        ///     If false, log to console.log if available, otherwise callback.  
        ///     If true, log to both console.log and callback. 
        /// </param>
        /// <param name="limit" type="Number" integer="true" mayBeNull="false" optional="true">
        ///     If specified, number of lines to limit initial callback to.
        /// </param>
        /// <signature>
        ///     <summary>Clears the callback function</summary>
        /// </signature>
        /// <signature>
        ///     <summary>Sets the callback function for all trace messages</summary>
        ///     <param name="callback" type="function">
        ///         The function to call for each trace message in the system
        ///         <para></para>
        ///         <para>signature should look like:</para>
        ///         <para>         fn(module, level, objects)</para>
        ///         <para></para>
        ///         <para>NOTE: This is called for EVERY message, without filtering</para>
        ///         <para>If you need to filter, use Trace.shouldTrace() inside your callback</para>
        ///     </param>
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Sets the callback function for all trace messages and optionally forces
        ///         all messages through the callback (rather than only console.* methods)
        ///     </summary>
        ///     <param name="callback" type="function">
        ///         The function to call for each trace message in the system
        ///         <para></para>
        ///         <para>signature should look like:</para>
        ///         <para>         fn(module, level, objects)</para>
        ///         <para></para>
        ///         <para>NOTE: This is called for EVERY message, without filtering</para>
        ///         <para>If you need to filter, use Trace.shouldTrace() inside your callback</para>
        ///     </param>
        ///     <param name="force" type="Boolean">
        ///         If false, log to console.log if available, otherwise callback.
        ///         If true, log to both console.log and callback.
        ///     </param>
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Sets the callback function for all trace messages and limits the number of historical
        ///         messages immediately sent
        ///     </summary>
        ///     <param name="callback" type="function">
        ///         The function to call for each trace message in the system
        ///         <para></para>
        ///         <para>signature should look like:</para>
        ///         <para>         fn(module, level, objects)</para>
        ///         <para></para>
        ///         <para>NOTE: This is called for EVERY message, without filtering</para>
        ///         <para>If you need to filter, use Trace.shouldTrace() inside your callback</para>
        ///     </param>
        ///     <param name="limit" type="Number" integer="true">
        ///         If specified, number of lines to limit initial callback to.
        ///     </param>
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Sets the callback function for all trace messages and optionally forces
        ///         all messages through the callback (rather than only console.* methods)
        ///         and limits the number of historical messages immediately sent
        ///     </summary>
        ///     <param name="callback" type="function">
        ///         The function to call for each trace message in the system
        ///         <para></para>
        ///         <para>signature should look like:</para>
        ///         <para>         fn(module, level, objects)</para>
        ///         <para></para>
        ///         <para>NOTE: This is called for EVERY message, without filtering</para>
        ///         <para>If you need to filter, use Trace.shouldTrace() inside your callback</para>
        ///     </param>
        ///     <param name="force" type="Boolean">
        ///         If false, log to console.log if available, otherwise callback.
        ///         If true, log to both console.log and callback.
        ///     </param>
        ///     <param name="limit" type="Number" integer="true">
        ///         If specified, number of lines to limit initial callback to.
        ///     </param>
        /// </signature>

        // the parameters are declared just so we can get nice intellisense.
        // since we have alternate signatures, we process the params for real, here:
        var args = Array.prototype.slice.call(arguments);
        var max = _logMessages.length;
        var func = undefined; // jslint ignore - I like initializing variables!
        if (args.length > 0) {
            func = args.shift();
            if (typeof func !== 'function') {
                var err = new Error();
                err.message = "Argument Is Not a function";
                throw err;
            }
        }
        _callbackFunc = func;
        _callbackForce = typeof args[0] === 'boolean' ? args.shift() : false;

        // get how many items to send now.
        var i = max; // declare iterator to be same as max (meaning: sending 0 messages)
        var numToReturn = max;
        if (typeof args[0] === 'number') {
            numToReturn = Math.max(args.shift(), 0); // making sure we're not negative
        }
        // reduce the index by "numToReturn" 
        i -= numToReturn;

        while (i < max) {
            _executeCallback(_logMessages[i]);
            i += 1;
        }
    };

    Trace.logLength = function (newMax) {
        /// <summary>
        ///     Sets/Gets the maximum log length (default: 1000)
        /// </summary>
        /// <param name="newMax" type="Number" integer="true" mayBeNull="false" optional="false">
        ///     The new maximum number
        /// </param>
        /// <signature>
        ///     <summary>
        ///         Gets the current maximum log length (default: 1000)
        ///     </summary>
        /// </signature>
        /// <signature>
        ///     <summary>
        ///         Sets the current maximum log length (default: 1000)
        ///     </summary>
        ///     <param name="newMax" type="Number" integer="true">
        ///         The new maximum log length
        ///     </param>
        /// </signature>
        if (typeof newMax === 'undefined') {
            return _maxLogLength;
        }
        if (isNaN(newMax) === true) {
            throw new Error('This is not a number:' + newMax);
        }
        if (newMax < 0) {
            throw new Error('Maxium log length must be >= 0');
        }
        _maxLogLength = newMax;
        var diff = _logMessages.length - _maxLogLength;
        if (diff > 0) {
            // cut that many off the front
            _logMessages = _logMessages.slice(diff);
        }
    };

    // declare the collection of Levels variables here
    Trace.Levels = (function () {
        /// <summary>
        ///     All the available Trace Levels for a module
        /// </summary>
        /// <field name="off" type="Number" integer="true" static="true">
        ///     All logging is off
        /// </field>
        /// <field name="error" type="Number" integer="true" static="true">
        ///     All error messages will be logged
        /// </field>
        /// <field name="warn" type="Number" integer="true" static="true">
        ///     All error and warning messages will be logged
        /// </field>
        /// <field name="info" type="Number" integer="true" static="true">
        ///     All error, warning and info messages will be logged
        /// </field>
        /// <field name="debug" type="Number" integer="true" static="true">
        ///     All error, warning, info and debug messages will be logged
        /// </field>
        /// <field name="log" type="Number" integer="true" static="true">
        ///     All error, warning, info, debug and log messages will be logged
        /// </field>

        var allLevels = {};
        // loop over the levels 
        // create a member with that level name equal to that index value
        var idx = _levels.length - 1;
        while (idx >= 0) {
            allLevels[_levels[idx]] = idx;
            idx -= 1; // decrement
        }

        return allLevels;
    }());

    Trace.config = function(opts) {
        /// <summary>
        ///     single method for setting all options. 
        /// </summary>
        /// <param name="options" type="object" mayBeNull="false" optional="false">
        ///     the configuration object
        ///     Expects the following format:
        ///     <![CDATA[
        ///     {
        ///         defaultLevel: Trace.Levels.warn,
        ///         logLength: 1000,
        ///         levels: {
        ///             module1: Trace.Levels.log,
        ///             ...
        ///             moduleX: Trace.Levels.error
        ///         }
        ///     }
        ///     ]]>
        /// </param>
        if (opts.defaultLevel) {
            Trace.defaultLevel(opts.defaultLevel);
        }
        if (opts.logLength) {
            Trace.logLength(opts.logLength);
        }
        if (opts.levels) {
            for (var switchName in opts.levels) {
                if (opts.levels.hasOwnProperty(switchName)) {
                    Trace.traceLevel(switchName, opts.levels[switchName]);
                }
            }
        }
    };

    //#region Private Methods

    function _executeCallback(args) {
        if (_callbackFunc && (_callbackForce || !_con || !_con.log)) {
            _callbackFunc.apply(global, args);
        }
    }
    function _saveLogMessage(args) {
        _logMessages.push(args);
        if (_logMessages.length > _maxLogLength) {
            _logMessages.shift();
        }
    }
    function _createPassthroughMethods(module, that) {
        var idx = _passThroughMethods.length;
        while (idx >= 0) {
            (function (method) {
                that[method] = function () {
                    // pass them through whenever logging is on at all 
                    // and if the console and method exist
                    if (Trace.traceLevel(module) > Trace.Levels.off) {
                        if (_con !== undefined && _con[method] !== undefined) {
                            _con[method].apply(_con, arguments);
                        }
                        //                        else {
                        //                            // TODO: What to do if the method doesn't exist?
                        //                        }
                    }
                };
            }(_passThroughMethods[idx])); //ignore jslint -- for the "making a function in a loop" problem

            idx -= 1; // decrement
        }
    }
    function _createLevelMethods(module, that) {
        var idx = _levels.length - 1;
        while (idx > 0) { // don't create an "off" function

            // using a closure to prevent modification of these values before execution
            (function (myLevel, myIndex) {

                // create the specific Trace function here
                that[myLevel] = function (message, objs) {
                    /// <summary>
                    ///     Trace a message at the specified trace level
                    /// </summary>
                    /// <param name="message" mayBeNull="false" optional="false">
                    ///     The first object (usually a message)
                    /// </param>
                    /// <param name="objs" optional="true" parameterArray="true">
                    ///     Additional object(s) to be logged 
                    ///     (just keep adding them w/ commas in between)
                    /// </param>

                    // add the module and level first, then the rest
                    var args = [module, myLevel];
                    args = args.concat(Array.prototype.slice.call(arguments));

                    // add the message to the log and call any callbacks
                    _saveLogMessage(args);
                    _executeCallback(args);

                    // make sure we can and should output this message
                    if (_con === undefined ||
                        Trace.shouldTrace(module, myIndex) === false) {
                        return;
                    }

                    // try the various methods to log things in order
                    if (_con.firebug !== undefined) {
                        _con[myLevel].apply(global, args);
                    }
                    else if (_con[myLevel] !== undefined) {
                        _con[myLevel](args);
                    }
                    else {
                        _con.log(args);
                    }
                };

            }(_levels[idx], idx));  //ignore jslint -- for the "making a function in a loop" problem

            idx -= 1; // decrement
        }
    }

    function coerceTraceLevel(newLevel) {
        /// <summary>
        /// Coerces a valid trace level by converting from string and validating the index 
        /// within the Trace.Levels collection
        /// <para>Throws an Error if the value is invalid</para>
        /// </summary>
        if (newLevel === undefined) {
            throw new Error('Level is undefined');
        }
        if (typeof newLevel === 'string') {
            var index = _levels.indexOf(newLevel);
            if (index === -1) {
                throw new Error(newLevel + ' is not a valid Trace Level');
            }
            newLevel = index;
        }
        if (newLevel < Trace.Levels.off || newLevel > Trace.Levels.log) {
            throw new Error('Trace level of ' + newLevel + ' is not a valid value');
        }
        return newLevel;
    }
    //#endregion

    // })();
    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = Trace;
    } else {
        if (typeof define === "function" && define.amd) {
            define("Trace", [], function () { return Trace; });
        }
    }

    // If there is a global object, define Trace on it.
    if (global) {
        global.Trace = Trace;
    }

}(this));