import { normalizarEmail } from '../utils/validacao';

export const CHAVE_DESAFIOS = '@evolua/desafios:';
export const ATIVIDADES_POR_CATEGORIA = 50;
export const INTERVALO_AVALIACAO = 15;
export const APROVACAO_MINIMA = 75;

const TOPICOS = {
  "Culinária": [
    "higiene e organização",
    "utensílios e segurança",
    "ingredientes e medidas",
    "cortes e preparo",
    "temperos e sabores",
    "calor e cocção",
    "ovos e preparos simples",
    "massas e acompanhamentos",
    "planejamento de refeições",
    "criação de receitas"
  ],
  "Leitura": [
    "escolha de textos",
    "leitura ativa",
    "vocabulário pelo contexto",
    "ideia principal",
    "inferências",
    "personagens e narrador",
    "estrutura textual",
    "argumentação",
    "comparação de fontes",
    "interpretação crítica"
  ],
  "Pintura": [
    "materiais e suportes",
    "mistura de cores",
    "teoria das cores",
    "luz e sombra",
    "pinceladas",
    "composição",
    "texturas",
    "profundidade",
    "estudo de referência",
    "obra autoral"
  ],
  "Desenho": [
    "observação",
    "formas básicas",
    "proporção",
    "linhas e contornos",
    "volume",
    "luz e sombra",
    "perspectiva",
    "texturas",
    "anatomia simplificada",
    "composição autoral"
  ],
  "Música": [
    "ritmo e pulso",
    "notas e alturas",
    "melodia",
    "coordenação",
    "dinâmica",
    "estrutura musical",
    "escuta ativa",
    "harmonia básica",
    "interpretação",
    "criação musical"
  ],
  "Fotografia": [
    "enquadramento",
    "luz natural",
    "foco",
    "exposição",
    "composição",
    "perspectiva",
    "cores",
    "retrato",
    "fotografia de objetos",
    "narrativa visual"
  ],
  "Programação": [
    "lógica sequencial",
    "variáveis",
    "tipos de dados",
    "condicionais",
    "repetição",
    "funções",
    "listas e coleções",
    "depuração",
    "organização de código",
    "pequeno projeto"
  ],
  "Jardinagem": [
    "observação das plantas",
    "solo e substrato",
    "vasos e drenagem",
    "rega",
    "luz e ambiente",
    "sementes",
    "mudas",
    "nutrição vegetal",
    "poda e manutenção",
    "planejamento do cultivo"
  ],
  "Trabalhos manuais": [
    "planejamento",
    "materiais e ferramentas",
    "medição",
    "corte e preparação",
    "união de peças",
    "acabamento",
    "cores e decoração",
    "reaproveitamento",
    "projeto funcional",
    "criação autoral"
  ],
  "Idiomas": [
    "sons e pronúncia",
    "vocabulário cotidiano",
    "frases simples",
    "verbos frequentes",
    "perguntas e respostas",
    "escuta",
    "leitura curta",
    "tempos verbais",
    "conversação",
    "produção de texto"
  ],
  "Raciocínio lógico": [
    "padrões",
    "classificação",
    "sequências",
    "dedução",
    "proporções",
    "problemas em etapas",
    "tabelas e dados",
    "estratégias",
    "argumentação lógica",
    "desafio integrado"
  ],
  "Mecânica": [
    "ferramentas e segurança",
    "componentes básicos",
    "sistemas e funções",
    "manutenção preventiva",
    "leitura de manuais",
    "diagnóstico inicial",
    "medições",
    "materiais",
    "planejamento de reparos",
    "análise de sistemas"
  ],
  "Escrita": [
    "ideias e repertório",
    "planejamento",
    "estrutura de parágrafos",
    "clareza",
    "coesão",
    "descrição",
    "narração",
    "argumentação",
    "revisão",
    "texto autoral"
  ]
};

export const DESAFIOS_POR_CATEGORIA = {
  'Culinária': 18,
  'Leitura': 12,
  'Pintura': 20,
  'Desenho': 20,
  'Música': 20,
  'Fotografia': 18,
  'Programação': 15,
  'Jardinagem': 18,
  'Trabalhos manuais': 25,
  'Idiomas': 12,
  'Raciocínio lógico': 20,
  'Mecânica': 22,
  'Escrita': 12,
};

