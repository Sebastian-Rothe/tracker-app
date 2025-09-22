/**
 * BACKGROUND PROCESSING SERVICE
 * Non-blocking operations, queue management, and performance optimization
 * Handles expensive operations without blocking the UI thread
 */

import { InteractionManager } from 'react-native';
import { ErrorLogger } from './ErrorHandling';

// Task priority levels
export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

// Task interface
export interface BackgroundTask {
  id: string;
  name: string;
  priority: TaskPriority;
  task: () => Promise<any> | any;
  timeout?: number;
  retries?: number;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  dependencies?: string[]; // Task IDs that must complete first
}

// Task result
export interface TaskResult {
  id: string;
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  retryCount: number;
}

/**
 * Background Processing Service
 * Manages queue of non-blocking operations
 */
export class BackgroundProcessor {
  private static instance: BackgroundProcessor;
  
  private taskQueue: BackgroundTask[] = [];
  private runningTasks: Map<string, Promise<TaskResult>> = new Map();
  private completedTasks: Map<string, TaskResult> = new Map();
  private isProcessing = false;
  private maxConcurrentTasks = 3;
  
  static getInstance(): BackgroundProcessor {
    if (!BackgroundProcessor.instance) {
      BackgroundProcessor.instance = new BackgroundProcessor();
    }
    return BackgroundProcessor.instance;
  }

