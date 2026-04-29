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

    // Prevent division by zero if it's a single cell
    if (numRows <= 1 && numCols <= 1) return;

    const startColor = range.getBackground(); // Top left cell

    const brCell = range.getCell(numRows, numCols);
    const endColor = brCell.isPartOfMerge() ? (brCell.getMergedRanges()?.[0]?.getBackground() ?? brCell.getBackground()) : brCell.getBackground();

    const startRGB = hexToRgb(startColor);
    const endRGB = hexToRgb(endColor);

    if (!startRGB || !endRGB) return;

    const startHSL = rgbToHsl(startRGB);
    const endHSL = rgbToHsl(endRGB);

    const rangeRowStart = range.getRow();
    const rangeColStart = range.getColumn();

    // ✨ Build a map to intercept merged cells and find their true center
    const mergeMap = new Map<string, { rCenter: number; cCenter: number }>();

    for (const mergedRange of range.getMergedRanges()) {
        // Calculate the top-left coordinate relative to our active range
        const r = mergedRange.getRow() - rangeRowStart;
        const c = mergedRange.getColumn() - rangeColStart;

        // Calculate the center point.
        // e.g., a 3x3 merge at 0,0 has its center at 1,1
        const rCenter = r + (mergedRange.getNumRows() - 1) / 2;
        const cCenter = c + (mergedRange.getNumColumns() - 1) / 2;

        mergeMap.set(`${r},${c}`, { rCenter, cCenter });
    }

    // ✨ Generate the grid using pure array mapping
    const colors = Array.from({ length: numRows }, (_, r) =>
        Array.from({ length: numCols }, (_, c) => {
            // If this cell is the anchor of a merge, use its computed center.
            // Otherwise, just use the normal r and c.
            const mergeCenter = mergeMap.get(`${r},${c}`);
            const rCalc = mergeCenter ? mergeCenter.rCenter : r;
            const cCalc = mergeCenter ? mergeCenter.cCenter : c;

            const tRow = numRows > 1 ? rCalc / (numRows - 1) : 0;
            const tCol = numCols > 1 ? cCalc / (numCols - 1) : 0;

            let t: number;
            if (numRows > 1 && numCols > 1) {
                t = (tRow + tCol) / 2;
            } else if (numRows > 1) {
                t = tRow;
            } else {
                t = tCol;
            }

            // Defensive clamping: if a user selection cuts through a massive merged cell,
            // the true center might mathematically land outside the [0, 1] bounds.
            t = Math.max(0, Math.min(1, t));

            let dh = endHSL.h - startHSL.h;
            dh = ((((dh + 0.5) % 1) + 1) % 1) - 0.5;

            let h = startHSL.h + t * dh;
            if (h < 0) h += 1;
            if (h >= 1) h -= 1;

            const s = startHSL.s + t * (endHSL.s - startHSL.s);
            const l = startHSL.l + t * (endHSL.l - startHSL.l);

            const rgb = hslToRgb({ h, s, l });
            return rgbToHex(rgb);
        }),
    );

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

    const hueOffset = Math.random();

    let k = 0;

    const colors = Array.from({ length: numRows }, (_, r) => {
        const hiddenRow = hiddenMap[r];
        if (!hiddenRow) return Array<string | null>(numCols).fill(null);

        return Array.from({ length: numCols }, (_, c) => {
            if (hiddenRow[c]) return null;
            const h = (((k * step) % visibleCount) / visibleCount + hueOffset) % 1;
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

    const hueOffset = Math.random();

    const colors = Array.from({ length: numRows }, (_, r) => {
        const hiddenMapRow = hiddenMap[r];

        if (!hiddenMapRow) return Array<string | null>(numCols).fill(null);

        return Array.from({ length: numCols }, (_, c) => {
            if (hiddenMapRow[c]) return null;

            const h = (r * phi1 + c * phi2 + hueOffset) % 1;
            const rgb = hslToRgb({ h, s, l });
            return rgbToHex(rgb);
        });
    });

    range.setBackgrounds(colors);
}
