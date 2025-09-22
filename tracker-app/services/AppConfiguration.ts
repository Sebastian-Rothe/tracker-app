/**
 * APP CONFIGURATION SERVICE
 * Environment-specific settings, feature flags, and runtime configuration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions } from 'react-native';
import { ErrorLogger } from './ErrorHandling';

// Environment types
export type AppEnvironment = 'development' | 'staging' | 'production';

// Configuration categories
export interface AppConfig {
  environment: AppEnvironment;
  version: string;
  buildNumber: string;
  
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  
  // Storage Configuration
  storage: {
    maxCacheSize: number;
    cacheExpirationTime: number;
    enableEncryption: boolean;
    backupInterval: number;
  };
  
  // Performance Configuration
  performance: {
    enableMetrics: boolean;
    metricsSampleRate: number;
    maxMemoryUsage: number;
    enableProfiling: boolean;
    backgroundTaskConcurrency: number;
  };
  
  // UI Configuration
  ui: {
    animationDuration: number;
    enableHapticFeedback: boolean;
    enableSounds: boolean;
    defaultTheme: 'light' | 'dark' | 'auto';
    enableAdvancedAnimations: boolean;
  };
  
  // Analytics Configuration
  analytics: {
    enabled: boolean;
    trackingId?: string;
    enableCrashReporting: boolean;
    enablePerformanceTracking: boolean;
    dataSampleRate: number;
  };
  
  // Feature Flags
  features: {
    enableBackgroundSync: boolean;
    enableCloudBackup: boolean;
    enableAdvancedStats: boolean;
    enableSharing: boolean;
    enableNotifications: boolean;
    enableExport: boolean;
    enableImport: boolean;
    enableBetaFeatures: boolean;
  };
  
  // Security Configuration
  security: {
    enableBiometricAuth: boolean;
    sessionTimeout: number;
    enableDataEncryption: boolean;
    requirePinCode: boolean;
    maxFailedAttempts: number;
  };
}

// Device information
export interface DeviceInfo {
  platform: 'ios' | 'android';
  version: string;
  screenWidth: number;
  screenHeight: number;
  isTablet: boolean;
  hasNotch: boolean;
  supportsBiometrics: boolean;
  memorySize?: number;
}

// Configuration environments
const CONFIGURATIONS: Record<AppEnvironment, Partial<AppConfig>> = {
  development: {
    api: {
      baseUrl: 'http://localhost:3000',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000
    },
    storage: {
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      cacheExpirationTime: 24 * 60 * 60 * 1000, // 24 hours
      enableEncryption: false,
      backupInterval: 60 * 60 * 1000 // 1 hour
    },
    performance: {
      enableMetrics: true,
      metricsSampleRate: 1.0,
      maxMemoryUsage: 256 * 1024 * 1024, // 256MB
      enableProfiling: true,
      backgroundTaskConcurrency: 2
    },
    ui: {
      animationDuration: 300,
      enableHapticFeedback: true,
      enableSounds: true,
      defaultTheme: 'auto',
      enableAdvancedAnimations: true
    },
    analytics: {
      enabled: false,
      enableCrashReporting: true,
      enablePerformanceTracking: true,
      dataSampleRate: 1.0
    },
    features: {
      enableBackgroundSync: true,
      enableCloudBackup: false,
      enableAdvancedStats: true,
      enableSharing: true,
      enableNotifications: true,
      enableExport: true,
      enableImport: true,
      enableBetaFeatures: true
    },
    security: {
      enableBiometricAuth: false,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enableDataEncryption: false,
      requirePinCode: false,
      maxFailedAttempts: 5
    }
  },
  
  staging: {
    api: {
      baseUrl: 'https://staging-api.routinetracker.app',
      timeout: 15000,
      retryAttempts: 3,
      retryDelay: 2000
    },
    storage: {
      maxCacheSize: 200 * 1024 * 1024, // 200MB
      cacheExpirationTime: 12 * 60 * 60 * 1000, // 12 hours
      enableEncryption: true,
      backupInterval: 6 * 60 * 60 * 1000 // 6 hours
    },
    performance: {
      enableMetrics: true,
      metricsSampleRate: 0.5,
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      enableProfiling: false,
      backgroundTaskConcurrency: 3
    },
    ui: {
      animationDuration: 250,
      enableHapticFeedback: true,
      enableSounds: true,
      defaultTheme: 'auto',
      enableAdvancedAnimations: true
    },
    analytics: {
      enabled: true,
      trackingId: 'staging-tracker-id',
      enableCrashReporting: true,
      enablePerformanceTracking: true,
      dataSampleRate: 0.1
    },
    features: {
      enableBackgroundSync: true,
      enableCloudBackup: true,
      enableAdvancedStats: true,
      enableSharing: true,
      enableNotifications: true,
      enableExport: true,
      enableImport: true,
      enableBetaFeatures: false
    },
    security: {
      enableBiometricAuth: true,
      sessionTimeout: 15 * 60 * 1000, // 15 minutes
      enableDataEncryption: true,
      requirePinCode: false,
      maxFailedAttempts: 3
    }
  },
  
  production: {
    api: {
      baseUrl: 'https://api.routinetracker.app',
      timeout: 20000,
      retryAttempts: 2,
      retryDelay: 3000
    },
    storage: {
      maxCacheSize: 500 * 1024 * 1024, // 500MB
      cacheExpirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      enableEncryption: true,
      backupInterval: 24 * 60 * 60 * 1000 // 24 hours
    },
    performance: {
      enableMetrics: false,
      metricsSampleRate: 0.01,
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
      enableProfiling: false,
      backgroundTaskConcurrency: 4
    },
    ui: {
      animationDuration: 200,
      enableHapticFeedback: true,
      enableSounds: true,
      defaultTheme: 'auto',
      enableAdvancedAnimations: false
    },
    analytics: {
      enabled: true,
      trackingId: 'production-tracker-id',
      enableCrashReporting: true,
      enablePerformanceTracking: false,
      dataSampleRate: 0.05
    },
    features: {
      enableBackgroundSync: true,
      enableCloudBackup: true,
      enableAdvancedStats: true,
      enableSharing: true,
      enableNotifications: true,
      enableExport: true,
      enableImport: true,
      enableBetaFeatures: false
    },
    security: {
      enableBiometricAuth: true,
      sessionTimeout: 10 * 60 * 1000, // 10 minutes
      enableDataEncryption: true,
      requirePinCode: true,
      maxFailedAttempts: 3
    }
  }
};

/**
 * Configuration Manager Service
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfig;
  private deviceInfo: DeviceInfo;
  private userOverrides: Partial<AppConfig> = {};
  
  private constructor() {
    this.config = this.buildConfiguration();
    this.deviceInfo = this.getDeviceInformation();
    this.loadUserOverrides();
  }
  
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Build configuration based on environment
   */
  private buildConfiguration(): AppConfig {
    const environment = this.getEnvironment();
    const baseConfig = CONFIGURATIONS[environment];
    
    // Default configuration
    const defaultConfig: AppConfig = {
      environment,
      version: '1.0.0',
      buildNumber: '1',
      
      api: {
        baseUrl: '',
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000
      },
      
      storage: {
        maxCacheSize: 100 * 1024 * 1024,
        cacheExpirationTime: 24 * 60 * 60 * 1000,
        enableEncryption: false,
        backupInterval: 60 * 60 * 1000
      },
      
      performance: {
        enableMetrics: false,
        metricsSampleRate: 0.1,
        maxMemoryUsage: 256 * 1024 * 1024,
        enableProfiling: false,
        backgroundTaskConcurrency: 2
      },
      
      ui: {
        animationDuration: 300,
        enableHapticFeedback: true,
        enableSounds: true,
        defaultTheme: 'auto',
        enableAdvancedAnimations: true
      },
      
      analytics: {
        enabled: false,
        enableCrashReporting: true,
        enablePerformanceTracking: false,
        dataSampleRate: 0.1
      },
      
      features: {
        enableBackgroundSync: true,
        enableCloudBackup: false,
        enableAdvancedStats: true,
        enableSharing: true,
        enableNotifications: true,
        enableExport: true,
        enableImport: true,
        enableBetaFeatures: false
      },
      
      security: {
        enableBiometricAuth: false,
        sessionTimeout: 30 * 60 * 1000,
        enableDataEncryption: false,
        requirePinCode: false,
        maxFailedAttempts: 5
      }
    };

    // Merge with environment-specific config
    return this.mergeConfigurations(defaultConfig, baseConfig);
  }

  /**
   * Determine current environment
   */
  private getEnvironment(): AppEnvironment {
    // In a real app, this would check build flags or environment variables
    if (__DEV__) {
      return 'development';
    }
    
    // You could check for staging builds here
    // if (STAGING_BUILD) return 'staging';
    
    return 'production';
  }

  /**
   * Get device information
   */
  private getDeviceInformation(): DeviceInfo {
    const { width, height } = Dimensions.get('window');
    const isTablet = Math.min(width, height) >= 768;
    
    return {
      platform: Platform.OS as 'ios' | 'android',
      version: Platform.Version.toString(),
      screenWidth: width,
      screenHeight: height,
      isTablet,
      hasNotch: false, // Would need device-specific detection
      supportsBiometrics: false, // Would need biometric library check
      memorySize: undefined // Would need device info library
    };
  }

  /**
   * Load user-specific configuration overrides
   */
  private async loadUserOverrides(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('user_config_overrides');
      if (stored) {
        this.userOverrides = JSON.parse(stored);
        this.config = this.mergeConfigurations(this.config, this.userOverrides);
      }
    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: 'Failed to load user configuration overrides',
        stack: (error as Error).stack,
        severity: 'low' as any,
        component: 'ConfigurationManager'
      });
    }
  }

  /**
   * Save user configuration overrides
   */
  async saveUserOverrides(overrides: Partial<AppConfig>): Promise<void> {
    try {
      this.userOverrides = { ...this.userOverrides, ...overrides };
      await AsyncStorage.setItem('user_config_overrides', JSON.stringify(this.userOverrides));
      this.config = this.mergeConfigurations(this.config, this.userOverrides);
    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: 'Failed to save user configuration overrides',
        stack: (error as Error).stack,
        severity: 'medium' as any,
        component: 'ConfigurationManager'
      });
      throw error;
    }
  }

  /**
   * Merge configuration objects
   */
  private mergeConfigurations(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    const merged = { ...base };
    
    Object.keys(override).forEach(key => {
      const typedKey = key as keyof AppConfig;
      const overrideValue = override[typedKey];
      
      if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
        const baseValue = merged[typedKey];
        if (baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
          merged[typedKey] = { ...baseValue, ...overrideValue } as any;
        } else {
          merged[typedKey] = overrideValue as any;
        }
      } else if (overrideValue !== undefined) {
        merged[typedKey] = overrideValue as any;
      }
    });
    
    return merged;
  }

  /**
   * Get full configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get specific configuration section
   */
  getSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return this.config[section];
  }

  /**
   * Get device information
   */
  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Update feature flag
   */
  async setFeatureEnabled(feature: keyof AppConfig['features'], enabled: boolean): Promise<void> {
    const override: Partial<AppConfig> = {
      features: {
        ...this.config.features,
        [feature]: enabled
      }
    };
    
    await this.saveUserOverrides(override);
  }

  /**
   * Get configuration value with fallback
   */
  getValue<T>(path: string, fallback: T): T {
    const keys = path.split('.');
    let current: any = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback;
      }
    }
    
    return current !== undefined ? current : fallback;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Get environment-specific API base URL
   */
  getApiBaseUrl(): string {
    return this.config.api.baseUrl;
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      await AsyncStorage.removeItem('user_config_overrides');
      this.userOverrides = {};
      this.config = this.buildConfiguration();
    } catch (error) {
      ErrorLogger.getInstance().logError({
        message: 'Failed to reset configuration to defaults',
        stack: (error as Error).stack,
        severity: 'medium' as any,
        component: 'ConfigurationManager'
      });
      throw error;
    }
  }
}

