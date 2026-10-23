// Funções puras (sem React / Expo) para o cálculo de consumo.
// Ficam separadas das telas para poderem ser testadas com Node.

/** Converte texto digitado ("12,5", " 40 ") em número. Retorna NaN se inválido. */
export function lerNumero(texto) {
  if (typeof texto !== 'string') return NaN;
  const limpo = texto.trim().replace(',', '.');
  if (limpo === '' || !/^\d*\.?\d+$|^\d+\.$/.test(limpo)) return NaN;
  return parseFloat(limpo);
}

/**
 * Calcula o consumo médio em km/L.
 * Retorna { ok: true, kmPorLitro } ou { ok: false, erro }.
 */
export function calcularConsumo(distanciaTexto, litrosTexto) {
  if (String(distanciaTexto).trim() === '' || String(litrosTexto).trim() === '') {
    return { ok: false, erro: 'Preencha a distância e os litros.' };
  }
  const distancia = lerNumero(String(distanciaTexto));
  const litros = lerNumero(String(litrosTexto));
  if (Number.isNaN(distancia) || Number.isNaN(litros) || distancia <= 0 || litros <= 0) {
    return { ok: false, erro: 'Digite valores numéricos maiores que zero.' };
  }
  const kmPorLitro = distancia / litros;
  return { ok: true, distancia, litros, kmPorLitro, classificacao: classificarConsumo(kmPorLitro) };
}

/** Classificação simples e informativa do consumo (carros de passeio). */
export function classificarConsumo(kmPorLitro) {
  if (kmPorLitro >= 14) return 'Econômico';
  if (kmPorLitro >= 9) return 'Moderado';
  return 'Alto consumo';
}

/** Formata número no padrão brasileiro: 12,35 */
export function formatarNumero(valor, casas = 2) {
  return Number(valor).toFixed(casas).replace('.', ',');
}
