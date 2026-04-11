/** Simple promise-based delay. */
export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Concurrent task runner with a fixed worker-pool size.
 * Preserves result ordering (index-stable).
 */
export async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, worker)
  );
  return results;
}
