import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { nativo } from '../theme';

// Entrada suave: o conteúdo surge de baixo para cima com fade.
export default function Aparecer({ atraso = 0, style, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, delay: atraso, useNativeDriver: nativo }).start();
  }, [v, atraso]);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: y }] }]}>{children}</Animated.View>;
}
