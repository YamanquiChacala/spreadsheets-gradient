interface rgbColor {
    r: number;
    g: number;
    b: number;
}

interface hslColor {
    h: number;
    s: number;
    l: number;
}

/**
 * Transform a Hex color into it's rgb [0,1] componenet.
 */
export function hexToRgb(hex: string): rgbColor | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!match) return null;

    const [, r, g, b] = match;
    if (!r || !g || !b) return null;

    return {
        r: parseInt(r, 16) / 255,
        g: parseInt(g, 16) / 255,
        b: parseInt(b, 16) / 255,
    };
}

/**
 * Transforms an rgb color into a hsl color.
 */
export function rgbToHsl({ r, g, b }: rgbColor): hslColor {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
        s = 0,
        l = (max + min) / 2;

    // Not grey
    if (max !== min) {
        const dist = max - min;
        s = l > 0.5 ? dist / (2 - max - min) : dist / (max + min);
        switch (max) {
            case r:
                h = (g - b) / dist + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / dist + 2;
                break;
            case b:
                h = (r - g) / dist + 4;
                break;
        }
        h /= 6;
    }
    return { h, s, l };
}

/**
 * Transforms an hsl color into an rgb color.
 */
export function hslToRgb({ h, s, l }: hslColor): rgbColor {
    let r: number, g: number, b: number;
    if (s === 0) {
        r = g = b = l; // gray
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r, g: g, b: b };
}

function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

/**
 * Transfroms an rgb color to it's hex representation.
 */
export function rgbToHex({ r, g, b }: rgbColor): string {
    return (
        "#" +
        [r, g, b]
            .map((x) => {
                var h = Math.round(x * 255).toString(16);
                return h.length === 1 ? `0${h}` : h;
            })
            .join("")
    );
}
