import { Middleware, Store, AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import withRedux from './withRedux';
import type { AnyStoreState } from './types';
import { EkkoModel, createModel, createOldModel } from './createModel';
declare const createEkkoStoreFactory: (models: EkkoModel[], middlewares?: Middleware[]) => (outerInitialState?: any, ctx?: any) => Store<AnyStoreState, AnyAction>;
/**
 * 从 _app.tsx 中的 getInitialProps(nextCtx: any) 取出绑定的 store
 *
 * @param nextCtx
 */
export declare function getStoreFromNextContext<S = any>(nextCtx: any): Store<S>;
export declare type EkkoStoreFactory = ReturnType<typeof createEkkoStoreFactory>;
export * from 'react-redux';
export { withRedux, createModel, createEkkoStoreFactory, createOldModel };
/**
 * 旧版的 registerEkko, 推荐使用新版的 createEkkoStoreFactory
 *
 * @deprecated
 */
declare const registerEkko: (models: import("./createModel").EkkoModelOld[], initialState: any, middlewares: any[] | undefined, config: import("./migration").RegisterEkkoConfig) => Store<AnyStoreState, AnyAction>;
export default registerEkko;
/**
 * Redux behaviour changed by middleware, so overloads here
 */
declare module 'redux' {
    /**
     * Overload for bindActionCreators redux function, returns expects responses
     * from thunk actions
     */
    function bindActionCreators<TActionCreators extends ActionCreatorsMapObject<any>>(actionCreators: TActionCreators, dispatch: Dispatch): {
        [TActionCreatorName in keyof TActionCreators]: ReturnType<TActionCreators[TActionCreatorName]> extends ThunkAction<any, any, any, any> ? (...args: Parameters<TActionCreators[TActionCreatorName]>) => ReturnType<ReturnType<TActionCreators[TActionCreatorName]>> : TActionCreators[TActionCreatorName];
    };
    interface Dispatch<A extends Action = AnyAction> {
        <TReturnType = any, TState = any, TExtraThunkArg = any>(thunkAction: ThunkAction<TReturnType, TState, TExtraThunkArg, A>): TReturnType;
    }
}
