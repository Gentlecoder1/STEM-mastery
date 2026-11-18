const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
  d: 'ᵈ',
  e: 'ᵉ',
  f: 'ᶠ',
  g: 'ᵍ',
  h: 'ʰ',
  i: 'ⁱ',
  j: 'ʲ',
  k: 'ᵏ',
  l: 'ˡ',
  m: 'ᵐ',
  n: 'ⁿ',
  o: 'ᵒ',
  p: 'ᵖ',
  r: 'ʳ',
  s: 'ˢ',
  t: 'ᵗ',
  u: 'ᵘ',
  v: 'ᵛ',
  w: 'ʷ',
  x: 'ˣ',
  y: 'ʸ',
  z: 'ᶻ',
};

function toSuperscript(value: string): string | null {
  let converted = '';
  for (const character of value) {
    const superscript = SUPERSCRIPTS[character];
    if (!superscript) return null;
    converted += superscript;
  }
  return converted;
}

export function prettyMath(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/\^\(([^()\r\n]{1,12})\)/g, (original, exponent: string) =>
      toSuperscript(exponent) ?? original,
    )
    .replace(/\^(-?[0-9a-z]{1,3})(?![0-9a-z])/gi, (original, exponent: string) =>
      toSuperscript(exponent) ?? original,
    )
    .replace(/<->/g, '↔')
    .replace(/->/g, '→');
}

export type TextLine =
  | { kind: 'bullet' | 'text' | 'gap'; text: string }
  | { kind: 'label'; label: string; text: string };

export function splitLessonLines(text: string): TextLine[] {
  return prettyMath(text)
    .split('\n')
    .map((raw): TextLine => {
      const line = raw.trim();
      if (!line) return { kind: 'gap', text: '' };
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return { kind: 'bullet', text: line.slice(2) };
      }

      const labelled = /^(Question|Answer|Step \d+|Example|Note):\s*(.*)$/i.exec(line);
      if (labelled) {
        return {
          kind: 'label',
          label: labelled[1],
          text: labelled[2],
        };
      }
      return { kind: 'text', text: line };
    });
}
