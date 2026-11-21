import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { nativo } from '../theme';
import { useTheme } from '../ThemeContext';

export default function Seletor({ opcoes, valor, onChange, style }) {
  const { cores } = useTheme();
  const [largura, setLargura] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const indice = Math.max(0, opcoes.findIndex((o) => o.valor === valor));
  const w = largura / opcoes.length;

  useEffect(() => {
    Animated.spring(x, { toValue: indice * w, useNativeDriver: nativo, bounciness: 6 }).start();
  }, [indice, w, x]);

  return (
    <View style={[s.trilho, { backgroundColor: cores.primariaClara }, style]} onLayout={(e) => setLargura(e.nativeEvent.layout.width - 8)}>
      {w > 0 && <Animated.View style={[s.indicador, { width: w, transform: [{ translateX: x }], backgroundColor: cores.cartao }]} />}
      {opcoes.map((o) => (
        <Pressable
          key={o.valor}
          style={s.opcao}
          onPress={() => onChange(o.valor)}
          accessibilityRole="button"
          accessibilityState={{ selected: o.valor === valor }}
        >
          <Text style={[s.rotulo, { color: cores.textoSuave }, o.valor === valor && { color: cores.primaria, fontWeight: '700' }]}>{o.rotulo}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  trilho: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  indicador: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 9, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
  opcao: { flex: 1, paddingVertical: 9, alignItems: 'center', ...Platform.select({ web: { cursor: 'pointer' } }) },
  rotulo: { fontSize: 13, fontWeight: '600' },
});
