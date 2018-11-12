(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./midi/player", "./midi/gm", "./midi/synesthesia", "./midi/loader"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var player_1 = require("./midi/player");
    exports.Player = player_1["default"];
    var gm_1 = require("./midi/gm");
    exports.GM = gm_1["default"];
    var synesthesia_1 = require("./midi/synesthesia");
    exports.Synesthesia = synesthesia_1["default"];
    var loader_1 = require("./midi/loader");
    exports.Loader = loader_1["default"];
});
//# sourceMappingURL=index.js.map