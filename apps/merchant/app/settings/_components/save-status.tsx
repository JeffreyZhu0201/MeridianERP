interface SaveStatusProps {
  error: string;
  saved: boolean;
  savedLabel: string;
}

export function SaveStatus({ error, saved, savedLabel }: SaveStatusProps) {
  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (saved) {
    return (
      <p className="text-sm text-emerald-600" role="status">
        {savedLabel}
      </p>
    );
  }

  return null;
}
