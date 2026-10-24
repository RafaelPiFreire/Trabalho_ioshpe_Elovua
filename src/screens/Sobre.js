import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { cores } from '../theme';

export default function Sobre() {
  return (
    <ScrollView contentContainerStyle={estilos.container}>
      <Text style={estilos.titulo}>Sobre o Evolua</Text>
      <Text style={estilos.texto}>Desenvolvido por: Rafael Piffer e Vinicius Alexandre</Text>
      <Text style={estilos.texto}>Turma: 2 DS</Text>
      <Text style={estilos.texto}>Disciplina: PAM</Text>
      <Text style={estilos.texto}>Professor: Márcio Ferraz</Text>
      <Text style={estilos.texto}>
        O Evolua ajuda você a acompanhar hobbies, registrar atividades e observar seu progresso com gentileza.
      </Text>
      <Text style={estilos.texto}>
        Cada habilidades tem sua própria trilha, seus dias planejados e seu foguinho. Descansos fazem parte do caminho.
      </Text>
      <Text style={estilos.texto}>
        Hobbies, atividades e fotos recentes ficam salvos localmente neste aparelho. Você pode escolher salvar uma cópia de uma foto na galeria.
      </Text>
      <Text style={estilos.versao}>Versão 2.0.0</Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: cores.primaria, marginBottom: 25, textAlign: 'center' },
  texto: { fontSize: 17, textAlign: 'center', lineHeight: 26, marginBottom: 15, color: cores.texto },
  versao: { marginTop: 10, color: '#777' },
});
