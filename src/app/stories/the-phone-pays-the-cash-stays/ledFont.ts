// A 5-row pixel font for the LED scroller on the wall of phones: capitals, digits and a few marks. Each glyph is five
// rows, top to bottom, of three to five pixels ("1" lit). The wall's cells are twice as tall as they are wide, so the
// scene draws each font column across two cells of the wall, which makes every pixel square.

const G : Record<string, string> = {
    A : "010 101 111 101 101", B : "110 101 110 101 110", C : "011 100 100 100 011", D : "110 101 101 101 110",
    E : "111 100 110 100 111", F : "111 100 110 100 100", G : "011 100 101 101 011", H : "101 101 111 101 101",
    I : "111 010 010 010 111", J : "001 001 001 101 010", K : "101 101 110 101 101", L : "100 100 100 100 111",
    M : "10001 11011 10101 10001 10001", N : "1001 1101 1011 1001 1001", O : "010 101 101 101 010",
    P : "110 101 110 100 100", Q : "010 101 101 110 011", R : "110 101 110 101 101", S : "011 100 010 001 110",
    T : "111 010 010 010 010", U : "101 101 101 101 111", V : "101 101 101 101 010",
    W : "10001 10001 10101 11011 10001", X : "101 101 010 101 101", Y : "101 101 010 010 010",
    Z : "111 001 010 100 111",
    0 : "111 101 101 101 111", 1 : "010 110 010 010 111", 2 : "110 001 010 100 111", 3 : "110 001 010 001 110",
    4 : "101 101 111 001 001", 5 : "111 100 110 001 110", 6 : "011 100 111 101 111", 7 : "111 001 010 010 010",
    8 : "111 101 111 101 111", 9 : "111 101 111 001 110",
    "," : "0 0 0 1 1", "." : "0 0 0 0 1", "·" : "0 0 1 0 0", "~" : "0000 0101 1010 0000 0000", " " : "00 00 00 00 00",
};
export const LED_ROWS = 5;

// The text as columns of five pixels, a blank column between letters: columns[x][row], row 0 at the top.
export function ledColumns(text : string) : boolean[][] {
    const cols : boolean[][] = [];
    for (const ch of text.toUpperCase()) {
        const rows = (G[ch] ?? G[" "]).split(" ");
        for (let x = 0; x < rows[0].length; x++) cols.push(rows.map(r => r[x] === "1"));
        cols.push(Array(LED_ROWS).fill(false));
    }
    return cols;
}

