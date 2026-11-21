import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Aparecer from '../components/Aparecer';
import { useTheme } from '../ThemeContext';

function InfoLinha({ icone, rotulo, valor, cores }) {
  return (
    <View style={[st.infoLinha, { borderBottomColor: cores.borda }]}>
      <View style={[st.infoIconeWrap, { backgroundColor: cores.primariaClara }]}>
        <Feather name={icone} size={16} color={cores.primaria} />
      </View>
      <View style={st.infoTextos}>
        <Text style={[st.infoRotulo, { color: cores.textoSuave }]}>{rotulo}</Text>
        <Text style={[st.infoValor, { color: cores.texto }]}>{valor || '—'}</Text>
      </View>
    </View>
  );
}

export default function Perfil({ usuario, sair }) {
  const { cores } = useTheme();

  const iniciais = (usuario?.nome || 'U')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <ScrollView contentContainerStyle={[st.container, { backgroundColor: cores.fundo }]}>

      {/* Banner + Avatar */}
      <Aparecer>
        <View style={[st.banner, { backgroundColor: cores.primaria }]}>
          <View style={[st.avatarCirculo, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[st.avatarIniciais, { color: cores.primaria }]}>{iniciais}</Text>
          </View>
        </View>
      </Aparecer>

      {/* Nome e email */}
      <Aparecer atraso={80}>
        <View style={st.identidade}>
          <Text style={[st.nome, { color: cores.texto }]}>{usuario?.nome || 'Usuário'}</Text>
          <View style={[st.emailBadge, { backgroundColor: cores.primariaClara }]}>
            <Feather name="mail" size={13} color={cores.primaria} style={{ marginRight: 5 }} />
            <Text style={[st.emailTexto, { color: cores.primaria }]}>{usuario?.email || ''}</Text>
          </View>
        </View>
      </Aparecer>

      {/* Card informações */}
      <Aparecer atraso={160}>
        <View style={[st.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
          <View style={st.cartaoTitulo}>
            <Feather name="user" size={16} color={cores.primaria} />
            <Text style={[st.cartaoTituloTexto, { color: cores.texto }]}>Informações da conta</Text>
          </View>
          <InfoLinha icone="user" rotulo="Nome completo" valor={usuario?.nome} cores={cores} />
          <InfoLinha icone="mail" rotulo="E-mail" valor={usuario?.email} cores={cores} />
        </View>
      </Aparecer>

      {/* Card ações */}
      <Aparecer atraso={240}>
        <View style={[st.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
          <View style={st.cartaoTitulo}>
            <Feather name="settings" size={16} color={cores.primaria} />
            <Text style={[st.cartaoTituloTexto, { color: cores.texto }]}>Conta</Text>
          </View>

          <TouchableOpacity
            style={[st.acaoLinha, { borderBottomColor: cores.borda }]}
            onPress={sair}
            activeOpacity={0.7}
          >
            <View style={[st.acaoIconeWrap, { backgroundColor: cores.erro + '1F' }]}>
              <Feather name="log-out" size={16} color={cores.erro} />
            </View>
            <Text style={[st.acaoTexto, { color: cores.erro }]}>Sair da conta</Text>
            <Feather name="chevron-right" size={16} color={cores.erro} />
          </TouchableOpacity>
        </View>
      </Aparecer>

    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 32 },

  banner: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  avatarCirculo: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: -44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  avatarIniciais: { fontSize: 30, fontWeight: '800' },

  identidade: { alignItems: 'center', marginTop: 54, marginBottom: 20, paddingHorizontal: 24 },
  nome: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emailBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  emailTexto: { fontSize: 14, fontWeight: '600' },

  cartao: {
    marginHorizontal: 20, marginBottom: 16,
    borderRadius: 18, borderWidth: 1,
    overflow: 'hidden',
  },
  cartaoTitulo: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 8,
  },
  cartaoTituloTexto: { fontSize: 15, fontWeight: '700' },

  infoLinha: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoIconeWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  infoTextos: { flex: 1 },
  infoRotulo: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  infoValor: { fontSize: 15, fontWeight: '500' },

  acaoLinha: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0,
  },
  acaoIconeWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  acaoTexto: { flex: 1, fontSize: 15, fontWeight: '600' },
});
