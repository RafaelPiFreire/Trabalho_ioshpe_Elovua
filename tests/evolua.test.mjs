import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { lerNumero, calcularConsumo, classificarConsumo, formatarNumero } from '../src/utils/consumo.js';
import { emailValido, validarCadastro, validarLogin } from '../src/utils/validacao.js';
import { sha256, hashSenha } from '../src/utils/hash.js';
import { criarContas, DEMO, CHAVE_USUARIOS, LIMITE_HISTORICO } from '../src/services/contas.js';
import { criarTrilhas, CHAVE_TRILHAS, LIMITE_FOTOS_POR_TRILHA } from '../src/services/trilhas.js';
import { criarFotos } from '../src/services/fotos.js';

// Armazenamento em memória com a mesma interface do AsyncStorage.
function memoria(inicial = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    getItem: async (k) => (m.has(k) ? m.get(k) : null),
    setItem: async (k, v) => { m.set(k, v); },
    removeItem: async (k) => { m.delete(k); },
    _m: m,
  };
}

test('lerNumero aceita vírgula, ponto e espaços; rejeita lixo', () => {
  assert.equal(lerNumero('12,5'), 12.5);
  assert.equal(lerNumero(' 40 '), 40);
  assert.equal(lerNumero('0.5'), 0.5);
  for (const ruim of ['', 'abc', '1e5', '-3', '1,2,3', '12abc', null, undefined]) {
    assert.ok(Number.isNaN(lerNumero(ruim)), `deveria rejeitar ${ruim}`);
  }
});

test('calcularConsumo: 300 km com 25 L = 12 km/L', () => {
  const r = calcularConsumo('300', '25');
  assert.equal(r.ok, true);
  assert.equal(r.kmPorLitro, 12);
  assert.equal(r.classificacao, 'Moderado');
  assert.equal(formatarNumero(r.kmPorLitro), '12,00');
});

test('calcularConsumo valida entradas', () => {
  assert.equal(calcularConsumo('', '10').ok, false);
  assert.equal(calcularConsumo('100', '0').ok, false);
  assert.equal(calcularConsumo('-5', '10').ok, false);
  assert.equal(calcularConsumo('abc', '10').ok, false);
  assert.equal(calcularConsumo('100', '8,5').ok, true);
});

test('classificação por faixas', () => {
  assert.equal(classificarConsumo(15), 'Econômico');
  assert.equal(classificarConsumo(9), 'Moderado');
  assert.equal(classificarConsumo(8.9), 'Alto consumo');
});

test('validação de e-mail e cadastro', () => {
  assert.ok(emailValido('a@b.com'));
  assert.ok(!emailValido('a@b'));
  assert.ok(!emailValido('a b@c.com'));
  const ok = { nome: 'Ana', email: 'ana@x.com', senha: '123456', confirmarSenha: '123456' };
  assert.equal(validarCadastro(ok), null);
  assert.match(validarCadastro({ ...ok, senha: '123', confirmarSenha: '123' }), /6 caracteres/);
  assert.match(validarCadastro({ ...ok, confirmarSenha: 'x' }), /não coincidem/);
  assert.match(validarCadastro({ ...ok, nome: '  ' }), /todos os campos/);
  assert.match(validarLogin({ email: '', senha: 'x' }), /Preencha/);
});

test('sha256 confere com o crypto do Node (vários tamanhos e acentos)', () => {
  for (const texto of ['', 'abc', 'Evolua123', 'ação ✓ 😀', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(1000)]) {
    assert.equal(sha256(texto), createHash('sha256').update(texto, 'utf8').digest('hex'), `falhou para "${texto.slice(0, 10)}"`);
  }
  assert.notEqual(hashSenha('abc', 's1'), hashSenha('abc', 's2'));
  assert.equal(hashSenha('abc', 's1'), hashSenha('abc', 's1'));
});

test('conta demo funciona e senha não fica em texto puro', async () => {
  const arm = memoria();
  const c = criarContas(arm);
  const r = await c.entrar({ email: DEMO.email, senha: DEMO.senha });
  assert.equal(r.ok, true);
  assert.ok(!arm._m.get(CHAVE_USUARIOS).includes(DEMO.senha));
});

