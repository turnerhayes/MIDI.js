"use strict";
/*
  ----------------------------------------------------------
  Color Space : 1.2 : 2012.11.06
  ----------------------------------------------------------
  https://github.com/mudcube/Color.Space.js
  ----------------------------------------------------------
  RGBA <-> HSLA  <-> W3
  RGBA <-> HSVA
  RGBA <-> CMY   <-> CMYK
  RGBA <-> HEX24 <-> W3
  RGBA <-> HEX32
  RGBA <-> W3
  ----------------------------------------------------------
  Examples
  ----------------------------------------------------------
  Color.Space(0x99ff0000, "HEX32>RGBA>HSLA>W3"); // outputs "hsla(60,100%,17%,0.6)"
  Color.Space(0xFF0000, "HEX24>RGB>HSL"); // convert hex24 to HSL object.
  ----------------------------------------------------------
  W3 values
  ----------------------------------------------------------
  rgb(255,0,0)
  rgba(255,0,0,1)
  rgb(100%,0%,0%)
  rgba(100%,0%,0%,1)
  hsl(120, 100%, 50%)
  hsla(120, 100%, 50%, 1)
  #000000
  ----------------------------------------------------------
*/
exports.__esModule = true;
var useEval = false; // caches functions for quicker access.
var functions = {
// holds generated cached conversion functions.
};
var shortcuts = {
    "HEX24>CMYK": "HEX24>RGB>CMY>CMYK",
    "HEX24>HSL": "HEX24>RGB>HSL",
    "HEX32>HSLA": "HEX32>RGBA>HSLA",
    "RGB>CMYK": "RGB>CMY>CMYK"
};
// tslint:disable-next-line:variable-name
var ColorSpace = function (color, route) {
    if (shortcuts[route]) { // shortcut available
        route = shortcuts[route];
    }
    var r = route.split(">");
    // check whether color is an [], if so, convert to {}
    if (typeof color === "object" && color[0] >= 0) { // array
        var type = r[0];
        var tmp = {};
        for (var i = 0; i < type.length; i++) {
            var str = type.substr(i, 1);
            tmp[str] = color[i];
        }
        color = tmp;
    }
    if (functions[route]) { // cached function available
        return functions[route](color);
    }
    var f = "color";
    for (var pos = 1, key = r[0]; pos < r.length; pos++) {
        if (pos > 1) { // recycle previous
            key = key.substr(key.indexOf("_") + 1);
        }
        key += (pos === 0 ? "" : "_") + r[pos];
        color = ColorSpace[key](color);
        if (useEval) {
            f = "ColorSpace." + key + "(" + f + ")";
        }
    }
    if (useEval) {
        // tslint:disable-next-line:no-eval
        functions[route] = eval("(function(color) { return " + f + " })");
    }
    return color;
};
// W3C - RGB + RGBA
ColorSpace.RGB_W3 = function (o) {
    // tslint:disable-next-line:no-bitwise
    return "rgb(" + (o.R >> 0) + "," + (o.G >> 0) + "," + (o.B >> 0) + ")";
};
ColorSpace.RGBA_W3 = function (o) {
    var alpha = typeof o.A === "number" ? o.A / 255 : 1;
    // tslint:disable-next-line:no-bitwise
    return "rgba(" + (o.R >> 0) + "," + (o.G >> 0) + "," + (o.B >> 0) + "," + alpha + ")";
};
ColorSpace.W3_RGB = function (o) {
    o = o.substr(4, o.length - 5).split(",");
    return {
        R: parseInt(o[0], 10),
        // tslint:disable-next-line:object-literal-sort-keys
        G: parseInt(o[1], 10),
        B: parseInt(o[2], 10)
    };
};
ColorSpace.W3_RGBA = function (o) {
    o = o.substr(5, o.length - 6).split(",");
    return {
        R: parseInt(o[0], 10),
        // tslint:disable-next-line:object-literal-sort-keys
        G: parseInt(o[1], 10),
        B: parseInt(o[2], 10),
        A: parseFloat(o[3]) * 255
    };
};
// W3C - HSL + HSLA
ColorSpace.HSL_W3 = function (o) {
    // tslint:disable-next-line:no-bitwise
    return "hsl(" + ((o.H + 0.5) >> 0) + "," + ((o.S + 0.5) >> 0) + "%," + ((o.L + 0.5) >> 0) + "%)";
};
ColorSpace.HSLA_W3 = function (o) {
    var alpha = typeof o.A === "number" ? o.A / 255 : 1;
    // tslint:disable-next-line:no-bitwise
    return "hsla(" + ((o.H + 0.5) >> 0) + "," + ((o.S + 0.5) >> 0) + "%," + ((o.L + 0.5) >> 0) + "%," + alpha + ")";
};
ColorSpace.W3_HSL = function (o) {
    o = o.substr(4, o.length - 5).split(",");
    return {
        H: parseInt(o[0], 10),
        S: parseInt(o[1], 10),
        // tslint:disable-next-line:object-literal-sort-keys
        L: parseInt(o[2], 10)
    };
};
ColorSpace.W3_HSLA = function (o) {
    o = o.substr(5, o.length - 6).split(",");
    return {
        H: parseInt(o[0], 10),
        S: parseInt(o[1], 10),
        // tslint:disable-next-line:object-literal-sort-keys
        L: parseInt(o[2], 10),
        A: parseFloat(o[3]) * 255
    };
};
// W3 HEX = "FFFFFF" | "FFFFFFFF"
ColorSpace.W3_HEX = ColorSpace.W3_HEX24 = function (o) {
    if (o.substr(0, 1) === "#") {
        o = o.substr(1);
    }
    if (o.length === 3) {
        o = o[0] + o[0] + o[1] + o[1] + o[2] + o[2];
    }
    return parseInt("0x" + o, 16);
};
ColorSpace.W3_HEX32 = function (o) {
    if (o.substr(0, 1) === "#") {
        o = o.substr(1);
    }
    if (o.length === 6) {
        return parseInt("0xFF" + o, 16);
    }
    else {
        return parseInt("0x" + o, 16);
    }
};
// HEX = 0x000000 -> 0xFFFFFF
ColorSpace.HEX_W3 = ColorSpace.HEX24_W3 = function (o, maxLength) {
    if (!maxLength) {
        maxLength = 6;
    }
    if (!o) {
        o = 0;
    }
    var z = o.toString(16);
    // when string is lesser than maxLength
    var n = z.length;
    while (n < maxLength) {
        z = "0" + z;
        n++;
    }
    // when string is greater than maxLength
    n = z.length;
    while (n > maxLength) {
        z = z.substr(1);
        n--;
    }
    return "#" + z;
};
ColorSpace.HEX32_W3 = function (o) {
    return ColorSpace.HEX_W3(o, 8);
};
ColorSpace.HEX_RGB =
    ColorSpace.HEX24_RGB = function (o) {
        return {
            // tslint:disable:no-bitwise
            R: (o >> 16),
            // tslint:disable-next-line:object-literal-sort-keys
            G: (o >> 8) & 0xFF,
            B: o & 0xFF
        };
    };
