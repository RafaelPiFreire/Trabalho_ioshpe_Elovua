import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { trilhas } from '../services/armazenamento';
import { useTheme } from '../ThemeContext';
import Aparecer from '../components/Aparecer';

export default function Home({ usuario }) {
  const navigation = useNavigation();
  const { cores } = useTheme();
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
          if (ativo) setErro(falha?.message || 'Não foi possível carregar suas habilidades.');
        })
        .finally(() => { if (ativo) setCarregando(false); });
      return () => { ativo = false; };
    }, [usuario.email, tentativa])
  );

  const resumos = hobbies.map((habilidades) => ({
    habilidades,
    resumo: trilhas.obterResumo(habilidades),
  }));

  const estilos = makeEstilos(cores);

  return (
    <ScrollView contentContainerStyle={estilos.container} showsVerticalScrollIndicator={false}>
      <View style={estilos.conteudo}>

        {/* Cabeçalho estilo Duolingo */}
        <Aparecer>
        <View style={estilos.cabecalho}>
          <View style={estilos.cabecalhoTopo}>
            <View style={estilos.streakContainer}>
              <MaterialCommunityIcons name="fire" size={22} color="#FF4B4B" />
              <Text style={estilos.streakNumero}>{resumos.reduce((acc, r) => Math.max(acc, r.resumo.sequenciaAtual), 0)}</Text>
            </View>
            <View style={estilos.logoMarca}>
              <Image
                source={require('../../assets/Evolua_login3.png')}
                style={estilos.logoImagem}
                accessibilityLabel="Logo Evolua"
              />
            </View>
            <View style={estilos.xpContainer}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFC800" />
              <Text style={estilos.xpNumero}>{hobbies.length * 10}</Text>
            </View>
          </View>

          <Text style={estilos.saudacao}>Olá, {usuario.nome}! 👋</Text>
          <Text style={estilos.subtitulo}>
            Pequenos passos também são progresso.
          </Text>
        </View>
        </Aparecer>

        {/* Barra de progresso diária */}
        <Aparecer atraso={90}>
        <View style={estilos.progressoCard}>
          <View style={estilos.progressoTopo}>
            <Text style={estilos.progressoTitulo}>Meta diária</Text>
            <Text style={estilos.progressoPorcentagem}>
              {resumos.filter(r => r.resumo.quantidadeHoje > 0).length}/{hobbies.length}
            </Text>
          </View>
          <View style={estilos.progressoBarraFundo}>
            <View style={[
              estilos.progressoBarraPreenchimento,
              {
                width: hobbies.length > 0
                  ? `${(resumos.filter(r => r.resumo.quantidadeHoje > 0).length / hobbies.length) * 100}%`
                  : '0%'
              }
            ]} />
          </View>
          <Text style={estilos.progressoDescricao}>
            {resumos.filter(r => r.resumo.quantidadeHoje > 0).length === hobbies.length && hobbies.length > 0
              ? '🎉 Meta do dia concluída!'
              : 'Continue praticando hoje!'}
          </Text>
        </View>
        </Aparecer>

        {/* Seção de hobbies */}
        <Aparecer atraso={160}>
        <View style={estilos.secaoHeader}>
          <Text style={estilos.secaoTitulo}>Suas habilidades</Text>
          {hobbies.length > 0 && (
            <Text style={estilos.secaoContagem}>{hobbies.length} {hobbies.length === 1 ? 'trilha' : 'trilhas'}</Text>
          )}
        </View>
        </Aparecer>

        {carregando ? (
          <Aparecer atraso={220}>
          <View style={estilos.estado}>
            <ActivityIndicator color={cores.primaria} size="large" />
            <Text style={estilos.textoSuave}>Carregando suas habilidades...</Text>
          </View>
          </Aparecer>
        ) : erro ? (
          <Aparecer atraso={220}>
          <View style={estilos.cartaoVazio}>
            <Text style={estilos.textoErro}>{erro}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={estilos.botaoSecundario}
              onPress={() => setTentativa((valor) => valor + 1)}
            >
              <Text style={estilos.botaoSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
          </Aparecer>
        ) : hobbies.length === 0 ? (
          <Aparecer atraso={220}>
          <View style={estilos.cartaoVazio}>
            <View style={estilos.iconeVazio}>
              <Text style={estilos.emojiVazio}>🗺️</Text>
            </View>
            <Text style={estilos.vazioTitulo}>Sua jornada começa aqui!</Text>
            <Text style={estilos.textoSuave}>
              Escolha algo que você gostaria de praticar e crie uma trilha.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={estilos.botaoPrimario}
              onPress={() => navigation.navigate('NewTrilha')}
            >
              <Feather name="plus" size={17} color="#FFFFFF" />
              <Text style={estilos.botaoPrimarioTexto}>Criar minha primeira trilha</Text>
            </TouchableOpacity>
          </View>
          </Aparecer>
        ) : (
          <View style={estilos.lista}>
            {resumos.map(({ habilidades, resumo }, indice) => (
              <Aparecer key={habilidades.id} atraso={220 + Math.min(indice, 5) * 60}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('Trilha')}
                  style={estilos.cartaoHobby}
                  activeOpacity={0.85}
                >
                <View style={estilos.hobbyIconeWrapper}>
                  <View style={estilos.hobbyIcone}>
                    <Text style={estilos.hobbyEmoji}>⚡</Text>
                  </View>
                </View>
                <View style={estilos.hobbyInfo}>
                  <Text style={estilos.hobbyNome}>{habilidades.nome}</Text>
                  <Text style={estilos.hobbyDias}>
                    {resumo.diasPlanejados.length} {resumo.diasPlanejados.length === 1 ? 'dia' : 'dias'}/semana
                  </Text>
                  <View style={estilos.miniProgressoFundo}>
                    <View style={[estilos.miniProgressoPreenchimento, { width: resumo.quantidadeHoje > 0 ? '100%' : '0%' }]} />
                  </View>
                </View>
                <View style={estilos.sequenciaContainer}>
                  <MaterialCommunityIcons name="fire" size={20} color="#FF4B4B" />
                  <Text style={estilos.sequenciaNumero}>{resumo.sequenciaAtual}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={cores.textoSuave} />
                </TouchableOpacity>
              </Aparecer>
            ))}
          </View>
        )}

        {!carregando && !erro && hobbies.length > 0 && (
          <Aparecer atraso={320}>
          <TouchableOpacity
            accessibilityRole="button"
            style={estilos.botaoPrimario}
            onPress={() => navigation.navigate('Trilha')}
            activeOpacity={0.85}
          >
            <Feather name="map" size={17} color="#FFFFFF" />
            <Text style={estilos.botaoPrimarioTexto}>Ver minhas trilhas</Text>
          </TouchableOpacity>
          </Aparecer>
        )}

        {!carregando && !erro && hobbies.length > 0 && (
          <Aparecer atraso={380}>
          <TouchableOpacity
            accessibilityRole="button"
            style={estilos.botaoPrimario}
            onPress={() => navigation.navigate('NewTrilha')}
            activeOpacity={0.85}
          >
            <Feather name="plus-circle" size={17} color="#FFFFFF" />
            <Text style={estilos.botaoPrimarioTexto}>Criar nova habilidade</Text>
          </TouchableOpacity>
          </Aparecer>
        )}

        <Aparecer atraso={440}>
        <View style={estilos.mensagem}>
          <Text style={estilos.mensagemEmoji}>🌿</Text>
          <Text style={estilos.mensagemTexto}>Descanso também faz parte da evolução.</Text>
        </View>
        </Aparecer>
      </View>
    </ScrollView>
  );
}