const FORMATOS = [
  [
    "Explore",
    "Observe e registre o que já sabe sobre {topic}."
  ],
  [
    "Pratique",
    "Faça uma atividade curta para aplicar {topic} em uma situação simples."
  ],
  [
    "Investigue",
    "Pesquise ou compare dois exemplos relacionados a {topic} e anote as diferenças."
  ],
  [
    "Aprofunde",
    "Escolha um aspecto de {topic} e tente explicá-lo com suas próprias palavras."
  ],
  [
    "Crie",
    "Produza um pequeno resultado que demonstre sua compreensão de {topic}."
  ]
];

const MODALIDADES = ['surpresa', 'desenvolvimento', 'descoberta'];

// Orientações específicas por categoria.
const GUIAS_CATEGORIA = {
  'Culinária': {
    materiais: 'Caderno ou bloco de notas, receita de referência e ingredientes já disponíveis.',
    pratica: 'Analise uma receita simples e organize os ingredientes e as quantidades antes do preparo.',
    criacao: 'Monte uma ficha de receita simples, com ingredientes, quantidades e ordem de preparo.',
    resultado: 'Uma receita organizada ou um registro claro do que foi observado e aprendido.',
    dica: 'Confira a higiene e a validade dos alimentos. Peça a um adulto para acompanhar qualquer uso de faca, fogão, forno ou utensílio quente.'
  },
  'Leitura': {
    materiais: 'Um livro, crônica, reportagem ou outro texto adequado ao seu interesse; papel ou bloco de notas.',
    pratica: 'Leia um trecho curto, destaque a ideia principal e registre três informações importantes.',
    criacao: 'Produza um resumo ou uma interpretação própria, citando elementos do texto que sustentem suas ideias.',
    resultado: 'Um registro que demonstre compreensão, interpretação e capacidade de identificar informações do texto.',
    dica: 'Se encontrar uma palavra desconhecida, tente entender pelo contexto antes de consultar o significado.'
  },
  'Pintura': {
    materiais: 'Papel, lápis, tintas ou ferramenta digital de pintura; pincel ou recurso equivalente, se necessário.',
    pratica: 'Faça um estudo pequeno usando o conceito indicado e observe como as escolhas alteram o resultado visual.',
    criacao: 'Crie uma composição curta que demonstre o uso consciente do conceito estudado.',
    resultado: 'Um estudo visual ou uma pintura com escolhas que você consiga explicar.',
    dica: 'Proteja a superfície de trabalho e use materiais apropriados. Não misture produtos que não sejam próprios para pintura.'
  },
  'Desenho': {
    materiais: 'Papel e lápis; borracha e objeto de referência são opcionais.',
    pratica: 'Faça um desenho de estudo curto, concentrando-se no aspecto indicado em vez de tentar acertar todos os detalhes.',
    criacao: 'Crie um desenho próprio aplicando o conceito e identifique onde ele aparece.',
    resultado: 'Um desenho de estudo ou autoral que permita observar a aplicação do conceito.',
    dica: 'Comece com formas simples e compare as proporções antes de acrescentar detalhes.'
  },
  'Música': {
    materiais: 'Instrumento, aplicativo de áudio ou apenas a voz e um local tranquilo para escutar.',
    pratica: 'Escute ou pratique um trecho curto, prestando atenção no elemento musical indicado.',
    criacao: 'Monte uma sequência musical curta, com voz, instrumento ou ferramenta digital, aplicando o conceito.',
    resultado: 'Uma gravação, apresentação curta ou anotação que demonstre o que foi praticado.',
    dica: 'Respeite seu conforto auditivo e mantenha o volume em nível moderado.'
  },
  'Fotografia': {
    materiais: 'Celular ou câmera; objetos e ambientes comuns podem servir de referência.',
    pratica: 'Faça algumas fotos de teste variando apenas o elemento indicado para perceber a diferença.',
    criacao: 'Produza uma pequena série de fotos com uma intenção visual definida.',
    resultado: 'Uma fotografia ou série curta acompanhada de uma explicação das escolhas feitas.',
    dica: 'Peça autorização antes de fotografar outras pessoas e evite expor informações privadas.'
  },
  'Programação': {
    materiais: 'Computador ou celular com editor ou ambiente de programação adequado ao seu nível.',
    pratica: 'Escreva um exemplo pequeno, execute-o e observe o que acontece quando você altera uma parte.',
    criacao: 'Desenvolva um programa curto que demonstre o conceito, teste-o e registre o comportamento esperado.',
    resultado: 'Um trecho de código executável ou um projeto pequeno, acompanhado de uma explicação.',
    dica: 'Salve uma cópia antes de fazer mudanças e leia as mensagens de erro com calma.'
  },
  'Jardinagem': {
    materiais: 'Uma planta para observar, caderno e, se disponível, informações confiáveis sobre a espécie.',
    pratica: 'Observe a planta e registre as condições do ambiente e os sinais relacionados ao tópico estudado.',
    criacao: 'Monte um pequeno plano de cuidado adequado à espécie, sem alterar a rotina da planta sem necessidade.',
    resultado: 'Um registro de observação ou plano de cuidado coerente com as necessidades da planta.',
    dica: 'Não consuma plantas ou partes desconhecidas e confirme as necessidades da espécie antes de mudar os cuidados.'
  },
  'Trabalhos manuais': {
    materiais: 'Papel para planejamento e materiais simples, limpos e adequados ao projeto escolhido.',
    pratica: 'Planeje uma peça pequena e teste a técnica indicada em uma sobra de material.',
    criacao: 'Monte um objeto simples, priorizando planejamento, estabilidade e acabamento.',
    resultado: 'Um protótipo ou peça simples acompanhado de um registro das etapas.',
    dica: 'Use materiais e ferramentas adequados à sua idade; ferramentas cortantes ou elétricas exigem supervisão de um adulto.'
  },
  'Idiomas': {
    materiais: 'Caderno, dicionário ou recurso de aprendizagem confiável e áudio no idioma estudado.',
    pratica: 'Aprenda e use algumas palavras ou frases relacionadas ao tópico em exemplos próprios.',
    criacao: 'Prepare um diálogo, áudio ou pequeno texto usando o conteúdo estudado.',
    resultado: 'Uma produção curta que demonstre compreensão e uso do idioma.',
    dica: 'Priorize frases compreensíveis. Anote dúvidas para revisar depois, sem tentar decorar tudo de uma vez.'
  },
  'Raciocínio lógico': {
    materiais: 'Papel, lápis e uma sequência, problema ou conjunto de dados simples.',
    pratica: 'Resolva um problema curto, registrando as etapas e a razão de cada decisão.',
    criacao: 'Crie um problema semelhante e apresente uma solução explicada passo a passo.',
    resultado: 'Uma solução justificada ou um problema criado com resposta verificável.',
    dica: 'Se travar, divida o problema em partes menores e confira cada etapa.'
  },
  'Mecânica': {
    materiais: 'Diagrama, manual ou material educativo sobre um sistema mecânico; papel para anotações.',
    pratica: 'Identifique em um esquema os componentes relacionados ao tópico e descreva suas funções.',
    criacao: 'Monte um diagrama explicativo de um sistema e mostre como seus componentes se relacionam.',
    resultado: 'Um esquema ou explicação técnica básica, com componentes e funções identificados.',
    dica: 'Este desafio é de estudo e observação. Não desmonte, repare ou opere máquinas, veículos, ferramentas elétricas ou sistemas sob pressão.'
  },
  'Escrita': {
    materiais: 'Caderno ou editor de texto e um tema que desperte seu interesse.',
    pratica: 'Escreva um parágrafo curto aplicando o aspecto indicado e depois revise a clareza.',
    criacao: 'Produza um texto curto com começo, desenvolvimento e fechamento adequados ao objetivo.',
    resultado: 'Um texto próprio revisado, no qual seja possível identificar o recurso praticado.',
    dica: 'Faça primeiro um rascunho. Revise uma coisa de cada vez: clareza, organização e escolha das palavras.'
  }
};

