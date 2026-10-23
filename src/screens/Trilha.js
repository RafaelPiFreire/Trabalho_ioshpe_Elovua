import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { fotos, trilhas } from '../services/armazenamento';
import { avisar } from '../utils/alerta';
import { cores } from '../theme';

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

export default function Trilha({ usuario }) {
  const [hobbies, setHobbies] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [nomeNovo, setNomeNovo] = useState('');
  const [diasNovos, setDiasNovos] = useState([]);
  const [diasEditados, setDiasEditados] = useState(null);
  const [criando, setCriando] = useState(false);
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
      setSelecionado((atual) => lista.some((hobby) => hobby.id === atual) ? atual : (lista[0]?.id || null));
      return true;
    } catch (erro) {
      setErroCarregamento('Não foi possível carregar seus hobbies salvos.');
      avisar('Erro ao carregar', erro?.message || 'Confira o armazenamento local e tente novamente.');
      return false;
    } finally {
      setCarregando(false);
    }
  }, [usuario.email]);

  useEffect(() => { carregar(); }, [carregar]);

  const hobbyAtual = hobbies.find((hobby) => hobby.id === selecionado) || null;
  const resumo = hobbyAtual ? trilhas.obterResumo(hobbyAtual) : null;
  const configAtual = hobbyAtual?.configuracoes[hobbyAtual.configuracoes.length - 1];
  const historico = hobbyAtual
    ? agruparAtividades(hobbyAtual.atividades, hobbyAtual.fotos, hobbyAtual.fotosPreservadas)
    : [];
  const historicoVisivel = mostrarHistoricoCompleto ? historico : historico.slice(0, 5);
  const fotoHoje = hobbyAtual?.fotos.find((foto) => foto.data === resumo?.data) || null;

  function alternarDia(setter, dias, dia) {
    setter(dias.includes(dia)
      ? dias.filter((item) => item !== dia)
      : [...dias, dia]);
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

  async function criarNovoHobby() {
    if (salvando) return;
    setSalvando(true);
    try {
      const novo = await trilhas.criarHobby(usuario.email, nomeNovo, diasNovos);
      const lista = await trilhas.lerHobbies(usuario.email);
      setHobbies(lista);
      setSelecionado(novo.id);
      setNomeNovo('');
      setDiasNovos([]);
      setCriando(false);
    } catch (erro) {
      avisar('Não foi possível criar', erro?.message || 'Tente novamente.');
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
          ? 'A foto foi salva e a prática do dia foi registrada para este hobby.'
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

  function diasSelecionados(dias, setter) {
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
              onPress={() => alternarDia(setter, dias, dia.valor)}
              style={[styles.diaPill, ativo && styles.diaPillAtivo]}
            >
              <Text style={[styles.diaTexto, ativo && styles.diaTextoAtivo]}>{dia.curto}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
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
          <Text style={styles.titulo}>Uma trilha para cada hobby</Text>
          <Text style={styles.data}>{formatarHoje()}</Text>
        </View>

        {erroCarregamento ? (
          <View style={styles.cartao}>
            <Text style={styles.mensagemErro}>{erroCarregamento}</Text>
            <TouchableOpacity style={styles.botaoSecundario} onPress={carregar}>
              <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : hobbies.length === 0 && !criando ? (
          <View style={[styles.cartao, styles.vazio]}>
            <View style={styles.iconeVazio}><Feather name="map" size={27} color={cores.primaria} /></View>
            <Text style={styles.tituloCartao}>Toda evolução começa pequeno</Text>
            <Text style={styles.textoSuave}>
              Crie sua primeira trilha e escolha os dias em que quer praticar. Seu progresso fica salvo neste aparelho.
            </Text>
            <TouchableOpacity style={styles.botaoPrimario} onPress={() => setCriando(true)}>
              <Feather name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.botaoPrimarioTexto}>Criar meu primeiro hobby</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {hobbies.length > 0 && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listaHobbies}>
              {hobbies.map((hobby) => (
                <TouchableOpacity
                  key={hobby.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: hobby.id === selecionado }}
                  onPress={() => {
                    setSelecionado(hobby.id);
                    setDiasEditados(null);
                    setMostrarHistoricoCompleto(false);
                  }}
                  style={[styles.hobbyPill, hobby.id === selecionado && styles.hobbyPillAtivo]}
                >
                  <Text style={[styles.hobbyPillTexto, hobby.id === selecionado && styles.hobbyPillTextoAtivo]}>
                    {hobby.nome}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.adicionarPill} onPress={() => setCriando((valor) => !valor)}>
                <Feather name={criando ? 'x' : 'plus'} size={16} color={cores.primaria} />
                <Text style={styles.adicionarPillTexto}>{criando ? 'Fechar' : 'Novo hobby'}</Text>
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

                <View style={styles.cartao}>
                  <View style={styles.tituloLinha}>
                    <View>
                      <Text style={styles.tituloCartao}>Sua trilha</Text>
                      <Text style={styles.textoSuave}>Cada etapa guarda um dia que você praticou</Text>
                    </View>
                    <Feather name="map" size={20} color={cores.primaria} />
                  </View>
                  {historicoVisivel.length === 0 ? (
                    <Text style={styles.textoSuave}>
                      Sua primeira etapa aparece aqui quando você registrar uma atividade. Não precisa de foto.
                    </Text>
                  ) : (
                    <>
                      {historicoVisivel.map((etapa, indice) => (
                        <View key={etapa.data} style={styles.etapaLinha}>
                          <View style={styles.etapaTrilho}>
                            <View style={styles.etapaNo}>
                              <Feather name="check" size={14} color="#FFFFFF" />
                            </View>
                            {indice < historicoVisivel.length - 1 && <View style={styles.etapaConector} />}
                          </View>
                          <View style={styles.etapaInfo}>
                            <Text style={styles.etapaData}>{formatarData(etapa.data)}</Text>
                            <Text style={styles.etapaDetalhe}>
                              {etapa.quantidade} {etapa.quantidade === 1 ? 'atividade registrada' : 'atividades registradas'}
                            </Text>
                            {etapa.foto && (
                              <View style={styles.fotoHistorico}>
                                <Image source={{ uri: etapa.foto.uri }} style={styles.fotoMiniatura} />
                                <View style={styles.fotoDetalhes}>
                                  <Text style={styles.fotoTitulo}>Foto do dia</Text>
                                  {etapa.foto.galeria ? (
                                    <Text style={styles.fotoPreservada}>Cópia salva na galeria</Text>
                                  ) : (
                                    <TouchableOpacity
                                      accessibilityRole="button"
                                      disabled={salvando}
                                      onPress={() => salvarFotoNaGaleria(etapa.foto)}
                                    >
                                      <Text style={styles.linkGaleria}>Salvar na galeria</Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            )}
                            {!etapa.foto && etapa.fotoPreservada && (
                              <Text style={styles.fotoPreservada}>Cópia preservada na galeria do aparelho</Text>
                            )}
                          </View>
                          <Text style={styles.etapaStatus}>Concluído</Text>
                        </View>
                      ))}
                      {historico.length > 5 && (
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => setMostrarHistoricoCompleto((valor) => !valor)}
                          style={styles.historicoBotao}
                        >
                          <Text style={styles.botaoSecundarioTexto}>
                            {mostrarHistoricoCompleto ? 'Mostrar menos' : `Ver todo o histórico (${historico.length})`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
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
                  {diasSelecionados(
                    diasEditados === null ? (configAtual?.dias || []) : diasEditados,
                    (novosDias) => setDiasEditados(novosDias),
                  )}
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
                    <View style={styles.praticaIcone}><Feather name="check" size={18} color="#15803D" /></View>
                    <Text style={styles.praticaTitulo}>Um passo de cada vez</Text>
                  </View>
                  <Text style={styles.textoSuave}>
                    {resumo.quantidadeHoje > 0
                      ? `Você já registrou ${resumo.quantidadeHoje} ${resumo.quantidadeHoje === 1 ? 'atividade' : 'atividades'} hoje.`
                      : resumo.praticaPlanejadaHoje
                        ? 'Fez algo por esse hobby hoje? Marque sua prática.'
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

        {criando && (
          <View style={styles.cartao}>
            <Text style={styles.tituloCartao}>Novo hobby</Text>
            <TextInput
              accessibilityLabel="Nome do hobby"
              style={styles.input}
              placeholder="Ex.: desenho, leitura, música"
              placeholderTextColor="#94A3B8"
              value={nomeNovo}
              onChangeText={setNomeNovo}
              maxLength={50}
              editable={!salvando}
              returnKeyType="done"
              onSubmitEditing={criarNovoHobby}
            />
            <Text style={styles.rotuloDias}>Quais dias você quer praticar?</Text>
            {diasSelecionados(diasNovos, setDiasNovos)}
            <Text style={styles.dica}>Você pode mudar seus dias depois, sem apagar o histórico.</Text>
            <TouchableOpacity
              disabled={salvando}
              style={[styles.botaoPrimario, salvando && styles.botaoDesativado]}
              onPress={criarNovoHobby}
            >
              {salvando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoPrimarioTexto}>Criar trilha</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: cores.fundo, padding: 20 },
  conteudo: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingBottom: 30 },
  cabecalho: { alignItems: 'center', paddingTop: 14, paddingBottom: 22 },
  iconeCabecalho: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#E5EDFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  saudacao: { color: cores.primaria, fontWeight: '700', fontSize: 14, marginBottom: 5 },
  titulo: { color: cores.texto, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  data: { color: cores.textoSuave, fontSize: 13, marginTop: 8 },
  listaHobbies: { gap: 9, paddingBottom: 14 },
  hobbyPill: { borderWidth: 1, borderColor: cores.borda, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  hobbyPillAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  hobbyPillTexto: { color: cores.textoSuave, fontWeight: '600' },
  hobbyPillTextoAtivo: { color: '#FFFFFF' },
  adicionarPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: cores.primaria, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
  adicionarPillTexto: { color: cores.primaria, fontWeight: '700', fontSize: 13 },
  cartao: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E8EDF5' },
  vazio: { alignItems: 'center', paddingVertical: 28 },
  iconeVazio: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  tituloCartao: { color: cores.texto, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  textoSuave: { color: cores.textoSuave, fontSize: 14, lineHeight: 21 },
  cartaoResumo: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E8EDF5' },
  fogo: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#FFF1E8', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  resumoTexto: { flex: 1 },
  resumoRotulo: { color: cores.textoSuave, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  resumoNumero: { color: cores.texto, fontSize: 25, fontWeight: '800', marginTop: 3 },
  resumoUnidade: { color: cores.textoSuave, fontSize: 13, fontWeight: '500' },
  recorde: { color: '#B45309', fontSize: 13, fontWeight: '600', marginTop: 4 },
  etapaLinha: { flexDirection: 'row', minHeight: 63 },
  etapaTrilho: { width: 30, alignItems: 'center', marginRight: 10 },
  etapaNo: { width: 26, height: 26, borderRadius: 13, backgroundColor: cores.sucesso, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  etapaConector: { position: 'absolute', width: 2, top: 23, bottom: -4, backgroundColor: '#BBF7D0' },
  etapaInfo: { flex: 1, paddingBottom: 14 },
  etapaData: { color: cores.texto, fontWeight: '600', fontSize: 13 },
  etapaDetalhe: { color: cores.textoSuave, fontSize: 12, marginTop: 3 },
  etapaStatus: { color: '#15803D', fontWeight: '700', fontSize: 11, paddingTop: 5 },
  historicoBotao: { alignItems: 'center', paddingVertical: 10, marginTop: 2 },
  tituloLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  diasRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 15, marginBottom: 8 },
  diaPill: { flex: 1, minWidth: 34, aspectRatio: 1, maxHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  diaPillAtivo: { backgroundColor: '#EAF0FF', borderColor: cores.primaria },
  diaTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: '700' },
  diaTextoAtivo: { color: cores.primaria },
  dica: { color: cores.textoSuave, fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 6 },
  botaoPrimario: { minHeight: 48, borderRadius: 12, backgroundColor: cores.primaria, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 12 },
  botaoPrimarioTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  botaoDesativado: { opacity: 0.65 },
  botaoSecundario: { minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: cores.primaria, borderRadius: 11, marginTop: 8 },
  botaoSecundarioTexto: { color: cores.primaria, fontWeight: '700', fontSize: 13 },
  cartaoPratica: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E8EDF5' },
  praticaTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 9 },
  praticaIcone: { height: 30, width: 30, borderRadius: 10, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  praticaTitulo: { color: cores.texto, fontSize: 16, fontWeight: '700' },
  fotoDoDia: { borderTopWidth: 1, borderTopColor: '#E8EDF5', marginTop: 16, paddingTop: 15 },
  rotuloFoto: { color: cores.texto, fontWeight: '700', fontSize: 14, marginBottom: 7 },
  botaoFoto: { minHeight: 46, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: cores.primaria, marginTop: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#F8FAFF' },
  textoBotaoFoto: { color: cores.primaria, fontSize: 13, fontWeight: '700' },
  fotoHistorico: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  fotoMiniatura: { width: 68, height: 68, borderRadius: 12, backgroundColor: '#F1F5F9' },
  fotoDetalhes: { flex: 1, gap: 5 },
  fotoTitulo: { color: cores.texto, fontSize: 12, fontWeight: '600' },
  fotoPreservada: { color: '#15803D', fontSize: 12, fontWeight: '600', marginTop: 4 },
  botaoGaleria: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  linkGaleria: { color: cores.primaria, fontWeight: '700', fontSize: 12 },
  input: { height: 48, borderWidth: 1, borderColor: cores.borda, borderRadius: 11, paddingHorizontal: 13, color: cores.texto, marginTop: 10 },
  rotuloDias: { color: cores.texto, fontWeight: '600', fontSize: 14, marginTop: 18 },
  estadoCarregando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: cores.fundo },
  mensagemErro: { color: cores.erro, fontSize: 14, lineHeight: 21 },
});
