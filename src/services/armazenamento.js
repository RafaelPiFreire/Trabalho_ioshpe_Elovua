// Persistência do app no Firebase Realtime Database.
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../../firebase';
import { CHAVE_SESSAO, CHAVE_USUARIOS, criarContas } from './contas';
import { criarTrilhas } from './trilhas';
import { criarFotos } from './fotos';
import { criarDesafios } from './desafios';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

function normalizarLista(valor) {
  if (Array.isArray(valor)) return valor;
  if (valor && typeof valor === 'object') return Object.values(valor);
  return [];
}

const armazenamentoFirebase = {
  async getItem(chave) {
    if (chave === CHAVE_SESSAO) {
      return null;
    }

    try {
      const valor = await get(ref(db, chave));
      const dado = valor.exists() ? valor.val() : null;

      if (typeof dado === 'string') {
        try {
          return JSON.parse(dado);
        } catch (erro) {
          return dado;
        }
      }

      if (chave === CHAVE_USUARIOS) {
        return normalizarLista(dado);
      }

      return dado;
    } catch (erro) {
      console.error('Erro ao ler do Firebase:', chave, erro);
      throw erro;
    }
  },
  async setItem(chave, valor) {
    if (chave === CHAVE_SESSAO) {
      return;
    }

    try {
      const dado = typeof valor === 'string' ? JSON.parse(valor) : valor;
      const final = chave === CHAVE_USUARIOS ? normalizarLista(dado) : dado;
      await set(ref(db, chave), final);
    } catch (erro) {
      console.error('Erro ao salvar no Firebase:', chave, erro);
      throw erro;
    }
  },
  async removeItem(chave) {
    if (chave === CHAVE_SESSAO) {
      return;
    }

    try {
      await remove(ref(db, chave));
    } catch (erro) {
      console.error('Erro ao remover do Firebase:', chave, erro);
      throw erro;
    }
  },
};

export const contas = criarContas(armazenamentoFirebase);
export const trilhas = criarTrilhas(AsyncStorage);
export const desafios = criarDesafios(AsyncStorage);
export const fotos = criarFotos({
  trilhas,
  fileSystem: FileSystem,
  imagePicker: ImagePicker,
  mediaLibrary: MediaLibrary,
});
