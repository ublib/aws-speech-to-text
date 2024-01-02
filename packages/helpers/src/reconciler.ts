export interface Reconciler<T, U> {
  stack: (v: T) => void;
  flush: () => void;
  getResult: () => U;
}

export type Into<T, U> = (v: T) => U;

export type Concat<U> = (lhs: U, rhs: U) => U;

export const createReconciler = <T, U>(into: Into<T, U>, concat: Concat<U>, initial: U): Reconciler<T, U> => {
  let result: U = initial;
  let partialResult: U | null = null;

  const stack = (v: T) => {
    partialResult = partialResult ? concat(partialResult, into(v)) : into(v);
  };

  const flush = () => {
    if (partialResult === null) return;
    result = concat(result, partialResult);
    partialResult = null;
  };

  const getResult = (): U => {
    flush();
    return result;
  };

  return { stack, flush, getResult };
};
