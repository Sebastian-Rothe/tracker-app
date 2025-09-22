/**
 * APP STATE MANAGEMENT SYSTEM
 * Global state management with optimized performance and persistence
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorLogger } from './ErrorHandling';
import { appConfig } from './AppConfiguration';

// State change types
export type StateChangeType = 'SET' | 'UPDATE' | 'DELETE' | 'BATCH_UPDATE' | 'RESET';

// State change event
export interface StateChangeEvent<T = any> {
  type: StateChangeType;
  key: string;
  previousValue?: T;
  newValue?: T;
  timestamp: number;
}

// State listener function
export type StateListener<T = any> = (event: StateChangeEvent<T>) => void;

// State selector function
export type StateSelector<T, R> = (state: T) => R;

// State persistence options
export interface PersistenceOptions {
  enabled: boolean;
  key: string;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
  throttleMs?: number;
}

// State configuration
export interface StateConfig<T> {
  initialValue: T;
  persistence?: PersistenceOptions;
  middleware?: StateMiddleware<T>[];
}

// State middleware
export interface StateMiddleware<T> {
  name: string;
  beforeChange?: (key: string, oldValue: T, newValue: T) => T | Promise<T>;
  afterChange?: (key: string, oldValue: T, newValue: T) => void | Promise<void>;
}

/**
 * Advanced State Store
 */
export class StateStore {
  private static instance: StateStore;
  
  private state: Map<string, any> = new Map();
  private listeners: Map<string, Set<StateListener>> = new Map();
  private configs: Map<string, StateConfig<any>> = new Map();
  private persistenceTimers: Map<string, any> = new Map();
  private isInitialized = false;

  static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  /**
   * Initialize the state store
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load persisted state
      await this.loadPersistedState();
      this.isInitialized = true;
    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: 'Failed to initialize state store',
        stack: (error as Error).stack,
        severity: 'high' as any,
        component: 'StateStore'
      });
      throw error;
    }
  }

  /**
   * Create a new state
   */
  createState<T>(key: string, config: StateConfig<T>): void {
    if (this.state.has(key)) {
      throw new Error(`State '${key}' already exists`);
    }

    this.configs.set(key, config);
    this.state.set(key, config.initialValue);
    this.listeners.set(key, new Set());

    // Load persisted value if available
    if (config.persistence?.enabled) {
      this.loadStateFromStorage(key);
    }
  }

  /**
   * Get state value
   */
  getState<T>(key: string): T | undefined {
    return this.state.get(key);
  }

  /**
   * Set state value
   */
  async setState<T>(key: string, value: T | ((current: T) => T)): Promise<void> {
    const currentValue = this.state.get(key);
    const newValue = typeof value === 'function' ? (value as Function)(currentValue) : value;

    await this.internalUpdateState(key, currentValue, newValue, 'SET');
  }

  /**
   * Update state partially
   */
  async updatePartialState<T>(
    key: string, 
    updates: Partial<T> | ((current: T) => Partial<T>)
  ): Promise<void> {
    const currentValue = this.state.get(key);
    if (!currentValue || typeof currentValue !== 'object') {
      throw new Error(`Cannot update non-object state '${key}'`);
    }

    const updateValue = typeof updates === 'function' ? updates(currentValue) : updates;
    const newValue = { ...currentValue, ...updateValue };

    await this.internalUpdateState(key, currentValue, newValue, 'UPDATE');
  }

