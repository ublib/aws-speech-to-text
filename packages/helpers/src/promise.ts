/**
 * !ref: https://github.com/tc39/proposal-promise-with-resolvers
 */
export interface PromiseWithResolvers<T = unknown> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

/**
 * !ref: https://github.com/tc39/proposal-promise-with-resolvers
 */
export const promiseWithResolvers = <T = unknown>(): PromiseWithResolvers<T> => {
  let resolve: PromiseWithResolvers<T>["resolve"];
  let reject: PromiseWithResolvers<T>["reject"];
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { resolve: resolve!, reject: reject!, promise };
};
