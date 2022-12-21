"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReducerCollector = exports.isServer = void 0;
function isServer() {
    return (process && typeof process === 'object' && typeof window === 'undefined') || false;
}
exports.isServer = isServer;
var ReducerCollector = /** @class */ (function () {
    function ReducerCollector() {
        this._reducers = {};
    }
    ReducerCollector.prototype.register = function (namespace, reducer) {
        if (process.env.NODE_ENV === 'development') {
            if (this._reducers[namespace]) {
                throw new Error("\u53D1\u73B0\u91CD\u590D\u5B9A\u4E49\u7684 model: " + namespace + "\uFF0C\u8BF7\u68C0\u67E5 model \u7684 namespace \u7684\u91CD\u590D\u3002");
            }
        }
        this._reducers[namespace] = reducer;
    };
    ReducerCollector.prototype.toObject = function () {
        return this._reducers;
    };
    return ReducerCollector;
}());
exports.ReducerCollector = ReducerCollector;
