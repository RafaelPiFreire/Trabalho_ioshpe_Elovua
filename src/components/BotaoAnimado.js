import React, { useRef } from 'react';
import { Animated, Pressable, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { nativo } from '../theme';
import { useTheme } from '../ThemeContext';

export default function BotaoAnimado({ titulo, onPress, variante = 'primario', icone, carregando, desativado, pequeno, style }) {
  const { cores } = useTheme();
  const escala = useRef(new Animated.Value(1)).current;
  const VARIANTES = {
    primario: { fundo: cores.primaria, texto: '#FFFFFF' },
    secundario: { fundo: cores.primariaClara, texto: cores.primaria },
    perigo: { fundo: cores.erro + '1F', texto: cores.erro },
    texto: { fundo: 'transparent', texto: cores.primaria },
    claro: { fundo: 'rgba(255,255,255,0.2)', texto: '#FFFFFF' },
  };
  const v = VARIANTES[variante] || VARIANTES.primario;
  const inativo = desativado || carregando;
  const ir = (alvo) => Animated.spring(escala, { toValue: alvo, useNativeDriver: nativo, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale: escala }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={inativo}
        onPressIn={() => ir(0.95)}
        onPressOut={() => ir(1)}
        onHoverIn={() => ir(1.03)}
        onHoverOut={() => ir(1)}
        accessibilityRole="button"
        accessibilityLabel={titulo}
        style={({ pressed }) => [
          s.base,
          pequeno && s.pequeno,
          { backgroundColor: v.fundo, opacity: inativo ? 0.6 : pressed ? 0.85 : 1 },
          Platform.OS === 'web' && { cursor: inativo ? 'default' : 'pointer' },
        ]}
      >
        {carregando ? (
          <ActivityIndicator color={v.texto} />
        ) : (
          <>
            {icone ? <Feather name={icone} size={pequeno ? 15 : 18} color={v.texto} style={{ marginRight: 8 }} /> : null}
            <Text style={[s.texto, pequeno && s.textoPequeno, { color: v.texto }]}>{titulo}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  base: { height: 48, borderRadius: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pequeno: { height: 36, borderRadius: 18, paddingHorizontal: 14 },
  texto: { fontSize: 16, fontWeight: '700' },
  textoPequeno: { fontSize: 14 },
});
