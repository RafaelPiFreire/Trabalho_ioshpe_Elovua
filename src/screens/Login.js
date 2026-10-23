import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { contas } from '../services/armazenamento';
import { DEMO } from '../services/contas';
import { avisar } from '../utils/alerta';
import { cores } from '../theme';

export default function Login({ onLogin }) {
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const cadastro = modo === 'cadastro';

  async function enviar() {
    if (carregando) return;
    setCarregando(true);
    try {
      const resultado = cadastro
        ? await contas.cadastrar({ nome, email, senha, confirmarSenha })
        : await contas.entrar({ email, senha });

      if (!resultado.ok) {
        avisar(cadastro ? 'Atenção' : 'Login inválido', resultado.erro);
        return;
      }
      if (cadastro) avisar('Conta criada', 'Cadastro concluído! Você já entrou no Evolua.');
      await onLogin(resultado.usuario);
    } catch (erro) {
      avisar('Erro', 'Não foi possível acessar os dados salvos neste aparelho.');
    } finally {
      setCarregando(false);
    }
  }

  function alternarModo() {
    setModo(cadastro ? 'login' : 'cadastro');
    setSenha('');
    setConfirmarSenha('');
  }

  function usarDemo() {
    setEmail(DEMO.email);
    setSenha(DEMO.senha);
  }

  return (
    <KeyboardAvoidingView style={styles.fundo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.cartao}>
          <Text style={styles.titulo}>Evolua</Text>
          <Text style={styles.descricao}>
            {cadastro ? 'Crie sua conta para continuar.' : 'Entre na sua conta para continuar.'}
          </Text>

          {cadastro && (
            <>
              <Text style={styles.rotulo}>Nome</Text>
              <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor="#8A94A6"
                value={nome} onChangeText={setNome} editable={!carregando} />
            </>
          )}

          <Text style={styles.rotulo}>E-mail</Text>
          <TextInput style={styles.input} placeholder="seuemail@exemplo.com" placeholderTextColor="#8A94A6"
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            value={email} onChangeText={setEmail} editable={!carregando} />

          <Text style={styles.rotulo}>Senha</Text>
          <TextInput style={styles.input} placeholder="Digite sua senha" placeholderTextColor="#8A94A6"
            secureTextEntry autoCapitalize="none" value={senha} onChangeText={setSenha}
            editable={!carregando} onSubmitEditing={cadastro ? undefined : enviar} />

          {cadastro && (
            <>
              <Text style={styles.rotulo}>Confirmar senha</Text>
              <TextInput style={styles.input} placeholder="Digite a senha novamente" placeholderTextColor="#8A94A6"
                secureTextEntry autoCapitalize="none" value={confirmarSenha} onChangeText={setConfirmarSenha}
                editable={!carregando} onSubmitEditing={enviar} />
            </>
          )}

          <TouchableOpacity style={[styles.botao, carregando && styles.botaoDesativado]} onPress={enviar} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.textoBotao}>{cadastro ? 'Criar conta' : 'Entrar'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkArea} onPress={alternarModo} disabled={carregando}>
            <Text style={styles.link}>{cadastro ? 'Já tem uma conta? Entrar' : 'Não tem uma conta? Cadastre-se'}</Text>
          </TouchableOpacity>

          {!cadastro && (
            <TouchableOpacity onPress={usarDemo} disabled={carregando}>
              <Text style={styles.demo}>
                Conta de teste: {DEMO.email}{'\n'}Senha: {DEMO.senha}{'\n'}(toque aqui para preencher)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cores.fundo },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  cartao: { backgroundColor: cores.cartao, borderRadius: 20, padding: 24, elevation: 4, maxWidth: 480, width: '100%', alignSelf: 'center' },
  titulo: { fontSize: 38, fontWeight: 'bold', textAlign: 'center', color: cores.primaria, marginBottom: 8 },
  descricao: { fontSize: 15, color: cores.textoSuave, textAlign: 'center', marginBottom: 30 },
  rotulo: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 7 },
  input: { height: 50, borderWidth: 1, borderColor: cores.borda, borderRadius: 10, paddingHorizontal: 14, marginBottom: 18, backgroundColor: '#FFFFFF', color: cores.texto },
  botao: { height: 50, borderRadius: 10, backgroundColor: cores.primaria, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  botaoDesativado: { opacity: 0.65 },
  textoBotao: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  linkArea: { alignItems: 'center', marginTop: 22, padding: 8 },
  link: { color: cores.primaria, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  demo: { color: cores.textoSuave, textAlign: 'center', marginTop: 14, lineHeight: 21, fontSize: 13 },
});
