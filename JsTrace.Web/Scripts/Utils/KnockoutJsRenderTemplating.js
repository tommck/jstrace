/// <reference path="../knockout.js" />

/*global ko*/
(function (undefined) {
    "use strict";

    ko.jsRenderTemplateEngine = function () {
        $.views.allowCode = true; // TODO: not sure if I can get around this
    };
    ko.jsRenderTemplateEngine.prototype = ko.utils.extend(new ko.templateEngine(), {
        renderTemplateSource: function (templateSource, bindingContext, options) {
            // Precompile and cache the templates for efficiency
            var precompiled = templateSource.data('precompiled');
            if (!precompiled) {
                // get the title for it
                var title = 'title';
                precompiled = $.template(title, templateSource.text());
                templateSource.data('precompiled', precompiled);
            }

            // Run the template and parse its output into an array of DOM elements
            var renderedMarkup = precompiled(bindingContext);
            return ko.utils.parseHtmlFragment(renderedMarkup);
        },
        createJavaScriptEvaluatorBlock: function (script) {
            return "{{* " + script + "}}";
        }
    });
    ko.setTemplateEngine(new ko.jsRenderTemplateEngine());
} ());
