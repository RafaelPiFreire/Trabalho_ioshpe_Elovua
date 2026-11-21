import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { emailValido, validarCadastro, validarLogin } from '../src/utils/validacao.js';
import { sha256, hashSenha } from '../src/utils/hash.js';
import { criarContas, DEMO, CHAVE_USUARIOS, LIMITE_HISTORICO } from '../src/services/contas.js';

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

test('conta demo não é criada automaticamente no app', async () => {
  const arm = memoria();
  const c = criarContas(arm);
  const r = await c.entrar({ email: DEMO.email, senha: DEMO.senha });
  assert.equal(r.ok, false);
  assert.ok(!arm._m.get(CHAVE_USUARIOS) || !arm._m.get(CHAVE_USUARIOS).includes(DEMO.senha));
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
  assert.equal((await c.entrar({ email: DEMO.email, senha: DEMO.senha })).ok, false);
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


import { criarDesafios, CATEGORIAS_DESAFIOS, CATALOGO_DESAFIOS, APROVACAO_MINIMA, DESAFIOS_POR_CATEGORIA } from '../src/services/desafios.js';

test('catálogo de desafios oferece 50 atividades em cada uma das 13 categorias', () => {
  assert.equal(CATEGORIAS_DESAFIOS.length, 13);
  assert.equal(CATALOGO_DESAFIOS.length, 13);
  for (const item of CATALOGO_DESAFIOS) assert.equal(item.atividades.length, 50, item.categoria);
});

test('progresso de desafios é isolado por usuário e por categoria', async () => {
  const arm = memoria();
  const sistema = criarDesafios(arm);
  const atividade = sistema.obterAtividades('Culinária')[0];
  await sistema.registrar('ana@x.com', atividade, 'concluida', { autoavaliacao: 4 });
  const ana = await sistema.ler('ana@x.com');
  const bia = await sistema.ler('bia@x.com');
  assert.equal(sistema.obterProgresso(ana, 'Culinária').total, 1);
  assert.equal(sistema.obterProgresso(ana, 'Leitura').total, 0);
  assert.equal(sistema.obterProgresso(bia, 'Culinária').total, 0);
});

test('recusas e desistências entram no histórico sem contar como concluídas', async () => {
  const sistema = criarDesafios(memoria());
  const atividade = sistema.obterAtividades('Desenho')[0];
  await sistema.registrar('ana@x.com', atividade, 'recusada');
  await sistema.registrar('ana@x.com', atividade, 'abandonada');
  const dados = await sistema.ler('ana@x.com');
  assert.equal(dados.historico.length, 2);
  assert.equal(sistema.obterProgresso(dados, 'Desenho').total, 0);
});

test('avaliação é liberada a cada 15 conclusões e usa aprovação mínima de 75%', async () => {
  const sistema = criarDesafios(memoria());
  const atividade = sistema.obterAtividades('Pintura')[0];
  for (let i = 0; i < 15; i++) await sistema.registrar('ana@x.com', atividade, 'concluida');
  let dados = await sistema.ler('ana@x.com');
  assert.equal(sistema.obterProgresso(dados, 'Pintura').faltamAvaliacao, true);
  const primeiraTentativa = await sistema.registrarAvaliacao('ana@x.com', 'Pintura', 60, 'Preciso revisar alguns pontos.');
  assert.equal(primeiraTentativa.aprovado, false);
  dados = await sistema.ler('ana@x.com');
  assert.equal(sistema.obterProgresso(dados, 'Pintura').faltamAvaliacao, true);
  const resultado = await sistema.registrarAvaliacao('ana@x.com', 'Pintura', 75, 'Consegui aplicar os conceitos.');
  assert.equal(resultado.aprovado, true);
  assert.equal(resultado.percentual, APROVACAO_MINIMA);
  dados = await sistema.ler('ana@x.com');
  assert.equal(sistema.obterProgresso(dados, 'Pintura').faltamAvaliacao, false);
});

test('desenvolvimento e descoberta respeitam categorias praticadas e não praticadas', async () => {
  const sistema = criarDesafios(memoria());
  const atividade = sistema.obterAtividades('Música')[0];
  await sistema.registrar('ana@x.com', atividade, 'concluida');
  const dados = await sistema.ler('ana@x.com');
  assert.equal(sistema.escolherAtividade(dados, 'desenvolvimento', 'Música').categoria, 'Música');
  assert.notEqual(sistema.escolherAtividade(dados, 'descoberta').categoria, 'Música');
});

test('desenvolvimento respeita a dificuldade selecionada', async () => {
  const sistema = criarDesafios(memoria());
  const atividade = sistema.obterAtividades('Música')[0];
  await sistema.registrar('ana@x.com', atividade, 'concluida');
  const dados = await sistema.ler('ana@x.com');
  const proxima = sistema.escolherAtividade(dados, 'desenvolvimento', 'Música', 'avançada');
  assert.equal(proxima.categoria, 'Música');
  assert.equal(proxima.dificuldade, 'avançada');
  assert.notEqual(proxima.id, atividade.id);
});


test('sequência de aprendizado libera a próxima atividade somente após conclusão', async () => {
  const sistema = criarDesafios(memoria());
  const primeira = sistema.escolherAtividade(await sistema.ler('ana@x.com'), 'surpresa', 'Culinária');
  assert.equal(primeira.numero, 1);
  await sistema.registrar('ana@x.com', primeira, 'recusada');
  const aposRecusa = sistema.escolherAtividade(await sistema.ler('ana@x.com'), 'surpresa', 'Culinária');
  assert.equal(aposRecusa.numero, 1);
  await sistema.registrar('ana@x.com', primeira, 'concluida');
  const proxima = sistema.escolherAtividade(await sistema.ler('ana@x.com'), 'surpresa', 'Culinária');
  assert.equal(proxima.numero, 2);
});

test('cada categoria separa lições comuns e desafios com distribuição própria', () => {
  const quantidades = new Set();
  for (const item of CATALOGO_DESAFIOS) {
    const desafiosDaCategoria = item.atividades.filter((a) => a.formato === 'desafio').length;
    assert.equal(desafiosDaCategoria, DESAFIOS_POR_CATEGORIA[item.categoria]);
    assert.equal(item.atividades.filter((a) => a.formato === 'lição').length + desafiosDaCategoria, 50);
    quantidades.add(desafiosDaCategoria);
  }
  assert.ok(quantidades.size > 1, 'a distribuição deve variar entre categorias');
});
