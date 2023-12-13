/**
 * this class is used to queue async tasks.
 */
export class AsyncQueue {
  public readonly queue: (() => Promise<void> | void)[] = [];

  /**
   * push a task to the queue. If the queue is empty, the task will be executed immediately.
   */
  push(task: () => Promise<void> | void): void {
    this.queue.push(task);
    if (this.queue.length === 1) {
      this.run();
    }
  }

  /**
   * recursively run the tasks in the queue.
   * Stop when the queue is empty.
   */
  private async run(): Promise<void> {
    const task = this.queue[0];
    if (!task) return;
    try {
      await task();
    } catch (error) {
      console.error(`Error executing task: ${error}`);
    } finally {
      this.queue.shift();
    }
    await this.run();
  }
}