test('cadastro, login, e-mail duplicado e senha errada', async () => {
  const c = criarContas(memoria());
  const dados = { nome: 'Ana', email: ' Ana@Teste.com ', senha: 'segredo1', confirmarSenha: 'segredo1' };
  const cad = await c.cadastrar(dados);
  assert.equal(cad.ok, true);
  assert.equal(cad.usuario.email, 'ana@teste.com');
  assert.equal((await c.cadastrar(dados)).ok, false);
  assert.equal((await c.entrar({ email: 'ANA@teste.com', senha: 'segredo1' })).ok, true);
  assert.equal((await c.entrar({ email: 'ana@teste.com', senha: 'errada' })).ok, false);
  assert.equal((await c.entrar({ email: 'naoexiste@x.com', senha: 'segredo1' })).ok, false);
});

test('sessão: salvar, recuperar, encerrar e conta removida', async () => {
  const arm = memoria();
  const c = criarContas(arm);
  const { usuario } = await c.cadastrar({ nome: 'Bia', email: 'bia@x.com', senha: '123456', confirmarSenha: '123456' });
  await c.salvarSessao(usuario);
  assert.deepEqual(await c.recuperarSessao(), usuario);
  await c.encerrarSessao();
  assert.equal(await c.recuperarSessao(), null);
  await arm.setItem('@evolua/sessao', JSON.stringify({ email: 'fantasma@x.com' }));
  assert.equal(await c.recuperarSessao(), null);
});

test('migra contas da versão 1 (senha em texto puro) para hash', async () => {
  const antigo = [{ nome: 'Velho', email: 'velho@x.com', senha: 'senha123' }];
  const arm = memoria({ [CHAVE_USUARIOS]: JSON.stringify(antigo) });
  const c = criarContas(arm);
  assert.equal((await c.entrar({ email: 'velho@x.com', senha: 'senha123' })).ok, true);
  assert.ok(!arm._m.get(CHAVE_USUARIOS).includes('senha123'));
});

test('dados corrompidos não derrubam o app', async () => {
  const arm = memoria({ [CHAVE_USUARIOS]: '{lixo', '@evolua/sessao': 'xxx' });
  const c = criarContas(arm);
  assert.equal(await c.recuperarSessao(), null);
  assert.equal((await c.entrar({ email: DEMO.email, senha: DEMO.senha })).ok, true);
});

test('histórico é por usuário, limitado e pode ser limpo', async () => {
  const c = criarContas(memoria());
  for (let i = 0; i < LIMITE_HISTORICO + 5; i++) {
    await c.adicionarHistorico('a@x.com', { distancia: 100, litros: 10, kmPorLitro: 10, classificacao: 'Moderado' });
  }
  const lista = await c.lerHistorico('A@x.com');
  assert.equal(lista.length, LIMITE_HISTORICO);
  assert.equal(new Set(lista.map((h) => h.id)).size, LIMITE_HISTORICO, 'ids devem ser únicos');
  assert.equal((await c.lerHistorico('b@x.com')).length, 0);
  await c.limparHistorico('a@x.com');
  assert.equal((await c.lerHistorico('a@x.com')).length, 0);
});

function relogioLocal(ano, mes, dia, hora = 12) {
  let agora = new Date(ano, mes - 1, dia, hora);
  return {
    obter: () => new Date(agora),
    definir: (novoAno, novoMes, novoDia, novaHora = 12) => { agora = new Date(novoAno, novoMes - 1, novoDia, novaHora); },
  };
}