// HEX32 = 0x00000000 -> 0xFFFFFFFF
ColorSpace.HEX32_RGBA = function (o) {
    return {
        // tslint:disable:no-bitwise
        R: o >>> 16 & 0xFF,
        // tslint:disable-next-line:object-literal-sort-keys
        G: o >>> 8 & 0xFF,
        B: o & 0xFF,
        A: o >>> 24
    };
};
// RGBA = R: Red / G: Green / B: Blue / A: Alpha
ColorSpace.RGBA_HEX32 = function (o) {
    // tslint:disable-next-line:no-bitwise
    return (o.A << 24 | o.R << 16 | o.G << 8 | o.B) >>> 0;
};
// RGB = R: Red / G: Green / B: Blue
ColorSpace.RGB_HEX24 =
    ColorSpace.RGB_HEX = function (o) {
        if (o.R < 0) {
            o.R = 0;
        }
        if (o.G < 0) {
            o.G = 0;
        }
        if (o.B < 0) {
            o.B = 0;
        }
        if (o.R > 255) {
            o.R = 255;
        }
        if (o.G > 255) {
            o.G = 255;
        }
        if (o.B > 255) {
            o.B = 255;
        }
        // tslint:disable-next-line:no-bitwise
        return o.R << 16 | o.G << 8 | o.B;
    };
