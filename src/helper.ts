export function isServer() {
  return (process && typeof process === 'object' && typeof window === 'undefined') || false
}

export class ReducerCollector {
  private _reducers: Record<string, any>

  constructor() {
    this._reducers = {}
  }

  register(namespace: string, reducer: any) {
    if (process.env.NODE_ENV === 'development') {
      if (this._reducers[namespace]) {
        throw new Error(`发现重复定义的 model: ${namespace}，请检查 model 的 namespace 的重复。`)
      }
    }
    this._reducers[namespace] = reducer
  }

  toObject() {
    return this._reducers
  }
}
