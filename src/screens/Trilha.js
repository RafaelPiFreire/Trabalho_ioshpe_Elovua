import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { fotos, trilhas } from '../services/armazenamento';
import { avisar } from '../utils/alerta';
import { useTheme } from '../ThemeContext';

const LARGURA = Dimensions.get('window').width;

const DIAS = [
  { valor: 1, curto: 'Seg', nome: 'Segunda-feira' },
  { valor: 2, curto: 'Ter', nome: 'Terça-feira' },
  { valor: 3, curto: 'Qua', nome: 'Quarta-feira' },
  { valor: 4, curto: 'Qui', nome: 'Quinta-feira' },
  { valor: 5, curto: 'Sex', nome: 'Sexta-feira' },
  { valor: 6, curto: 'Sáb', nome: 'Sábado' },
  { valor: 0, curto: 'Dom', nome: 'Domingo' },
];

function formatarHoje() {
  const data = new Date();
  return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function dataDeChave(chave) {
  const [ano, mes, dia] = chave.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12);
}

function formatarData(chave) {
  return dataDeChave(chave).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function agruparAtividades(atividades, fotosRecentes, fotosPreservadas) {
  const porData = new Map();
  atividades.forEach(({ data }) => {
    const etapa = porData.get(data) || { data, quantidade: 0, foto: null, fotoPreservada: null };
    etapa.quantidade += 1;
    porData.set(data, etapa);
  });
  fotosRecentes.forEach((foto) => {
    const etapa = porData.get(foto.data) || { data: foto.data, quantidade: 0, foto: null, fotoPreservada: null };
    etapa.foto = foto;
    porData.set(foto.data, etapa);
  });
  fotosPreservadas.forEach((foto) => {
    const etapa = porData.get(foto.data) || { data: foto.data, quantidade: 0, foto: null, fotoPreservada: null };
    etapa.fotoPreservada = foto;
    porData.set(foto.data, etapa);
  });
  return [...porData.entries()]
    .sort(([dataA], [dataB]) => dataB.localeCompare(dataA))
    .map(([, etapa]) => etapa);
}

export default function Trilha({ usuario, navigation, route }) {
  const { cores } = useTheme();
  const styles = makeEstilos(cores);
  const [hobbies, setHobbies] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [diasEditados, setDiasEditados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [mostrarHistoricoCompleto, setMostrarHistoricoCompleto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento('');
    try {
      const lista = await trilhas.lerHobbies(usuario.email);
      setHobbies(lista);
      setSelecionado((atual) => (
        lista.some((habilidades) => habilidades.id === route.params?.hobbyId)
          ? route.params.hobbyId
          : lista.some((habilidades) => habilidades.id === atual) ? atual : (lista[0]?.id || null)
      ));
      return true;
    } catch (erro) {
      setErroCarregamento('Não foi possível carregar suas habilidades salvas.');
      avisar('Erro ao carregar', erro?.message || 'Confira o armazenamento local e tente novamente.');
      return false;
    } finally {
      setCarregando(false);
    }
  }, [route.params?.hobbyId, usuario.email]);

  useFocusEffect(useCallback(() => {
    carregar();
  }, [carregar]));

  useEffect(() => {
    if (route.params?.hobbyId) navigation.setParams({ hobbyId: undefined });
  }, [navigation, route.params?.hobbyId]);

  const hobbyAtual = hobbies.find((habilidades) => habilidades.id === selecionado) || null;
  const resumo = hobbyAtual ? trilhas.obterResumo(hobbyAtual) : null;
  const configAtual = hobbyAtual?.configuracoes[hobbyAtual.configuracoes.length - 1];
  const historico = hobbyAtual
    ? agruparAtividades(hobbyAtual.atividades, hobbyAtual.fotos, hobbyAtual.fotosPreservadas)
    : [];
  const historicoVisivel = mostrarHistoricoCompleto ? historico : historico.slice(0, 5);
  const fotoHoje = hobbyAtual?.fotos.find((foto) => foto.data === resumo?.data) || null;

  function diasSelecionados(dias) {
    return (
      <View style={styles.diasRow}>
        {DIAS.map((dia) => {
          const ativo = dias.includes(dia.valor);
          return (
            <TouchableOpacity
              key={dia.valor}
              accessibilityRole="button"
              accessibilityLabel={`${dia.nome}${ativo ? ', selecionado' : ''}`}
              accessibilityState={{ selected: ativo }}
              disabled={salvando}
              onPress={() => setDiasEditados((atuais) => {
                const diasAtuais = atuais === null ? (configAtual?.dias || []) : atuais;
                return diasAtuais.includes(dia.valor)
                  ? diasAtuais.filter((item) => item !== dia.valor)
                  : [...diasAtuais, dia.valor];
              })}
              style={[styles.diaPill, ativo && styles.diaPillAtivo]}
            >
              <Text style={[styles.diaTexto, ativo && styles.diaTextoAtivo]}>{dia.curto}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  async function executar(acao, sucesso) {
    if (salvando) return;
    setSalvando(true);
    try {
      await acao();
      if (!await carregar()) return false;
      if (sucesso) avisar('Tudo certo', sucesso);
      return true;
    } catch (erro) {
      avisar('Não foi possível salvar', erro?.message || 'Tente novamente.');
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarFoto() {
    if (salvando || !hobbyAtual) return;
    setSalvando(true);
    try {
      const resultado = await fotos.selecionarEAdicionar(usuario.email, hobbyAtual.id);
      if (resultado.cancelada) return;
      if (!await carregar()) return;
      avisar(
        'Foto registrada',
        resumo.praticaPlanejadaHoje
          ? 'A foto foi salva e a prática do dia foi registrada para esta habilidade.'
          : 'A foto e a prática foram salvas. Hoje é descanso planejado, então sua sequência segue no mesmo ritmo.',
      );
    } catch (erro) {
      await carregar();
      avisar('Não foi possível adicionar a foto', erro?.message || 'Confira o acesso à galeria e ao armazenamento local.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarFotoNaGaleria(foto) {
    if (salvando || !hobbyAtual) return;
    setSalvando(true);
    try {
      const resultado = await fotos.salvarNaGaleria(usuario.email, hobbyAtual.id, foto.id);
      if (!await carregar()) return;
      avisar(
        resultado.jaSalva ? 'Foto já preservada' : 'Foto salva',
        resultado.jaSalva
          ? 'Esta foto já tem uma cópia independente na galeria.'
          : 'Uma cópia independente foi salva na galeria do aparelho.',
      );
    } catch (erro) {
      await carregar();
      avisar('Não foi possível salvar a foto', erro?.message || 'Confira a permissão da galeria e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.estadoCarregando}>
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={styles.textoSuave}>Carregando suas trilhas...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View style={styles.iconeCabecalho}>
            <Feather name="trending-up" size={22} color={cores.primaria} />
          </View>
          <Text style={styles.saudacao}>Seu próximo passo</Text>
          <Text style={styles.titulo}>Uma trilha para cada habilidade</Text>
          <Text style={styles.data}>{formatarHoje()}</Text>
        </View>

        {erroCarregamento ? (
          <View style={styles.cartao}>
            <Text style={styles.mensagemErro}>{erroCarregamento}</Text>
            <TouchableOpacity style={styles.botaoSecundario} onPress={carregar}>
              <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : hobbies.length === 0 ? (
          <View style={[styles.cartao, styles.vazio]}>
            <View style={styles.iconeVazio}><Feather name="map" size={27} color={cores.primaria} /></View>
            <Text style={styles.tituloCartao}>Toda evolução começa pequeno</Text>
            <Text style={styles.textoSuave}>
              Crie sua primeira trilha e escolha os dias em que quer praticar. Seu progresso fica salvo neste aparelho.
            </Text>
            <TouchableOpacity style={styles.botaoPrimario} onPress={() => navigation.navigate('NewTrilha')}>
              <Feather name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.botaoPrimarioTexto}>Criar minha primeira habilidade</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {hobbies.length > 0 && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listaHobbies}>
              {hobbies.map((habilidades) => (
                <TouchableOpacity
                  key={habilidades.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: habilidades.id === selecionado }}
                  onPress={() => {
                    setSelecionado(habilidades.id);
                    setDiasEditados(null);
                    setMostrarHistoricoCompleto(false);
                  }}
                  style={[styles.hobbyPill, habilidades.id === selecionado && styles.hobbyPillAtivo]}
                >
                  <Text style={[styles.hobbyPillTexto, habilidades.id === selecionado && styles.hobbyPillTextoAtivo]}>
                    {habilidades.nome}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.adicionarPill} onPress={() => navigation.navigate('NewTrilha')}>
                <Feather name="plus" size={16} color={cores.primaria} />
                <Text style={styles.adicionarPillTexto}>Nova habilidade</Text>
              </TouchableOpacity>
            </ScrollView>

            {hobbyAtual && resumo && (
              <>
                <View style={styles.cartaoResumo}>
                  <View style={styles.fogo}>
                    <MaterialCommunityIcons name="fire" size={27} color="#F97316" />
                  </View>
                  <View style={styles.resumoTexto}>
                    <Text style={styles.resumoRotulo}>SEQUÊNCIA ATUAL</Text>
                    <Text style={styles.resumoNumero}>
                      {resumo.sequenciaAtual}{' '}
                      <Text style={styles.resumoUnidade}>
                        {resumo.sequenciaAtual === 1 ? 'dia de prática' : 'dias de prática'}
                      </Text>
                    </Text>
                    <Text style={styles.recorde}>Seu recorde: {resumo.recorde} {resumo.recorde === 1 ? 'dia' : 'dias'}</Text>
                  </View>
                  <Feather name="award" size={22} color="#F59E0B" />
                </View>

                {/* Trilha visual estilo Duolingo */}
                <View style={styles.trilhaContainer}>
                  <View style={styles.trilhaCabecalho}>
                    <View style={styles.trilhaCabecalhoIcone}>
                      <MaterialCommunityIcons name="map-marker-path" size={22} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.trilhaTitulo}>Sua trilha</Text>
                      <Text style={styles.trilhaSubtitulo}>Seção 1 · {hobbyAtual.nome}</Text>
                    </View>
                  </View>

                  {historicoVisivel.length === 0 ? (
                    <View style={styles.trilhaVazia}>
                      <Text style={styles.trilhaVaziaEmoji}>🗺️</Text>
                      <Text style={styles.trilhaVaziaTexto}>
                        Sua primeira etapa aparece aqui quando você registrar uma atividade.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.trilhaMapa}>
                      {historicoVisivel.map((etapa, indice) => {
                        // Alterna nós: esquerda, centro, direita para criar sinuosidade
                        const posicoes = ['flex-start', 'center', 'flex-end', 'center'];
                        const alinhamento = posicoes[indice % posicoes.length];
                        const ehUltimo = indice === historicoVisivel.length - 1;

                        return (
                          <View key={etapa.data} style={styles.trilhaEtapaWrapper}>
                            {/* Conector entre nós */}
                            {indice > 0 && (
                              <View style={[styles.trilhaConectorWrapper, { alignItems: alinhamento }]}>
                                <View style={styles.trilhaConector} />
                              </View>
                            )}

                            {/* Nó da etapa */}
                            <View style={[styles.trilhaNoWrapper, { alignItems: alinhamento }]}>
                              <TouchableOpacity
                                style={[styles.trilhaNo, ehUltimo && styles.trilhaNoDestaque]}
                                activeOpacity={0.8}
                              >
                                <View style={styles.trilhaNoIcone}>
                                  {etapa.foto ? (
                                    <Image source={{ uri: etapa.foto.uri }} style={styles.trilhaNoFoto} />
                                  ) : (
                                    <Feather name="check" size={22} color="#2563EB" />
                                  )}
                                </View>
                                {ehUltimo && (
                                  <View style={styles.trilhaNoBrilho} />
                                )}
                              </TouchableOpacity>

                              {/* Balão de informação */}
                              <View style={[
                                styles.trilhaBalao,
                                alinhamento === 'flex-end' && styles.trilhaBalaoEsquerda,
                                alinhamento === 'flex-start' && styles.trilhaBalaoDireita,
                              ]}>
                                <Text style={styles.trilhaBalaoData}>{formatarData(etapa.data)}</Text>
                                <Text style={styles.trilhaBalaoDetalhe}>
                                  {etapa.quantidade} {etapa.quantidade === 1 ? 'atividade' : 'atividades'}
                                </Text>
                                {etapa.foto && (
                                  <Text style={styles.trilhaBalaoFoto}>📷 Foto registrada</Text>
                                )}
                                {etapa.foto && !etapa.foto.galeria && Platform.OS !== 'web' && (
                                  <TouchableOpacity
                                    accessibilityRole="button"
                                    disabled={salvando}
                                    onPress={() => salvarFotoNaGaleria(etapa.foto)}
                                  >
                                    <Text style={styles.linkGaleria}>Salvar na galeria</Text>
                                  </TouchableOpacity>
                                )}
                                {!etapa.foto && etapa.fotoPreservada && (
                                  <Text style={styles.trilhaBalaoFoto}>📷 Cópia na galeria</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })}

                      {/* Próxima etapa (bloqueada) */}
                      {historico.length < 99 && (
                        <View style={styles.trilhaEtapaWrapper}>
                          <View style={styles.trilhaConectorWrapper}>
                            <View style={[styles.trilhaConector, styles.trilhaConectorPendente]} />
                          </View>
                          <View style={[styles.trilhaNoWrapper, { alignItems: historicoVisivel.length % 2 === 0 ? 'flex-start' : 'center' }]}>
                            <View style={styles.trilhaNoProximo}>
                              <MaterialCommunityIcons name="lock" size={22} color="#AFAFAF" />
                            </View>
                            <View style={styles.trilhaBalao}>
                              <Text style={styles.trilhaBalaoProximo}>Próxima prática</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {historico.length > 5 && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => setMostrarHistoricoCompleto((valor) => !valor)}
                      style={styles.historicoBotao}
                    >
                      <Text style={styles.botaoSecundarioTexto}>
                        {mostrarHistoricoCompleto ? 'Mostrar menos' : `Ver histórico completo (${historico.length})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cartao}>
                  <View style={styles.tituloLinha}>
                    <View>
                      <Text style={styles.tituloCartao}>Seu ritmo, do seu jeito</Text>
                      <Text style={styles.textoSuave}>Dias planejados para praticar</Text>
                    </View>
                    <Feather name="calendar" size={20} color={cores.primaria} />
                  </View>
                  {diasSelecionados(diasEditados === null ? (configAtual?.dias || []) : diasEditados)}
                  <Text style={styles.dica}>
                    Dias sem marcação são descanso planejado. Uma sequência não precisa ser perfeita.
                  </Text>
                  {diasEditados !== null
                    && (diasEditados.length !== configAtual?.dias.length
                      || diasEditados.some((dia) => !configAtual?.dias.includes(dia))) && (
                    <TouchableOpacity
                      disabled={salvando}
                      style={styles.botaoSecundario}
                      onPress={() => executar(
                        () => trilhas.atualizarDias(usuario.email, hobbyAtual.id, diasEditados),
                        'Seu ritmo foi atualizado. O histórico anterior continua preservado.',
                      ).then((salvo) => { if (salvo) setDiasEditados(null); })}
                    >
                      <Text style={styles.botaoSecundarioTexto}>Salvar dias de prática</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cartaoPratica}>
                  <View style={styles.praticaTopo}>
                    <View style={styles.praticaIcone}><Feather name="check" size={18} color={cores.primaria} /></View>
                    <Text style={styles.praticaTitulo}>Um passo de cada vez</Text>
                  </View>
                  <Text style={styles.textoSuave}>
                    {resumo.quantidadeHoje > 0
                      ? `Você já registrou ${resumo.quantidadeHoje} ${resumo.quantidadeHoje === 1 ? 'atividade' : 'atividades'} hoje.`
                      : resumo.praticaPlanejadaHoje
                        ? 'Fez algo por essa habilidade hoje? Marque sua prática.'
                        : 'Hoje é um dia livre no seu ritmo. Se praticar, você também pode registrar.'}
                  </Text>
                  <TouchableOpacity
                    disabled={salvando}
                    style={[styles.botaoPrimario, salvando && styles.botaoDesativado]}
                    onPress={() => executar(
                      () => trilhas.registrarAtividade(usuario.email, hobbyAtual.id),
                      resumo.praticaPlanejadaHoje
                        ? 'Atividade registrada. O foguinho conta no máximo uma vez por dia.'
                        : 'Atividade registrada. Hoje é descanso planejado, então sua sequência continua no mesmo ritmo.',
                    )}
                  >
                    <Feather name="plus-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.botaoPrimarioTexto}>Registrar atividade de hoje</Text>
                  </TouchableOpacity>
                  <View style={styles.fotoDoDia}>
                    <Text style={styles.rotuloFoto}>Foto do dia</Text>
                    {fotoHoje ? (
                      <View style={styles.fotoHistorico}>
                        <Image source={{ uri: fotoHoje.uri }} style={styles.fotoMiniatura} />
                        <View style={styles.fotoDetalhes}>
                          <Text style={styles.fotoTitulo}>Sua foto está salva neste aparelho</Text>
                          {fotoHoje.galeria ? (
                            <Text style={styles.fotoPreservada}>Cópia independente na galeria</Text>
                          ) : Platform.OS === 'web' ? (
                            <Text style={styles.fotoPreservada}>Foto guardada na trilha deste navegador</Text>
                          ) : (
                            <TouchableOpacity
                              accessibilityRole="button"
                              disabled={salvando}
                              onPress={() => salvarFotoNaGaleria(fotoHoje)}
                              style={styles.botaoGaleria}
                            >
                              <Feather name="download" size={15} color={cores.primaria} />
                              <Text style={styles.linkGaleria}>Salvar na galeria</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.textoSuave}>
                          Uma foto por dia. Ao adicionar, a prática de hoje também será registrada.
                        </Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          disabled={salvando}
                          style={[styles.botaoFoto, salvando && styles.botaoDesativado]}
                          onPress={adicionarFoto}
                        >
                          {salvando
                            ? <ActivityIndicator color={cores.primaria} />
                            : <Feather name="image" size={18} color={cores.primaria} />}
                          <Text style={styles.textoBotaoFoto}>Adicionar foto e registrar prática</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </>
            )}
          </>
        )}

      </View>
    </ScrollView>
  );
}

function makeEstilos(cores) {
  return StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: cores.fundo },
  conteudo: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingBottom: 32 },

  // Cabeçalho
  cabecalho: {
    alignItems: 'center', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, marginTop: 16,
    marginHorizontal: 16, marginBottom: 16, borderRadius: 22,
    backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda,
  },
  iconeCabecalho: { width: 52, height: 52, borderRadius: 18, backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: cores.primariaBorda },
  saudacao: { color: cores.primaria, fontWeight: '800', fontSize: 12, marginBottom: 4, letterSpacing: 1 },
  titulo: { color: cores.texto, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  data: { color: cores.textoSuave, fontSize: 13, marginTop: 6, textTransform: 'capitalize' },

  // Pills de hobbies
  listaHobbies: { gap: 8, paddingBottom: 14, paddingTop: 4, paddingHorizontal: 16 },
  hobbyPill: { borderWidth: 1.5, borderColor: cores.borda, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: cores.cartao },
  hobbyPillAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  hobbyPillTexto: { color: cores.textoSuave, fontWeight: '700', fontSize: 14 },
  hobbyPillTextoAtivo: { color: '#FFFFFF' },
  adicionarPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: cores.primaria, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  adicionarPillTexto: { color: cores.primaria, fontWeight: '700', fontSize: 13 },

  // Cards genéricos
  cartao: { backgroundColor: cores.cartao, borderRadius: 18, padding: 18, marginBottom: 14, marginHorizontal: 16, borderWidth: 1, borderColor: cores.borda },
  vazio: { alignItems: 'center', paddingVertical: 28 },
  iconeVazio: { width: 64, height: 64, borderRadius: 22, backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  tituloCartao: { color: cores.texto, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  textoSuave: { color: cores.textoSuave, fontSize: 14, lineHeight: 21 },

  // Card de resumo / sequência
  cartaoResumo: { backgroundColor: cores.cartao, borderRadius: 18, padding: 18, marginBottom: 14, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: cores.borda },
  fogo: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  resumoTexto: { flex: 1 },
  resumoRotulo: { color: cores.textoSuave, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  resumoNumero: { color: cores.texto, fontSize: 28, fontWeight: '900', marginTop: 2 },
  resumoUnidade: { color: cores.textoSuave, fontSize: 13, fontWeight: '600' },
  recorde: { color: '#F97316', fontSize: 13, fontWeight: '700', marginTop: 4 },

  // =============================================
  // MAPA DA TRILHA (azul, com tema claro/escuro)
  // =============================================
  trilhaContainer: {
    backgroundColor: cores.trilhaFundo,
    marginHorizontal: 16,
    borderRadius: 24,
    marginBottom: 14,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  trilhaCabecalho: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 8,
  },
  trilhaCabecalhoIcone: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  trilhaTitulo: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  trilhaSubtitulo: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginTop: 2 },

  trilhaVazia: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  trilhaVaziaEmoji: { fontSize: 48, marginBottom: 12 },
  trilhaVaziaTexto: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', lineHeight: 21 },

  trilhaMapa: { paddingVertical: 16, paddingHorizontal: 20 },
  trilhaEtapaWrapper: { width: '100%' },
  trilhaConectorWrapper: { width: '100%', paddingHorizontal: 10, height: 28, justifyContent: 'center' },
  trilhaConector: { width: 4, height: 28, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2 },
  trilhaConectorPendente: { backgroundColor: 'rgba(255,255,255,0.25)' },

  trilhaNoWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  trilhaNo: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  trilhaNoDestaque: { backgroundColor: '#FFC800', borderColor: 'rgba(255,255,255,0.6)' },
  trilhaNoIcone: { alignItems: 'center', justifyContent: 'center' },
  trilhaNoFoto: { width: 64, height: 64, borderRadius: 32 },
  trilhaNoBrilho: {
    position: 'absolute', top: 6, left: 10, width: 20, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)', transform: [{ rotate: '-20deg' }],
  },
  trilhaNoProximo: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderStyle: 'dashed',
  },
  trilhaBalao: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: 10, maxWidth: 200 },
  trilhaBalaoEsquerda: { marginRight: 84 },
  trilhaBalaoDireita: { marginLeft: 0 },
  trilhaBalaoData: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  trilhaBalaoDetalhe: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  trilhaBalaoFoto: { color: '#FFE08A', fontSize: 12, fontWeight: '700', marginTop: 4 },
  trilhaBalaoProximo: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  // =============================================

  historicoBotao: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  tituloLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },

  // Dias da semana
  diasRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 15, marginBottom: 8 },
  diaPill: { flex: 1, minWidth: 34, aspectRatio: 1, maxHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo, borderWidth: 1.5, borderColor: cores.borda },
  diaPillAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  diaTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: '800' },
  diaTextoAtivo: { color: '#FFFFFF' },
  dica: { color: cores.textoSuave, fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 6 },

  // Botões
  botaoPrimario: {
    minHeight: 50, borderRadius: 14, backgroundColor: cores.primaria,
    paddingHorizontal: 16, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 12,
  },
  botaoPrimarioTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  botaoDesativado: { opacity: 0.6 },
  botaoSecundario: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1.5, borderColor: cores.primaria, borderRadius: 14, marginTop: 8 },
  botaoSecundarioTexto: { color: cores.primaria, fontWeight: '800', fontSize: 13 },

  // Cartão de prática
  cartaoPratica: { backgroundColor: cores.cartao, borderRadius: 18, padding: 18, marginBottom: 14, marginHorizontal: 16, borderWidth: 1, borderColor: cores.borda },
  praticaTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 9 },
  praticaIcone: { height: 34, width: 34, borderRadius: 12, backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center' },
  praticaTitulo: { color: cores.texto, fontSize: 16, fontWeight: '800' },
  fotoDoDia: { borderTopWidth: 1, borderTopColor: cores.borda, marginTop: 16, paddingTop: 15 },
  rotuloFoto: { color: cores.texto, fontWeight: '800', fontSize: 14, marginBottom: 7 },
  botaoFoto: { minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: cores.primaria, marginTop: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: cores.primariaClara },
  textoBotaoFoto: { color: cores.primaria, fontSize: 14, fontWeight: '800' },
  fotoHistorico: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  fotoMiniatura: { width: 68, height: 68, borderRadius: 14, backgroundColor: cores.superficieAlta },
  fotoDetalhes: { flex: 1, gap: 5 },
  fotoTitulo: { color: cores.texto, fontSize: 12, fontWeight: '700' },
  fotoPreservada: { color: cores.primaria, fontSize: 12, fontWeight: '700', marginTop: 4 },
  botaoGaleria: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  linkGaleria: { color: cores.primaria, fontWeight: '800', fontSize: 12 },
  estadoCarregando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: cores.fundo },
  mensagemErro: { color: cores.erro, fontSize: 14, lineHeight: 21 },
  });
}
