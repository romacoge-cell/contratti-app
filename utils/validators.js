// utils/validators.js

/**
 * Valida la Partita IVA italiana (Algoritmo di Luhn)
 */
export const validaPIVA = (piva) => {
  if (!piva) return true; 
  if (!/^[0-9]{11}$/.test(piva)) return false;
  let s = 0;
  for (let i = 0; i < 11; i++) {
    let n = parseInt(piva[i]);
    if ((i + 1) % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    s += n;
  }
  return s % 10 === 0;
};

/**
 * Valida l'IBAN italiano (Standard ISO 13616)
 */
export const validaIBAN = (iban) => {
  if (!iban) return true;
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  if (!/^IT[0-9]{2}[A-Z][0-9]{10}[A-Z0-9]{12}$/.test(cleanIban)) return false;
  
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numeric = rearranged.split('').map(char => {
    const code = char.charCodeAt(0);
    return code >= 65 && code <= 90 ? (code - 55).toString() : char;
  }).join('');

  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97) + remainder.slice(block.length);
  }
  return parseInt(remainder, 10) % 97 === 1;
};