import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { trilhas } from '../services/armazenamento';
import { cores } from '../theme';

export default function Home({ usuario }) {
  const navigation = useNavigation();
  const [hobbies, setHobbies] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      setErro('');
      trilhas.lerHobbies(usuario.email)
        .then((lista) => { if (ativo) setHobbies(lista); })
        .catch((falha) => {
          if (ativo) setErro(falha?.message || 'Não foi possível carregar seus hobbies.');
        })
        .finally(() => { if (ativo) setCarregando(false); });
      return () => { ativo = false; };
    }, [usuario.email, tentativa])
  );

  const resumos = hobbies.map((habilidades) => ({
    habilidades,
    resumo: trilhas.obterResumo(habilidades),
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View style={styles.iconeCabecalho}>
            <Feather name="sun" size={23} color={cores.primaria} />
          </View>
          <Text style={styles.ola}>Olá, {usuario.nome}!</Text>
          <Text style={styles.descricao}>
            Pequenos passos também são progresso. Cuide dos seus hobbies no seu ritmo.
          </Text>
        </View>

        <View style={styles.resumo}>
          <View style={styles.resumoIcone}>
            <Feather name="heart" size={20} color={cores.primaria} />
          </View>
          <View style={styles.resumoTexto}>
            <Text style={styles.resumoValor}>{hobbies.length}</Text>
            <Text style={styles.resumoRotulo}>
              {hobbies.length === 1 ? 'habilidades acompanhado' : 'hobbies acompanhados'}
            </Text>
          </View>
          <Text style={styles.resumoNota}>Cada um tem sua própria trilha</Text>
        </View>

        <View style={styles.tituloLinha}>
          <View>
            <Text style={styles.tituloSecao}>Seus hobbies</Text>
            <Text style={styles.subtituloSecao}>Uma atividade de cada vez</Text>
          </View>
          <Feather name="trending-up" size={21} color={cores.primaria} />
        </View>

        {carregando ? (
          <View style={styles.estado}>
            <ActivityIndicator color={cores.primaria} />
            <Text style={styles.textoSuave}>Carregando seus hobbies...</Text>
          </View>
        ) : erro ? (
          <View style={styles.cartaoVazio}>
            <Text style={styles.textoErro}>{erro}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.botaoSecundario}
              onPress={() => setTentativa((valor) => valor + 1)}
            >
              <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : hobbies.length === 0 ? (
          <View style={styles.cartaoVazio}>
            <View style={styles.iconeVazio}>
              <Feather name="compass" size={25} color={cores.primaria} />
            </View>
            <Text style={styles.vazioTitulo}>Seu próximo habilidades começa aqui</Text>
            <Text style={styles.textoSuave}>
              Escolha algo que você gostaria de praticar e crie uma trilha simples para acompanhar seus passos.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.botaoPrimario}
              onPress={() => navigation.navigate('NewTrilha')}
            >
              <Feather name="plus" size={17} color="#FFFFFF" />
              <Text style={styles.botaoPrimarioTexto}>Criar minha primeira trilha</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lista}>
            {resumos.map(({ habilidades, resumo }) => (
              <TouchableOpacity
                key={habilidades.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('Trilha')}
                style={styles.cartaoHobby}
              >
                <View style={styles.hobbyIcone}>
                  <Feather name="activity" size={19} color={cores.primaria} />
                </View>
                <View style={styles.hobbyInfo}>
                  <Text style={styles.hobbyNome}>{habilidades.nome}</Text>
                  <Text style={styles.hobbyDias}>
                    {resumo.diasPlanejados.length} {resumo.diasPlanejados.length === 1 ? 'dia planejado' : 'dias planejados'} por semana
                  </Text>
                  <Text style={styles.hobbyRecorde}>
                    Recorde: {resumo.recorde} {resumo.recorde === 1 ? 'dia' : 'dias'}
                  </Text>
                </View>
                <View style={styles.sequencia}>
                  <Feather name="zap" size={17} color="#F97316" />
                  <Text style={styles.sequenciaNumero}>{resumo.sequenciaAtual}</Text>
                  <Text style={styles.sequenciaRotulo}>atual</Text>
                </View>
                <Feather name="chevron-right" size={19} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!carregando && !erro && hobbies.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.botaoPrimario}
            onPress={() => navigation.navigate('Trilha')}
          >
            <Feather name="map" size={17} color="#FFFFFF" />
            <Text style={styles.botaoPrimarioTexto}>Abrir minhas trilhas</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
            accessibilityRole="button"
            style={styles.botaoPrimario}
            onPress={() => navigation.navigate('NewTrilha')}
          >
            <Feather name="map" size={17} color="#FFFFFF" />
            <Text style={styles.botaoPrimarioTexto}>Criar nova Trilha</Text>
          </TouchableOpacity>

        <View style={styles.mensagem}>
          <Feather name="wind" size={17} color="#0F766E" />
          <Text style={styles.mensagemTexto}>Descanso também faz parte da evolução.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: cores.fundo, padding: 20 },
  conteudo: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingBottom: 28 },
  cabecalho: { alignItems: 'center', paddingTop: 12, paddingBottom: 24 },
  iconeCabecalho: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#E5EDFF', alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  ola: { fontSize: 24, fontWeight: '800', color: cores.texto, textAlign: 'center' },
  descricao: { fontSize: 15, color: cores.textoSuave, textAlign: 'center', lineHeight: 22, marginTop: 7, maxWidth: 430 },
  resumo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 17, padding: 16, borderWidth: 1, borderColor: '#E8EDF5', marginBottom: 25 },
  resumoIcone: { height: 42, width: 42, borderRadius: 14, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  resumoTexto: { flex: 1 },
  resumoValor: { color: cores.texto, fontSize: 22, fontWeight: '800' },
  resumoRotulo: { color: cores.textoSuave, fontSize: 12, marginTop: 1 },
  resumoNota: { color: cores.primaria, fontSize: 11, fontWeight: '600', maxWidth: 110, textAlign: 'right' },
  tituloLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tituloSecao: { color: cores.texto, fontSize: 19, fontWeight: '800' },
  subtituloSecao: { color: cores.textoSuave, fontSize: 13, marginTop: 3 },
  lista: { gap: 10 },
  cartaoHobby: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E8EDF5', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hobbyIcone: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  hobbyInfo: { flex: 1 },
  hobbyNome: { color: cores.texto, fontSize: 15, fontWeight: '700' },
  hobbyDias: { color: cores.textoSuave, fontSize: 11, marginTop: 4 },
  hobbyRecorde: { color: '#B45309', fontSize: 11, fontWeight: '600', marginTop: 3 },
  sequencia: { minWidth: 40, alignItems: 'center' },
  sequenciaNumero: { color: cores.texto, fontWeight: '800', fontSize: 16, marginTop: 2 },
  sequenciaRotulo: { color: cores.textoSuave, fontSize: 10 },
  cartaoVazio: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E8EDF5', padding: 20, alignItems: 'center' },
  iconeVazio: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  vazioTitulo: { color: cores.texto, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  textoSuave: { color: cores.textoSuave, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  textoErro: { color: cores.erro, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  estado: { paddingVertical: 30, alignItems: 'center', gap: 10 },
  botaoPrimario: { minHeight: 48, borderRadius: 12, backgroundColor: cores.primaria, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 14 },
  botaoPrimarioTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  botaoSecundario: { minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: cores.primaria, borderRadius: 11, marginTop: 8 },
  botaoSecundarioTexto: { color: cores.primaria, fontWeight: '700', fontSize: 13 },
  mensagem: { marginTop: 18, borderRadius: 13, padding: 12, backgroundColor: '#E6F7F4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mensagemTexto: { color: '#0F766E', fontSize: 12, fontWeight: '600' },
});
