/**
 * Wraps an asynchronous task so every caller shares the same promise and the
 * task is started at most once. Keep the rejected promise too: a failed WASM
 * runtime must not be initialized again in the same page context.
 */
export function singleFlight<T>(task: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null

  return () => {
    if (promise) return promise
    promise = Promise.resolve().then(task)
    return promise
  }
}
