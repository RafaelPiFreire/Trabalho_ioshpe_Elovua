import './firebase';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Animated, StyleSheet, Modal, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import Login from './src/screens/Login';
import Home from './src/screens/Home';
import Trilha from './src/screens/Trilha';
import NewTrilha from './src/screens/NewTrilha';
import Perfil from './src/screens/Perfil';
import Configuracoes from './src/screens/Configuracoes';
import Desafios from './src/screens/Desafios';
import { contas } from './src/services/armazenamento';
import { avisar } from './src/utils/alerta';
import { nativo } from './src/theme';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import Seletor from './src/components/Seletor';

const Tab = createBottomTabNavigator();

const ICONES = { 
  Inicio: 'home', 
  Trilha: 'book-open',
  Perfil: 'user',
  Desafios: 'award',
  Configuracoes: 'settings',
};

function IconeAba({ nome, focused, color, size }) {
  const escala = useRef(new Animated.Value(focused ? 1.2 : 1)).current;
  useEffect(() => {
    Animated.spring(escala, { toValue: focused ? 1.2 : 1, useNativeDriver: nativo, bounciness: 14 }).start();
  }, [focused, escala]);
  return (
    <View style={estilosAba.caixaIcone}>
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Feather name={nome} size={size} color={color} />
      </Animated.View>
    </View>
  );
}

function MenuUsuario({ usuario, sair, visivel, onFechar, navigation }) {
  const { modo, setModo, cores } = useTheme();

  function irPara(tela) {
    onFechar();
    navigation.navigate(tela);
  }

  if (!visivel) return null;

  return (
    <Modal transparent visible={visivel} animationType="fade" onRequestClose={onFechar}>
      <Pressable style={estilosMenu.overlay} onPress={onFechar}>
        <View style={[estilosMenu.menu, { backgroundColor: cores.cartao }]}>
          <Pressable style={estilosMenu.item} onPress={() => irPara('Perfil')}>
            <Feather name="user" size={18} color={cores.primaria} style={{ marginRight: 10 }} />
            <Text style={[estilosMenu.textoItem, { color: cores.texto }]}>Meu perfil</Text>
          </Pressable>

          <Pressable style={estilosMenu.item} onPress={() => irPara('Configuracoes')}>
            <Feather name="settings" size={18} color={cores.primaria} style={{ marginRight: 10 }} />
            <Text style={[estilosMenu.textoItem, { color: cores.texto }]}>Configuração</Text>
          </Pressable>

          <View style={estilosMenu.separador} />

          <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={[estilosMenu.subTitulo, { color: cores.textoSuave }]}>Modo claro e escuro</Text>
            <Seletor
              opcoes={[
                { valor: 'claro', rotulo: 'Claro' },
                { valor: 'escuro', rotulo: 'Escuro' },
              ]}
              valor={modo}
              onChange={(novo) => { setModo(novo); }}
            />
          </View>

          <View style={estilosMenu.separador} />

          <Pressable style={estilosMenu.item} onPress={() => { onFechar(); sair(); }}>
            <Feather name="log-out" size={18} color={cores.erro} style={{ marginRight: 10 }} />
            <Text style={[estilosMenu.textoItem, { color: cores.erro }]}>Sair</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function HeaderUsuario({ usuario, sair, navigation }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { cores } = useTheme();

  return (
    <>
      <Pressable
        onPress={() => setMenuAberto(true)}
        style={estilosHeader.botao}
        accessibilityRole="button"
        accessibilityLabel={`Menu de ${usuario.nome}`}
      >
        <Text style={[estilosHeader.nome, { color: cores.headerTexto }]} numberOfLines={1}>
          {usuario.nome}
        </Text>
        <Feather name="chevron-down" size={16} color={cores.headerTexto} style={{ marginLeft: 4 }} />
      </Pressable>
      <MenuUsuario 
        usuario={usuario} 
        sair={sair} 
        visivel={menuAberto} 
        onFechar={() => setMenuAberto(false)} 
        navigation={navigation}
      />
    </>
  );
}

function AppConteudo() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const { cores, modo, setModo } = useTheme();

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
    } catch (erro) {}
    setUsuario(usuarioLogado);
  }, []);

  const sair = useCallback(async () => {
    try {
      await contas.encerrarSessao();
    } catch (erro) {
      avisar('Erro', 'Não foi possível encerrar a sessão salva, mas você saiu da conta.');
    }
    setUsuario(null);
    setModo('claro');
  }, [setModo]);

  if (verificando) {
    return (
      <View style={[styles.carregando, { backgroundColor: cores.fundo }]}>
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={[styles.textoCarregando, { color: cores.texto }]}>Carregando Evolua...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <>
        <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />
        <Login onLogin={entrar} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        initialRouteName="Inicio"
        screenOptions={({ route, navigation }) => ({
          animation: 'shift',
          headerStyle: { backgroundColor: cores.header },
          headerTintColor: cores.headerTexto,
          headerTitleStyle: { fontWeight: 'bold' },
          tabBarActiveTintColor: cores.primaria,
          tabBarInactiveTintColor: cores.tabBarInativo,
          tabBarStyle: { backgroundColor: cores.tabBar, borderTopColor: cores.borda, borderTopWidth: 1, paddingTop: 6 },
          tabBarItemStyle: { paddingVertical: 2 },
          tabBarIconStyle: { marginBottom: 0 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
          headerRight: () => <HeaderUsuario usuario={usuario} sair={sair} navigation={navigation} />,
          tabBarIcon: ({ focused, color, size }) => (
            <IconeAba nome={ICONES[route.name] || 'circle'} focused={focused} color={color} size={size} />
          ),
          sceneContainerStyle: { backgroundColor: cores.fundo, paddingTop: 14 },
        })}
      >
        <Tab.Screen name="Inicio" options={{ title: 'Evolua', tabBarLabel: 'Início' }}>
          {() => <Home usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen name="Trilha" options={{ title: 'Trilha', tabBarLabel: 'Trilha' }}>
          {(props) => <Trilha usuario={usuario} {...props} />}
        </Tab.Screen>
        <Tab.Screen name="Desafios" options={{ title: 'Desafios', tabBarLabel: 'Desafios' }}>
          {() => <Desafios usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen
          name="NewTrilha"
          options={{ title: 'Nova trilha', tabBarStyle: { display: 'none' }, tabBarButton: () => null, tabBarItemStyle: { width: 0, flex: 0, padding: 0, margin: 0 } }}
        >
          {(props) => <NewTrilha usuario={usuario} {...props} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Perfil" 
          options={{ 
            title: 'Meu perfil', 
            tabBarButton: () => null, tabBarItemStyle: { width: 0, flex: 0, padding: 0, margin: 0 },
          }}
        >
          {() => <Perfil usuario={usuario} sair={sair} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Configuracoes" 
          options={{ 
            title: 'Configurações', 
            tabBarButton: () => null, tabBarItemStyle: { width: 0, flex: 0, padding: 0, margin: 0 },
          }}
        >
          {() => <Configuracoes />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppConteudo />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoCarregando: { marginTop: 12, fontSize: 16 },
});

const estilosAba = StyleSheet.create({
  caixaIcone: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});

const estilosHeader = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  nome: { fontSize: 15, fontWeight: '600', maxWidth: 140 },
});

const estilosMenu = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 12,
  },
  menu: {
    minWidth: 220,
    borderRadius: 14,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textoItem: { fontSize: 16, fontWeight: '600' },
  separador: { height: 1, backgroundColor: '#94A3B8', opacity: 0.25, marginVertical: 4, marginHorizontal: 12 },
  subTitulo: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
});