function criarAmbienteFotos(relogio, opcoes = {}) {
  const arm = memoria();
  const trilhas = criarTrilhas(arm, relogio.obter);
  const arquivos = new Map();
  const diretorios = new Set();
  const arquivosGaleria = new Map();
  const chamadasSeletor = [];
  let selecao = 0;
  const fileSystem = {
    documentDirectory: 'file:///documentos/',
    getInfoAsync: async (uri) => ({ exists: diretorios.has(uri) || arquivos.has(uri) }),
    makeDirectoryAsync: async (uri) => { diretorios.add(uri); },
    copyAsync: async ({ from, to }) => {
      if (!arquivos.has(from)) throw new Error('Arquivo de origem ausente.');
      arquivos.set(to, { ...arquivos.get(from) });
    },
    deleteAsync: async (uri) => { arquivos.delete(uri); },
  };
  const imagePicker = {
    launchImageLibraryAsync: async () => {
      chamadasSeletor.push(true);
      const numero = ++selecao;
      const uri = `content://galeria/foto-${numero}.jpg`;
      arquivos.set(uri, { conteudo: `imagem-${numero}` });
      return { canceled: false, assets: [{ uri, fileName: `foto-${numero}.jpg` }] };
    },
  };
  const mediaLibrary = {
    getPermissionsAsync: async () => ({
      granted: !opcoes.permissaoGaleriaNegada,
      canAskAgain: !opcoes.permissaoGaleriaBloqueada,
    }),
    requestPermissionsAsync: async () => ({
      granted: !opcoes.permissaoGaleriaNegada,
      canAskAgain: !opcoes.permissaoGaleriaBloqueada,
    }),
    createAssetAsync: async (uri) => {
      if (opcoes.falhaAoSalvarGaleria) throw new Error('Falha simulada na galeria.');
      const asset = { id: `asset-${arquivosGaleria.size + 1}`, uri: `media-library://asset-${arquivosGaleria.size + 1}`, filename: 'foto.jpg' };
      arquivosGaleria.set(asset.id, { ...arquivos.get(uri) });
      return asset;
    },
  };
  const fotos = criarFotos({ trilhas, imagePicker, fileSystem, mediaLibrary, obterAgora: relogio.obter });
  return { arm, trilhas, fotos, arquivos, arquivosGaleria, chamadasSeletor };
}

test('trilhas criam hobbies isolados por usuário e persistem após nova instância', async () => {
  const arm = memoria();
  const relogio = relogioLocal(2026, 10, 12);
  const t = criarTrilhas(arm, relogio.obter);
  const hobby = await t.criarHobby('ana@x.com', 'Desenho', [1, 3, 5]);
  await t.criarHobby('bia@x.com', 'Leitura', [2, 4]);

  const reaberto = criarTrilhas(arm, relogio.obter);
  assert.deepEqual((await reaberto.lerHobbies('ANA@x.com')).map((item) => item.nome), ['Desenho']);
  assert.equal((await reaberto.lerHobbies('bia@x.com')).length, 1);
  assert.equal((await reaberto.lerHobbies('ana@x.com'))[0].id, hobby.id);
  assert.ok(arm._m.has(CHAVE_TRILHAS + 'ana@x.com'));
});

test('foguinho conta dias planejados, ignora descansos e não multiplica atividades no mesmo dia', async () => {
  const arm = memoria();
  const relogio = relogioLocal(2026, 10, 12); // segunda-feira
  const t = criarTrilhas(arm, relogio.obter);
  const hobby = await t.criarHobby('ana@x.com', 'Desenho', [1, 3, 5]);

  await t.registrarAtividade('ana@x.com', hobby.id);
  relogio.definir(2026, 10, 13); // descanso
  assert.equal(t.obterResumo((await t.lerHobbies('ana@x.com'))[0]).sequenciaAtual, 1);
  await t.registrarAtividade('ana@x.com', hobby.id);
  assert.equal(t.obterResumo((await t.lerHobbies('ana@x.com'))[0]).sequenciaAtual, 1);

  relogio.definir(2026, 10, 14); // quarta-feira
  await t.registrarAtividade('ana@x.com', hobby.id);
  await t.registrarAtividade('ana@x.com', hobby.id);
  const resumo = t.obterResumo((await t.lerHobbies('ana@x.com'))[0]);
  assert.equal(resumo.sequenciaAtual, 2);
  assert.equal(resumo.recorde, 2);
  assert.equal(resumo.quantidadeHoje, 2);
});

