import { Alert, Platform } from 'react-native';

// Alert.alert não faz nada na web (react-native-web). Aqui usamos window.alert
// no navegador e Alert.alert no celular, para as mensagens sempre aparecerem.
export function avisar(titulo, mensagem) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
}
