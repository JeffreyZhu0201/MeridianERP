"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLocale = exports.locales = void 0;
exports.localeCookieName = localeCookieName;
exports.isAppLocale = isAppLocale;
exports.locales = ['en', 'zh-CN'];
exports.defaultLocale = 'en';
function localeCookieName(portal) {
    return `meridian_locale_${portal}`;
}
function isAppLocale(value) {
    return value === 'en' || value === 'zh-CN';
}
//# sourceMappingURL=config.js.map