test('dia planejado perdido interrompe a sequência e a próxima prática inicia outra', async () => {
  const arm = memoria();
  const relogio = relogioLocal(2026, 10, 12);
  const t = criarTrilhas(arm, relogio.obter);
  const hobby = await t.criarHobby('ana@x.com', 'Leitura', [1, 3, 4, 5]);
  await t.registrarAtividade('ana@x.com', hobby.id);

  relogio.definir(2026, 10, 14); // quarta-feira planejada, ainda não encerrada
  let atual = (await t.lerHobbies('ana@x.com'))[0];
  assert.equal(t.obterResumo(atual).sequenciaAtual, 1);

  relogio.definir(2026, 10, 15); // quinta: quarta-feira já encerrou
  atual = (await t.lerHobbies('ana@x.com'))[0];
  assert.equal(t.obterResumo(atual).sequenciaAtual, 0);
  await t.registrarAtividade('ana@x.com', hobby.id);
  atual = (await t.lerHobbies('ana@x.com'))[0];
  assert.equal(t.obterResumo(atual).sequenciaAtual, 1);
  assert.equal(t.obterResumo(atual).recorde, 1);
});

test('mudanças na frequência preservam configurações e recorde anteriores', async () => {
  const arm = memoria();
  const relogio = relogioLocal(2026, 10, 12);
  const t = criarTrilhas(arm, relogio.obter);
  const hobby = await t.criarHobby('ana@x.com', 'Música', [1, 3, 5]);
  await t.registrarAtividade('ana@x.com', hobby.id);
  relogio.definir(2026, 10, 13);
  await t.atualizarDias('ana@x.com', hobby.id, [2, 4, 6]);

  const atualizado = (await t.lerHobbies('ana@x.com'))[0];
  assert.equal(atualizado.configuracoes.length, 2);
  assert.deepEqual(atualizado.configuracoes[0].dias, [1, 3, 5]);
  assert.deepEqual(atualizado.configuracoes[1].dias, [2, 4, 6]);
  assert.equal(atualizado.atividades.length, 1);
  assert.equal(t.obterResumo(atualizado).recorde, 1);
});

test('sequência usa dias de calendário local ao atravessar a mudança de horário', async () => {
  const arm = memoria();
  const relogio = relogioLocal(2026, 3, 8); // domingo da mudança de horário em America/New_York
  const t = criarTrilhas(arm, relogio.obter);
  const hobby = await t.criarHobby('ana@x.com', 'Caminhada', [0]);
  await t.registrarAtividade('ana@x.com', hobby.id);

  relogio.definir(2026, 3, 15);
  await t.registrarAtividade('ana@x.com', hobby.id);
  const atual = (await t.lerHobbies('ana@x.com'))[0];
  assert.equal(t.obterResumo(atual).sequenciaAtual, 2);
});

test('foto é associada ao hobby e dia, registra a prática uma vez e impede uma segunda foto diária', async () => {
  const relogio = relogioLocal(2026, 10, 15); // quinta-feira
  const ambiente = criarAmbienteFotos(relogio);
  const hobby = await ambiente.trilhas.criarHobby('ana@x.com', 'Fotografia', [4]);
  await ambiente.trilhas.registrarAtividade('ana@x.com', hobby.id);

  const resultado = await ambiente.fotos.selecionarEAdicionar('ana@x.com', hobby.id);
  let salvo = (await ambiente.trilhas.lerHobbies('ana@x.com'))[0];
  assert.equal(resultado.cancelada, false);
  assert.equal(salvo.fotos.length, 1);
  assert.equal(salvo.atividades.filter((item) => item.data === '2026-10-15').length, 1);
  assert.ok(ambiente.arquivos.has(salvo.fotos[0].uri));

  const reaberto = criarTrilhas(ambiente.arm, relogio.obter);
  const restaurado = (await reaberto.lerHobbies('ana@x.com'))[0];
  assert.equal(restaurado.fotos[0].uri, salvo.fotos[0].uri);
  assert.equal(restaurado.atividades.length, 1);

  await assert.rejects(
    ambiente.fotos.selecionarEAdicionar('ana@x.com', hobby.id),
    /já adicionou uma foto/,
  );
  assert.equal(ambiente.chamadasSeletor.length, 1);
});

