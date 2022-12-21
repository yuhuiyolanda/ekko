import { createStore, combineReducers, AnyAction } from 'redux'
import thunk from 'redux-thunk'

import type { EkkoModel, EkkoModelOld } from './createModel'
import { ReducerCollector } from './helper'
import type { AnyStoreState } from './types'

const hasWindow = typeof window !== 'undefined'

export const reqWarning = (type: string, detail: string) =>
  `[Model ${type}]: last argument req is needed in (${detail}) when doing server-side rendering.`

function getStoreWithReq(req: any, initialStore: any, warning: string) {
  if (!hasWindow) {
    if (!req || !req.reduxStore) {
      console.log('')
      console.trace(warning)
      console.log('')
      return null
    } else {
      return req.reduxStore
    }
  } else {
    return initialStore
  }
}

function convertToOldModel(_model: EkkoModel, store: any, effectReqGetter: any): void {
  const model = _model as EkkoModelOld & { getState: any; getRootState: any }

  if (model.getState) return

  // 供测试state值
  model.getRootState = (req?: any) => {
    const _store = getStoreWithReq(
      req,
      store,
      reqWarning('getState', `namespace: ${model.namespace}`),
    )
    if (_store) {
      return _store.getState()
    } else {
      return {}
    }
  }

  model.getState = (req?: any) => {
    return model.getRootState(req)[model.namespace]
  }

  Object.keys(model.actions).forEach((actionKey) => {
    const actionCreator = model.actions[actionKey]
    // @ts-ignore
    model.actions[actionKey] = (_data, _req) => {
      // 服务端渲染只有一个参数的话当作 req
      const req = hasWindow ? undefined : _req === undefined ? _data : _req
      const data = hasWindow || _req !== undefined ? _data : undefined

      const _store = getStoreWithReq(
        req,
        store,
        reqWarning('Action', `action: ${model.namespace}.${actionKey}`),
      )
      if (_store) {
        _store.dispatch(actionCreator(data))
      }
    }
  })

  Object.keys(model.effects).forEach((effectKey) => {
    const asyncActionCreator = model.effects[effectKey]
    // @ts-ignore
    model.effects[effectKey] = (...args: any[]) => {
      const req = hasWindow ? undefined : effectReqGetter(args[args.length - 1])
      const _store = getStoreWithReq(
        req,
        store,
        reqWarning('Effect', `effect: ${model.namespace}.${effectKey}`),
      )
      if (_store) {
        return _store.dispatch(asyncActionCreator(...args))
      }
    }
  })
}

function defaultEffectReqGetter(opts: any): any {
  return opts?.req || opts?.ctx?.req
}

export interface RegisterEkkoConfig {
  /**
   * 用与服务端渲染的时候，从 effect 最后一个参数里拿出 req
   */
  effectReqGetter?: (opt: any) => any

  /**
   * 使用新版调用方式的 model
   */
  newModels?: EkkoModel[]

  /**
   * 服务端渲染时的请求上下文
   */
  reqCtx?: any
}
// createStoreEnhancer实质上是 applyMiddleware(config.thunk, ...finalMiddlewares)
export function makeRegisterEkko(createStoreEnhancer: any) {
  return function registerEkko(
    models: EkkoModelOld[],
    initialState: any,
    middlewares = [] as any[],
    config: RegisterEkkoConfig,
  ) {
    const enhancer = createStoreEnhancer({
      thunk: thunk.withExtraArgument(config.reqCtx),
      middlewares,
    })
    const newModels = config.newModels || []
    const reducerCollector = new ReducerCollector()

    models.forEach((model) => {
      reducerCollector.register(model.namespace, model.reducer)
    })
    newModels.forEach((model) => {
      reducerCollector.register(model.namespace, model.reducer)
    })

    const effectReqGetter = config.effectReqGetter || defaultEffectReqGetter

    const store = createStore<AnyStoreState, AnyAction, unknown, unknown>(
      combineReducers(reducerCollector.toObject()),
      initialState || undefined,
      enhancer,
    )
    // 服务器环境创建时不用传 store, store 都是从 req 里面获取的
    models.forEach((model) => convertToOldModel(model, hasWindow ? store : null, effectReqGetter))

    return store
  }
}
