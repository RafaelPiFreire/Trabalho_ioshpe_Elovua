import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Animated,
  KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { contas } from '../services/armazenamento';
import { avisar } from '../utils/alerta';
import { nativo } from '../theme';
import { lightCores } from '../theme';

// Fica FORA do componente Login: se for declarado dentro dele, cada tecla
// recria o tipo do componente, o React desmonta o TextInput e o foco é perdido.
function Campo({
  rotulo, icone, nome: nomeCampo, secreta, cores, foco, setFoco, verSenha, setVerSenha, carregando, ...resto
}) {
  const ativo = foco === nomeCampo;
  return (
    <View style={[st.campoWrap, { borderColor: ativo ? cores.primaria : cores.borda, backgroundColor: cores.cartao }]}>
      <Feather name={icone} size={18} color={ativo ? cores.primaria : cores.textoSuave} style={st.campoIcone} />
      <TextInput
        style={[st.campoInput, { color: cores.texto }]}
        placeholder={rotulo}
        placeholderTextColor={cores.textoSuave}
        onFocus={() => setFoco(nomeCampo)}
        onBlur={() => setFoco('')}
        secureTextEntry={secreta && !verSenha}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!carregando}
        {...resto}
      />
      {secreta && (
        <TouchableOpacity onPress={() => setVerSenha((v) => !v)} style={st.olhoBtn}>
          <Feather name={verSenha ? 'eye-off' : 'eye'} size={18} color={cores.textoSuave} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function Login({ onLogin }) {
  // Login/cadastro sempre claro, independente do tema escolhido nas áreas autenticadas.
  const cores = lightCores;
  const [modo, setModo] = useState('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [foco, setFoco] = useState('');
  const tremor = useRef(new Animated.Value(0)).current;
  const cadastro = modo === 'cadastro';

  function tremer() {
    Animated.sequence(
      [10, -10, 6, -6, 0].map((t) =>
        Animated.timing(tremor, { toValue: t, duration: 60, useNativeDriver: nativo })
      )
    ).start();
  }

  async function enviar() {
    if (carregando) return;
    setCarregando(true);
    setErro('');
    try {
      const resultado = cadastro
        ? await contas.cadastrar({ nome, email, senha, confirmarSenha })
        : await contas.entrar({ email, senha });

      if (!resultado.ok) {
        setErro(resultado.erro);
        tremer();
        return;
      }
      if (cadastro) avisar('Conta criada', 'Cadastro concluído! Você já entrou no Evolua.');
      await onLogin(resultado.usuario);
    } catch (e) {
      setErro(e?.message || 'Não foi possível acessar os dados salvos neste aparelho.');
      tremer();
    } finally {
      setCarregando(false);
    }
  }

  function trocar(novoModo) {
    setModo(novoModo);
    setNome(''); setEmail(''); setSenha(''); setConfirmarSenha(''); setErro(''); setFoco('');
  }

  return (
    <KeyboardAvoidingView style={[st.fundo, { backgroundColor: cores.fundo }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">

        {/* Cabeçalho com logo */}
        <View style={st.cabecalho}>
          <View style={[st.logoCirculo, { backgroundColor: cores.primaria }]}>
            <Image source={require('../../assets/Evolua_login3.png')} style={st.logoImagem} />
          </View>
          <Text style={[st.logoTexto, { color: cores.primaria }]}>Evolua</Text>
          <Text style={[st.logoSub, { color: cores.textoSuave }]}>
            {cadastro ? 'Crie sua conta gratuita' : 'Bem-vindo de volta'}
          </Text>
        </View>

        {/* Card do formulário */}
        <Animated.View style={[st.cartao, { backgroundColor: cores.cartao, transform: [{ translateX: tremor }] }]}>

          {/* Tabs Entrar / Cadastrar */}
          <View style={[st.tabs, { backgroundColor: cores.fundo, borderColor: cores.borda }]}>
            {['login', 'cadastro'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[st.tab, modo === m && { backgroundColor: cores.primaria }]}
                onPress={() => trocar(m)}
                activeOpacity={0.8}
              >
                <Text style={[st.tabTexto, { color: modo === m ? '#fff' : cores.textoSuave }]}>
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos */}
          <View style={st.campos}>
            {cadastro && (
              <Campo rotulo="Seu nome" icone="user" nome="nome" value={nome} onChangeText={setNome} cores={cores} foco={foco} setFoco={setFoco} verSenha={verSenha} setVerSenha={setVerSenha} carregando={carregando} />
            )}
            <Campo
              rotulo="E-mail"
              icone="mail"
              nome="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              cores={cores} foco={foco} setFoco={setFoco} verSenha={verSenha} setVerSenha={setVerSenha} carregando={carregando}
            />
            <Campo
              rotulo="Senha"
              icone="lock"
              nome="senha"
              secreta
              value={senha}
              onChangeText={setSenha}
              onSubmitEditing={cadastro ? undefined : enviar}
              returnKeyType={cadastro ? 'next' : 'done'}
              cores={cores} foco={foco} setFoco={setFoco} verSenha={verSenha} setVerSenha={setVerSenha} carregando={carregando}
            />
            {cadastro && (
              <Campo
                rotulo="Confirmar senha"
                icone="lock"
                nome="confirmar"
                secreta
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                onSubmitEditing={enviar}
                returnKeyType="done"
                cores={cores} foco={foco} setFoco={setFoco} verSenha={verSenha} setVerSenha={setVerSenha} carregando={carregando}
              />
            )}
          </View>

          {/* Erro */}
          {!!erro && (
            <View style={[st.erroCaixa, { backgroundColor: cores.erro + '18', borderColor: cores.erro + '40' }]}>
              <Feather name="alert-circle" size={15} color={cores.erro} style={{ marginRight: 7 }} />
              <Text style={[st.erroTexto, { color: cores.erro }]}>{erro}</Text>
            </View>
          )}

          {/* Botão principal */}
          <TouchableOpacity
            style={[st.botao, { backgroundColor: cores.primaria }, carregando && { opacity: 0.7 }]}
            onPress={enviar}
            activeOpacity={0.85}
            disabled={carregando}
          >
            <Feather name={cadastro ? 'user-plus' : 'log-in'} size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={st.botaoTexto}>{carregando ? 'Aguarde...' : cadastro ? 'Criar conta' : 'Entrar'}</Text>
          </TouchableOpacity>

        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  fundo: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  cabecalho: { alignItems: 'center', marginBottom: 28 },
  logoImagem: { width: 72, height: 72, resizeMode: 'contain', tintColor: '#fff' },
  logoCirculo: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  logoTexto: { fontSize: 34, fontWeight: '800', letterSpacing: 0.5 },
  logoSub: { fontSize: 15, marginTop: 4 },

  cartao: {
    borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
    maxWidth: 480, width: '100%', alignSelf: 'center',
  },

  tabs: {
    flexDirection: 'row', borderRadius: 12, padding: 4,
    marginBottom: 22, borderWidth: 1,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 9,
    alignItems: 'center',
  },
  tabTexto: { fontWeight: '700', fontSize: 14 },

  campos: { gap: 12, marginBottom: 4 },
  campoWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12,
    height: 52,
  },
  campoIcone: { marginRight: 10 },
  campoInput: {
    flex: 1, fontSize: 15, height: '100%',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  olhoBtn: { padding: 4 },

  erroCaixa: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 14,
  },
  erroTexto: { fontSize: 14, fontWeight: '500', flex: 1 },

  botao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 14, marginTop: 18,
  },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
