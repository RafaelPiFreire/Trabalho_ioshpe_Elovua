import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import Login from './src/screens/Login';
import Home from './src/screens/Home';
import Trilha from './src/screens/Trilha';
import Sobre from './src/screens/Sobre';
import { contas } from './src/services/armazenamento';
import { avisar } from './src/utils/alerta';
import { cores } from './src/theme';

const Tab = createBottomTabNavigator();

const ICONES = { Inicio: 'home', Trilha: 'book-open', Sobre: 'info' };

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);

  // Ao abrir o app, recupera a sessão salva neste aparelho (se existir).
  useEffect(() => {
    let ativo = true;
    contas
      .recuperarSessao()
      .then((u) => { if (ativo) setUsuario(u); })
      .catch(() => {})
      .finally(() => { if (ativo) setVerificando(false); });
    return () => { ativo = false; };
  }, []);

  const entrar = useCallback(async (usuarioLogado) => {
    try {
      await contas.salvarSessao(usuarioLogado);
    } catch (erro) {
      // Se não conseguir salvar a sessão, o usuário entra mesmo assim (só não fica lembrado).
    }
    setUsuario(usuarioLogado);
  }, []);

  const sair = useCallback(async () => {
    try {
      await contas.encerrarSessao();
    } catch (erro) {
      avisar('Erro', 'Não foi possível encerrar a sessão salva, mas você saiu da conta.');
    }
    setUsuario(null);
  }, []);

  if (verificando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={styles.textoCarregando}>Carregando Evolua...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <>
        <StatusBar style="dark" />
        <Login onLogin={entrar} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        initialRouteName="Inicio"
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: cores.primaria },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          tabBarActiveTintColor: cores.primaria,
          tabBarInactiveTintColor: '#777777',
          headerRight: () => (
            <TouchableOpacity onPress={sair} style={styles.botaoSair} accessibilityRole="button" accessibilityLabel="Sair da conta">
              <Text style={styles.textoSair}>Sair</Text>
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size }) => <Feather name={ICONES[route.name]} size={size} color={color} />,
        })}
      >
        <Tab.Screen name="Inicio" options={{ title: 'Evolua', tabBarLabel: 'Início' }}>
          {() => <Home usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen name="Trilha" options={{ title: 'Trilha', tabBarLabel: 'Trilha' }}>
          {() => <Trilha usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen name="Sobre" component={Sobre} options={{ title: 'Sobre o Evolua', tabBarLabel: 'Sobre' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.fundo },
  textoCarregando: { marginTop: 12, color: '#334155', fontSize: 16 },
  botaoSair: { marginRight: 16, paddingVertical: 8, paddingHorizontal: 12 },
  textoSair: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
