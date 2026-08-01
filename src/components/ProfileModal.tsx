import React, { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { CameraIcon, MapPinIcon, PencilIcon, XIcon } from 'lucide-react';
import { ProfileData } from '../types';
import { FormField } from './FormField';

interface ProfileModalProps {
  profile: ProfileData;
  onClose: () => void;
  onSave: (profile: ProfileData) => void;
}

export function ProfileModal({ profile, onClose, onSave }: ProfileModalProps) {
  const [form, setForm] = useState<ProfileData>(profile);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof ProfileData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateField('avatarUrl', URL.createObjectURL(file));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-6">
      
      <div className="wa-scroll w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-wa-panel shadow-panel sm:max-h-[90vh] sm:rounded-[28px]">
        <header className="flex items-center justify-between border-b border-wa-border px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-wa-header">Account</p>
            <h2 id="profile-title" className="mt-0.5 font-semibold text-wa-textPrimary">Your profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="rounded-full p-2 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
            
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-6">
          <div className="flex items-center gap-4 rounded-2xl bg-wa-panelAlt p-4">
            <div className="relative">
              <img src={form.avatarUrl} alt="Profile preview" className="h-20 w-20 rounded-full object-cover" />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-wa-header text-white shadow-bubble focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
                
                <CameraIcon className="h-4 w-4" />
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
            </div>
            <div>
              <p className="font-medium text-wa-textPrimary">Add a personal touch</p>
              <p className="mt-1 text-sm leading-5 text-wa-textSecondary">Tap the camera to update your profile photo.</p>
            </div>
          </div>

          <FormField label="Display name" htmlFor="profile-name">
            <div className="relative">
              <PencilIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wa-textSecondary" />
              <input id="profile-name" value={form.displayName} onChange={(event) => updateField('displayName', event.target.value)} required className={`${inputClassName} pl-9`} />
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone number" htmlFor="profile-phone">
              <input id="profile-phone" type="tel" inputMode="tel" value={form.phoneNumber} onChange={(event) => updateField('phoneNumber', event.target.value)} required className={inputClassName} />
            </FormField>
            <FormField label="Location" htmlFor="profile-location">
              <div className="relative">
                <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wa-textSecondary" />
                <input id="profile-location" value={form.location} onChange={(event) => updateField('location', event.target.value)} className={`${inputClassName} pl-9`} placeholder="City or neighborhood" />
              </div>
            </FormField>
          </div>

          <FormField label="About" htmlFor="profile-about">
            <textarea id="profile-about" value={form.about} onChange={(event) => updateField('about', event.target.value)} rows={3} className={`${inputClassName} resize-none`} placeholder="A short description about you" />
          </FormField>

          <div className="flex justify-end gap-3 border-t border-wa-border pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">Cancel</button>
            <button type="submit" className="rounded-lg bg-wa-header px-5 py-2.5 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">Save changes</button>
          </div>
        </form>
      </div>
    </div>);

}

const inputClassName = 'w-full rounded-lg border border-wa-border bg-wa-panel px-3 py-2.5 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30';