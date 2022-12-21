import * as React from 'react'
import type { Store } from 'redux'
import { Provider } from 'react-redux'

import { isServer } from './helper'
import type { EkkoStoreFactory } from './index'

const DEFAULT_KEY = '__NEXT_REDUX_STORE__'

declare global {
  interface Window {
    [DEFAULT_KEY]: Store
  }
}

export default (App: any, storeFactory: EkkoStoreFactory) => {
  function getOrCreateStore(state: any = null, ctx: any = null) {
    if (isServer()) {
      return storeFactory(state, ctx)
    }

    if (window && !window[DEFAULT_KEY]) {
      window[DEFAULT_KEY] = storeFactory(state, ctx)
    }

    return window[DEFAULT_KEY]
  }

  return class AppWithRedux extends React.Component {
    static async getInitialProps(appContext: any) {
      const req = appContext.req || appContext?.ctx?.req
      const res = appContext.res || appContext?.ctx?.res

      const reqCtx = req && res ? { req, res } : null
      const reduxStore = getOrCreateStore(null, reqCtx)

      appContext.ctx
        ? appContext.ctx.req
          ? (appContext.ctx.req.reduxStore = reduxStore)
          : (appContext.ctx.reduxStore = reduxStore)
        : (appContext.reduxStore = reduxStore)

      let appProps = {}

      if (typeof App.getInitialProps === 'function') {
        appProps = await App.getInitialProps(appContext)
      }

      return {
        ...appProps,
        initialReduxState: reduxStore.getState(),
      }
    }

    reduxStore: Store

    constructor(props: any) {
      super(props)
      this.reduxStore = getOrCreateStore(props.initialReduxState)
    }

    render() {
      return React.createElement(
        Provider,
        {
          store: this.reduxStore,
        },
        React.createElement(App, {
          ...this.props,
          store: this.reduxStore,
        }),
      )
    }
  }
}
