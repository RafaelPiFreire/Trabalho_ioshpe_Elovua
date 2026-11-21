export async function resolve(especificador, contexto, proximo) {
  try {
    return await proximo(especificador, contexto);
  } catch (erro) {
    if (erro.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\//.test(especificador)) {
      return proximo(`${especificador}.js`, contexto);
    }
    throw erro;
  }
}
