/**
 * Identify cells hidden by merges.
 * Returns a 2D array (boolean) matching the active range.
 * True = hidden by a merge. False = visible (unmerged or top-left of a merge).
 */
export function getHiddenCellsMap(range: GoogleAppsScript.Spreadsheet.Range): { hiddenMap: boolean[][]; visibleCount: number } {
    const numRows = range.getNumRows();
    const numCols = range.getNumColumns();
    const startRow = range.getRow();
    const startCol = range.getColumn();

    const hiddenMap = Array.from({ length: numRows }, () => Array<boolean>(numCols).fill(false));

    const merges = range.getMergedRanges();

    let visibleCount = numRows * numCols;

    merges.forEach((merge) => {
        const mRow = merge.getRow();
        const mCol = merge.getColumn();
        const mRows = merge.getNumRows();
        const mCols = merge.getNumColumns();

        for (let r = 0; r < mRows; r++) {
            for (let c = 0; c < mCols; c++) {
                if (r === 0 && c === 0) continue; // Top-left cell is always visible

                const localR = mRow + r - startRow;
                const localC = mCol + c - startCol;

                if (localR >= 0 && localR < numRows && localC >= 0 && localC < numCols && hiddenMap[localR]) {
                    hiddenMap[localR][localC] = true;
                    visibleCount--;
                }
            }
        }
    });

    return { hiddenMap, visibleCount };
}

/**
 * Calculates how much to move in a circle of `n` elements to go over every element without repeating, while jumping as much as possible.
 */
export function getStep(n: number) {
    const target = Math.floor(n / 2);
    for (let delta = 0; delta <= target; delta++) {
        const k1 = target - delta;
        const k2 = target + delta;

        if (k1 > 0 && gcd(n, k1) === 1) {
            return k1;
        }
        if (k2 < n && gcd(n, k2) === 1) {
            return k2;
        }
    }
    return 1;
}

/**
 * Calculates the grates common denominator.
 */
function gcd(a: number, b: number) {
    while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}
