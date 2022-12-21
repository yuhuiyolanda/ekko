import { createStore, combineReducers, applyMiddleware, Middleware, Store, AnyAction } from 'redux'
import thunk, { ThunkAction } from 'redux-thunk'

import withRedux from './withRedux'
import type { AnyStoreState } from './types'
import { isServer, ReducerCollector } from './helper'
import { EkkoModel, createModel, createOldModel } from './createModel'
import { makeRegisterEkko } from './migration'

function createStoreEnhancer(config: { thunk: Middleware; middlewares: Middleware[] }) {
  let endEnhancer

  const finalMiddlewares = [...config.middlewares]

  if (!isServer()) {
    if (process.env.NODE_ENV === 'development') {
      const { composeWithDevTools } = require('redux-devtools-extension')
      const { createLogger } = require('redux-logger')
      const normalDevToolCompose = composeWithDevTools({})
      const normalLogger = createLogger({ collapsed: true })
      endEnhancer = normalDevToolCompose(
        applyMiddleware(config.thunk, normalLogger, ...finalMiddlewares),
      )
    } else {
      endEnhancer = applyMiddleware(config.thunk, ...finalMiddlewares)
    }
  } else {
    endEnhancer = applyMiddleware(config.thunk, ...finalMiddlewares)
  }

  return endEnhancer
}

const createEkkoStoreFactory = (models: EkkoModel[], middlewares: Middleware[] = []) => {
  const initialState: Record<string, any> = {}
  const reducerCollector = new ReducerCollector()

  models.forEach((model) => {
    reducerCollector.register(model.namespace, model.reducer)
    initialState[model.namespace] = model.initialState
  })

  return function ekkoStoreFactory(outerInitialState?: any, ctx?: any) {
    const enhancer = createStoreEnhancer({
      thunk: thunk.withExtraArgument(ctx),
      middlewares,
    })
    // {namespace属性值:reducer属性值}的键值对
    const store = createStore<AnyStoreState, AnyAction, unknown, unknown>(
      combineReducers(reducerCollector.toObject()),
      outerInitialState || initialState,
      enhancer,
    )

    return store
  }
}

/**
 * 从 _app.tsx 中的 getInitialProps(nextCtx: any) 取出绑定的 store
 *
 * @param nextCtx
 */
export function getStoreFromNextContext<S = any>(nextCtx: any): Store<S> {
  return Boolean(nextCtx.ctx)
    ? nextCtx.ctx.reduxStore || nextCtx.ctx.req?.reduxStore
    : Boolean(nextCtx.req)
    ? nextCtx.req.reduxStore
    : nextCtx.reduxStore
}

export type EkkoStoreFactory = ReturnType<typeof createEkkoStoreFactory>

export * from 'react-redux'
export { withRedux, createModel, createEkkoStoreFactory, createOldModel }

/**
 * 旧版的 registerEkko, 推荐使用新版的 createEkkoStoreFactory
 *
 * @deprecated
 */
const registerEkko = makeRegisterEkko(createStoreEnhancer)
// applyMiddleware(config.thunk, ...finalMiddlewares)
export default registerEkko

/**
 * Redux behaviour changed by middleware, so overloads here
 */
declare module 'redux' {
  /**
   * Overload for bindActionCreators redux function, returns expects responses
   * from thunk actions
   */
  function bindActionCreators<TActionCreators extends ActionCreatorsMapObject<any>>(
    actionCreators: TActionCreators,
    dispatch: Dispatch,
  ): {
    [TActionCreatorName in keyof TActionCreators]: ReturnType<
      TActionCreators[TActionCreatorName]
    > extends ThunkAction<any, any, any, any>
      ? (
          ...args: Parameters<TActionCreators[TActionCreatorName]>
        ) => ReturnType<ReturnType<TActionCreators[TActionCreatorName]>>
      : TActionCreators[TActionCreatorName]
  }

  /*
   * Overload to add thunk support to Redux's dispatch() function.
   * Useful for react-redux or any other library which could use this type.
   */
  export interface Dispatch<A extends Action = AnyAction> {
    <TReturnType = any, TState = any, TExtraThunkArg = any>(
      thunkAction: ThunkAction<TReturnType, TState, TExtraThunkArg, A>,
    ): TReturnType
  }
}
