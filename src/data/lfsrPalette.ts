/**
 * One colour per quantity, used identically in every figure, every formula and
 * every inline component of this lesson.
 *
 *   tap      taps, XOR gate, tap-polynomial coefficients
 *   state    the register contents and the bit fed back into the front cell
 *   output   the emitted bit and the keystream it builds up
 *   period   clock ticks and cycle length
 *   degree   the number of cells, n
 *   message  plaintext bits
 *   cipher   scrambled bits on the wire
 */
export const LFSR = {
    tap: '#62D0AD',
    state: '#AC8BF9',
    output: '#8E90F5',
    period: '#F7B23B',
    degree: '#62CCF9',
    message: '#F8A0CD',
    cipher: '#F4A89A',
    ink: '#64748B',
    inkDark: '#334155',
    paper: '#F1F5F9',
    rest: '#E2E8F0',
} as const;

/** 15% wash of a hex colour, for inline backgrounds. */
export const wash = (hex: string, alpha = 0.15): string => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** The four bits of a 4-bit state, front cell first. */
export const bitsOfState = (state: number): number[] =>
    [3, 2, 1, 0].map((shift) => (state >> shift) & 1);

/** Pack four bits, front cell first, back into a number 0-15. */
export const stateOfBits = (bits: number[]): number =>
    bits.reduce((acc, bit) => (acc << 1) | (bit & 1), 0);

/** Cell i (1-based) is tapped when bit i-1 of the mask is set. */
export const tapsOfMask = (mask: number): number[] =>
    [0, 1, 2, 3].map((index) => (mask >> index) & 1);

/** Render a tap mask as its tap polynomial, e.g. 1 + x + x⁴. */
export const tapPolynomial = (mask: number): string => {
    const superscripts = ['', '', '²', '³', '⁴'];
    const terms = [1, 2, 3, 4]
        .filter((cell) => (mask >> (cell - 1)) & 1)
        .map((cell) => `x${superscripts[cell]}`);
    return ['1', ...terms].join(' + ');
};