function gerarDetalhamento(categoria, topic, acao) {
  const guia = GUIAS_CATEGORIA[categoria];

  const duracoes = {
    Explore: '10 a 15 minutos',
    Pratique: '15 a 25 minutos',
    Investigue: '20 a 30 minutos',
    Aprofunde: '15 a 25 minutos',
    Crie: '20 a 40 minutos'
  };

  const passosPorAcao = {
    Explore: [
      `Leia ou observe uma referência introdutória sobre ${topic}.`,
      `Anote o que você já sabe e destaque duas dúvidas que ainda tem.`,
      'Registre uma descoberta nova e explique por que ela chamou sua atenção.'
    ],
    Pratique: [
      `Separe os materiais e escolha uma situação simples relacionada a ${topic}.`,
      guia.pratica,
      'Registre o que fez, o que funcionou e o que você faria diferente em uma próxima tentativa.'
    ],
    Investigue: [
      `Encontre duas referências ou exemplos confiáveis relacionados a ${topic}.`,
      'Compare os exemplos: identifique pelo menos duas semelhanças e duas diferenças.',
      'Escreva o que a comparação ajudou você a entender.'
    ],
    Aprofunde: [
      `Escolha uma parte de ${topic} que você queira compreender melhor.`,
      'Consulte uma fonte confiável e anote as informações mais importantes.',
      'Explique o assunto com suas próprias palavras usando um exemplo.'
    ],
    Crie: [
      `Defina uma ideia pequena que demonstre ${topic}.`,
      guia.criacao,
      'Revise o resultado e anote quais escolhas mostram o que você aprendeu.'
    ]
  };

  const passos = passosPorAcao[acao] || passosPorAcao.Pratique;

  const resultado =
    acao === 'Crie' ? guia.resultado :
    acao === 'Investigue' ? `Uma comparação organizada que mostre o que você descobriu sobre ${topic}.` :
    acao === 'Aprofunde' ? `Uma explicação própria de ${topic}, com pelo menos um exemplo.` :
    acao === 'Explore' ? `Um registro do seu conhecimento inicial, das dúvidas e de pelo menos uma descoberta sobre ${topic}.` :
    guia.resultado;

  return {
    materiais: guia.materiais,
    passos,
    resultadoEsperado: resultado,
    dicas: guia.dica,
    criterioConclusao: `A atividade estará concluída quando você terminar as etapas e conseguir apresentar ou explicar o resultado relacionado a ${topic}.`,
    duracao: duracoes[acao] || '15 a 25 minutos'
  };
}

