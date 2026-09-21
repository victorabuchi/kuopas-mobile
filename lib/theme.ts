export const colors = {
  bg: '#f5f6f8',
  card: '#fff',
  border: '#d8dbe0',
  hairline: '#eceef1',
  text: '#111',
  body: '#2c2f36',
  muted: '#5b616e',
  faint: '#8a8f98',
  accent: '#046a38',
  accentSoft: '#e9f4ee',
  danger: '#b3261e',
  chip: '#e9ebee',
  warn: '#b26a00',
  warnSoft: '#fff3dc',
};

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
