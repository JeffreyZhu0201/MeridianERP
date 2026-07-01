import { type ReactNode } from 'react';
import { Button } from './button';

export function DialogCloseButton({
  onClose,
  children = 'Cancel',
}: {
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <Button type="button" variant="outline" onClick={onClose}>
      {children}
    </Button>
  );
}
