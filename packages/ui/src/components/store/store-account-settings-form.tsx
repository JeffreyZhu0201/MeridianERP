'use client';

import { useState } from 'react';
import type { StoreCustomerProfile } from '@meridian/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export interface StoreAccountSettingsFormLabels {
  profileTitle: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  saveProfile: string;
  passwordTitle: string;
  currentPassword: string;
  newPassword: string;
  changePassword: string;
  successProfile: string;
  successPassword: string;
  error: string;
}

export interface StoreAccountSettingsFormProps {
  profile: StoreCustomerProfile;
  labels: StoreAccountSettingsFormLabels;
  onSaveProfile: (body: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<void>;
  onChangePassword: (body: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
}

export function StoreAccountSettingsForm({
  profile,
  labels,
  onSaveProfile,
  onChangePassword,
}: StoreAccountSettingsFormProps) {
  const [firstName, setFirstName] = useState(profile.firstName ?? '');
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    setProfileLoading(true);
    setError('');
    setMessage('');
    try {
      await onSaveProfile({ firstName, lastName, phone });
      setMessage(labels.successProfile);
    } catch {
      setError(labels.error);
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPasswordLoading(true);
    setError('');
    setMessage('');
    try {
      await onChangePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage(labels.successPassword);
    } catch {
      setError(labels.error);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form className="store-bento-card space-y-4 p-5" onSubmit={handleProfileSubmit}>
        <h2 className="store-headline-lg">{labels.profileTitle}</h2>
        <div className="space-y-2">
          <Label htmlFor="settings-email">{labels.email}</Label>
          <Input id="settings-email" value={profile.email} disabled />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-first">{labels.firstName}</Label>
            <Input
              id="settings-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-last">{labels.lastName}</Label>
            <Input
              id="settings-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-phone">{labels.phone}</Label>
          <Input
            id="settings-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={profileLoading}>
          {labels.saveProfile}
        </Button>
      </form>

      <form className="store-bento-card space-y-4 p-5" onSubmit={handlePasswordSubmit}>
        <h2 className="store-headline-lg">{labels.passwordTitle}</h2>
        <div className="space-y-2">
          <Label htmlFor="settings-current-password">{labels.currentPassword}</Label>
          <Input
            id="settings-current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-new-password">{labels.newPassword}</Label>
          <Input
            id="settings-new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={passwordLoading}>
          {labels.changePassword}
        </Button>
      </form>
    </div>
  );
}
