export function parseBrazilianNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (value === null || value === undefined || value === '') return 0;

  const normalizedValue = String(value).trim().replace(/\s/g, '');
  if (!normalizedValue) return 0;

  let numericValue = normalizedValue;

  if (normalizedValue.includes(',')) {
    numericValue = normalizedValue.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(normalizedValue)) {
    numericValue = normalizedValue.replace(/\./g, '');
  }

  const parsedValue = Number(numericValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function formatBrazilianNumber(value, fractionDigits = 2) {
  return parseBrazilianNumber(value).toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
}