ColorSpace.RGB_CMY = function (o) {
    return {
        C: 1 - (o.R / 255),
        M: 1 - (o.G / 255),
        Y: 1 - (o.B / 255)
    };
};
ColorSpace.RGBA_HSLA =
    ColorSpace.RGB_HSL = function (o) {
        var _R = o.R / 255;
        var _G = o.G / 255;
        var _B = o.B / 255;
        var min = Math.min(_R, _G, _B);
        var max = Math.max(_R, _G, _B);
        var D = max - min;
        var H;
        var S;
        var L = (max + min) / 2;
        if (D === 0) { // No chroma
            H = 0;
            S = 0;
        }
        else { // Chromatic data
            if (L < 0.5) {
                S = D / (max + min);
            }
            else {
                S = D / (2 - max - min);
            }
            var DR = (((max - _R) / 6) + (D / 2)) / D;
            var DG = (((max - _G) / 6) + (D / 2)) / D;
            var DB = (((max - _B) / 6) + (D / 2)) / D;
            if (_R === max) {
                H = DB - DG;
            }
            else if (_G === max) {
                H = (1 / 3) + DR - DB;
            }
            else if (_B === max) {
                H = (2 / 3) + DG - DR;
            }
            if (H < 0) {
                H += 1;
            }
            if (H > 1) {
                H -= 1;
            }
        }
        return {
            H: H * 360,
            S: S * 100,
            // tslint:disable-next-line:object-literal-sort-keys
            L: L * 100,
            A: o.A
        };
    };
