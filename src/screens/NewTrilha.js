import React, { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { trilhas } from '../services/armazenamento';
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

export default function NewTrilha({ usuario, navigation }) {
  const [nome, setNome] = useState('');
  const [dias, setDias] = useState([]);
  const [salvando, setSalvando] = useState(false);

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

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View style={styles.iconeCabecalho}>
            <Feather name="map" size={22} color={cores.primaria} />
          </View>
          <Text style={styles.titulo}>Criar uma nova trilha</Text>
          <Text style={styles.textoSuave}>
            Escolha uma habilidade para acompanhar e os dias em que pretende praticar.
          </Text>
        </View>

        <View style={styles.cartao}>
          <Text style={styles.rotulo}>Nome da habilidade</Text>
          <TextInput
            accessibilityLabel="Nome da habilidade"
            style={styles.input}
            placeholder="Ex.: desenho, leitura, música"
            placeholderTextColor="#94A3B8"
            value={nome}
            onChangeText={setNome}
            maxLength={50}
            editable={!salvando}
            returnKeyType="done"
            onSubmitEditing={criarNovaTrilha}
          />

          <Text style={styles.rotuloDias}>Quais dias você quer praticar?</Text>
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
            Você pode mudar os dias depois. O histórico da trilha continuará guardado.
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={salvando}
            style={[styles.botaoPrimario, salvando && styles.botaoDesativado]}
            onPress={criarNovaTrilha}
          >
            {salvando
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.botaoPrimarioTexto}>Criar trilha</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={salvando}
            style={styles.botaoSecundario}
            onPress={() => navigation.navigate('Trilha')}
          >
            <Text style={styles.botaoSecundarioTexto}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: cores.fundo, padding: 20 },
  conteudo: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingBottom: 30 },
  cabecalho: { alignItems: 'center', paddingTop: 14, paddingBottom: 22 },
  iconeCabecalho: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#E5EDFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  titulo: { color: cores.texto, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  textoSuave: { color: cores.textoSuave, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  cartao: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#E8EDF5' },
  rotulo: { color: cores.texto, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 11, paddingHorizontal: 13, color: cores.texto, fontSize: 15 },
  rotuloDias: { color: cores.texto, fontSize: 14, fontWeight: '700', marginTop: 22 },
  diasRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 12, marginBottom: 8 },
  diaPill: { flex: 1, minWidth: 34, aspectRatio: 1, maxHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  diaPillAtivo: { backgroundColor: '#EAF0FF', borderColor: cores.primaria },
  diaTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: '700' },
  diaTextoAtivo: { color: cores.primaria },
  dica: { color: cores.textoSuave, fontSize: 12, lineHeight: 18, marginTop: 8 },
  botaoPrimario: { minHeight: 48, borderRadius: 12, backgroundColor: cores.primaria, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  botaoPrimarioTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  botaoDesativado: { opacity: 0.65 },
  botaoSecundario: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingHorizontal: 14 },
  botaoSecundarioTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', minHeight: 48, borderRadius: 12, backgroundColor: cores.alerta, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