test('limite de dez fotos exclui o arquivo antigo e mantém cópia independente e histórico', async () => {
  const relogio = relogioLocal(2026, 10, 1);
  const ambiente = criarAmbienteFotos(relogio);
  const hobby = await ambiente.trilhas.criarHobby('ana@x.com', 'Desenho', [0, 1, 2, 3, 4, 5, 6]);
  await ambiente.fotos.selecionarEAdicionar('ana@x.com', hobby.id);
  let salvo = (await ambiente.trilhas.lerHobbies('ana@x.com'))[0];
  const primeiraFoto = salvo.fotos[0];
  await ambiente.fotos.salvarNaGaleria('ana@x.com', hobby.id, primeiraFoto.id);
  const conteudoGaleria = ambiente.arquivosGaleria.get('asset-1');

  for (let dia = 2; dia <= 11; dia++) {
    relogio.definir(2026, 10, dia);
    await ambiente.fotos.selecionarEAdicionar('ana@x.com', hobby.id);
  }

  salvo = (await ambiente.trilhas.lerHobbies('ana@x.com'))[0];
  assert.equal(salvo.fotos.length, LIMITE_FOTOS_POR_TRILHA);
  assert.ok(!salvo.fotos.some((foto) => foto.id === primeiraFoto.id));
  assert.ok(!ambiente.arquivos.has(primeiraFoto.uri), 'arquivo local mais antigo deve ser excluído fisicamente');
  assert.equal(ambiente.arquivosGaleria.get('asset-1'), conteudoGaleria, 'cópia da galeria deve permanecer independente');
  assert.equal(salvo.fotosPreservadas[0].assetId, 'asset-1');
  assert.equal(salvo.atividades.length, 11, 'a limpeza das imagens não pode remover etapas do histórico');
  assert.equal(salvo.atividades[0].fotoRegistrada, true);

  relogio.definir(2026, 10, 1);
  await assert.rejects(
    ambiente.fotos.selecionarEAdicionar('ana@x.com', hobby.id),
    /já adicionou uma foto/,
    'a data continua marcada mesmo depois da exclusão da imagem local',
  );
});

test('permissão negada ou falha da galeria é informada e não marca foto como salva', async () => {
  const relogio = relogioLocal(2026, 10, 15);
  const ambiente = criarAmbienteFotos(relogio, { permissaoGaleriaNegada: true });
  const hobby = await ambiente.trilhas.criarHobby('ana@x.com', 'Leitura', [4]);
  await ambiente.fotos.selecionarEAdicionar('ana@x.com', hobby.id);
  let salvo = (await ambiente.trilhas.lerHobbies('ana@x.com'))[0];

  await assert.rejects(
    ambiente.fotos.salvarNaGaleria('ana@x.com', hobby.id, salvo.fotos[0].id),
    /Permita que o Evolua/,
  );
  salvo = (await ambiente.trilhas.lerHobbies('ana@x.com'))[0];
  assert.equal(salvo.fotos[0].galeria, null);
  assert.equal(salvo.fotosPreservadas.length, 0);
});

test('falha ao criar cópia na galeria não apresenta a foto como preservada', async () => {
  const relogio = relogioLocal(2026, 10, 15);
  const ambiente = criarAmbienteFotos(relogio, { falhaAoSalvarGaleria: true });
  const hobby = await ambiente.trilhas.criarHobby('ana@x.com', 'Música', [4]);
  await ambiente.fotos.selecionarEAdicionar('ana@x.com', hobby.id);
  const salvo = (await ambiente.trilhas.lerHobbies('ana@x.com'))[0];

  await assert.rejects(
    ambiente.fotos.salvarNaGaleria('ana@x.com', hobby.id, salvo.fotos[0].id),
    /Falha simulada na galeria/,
  );
  const atualizado = (await ambiente.trilhas.lerHobbies('ana@x.com'))[0];
  assert.equal(atualizado.fotos[0].galeria, null);
  assert.equal(atualizado.fotosPreservadas.length, 0);
});

test('criação de hobby valida nome e exige ao menos um dia planejado', async () => {
  const t = criarTrilhas(memoria(), relogioLocal(2026, 10, 12).obter);
  await assert.rejects(t.criarHobby('ana@x.com', '  ', [1]), /nome/);
  await assert.rejects(t.criarHobby('ana@x.com', 'Desenho', []), /pelo menos um dia/);
  await t.criarHobby('ana@x.com', 'Desenho', [1]);
  await assert.rejects(t.criarHobby('ana@x.com', 'desenho', [2]), /já tem/);
});