function idUnico() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function montarCatalogo() {
  return Object.entries(TOPICOS).map(([categoria, topicos]) => ({
    categoria,
    atividades: topicos.flatMap((topic, indice) =>
      FORMATOS.map(([acao, modelo], etapa) => ({
        id: `${categoria.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${indice * 5 + etapa + 1}`,
        categoria,
        numero: indice * 5 + etapa + 1,
        titulo: `${acao}: ${topic}`,
        descricao: modelo.replaceAll('{topic}', topic),
        objetivo: `Desenvolver ${topic} por meio de observação, prática e reflexão.`,
        ...gerarDetalhamento(categoria, topic, acao),
        formato: indice * 5 + etapa + 1 >
          ATIVIDADES_POR_CATEGORIA - DESAFIOS_POR_CATEGORIA[categoria]
          ? 'desafio'
          : 'lição',
        dificuldade: indice < 3
          ? 'iniciante'
          : indice < 7
            ? 'intermediária'
            : 'avançada',
      }))
    ),
  }));
}

export const CATALOGO_DESAFIOS = montarCatalogo();
export const CATEGORIAS_DESAFIOS = Object.keys(TOPICOS);

function chaveUsuario(email) {
  const normalizado = normalizarEmail(email);

  if (!normalizado) {
    throw new Error('Não foi possível identificar o usuário atual.');
  }

  return CHAVE_DESAFIOS + normalizado;
}

function normalizarDados(dados) {
  if (!dados || typeof dados !== 'object') {
    return { categorias: {}, historico: [], avaliacoes: [] };
  }

  return {
    categorias: dados.categorias && typeof dados.categorias === 'object'
      ? dados.categorias
      : {},
    historico: Array.isArray(dados.historico) ? dados.historico : [],
    avaliacoes: Array.isArray(dados.avaliacoes) ? dados.avaliacoes : [],
  };
}

