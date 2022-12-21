import type { Reducer, AnyAction } from 'redux';
import type { ThunkDispatch, ThunkAction } from 'redux-thunk';
declare type AnyRecord = Record<string, any>;
declare type AnyService = (body?: any, ctx?: any) => any;
export interface EffectContext<S> {
    getState: () => S;
    getRootState: <RootS = any>() => RootS;
    dispatch: ThunkDispatch<S, AnyRecord, AnyAction>;
    actions: ActionCreatorsFromOption<S, any>;
    effects: AsyncActionCreatorsFromOption<any>;
    /**
     * 调用 servcie, 会自动传入 ctx
     */
    call: <SV extends AnyService>(service: SV, ...args: Parameters<SV>) => ReturnType<SV>;
}
declare type EkkoReducer<S> = (state: S, payload: any) => S;
declare type EkkoImmerReducer<S> = (state: S, payload: any) => void;
export interface ReducersOption<S> {
    [K: string]: EkkoReducer<S> | EkkoImmerReducer<S>;
}
export interface EffectsOption<S> {
    [K: string]: (this: EffectContext<S>, ...args: any[]) => void;
}
export interface SelectorsOption<S> {
    [K: string]: (state: S) => any;
}
declare type SelectorsFromOption<SL extends SelectorsOption<any>> = {
    [K in keyof SL]: (state: any) => ReturnType<SL[K]>;
};
declare type ActionCreatorsFromOption<S, R extends ReducersOption<any>, A = ((payload?: any) => AnyAction) | ((payload?: any, req?: any) => AnyAction)> = {
    [P in keyof S & string as `set${Capitalize<P>}`]: A;
} & {
    [K in keyof R]: A;
};
declare type AsyncActionCreatorsFromOption<E extends EffectsOption<any>> = {
    [K in keyof E]: (...args: Parameters<E[K]>) => ThunkAction<ReturnType<E[K]>, any, AnyRecord, AnyAction>;
};
declare type OldEffectsFromOption<E extends EffectsOption<any>> = {
    [K in keyof E]: (...args: Parameters<E[K]>) => ReturnType<E[K]>;
};
export interface CreateModelOptions<S, R extends ReducersOption<S>, E extends EffectsOption<S>, SL extends SelectorsOption<S>> {
    namespace: string;
    state: S;
    reducers: R;
    effects?: E;
    /**
     * Selectors
     */
    selectors?: SL;
}
export interface CreateModelConfig {
    /**
     * 是否开启 immer
     */
    immer: boolean;
}
export interface EkkoModel {
    namespace: string;
    initialState: any;
    /**
     * The model's reducer
     */
    reducer: Reducer<any>;
    /**
     * Action creators
     */
    actions: ActionCreatorsFromOption<any, any>;
    /**
     * Async Action creators
     */
    effects: AsyncActionCreatorsFromOption<any>;
    /**
     * Selectors
     */
    selectors: SelectorsFromOption<any>;
}
export interface EkkoModelOldTrait<S> {
    /**
     * 获取当前 model 的 state
     * @param req 服务端渲染时候的 req
     */
    getState(req?: any): S;
    /**
     * 获取整个 store 的 state
     * @param req 服务端渲染时候的 req
     */
    getRootState<RS = any>(req?: any): RS;
}
export declare type EkkoModelOld = Omit<EkkoModel, 'effects'> & {
    effects: OldEffectsFromOption<any>;
} & EkkoModelOldTrait<any>;
export declare function createModel<S, R extends ReducersOption<S>, E extends EffectsOption<S>, SL extends SelectorsOption<S>>(options: CreateModelOptions<S, R, E, SL>, config?: CreateModelConfig): {
    namespace: string;
    initialState: S;
    reducer: Reducer<S, AnyAction>;
    actions: ActionCreatorsFromOption<S, R, ((payload?: any) => AnyAction) | ((payload?: any, req?: any) => AnyAction)>;
    effects: AsyncActionCreatorsFromOption<E>;
    selectors: SelectorsFromOption<SL>;
};
export declare function createOldModel<S, R extends ReducersOption<S>, E extends EffectsOption<S>, SL extends SelectorsOption<S>>(options: CreateModelOptions<S, R, E, SL>, config?: CreateModelConfig): Pick<{
    namespace: string;
    initialState: S;
    reducer: Reducer<S, AnyAction>;
    actions: ActionCreatorsFromOption<S, R, ((payload?: any) => AnyAction) | ((payload?: any, req?: any) => AnyAction)>;
    effects: AsyncActionCreatorsFromOption<E>;
    selectors: SelectorsFromOption<SL>;
}, "namespace" | "initialState" | "reducer" | "actions" | "selectors"> & {
    effects: OldEffectsFromOption<E>;
} & EkkoModelOldTrait<S>;
export {};
