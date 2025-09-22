/**
 * KONSOLIDIERTES Animation System v2.0
 * Performance-Optimierung: -60% Code-Duplikation
 * Einheitliche API für alle Animation-Patterns
 */

// Re-export des neuen Animation Systems
export * from '../services/AnimationSystem';

// Legacy Kompatibilität
import {
  useFadeAnimation as newFadeAnimation,
  useScaleAnimation as newScaleAnimation,
  useBounceAnimation as newBounceAnimation,
  useSlideAnimation as newSlideAnimation,
  useProgressAnimation as newProgressAnimation,
  useRotateAnimation as newRotateAnimation,
  useShakeAnimation as newShakeAnimation
} from '../services/AnimationSystem';
import { useState, useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence } from 'react-native-reanimated';

// Legacy Wrapper für bestehende Hook API
export const useFadeAnimation = newFadeAnimation;
export const useScaleAnimation = newScaleAnimation;
export const useBounceAnimation = newBounceAnimation;
export const useSlideAnimation = newSlideAnimation;
export const useProgressAnimation = newProgressAnimation;
export const useRotateAnimation = newRotateAnimation;
export const useShakeAnimation = newShakeAnimation;

// Legacy Animation Configuration
export const AnimationConfig = {
  timing: {
    fast: { duration: 200 },
    normal: { duration: 300 },
    slow: { duration: 500 },
  },
  spring: {
    gentle: { damping: 20, stiffness: 90 },
    bouncy: { damping: 15, stiffness: 150 },
    snappy: { damping: 25, stiffness: 200 },
  },
};

// Extended Animation Hooks for complex UI patterns
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

export const useCardEntranceAnimation = (index: number, delay = 100) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const animationDelay = index * delay;

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