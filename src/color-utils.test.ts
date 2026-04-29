import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "./color-utils"; // Update path as needed

describe("Color Conversion Utilities", () => {
    describe("hexToRgb", () => {
        it("should correctly convert standard 6-character hex codes", () => {
            expect(hexToRgb("#ff0000")).toEqual({ r: 1, g: 0, b: 0 });
            expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 1, b: 0 });
            expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 1 });
            expect(hexToRgb("#ffffff")).toEqual({ r: 1, g: 1, b: 1 });
            expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
        });

        it("should work without the # prefix", () => {
            expect(hexToRgb("ff0000")).toEqual({ r: 1, g: 0, b: 0 });
        });

        it("should handle case insensitivity", () => {
            expect(hexToRgb("#FF0000")).toEqual({ r: 1, g: 0, b: 0 });
            expect(hexToRgb("#fF0000")).toEqual({ r: 1, g: 0, b: 0 });
        });

        it("should return null for invalid hex strings", () => {
            expect(hexToRgb("#ff00")).toBeNull(); // Too short
            expect(hexToRgb("#ff000000")).toBeNull(); // Too long
            expect(hexToRgb("#gg0000")).toBeNull(); // Invalid characters
            expect(hexToRgb("randomString")).toBeNull();
        });
    });

    describe("rgbToHex", () => {
        it("should correctly convert RGB [0,1] objects to hex", () => {
            expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe("#ff0000");
            expect(rgbToHex({ r: 0, g: 1, b: 0 })).toBe("#00ff00");
            expect(rgbToHex({ r: 0, g: 0, b: 1 })).toBe("#0000ff");
        });

        it("should correctly pad single-character hex values with a leading zero", () => {
            // 15/255 ≈ 0.0588, which should be '0f' in hex
            expect(rgbToHex({ r: 15 / 255, g: 0, b: 0 })).toBe("#0f0000");
        });
    });

    describe("rgbToHsl", () => {
        it("should correctly convert primary colors", () => {
            expect(rgbToHsl({ r: 1, g: 0, b: 0 })).toEqual({ h: 0, s: 1, l: 0.5 }); // Red
            expect(rgbToHsl({ r: 0, g: 1, b: 0 })).toEqual({ h: 1 / 3, s: 1, l: 0.5 }); // Green
            expect(rgbToHsl({ r: 0, g: 0, b: 1 })).toEqual({ h: 2 / 3, s: 1, l: 0.5 }); // Blue
        });

        it("should correctly handle grayscale (saturation = 0)", () => {
            expect(rgbToHsl({ r: 0.5, g: 0.5, b: 0.5 })).toEqual({ h: 0, s: 0, l: 0.5 });
            expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 }); // Black
            expect(rgbToHsl({ r: 1, g: 1, b: 1 })).toEqual({ h: 0, s: 0, l: 1 }); // White
        });
    });

    describe("hslToRgb", () => {
        it("should correctly convert primary colors", () => {
            expect(hslToRgb({ h: 0, s: 1, l: 0.5 })).toEqual({ r: 1, g: 0, b: 0 });
            expect(hslToRgb({ h: 1 / 3, s: 1, l: 0.5 })).toEqual({ r: 0, g: 1, b: 0 });
            expect(hslToRgb({ h: 2 / 3, s: 1, l: 0.5 })).toEqual({ r: 0, g: 0, b: 1 });
        });

        it("should correctly handle grayscale inputs", () => {
            expect(hslToRgb({ h: 0.5, s: 0, l: 0.5 })).toEqual({ r: 0.5, g: 0.5, b: 0.5 });
        });
    });

    describe("Round Trip Conversions (Hex -> RGB -> HSL -> RGB -> Hex)", () => {
        // A robust list covering primaries, darks, lights, pastels, and grayscales
        const testColors = [
            "#ff0000", // Red
            "#00ff00", // Green
            "#0000ff", // Blue
            "#ffffff", // White
            "#000000", // Black
            "#808080", // Gray
            "#f2a65a", // Random pastel orange
            "#4ca5d9", // Random light blue
            "#0a1b2c", // Very dark color
            "#fdfdfd", // Very light, almost white
        ];

        // test.each creates an individual test case for every item in the array
        test.each(testColors)("should return %s after a full conversion cycle", (hex) => {
            // 1. Hex to RGB
            const rgb1 = hexToRgb(hex);
            expect(rgb1).not.toBeNull(); // Guard against bad parsing

            // 2. RGB to HSL
            // biome-ignore lint/style/noNonNullAssertion: Testing
            const hsl = rgbToHsl(rgb1!);

            // 3. HSL back to RGB
            const rgb2 = hslToRgb(hsl);

            // 4. RGB back to Hex
            const finalHex = rgbToHex(rgb2);

            expect(finalHex).toBe(hex);
        });
    });
});
