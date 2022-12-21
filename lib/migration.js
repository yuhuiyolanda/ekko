"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterEkko = exports.reqWarning = void 0;
var redux_1 = require("redux");
var redux_thunk_1 = __importDefault(require("redux-thunk"));
var helper_1 = require("./helper");
var hasWindow = typeof window !== 'undefined';
var reqWarning = function (type, detail) {
    return "[Model " + type + "]: last argument req is needed in (" + detail + ") when doing server-side rendering.";
};
exports.reqWarning = reqWarning;
function getStoreWithReq(req, initialStore, warning) {
    if (!hasWindow) {
        if (!req || !req.reduxStore) {
            console.log('');
            console.trace(warning);
            console.log('');
            return null;
        }
        else {
            return req.reduxStore;
        }
    }
    else {
        return initialStore;
    }
}
function convertToOldModel(_model, store, effectReqGetter) {
    var model = _model;
    if (model.getState)
        return;
    // 供测试state值
    model.getRootState = function (req) {
        var _store = getStoreWithReq(req, store, exports.reqWarning('getState', "namespace: " + model.namespace));
        if (_store) {
            return _store.getState();
        }
        else {
            return {};
        }
    };
    model.getState = function (req) {
        return model.getRootState(req)[model.namespace];
    };
    Object.keys(model.actions).forEach(function (actionKey) {
        var actionCreator = model.actions[actionKey];
        // @ts-ignore
        model.actions[actionKey] = function (_data, _req) {
            // 服务端渲染只有一个参数的话当作 req
            var req = hasWindow ? undefined : _req === undefined ? _data : _req;
            var data = hasWindow || _req !== undefined ? _data : undefined;
            var _store = getStoreWithReq(req, store, exports.reqWarning('Action', "action: " + model.namespace + "." + actionKey));
            if (_store) {
                _store.dispatch(actionCreator(data));
            }
        };
    });
    Object.keys(model.effects).forEach(function (effectKey) {
        var asyncActionCreator = model.effects[effectKey];
        // @ts-ignore
        model.effects[effectKey] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var req = hasWindow ? undefined : effectReqGetter(args[args.length - 1]);
            var _store = getStoreWithReq(req, store, exports.reqWarning('Effect', "effect: " + model.namespace + "." + effectKey));
            if (_store) {
                return _store.dispatch(asyncActionCreator.apply(void 0, args));
            }
        };
    });
}
function defaultEffectReqGetter(opts) {
    var _a;
    return (opts === null || opts === void 0 ? void 0 : opts.req) || ((_a = opts === null || opts === void 0 ? void 0 : opts.ctx) === null || _a === void 0 ? void 0 : _a.req);
}
function makeRegisterEkko(createStoreEnhancer) {
    return function registerEkko(models, initialState, middlewares, config) {
        if (middlewares === void 0) { middlewares = []; }
        var enhancer = createStoreEnhancer({
            thunk: redux_thunk_1.default.withExtraArgument(config.reqCtx),
            middlewares: middlewares,
        });
        var newModels = config.newModels || [];
        var reducerCollector = new helper_1.ReducerCollector();
        models.forEach(function (model) {
            reducerCollector.register(model.namespace, model.reducer);
        });
        newModels.forEach(function (model) {
            reducerCollector.register(model.namespace, model.reducer);
        });
        var effectReqGetter = config.effectReqGetter || defaultEffectReqGetter;
        var store = redux_1.createStore(redux_1.combineReducers(reducerCollector.toObject()), initialState || undefined, enhancer);
        // 服务器环境创建时不用传 store, store 都是从 req 里面获取的
        models.forEach(function (model) { return convertToOldModel(model, hasWindow ? store : null, effectReqGetter); });
        return store;
    };
}
exports.makeRegisterEkko = makeRegisterEkko;
