"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMessages = loadMessages;
const index_js_1 = require("./messages/en/index.js");
const index_js_2 = require("./messages/zh-CN/index.js");
const catalogs = {
    en: index_js_1.enMessages,
    'zh-CN': index_js_2.zhCNMessages,
};
function loadMessages(locale) {
    return catalogs[locale];
}
//# sourceMappingURL=load-messages.js.map