"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantDisplayName = merchantDisplayName;
exports.userInitials = userInitials;
function merchantDisplayName(input) {
    const parts = [input.firstName, input.lastName].filter(Boolean);
    if (parts.length > 0)
        return parts.join(' ');
    const local = input.email.split('@')[0]?.trim();
    return local || input.email;
}
function userInitials(displayName, email) {
    const trimmed = displayName.trim();
    if (trimmed) {
        const words = trimmed.split(/\s+/).filter(Boolean);
        if (words.length >= 2) {
            return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
        }
        return trimmed.slice(0, 2).toUpperCase();
    }
    const local = email.split('@')[0]?.trim() ?? email;
    return local.slice(0, 2).toUpperCase() || '?';
}
//# sourceMappingURL=merchant-session.js.map