// Configuration utilities
export const ConfigUtils = {
  // Get optimal batch size based on device capabilities
  getOptimalBatchSize: (): number => {
    const config = ConfigurationManager.getInstance();
    const deviceInfo = config.getDeviceInfo();
    
    if (deviceInfo.isTablet) {
      return 50;
    } else if (deviceInfo.platform === 'ios') {
      return 30;
    } else {
      return 20;
    }
  },

  // Get animation duration based on performance settings
  getAnimationDuration: (multiplier: number = 1): number => {
    const config = ConfigurationManager.getInstance();
    const baseDuration = config.getSection('ui').animationDuration;
    const performanceConfig = config.getSection('performance');
    
    // Reduce animations on low-end devices or when profiling is enabled
    const performanceMultiplier = performanceConfig.enableProfiling ? 0.5 : 1;
    
    return Math.round(baseDuration * multiplier * performanceMultiplier);
  },

  // Check if advanced features should be enabled
  shouldEnableAdvancedFeatures: (): boolean => {
    const config = ConfigurationManager.getInstance();
    const deviceInfo = config.getDeviceInfo();
    const performanceConfig = config.getSection('performance');
    
    return deviceInfo.isTablet || 
           performanceConfig.maxMemoryUsage > 256 * 1024 * 1024 ||
           config.isDevelopment();
  }
};

// Global configuration instance
export const appConfig = ConfigurationManager.getInstance();

export default {
  ConfigurationManager,
  ConfigUtils,
  appConfig
};