ColorSpace.RGBA_HSVA = ColorSpace.RGB_HSV = function (o) {
    var _R = o.R / 255;
    var _G = o.G / 255;
    var _B = o.B / 255;
    var min = Math.min(_R, _G, _B);
    var max = Math.max(_R, _G, _B);
    var D = max - min;
    var H;
    var S;
    var V = max;
    if (D === 0) { // No chroma
        H = 0;
        S = 0;
    }
    else { // Chromatic data
        S = D / max;
        var DR = (((max - _R) / 6) + (D / 2)) / D;
        var DG = (((max - _G) / 6) + (D / 2)) / D;
        var DB = (((max - _B) / 6) + (D / 2)) / D;
        if (_R === max) {
            H = DB - DG;
        }
        else if (_G === max) {
            H = (1 / 3) + DR - DB;
        }
        else if (_B === max) {
            H = (2 / 3) + DG - DR;
        }
        if (H < 0) {
            H += 1;
        }
        if (H > 1) {
            H -= 1;
        }
    }
    return {
        H: H * 360,
        S: S * 100,
        V: V * 100,
        // tslint:disable-next-line:object-literal-sort-keys
        A: o.A
    };
};
// CMY = C: Cyan / M: Magenta / Y: Yellow
ColorSpace.CMY_RGB = function (o) {
    return {
        R: Math.max(0, (1 - o.C) * 255),
        // tslint:disable-next-line:object-literal-sort-keys
        G: Math.max(0, (1 - o.M) * 255),
        B: Math.max(0, (1 - o.Y) * 255)
    };
};
ColorSpace.CMY_CMYK = function (o) {
    var C = o.C;
    var M = o.M;
    var Y = o.Y;
    var K = Math.min(Y, Math.min(M, Math.min(C, 1)));
    C = Math.round((C - K) / (1 - K) * 100);
    M = Math.round((M - K) / (1 - K) * 100);
    Y = Math.round((Y - K) / (1 - K) * 100);
    K = Math.round(K * 100);
    return {
        C: C,
        M: M,
        Y: Y,
        // tslint:disable-next-line:object-literal-sort-keys
        K: K
    };
};
// CMYK = C: Cyan / M: Magenta / Y: Yellow / K: Key (black)
ColorSpace.CMYK_CMY = function (o) {
    return {
        C: (o.C * (1 - o.K) + o.K),
        M: (o.M * (1 - o.K) + o.K),
        Y: (o.Y * (1 - o.K) + o.K)
    };
};
// HSL (1978) = H: Hue / S: Saturation / L: Lightess
// en.wikipedia.org/wiki/HSL_and_HSV
ColorSpace.HSLA_RGBA = ColorSpace.HSL_RGB = function (o) {
    var H = o.H / 360;
    var S = o.S / 100;
    var L = o.L / 100;
    var R;
    var G;
    var B;
    var temp1;
    var temp2;
    var temp3;
    if (S === 0) {
        R = G = B = L;
    }
    else {
        if (L < 0.5) {
            temp2 = L * (1 + S);
        }
        else {
            temp2 = (L + S) - (S * L);
        }
        temp1 = 2 * L - temp2;
        // calculate red
        temp3 = H + (1 / 3);
        if (temp3 < 0) {
            temp3 += 1;
        }
        if (temp3 > 1) {
            temp3 -= 1;
        }
        if ((6 * temp3) < 1) {
            R = temp1 + (temp2 - temp1) * 6 * temp3;
        }
        else if ((2 * temp3) < 1) {
            R = temp2;
        }
        else if ((3 * temp3) < 2) {
            R = temp1 + (temp2 - temp1) * ((2 / 3) - temp3) * 6;
        }
        else {
            R = temp1;
        }
        // calculate green
        temp3 = H;
        if (temp3 < 0) {
            temp3 += 1;
        }
        if (temp3 > 1) {
            temp3 -= 1;
        }
        if ((6 * temp3) < 1) {
            G = temp1 + (temp2 - temp1) * 6 * temp3;
        }
        else if ((2 * temp3) < 1) {
            G = temp2;
        }
        else if ((3 * temp3) < 2) {
            G = temp1 + (temp2 - temp1) * ((2 / 3) - temp3) * 6;
        }
        else {
            G = temp1;
        }
        // calculate blue
        temp3 = H - (1 / 3);
        if (temp3 < 0) {
            temp3 += 1;
        }
        if (temp3 > 1) {
            temp3 -= 1;
        }
        if ((6 * temp3) < 1) {
            B = temp1 + (temp2 - temp1) * 6 * temp3;
        }
        else if ((2 * temp3) < 1) {
            B = temp2;
        }
        else if ((3 * temp3) < 2) {
            B = temp1 + (temp2 - temp1) * ((2 / 3) - temp3) * 6;
        }
        else {
            B = temp1;
        }
    }
    return {
        R: R * 255,
        // tslint:disable-next-line:object-literal-sort-keys
        G: G * 255,
        B: B * 255,
        A: o.A
    };
};
// HSV (1978) = H: Hue / S: Saturation / V: Value
// en.wikipedia.org/wiki/HSL_and_HSV
ColorSpace.HSVA_RGBA = ColorSpace.HSV_RGB = function (o) {
    var H = o.H / 360;
    var S = o.S / 100;
    var V = o.V / 100;
    var R;
    var G;
    var B;
    var D;
    var A;
    var C;
    if (S === 0) {
        R = G = B = Math.round(V * 255);
    }
    else {
        if (H >= 1) {
            H = 0;
        }
        H = 6 * H;
        D = H - Math.floor(H);
        A = Math.round(255 * V * (1 - S));
        B = Math.round(255 * V * (1 - (S * D)));
        C = Math.round(255 * V * (1 - (S * (1 - D))));
        V = Math.round(255 * V);
        switch (Math.floor(H)) {
            case 0:
                R = V;
                G = C;
                B = A;
                break;
            case 1:
                R = B;
                G = V;
                B = A;
                break;
            case 2:
                R = A;
                G = V;
                B = C;
                break;
            case 3:
                R = A;
                G = B;
                B = V;
                break;
            case 4:
                R = C;
                G = A;
                B = V;
                break;
            case 5:
                R = V;
                G = A;
                B = B;
                break;
        }
    }
    return {
        R: R,
        // tslint:disable-next-line:object-literal-sort-keys
        G: G,
        B: B,
        A: o.A
    };
};
exports["default"] = ColorSpace;
