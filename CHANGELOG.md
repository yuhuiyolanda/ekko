### 1.0.0-beta.10

- 优化 type 定义

### 1.0.0-beta.9

- 动态生成 setter actions
- 兼容模式下正确处理无参数的 action 的调用

### 1.0.0-beta.8

- 修复旧版 model 服务端渲染会引用 store

### 1.0.0-beta.7

- 修复 getStoreFromNextContext 在 PageContext 下无法获取 store

### 1.0.0-beta.6

- 旧版模型的 effects 增加返回值类型推导

### 1.0.0-beta.5

- 从 index export `createOldModel`

### 1.0.0-beta.4

- 旧版 model 增加专门的 type，使用 `createOldModel` 创建

### 1.0.0-beta.3

- 添加测试用例
- 优化旧版 model 模式的报错
- getStoreFromNextContext 逻辑修复

### 1.0.0-beta.2

- namespace 冲突检测
- 添加增强过的 dispatch 的 type

### 1.0.0-beta.1

- 使用 `createModel` 创建 model，拥有更好的自动类型推导
- 服务端渲染不需要带上 `req`。(注：如果使用旧版兼容模式的 model 还是需要)
- `createModel(model, { immer: true })` 支持在 reducer 中使用 `immer`，支持直接修改 state 的属性来更新数据，如：`state.xxxx = somethingNew`
- 支持在 effect 里使用 `this.call` 调用 service 会自动最后个参数带上 `req`
- actions 和 effects 的调用全部用 `dispatch` 的方式 `dispatch(XxxxModel.actions.setXxx(a, b, c))`
- 支持在 model 里面声明 `selectors` 方便复用
- **超低迁移成本** 兼容旧版 registerEkko，几乎无缝迁移
  - model 的修改
    - 需要给所有 model 包上 `createModel` 调用
    - getState 改名为 getRootState
    - getModelState 改名为 getState
  - 支持新旧混用，新版 model 可以拥有新版的带来的方便功能