export function criarDesafios(armazenamento, agora = () => new Date()) {
  async function ler(email) {
    const bruto = await armazenamento.getItem(chaveUsuario(email));
    let dados = bruto;

    if (typeof bruto === 'string') {
      try {
        dados = JSON.parse(bruto);
      } catch {
        dados = null;
      }
    }

    return normalizarDados(dados);
  }

  async function salvar(email, dados) {
    await armazenamento.setItem(chaveUsuario(email), JSON.stringify(dados));
    return dados;
  }

  function obterProgresso(dados, categoria) {
    const estado = dados.categorias[categoria] || {
      concluidas: [],
      recusadas: [],
      abandonadas: [],
      dificuldade: 'iniciante'
    };

    const concluidas = estado.concluidas || [];
    const total = concluidas.length;

    const autoavaliacoes = dados.historico
      .filter((item) =>
        item.categoria === categoria &&
        item.status === 'concluida' &&
        Number.isFinite(Number(item.autoavaliacao))
      )
      .slice(0, 3)
      .map((item) => Number(item.autoavaliacao));

    const mediaAutoavaliacao = autoavaliacoes.length
      ? autoavaliacoes.reduce((soma, nota) => soma + nota, 0) / autoavaliacoes.length
      : null;

    const niveisDificuldade = ['iniciante', 'intermediária', 'avançada'];
    const baseRecomendacao = estado.dificuldade || 'iniciante';

    let indiceRecomendado = niveisDificuldade.indexOf(baseRecomendacao);

    if (autoavaliacoes.length >= 2 && mediaAutoavaliacao >= 4) {
      indiceRecomendado = Math.min(2, indiceRecomendado + 1);
    }

    if (autoavaliacoes.length >= 2 && mediaAutoavaliacao <= 2) {
      indiceRecomendado = Math.max(0, indiceRecomendado - 1);
    }

    const dificuldadeRecomendada =
      niveisDificuldade[indiceRecomendado < 0 ? 0 : indiceRecomendado];

    const marcoAvaliacao =
      Math.floor(total / INTERVALO_AVALIACAO) * INTERVALO_AVALIACAO;

    const ultimaAvaliacao = (dados.avaliacoes || [])
      .filter((a) =>
        a.categoria === categoria &&
        a.paraAtividade === marcoAvaliacao
      )
      .sort((a, b) => b.data.localeCompare(a.data))[0] || null;

    return {
      total,
      nivel: Math.min(50, total),
      maximo: 50,
      percentual: Math.min(100, total / 50 * 100),
      mediaAutoavaliacao,
      dificuldadeRecomendada,
      faltamAvaliacao: marcoAvaliacao > 0 && !ultimaAvaliacao?.aprovado,
      avaliacaoDisponivelEm: total >= 50
        ? null
        : (Math.floor(total / INTERVALO_AVALIACAO) + 1) * INTERVALO_AVALIACAO,
      dificuldade: estado.dificuldade || dificuldadeRecomendada,
    };
  }

  function obterAtividades(categoria) {
    return CATALOGO_DESAFIOS.find((item) => item.categoria === categoria)?.atividades || [];
  }

  function escolherAtividade(
    dados,
    modalidade,
    categoriaPreferida,
    dificuldadePreferida
  ) {
    const praticadas = new Set(
      Object.keys(dados.categorias).filter(
        (c) => (dados.categorias[c].concluidas || []).length > 0
      )
    );

    let candidatas = CATALOGO_DESAFIOS.map((item) => {
      const concluidas = (dados.categorias[item.categoria]?.concluidas || []).length;

      if (concluidas >= ATIVIDADES_POR_CATEGORIA) {
        return item.atividades[Math.floor(Math.random() * item.atividades.length)];
      }

      return item.atividades[concluidas];
    });

    if (categoriaPreferida) {
      candidatas = candidatas.filter((a) => a.categoria === categoriaPreferida);
    }

    if (modalidade === 'desenvolvimento') {
      candidatas = candidatas.filter((a) => praticadas.has(a.categoria));

      if (categoriaPreferida && dificuldadePreferida) {
        const categoria = CATALOGO_DESAFIOS.find(
          (item) => item.categoria === categoriaPreferida
        );

        const jaConcluidas = new Set(
          dados.historico
            .filter((item) =>
              item.categoria === categoriaPreferida &&
              item.status === 'concluida'
            )
            .map((item) => item.atividadeId)
            .filter(Boolean)
        );

        candidatas = (categoria?.atividades || []).filter((atividade) =>
          atividade.dificuldade === dificuldadePreferida &&
          !jaConcluidas.has(atividade.id)
        );
      }
    } else if (modalidade === 'descoberta') {
      candidatas = candidatas.filter((a) => !praticadas.has(a.categoria));
    }

    const recentes = new Set(
      dados.historico.slice(0, 8).map((h) => h.atividadeId).filter(Boolean)
    );

    const novas = candidatas.filter((a) => !recentes.has(a.id));
    const pool = novas.length ? novas : candidatas;

    return pool.length
      ? pool[Math.floor(Math.random() * pool.length)]
      : null;
  }

  async function registrar(email, atividade, status, extras = {}) {
    if (
      !atividade ||
      !['concluida', 'recusada', 'abandonada'].includes(status)
    ) {
      throw new Error('Registro de atividade inválido.');
    }

    const dados = await ler(email);
    const categoria = atividade.categoria;

    const estado = dados.categorias[categoria] ||
      (dados.categorias[categoria] = {
        concluidas: [],
        recusadas: [],
        abandonadas: [],
        dificuldade: null,
      });

    const registro = {
      id: idUnico(),
      atividadeId: atividade.id || null,
      titulo: atividade.titulo,
      categoria,
      modalidade: atividade.modalidade || 'personalizada',
      formato: atividade.formato || 'personalizada',
      status,
      dificuldade: atividade.dificuldade || 'não definida',
      data: agora().toISOString(),
      autoavaliacao: extras.autoavaliacao ?? null,
      evidencia: extras.evidencia || null,
    };

    if (status === 'concluida') estado.concluidas.push(registro.id);
    if (status === 'recusada') estado.recusadas.push(registro.id);
    if (status === 'abandonada') estado.abandonadas.push(registro.id);

    dados.historico.unshift(registro);

    await salvar(email, dados);

    return {
      registro,
      progresso: obterProgresso(dados, categoria),
    };
  }

  async function criarPersonalizada(email, dadosAtividade) {
    const categoria = String(dadosAtividade?.categoria || '').trim();
    const titulo = String(dadosAtividade?.titulo || '').trim();

    if (!CATEGORIAS_DESAFIOS.includes(categoria)) {
      throw new Error('Escolha uma categoria válida.');
    }

    if (!titulo) {
      throw new Error('Descreva sua atividade.');
    }

    return {
      id: `custom-${idUnico()}`,
      categoria,
      titulo,
      descricao: String(
        dadosAtividade.descricao || 'Atividade criada pelo usuário.'
      ).trim(),
      objetivo: 'Praticar uma atividade escolhida por você.',
      materiais: 'Definidos por você conforme a atividade escolhida.',
      passos: String(dadosAtividade.descricao || '').trim()
        ? [
            String(dadosAtividade.descricao).trim(),
            'Execute a atividade com atenção e registre o que conseguiu realizar.',
            'Revise o resultado e identifique o que aprendeu.'
          ]
        : [
            'Defina um primeiro passo simples e seguro.',
            'Realize a atividade no seu ritmo.',
            'Registre o resultado e o que aprendeu.'
          ],
      resultadoEsperado: 'Um resultado que corresponda ao objetivo definido por você.',
      dicas: 'Escolha uma atividade adequada aos materiais disponíveis e peça orientação quando envolver ferramentas ou procedimentos que exigem supervisão.',
      criterioConclusao: 'Considere concluída quando realizar o que planejou e registrar o resultado.',
      modalidade: 'personalizado',
      formato: 'desafio',
      dificuldade: dadosAtividade.dificuldade || 'não definida',
      duracao: dadosAtividade.duracao || 'Definida por você',
    };
  }

  async function registrarAvaliacao(email, categoria, percentual, autoavaliacao) {
    const dados = await ler(email);
    const progresso = obterProgresso(dados, categoria);

    if (!progresso.faltamAvaliacao) {
      throw new Error('Ainda não há uma avaliação liberada para esta categoria.');
    }

    const nota = Math.max(0, Math.min(100, Number(percentual) || 0));

    const avaliacao = {
      id: idUnico(),
      categoria,
      paraAtividade: progresso.total,
      percentual: nota,
      aprovado: nota >= APROVACAO_MINIMA,
      autoavaliacao: autoavaliacao || null,
      data: agora().toISOString(),
    };

    dados.avaliacoes.unshift(avaliacao);

    await salvar(email, dados);

    return avaliacao;
  }

  async function ajustarDificuldade(email, categoria, dificuldade) {
    if (!['iniciante', 'intermediária', 'avançada'].includes(dificuldade)) {
      throw new Error('Dificuldade inválida.');
    }

    const dados = await ler(email);

    const estado = dados.categorias[categoria] ||
      (dados.categorias[categoria] = {
        concluidas: [],
        recusadas: [],
        abandonadas: [],
      });

    estado.dificuldade = dificuldade;

    await salvar(email, dados);

    return estado;
  }

  return {
    ler,
    salvar,
    obterProgresso: (dados, categoria) => obterProgresso(dados, categoria),
    obterAtividades,
    escolherAtividade,
    registrar,
    criarPersonalizada,
    registrarAvaliacao,
    ajustarDificuldade,
  };
}