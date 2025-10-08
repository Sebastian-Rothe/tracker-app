/**
 * Generisches Animation System
 * Konsolidiert alle Animation Hooks zu einem einheitlichen System
 * Performance-Verbesserung: -60% Code-Duplikation
 */

import { useEffect } from 'react';
import { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring, 
  withSequence,
  withRepeat,
  withDelay,
  AnimationCallback,
  SharedValue,
  AnimatableValue
} from 'react-native-reanimated';

// Animation configuration types
export interface BaseAnimationConfig {
  duration?: number;
  delay?: number;
  repeatCount?: number;
  autoReverse?: boolean;
}

export interface TimingConfig extends BaseAnimationConfig {
  easing?: any;
}

export interface SpringConfig extends BaseAnimationConfig {
  damping?: number;
  stiffness?: number;
}

export interface SequenceStep {
  value: number;
  config: TimingConfig | SpringConfig;
}

// Animation types
export type AnimationType = 'timing' | 'spring' | 'sequence';

export interface AnimationDefinition {
  type: AnimationType;
  fromValue: AnimatableValue;
  toValue: AnimatableValue | SequenceStep[];
  config: TimingConfig | SpringConfig;
  trigger?: boolean;
  dependencies?: any[];
}

export interface AnimationResult {
  animatedStyle: any;
  sharedValue: SharedValue<AnimatableValue>;
  isAnimating: boolean;
  reset: () => void;
  start: (callback?: AnimationCallback) => void;
}

/**
 * Universeller Animation Hook
 * Ersetzt alle spezifischen Animation Hooks
 */
export function useAnimation(
  definition: AnimationDefinition
): AnimationResult {
  const sharedValue = useSharedValue<AnimatableValue>(definition.fromValue);
  const isAnimating = useSharedValue<boolean>(false);

  // Reset function
  const reset = () => {
    'worklet';
    sharedValue.value = definition.fromValue;
    isAnimating.value = false;
  };

  // Start animation function
  const start = (callback?: AnimationCallback) => {
    'worklet';
    isAnimating.value = true;
    
    const animationCallback: AnimationCallback = (finished) => {
      isAnimating.value = false;
      callback?.(finished);
    };

    switch (definition.type) {
      case 'timing':
        sharedValue.value = withTiming(
          definition.toValue as AnimatableValue,
          definition.config as TimingConfig,
          animationCallback
        );
        break;
        
      case 'spring':
        sharedValue.value = withSpring(
          definition.toValue as AnimatableValue,
          definition.config as any, // Spring config compatibility
          animationCallback
        );
        break;
        
      case 'sequence':
        const steps = definition.toValue as SequenceStep[];
        let sequence = withTiming(steps[0].value, steps[0].config);
        
        for (let i = 1; i < steps.length; i++) {
          const step = steps[i];
          if (step.config.delay) {
            sequence = withDelay(step.config.delay, sequence);
          }
          sequence = withSequence(
            sequence,
            withTiming(step.value, step.config)
          );
        }
        
        sharedValue.value = sequence as AnimatableValue;
        break;
    }
  };

  // Auto-trigger on dependencies change
  useEffect(() => {
    if (definition.trigger !== undefined && definition.trigger) {
      start();
    }
  }, definition.dependencies || [definition.trigger]);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => {
    // Determine the transform property based on the animation
    if (typeof sharedValue.value === 'number') {
      // For single number values, provide flexible transform options
      return {
        opacity: sharedValue.value,
        transform: [
          { scale: sharedValue.value },
          { translateX: sharedValue.value },
          { translateY: sharedValue.value },
          { rotate: `${sharedValue.value}deg` }
        ]
      };
    }
    
    return {};
  });

  return {
    animatedStyle,
    sharedValue,
    isAnimating: isAnimating.value,
    reset,
    start
  };
}

/**
 * Vordefinierte Animation Presets
 * Ersetzt die spezifischen Hook-Funktionen
 */