function makeEstilos(cores) {
  return StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: cores.fundo, paddingBottom: 32 },
    conteudo: { width: '100%', maxWidth: 620, alignSelf: 'center' },

    // Cabeçalho
    cabecalho: { backgroundColor: cores.cartao, paddingTop: 18, paddingBottom: 22, paddingHorizontal: 20, marginTop: 16, marginHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: cores.borda },
    cabecalhoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    streakContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,75,75,0.12)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
    streakNumero: { fontWeight: '800', fontSize: 16, color: '#FF4B4B' },
    logoMarca: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    logoImagem: { width: 80, height: 70, resizeMode: 'contain', tintColor: cores.primaria },
    xpContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,200,0,0.14)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
    xpNumero: { fontWeight: '800', fontSize: 16, color: '#D9A400' },
    saudacao: { fontSize: 24, fontWeight: '900', color: cores.texto, textAlign: 'center' },
    subtitulo: { fontSize: 14, color: cores.textoSuave, textAlign: 'center', marginTop: 6 },

    // Card de progresso
    progressoCard: { backgroundColor: cores.cartao, marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: cores.borda },
    progressoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    progressoTitulo: { fontWeight: '800', fontSize: 15, color: cores.texto },
    progressoPorcentagem: { fontWeight: '800', fontSize: 15, color: cores.primaria },
    progressoBarraFundo: { height: 12, backgroundColor: cores.superficieAlta, borderRadius: 6, overflow: 'hidden' },
    progressoBarraPreenchimento: { height: 12, backgroundColor: cores.primaria, borderRadius: 6 },
    progressoDescricao: { fontSize: 13, color: cores.textoSuave, marginTop: 8, textAlign: 'center', fontWeight: '600' },

    // Seção
    secaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
    secaoTitulo: { fontSize: 20, fontWeight: '900', color: cores.texto },
    secaoContagem: { fontSize: 13, fontWeight: '700', color: cores.textoSuave },

    // Lista de hobbies
    lista: { paddingHorizontal: 16, gap: 10 },
    cartaoHobby: {
      backgroundColor: cores.cartao,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cores.borda,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    hobbyIconeWrapper: { alignItems: 'center', justifyContent: 'center' },
    hobbyIcone: { width: 50, height: 50, borderRadius: 16, backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: cores.primariaBorda },
    hobbyEmoji: { fontSize: 24 },
    hobbyInfo: { flex: 1 },
    hobbyNome: { color: cores.texto, fontSize: 16, fontWeight: '800' },
    hobbyDias: { color: cores.textoSuave, fontSize: 12, marginTop: 3, fontWeight: '600' },
    miniProgressoFundo: { height: 6, backgroundColor: cores.superficieAlta, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
    miniProgressoPreenchimento: { height: 6, backgroundColor: cores.primaria, borderRadius: 3 },
    sequenciaContainer: { alignItems: 'center', gap: 2 },
    sequenciaNumero: { color: '#FF4B4B', fontWeight: '900', fontSize: 18 },

    // Estado vazio
    cartaoVazio: { backgroundColor: cores.cartao, borderRadius: 18, borderWidth: 1, borderColor: cores.borda, padding: 24, alignItems: 'center', marginHorizontal: 16 },
    iconeVazio: { width: 72, height: 72, borderRadius: 24, backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    emojiVazio: { fontSize: 36 },
    vazioTitulo: { color: cores.texto, fontSize: 18, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
    textoSuave: { color: cores.textoSuave, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    textoErro: { color: cores.erro, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    estado: { paddingVertical: 40, alignItems: 'center', gap: 12 },

    // Botões
    botaoPrimario: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: cores.primaria,
      paddingHorizontal: 20,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 9,
      marginTop: 14,
      marginHorizontal: 16,
    },
    botaoPrimarioTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
    botaoSecundario: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderWidth: 1.5, borderColor: cores.primaria, borderRadius: 14, marginTop: 10 },
    botaoSecundarioTexto: { color: cores.primaria, fontWeight: '800', fontSize: 14 },

    // Mensagem inferior
    mensagem: { marginTop: 22, marginHorizontal: 16, borderRadius: 14, padding: 14, backgroundColor: cores.primariaClara, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    mensagemEmoji: { fontSize: 18 },
    mensagemTexto: { color: cores.primaria, fontSize: 13, fontWeight: '700' },
  });
}
