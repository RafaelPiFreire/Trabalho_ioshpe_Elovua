import { normalizarEmail } from '../utils/validacao';

export const CHAVE_TRILHAS = '@evolua/trilhas:';
export const LIMITE_FOTOS_POR_TRILHA = 10;

const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6];
let contadorIds = 0;

function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function converterDataLocal(chave) {
  const partes = chave.split('-').map(Number);
  return new Date(partes[0], partes[1] - 1, partes[2], 12);
}

function deslocarData(chave, quantidade) {
  const data = converterDataLocal(chave);
  data.setDate(data.getDate() + quantidade);
  return formatarDataLocal(data);
}

function validarDias(dias) {
  return Array.isArray(dias)
    && dias.length > 0
    && dias.every((dia) => DIAS_SEMANA.includes(dia))
    && new Set(dias).size === dias.length;
}

function datasConcluidas(hobby) {
  return new Set(hobby.atividades.map((atividade) => atividade.data));
}

function configuracaoDaData(hobby, data) {
  let configuracao = null;
  for (const revisao of hobby.configuracoes) {
    if (revisao.desde <= data && (!configuracao || revisao.desde >= configuracao.desde)) {
      configuracao = revisao;
    }
  }
  return configuracao;
}

function diaPlanejado(hobby, data) {
  const configuracao = configuracaoDaData(hobby, data);
  return Boolean(configuracao && configuracao.dias.includes(converterDataLocal(data).getDay()));
}

function calcularSequenciaAtual(hobby, hoje) {
  const concluidas = datasConcluidas(hobby);
  let sequencia = 0;
  let data = hoje;

  while (data >= hobby.criadoEm) {
    if (diaPlanejado(hobby, data)) {
      if (data === hoje && !concluidas.has(data)) {
        data = deslocarData(data, -1);
        continue;
      }
      if (!concluidas.has(data)) break;
      sequencia += 1;
    }
    data = deslocarData(data, -1);
  }

  return sequencia;
}

function calcularRecorde(hobby, hoje) {
  const concluidas = datasConcluidas(hobby);
  let sequencia = 0;
  let recorde = hobby.recorde || 0;

  for (let data = hobby.criadoEm; data <= hoje; data = deslocarData(data, 1)) {
    if (!diaPlanejado(hobby, data)) continue;
    if (concluidas.has(data)) {
      sequencia += 1;
      recorde = Math.max(recorde, sequencia);
    } else if (data < hoje) {
      sequencia = 0;
    }
  }
  return recorde;
}

function gerarId(data) {
  return `${data.getTime()}-${contadorIds++}-${Math.floor(Math.random() * 1e6)}`;
}

