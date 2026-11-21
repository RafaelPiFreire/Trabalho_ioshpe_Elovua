import { Platform } from 'react-native';

export const lightCores = {
  primaria: '#2563EB',
  primariaForte: '#1D4ED8',
  primariaClara: '#EFF4FF',
  primariaBorda: '#BFD3FB',
  superficieAlta: '#F1F5FD',
  trilhaFundo: '#2563EB',
  fundo: '#F3F6FC',
  cartao: '#FFFFFF',
  texto: '#1E293B',
  textoSuave: '#64748B',
  borda: '#D8E0EC',
  erro: '#DC2626',
  sucesso: '#16A34A',
  aviso: '#D97706',
  header: '#2563EB',
  headerTexto: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarInativo: '#777777',
  alerta: '#bb3a3a',
};

export const darkCores = {
  primaria: '#60A5FA',
  primariaForte: '#3B82F6',
  primariaClara: '#1E3A5F',
  primariaBorda: '#2B4C7E',
  superficieAlta: '#263449',
  trilhaFundo: '#17305A',
  fundo: '#0F172A',
  cartao: '#1E293B',
  texto: '#F1F5F9',
  textoSuave: '#94A3B8',
  borda: '#334155',
  erro: '#F87171',
  sucesso: '#4ADE80',
  aviso: '#FBBF24',
  header: '#1E293B',
  headerTexto: '#F1F5F9',
  tabBar: '#1E293B',
  tabBarInativo: '#94A3B8',
  alerta: '#ef4444',
};

// Compatibilidade: exporta light por padrão
export const cores = lightCores;

// Animações nativas só no celular; na web o React Native Web usa JS.
export const nativo = Platform.OS !== 'web';
