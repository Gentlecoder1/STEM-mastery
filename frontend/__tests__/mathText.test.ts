import { prettyMath, splitLessonLines } from '../src/lib/mathText';

describe('prettyMath', () => {
  it('renders simple and grouped powers as superscripts', () => {
    expect(prettyMath('a^m x a^n = a^(m+n)')).toBe('aᵐ x aⁿ = aᵐ⁺ⁿ');
    expect(prettyMath('1 kWh = 3.6 x 10^6 J and 10^-6 m')).toBe(
      '1 kWh = 3.6 x 10⁶ J and 10⁻⁶ m',
    );
  });

  it('preserves powers it cannot safely convert', () => {
    expect(prettyMath('8^(2/3) = 4')).toBe('8^(2/3) = 4');
  });

  it('converts one-way and two-way arrows', () => {
    expect(prettyMath('p -> q and p <-> q')).toBe('p → q and p ↔ q');
  });

  it('handles empty input', () => {
    expect(prettyMath(null)).toBe('');
    expect(prettyMath('')).toBe('');
  });
});

describe('splitLessonLines', () => {
  it('detects bullets, labels, paragraphs, and blank gaps', () => {
    const lines = splitLessonLines(
      '• First point\n• Second\n\nQuestion: Simplify a^5 x a^3.\nAnswer: a^8',
    );

    expect(lines.map((line) => line.kind)).toEqual([
      'bullet',
      'bullet',
      'gap',
      'label',
      'label',
    ]);
    expect(lines[3]).toEqual({
      kind: 'label',
      label: 'Question',
      text: 'Simplify a⁵ x a³.',
    });
    expect(lines[4]).toEqual({ kind: 'label', label: 'Answer', text: 'a⁸' });
  });

  it('recognizes numbered steps without treating ordinary lines as labels', () => {
    expect(splitLessonLines('Step 2: Substitute the values.\nA normal paragraph')).toEqual([
      { kind: 'label', label: 'Step 2', text: 'Substitute the values.' },
      { kind: 'text', text: 'A normal paragraph' },
    ]);
  });
});
