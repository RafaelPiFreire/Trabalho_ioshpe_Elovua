// Validações do cadastro/login (funções puras, testáveis com Node).

export function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizarEmail(email));
}

/** Retorna uma mensagem de erro (string) ou null se o cadastro estiver válido. */
export function validarCadastro({ nome, email, senha, confirmarSenha }) {
  if (!String(nome || '').trim() || !String(email || '').trim() || !senha || !confirmarSenha) {
    return 'Preencha todos os campos.';
  }
  if (!emailValido(email)) return 'Digite um e-mail válido.';
  if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (senha !== confirmarSenha) return 'As senhas não coincidem.';
  return null;
}

export function validarLogin({ email, senha }) {
  if (!String(email || '').trim() || !senha) return 'Preencha o e-mail e a senha.';
  return null;
}
