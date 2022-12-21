"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOldModel = exports.createEkkoStoreFactory = exports.createModel = exports.withRedux = exports.getStoreFromNextContext = void 0;
var redux_1 = require("redux");
var redux_thunk_1 = __importDefault(require("redux-thunk"));
var withRedux_1 = __importDefault(require("./withRedux"));
exports.withRedux = withRedux_1.default;
var helper_1 = require("./helper");
var createModel_1 = require("./createModel");
Object.defineProperty(exports, "createModel", { enumerable: true, get: function () { return createModel_1.createModel; } });
Object.defineProperty(exports, "createOldModel", { enumerable: true, get: function () { return createModel_1.createOldModel; } });
var migration_1 = require("./migration");
function createStoreEnhancer(config) {
    var endEnhancer;
    var finalMiddlewares = __spreadArrays(config.middlewares);
    if (!helper_1.isServer()) {
        if (process.env.NODE_ENV === 'development') {
            var composeWithDevTools = require('redux-devtools-extension').composeWithDevTools;
            var createLogger = require('redux-logger').createLogger;
            var normalDevToolCompose = composeWithDevTools({});
            var normalLogger = createLogger({ collapsed: true });
            endEnhancer = normalDevToolCompose(redux_1.applyMiddleware.apply(void 0, __spreadArrays([config.thunk, normalLogger], finalMiddlewares)));
        }
        else {
            endEnhancer = redux_1.applyMiddleware.apply(void 0, __spreadArrays([config.thunk], finalMiddlewares));
        }
    }
    else {
        endEnhancer = redux_1.applyMiddleware.apply(void 0, __spreadArrays([config.thunk], finalMiddlewares));
    }
    return endEnhancer;
}
var createEkkoStoreFactory = function (models, middlewares) {
    if (middlewares === void 0) { middlewares = []; }
    var initialState = {};
    var reducerCollector = new helper_1.ReducerCollector();
    models.forEach(function (model) {
        reducerCollector.register(model.namespace, model.reducer);
        initialState[model.namespace] = model.initialState;
    });
    return function ekkoStoreFactory(outerInitialState, ctx) {
        var enhancer = createStoreEnhancer({
            thunk: redux_thunk_1.default.withExtraArgument(ctx),
            middlewares: middlewares,
        });
        var store = redux_1.createStore(redux_1.combineReducers(reducerCollector.toObject()), outerInitialState || initialState, enhancer);
        return store;
    };
};
exports.createEkkoStoreFactory = createEkkoStoreFactory;
/**
 * 从 _app.tsx 中的 getInitialProps(nextCtx: any) 取出绑定的 store
 *
 * @param nextCtx
 */
function getStoreFromNextContext(nextCtx) {
    var _a;
    return Boolean(nextCtx.ctx)
        ? nextCtx.ctx.reduxStore || ((_a = nextCtx.ctx.req) === null || _a === void 0 ? void 0 : _a.reduxStore)
        : Boolean(nextCtx.req)
            ? nextCtx.req.reduxStore
            : nextCtx.reduxStore;
}
exports.getStoreFromNextContext = getStoreFromNextContext;
__exportStar(require("react-redux"), exports);
/**
 * 旧版的 registerEkko, 推荐使用新版的 createEkkoStoreFactory
 *
 * @deprecated
 */
var registerEkko = migration_1.makeRegisterEkko(createStoreEnhancer);
exports.default = registerEkko;
