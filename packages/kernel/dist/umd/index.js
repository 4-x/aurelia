(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./di", "./path", "./platform", "./reporter", "./profiler", "./resource", "./eventaggregator", "./functions"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var di_1 = require("./di");
    exports.all = di_1.all;
    exports.DI = di_1.DI;
    exports.IContainer = di_1.IContainer;
    exports.inject = di_1.inject;
    exports.IServiceLocator = di_1.IServiceLocator;
    exports.lazy = di_1.lazy;
    exports.optional = di_1.optional;
    exports.Registration = di_1.Registration;
    exports.singleton = di_1.singleton;
    exports.transient = di_1.transient;
    exports.InstanceProvider = di_1.InstanceProvider;
    var path_1 = require("./path");
    exports.relativeToFile = path_1.relativeToFile;
    exports.join = path_1.join;
    exports.buildQueryString = path_1.buildQueryString;
    exports.parseQueryString = path_1.parseQueryString;
    var platform_1 = require("./platform");
    exports.PLATFORM = platform_1.PLATFORM;
    var reporter_1 = require("./reporter");
    exports.Reporter = reporter_1.Reporter;
    exports.Tracer = reporter_1.Tracer;
    exports.LogLevel = reporter_1.LogLevel;
    var profiler_1 = require("./profiler");
    exports.Profiler = profiler_1.Profiler;
    var resource_1 = require("./resource");
    exports.RuntimeCompilationResources = resource_1.RuntimeCompilationResources;
    var eventaggregator_1 = require("./eventaggregator");
    exports.EventAggregator = eventaggregator_1.EventAggregator;
    exports.IEventAggregator = eventaggregator_1.IEventAggregator;
    var functions_1 = require("./functions");
    exports.isNumeric = functions_1.isNumeric;
    exports.camelCase = functions_1.camelCase;
    exports.kebabCase = functions_1.kebabCase;
    exports.toArray = functions_1.toArray;
    exports.nextId = functions_1.nextId;
    exports.resetId = functions_1.resetId;
    exports.compareNumber = functions_1.compareNumber;
    exports.mergeDistinct = functions_1.mergeDistinct;
});
//# sourceMappingURL=index.js.map