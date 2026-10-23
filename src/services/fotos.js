import { LIMITE_FOTOS_POR_TRILHA } from './trilhas';

let contadorArquivos = 0;

function extensaoDaFoto(asset) {
  const nome = asset.fileName || asset.uri.split(/[?#]/)[0].split('/').pop() || '';
  const extensao = nome.match(/\.(jpe?g|png|webp|heic|heif)$/i);
  return extensao ? extensao[0].toLowerCase() : '.jpg';
}

function caminhoSeguro(valor) {
  return String(valor).replace(/[^a-zA-Z0-9_-]/g, '');
}

export function criarFotos({ trilhas, imagePicker, fileSystem, mediaLibrary, obterAgora = () => new Date() }) {
  async function selecionarEAdicionar(email, hobbyId) {
    const hobbies = await trilhas.lerHobbies(email);
    const hobby = hobbies.find((item) => item.id === hobbyId);
    if (!hobby) throw new Error('Esse hobby não foi encontrado.');
    const hoje = trilhas.obterResumo(hobby, obterAgora()).data;
    if (hobby.fotos.some((foto) => foto.data === hoje)) {
      throw new Error('Você já adicionou uma foto para este hobby hoje.');
    }

    const resultado = await imagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (resultado.canceled) return { cancelada: true };
    const asset = resultado.assets?.[0];
    if (!asset || typeof asset.uri !== 'string' || !asset.uri) {
      throw new Error('A galeria não retornou uma imagem válida.');
    }

    if (!fileSystem.documentDirectory) {
      throw new Error('O armazenamento de fotos não está disponível neste dispositivo.');
    }
    const pasta = `${fileSystem.documentDirectory}evolua-fotos/`;
    const infoPasta = await fileSystem.getInfoAsync(pasta);
    if (!infoPasta.exists) await fileSystem.makeDirectoryAsync(pasta, { intermediates: true });

    const nome = `${caminhoSeguro(hobbyId)}-${hoje}-${obterAgora().getTime()}-${contadorArquivos++}${extensaoDaFoto(asset)}`;
    const uriLocal = `${pasta}${nome}`;
    let registrada = false;

    try {
      await fileSystem.copyAsync({ from: asset.uri, to: uriLocal });
      const infoFoto = await fileSystem.getInfoAsync(uriLocal);
      if (!infoFoto.exists) throw new Error('Não foi possível confirmar que a foto foi armazenada.');

      const resultadoRegistro = await trilhas.adicionarFoto(email, hobbyId, uriLocal);
      registrada = true;
      const falhasExclusao = [];
      for (const fotoAntiga of resultadoRegistro.fotosRemovidas) {
        try {
          await fileSystem.deleteAsync(fotoAntiga.uri, { idempotent: true });
        } catch (erro) {
          falhasExclusao.push(erro);
        }
      }
      if (falhasExclusao.length) {
        throw new Error(
          `A foto foi registrada, mas não consegui excluir ${falhasExclusao.length} arquivo(s) antigo(s). Tente novamente mais tarde.`,
        );
      }

      return { cancelada: false, hobby: resultadoRegistro.hobby };
    } catch (erro) {
      if (!registrada) {
        try {
          await fileSystem.deleteAsync(uriLocal, { idempotent: true });
        } catch (erroLimpeza) {
          throw new Error(
            `${erro.message || 'Não foi possível registrar a foto.'} Também não consegui limpar o arquivo temporário (${erroLimpeza.message || 'falha de armazenamento'}).`,
          );
        }
      }
      throw erro;
    }
  }

  async function salvarNaGaleria(email, hobbyId, fotoId) {
    const hobbies = await trilhas.lerHobbies(email);
    const hobby = hobbies.find((item) => item.id === hobbyId);
    if (!hobby) throw new Error('Esse hobby não foi encontrado.');
    const foto = hobby.fotos.find((item) => item.id === fotoId);
    if (!foto) throw new Error('Essa foto não está mais entre as fotos recentes.');
    if (foto.galeria) return { jaSalva: true, foto };

    let permissao = await mediaLibrary.getPermissionsAsync(true, ['photo']);
    if (!permissao.granted) permissao = await mediaLibrary.requestPermissionsAsync(true, ['photo']);
    if (!permissao.granted) {
      throw new Error(permissao.canAskAgain === false
        ? 'A permissão para salvar na galeria está bloqueada. Ative o acesso às fotos nas configurações do aparelho.'
        : 'Permita que o Evolua salve fotos na galeria do aparelho para continuar.');
    }

    const asset = await mediaLibrary.createAssetAsync(foto.uri);
    try {
      const fotoAtualizada = await trilhas.marcarFotoSalvaNaGaleria(email, hobbyId, fotoId, asset);
      return { jaSalva: false, foto: fotoAtualizada };
    } catch {
      throw new Error(
        'A foto foi copiada para a galeria, mas não foi possível atualizar sua referência no histórico local.',
      );
    }
  }

  return { selecionarEAdicionar, salvarNaGaleria, limitePorTrilha: LIMITE_FOTOS_POR_TRILHA };
}
