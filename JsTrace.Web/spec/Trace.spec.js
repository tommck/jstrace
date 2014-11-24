/// <reference path="../Scripts/jasmine-1.1.0/jasmine.js" />
/// <reference path="../Scripts/Trace.js" />

describe('Trace', function () {
    var _levelNames = ['off', 'error', 'warn', 'info', 'debug', 'log'];
    var _passThroughMethods = ['assert', 'clear', 'count', 'dir', 'dirxml', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'profile', 'profileEnd', 'table', 'time', 'timeEnd', 'trace'];
    var _levelKeys = Object.keys(Trace.Levels);

    describe('The Basics', function () {
        it('should exist', function () {
            expect(Trace).toBeDefined();
        });

        describe('Construction', function () {

            it('should be possible', function () {
                var trc = new Trace('foo');
                expect(trc instanceof Trace).toBeTruthy();
            });

            it('should throw with no module name', function () {
                expect(function () {
                    var trc = new Trace();
                }).toThrow();
            });

            it('should throw if you don\'t call new', function () {

                expect(function () {
                    var trc = Trace('module');
                }).toThrow();
            });
        });

        describe('Levels', function () {
            it('should exist', function () {
                expect(Trace.Levels).toBeDefined();
            });

            it('should have 6 levels', function () {
                expect(Object.keys(Trace.Levels).length).toBe(6);
            });

            it('Should have all the expected level names', function () {
                for (var i = 0; i < _levelNames.length; i++) {
                    var lev = _levelNames[i];
                    expect(_levelKeys).toContain(lev);
                }
            });
        });

        describe('passthroughs', function () {
            it('should support all the passthrough methods', function () {
                expect(function () {
                    var trc = new Trace('passthrough');

                    for (var i = 0; i < _passThroughMethods.length; i++) {
                        var method = _passThroughMethods[i];
                        trc[method]('hi');
                    }
                }).not.toThrow();
            });
        });

        describe('traceLevel', function () {
            it('should exist', function () {
                expect(Trace.traceLevel).toBeDefined();
            });

            it('should allow setting a level', function () {
                expect(function () {
                    Trace.traceLevel('Foo', Trace.Levels.info);
                }).not.toThrow();
            });

            it('should allow setting a level as a String', function () {
                expect(function () {
                    Trace.traceLevel('Foo', 'debug');
                }).not.toThrow();
            });

            it('should throw with an invalid level string', function () {
                expect(function () {
                    Trace.traceLevel('Foo', 'totally invalid string');
                }).toThrow();
            });

            it('should allow getting a level back', function () {
                var lvl;
                expect(function () {
                    lvl = Trace.traceLevel('Foo');
                }).not.toThrow();
                expect(lvl).toBe(Trace.Levels.debug);
            });

            it('should allow getting the level as a string', function () {
                var lvl;
                expect(function () {
                    lvl = Trace.traceLevel('Foo', true);
                }).not.toThrow();
                expect(lvl).toBe('debug');
            });

            it('should accept all valid levels', function () {
                expect(function () {
                    for (lvl in _levelKeys) {
                        Trace.traceLevel('Foo', _levelKeys[lvl]);
                    }
                }).not.toThrow();
            });

            it('should accept all valid levels as Strings', function () {
                expect(function () {
                    for (var i = 0; i < _levelNames.length; i++) {
                        var lvl = _levelNames[i];
                        Trace.traceLevel('Foo', lvl);
                    }
                }).not.toThrow();
            });
        });

        describe('shouldTrace', function () {

            it('should exist', function () {
                expect(Trace.shouldTrace).toBeDefined();
            });

            describe('parameter checks', function () {
                it('should throw when passed a null module', function () {
                    expect(function () {
                        Trace.shouldTrace(null);
                    }).toThrow();
                });

                it('should throw when passed a null level', function () {
                    expect(function () {
                        Trace.shouldTrace('Foo', null);
                    }).toThrow();
                });

                it('should throw when passed NO level', function () {
                    expect(function () {
                        Trace.shouldTrace('Foo');
                    }).toThrow();
                });

                it('should throw when passed no parameters', function () {
                    expect(function () {
                        Trace.shouldTrace();
                    }).toThrow();
                });
            });

            describe('should return proper values for each setting', function () {

                for (var currLevelIndex = 0; currLevelIndex < _levelNames.length; currLevelIndex++) {
                    var currLevel = _levelNames[currLevelIndex];
                    // set the current level
                    Trace.traceLevel('Foo', currLevel);
                    // do a suite for this level
                    describe(currLevel, function () {
                        // loop through valid options (> 0 - since off isn't valid)
                        for (var inner = 1; inner < _levelNames.length; inner++) {
                            var traceLevel = _levelNames[inner];

                            // if the index is <= to the current trace level, it should trace it
                            var should = (inner <= currLevelIndex);

                            expect(Trace.shouldTrace('Foo', traceLevel)).toBe(should);
                        }
                    });
                }

            });
        });

        describe('defaultLevel', function () {
            it('should exist', function () {
                expect(Trace.defaultLevel).toBeDefined();
            });

            it('should return the current level', function () {
                // we haven't overridden anything at this point, so it should be error
                expect(Trace.defaultLevel()).toBe(Trace.Levels.error);
            });

            it('should accept a new level', function () {
                expect(function () {
                    Trace.defaultLevel(Trace.Levels.info);
                }).not.toThrow();
            });

            it('should accept a new string level', function () {
                expect(function () {
                    Trace.defaultLevel('error');
                }).not.toThrow();
            });

            it('should throw when passed null', function () {
                expect(function () {
                    Trace.defaultLevel(null);
                }).toThrow();
            });

            it('should throw when passed an invalid level value', function () {
                expect(function () {
                    Trace.defaultLevel('foo');
                }).toThrow();
            });

            it('should change any unspecified module\'s level', function () {
                // unspecified level
                Trace.defaultLevel(Trace.Levels.info);

                var lvl = Trace.traceLevel('foo');
                expect(lvl).toBe(Trace.Levels.info);
            });

            it('should not change any specified module\'s level', function () {
                // unspecified level
                Trace.traceLevel('foo', Trace.Levels.log);

                Trace.defaultLevel(Trace.Levels.info);

                var lvl = Trace.traceLevel('foo');
                expect(lvl).toBe(Trace.Levels.log);
            });
        });

        describe('resetToDefault', function () {
            it('should exists', function () {
                expect(Trace.resetToDefault).toBeDefined();
            });

            beforeEach(function () {
                // reset the default to 'error' so we know what the default is
                Trace.defaultLevel(Trace.Levels.error);

                // set 2 levels
                Trace.traceLevel('foo', Trace.Levels.info);
                Trace.traceLevel('foo2', Trace.Levels.debug);
                Trace.traceLevel('bar', Trace.Levels.warn);
                Trace.traceLevel('bar2', Trace.Levels.off);

            });

            it('should reset all when no parameters are passed', function () {

                Trace.resetToDefault();

                // all reset
                var lvl;
                lvl = Trace.traceLevel('foo'); expect(lvl).toBe(Trace.Levels.error);
                lvl = Trace.traceLevel('foo2'); expect(lvl).toBe(Trace.Levels.error);
                lvl = Trace.traceLevel('bar'); expect(lvl).toBe(Trace.Levels.error);
                lvl = Trace.traceLevel('bar2'); expect(lvl).toBe(Trace.Levels.error);
            });

            it('should only reset those module names passed in', function () {
                Trace.resetToDefault(['foo', 'bar']);

                // unchanged
                var lvl;
                lvl = Trace.traceLevel('foo'); expect(lvl).toBe(Trace.Levels.error);
                lvl = Trace.traceLevel('bar'); expect(lvl).toBe(Trace.Levels.error);

                // changed ones here
                lvl = Trace.traceLevel('foo2'); expect(lvl).toBe(Trace.Levels.debug);
                lvl = Trace.traceLevel('bar2'); expect(lvl).toBe(Trace.Levels.off);
            });

            it('should behave the same passing in strings outside of an array', function () {
                Trace.resetToDefault('foo', 'bar');

                // unchanged
                var lvl;
                lvl = Trace.traceLevel('foo'); expect(lvl).toBe(Trace.Levels.error);
                lvl = Trace.traceLevel('bar'); expect(lvl).toBe(Trace.Levels.error);

                // changed ones here
                lvl = Trace.traceLevel('foo2'); expect(lvl).toBe(Trace.Levels.debug);
                lvl = Trace.traceLevel('bar2'); expect(lvl).toBe(Trace.Levels.off);
            });
        });

        describe('logLength', function () {
            beforeEach(function () {
                spyOn(Trace, 'logLength').andCallThrough();
            });

            it('should default to 1000', function () {
                var len = Trace.logLength();
                expect(Trace.logLength).toHaveBeenCalled();
                expect(len).toBe(1000);
            });

            it('should throw when passed a non-number', function () {
                expect(function () {
                    Trace.logLength('Not A Number');
                }).toThrow();
            });

            it('should throw when passed a negative number', function () {
                expect(function () {
                    Trace.logLength(-5);
                }).toThrow();
            });

            it('should accept a valid positive new length', function () {
                var newValue = 5000;
                Trace.logLength(newValue);
                expect(Trace.logLength).toHaveBeenCalledWith(newValue);
                var newLen = Trace.logLength();
                expect(newLen).toBe(newValue);
            });

        });

        describe('Trace.setCallback', function () {
            beforeEach(function () {
            });

            afterEach(function () {
                // clear the callback
                Trace.setCallback();
            });

            it('should exist', function () {
                expect(Trace.setCallback).toBeDefined();
            });

            it('should allow adding a callback method', function () {
                Trace.setCallback(function () {
                }, 0);
            });

            it('should be called for previous messages', function () {
                var trc = new Trace('Testing');
                trc.log('test'); // guaranteeing at least 1 message

                var numCalls = 0;
                Trace.setCallback(function () {
                    numCalls += 1;
                }, true, 1); // limiting for speed's sake

                expect(numCalls).toBeGreaterThan(0);
            });

            it('should call callback for each subsequent Trace message', function () {
                var numCalls = 0;
                Trace.setCallback(function () {
                    numCalls += 1;
                }, true, 0); // no previous messages

                var trc = new Trace('Testing');

                trc.log('test');
                trc.debug('test');
                trc.info('test');
                trc.warn('test');
                trc.error('test');

                expect(numCalls).toBe(5);
            });

            it('should get the proper module, level and message', function () {

                var mod = 'foo';
                var lev = 'info';
                var msg = 'Testing';
                var numCalls = 0;

                Trace.setCallback(function (module, level, message) {
                    numCalls += 1;
                    expect(module).toEqual(mod);
                    expect(level).toEqual(lev);
                    expect(message).toEqual(msg);
                }, true, 0); // no previous messages

                var trc = new Trace(mod);
                trc[lev](msg);

                expect(numCalls).toBe(1);
            });

            it('should get extra objectsmessage', function () {
                var mod = 'foo';
                var lev = 'info';
                var msg = 'Testing';

                Trace.setCallback(function (module, level, message) {
                    expect(module).toEqual(mod);
                    expect(level).toEqual(lev);
                    expect(message).toEqual(msg);
                }, true, 0); // no previous messages
            });
        });

        describe('Trace.config', function () {
            
            it('should set the logLength, when passed', function () {

                spyOn(Trace, 'logLength').andCallThrough();
                
                Trace.config({
                   logLength: 1234 
                });

                expect(Trace.logLength).toHaveBeenCalledWith(1234);

                var len = Trace.logLength();
                expect(len).toBe(1234);
            });

            it('should set the default level when passed', function() {
                spyOn(Trace, 'defaultLevel').andCallThrough();

                Trace.config({                    
                   defaultLevel: Trace.Levels.log 
                });

                expect(Trace.defaultLevel).toHaveBeenCalledWith(Trace.Levels.log);
                var level = Trace.defaultLevel();
                expect(level).toBe(Trace.Levels.log);
            });

            it('should set all passed in levels', function () {
                spyOn(Trace, 'traceLevel').andCallThrough();

                Trace.config({
                    levels: {
                        foo: Trace.Levels.info,
                        bar: Trace.Levels.log
                    }
                });

                expect(Trace.traceLevel).toHaveBeenCalled(); // TODO: check parms?

                var fooLvl = Trace.traceLevel('foo');
                expect(fooLvl).toBe(Trace.Levels.info);
                
                var barLvl = Trace.traceLevel('bar');
                expect(barLvl).toBe(Trace.Levels.log);
            });
        });
    });

    describe('Advanced', function () {
        //#region helper methods
        var _getMessages = function () {
            var messages = [];
            Trace.setCallback(function () {
                var args = [].slice.call(arguments);
                messages.push(args.join(' '));
            }, true);
            Trace.setCallback();
            return messages;
        };

        var _numMessages = function () {
            return _getMessages().length;
        };

        var _clearMessages = function () {
            var curLen = Trace.logLength();
            Trace.logLength(0);
            Trace.logLength(curLen);
        };
        //#endregion

        describe('logLength', function () {
            it('should empty the list if 0 is passed', function () {
                Trace.logLength(0);
                expect(_numMessages()).toBe(0);
            });

            it('should disable history if 0 is passed', function () {
                Trace.logLength(0);
                expect(_numMessages()).toBe(0);
                var trc = new Trace('Foo');
                trc.log('will not be stored');
                expect(_numMessages()).toBe(0);
            });

            it('should truncate any existing messages over new length', function () {
                // set the length to 10
                Trace.logLength(10);

                // add 10 messages
                var trc = new Trace('Foo');
                for (var i = 0; i < 10; i++) {
                    trc.log(i.toString());
                }

                expect(_numMessages()).toBe(10);

                // set the length to 5
                Trace.logLength(5);

                // make sure there are only 5 messages
                expect(_numMessages()).toBe(5);
            });

            it('should truncate any existing messages over new length', function () {
                // set the length to 10
                Trace.logLength(10);

                // add 10 messages
                var trc = new Trace('Foo');
                for (var i = 0; i < 10; i++) {
                    trc.log(i);
                }

                // set the length to 5
                Trace.logLength(5);

                // make sure there are only 5 messages
                expect(_numMessages()).toBe(5);
            });

            it('should remove the oldest messages when truncating', function () {
                // set the length to 10
                Trace.logLength(10);

                // add 10 messages
                var trc = new Trace('Foo');
                for (var i = 0; i < 10; i++) {
                    trc.log(i);
                }

                // set the length to 5
                Trace.logLength(5);

                // make sure there are only 5 messages
                var messages = _getMessages();

                expect(messages.length).toBe(5);

                for (var i = 0; i < messages.length; i++) {
                    // skip over the module and level to get to the number
                    var parts = messages[i].split(' ');
                    // should have deleted the first 5 (0-based)
                    expect(parts[2]).toBeGreaterThan(4);
                }
            });
        });

        // TODO: multiple switch tests
    });
});