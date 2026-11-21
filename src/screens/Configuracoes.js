import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Aparecer from '../components/Aparecer';
import Seletor from '../components/Seletor';
import { useTheme } from '../ThemeContext';

function SecaoTitulo({ icone, titulo, cores }) {
  return (
    <View style={[st.secaoTitulo, { borderBottomColor: cores.borda }]}>
      <View style={[st.secaoIconeWrap, { backgroundColor: cores.primariaClara }]}>
        <Feather name={icone} size={16} color={cores.primaria} />
      </View>
      <Text style={[st.secaoTituloTexto, { color: cores.texto }]}>{titulo}</Text>
    </View>
  );
}

function ItemLinha({ icone, titulo, descricao, cores, children, corIcone }) {
  return (
    <View style={[st.itemLinha, { borderBottomColor: cores.borda }]}>
      <View style={[st.itemIconeWrap, { backgroundColor: (corIcone || cores.primaria) + '18' }]}>
        <Feather name={icone} size={16} color={corIcone || cores.primaria} />
      </View>
      <View style={st.itemTextos}>
        <Text style={[st.itemTitulo, { color: cores.texto }]}>{titulo}</Text>
        {!!descricao && <Text style={[st.itemDesc, { color: cores.textoSuave }]}>{descricao}</Text>}
      </View>
      {children}
    </View>
  );
}

export default function Configuracoes() {
  const { cores, modo, setModo } = useTheme();

  return (
    <ScrollView contentContainerStyle={[st.container, { backgroundColor: cores.fundo }]}>

      {/* Aparência */}
      <Aparecer atraso={0}>
        <View style={[st.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
          <SecaoTitulo icone="sun" titulo="Aparência" cores={cores} />
          <ItemLinha
            icone={modo === 'escuro' ? 'moon' : 'sun'}
            titulo="Tema do aplicativo"
            descricao="Alterne entre modo claro e escuro"
            cores={cores}
          >
            <Seletor
              opcoes={[
                { valor: 'claro', rotulo: 'Claro' },
                { valor: 'escuro', rotulo: 'Escuro' },
              ]}
              valor={modo}
              onChange={setModo}
              style={{ minWidth: 140 }}
            />
          </ItemLinha>
        </View>
      </Aparecer>

      {/* Notificações */}
      <Aparecer atraso={80}>
        <View style={[st.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
          <SecaoTitulo icone="bell" titulo="Notificações" cores={cores} />
          <ItemLinha
            icone="bell-off"
            titulo="Lembretes de trilha"
            descricao="Em breve disponível"
            cores={cores}
            corIcone={cores.textoSuave}
          >
            <View style={[st.badge, { backgroundColor: cores.primariaClara }]}>
              <Text style={[st.badgeTexto, { color: cores.primaria }]}>Em breve</Text>
            </View>
          </ItemLinha>
        </View>
      </Aparecer>

      {/* Dados */}
      <Aparecer atraso={160}>
        <View style={[st.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
          <SecaoTitulo icone="database" titulo="Dados" cores={cores} />
          <ItemLinha
            icone="smartphone"
            titulo="Armazenamento local"
            descricao="Habilidades e trilhas ficam salvas neste aparelho"
            cores={cores}
          />
          <ItemLinha
            icone="cloud"
            titulo="Sincronização"
            descricao="Contas sincronizadas com o Firebase"
            cores={cores}
          />
        </View>
      </Aparecer>

    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 12, paddingBottom: 32 },

  cartao: {
    borderRadius: 18, borderWidth: 1,
    marginBottom: 16, overflow: 'hidden',
  },

  secaoTitulo: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 10,
  },
  secaoIconeWrap: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  secaoTituloTexto: { fontSize: 15, fontWeight: '700' },

  itemLinha: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 12,
  },
  itemIconeWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  itemTextos: { flex: 1 },
  itemTitulo: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemDesc: { fontSize: 13, lineHeight: 18 },

  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  badgeTexto: { fontSize: 12, fontWeight: '700' },

});
