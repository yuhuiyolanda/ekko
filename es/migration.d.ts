import { AnyAction } from 'redux';
import type { EkkoModel, EkkoModelOld } from './createModel';
import type { AnyStoreState } from './types';
export declare const reqWarning: (type: string, detail: string) => string;
export interface RegisterEkkoConfig {
    /**
     * 用与服务端渲染的时候，从 effect 最后一个参数里拿出 req
     */
    effectReqGetter?: (opt: any) => any;
    /**
     * 使用新版调用方式的 model
     */
    newModels?: EkkoModel[];
    /**
     * 服务端渲染时的请求上下文
     */
    reqCtx?: any;
}
export declare function makeRegisterEkko(createStoreEnhancer: any): (models: EkkoModelOld[], initialState: any, middlewares: any[] | undefined, config: RegisterEkkoConfig) => import("redux").Store<AnyStoreState, AnyAction>;
