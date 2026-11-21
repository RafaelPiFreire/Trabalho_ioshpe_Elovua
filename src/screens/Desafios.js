import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { desafios } from '../services/armazenamento';
import { CATEGORIAS_DESAFIOS, APROVACAO_MINIMA } from '../services/desafios';
import { useTheme } from '../ThemeContext';
import Aparecer from '../components/Aparecer';
import { avisar } from '../utils/alerta';

function lerEvidencia(valor) {
  if (typeof valor !== 'string') return { texto: '', foto: null };
  try {
    const registro = JSON.parse(valor);
    if (registro?.tipo === 'evidencia-desafio') {
      return { texto: registro.texto || '', foto: registro.foto || null };
    }
  } catch {
    // Registros anteriores armazenavam somente o texto da anotação.
  }
  return { texto: valor, foto: null };
}

function extensaoDaFoto(asset) {
  const nome = asset.fileName || asset.uri.split(/[?#]/)[0].split('/').pop() || '';
  return nome.match(/\.(jpe?g|png|webp|heic|heif)$/i)?.[0].toLowerCase() || '.jpg';
}

function prepararFotoWeb(asset) {
  if (typeof asset.base64 !== 'string' || !asset.base64) {
    throw new Error('O navegador não conseguiu preparar a foto selecionada.');
  }
  const tipo = asset.mimeType || 'image/jpeg';
  const uriOriginal = `data:${tipo};base64,${asset.base64}`;
  if (typeof globalThis.Image === 'undefined' || typeof document === 'undefined') return uriOriginal;

  return new Promise((resolve, reject) => {
    const imagem = new globalThis.Image();
    imagem.onload = () => {
      const escala = Math.min(1, 1280 / Math.max(imagem.naturalWidth, imagem.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
      canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
      const contexto = canvas.getContext('2d');
      if (!contexto) {
        reject(new Error('Não foi possível preparar a foto neste navegador.'));
        return;
      }
      contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    imagem.onerror = () => reject(new Error('Não foi possível abrir a foto selecionada no navegador.'));
    imagem.src = uriOriginal;
  });
}

const MODOS = [
  { id: 'surpresa', titulo: 'Surpresa', subtitulo: 'Saia do previsível', icone: 'shuffle' },
  { id: 'desenvolvimento', titulo: 'Desenvolvimento', subtitulo: 'Avance no que já pratica', icone: 'trending-up' },
  { id: 'descoberta', titulo: 'Descoberta', subtitulo: 'Experimente algo novo', icone: 'compass' },
  { id: 'personalizado', titulo: 'Personalizado', subtitulo: 'Crie sua própria atividade', icone: 'edit-3' },
];

export default function Desafios({ usuario }) {
  const { cores } = useTheme();
  const st = useMemo(() => makeEstilos(cores), [cores]);
  const [dados, setDados] = useState({ categorias: {}, historico: [], avaliacoes: [] });
  const [categoria, setCategoria] = useState(CATEGORIAS_DESAFIOS[0]);
  const [atividade, setAtividade] = useState(null);
  const [modo, setModo] = useState('surpresa');
  const [aceita, setAceita] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [autoavaliacao, setAutoavaliacao] = useState('3');
  const [evidencia, setEvidencia] = useState('');
  const [fotoEvidencia, setFotoEvidencia] = useState(null);
  const [tituloCustom, setTituloCustom] = useState('');
  const [descricaoCustom, setDescricaoCustom] = useState('');
  const [duracaoCustom, setDuracaoCustom] = useState('');
  const [dificuldade, setDificuldade] = useState('iniciante');
  const [notaAvaliacao, setNotaAvaliacao] = useState('');
  const [mostrarHistoricoCompleto, setMostrarHistoricoCompleto] = useState(false);
  const [reflexaoAvaliacao, setReflexaoAvaliacao] = useState('');

  const atualizar = useCallback(async () => {
    if (!usuario?.email) return;
    try { setDados(await desafios.ler(usuario.email)); }
    catch (erro) { avisar('Não foi possível carregar', erro?.message || 'Tente novamente.'); }
    finally { setCarregando(false); }
  }, [usuario?.email]);

  useEffect(() => { atualizar(); }, [atualizar]);

  const progresso = desafios.obterProgresso(dados, categoria);

  async function escolher(modoEscolhido = modo, dificuldadeEscolhida = null, dadosAtuais = dados, categoriaEscolhida = categoria) {
    try {
      const dificuldadeAlvo = dificuldadeEscolhida || desafios.obterProgresso(dadosAtuais, categoriaEscolhida).dificuldade;
      const proxima = desafios.escolherAtividade(
        dadosAtuais,
        modoEscolhido,
        modoEscolhido === 'desenvolvimento' ? categoriaEscolhida : null,
        modoEscolhido === 'desenvolvimento' ? dificuldadeAlvo : null,
      );
      if (!proxima) {
        avisar('Sem atividades disponíveis', 'Experimente outra modalidade ou categoria.');
        return;
      }
      setAtividade({ ...proxima, modalidade: modoEscolhido });
      setModo(modoEscolhido);
      setAceita(false);
      setEvidencia('');
      setFotoEvidencia(null);
      setAutoavaliacao('3');
    } catch (erro) { avisar('Erro', erro?.message || 'Não foi possível selecionar uma atividade.'); }
  }

  async function criarPersonalizada() {
    try {
      const nova = await desafios.criarPersonalizada(usuario.email, { categoria, titulo: tituloCustom, descricao: descricaoCustom, dificuldade, duracao: duracaoCustom.trim() || null });
      setAtividade(nova);
      setModo('personalizado');
      setAceita(false);
      setEvidencia('');
      setFotoEvidencia(null);
    } catch (erro) { avisar('Revise a atividade', erro?.message || 'Não foi possível criar.'); }
  }

  async function selecionarFoto() {
    if (salvando) return;
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
        base64: !FileSystem.documentDirectory,
      });
      if (resultado.canceled) return;
      const asset = resultado.assets?.[0];
      if (!asset || typeof asset.uri !== 'string' || !asset.uri) {
        throw new Error('A galeria não retornou uma imagem válida.');
      }
      setFotoEvidencia(asset);
    } catch (erro) {
      avisar('Não foi possível selecionar a foto', erro?.message || 'Confira o acesso à galeria e tente novamente.');
    }
  }

  async function salvarFoto(asset) {
    if (!FileSystem.documentDirectory) return prepararFotoWeb(asset);

    const pasta = `${FileSystem.documentDirectory}evolua-desafios/`;
    const infoPasta = await FileSystem.getInfoAsync(pasta);
    if (!infoPasta.exists) await FileSystem.makeDirectoryAsync(pasta, { intermediates: true });
    const uri = `${pasta}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensaoDaFoto(asset)}`;
    try {
      await FileSystem.copyAsync({ from: asset.uri, to: uri });
      const infoFoto = await FileSystem.getInfoAsync(uri);
      if (!infoFoto.exists) throw new Error('Não foi possível confirmar que a foto foi armazenada.');
      return uri;
    } catch (erro) {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (erroLimpeza) {
        throw new Error(
          `${erro.message || 'Não foi possível salvar a foto.'} Também não foi possível limpar o arquivo temporário (${erroLimpeza.message || 'falha de armazenamento'}).`,
        );
      }
      throw erro;
    }
  }

  async function registrar(status) {
    if (!atividade || salvando) return;
    setSalvando(true);
    let fotoSalva = null;
    try {
      if (status === 'concluida' && fotoEvidencia) fotoSalva = await salvarFoto(fotoEvidencia);
      const anotacao = evidencia.trim();
      await desafios.registrar(usuario.email, atividade, status, {
        autoavaliacao: status === 'concluida' ? Number(autoavaliacao) : null,
        evidencia: status === 'concluida'
          ? fotoSalva
            ? JSON.stringify({ tipo: 'evidencia-desafio', texto: anotacao, foto: fotoSalva })
            : anotacao || null
          : null,
      });
      setAtividade(null);
      setAceita(false);
      setEvidencia('');
      setFotoEvidencia(null);
      await atualizar();
    } catch (erro) {
      if (fotoSalva && FileSystem.documentDirectory) {
        try {
          await FileSystem.deleteAsync(fotoSalva, { idempotent: true });
        } catch (erroLimpeza) {
          avisar(
            'Não foi possível registrar',
            `${erro?.message || 'Tente novamente.'} A foto também não pôde ser removida do armazenamento (${erroLimpeza.message || 'falha de armazenamento'}).`,
          );
          return;
        }
      }
      avisar('Não foi possível registrar', erro?.message || 'Tente novamente.');
    }
    finally { setSalvando(false); }
  }

  async function salvarAvaliacao() {
    const nota = Number(String(notaAvaliacao).replace(',', '.'));
    if (!Number.isFinite(nota) || nota < 0 || nota > 100) {
      avisar('Nota inválida', 'Informe um valor entre 0 e 100.');
      return;
    }
    try {
      await desafios.registrarAvaliacao(usuario.email, categoria, nota, reflexaoAvaliacao.trim() || null);
      setNotaAvaliacao('');
      setReflexaoAvaliacao('');
      await atualizar();
    } catch (erro) { avisar('Não foi possível registrar', erro?.message || 'Tente novamente.'); }
  }

  async function mudarDificuldade(nova) {
    setDificuldade(nova);
    try {
      await desafios.ajustarDificuldade(usuario.email, categoria, nova);
      const dadosAtualizados = await desafios.ler(usuario.email);
      setDados(dadosAtualizados);
      if (modo === 'desenvolvimento') {
        await escolher('desenvolvimento', nova, dadosAtualizados);
      }
    } catch (erro) { avisar('Erro', erro?.message || 'Não foi possível ajustar.'); }
  }

  const historico = mostrarHistoricoCompleto ? dados.historico : dados.historico.slice(0, 8);

  if (carregando) {
    return <View style={st.carregando}><ActivityIndicator color={cores.primaria} /><Text style={st.suave}>Preparando sua jornada...</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={st.container} keyboardShouldPersistTaps="handled">
      <View style={st.conteudo}>
        <Aparecer>
          <View style={st.hero}>
            <View style={st.heroIcone}><Feather name="compass" size={25} color="#FFFFFF" /></View>
            <Text style={st.heroTitulo}>Descubra do que você é capaz.</Text>
            <Text style={st.heroTexto}>Aprenda, experimente e desenvolva habilidades no seu ritmo.</Text>
            <View style={st.heroNumeros}>
              <View><Text style={st.heroNumero}>{Object.values(dados.categorias).reduce((s, c) => s + (c.concluidas || []).length, 0)}</Text><Text style={st.heroLegenda}>atividades feitas</Text></View>
              <View style={st.heroSeparador} />
              <View><Text style={st.heroNumero}>{CATEGORIAS_DESAFIOS.length}</Text><Text style={st.heroLegenda}>categorias</Text></View>
              <View style={st.heroSeparador} />
              <View><Text style={st.heroNumero}>50</Text><Text style={st.heroLegenda}>por categoria</Text></View>
            </View>
          </View>
        </Aparecer>

        <Aparecer atraso={70}>
          <Text style={st.secaoTitulo}>Escolha seu caminho</Text>
          <View style={st.modos}>
            {MODOS.map((item) => (
              <TouchableOpacity key={item.id} style={[st.modoCard, modo === item.id && st.modoSelecionado]}
                onPress={() => item.id === 'personalizado' ? (setModo(item.id), setAtividade(null), setFotoEvidencia(null)) : escolher(item.id)}>
                <View style={[st.modoIcone, modo === item.id && st.modoIconeSelecionado]}><Feather name={item.icone} size={19} color={modo === item.id ? '#FFFFFF' : cores.primaria} /></View>
                <Text style={st.modoTitulo}>{item.titulo}</Text>
                <Text style={st.modoSub}>{item.subtitulo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Aparecer>

        <Aparecer atraso={110}>
          <Text style={st.secaoTitulo}>Sua evolução por categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.categorias}>
            {CATEGORIAS_DESAFIOS.map((nome) => (
              <TouchableOpacity key={nome} onPress={() => { setCategoria(nome); setAtividade(null); setFotoEvidencia(null); if (modo === 'desenvolvimento') escolher('desenvolvimento', null, dados, nome); }}
                style={[st.categoriaPill, categoria === nome && st.categoriaAtiva]}>
                <Text style={[st.categoriaTexto, categoria === nome && st.categoriaTextoAtivo]}>{nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={st.progressoCard}>
            <View style={st.linhaEntre}>
              <View><Text style={st.progressoNome}>{categoria}</Text><Text style={st.suave}>Nível {progresso.nivel} de 50</Text></View>
              <Text style={st.progressoPercentual}>{Math.round(progresso.percentual)}%</Text>
            </View>
            <Text style={st.progressoDetalhe}>{progresso.total >= 50 ? 'Você concluiu as 50 etapas iniciais. Continue praticando livremente.' : `${progresso.total} de 50 etapas concluídas`}</Text>
            <View style={st.trilhaDesafio}>
              <View style={st.trilhaDesafioCabecalho}>
                <Feather name="map" size={18} color={cores.primaria} />
                <Text style={st.trilhaDesafioTitulo}>Sua trilha de evolução</Text>
              </View>
              <View style={st.trilhaDesafioNos}>
                {Array.from({ length: 10 }, (_, indice) => {
                  const inicio = Math.max(0, Math.min(40, Math.floor(progresso.total / 10) * 10 - 4));
                  const nivel = inicio + indice + 1;
                  const concluido = nivel <= progresso.total;
                  const atual = nivel === progresso.total + 1;
                  return (
                    <View key={nivel} style={st.trilhaDesafioEtapa}>
                      <View style={st.trilhaDesafioLinha}>
                        <View style={[st.trilhaDesafioNo, concluido && st.trilhaDesafioNoConcluido, atual && st.trilhaDesafioNoAtual]}>
                          <Feather name={concluido ? 'check' : atual ? 'star' : 'lock'} size={atual ? 15 : 13} color={concluido ? '#FFFFFF' : atual ? cores.primaria : cores.textoSuave} />
                        </View>
                        <Text style={[st.trilhaDesafioNivel, atual && st.trilhaDesafioNivelAtual]}>{nivel === progresso.total + 1 ? `Nível ${nivel} · próximo` : `Nível ${nivel}`}</Text>
                      </View>
                      {indice < 9 && <View style={st.trilhaDesafioConector} />}
                    </View>
                  );
                })}
              </View>
              <Text style={st.suave}>A trilha mostra as etapas próximas ao seu nível atual.</Text>
            </View>
            <Text style={st.rotulo}>Dificuldade dos desafios de desenvolvimento</Text>
            <View style={st.opcoesDificuldade}>
              {['iniciante', 'intermediária', 'avançada'].map((d) => (
                <TouchableOpacity key={d} onPress={() => mudarDificuldade(d)} style={[st.dificuldadePill, progresso.dificuldade === d && st.dificuldadeAtiva]}>
                  <Text style={[st.dificuldadeTexto, progresso.dificuldade === d && st.dificuldadeTextoAtivo]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {modo === 'desenvolvimento' && <Text style={st.suave}>Ao trocar a dificuldade, o desafio exibido será atualizado automaticamente.</Text>}
          </View>
        </Aparecer>

        {modo === 'personalizado' && (
          <View style={st.card}>
            <Text style={st.cardTitulo}>Crie sua atividade</Text>
            <TextInput value={tituloCustom} onChangeText={setTituloCustom} placeholder="O que você quer fazer?" placeholderTextColor={cores.textoSuave} style={st.input} />
            <TextInput value={descricaoCustom} onChangeText={setDescricaoCustom} placeholder="Descreva como pretende praticar (opcional)" placeholderTextColor={cores.textoSuave} style={[st.input, st.inputMultilinha]} multiline />
            <TextInput value={duracaoCustom} onChangeText={setDuracaoCustom} placeholder="Duração estimada (opcional, ex.: 20 minutos)" placeholderTextColor={cores.textoSuave} style={st.input} />
            <TouchableOpacity onPress={criarPersonalizada} style={st.botao}><Text style={st.botaoTexto}>Preparar atividade</Text></TouchableOpacity>
          </View>
        )}

        {atividade && (
          <Aparecer>
            <View style={st.atividadeCard}>
              <View style={st.linhaEntre}><Text style={st.tag}>{atividade.modalidade === 'personalizado' ? 'CRIADO POR VOCÊ' : `${atividade.categoria.toUpperCase()} · ${(atividade.formato || 'desafio').toUpperCase()}`}</Text><Text style={st.suave}>{atividade.dificuldade}</Text></View>
              <Text style={st.atividadeTitulo}>{atividade.titulo}</Text>
              <Text style={st.atividadeDescricao}>{atividade.descricao}</Text>
              <Text style={st.objetivo}>Objetivo: {atividade.objetivo}</Text>
              {!!atividade.duracao && <Text style={st.objetivo}>Duração estimada: {atividade.duracao}</Text>}
              {!aceita ? (
                <View style={st.acoes}>
                  <TouchableOpacity style={st.botao} onPress={() => setAceita(true)}><Text style={st.botaoTexto}>Aceitar atividade</Text></TouchableOpacity>
                  <TouchableOpacity style={st.botaoContorno} onPress={() => registrar('recusada')} disabled={salvando}><Text style={st.botaoContornoTexto}>Recusar</Text></TouchableOpacity>
                  {atividade.modalidade !== 'personalizado' && <TouchableOpacity style={st.botaoTextoLink} onPress={() => escolher(modo)}><Text style={st.linkTexto}>Outra sugestão</Text></TouchableOpacity>}
                </View>
              ) : (
                <View style={st.acoes}>
                  <Text style={st.rotulo}>Como você avalia sua experiência?</Text>
                  <View style={st.opcoesDificuldade}>
                    {['1', '2', '3', '4', '5'].map((n) => <TouchableOpacity key={n} onPress={() => setAutoavaliacao(n)} style={[st.notaPill, autoavaliacao === n && st.dificuldadeAtiva]}><Text style={[st.notaTexto, autoavaliacao === n && st.dificuldadeTextoAtivo]}>{n}</Text></TouchableOpacity>)}
                  </View>
                  <TextInput value={evidencia} onChangeText={setEvidencia} placeholder="Anotação ou evidência (opcional)" placeholderTextColor={cores.textoSuave} style={[st.input, st.inputMultilinha]} multiline />
                  <View style={st.fotoEvidencia}>
                    <Text style={st.rotulo}>Foto da atividade (opcional)</Text>
                    <Text style={st.suave}>Adicione uma imagem para guardar junto com esta etapa.</Text>
                    {fotoEvidencia && (
                      <View style={st.fotoEvidenciaPreview}>
                        <Image source={{ uri: fotoEvidencia.uri }} style={st.fotoEvidenciaImagem} />
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Remover foto da atividade"
                          onPress={() => setFotoEvidencia(null)}
                          disabled={salvando}
                          style={st.removerFoto}
                        >
                          <Feather name="x" size={16} color={cores.texto} />
                        </TouchableOpacity>
                      </View>
                    )}
                    <TouchableOpacity
                      accessibilityRole="button"
                      disabled={salvando}
                      onPress={selecionarFoto}
                      style={st.botaoFoto}
                    >
                      <Feather name="image" size={18} color={cores.primaria} />
                      <Text style={st.botaoFotoTexto}>{fotoEvidencia ? 'Trocar foto' : 'Adicionar foto'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={st.botao} onPress={() => registrar('concluida')} disabled={salvando}><Text style={st.botaoTexto}>{salvando ? 'Salvando...' : 'Concluir atividade'}</Text></TouchableOpacity>
                  <TouchableOpacity style={st.botaoContorno} onPress={() => registrar('abandonada')} disabled={salvando}><Text style={st.botaoContornoTexto}>Desistir sem penalidade</Text></TouchableOpacity>
                </View>
              )}
            </View>
          </Aparecer>
        )}

        {progresso.faltamAvaliacao && (
          <View style={st.avaliacaoCard}>
            <Feather name="clipboard" size={22} color={cores.primaria} />
            <Text style={st.cardTitulo}>Avaliação de etapa disponível</Text>
            <Text style={st.suave}>Você chegou a {Math.floor(progresso.total / 15) * 15} atividades concluídas nesta categoria. Registre o resultado da sua avaliação. A nota informada aqui é declarada pelo usuário, não verificada pelo aplicativo.</Text>
            <TextInput value={notaAvaliacao} onChangeText={setNotaAvaliacao} keyboardType="decimal-pad" placeholder="Nota da avaliação (0 a 100)" placeholderTextColor={cores.textoSuave} style={st.input} />
            <TextInput value={reflexaoAvaliacao} onChangeText={setReflexaoAvaliacao} placeholder="Autoavaliação: o que aprendeu?" placeholderTextColor={cores.textoSuave} style={[st.input, st.inputMultilinha]} multiline />
            <TouchableOpacity style={st.botao} onPress={salvarAvaliacao}><Text style={st.botaoTexto}>Registrar resultado</Text></TouchableOpacity>
            <Text style={st.suave}>Referência de aprovação: {APROVACAO_MINIMA}%. Tentativas ilimitadas. A pontuação objetiva ainda precisa ser integrada a avaliações próprias de cada categoria.</Text>
          </View>
        )}

        <Aparecer atraso={160}>
          <Text style={st.secaoTitulo}>Atividades recentes</Text>
          {historico.length === 0 ? <Text style={st.suave}>Suas atividades concluídas, recusadas e abandonadas aparecerão aqui.</Text> : historico.map((item) => {
            const detalhe = lerEvidencia(item.evidencia);
            return (
              <View key={item.id} style={st.historicoItem}>
                <View style={st.historicoIcone}><Feather name={item.status === 'concluida' ? 'check' : item.status === 'recusada' ? 'x' : 'pause'} size={16} color={item.status === 'concluida' ? cores.sucesso : cores.textoSuave} /></View>
                <View style={st.historicoConteudo}>
                  <Text style={st.historicoTitulo}>{item.titulo}</Text>
                  <Text style={st.suave}>{item.categoria} · {item.status} · {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
                  {!!detalhe.texto && <Text style={st.historicoEvidencia}>{detalhe.texto}</Text>}
                  {!!detalhe.foto && <Image source={{ uri: detalhe.foto }} style={st.historicoFoto} />}
                </View>
              </View>
            );
          })}
          {dados.historico.length > 8 && (
            <TouchableOpacity style={st.botaoTextoLink} onPress={() => setMostrarHistoricoCompleto((v) => !v)}>
              <Text style={st.linkTexto}>{mostrarHistoricoCompleto ? 'Mostrar menos' : `Ver todo o histórico (${dados.historico.length})`}</Text>
            </TouchableOpacity>
          )}
          <Text style={[st.secaoTitulo, { marginTop: 20 }]}>Avaliações registradas</Text>
          {dados.avaliacoes.length === 0 ? <Text style={st.suave}>As avaliações realizadas aparecerão aqui.</Text> : dados.avaliacoes.map((item) => (
            <View key={item.id} style={st.historicoItem}>
              <View style={st.historicoIcone}><Feather name="clipboard" size={16} color={cores.primaria} /></View>
              <View style={{ flex: 1 }}><Text style={st.historicoTitulo}>{item.categoria} · {item.percentual}% (declarado)</Text><Text style={st.suave}>{item.aprovado ? 'Atingiu a referência de 75%' : 'Abaixo da referência de 75%'} · {new Date(item.data).toLocaleDateString('pt-BR')}</Text></View>
            </View>
          ))}
        </Aparecer>
      </View>
    </ScrollView>
  );
}

function makeEstilos(c) {
  return StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: c.fundo, padding: 16, paddingBottom: 40 },
    conteudo: { width: '100%', maxWidth: 620, alignSelf: 'center' },
    carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fundo, gap: 10 },
    hero: { backgroundColor: c.primaria, borderRadius: 24, padding: 22, marginBottom: 24 },
    heroIcone: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    heroTitulo: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', lineHeight: 29 },
    heroTexto: { color: '#EAF1FF', fontSize: 14, lineHeight: 21, marginTop: 7 },
    heroNumeros: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 },
    heroNumero: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
    heroLegenda: { color: '#EAF1FF', fontSize: 10, marginTop: 2 },
    heroSeparador: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
    secaoTitulo: { color: c.texto, fontSize: 17, fontWeight: '800', marginBottom: 12, marginTop: 8 },
    modos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    modoCard: { width: '48%', flexGrow: 1, minHeight: 120, backgroundColor: c.cartao, borderRadius: 16, borderWidth: 1, borderColor: c.borda, padding: 13 },
    modoSelecionado: { borderColor: c.primaria, backgroundColor: c.primariaClara },
    modoIcone: { width: 34, height: 34, borderRadius: 11, backgroundColor: c.primariaClara, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    modoIconeSelecionado: { backgroundColor: c.primaria },
    modoTitulo: { color: c.texto, fontWeight: '800', fontSize: 14 },
    modoSub: { color: c.textoSuave, fontSize: 11, marginTop: 4 },
    categorias: { gap: 8, paddingBottom: 12 },
    categoriaPill: { borderWidth: 1, borderColor: c.borda, backgroundColor: c.cartao, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
    categoriaAtiva: { backgroundColor: c.primaria, borderColor: c.primaria },
    categoriaTexto: { color: c.textoSuave, fontSize: 12, fontWeight: '700' },
    categoriaTextoAtivo: { color: '#FFFFFF' },
    progressoCard: { backgroundColor: c.cartao, borderColor: c.borda, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 18 },
    trilhaDesafio: { backgroundColor: c.trilhaFundo || c.primaria, borderRadius: 18, padding: 14, marginTop: 14, marginBottom: 8 },
    trilhaDesafioCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    trilhaDesafioTitulo: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
    trilhaDesafioNos: { paddingHorizontal: 8, paddingVertical: 4 },
    trilhaDesafioEtapa: { width: '100%', minHeight: 48, alignItems: 'flex-start' },
    trilhaDesafioConector: { width: 3, height: 16, backgroundColor: 'rgba(255,255,255,0.42)', marginLeft: 14, borderRadius: 2 },
    trilhaDesafioLinha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    trilhaDesafioNo: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    trilhaDesafioNoConcluido: { backgroundColor: '#16A34A', borderColor: '#86EFAC' },
    trilhaDesafioNoAtual: { backgroundColor: '#FFFFFF', borderColor: '#FACC15', borderWidth: 3, shadowColor: '#FACC15', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 5, elevation: 3 },
    trilhaDesafioNivel: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700' },
    trilhaDesafioNivelAtual: { color: '#FFFFFF', fontWeight: '900' },
    linhaEntre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    progressoNome: { color: c.texto, fontSize: 17, fontWeight: '800' },
    progressoPercentual: { color: c.primaria, fontSize: 20, fontWeight: '900' },
    barraFundo: { height: 9, backgroundColor: c.superficieAlta, borderRadius: 10, overflow: 'hidden', marginTop: 13 },
    barraPreenchida: { height: '100%', backgroundColor: c.primaria, borderRadius: 10 },
    progressoDetalhe: { color: c.textoSuave, fontSize: 12, marginTop: 8 },
    suave: { color: c.textoSuave, fontSize: 12, lineHeight: 18 },
    rotulo: { color: c.texto, fontSize: 12, fontWeight: '700', marginTop: 13, marginBottom: 7 },
    opcoesDificuldade: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7 },
    dificuldadePill: { borderWidth: 1, borderColor: c.borda, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18 },
    dificuldadeAtiva: { backgroundColor: c.primaria, borderColor: c.primaria },
    dificuldadeTexto: { color: c.textoSuave, fontSize: 11, fontWeight: '700' },
    dificuldadeTextoAtivo: { color: '#FFFFFF' },
    card: { backgroundColor: c.cartao, borderColor: c.borda, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
    cardTitulo: { color: c.texto, fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 10 },
    input: { backgroundColor: c.fundo, color: c.texto, borderWidth: 1, borderColor: c.borda, borderRadius: 12, padding: 12, marginTop: 9, minHeight: 46 },
    inputMultilinha: { minHeight: 76, textAlignVertical: 'top' },
    botao: { backgroundColor: c.primaria, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 12 },
    botaoTexto: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    botaoContorno: { borderWidth: 1, borderColor: c.borda, borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    botaoContornoTexto: { color: c.texto, fontWeight: '700', fontSize: 13 },
    botaoTextoLink: { alignItems: 'center', padding: 10 },
    linkTexto: { color: c.primaria, fontWeight: '700' },
    atividadeCard: { backgroundColor: c.cartao, borderColor: c.primariaBorda, borderWidth: 1.5, borderRadius: 20, padding: 18, marginBottom: 20 },
    tag: { color: c.primaria, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
    atividadeTitulo: { color: c.texto, fontSize: 20, fontWeight: '900', marginTop: 13 },
    atividadeDescricao: { color: c.textoSuave, fontSize: 14, lineHeight: 21, marginTop: 8 },
    objetivo: { color: c.texto, fontSize: 12, lineHeight: 18, marginTop: 12 },
    acoes: { gap: 9, marginTop: 15 },
    notaPill: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: c.borda, alignItems: 'center', justifyContent: 'center' },
    notaTexto: { color: c.texto, fontWeight: '800' },
    avaliacaoCard: { backgroundColor: c.primariaClara, borderColor: c.primariaBorda, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 18 },
    historicoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: c.cartao, borderWidth: 1, borderColor: c.borda, borderRadius: 13, padding: 12, marginBottom: 8 },
    historicoIcone: { width: 32, height: 32, borderRadius: 11, backgroundColor: c.superficieAlta, alignItems: 'center', justifyContent: 'center' },
    historicoTitulo: { color: c.texto, fontWeight: '700', fontSize: 13 },
    historicoConteudo: { flex: 1, gap: 3 },
    historicoEvidencia: { color: c.texto, fontSize: 12, lineHeight: 18, marginTop: 4 },
    historicoFoto: { width: 76, height: 76, borderRadius: 12, backgroundColor: c.superficieAlta, marginTop: 7 },
    fotoEvidencia: { borderTopWidth: 1, borderTopColor: c.borda, marginTop: 12, paddingTop: 4 },
    fotoEvidenciaPreview: { alignSelf: 'flex-start', position: 'relative', marginTop: 10 },
    fotoEvidenciaImagem: { width: 96, height: 96, borderRadius: 14, backgroundColor: c.superficieAlta },
    removerFoto: { position: 'absolute', top: -7, right: -7, width: 27, height: 27, borderRadius: 14, backgroundColor: c.cartao, borderWidth: 1, borderColor: c.borda, alignItems: 'center', justifyContent: 'center' },
    botaoFoto: { minHeight: 46, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.primaria, marginTop: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: c.primariaClara },
    botaoFotoTexto: { color: c.primaria, fontSize: 13, fontWeight: '800' },
  });
}