  /**
   * Internal state update with middleware and persistence
   */
  private async internalUpdateState<T>(
    key: string,
    oldValue: T,
    newValue: T,
    type: StateChangeType
  ): Promise<void> {
    if (!this.state.has(key)) {
      throw new Error(`State '${key}' does not exist`);
    }

    try {
      const config = this.configs.get(key);
      let processedValue = newValue;

      // Apply before-change middleware
      if (config?.middleware) {
        for (const middleware of config.middleware) {
          if (middleware.beforeChange) {
            processedValue = await middleware.beforeChange(key, oldValue, processedValue);
          }
        }
      }

      // Update state
      this.state.set(key, processedValue);

      // Create change event
      const event: StateChangeEvent<T> = {
        type,
        key,
        previousValue: oldValue,
        newValue: processedValue,
        timestamp: Date.now()
      };

      // Notify listeners
      this.notifyListeners(key, event);

      // Apply after-change middleware
      if (config?.middleware) {
        for (const middleware of config.middleware) {
          if (middleware.afterChange) {
            await middleware.afterChange(key, oldValue, processedValue);
          }
        }
      }

      // Handle persistence
      if (config?.persistence?.enabled) {
        this.schedulePersistence(key);
      }

    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: `Failed to update state '${key}'`,
        stack: (error as Error).stack,
        severity: 'medium' as any,
        component: 'StateStore',
        context: { key, type }
      });
      throw error;
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe<T>(key: string, listener: StateListener<T>): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    const listeners = this.listeners.get(key)!;
    listeners.add(listener);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners<T>(key: string, event: StateChangeEvent<T>): void {
    const listeners = this.listeners.get(key);
    if (!listeners) return;

    // Notify in next tick to avoid blocking
    setTimeout(() => {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          ErrorLogger.getInstance().logError({
            message: `State listener error for '${key}'`,
            stack: (error as Error).stack,
            severity: 'low' as any,
            component: 'StateStore'
          });
        }
      });
    }, 0);
  }

  /**
   * Schedule persistence to storage
   */
  private schedulePersistence(key: string): void {
    const config = this.configs.get(key);
    if (!config?.persistence?.enabled) return;

    // Clear existing timer
    const existingTimer = this.persistenceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new persistence
    const throttleMs = config.persistence.throttleMs || 1000;
    const timer = setTimeout(() => {
      this.persistStateToStorage(key);
      this.persistenceTimers.delete(key);
    }, throttleMs);

    this.persistenceTimers.set(key, timer);
  }

  /**
   * Persist state to storage
   */
  private async persistStateToStorage(key: string): Promise<void> {
    try {
      const config = this.configs.get(key);
      const value = this.state.get(key);

      if (!config?.persistence?.enabled || value === undefined) return;

      const storageKey = `state_${config.persistence.key || key}`;
      const serialized = config.persistence.serialize 
        ? config.persistence.serialize(value)
        : JSON.stringify(value);

      await AsyncStorage.setItem(storageKey, serialized);

    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: `Failed to persist state '${key}'`,
        stack: (error as Error).stack,
        severity: 'low' as any,
        component: 'StateStore'
      });
    }
  }

  /**
   * Load state from storage
   */
  private async loadStateFromStorage(key: string): Promise<void> {
    try {
      const config = this.configs.get(key);
      if (!config?.persistence?.enabled) return;

      const storageKey = `state_${config.persistence.key || key}`;
      const stored = await AsyncStorage.getItem(storageKey);

      if (stored) {
        const value = config.persistence.deserialize
          ? config.persistence.deserialize(stored)
          : JSON.parse(stored);

        this.state.set(key, value);
      }

    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: `Failed to load persisted state '${key}'`,
        stack: (error as Error).stack,
        severity: 'low' as any,
        component: 'StateStore'
      });
    }
  }

  /**
   * Load all persisted states
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stateKeys = keys.filter(k => k.startsWith('state_'));

      for (const storageKey of stateKeys) {
        const key = storageKey.replace('state_', '');
        if (this.configs.has(key)) {
          await this.loadStateFromStorage(key);
        }
      }

    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: 'Failed to load persisted states',
        stack: (error as Error).stack,
        severity: 'medium' as any,
        component: 'StateStore'
      });
    }
  }

  /**
   * Batch update multiple states
   */
  async batchUpdate(updates: Record<string, any>): Promise<void> {
    const promises = Object.entries(updates).map(([key, value]) =>
      this.setState(key, value)
    );

    await Promise.all(promises);
  }

  /**
   * Get state snapshot
   */
  getSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    for (const [key, value] of this.state.entries()) {
      snapshot[key] = value;
    }
    return snapshot;
  }
}

/**
 * React hook for using state
 */
export function useAppState<T>(
  key: string,
  selector?: StateSelector<T, any>
): [T | undefined, (value: T | ((current: T) => T)) => Promise<void>] {
  const store = StateStore.getInstance();
  const [state, setState] = useState<T | undefined>(() => store.getState<T>(key));

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = store.subscribe<T>(key, (event) => {
      setState(event.newValue);
    });

    return unsubscribe;
  }, [key, store]);

  // State setter
  const setAppState = useCallback(async (value: T | ((current: T) => T)) => {
    await store.setState(key, value);
  }, [key, store]);

  // Apply selector if provided
  const selectedState = useMemo(() => {
    if (selector && state !== undefined) {
      return selector(state);
    }
    return state;
  }, [state, selector]);

  return [selectedState, setAppState];
}

/**
 * Common middleware implementations
 */
export const CommonMiddleware = {
  // Validation middleware
  validation: <T>(validator: (value: T) => boolean | string): StateMiddleware<T> => ({
    name: 'validation',
    beforeChange: async (key, oldValue, newValue) => {
      const result = validator(newValue);
      if (result === false) {
        throw new Error(`Validation failed for state '${key}'`);
      } else if (typeof result === 'string') {
        throw new Error(`Validation failed for state '${key}': ${result}`);
      }
      return newValue;
    }
  }),

  // Logging middleware
  logging: <T>(logLevel: 'debug' | 'info' = 'debug'): StateMiddleware<T> => ({
    name: 'logging',
    afterChange: async (key, oldValue, newValue) => {
      if (appConfig.isDevelopment()) {
        console.log(`[StateStore] ${key}:`, { oldValue, newValue });
      }
    }
  })
};

// Global state store instance
export const appState = StateStore.getInstance();

export default {
  StateStore,
  useAppState,
  CommonMiddleware,
  appState
};