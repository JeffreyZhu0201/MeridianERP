import { AdminShellWrapper } from '@/components/admin-shell-wrapper';

export default function SettingsPage() {
  return (
    <AdminShellWrapper>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Platform settings coming in a future release.</p>
      </div>
    </AdminShellWrapper>
  );
}
