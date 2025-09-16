/**
 * Animation Manager for Smooth UI Transitions
 * Uses React Native Reanimated for performance
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { useState, useEffect } from 'react';

// Animation Configuration
export const AnimationConfig = {
  // Timing configurations
  timing: {
    fast: { duration: 200 },
    normal: { duration: 300 },
    slow: { duration: 500 },
  },
  
  // Spring configurations
  spring: {
    gentle: {
      damping: 20,
      stiffness: 90,
    },
    bouncy: {
      damping: 15,
      stiffness: 150,
    },
    snappy: {
      damping: 25,
      stiffness: 200,
    },
  },
};

// Fade Animation Hook
export const useFadeAnimation = (isVisible: boolean, duration = 300) => {
  const opacity = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration });
  }, [isVisible, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, opacity };
};

// Scale Animation Hook
export const useScaleAnimation = (isPressed: boolean, scale = 0.95) => {
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    scaleValue.value = withSpring(isPressed ? scale : 1, AnimationConfig.spring.snappy);
  }, [isPressed, scale, scaleValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return { animatedStyle, scaleValue };
};

// Slide Animation Hook
export const useSlideAnimation = (isVisible: boolean, direction: 'left' | 'right' | 'up' | 'down' = 'up') => {
  const translateValue = useSharedValue(isVisible ? 0 : getInitialTranslate(direction));

  useEffect(() => {
    translateValue.value = withSpring(
      isVisible ? 0 : getInitialTranslate(direction),
      AnimationConfig.spring.gentle
    );
  }, [isVisible, direction, translateValue]);

  const animatedStyle = useAnimatedStyle(() => {
    switch (direction) {
      case 'left':
      case 'right':
        return {
          transform: [{ translateX: translateValue.value }],
        };
      case 'up':
      case 'down':
        return {
          transform: [{ translateY: translateValue.value }],
        };
      default:
        return {};
    }
  });

  return { animatedStyle, translateValue };
};

function getInitialTranslate(direction: 'left' | 'right' | 'up' | 'down'): number {
  switch (direction) {
    case 'left':
      return -50;
    case 'right':
      return 50;
    case 'up':
      return -50;
    case 'down':
      return 50;
    default:
      return 0;
  }
}

// Progress Animation Hook
export const useProgressAnimation = (progress: number, duration = 1000) => {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(progress, { duration });
  }, [progress, duration, progressValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return { animatedStyle, progressValue };
};

// Bounce Animation Hook
export const useBounceAnimation = (trigger: boolean) => {
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    if (trigger) {
      scaleValue.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [trigger, scaleValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return { animatedStyle, scaleValue };
};

// Rotate Animation Hook
export const useRotateAnimation = (isRotating: boolean, duration = 1000) => {
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    if (isRotating) {
      rotateValue.value = withTiming(360, { duration });
    } else {
      rotateValue.value = withTiming(0, { duration: 200 });
    }
  }, [isRotating, duration, rotateValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  return { animatedStyle, rotateValue };
};

// Shake Animation Hook
export const useShakeAnimation = (trigger: boolean) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { animatedStyle, translateX };
};

// Stagger Animation Hook
export const useStaggerAnimation = (items: any[], delay = 100) => {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(items.length).fill(false));

  useEffect(() => {
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => {
          const newVisible = [...prev];
          newVisible[index] = true;
          return newVisible;
        });
      }, index * delay);
    });

    return () => {
      setVisibleItems(new Array(items.length).fill(false));
    };
  }, [items.length, delay]);

  return visibleItems;
};

// Card Entrance Animation
export const useCardEntranceAnimation = (index: number, delay = 100) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const animationDelay = index * delay;

    // Staggered entrance animation
    setTimeout(() => {
      translateY.value = withSpring(0, AnimationConfig.spring.gentle);
      opacity.value = withTiming(1, AnimationConfig.timing.normal);
      scale.value = withSpring(1, AnimationConfig.spring.gentle);
    }, animationDelay);
  }, [index, delay, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return { animatedStyle };
};

// Button Press Animation Hook
export const useButtonPressAnimation = () => {
  const scale = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    scale.value = withSpring(0.95, AnimationConfig.spring.snappy);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scale.value = withSpring(1, AnimationConfig.spring.snappy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
    isPressed,
  };
};

export default {
  useFadeAnimation,
  useScaleAnimation,
  useSlideAnimation,
  useProgressAnimation,
  useBounceAnimation,
  useRotateAnimation,
  useShakeAnimation,
  useStaggerAnimation,
  useCardEntranceAnimation,
  useButtonPressAnimation,
  AnimationConfig,
};