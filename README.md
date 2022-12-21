## @tuya-fe/ekko

通过 model + services 的配置来简化 action/reducer/dispatch 操作流程和样板代码，封装了
- `redux`, `react-redux`, `redux-thunk`
- `immer` (用于支持直接在 reducer 里直接修改 state，使表达更简洁)
- `redux-devtools-extension` (仅非 production 环境启用)
- `redux-logger` (仅非 production 环境启用)。

> 旧版用户建议看完下面的版本说明后再看 [迁移说明](#迁移说明)
>
> 为了正常的 type 推导，需要 typescript 版本 >= 4.1

#### 版本说明 1.0.0

- 必须使用 `createModel` 创建 model，拥有更好的自动类型推导
- 自动根据 state 的 key 生成 setXxxx 的 actions （例如 state: { aaa: 1 }, 会自动生成 setAaa 的 action）
- 服务端渲染不需要带上 `req`。(注：如果使用旧版兼容模式的 model 还是需要)
- `createModel(model, { immer: true })` 支持在 reducer 中使用 `immer`，支持直接修改 state 的属性来更新数据，如：`state.xxxx = somethingNew`
- 支持在 effect 里使用 `this.call` 调用 service 会自动最后个参数带上 `req`
- actions 和 effects 的调用全部用 `dispatch` 的方式 `dispatch(XxxxModel.actions.setXxx(a, b, c))`
- 支持在 model 里面声明 `selectors` 方便复用
- **超低迁移成本** 兼容旧版 registerEkko，几乎无缝迁移，旧版 model 保留旧版所有的行为
  - model 的修改
    - 需要给所有 model 包上 `createOldModel` 调用
    - `model.getState` 改名为 `model.getRootState`
    - `model.getModelState` 改名为 `model.getState`
  - 支持新旧混用

### 使用介绍

```bash
# 安装 beta 版本
yarn add @tuya-fe/ekko@beta
```

#### Model 文件

model 中的 reducers 会转化成 ActionCreators, effects 会转化成 AsyncActionCreators, 在代码中使用的时候需要调用 store.dispatch 产生效果 `store.dispatch(XXModel.actions.xxAction())`

> 如果是旧版的 model, 使用 registerEkko 方法注册的，还是旧版的使用方式，没有变化，README 最后有更多的 [迁移说明](#迁移说明)

创建一个 model
 `models/apiTest/apiTest.model.ts`：

```typescript
// import 相关的 services
import ApiTestServices, { IApiTestParams } from './services'
import { createModel } from "@tuya-fe/ekko";

// 统一使用 createModel 创建 model
const ApiModel = createModel({
  // model 的初始化 state
  state: {
    name:'',
    value:"",
    list: []
  },
  namespace: 'api',
  // reducers
  reducers: {
    setName(state, data) {
      return { ...state, name: data };
    },
    // 如果 createModel 第二个参数传了 { immer: true }，就可以这么写，第一个参数名建议用 `acc`
    setNameImmer(acc, data) {
      acc.name = data
    },
    setValue(state, data) {
      return { ...state, name: data };
    },
    setList(state, data) {
      return { ...state, list: [...state.list, data] };
    }
  },
  // effects
  effects: {
    setName(name) {
      this.dispatch(ApiModel.actions.setName(name));
    },
    setValue(value) {
      this.dispatch(ApiModel.actions.setValue(value));
    },
    async getList(query: IApiTestParams) {
      const list = await this.call(ApiTestServices.fetchApiTest, query)
      this.dispatch(ApiModel.actions.setList(list));
    }
  }
});

// model 中 state 的 type 可以这么获取
export type IState = typeof ApiModel.initialState

export default ApiModel;
```

#### 请求接口的`services`代码

`models/apiTest/apiTest.services.ts`：

(可以和服务端确认该项目接口是否上`api管控平台`，如果已接入，可以使用[`sif`](https://registry.code.tuya-inc.top/guyi/Sif)工具生成`services`代码)

```javascript
import fetch from "@utils/fetch";

// 输出入参类型
export interface IApiTestParams {
  keywords: string;
}

const ApiTestServices = {
  fetchApiTest(params: IApiTestParams, opts: any = {}) {
    return fetch({
      url: "/api/test/array",
      body: params,
      method: "GET",
      opts
    });
  }
};

export default ApiTestServices;
```

#### 创建`store`的代码

`models/index.ts`：

```javascript
import { createEkkoStoreFactory } from "@tuya-fe/ekko";
import apiModel from "./apiTest.model";

export default createEkkoStoreFactory([apiModel]);
```

如果是`spa`的项目，可以生成完 factory 后直接调用产生 store 

```js
export createEkkoStoreFactory([apiModel])()
```

#### 页面使用代码

`pages/index/index.ts`：

```javascript
import * as React from "react";
import Link from "@tuya-fe/next/link";
import IndexComponent from "@components/pages/index";
import { connect } from "redux"
// 引入 testModel
import { testModel } from "@models";

class Index extends React.Component<any> {
  async componentDidMount() {
    await this.props.dispatch(testModel.effects.asQuery({ keywords: "12" }));
  }

  render() {
    return <IndexComponent />;
  }
}

export default connect(mapStateToProps)(Index);
```

#### 注意 (nextjs-withRedux 使用)

如果需要使用 `withRedux` 方法来关联 `server` 和 `client` 的 `ruduxState`，则使用如下代码引入 `withRedux`，在 `nextjs`里的`_app.tsx`：

```js
// 引入models 的 createStore
import createStore from "../models"
import { getStoreFromNextContext, withRedux } from '@tuya-fe/ekko'

class MyApp extends Component {
  static async getInitialProps(options) {
    // 使用 getStoreFromNextContext 从 options 里获取 store
    const store = getStoreFromNextContext(options)

    await store.dispatch(XxxModel.effects.getUserInfo({id: 1}))
  }

  render(){
    const { store, ...props } = this.props

    return (
      // _app 的渲染逻辑
      // 里面不需要引入 redux 的 Provider
    )
  }
}

 export default withRedux(MyApp, createStore)

```

### 迁移说明

1. 先把项目里现有的 model 代码使用 createOldModel 包上

```typescript
// 比如可能有类似这样的代码
const model: NSEkko.IEkkoModel<TState, TReducers, TEffects> = {
  //...
}
// 修改为
const XXXModel = createOldModel({
  //...
})
export type TState = typeof XXXModel.initialState
```

2. 在 models/index.ts 可能有段生成 store 的代码

```typescript
// 可能类似这样
export default (state) => {
  const store = registerEkko([...Object.values(models)], state)
  return store
}
// 要改为
export default (state, reqCtx) => {
    const store = registerEkko([...Object.values(models)], state, undefined, {
      reqCtx,
      // 从调用 effect 时传的最后一个参数里面拿出 req 的方法，下面是默认的实现，可以根据自己项目的规范传入自己的实现
      effectReqGetter(opts) {
        return opts.req
      },
      // 这里可以传入新版 model，因为新版 model 调用方式不同
      // 建议新版 model 在名字上用前缀区分，比如 NUserModel
      newModels: [NUserModel, NXxxModel2]
    })
  return store
}
```

3. 修改 _app.tsx 中的代码

```typescript
static async getInitialProps(options) {
  // 使用框架带的工具函数来获取 store
  const store = getStoreFromNextContext(options)

  // 旧版 model 的调用代码还是保持一致，新版 model 要使用新版的调用方式
}

// render 函数的修改，
render() {
  // 如果 render 函数里使用了 redux 的 Provider，直接删掉就行
  // 可以在 App 的 props 里拿到 store 实例
  const { store, ...props } = this.props
}
```

4. 修改 model 的 getState 的调用
   - 在 React 组件中建议还是使用 connect 或者 useSelector 来获取 state (`注意` _app.tsx 不要用 connect，直接使用 props 里的 store)
   - 将项目中使用 `model.getState` 的方法替换为 `model.getRootState`
   - 将项目中使用 `model.getModelState` 的方法替换为 `model.getState`
