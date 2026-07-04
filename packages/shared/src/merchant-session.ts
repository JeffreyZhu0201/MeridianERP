export interface MerchantSession {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
}

export function merchantDisplayName(input: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const parts = [input.firstName, input.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  const local = input.email.split('@')[0]?.trim();
  return local || input.email;
}

export function userInitials(displayName: string, email: string): string {
  const trimmed = displayName.trim();
  if (trimmed) {
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0]!.charAt(0)}${words[1]!.charAt(0)}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  const local = email.split('@')[0]?.trim() ?? email;
  return local.slice(0, 2).toUpperCase() || '?';
}
