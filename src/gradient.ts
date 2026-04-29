import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "./color-utils";
import { getHiddenCellsMap, getStep } from "./range-utils";

/**
 * Fill the current range with a gradien, using the color from the first and last cell.
 * The color interpolation is done in HSL space.
 */
export function fillGradient() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const range = sheet.getActiveRange();

    if (!range) return;

    const numRows = range.getNumRows();
    const numCols = range.getNumColumns();

    const startColor = range.getBackground(); // Top left cell
    const endColor = range.getCell(numRows, numCols).getBackground();

    const startRGB = hexToRgb(startColor);
    const endRGB = hexToRgb(endColor);

    if (!startRGB || !endRGB) return;

    const startHSL = rgbToHsl(startRGB);
    const endHSL = rgbToHsl(endRGB);

    const colors: string[][] = [];
    for (let row = 0; row < numRows; row++) {
        const rowColors: string[] = [];

        for (let col = 0; col < numCols; col++) {
            const tRow = numRows > 1 ? row / (numRows - 1) : 0;
            const tCol = numCols > 1 ? col / (numCols - 1) : 0;

            let t: number;
            if (numRows > 1 && numCols > 1) {
                t = (tRow + tCol) / 2;
            } else if (numRows > 1) {
                t = tRow;
            } else if (numCols > 1) {
                t = tCol;
            } else {
                t = 0;
            }

            let dh = endHSL.h - startHSL.h;
            dh = ((((dh + 0.5) % 1) + 1) % 1) - 0.5;

            let h = startHSL.h + t * dh;
            if (h < 0) h += 1;
            if (h >= 1) h -= 1;

            const s = startHSL.s + t * (endHSL.s - startHSL.s);
            const l = startHSL.l + t * (endHSL.l - startHSL.l);

            const rgb = hslToRgb({ h, s, l });
            rowColors.push(rgbToHex(rgb));
        }
        colors.push(rowColors);
    }

    range.setBackgrounds(colors);
}

/**
 * Fills the current range's background with colors so that adjacent cells have distinct colors.
 * The colors all have the same saturation and luminosity as the first cell, only the hue changes.
 * Focused on rows or columns
 */
export function colorDistinctCells() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const range = sheet.getActiveRange();

    if (!range) return;

    const numRows = range.getNumRows();
    const numCols = range.getNumColumns();

    const { hiddenMap, visibleCount } = getHiddenCellsMap(range);

    if (visibleCount === 0) return;

    const baseColor = range.getBackground();
    const baseRGB = hexToRgb(baseColor);

    if (!baseRGB) return;

    const baseHSL = rgbToHsl(baseRGB);
    const l = baseHSL.l;
    const s = baseHSL.s || 0.7;

    const step = getStep(visibleCount);

    let k = 0;

    const colors = Array.from({ length: numRows }, (_, r) => {
        const hiddenRow = hiddenMap[r];
        if (!hiddenRow) return Array<string | null>(numCols).fill(null);

        return Array.from({ length: numCols }, (_, c) => {
            if (hiddenRow[c]) return null;
            const h = ((k * step) % visibleCount) / visibleCount;
            k++;
            const rgb = hslToRgb({ h, s, l });
            return rgbToHex(rgb);
        });
    });

    range.setBackgrounds(colors);
}

/**
 * Fills the current range's background with colors so that adjacent cells have distinct colors.
 * The colors all have the same saturation and luminosity as the first cell, only the hue changes.
 * Focused on grids.
 */
export function colorDistinctGrid() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const range = sheet.getActiveRange();

    if (!range) return;

    const numRows = range.getNumRows();
    const numCols = range.getNumColumns();

    const { hiddenMap } = getHiddenCellsMap(range);

    const baseColor = range.getBackground();
    const baseRGB = hexToRgb(baseColor);

    if (!baseRGB) return;

    const baseHSL = rgbToHsl(baseRGB);
    const l = baseHSL.l;
    const s = baseHSL.s || 0.7;

    const phi1 = 0.6180339887;
    const phi2 = 0.7548776662;

    const colors = Array.from({ length: numRows }, (_, r) => {
        const hiddenMapRow = hiddenMap[r];

        if (!hiddenMapRow) return Array<string | null>(numCols).fill(null);

        return Array.from({ length: numCols }, (_, c) => {
            if (hiddenMapRow[c]) return null;

            const h = (r * phi1 + c * phi2) % 1;
            const rgb = hslToRgb({ h, s, l });
            return rgbToHex(rgb);
        });
    });

    range.setBackgrounds(colors);
}
