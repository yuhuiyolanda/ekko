var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import produce from 'immer';
function makeAsyncActionCreator(namespace, effect, actions, effects) {
    return function asyncActionCreator() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return function (dispatch, getState, gCtx) {
            var ctx = {
                getRootState: getState,
                getState: function () { return getState()[namespace]; },
                dispatch: dispatch,
                actions: actions,
                effects: effects,
                call: function (service) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    return service.apply(void 0, __spreadArrays((args.length ? args : [undefined]), [gCtx]));
                },
            };
            return effect.call.apply(effect, __spreadArrays([ctx], args));
        };
    };
}
function makeActionCreator(typeKey) {
    return function actionCreator(payload) {
        return {
            type: typeKey,
            payload: payload,
        };
    };
}
function makeSelector(namespace, selector) {
    return function namespacedSelector(state) {
        return selector(state[namespace]);
    };
}
function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}
export function createModel(options, config) {
    if (config === void 0) { config = { immer: false }; }
    var isUseImmer = config.immer;
    var initialState = __assign({}, options.state);
    var namespace = options.namespace, _a = options.effects, effects = _a === void 0 ? {} : _a, reducers = options.reducers, _b = options.selectors, selectors = _b === void 0 ? {} : _b;
    var reducerMap = {};
    var actionCreators = {};
    var asyncActoinCreators = {};
    var selectorsMap = {};
    var stateKeys = Object.keys(initialState);
    var actionKeys = Object.keys(reducers);
    var effectKeys = Object.keys(effects);
    var selectorKeys = Object.keys(selectors);
    var reducer = function (state, data) {
        if (state === void 0) { state = initialState; }
        var targetReducer = reducerMap[data.type];
        return targetReducer ? targetReducer(state, data.payload) : state;
    };
    // 根据 state 的 key 产生 setXxxx 的 action
    stateKeys.forEach(function (stateKey) {
        var actionKey = "set" + capitalize(stateKey);
        var typeKey = namespace + "." + actionKey;
        // @ts-ignore
        reducerMap[typeKey] = function (state, payload) {
            var _a;
            return (__assign(__assign({}, state), (_a = {}, _a[stateKey] = payload, _a)));
        };
        // @ts-ignore
        actionCreators[actionKey] = makeActionCreator(typeKey);
    });
    actionKeys.forEach(function (actionKey) {
        var typeKey = namespace + "." + actionKey;
        var reducer = reducers[actionKey];
        reducerMap[typeKey] = (isUseImmer
            ? function (state, payload) {
                return produce(state, function (draftState) {
                    reducer(draftState, payload);
                });
            }
            : reducer);
        // @ts-ignore
        actionCreators[actionKey] = makeActionCreator(typeKey);
    });
    effectKeys.forEach(function (effectKey) {
        asyncActoinCreators[effectKey] = makeAsyncActionCreator(namespace, effects[effectKey], actionCreators, asyncActoinCreators);
    });
    selectorKeys.forEach(function (selectorKey) {
        var selector = selectors[selectorKey];
        selectorsMap[selectorKey] = makeSelector(namespace, selector);
    });
    return {
        namespace: namespace,
        initialState: initialState,
        reducer: reducer,
        actions: actionCreators,
        effects: asyncActoinCreators,
        selectors: selectorsMap,
    };
}
export function createOldModel(options, config) {
    var model = createModel(options, config);
    return model;
}
