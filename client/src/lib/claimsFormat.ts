export const toFixed = (num: string) => {
  const parseNumber = parseFloat(num).toFixed(2);
  return parseFloat(parseNumber).toLocaleString();
}
