var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import withRedux from './withRedux';
import { isServer, ReducerCollector } from './helper';
import { createModel, createOldModel } from './createModel';
import { makeRegisterEkko } from './migration';
function createStoreEnhancer(config) {
    var endEnhancer;
    var finalMiddlewares = __spreadArrays(config.middlewares);
    if (!isServer()) {
        if (process.env.NODE_ENV === 'development') {
            var composeWithDevTools = require('redux-devtools-extension').composeWithDevTools;
            var createLogger = require('redux-logger').createLogger;
            var normalDevToolCompose = composeWithDevTools({});
            var normalLogger = createLogger({ collapsed: true });
            endEnhancer = normalDevToolCompose(applyMiddleware.apply(void 0, __spreadArrays([config.thunk, normalLogger], finalMiddlewares)));
        }
        else {
            endEnhancer = applyMiddleware.apply(void 0, __spreadArrays([config.thunk], finalMiddlewares));
        }
    }
    else {
        endEnhancer = applyMiddleware.apply(void 0, __spreadArrays([config.thunk], finalMiddlewares));
    }
    return endEnhancer;
}
var createEkkoStoreFactory = function (models, middlewares) {
    if (middlewares === void 0) { middlewares = []; }
    var initialState = {};
    var reducerCollector = new ReducerCollector();
    models.forEach(function (model) {
        reducerCollector.register(model.namespace, model.reducer);
        initialState[model.namespace] = model.initialState;
    });
    return function ekkoStoreFactory(outerInitialState, ctx) {
        var enhancer = createStoreEnhancer({
            thunk: thunk.withExtraArgument(ctx),
            middlewares: middlewares,
        });
        var store = createStore(combineReducers(reducerCollector.toObject()), outerInitialState || initialState, enhancer);
        return store;
    };
};
/**
 * 从 _app.tsx 中的 getInitialProps(nextCtx: any) 取出绑定的 store
 *
 * @param nextCtx
 */
export function getStoreFromNextContext(nextCtx) {
    var _a;
    return Boolean(nextCtx.ctx)
        ? nextCtx.ctx.reduxStore || ((_a = nextCtx.ctx.req) === null || _a === void 0 ? void 0 : _a.reduxStore)
        : Boolean(nextCtx.req)
            ? nextCtx.req.reduxStore
            : nextCtx.reduxStore;
}
export * from 'react-redux';
export { withRedux, createModel, createEkkoStoreFactory, createOldModel };
/**
 * 旧版的 registerEkko, 推荐使用新版的 createEkkoStoreFactory
 *
 * @deprecated
 */
var registerEkko = makeRegisterEkko(createStoreEnhancer);
export default registerEkko;
