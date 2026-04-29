import { getHiddenCellsMap, getStep } from "./range-utils";

// --- MOCKING GOOGLE APPS SCRIPT ---
// This factory creates a fake GAS Range object that satisfies TypeScript
// and provides exactly the data our function needs to run.
function createMockRange(
    row: number,
    col: number,
    numRows: number,
    numCols: number,
    merges: { row: number; col: number; numRows: number; numCols: number }[] = [],
    // biome-ignore lint/suspicious/noExplicitAny: Testing
): any {
    return {
        getRow: () => row,
        getColumn: () => col,
        getNumRows: () => numRows,
        getNumColumns: () => numCols,
        // Recursively mock the merged ranges too!
        getMergedRanges: () => merges.map((m) => createMockRange(m.row, m.col, m.numRows, m.numCols)),
    };
}

describe("Range Utilities", () => {
    describe("getStep (Mathematical Coprime Jumping)", () => {
        it("should calculate the correct step size to avoid repeating", () => {
            // Testing various array sizes to ensure the step size
            // is coprime to n and close to n/2
            expect(getStep(1)).toBe(0);
            expect(getStep(2)).toBe(1);
            expect(getStep(3)).toBe(1);
            expect(getStep(4)).toBe(1);
            expect(getStep(5)).toBe(2); // 2 is coprime to 5
            expect(getStep(6)).toBe(1); // 3 and 2 are not coprime to 6, so it falls back to 1
            expect(getStep(7)).toBe(3); // 3 is coprime to 7
            expect(getStep(10)).toBe(3); // 5, 4, 6, 2 are not coprime. 3 is!
        });

        it("should allow a full loop without hitting the same index twice", () => {
            const n = 10;
            const step = getStep(n); // For 10, step is 3
            const visited = new Set<number>();

            let current = 0;
            for (let i = 0; i < n; i++) {
                visited.add(current);
                current = (current + step) % n;
            }

            // If the step is truly coprime, we should have visited exactly 10 unique indices
            expect(visited.size).toBe(n);
        });
    });

    describe("getHiddenCellsMap", () => {
        it("should return an all-false map if there are no merged cells", () => {
            // A 3x3 grid starting at A1 (1, 1)
            const range = createMockRange(1, 1, 3, 3);
            const { hiddenMap, visibleCount } = getHiddenCellsMap(range);

            expect(visibleCount).toBe(9);
            expect(hiddenMap).toEqual([
                [false, false, false],
                [false, false, false],
                [false, false, false],
            ]);
        });

        it("should correctly map a single merged block inside the range", () => {
            // A 3x3 grid. The top-left 2x2 area is merged.
            const range = createMockRange(1, 1, 3, 3, [{ row: 1, col: 1, numRows: 2, numCols: 2 }]);

            const { hiddenMap, visibleCount } = getHiddenCellsMap(range);

            // 9 total - 3 hidden by the merge = 6 visible
            expect(visibleCount).toBe(6);
            expect(hiddenMap).toEqual([
                [false, true, false], // [0][0] is the anchor, [0][1] is hidden
                [true, true, false], // [1][0] and [1][1] are hidden
                [false, false, false],
            ]);
        });

        it("should handle multiple overlapping merged blocks perfectly", () => {
            // A 4x4 grid.
            // Merge 1: Top-right 2x2
            // Merge 2: Bottom-left 2x2
            const range = createMockRange(1, 1, 4, 4, [
                { row: 1, col: 3, numRows: 2, numCols: 2 },
                { row: 3, col: 1, numRows: 2, numCols: 2 },
            ]);

            const { hiddenMap, visibleCount } = getHiddenCellsMap(range);

            // 16 total - 3 (from merge 1) - 3 (from merge 2) = 10
            expect(visibleCount).toBe(10);
            expect(hiddenMap).toEqual([
                [false, false, false, true], // Col 3 is anchor, Col 4 is hidden
                [false, false, true, true],
                [false, true, false, false], // Row 3 Col 1 is anchor
                [true, true, false, false],
            ]);
        });

        it("should safely ignore merged cells that bleed outside the active range bounds", () => {
            // Active range: 2x2 starting at row 3, col 3 (C3:D4)
            // Merge: A massive 5x5 block starting at row 1, col 1 (A1:E5)
            // The anchor (1,1) is completely outside our active range!
            const range = createMockRange(3, 3, 2, 2, [{ row: 1, col: 1, numRows: 5, numCols: 5 }]);

            const { hiddenMap, visibleCount } = getHiddenCellsMap(range);

            // Because the top-left anchor of this massive merge isn't in our 2x2 range,
            // every single cell inside our 2x2 range is considered "hidden" by the merge.
            expect(visibleCount).toBe(0);
            expect(hiddenMap).toEqual([
                [true, true],
                [true, true],
            ]);
        });
    });
});
