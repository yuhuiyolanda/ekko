import * as React from 'react';
import type { Store } from 'redux';
import { Provider } from 'react-redux';
import type { EkkoStoreFactory } from './index';
declare const DEFAULT_KEY = "__NEXT_REDUX_STORE__";
declare global {
    interface Window {
        [DEFAULT_KEY]: Store;
    }
}
declare const _default: (App: any, storeFactory: EkkoStoreFactory) => {
    new (props: any): {
        reduxStore: Store;
        render(): React.CElement<import("react-redux").ProviderProps<import("redux").Action<any>>, Provider<import("redux").Action<any>>>;
        context: any;
        setState<K extends never>(state: {} | ((prevState: Readonly<{}>, props: Readonly<{}>) => {} | Pick<{}, K> | null) | Pick<{}, K> | null, callback?: (() => void) | undefined): void;
        forceUpdate(callback?: (() => void) | undefined): void;
        readonly props: Readonly<{}> & Readonly<{
            children?: React.ReactNode;
        }>;
        state: Readonly<{}>;
        refs: {
            [key: string]: React.ReactInstance;
        };
        componentDidMount?(): void;
        shouldComponentUpdate?(nextProps: Readonly<{}>, nextState: Readonly<{}>, nextContext: any): boolean;
        componentWillUnmount?(): void;
        componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void;
        getSnapshotBeforeUpdate?(prevProps: Readonly<{}>, prevState: Readonly<{}>): any;
        componentDidUpdate?(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void;
        componentWillMount?(): void;
        UNSAFE_componentWillMount?(): void;
        componentWillReceiveProps?(nextProps: Readonly<{}>, nextContext: any): void;
        UNSAFE_componentWillReceiveProps?(nextProps: Readonly<{}>, nextContext: any): void;
        componentWillUpdate?(nextProps: Readonly<{}>, nextState: Readonly<{}>, nextContext: any): void;
        UNSAFE_componentWillUpdate?(nextProps: Readonly<{}>, nextState: Readonly<{}>, nextContext: any): void;
    };
    getInitialProps(appContext: any): Promise<{
        initialReduxState: any;
    }>;
    contextType?: React.Context<any> | undefined;
};
export default _default;
