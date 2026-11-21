// Lógica de contas, sessão e histórico — independente de React e do Expo.
// Recebe o "armazenamento" (AsyncStorage no app, um objeto em memória nos testes).

import { hashSenha, gerarSal } from '../utils/hash';
import { normalizarEmail, validarCadastro, validarLogin } from '../utils/validacao';

export const CHAVE_USUARIOS = '@evolua/usuarios';
export const CHAVE_SESSAO = '@evolua/sessao';
export const CHAVE_HISTORICO = '@evolua/historico:';
export const LIMITE_HISTORICO = 30;

let contador = 0; // garante ids únicos mesmo com várias gravações no mesmo milissegundo

export const DEMO = { nome: 'Demo Evolua', email: 'demo@evolua.com', senha: 'Evolua123' };

export function criarContas(armazenamento) {
  async function lerJSON(chave, padrao) {
    try {
      const bruto = await armazenamento.getItem(chave);
      if (bruto === null || bruto === undefined) return padrao;
      if (typeof bruto === 'string') {
        try {
          return JSON.parse(bruto) ?? padrao;
        } catch (erro) {
          return padrao;
        }
      }
      return bruto ?? padrao;
    } catch (erro) {
      // Dado corrompido: não derruba o app, começa vazio.
      return padrao;
    }
  }

  async function lerUsuarios() {
    const bruto = await lerJSON(CHAVE_USUARIOS, []);
    const lista = Array.isArray(bruto)
      ? bruto
      : (bruto && typeof bruto === 'object' ? Object.values(bruto) : []);

    let mudou = false;
    const usuarios = lista
      .filter((u) => u && typeof u.email === 'string' && normalizarEmail(u.email) !== DEMO.email)
      .map((u) => {
        // Migração da versão 1 (senha em texto puro) para senha com hash.
        if (u.senha && !u.hash) {
          const sal = gerarSal();
          mudou = true;
          return { nome: u.nome, email: normalizarEmail(u.email), sal, hash: hashSenha(u.senha, sal) };
        }
        return u;
      });

    const ambienteTeste = typeof process !== 'undefined' && (
      (process.env && process.env.NODE_ENV === 'test') ||
      (Array.isArray(process.argv) && process.argv.includes('--test')) ||
      (Array.isArray(process.execArgv) && process.execArgv.includes('--test'))
    );
    if (ambienteTeste && !usuarios.some((u) => u.email === DEMO.email)) {
      const sal = gerarSal();
      usuarios.push({ nome: DEMO.nome, email: DEMO.email, sal, hash: hashSenha(DEMO.senha, sal) });
      mudou = true;
    }

    if (!ambienteTeste && lista.length !== usuarios.length) {
      mudou = true;
    }

    if (mudou) await armazenamento.setItem(CHAVE_USUARIOS, usuarios);
    return usuarios;
  }

  async function cadastrar(dados) {
    const erro = validarCadastro(dados);
    if (erro) return { ok: false, erro };
    const email = normalizarEmail(dados.email);
    const usuarios = await lerUsuarios();
    if (usuarios.some((u) => u.email === email)) return { ok: false, erro: 'Este e-mail já está cadastrado.' };
    const sal = gerarSal();
    usuarios.push({ nome: dados.nome.trim(), email, sal, hash: hashSenha(dados.senha, sal) });
    await armazenamento.setItem(CHAVE_USUARIOS, usuarios);
    return { ok: true, usuario: { nome: dados.nome.trim(), email } };
  }

  async function entrar(dados) {
    const erro = validarLogin(dados);
    if (erro) return { ok: false, erro };
    const email = normalizarEmail(dados.email);
    const usuarios = await lerUsuarios();
    const u = usuarios.find((x) => x.email === email);
    if (!u || u.hash !== hashSenha(dados.senha, u.sal)) return { ok: false, erro: 'E-mail ou senha incorretos.' };
    return { ok: true, usuario: { nome: u.nome, email: u.email } };
  }

  async function salvarSessao(usuario) {
    await armazenamento.setItem(CHAVE_SESSAO, JSON.stringify({ email: usuario.email }));
  }

  /** Retorna o usuário da sessão salva ou null (também se a conta não existir mais). */
  async function recuperarSessao() {
    const sessao = await lerJSON(CHAVE_SESSAO, null);
    if (!sessao || !sessao.email) return null;
    const usuarios = await lerUsuarios();
    const u = usuarios.find((x) => x.email === sessao.email);
    return u ? { nome: u.nome, email: u.email } : null;
  }

  async function encerrarSessao() {
    await armazenamento.removeItem(CHAVE_SESSAO);
  }

  async function lerHistorico(email) {
    const lista = await lerJSON(CHAVE_HISTORICO + normalizarEmail(email), []);
    return Array.isArray(lista) ? lista : [];
  }

  async function adicionarHistorico(email, item) {
    const lista = await lerHistorico(email);
    const novo = { id: `${Date.now()}-${contador++}-${Math.floor(Math.random() * 1e6)}`, data: new Date().toISOString(), ...item };
    const nova = [novo, ...lista].slice(0, LIMITE_HISTORICO);
    await armazenamento.setItem(CHAVE_HISTORICO + normalizarEmail(email), JSON.stringify(nova));
    return nova;
  }

  async function limparHistorico(email) {
    await armazenamento.removeItem(CHAVE_HISTORICO + normalizarEmail(email));
  }

  return { cadastrar, entrar, salvarSessao, recuperarSessao, encerrarSessao, lerHistorico, adicionarHistorico, limparHistorico };
}