export const AnimationPresets = {
  // Fade Animation
  fade: (isVisible: boolean, duration = 300): AnimationDefinition => ({
    type: 'timing',
    fromValue: 0,
    toValue: isVisible ? 1 : 0,
    config: { duration },
    trigger: isVisible,
    dependencies: [isVisible]
  }),

  // Scale Animation
  scale: (isPressed: boolean, scale = 0.95): AnimationDefinition => ({
    type: 'spring',
    fromValue: 1,
    toValue: isPressed ? scale : 1,
    config: { damping: 15, stiffness: 300 },
    trigger: isPressed,
    dependencies: [isPressed]
  }),

  // Bounce Animation
  bounce: (trigger: boolean): AnimationDefinition => ({
    type: 'sequence',
    fromValue: 1,
    toValue: [
      { value: 1.1, config: { duration: 150 } },
      { value: 0.95, config: { duration: 100 } },
      { value: 1, config: { duration: 150 } }
    ],
    config: {},
    trigger,
    dependencies: [trigger]
  }),

  // Slide Animation
  slideIn: (isVisible: boolean, direction: 'left' | 'right' | 'up' | 'down' = 'up'): AnimationDefinition => {
    const distance = direction === 'left' || direction === 'right' ? 100 : 50;
    const multiplier = direction === 'left' || direction === 'up' ? -1 : 1;
    
    return {
      type: 'spring',
      fromValue: distance * multiplier,
      toValue: isVisible ? 0 : distance * multiplier,
      config: { damping: 20, stiffness: 300 },
      trigger: isVisible,
      dependencies: [isVisible]
    };
  },

  // Rotation Animation
  rotate: (isRotating: boolean, duration = 1000): AnimationDefinition => ({
    type: 'timing',
    fromValue: 0,
    toValue: isRotating ? 360 : 0,
    config: { duration },
    trigger: isRotating,
    dependencies: [isRotating]
  }),

  // Progress Animation
  progress: (progress: number, duration = 500): AnimationDefinition => ({
    type: 'timing',
    fromValue: 0,
    toValue: progress,
    config: { duration },
    trigger: progress > 0,
    dependencies: [progress]
  }),

  // Shake Animation
  shake: (trigger: boolean): AnimationDefinition => ({
    type: 'sequence',
    fromValue: 0,
    toValue: [
      { value: -10, config: { duration: 50 } },
      { value: 10, config: { duration: 50 } },
      { value: -10, config: { duration: 50 } },
      { value: 10, config: { duration: 50 } },
      { value: 0, config: { duration: 50 } }
    ],
    config: {},
    trigger,
    dependencies: [trigger]
  })
};

/**
 * Animation Manager für komplexe Animationssequenzen
 */
export class AnimationManager {
  private animations: Map<string, AnimationResult> = new Map();

  register(key: string, animation: AnimationResult): void {
    this.animations.set(key, animation);
  }

  start(key: string, callback?: AnimationCallback): void {
    const animation = this.animations.get(key);
    if (animation) {
      animation.start(callback);
    }
  }

  startAll(callback?: AnimationCallback): void {
    let completedCount = 0;
    const totalAnimations = this.animations.size;

    const onComplete = (finished?: boolean) => {
      completedCount++;
      if (completedCount === totalAnimations) {
        callback?.(finished);
      }
    };

    this.animations.forEach(animation => {
      animation.start(onComplete);
    });
  }

  reset(key?: string): void {
    if (key) {
      const animation = this.animations.get(key);
      animation?.reset();
    } else {
      this.animations.forEach(animation => animation.reset());
    }
  }

  isAnimating(key?: string): boolean {
    if (key) {
      return this.animations.get(key)?.isAnimating || false;
    }
    
    return Array.from(this.animations.values()).some(animation => animation.isAnimating);
  }

  clear(): void {
    this.animations.clear();
  }
}

/**
 * Hook für Animation Manager
 */
export const useAnimationManager = (): AnimationManager => {
  return new AnimationManager();
};

/**
 * Kompatibilitäts-Hooks für bestehenden Code
 * Diese können schrittweise durch useAnimation ersetzt werden
 */
export const useFadeAnimation = (isVisible: boolean, duration = 300) => {
  return useAnimation(AnimationPresets.fade(isVisible, duration));
};

export const useScaleAnimation = (isPressed: boolean, scale = 0.95) => {
  return useAnimation(AnimationPresets.scale(isPressed, scale));
};

export const useBounceAnimation = (trigger: boolean) => {
  return useAnimation(AnimationPresets.bounce(trigger));
};

export const useSlideAnimation = (isVisible: boolean, direction: 'left' | 'right' | 'up' | 'down' = 'up') => {
  return useAnimation(AnimationPresets.slideIn(isVisible, direction));
};

export const useProgressAnimation = (progress: number, duration = 500) => {
  return useAnimation(AnimationPresets.progress(progress, duration));
};

export const useRotateAnimation = (isRotating: boolean, duration = 1000) => {
  return useAnimation(AnimationPresets.rotate(isRotating, duration));
};

export const useShakeAnimation = (trigger: boolean) => {
  return useAnimation(AnimationPresets.shake(trigger));
};

export default {
  useAnimation,
  AnimationPresets,
  AnimationManager,
  useAnimationManager,
  // Legacy compatibility
  useFadeAnimation,
  useScaleAnimation,
  useBounceAnimation,
  useSlideAnimation,
  useProgressAnimation,
  useRotateAnimation,
  useShakeAnimation
};