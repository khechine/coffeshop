import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Blob = ({ color, size, initialX, initialY, duration }: any) => {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    transX.value = withRepeat(
      withTiming(Math.random() * 100 - 50, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    transY.value = withRepeat(
      withTiming(Math.random() * 100 - 50, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    scale.value = withRepeat(
      withTiming(1.2, { duration: duration * 1.5, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: transX.value },
      { translateY: transY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`grad-${color}`} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={initialX} cy={initialY} r={size} fill={`url(#grad-${color})`} />
      </Svg>
    </Animated.View>
  );
};

export const GlassBackground = () => {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#120F0E' }]}>
      <Blob color="#3E2723" size={width * 0.9} initialX={width * 0.1} initialY={height * 0.1} duration={12000} />
      <Blob color="#D48446" size={width * 0.8} initialX={width * 0.8} initialY={height * 0.2} duration={15000} />
      <Blob color="#8D6E63" size={width * 0.7} initialX={width * 0.2} initialY={height * 0.8} duration={18000} />
      <Blob color="#F5E6D3" size={width * 0.6} initialX={width * 0.7} initialY={height * 0.7} duration={14000} />
    </View>
  );
};
