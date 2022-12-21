import type { Reducer, AnyAction } from 'redux'
import type { ThunkDispatch, ThunkAction } from 'redux-thunk'
import produce from 'immer'

type AnyRecord = Record<string, any>
type AnyService = (body?: any, ctx?: any) => any

export interface EffectContext<S> {
  getState: () => S
  getRootState: <RootS = any>() => RootS
  dispatch: ThunkDispatch<S, AnyRecord, AnyAction>
  actions: ActionCreatorsFromOption<S, any>
  effects: AsyncActionCreatorsFromOption<any>
  /**
   * 调用 servcie, 会自动传入 ctx
   */
  call: <SV extends AnyService>(service: SV, ...args: Parameters<SV>) => ReturnType<SV>
}

type EkkoReducer<S> = (state: S, payload: any) => S
type EkkoImmerReducer<S> = (state: S, payload: any) => void

export interface ReducersOption<S> {
  [K: string]: EkkoReducer<S> | EkkoImmerReducer<S>
}

export interface EffectsOption<S> {
  [K: string]: (this: EffectContext<S>, ...args: any[]) => void
}

export interface SelectorsOption<S> {
  [K: string]: (state: S) => any
}

type SelectorsFromOption<SL extends SelectorsOption<any>> = {
  [K in keyof SL]: (state: any) => ReturnType<SL[K]>
}

type ActionCreatorsFromOption<
  S,
  R extends ReducersOption<any>,
  A = ((payload?: any) => AnyAction) | ((payload?: any, req?: any) => AnyAction)
> = {
  [P in keyof S & string as `set${Capitalize<P>}`]: A
} &
  {
    [K in keyof R]: A
  }

type AsyncActionCreatorsFromOption<E extends EffectsOption<any>> = {
  [K in keyof E]: (
    ...args: Parameters<E[K]>
  ) => ThunkAction<ReturnType<E[K]>, any, AnyRecord, AnyAction>
}

type OldEffectsFromOption<E extends EffectsOption<any>> = {
  [K in keyof E]: (...args: Parameters<E[K]>) => ReturnType<E[K]>
}

export interface CreateModelOptions<
  S,
  R extends ReducersOption<S>,
  E extends EffectsOption<S>,
  SL extends SelectorsOption<S>
> {
  namespace: string
  state: S
  reducers: R
  effects?: E

  /**
   * Selectors
   */
  selectors?: SL
}

export interface CreateModelConfig {
  /**
   * 是否开启 immer
   */
  immer: boolean
}

export interface EkkoModel {
  namespace: string

  initialState: any
  /**
   * The model's reducer
   */
  reducer: Reducer<any>

  /**
   * Action creators
   */
  actions: ActionCreatorsFromOption<any, any>

  /**
   * Async Action creators
   */
  effects: AsyncActionCreatorsFromOption<any>

  /**
   * Selectors
   */
  selectors: SelectorsFromOption<any>
}

export interface EkkoModelOldTrait<S> {
  /**
   * 获取当前 model 的 state
   * @param req 服务端渲染时候的 req
   */
  getState(req?: any): S
  /**
   * 获取整个 store 的 state
   * @param req 服务端渲染时候的 req
   */
  getRootState<RS = any>(req?: any): RS
}

export type EkkoModelOld = Omit<EkkoModel, 'effects'> & {
  effects: OldEffectsFromOption<any>
} & EkkoModelOldTrait<any>

function makeAsyncActionCreator(namespace: string, effect: any, actions: any, effects: any) {
  return function asyncActionCreator(...args: any[]) {
    return function (dispatch: any, getState: any, gCtx: any) {
      const ctx = {
        getRootState: getState,
        getState: () => getState()[namespace],
        dispatch,
        actions,
        effects,
        call: <SV extends AnyService>(service: SV, ...args: Parameters<SV>) => {
          return service(...(args.length ? args : [undefined]), gCtx)
        },
      }

      return effect.call(ctx, ...args)
    }
  }
}

function makeActionCreator(typeKey: string) {
  return function actionCreator(payload: any) {
    return {
      type: typeKey,
      payload,
    }
  }
}

function makeSelector(namespace: string, selector: (subState: AnyRecord) => any) {
  return function namespacedSelector(state: AnyRecord) {
    return selector(state[namespace])
  }
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

export function createModel<
  S,
  R extends ReducersOption<S>,
  E extends EffectsOption<S>,
  SL extends SelectorsOption<S>
>(options: CreateModelOptions<S, R, E, SL>, config: CreateModelConfig = { immer: false }) {
  const isUseImmer = config.immer
  const initialState = { ...options.state }
  const { namespace, effects = {} as E, reducers, selectors = {} as SL } = options

  const reducerMap: Record<string, Reducer<S>> = {}
  const actionCreators = {} as ActionCreatorsFromOption<S, R>
  const asyncActoinCreators = {} as AsyncActionCreatorsFromOption<E>
  const selectorsMap = {} as SelectorsFromOption<SL>

  const stateKeys: string[] = Object.keys(initialState)
  const actionKeys: (keyof R)[] = Object.keys(reducers)
  const effectKeys: (keyof E)[] = Object.keys(effects)
  const selectorKeys: (keyof SL)[] = Object.keys(selectors)
  
  // reducer是什么？
  const reducer: Reducer<S> = (state = initialState, data) => {
    const targetReducer = reducerMap[data.type]

    return targetReducer ? targetReducer(state, data.payload) : state
  }

  // 根据 state 的 key 产生 setXxxx 的 action
  stateKeys.forEach((stateKey) => {
    const actionKey = `set${capitalize(stateKey)}`
    const typeKey = `${namespace}.${actionKey}`

    // @ts-ignore
    reducerMap[typeKey] = (state: S, payload: any) => ({ ...state, [stateKey]: payload })

    // @ts-ignore
    actionCreators[actionKey] = makeActionCreator(typeKey)
  })

  actionKeys.forEach((actionKey) => {
    const typeKey = `${namespace}.${actionKey}`
    const reducer = reducers[actionKey]

    reducerMap[typeKey] = (isUseImmer
      ? (state: S, payload: any) =>
          produce(state, (draftState: S) => {
            reducer(draftState, payload)
          })
      : reducer) as any

    // @ts-ignore
    actionCreators[actionKey] = makeActionCreator(typeKey)
  })

  effectKeys.forEach((effectKey) => {
    asyncActoinCreators[effectKey] = makeAsyncActionCreator(
      namespace,
      effects[effectKey],
      actionCreators,
      asyncActoinCreators,
    )
  })

  selectorKeys.forEach((selectorKey) => {
    const selector = selectors[selectorKey] as any
    selectorsMap[selectorKey] = makeSelector(namespace, selector)
  })

  return {
    namespace,
    initialState, // createOldModal时传入的state就是初始值
    reducer,
    actions: actionCreators,
    effects: asyncActoinCreators,
    selectors: selectorsMap,
  }
}

export function createOldModel<
  S,
  R extends ReducersOption<S>,
  E extends EffectsOption<S>,
  SL extends SelectorsOption<S>
>(options: CreateModelOptions<S, R, E, SL>, config?: CreateModelConfig) {
  const model = createModel(options, config)
  type NewModel = typeof model
  type OldModel = Omit<NewModel, 'effects'> & {
    effects: OldEffectsFromOption<E>
  }

  return model as OldModel & EkkoModelOldTrait<S>
}
