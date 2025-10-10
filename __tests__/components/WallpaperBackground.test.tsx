import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { WallpaperBackground } from '@/components/WallpaperBackground';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WallpaperType } from '@/constants/Theme';

// Mock setup is handled in jest-setup.js

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('WallpaperBackground', () => {
  test('should render wallpaper background correctly', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <WallpaperBackground>
          <View testID="content">
            <Text>Test Content</Text>
          </View>
        </WallpaperBackground>
      </TestWrapper>
    );

    const content = getByTestId('content');
    expect(content).toBeTruthy();
  });

  test('should render children inside wallpaper container', () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <WallpaperBackground>
          <View testID="child-content">
            <Text>Child Content</Text>
          </View>
        </WallpaperBackground>
      </TestWrapper>
    );

    const childContent = getByTestId('child-content');
    const childText = getByText('Child Content');
    
    expect(childContent).toBeTruthy();
    expect(childText).toBeTruthy();
  });

  test('should handle multiple children', () => {
    const { getByText } = render(
      <TestWrapper>
        <WallpaperBackground>
          <View>
            <Text>First Child</Text>
            <Text>Second Child</Text>
          </View>
        </WallpaperBackground>
      </TestWrapper>
    );

    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });
});