export function criarTrilhas(armazenamento, obterAgora = () => new Date()) {
  function chaveUsuario(email) {
    const normalizado = normalizarEmail(email);
    if (!normalizado) throw new Error('Não foi possível identificar o usuário atual.');
    return CHAVE_TRILHAS + normalizado;
  }

  async function lerHobbies(email) {
    const bruto = await armazenamento.getItem(chaveUsuario(email));
    if (!bruto) return [];
    const hobbies = JSON.parse(bruto);
    if (!Array.isArray(hobbies)) throw new Error('Os dados das trilhas estão inválidos.');
    hobbies.forEach((hobby) => {
      if (!Array.isArray(hobby.fotos)) hobby.fotos = [];
      if (!Array.isArray(hobby.fotosPreservadas)) hobby.fotosPreservadas = [];
    });
    return hobbies;
  }

  async function salvarHobbies(email, hobbies) {
    await armazenamento.setItem(chaveUsuario(email), JSON.stringify(hobbies));
  }

  function criarHobby(email, nome, dias) {
    return alterarHobbies(email, (hobbies, hoje, agora) => {
      const nomeLimpo = String(nome || '').trim();
      if (!nomeLimpo) throw new Error('Digite um nome para o hobby.');
      if (!validarDias(dias)) throw new Error('Escolha pelo menos um dia de prática.');
      if (hobbies.some((hobby) => hobby.nome.toLocaleLowerCase() === nomeLimpo.toLocaleLowerCase())) {
        throw new Error('Você já tem um hobby com esse nome.');
      }

      const hobby = {
        id: gerarId(agora),
        nome: nomeLimpo,
        criadoEm: hoje,
        configuracoes: [{ desde: hoje, registradoEm: agora.toISOString(), dias: [...dias].sort() }],
        atividades: [],
        fotos: [],
        fotosPreservadas: [],
        recorde: 0,
      };
      hobbies.push(hobby);
      return hobby;
    });
  }

  function atualizarDias(email, id, dias) {
    return alterarHobbies(email, (hobbies, hoje, agora) => {
      if (!validarDias(dias)) throw new Error('Mantenha pelo menos um dia de prática selecionado.');
      const hobby = hobbies.find((item) => item.id === id);
      if (!hobby) throw new Error('Esse hobby não foi encontrado.');

      const diasOrdenados = [...dias].sort();
      const atual = configuracaoDaData(hobby, hoje);
      if (atual && atual.dias.length === diasOrdenados.length
        && atual.dias.every((dia, indice) => dia === diasOrdenados[indice])) return hobby;

      hobby.configuracoes.push({ desde: hoje, registradoEm: agora.toISOString(), dias: diasOrdenados });
      hobby.recorde = calcularRecorde(hobby, hoje);
      return hobby;
    });
  }

  function registrarAtividade(email, id) {
    return alterarHobbies(email, (hobbies, hoje, agora) => {
      const hobby = hobbies.find((item) => item.id === id);
      if (!hobby) throw new Error('Esse hobby não foi encontrado.');

      hobby.atividades.push({ data: hoje, registradoEm: agora.toISOString() });
      hobby.recorde = calcularRecorde(hobby, hoje);
      return hobby;
    });
  }

  function adicionarFoto(email, id, uri) {
    return alterarHobbies(email, (hobbies, hoje, agora) => {
      if (typeof uri !== 'string' || !uri) throw new Error('A foto selecionada não tem um arquivo válido.');
      const hobby = hobbies.find((item) => item.id === id);
      if (!hobby) throw new Error('Esse hobby não foi encontrado.');
      const atividadeDoDia = hobby.atividades.find((atividade) => atividade.data === hoje);
      if (hobby.fotos.some((foto) => foto.data === hoje) || atividadeDoDia?.fotoRegistrada) {
        throw new Error('Você já adicionou uma foto para este hobby hoje.');
      }

      const foto = {
        id: gerarId(agora),
        data: hoje,
        registradoEm: agora.toISOString(),
        uri,
        galeria: null,
      };
      hobby.fotos.push(foto);
      hobby.fotos.sort((a, b) => a.data.localeCompare(b.data));
      const removidas = hobby.fotos.splice(
        0,
        Math.max(0, hobby.fotos.length - LIMITE_FOTOS_POR_TRILHA),
      );

      if (atividadeDoDia) {
        atividadeDoDia.fotoRegistrada = true;
      } else {
        hobby.atividades.push({ data: hoje, registradoEm: agora.toISOString(), fotoRegistrada: true });
      }
      hobby.recorde = calcularRecorde(hobby, hoje);
      return { hobby, fotosRemovidas: removidas };
    });
  }

  function marcarFotoSalvaNaGaleria(email, hobbyId, fotoId, asset) {
    return alterarHobbies(email, (hobbies, hoje, agora) => {
      if (!asset || typeof asset.id !== 'string' || !asset.id) {
        throw new Error('A galeria não retornou uma identificação para a foto salva.');
      }
      const hobby = hobbies.find((item) => item.id === hobbyId);
      if (!hobby) throw new Error('Esse hobby não foi encontrado.');
      const foto = hobby.fotos.find((item) => item.id === fotoId);
      if (!foto) throw new Error('Essa foto não está mais entre as fotos recentes.');
      if (foto.galeria) return foto;

      foto.galeria = {
        assetId: asset.id,
        uri: asset.uri || null,
        nomeArquivo: asset.filename || null,
        salvaEm: agora.toISOString(),
      };
      hobby.fotosPreservadas.push({
        fotoId: foto.id,
        data: foto.data,
        assetId: foto.galeria.assetId,
        uri: foto.galeria.uri,
        nomeArquivo: foto.galeria.nomeArquivo,
        salvaEm: foto.galeria.salvaEm,
      });
      return foto;
    });
  }

  async function alterarHobbies(email, alterar) {
    const agora = obterAgora();
    const hoje = formatarDataLocal(agora);
    const hobbies = await lerHobbies(email);
    const resultado = alterar(hobbies, hoje, agora);
    await salvarHobbies(email, hobbies);
    return resultado;
  }

  function obterResumo(hobby, data = obterAgora()) {
    const hoje = formatarDataLocal(data);
    const config = configuracaoDaData(hobby, hoje);
    const dia = converterDataLocal(hoje).getDay();
    return {
      data: hoje,
      sequenciaAtual: calcularSequenciaAtual(hobby, hoje),
      recorde: hobby.recorde || calcularRecorde(hobby, hoje),
      praticaPlanejadaHoje: Boolean(config && config.dias.includes(dia)),
      quantidadeHoje: hobby.atividades.filter((atividade) => atividade.data === hoje).length,
      diasPlanejados: config ? config.dias : [],
    };
  }

  return {
    lerHobbies,
    criarHobby,
    atualizarDias,
    registrarAtividade,
    adicionarFoto,
    marcarFotoSalvaNaGaleria,
    obterResumo,
  };
}
