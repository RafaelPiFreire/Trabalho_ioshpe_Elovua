// Liga a lógica de contas ao armazenamento real do aparelho (AsyncStorage).
// Tudo fica salvo apenas neste aparelho/navegador — não há servidor nem Firebase.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { criarContas } from './contas';
import { criarFotos } from './fotos';
import { criarTrilhas } from './trilhas';

export const contas = criarContas(AsyncStorage);
export const trilhas = criarTrilhas(AsyncStorage);
export const fotos = criarFotos({
  trilhas,
  fileSystem: FileSystem,
  imagePicker: ImagePicker,
  mediaLibrary: MediaLibrary,
});
