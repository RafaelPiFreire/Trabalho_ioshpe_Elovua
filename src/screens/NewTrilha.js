import React, { useState } from 'react';
import {
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { trilhas } from '../services/armazenamento';
import { avisar } from '../utils/alerta';
import { useTheme } from '../ThemeContext';
import BotaoAnimado from '../components/BotaoAnimado';
import Aparecer from '../components/Aparecer';

const DIAS = [
  { valor: 1, curto: 'Seg', nome: 'Segunda-feira' },
  { valor: 2, curto: 'Ter', nome: 'Terça-feira' },
  { valor: 3, curto: 'Qua', nome: 'Quarta-feira' },
  { valor: 4, curto: 'Qui', nome: 'Quinta-feira' },
  { valor: 5, curto: 'Sex', nome: 'Sexta-feira' },
  { valor: 6, curto: 'Sáb', nome: 'Sábado' },
  { valor: 0, curto: 'Dom', nome: 'Domingo' },
];

export default function NewTrilha({ usuario, navigation }) {
  const { cores } = useTheme();
  const styles = makeEstilos(cores);
  const [nome, setNome] = useState('');
  const [dias, setDias] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [focoNome, setFocoNome] = useState(false);

  function alternarDia(dia) {
    setDias((atuais) => (atuais.includes(dia)
      ? atuais.filter((item) => item !== dia)
      : [...atuais, dia]));
  }

  async function criarNovaTrilha() {
    if (salvando) return;
    setSalvando(true);
    try {
      const novaTrilha = await trilhas.criarHobby(usuario.email, nome, dias);
      navigation.navigate('Trilha', { hobbyId: novaTrilha.id });
    } catch (erro) {
      avisar('Não foi possível criar', erro?.message || 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const quantidadeDias = dias.length;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.conteudo}>

        <Aparecer>
          <View style={styles.cabecalho}>
            <View style={styles.iconeCabecalho}>
              <Feather name="map" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.titulo}>Nova trilha</Text>
            <Text style={styles.textoSuave}>
              Escolha uma habilidade para acompanhar e os dias em que pretende praticar.
            </Text>
          </View>
        </Aparecer>

        <Aparecer atraso={80}>
          <View style={styles.cartao}>
            <View style={styles.passoTopo}>
              <View style={styles.passoNumero}><Text style={styles.passoNumeroTexto}>1</Text></View>
              <Text style={styles.passoTitulo}>Habilidade</Text>
              <Text style={styles.contador}>{nome.length}/50</Text>
            </View>

            <View style={[styles.campoWrap, focoNome && styles.campoWrapAtivo]}>
              <Feather
                name="edit-3"
                size={18}
                color={focoNome ? cores.primaria : cores.textoSuave}
                style={{ marginRight: 10 }}
              />
              <TextInput
                accessibilityLabel="Nome da habilidade"
                style={styles.input}
                placeholder="Ex.: desenho, leitura, música"
                placeholderTextColor={cores.textoSuave}
                value={nome}
                onChangeText={setNome}
                onFocus={() => setFocoNome(true)}
                onBlur={() => setFocoNome(false)}
                maxLength={50}
                editable={!salvando}
                returnKeyType="done"
                onSubmitEditing={criarNovaTrilha}
              />
            </View>
          </View>
        </Aparecer>

        <Aparecer atraso={160}>
          <View style={styles.cartao}>
            <View style={styles.passoTopo}>
              <View style={styles.passoNumero}><Text style={styles.passoNumeroTexto}>2</Text></View>
              <Text style={styles.passoTitulo}>Dias de prática</Text>
              <Text style={styles.contador}>
                {quantidadeDias === 0 ? 'Nenhum' : `${quantidadeDias} ${quantidadeDias === 1 ? 'dia' : 'dias'}`}
              </Text>
            </View>

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
                    onPress={() => alternarDia(dia.valor)}
                    style={[styles.diaPill, ativo && styles.diaPillAtivo]}
                  >
                    <Text style={[styles.diaTexto, ativo && styles.diaTextoAtivo]}>{dia.curto}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.dica}>
              Dias sem marcação são descanso planejado. Você pode mudar os dias depois; o histórico continua guardado.
            </Text>
          </View>
        </Aparecer>

        <Aparecer atraso={240}>
          <View style={styles.acoes}>
            <BotaoAnimado
              titulo="Criar trilha"
              icone="check"
              onPress={criarNovaTrilha}
              carregando={salvando}
              desativado={salvando}
              style={styles.botaoCriar}
            />
            <BotaoAnimado
              titulo="Cancelar"
              variante="texto"
              onPress={() => navigation.navigate('Trilha')}
              desativado={salvando}
            />
          </View>
        </Aparecer>

      </View>
    </ScrollView>
  );
}

function makeEstilos(cores) {
  return StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: cores.fundo, padding: 16, paddingBottom: 32 },
    conteudo: { width: '100%', maxWidth: 560, alignSelf: 'center' },

    cabecalho: { alignItems: 'center', paddingTop: 12, paddingBottom: 20, paddingHorizontal: 12 },
    iconeCabecalho: {
      width: 56, height: 56, borderRadius: 20, backgroundColor: cores.primaria,
      alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      shadowColor: cores.primaria, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
    },
    titulo: { color: cores.texto, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
    textoSuave: { color: cores.textoSuave, fontSize: 14, lineHeight: 21, textAlign: 'center' },

    cartao: {
      backgroundColor: cores.cartao, borderRadius: 18, padding: 18, marginBottom: 14,
      borderWidth: 1, borderColor: cores.borda,
    },
    passoTopo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    passoNumero: {
      width: 26, height: 26, borderRadius: 13, backgroundColor: cores.primariaClara,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: cores.primariaBorda,
    },
    passoNumeroTexto: { color: cores.primaria, fontSize: 13, fontWeight: '800' },
    passoTitulo: { flex: 1, color: cores.texto, fontSize: 15, fontWeight: '700' },
    contador: { color: cores.textoSuave, fontSize: 12, fontWeight: '600' },

    campoWrap: {
      flexDirection: 'row', alignItems: 'center', minHeight: 52,
      borderWidth: 1.5, borderColor: cores.borda, borderRadius: 14,
      paddingHorizontal: 14, backgroundColor: cores.fundo,
    },
    campoWrapAtivo: { borderColor: cores.primaria, backgroundColor: cores.cartao },
    input: {
      flex: 1, color: cores.texto, fontSize: 15, minHeight: 50,
      ...Platform.select({ web: { outlineStyle: 'none' } }),
    },

    diasRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 6 },
    diaPill: {
      flex: 1, minWidth: 34, aspectRatio: 1, maxHeight: 46, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: cores.fundo, borderWidth: 1.5, borderColor: cores.borda,
    },
    diaPillAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
    diaTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: '800' },
    diaTextoAtivo: { color: '#FFFFFF' },
    dica: { color: cores.textoSuave, fontSize: 12, lineHeight: 18, marginTop: 10 },

    acoes: { marginTop: 6, gap: 6 },
    botaoCriar: { height: 52, borderRadius: 14, marginTop: 4 },
  });
}
