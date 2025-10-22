import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getWallpaper } from '@/constants/Theme';

interface WallpaperBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({
  children,
  style
}) => {
  const { wallpaper, isDarkMode } = useTheme();
  const wallpaperConfig = getWallpaper(wallpaper);
  
  // Force re-render when wallpaper changes
  if (__DEV__) {
    console.log('🎨 WallpaperBackground rendering with wallpaper:', wallpaper);
  }

  const renderWallpaper = () => {
    const config = wallpaperConfig as any;
    
    switch (wallpaper) {
      case 'deep-blue':
        // Deep blue gradient - diagonal flow
        return (
          <>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: config.colors[0] }]} />
            <View style={[StyleSheet.absoluteFillObject, { 
              backgroundColor: config.colors[1],
              transform: [{ skewY: '15deg' }],
              marginTop: '30%'
            }]} />
            <View style={[StyleSheet.absoluteFillObject, { 
              backgroundColor: 'rgba(30, 58, 138, 0.6)',
              marginTop: '70%' 
            }]} />
          </>
        );
      
      case 'sunset-orange':
        // Geometric sunset - angular shapes
        return (
          <>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: config.colors[1] }]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: config.colors[0],
                width: '300%',
                height: '80%',
                position: 'absolute',
                top: '20%',
                left: '-100%',
                borderRadius: 400,
                transform: [{ rotate: '-15deg' }]
              }
            ]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(194, 65, 12, 0.7)',
                width: '200%',
                height: '60%',
                position: 'absolute',
                top: '40%',
                right: '-50%',
                borderRadius: 200,
                transform: [{ rotate: '25deg' }]
              }
            ]} />
          </>
        );
      
      case 'forest-teal':
        // Organic forest shapes - flowing natural forms
        return (
          <>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: config.colors[1] }]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: config.colors[0],
                borderRadius: 500,
                width: '180%',
                height: '120%',
                position: 'absolute',
                top: '-20%',
                left: '-40%',
                transform: [{ scaleX: 1.5 }]
              }
            ]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(15, 118, 110, 0.8)',
                borderRadius: 800,
                width: '150%',
                height: '100%',
                position: 'absolute',
                bottom: '-30%',
                right: '-25%',
                transform: [{ scaleY: 0.7 }]
              }
            ]} />
          </>
        );
        
      case 'royal-purple':
        // Purple dots pattern - sophisticated dotted design
        return (
          <>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: config.colors[1] }]} />
            <View style={[StyleSheet.absoluteFillObject, styles.purpleDots]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: config.colors[0],
                opacity: 0.6,
                marginTop: '50%'
              }
            ]} />
          </>
        );
        
      case 'midnight-navy':
        // Navy waves - flowing wave pattern
        return (
          <>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: config.colors[1] }]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: config.colors[0],
                borderRadius: 100,
                width: '120%',
                height: '40%',
                position: 'absolute',
                top: '10%',
                left: '-10%',
                transform: [{ scaleY: 2 }]
              }
            ]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(30, 64, 175, 0.8)',
                borderRadius: 150,
                width: '130%',
                height: '50%',
                position: 'absolute',
                bottom: '15%',
                right: '-15%',
                transform: [{ scaleY: 1.8 }]
              }
            ]} />
          </>
        );
        
      case 'light-sky':
        // Light sky blue gradient - soft and bright
        return (
          <>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: config.colors[1] }]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: config.colors[0],
                opacity: 0.8,
              }
            ]} />
          </>
        );
        
      case 'soft-mint':
        // Soft mint green - gentle organic pattern
        return (
          <>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: config.colors[1] }]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: config.colors[0],
                borderRadius: 200,
                width: '110%',
                height: '60%',
                position: 'absolute',
                top: '20%',
                left: '-5%',
                opacity: 0.7,
                transform: [{ scaleY: 1.5 }]
              }
            ]} />
            <View style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 150,
                width: '120%',
                height: '40%',
                position: 'absolute',
                bottom: '25%',
                right: '-10%',
                transform: [{ scaleY: 1.3 }]
              }
            ]} />
          </>
        );
      
      case 'none':
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]} key={`wallpaper-${wallpaper}`}>
      {renderWallpaper()}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  purpleDots: {
    backgroundColor: 'transparent',
    // Purple dots effect created with opacity overlays in the render function
  },
});

export default WallpaperBackground;