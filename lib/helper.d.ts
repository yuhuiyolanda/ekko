export declare function isServer(): boolean;
export declare class ReducerCollector {
    private _reducers;
    constructor();
    register(namespace: string, reducer: any): void;
    toObject(): Record<string, any>;
}