  /**
   * Add task to processing queue
   */
  async addTask(task: BackgroundTask): Promise<string> {
    // Generate ID if not provided
    if (!task.id) {
      task.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set defaults
    task.priority = task.priority ?? TaskPriority.NORMAL;
    task.timeout = task.timeout ?? 30000; // 30 seconds default
    task.retries = task.retries ?? 2;
    
    // Add to queue
    this.taskQueue.push(task);
    
    // Sort by priority (higher priority first)
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return task.id;
  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.taskQueue.length > 0 && this.runningTasks.size < this.maxConcurrentTasks) {
        const task = this.taskQueue.shift();
        if (!task) continue;

        // Check dependencies
        if (task.dependencies && task.dependencies.length > 0) {
          const dependenciesMet = task.dependencies.every(depId => 
            this.completedTasks.has(depId) && this.completedTasks.get(depId)?.success
          );

          if (!dependenciesMet) {
            // Put task back in queue and try later
            this.taskQueue.push(task);
            continue;
          }
        }

        // Start task execution
        const taskPromise = this.executeTask(task);
        this.runningTasks.set(task.id, taskPromise);

        // Handle completion
        taskPromise.finally(() => {
          this.runningTasks.delete(task.id);
          
          // Continue processing queue
          if (this.taskQueue.length > 0) {
            setTimeout(() => this.processQueue(), 10);
          } else if (this.runningTasks.size === 0) {
            this.isProcessing = false;
          }
        });
      }
    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: 'Error in background processor queue',
        stack: (error as Error).stack,
        severity: 'high' as any,
        component: 'BackgroundProcessor'
      });
      this.isProcessing = false;
    }
  }

  /**
   * Execute individual task with timeout and retry logic
   */
  private async executeTask(task: BackgroundTask): Promise<TaskResult> {
    const startTime = Date.now();
    let retryCount = 0;
    
    while (retryCount <= (task.retries || 0)) {
      try {
        // Wait for interactions to complete before starting heavy tasks
        await new Promise<void>(resolve => {
          InteractionManager.runAfterInteractions(() => resolve());
        });

        // Execute task with timeout
        const result = await this.executeWithTimeout(task.task, task.timeout || 30000);
        
        const taskResult: TaskResult = {
          id: task.id,
          success: true,
          result,
          duration: Date.now() - startTime,
          retryCount
        };

        // Store result
        this.completedTasks.set(task.id, taskResult);
        
        // Call success callback
        task.onSuccess?.(result);

        return taskResult;

      } catch (error) {
        retryCount++;
        
        if (retryCount > (task.retries || 0)) {
          // Final failure
          const taskResult: TaskResult = {
            id: task.id,
            success: false,
            error: error as Error,
            duration: Date.now() - startTime,
            retryCount: retryCount - 1
          };

          this.completedTasks.set(task.id, taskResult);
          
          // Log error
          ErrorLogger.getInstance().logError({
            message: `Background task failed: ${task.name}`,
            stack: (error as Error).stack,
            severity: 'medium' as any,
            component: 'BackgroundProcessor',
            context: { taskId: task.id, retryCount }
          });

          // Call error callback
          task.onError?.(error as Error);

          return taskResult;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    throw new Error('Task execution failed after all retries');
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T> | T,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): 'pending' | 'running' | 'completed' | 'not-found' {
    if (this.runningTasks.has(taskId)) return 'running';
    if (this.completedTasks.has(taskId)) return 'completed';
    if (this.taskQueue.some(task => task.id === taskId)) return 'pending';
    return 'not-found';
  }

  /**
   * Get task result
   */
  getTaskResult(taskId: string): TaskResult | null {
    return this.completedTasks.get(taskId) || null;
  }

  /**
   * Cancel pending task
   */
  cancelTask(taskId: string): boolean {
    const index = this.taskQueue.findIndex(task => task.id === taskId);
    if (index >= 0) {
      this.taskQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear completed tasks from memory
   */
  cleanupCompletedTasks(olderThanMs: number = 5 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    
    for (const [taskId, result] of this.completedTasks.entries()) {
      if (result.duration < cutoff) {
        this.completedTasks.delete(taskId);
      }
    }
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    averageDuration: number;
  } {
    const completed = Array.from(this.completedTasks.values());
    const successful = completed.filter(t => t.success);
    const failed = completed.filter(t => !t.success);
    
    const averageDuration = successful.length > 0 
      ? successful.reduce((sum, t) => sum + t.duration, 0) / successful.length 
      : 0;

    return {
      pending: this.taskQueue.length,
      running: this.runningTasks.size,
      completed: successful.length,
      failed: failed.length,
      averageDuration: Math.round(averageDuration)
    };
  }
}

/**
 * High-level background processing utilities
 */
export const BackgroundUtils = {
  // Process expensive calculation in background
  processCalculation: async <T>(
    calculation: () => T,
    name: string = 'calculation',
    priority: TaskPriority = TaskPriority.NORMAL
  ): Promise<T> => {
    const processor = BackgroundProcessor.getInstance();
    
    return new Promise((resolve, reject) => {
      processor.addTask({
        id: `calc_${Date.now()}`,
        name,
        priority,
        task: calculation,
        onSuccess: resolve,
        onError: reject
      });
    });
  },

  // Process array operations in chunks
  processArrayInChunks: async <T, R>(
    array: T[],
    processor: (item: T) => R,
    chunkSize: number = 10,
    priority: TaskPriority = TaskPriority.NORMAL
  ): Promise<R[]> => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    const results: R[] = [];
    const backgroundProcessor = BackgroundProcessor.getInstance();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      await new Promise<void>((resolve, reject) => {
        backgroundProcessor.addTask({
          id: `chunk_${i}`,
          name: `Array processing chunk ${i + 1}/${chunks.length}`,
          priority,
          task: () => chunk.map(processor),
          onSuccess: (chunkResults) => {
            results.push(...chunkResults);
            resolve();
          },
          onError: reject
        });
      });
    }

    return results;
  },

  // Preload data in background
  preloadData: async (
    dataLoader: () => Promise<any>,
    cacheKey: string,
    priority: TaskPriority = TaskPriority.LOW
  ): Promise<string> => {
    const processor = BackgroundProcessor.getInstance();
    
    return processor.addTask({
      id: `preload_${cacheKey}`,
      name: `Preload ${cacheKey}`,
      priority,
      task: dataLoader
    });
  }
};

// Global instance
export const backgroundProcessor = BackgroundProcessor.getInstance();

export default {
  BackgroundProcessor,
  BackgroundUtils,
  backgroundProcessor,
  TaskPriority
};