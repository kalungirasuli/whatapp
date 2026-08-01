import React, { FormEvent, useState } from 'react';
import { MapPinIcon, StoreIcon, XIcon } from 'lucide-react';
import { ShopRegistrationData } from '../types';

interface ShopRegistrationFormProps {
  onClose: () => void;
  onSubmit: (data: ShopRegistrationData) => void;
}

const categories = [
'Fashion & apparel',
'Food & drinks',
'Beauty & wellness',
'Electronics',
'Home & living',
'Services',
'Other'];


const initialForm: ShopRegistrationData = {
  phoneNumber: '',
  shopName: '',
  productCategory: '',
  shopAddress: '',
  buildingRoomNumber: '',
  location: ''
};

export function ShopRegistrationForm({ onClose, onSubmit }: ShopRegistrationFormProps) {
  const [form, setForm] = useState<ShopRegistrationData>(initialForm);

  const updateField = (field: keyof ShopRegistrationData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-registration-title"
      className="fixed inset-0 z-50 flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-6">
      
      <div className="wa-scroll w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-wa-panel shadow-panel sm:max-h-[90vh] sm:rounded-[28px]">
        <header className="flex items-center justify-between border-b border-wa-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wa-header text-white">
              <StoreIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 id="shop-registration-title" className="font-semibold text-wa-textPrimary">
                Open your shop
              </h2>
              <p className="text-xs text-wa-textSecondary">Set up your WhatsApp storefront</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shop registration"
            className="rounded-full p-2 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
            
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <p className="rounded-lg bg-[#e7fce3] px-3 py-2 text-xs leading-relaxed text-wa-tealDark">
            Your shop details help customers find and contact you through WhatsApp.
          </p>

          <FormField label="Shop name" htmlFor="shop-name">
            <input
              id="shop-name"
              value={form.shopName}
              onChange={(event) => updateField('shopName', event.target.value)}
              required
              placeholder="e.g. Moyo Market"
              className={inputClassName} />
            
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone number" htmlFor="shop-phone">
              <input
                id="shop-phone"
                type="tel"
                value={form.phoneNumber}
                onChange={(event) => updateField('phoneNumber', event.target.value)}
                required
                inputMode="tel"
                placeholder="+1 555 123 4567"
                className={inputClassName} />
              
            </FormField>
            <FormField label="Product category" htmlFor="product-category">
              <select
                id="product-category"
                value={form.productCategory}
                onChange={(event) => updateField('productCategory', event.target.value)}
                required
                className={inputClassName}>
                
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((category) =>
                <option key={category} value={category}>
                    {category}
                  </option>
                )}
              </select>
            </FormField>
          </div>

          <FormField label="Shop address" htmlFor="shop-address">
            <input
              id="shop-address"
              value={form.shopAddress}
              onChange={(event) => updateField('shopAddress', event.target.value)}
              required
              placeholder="Street address"
              className={inputClassName} />
            
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Building & room number" htmlFor="building-room">
              <input
                id="building-room"
                value={form.buildingRoomNumber}
                onChange={(event) => updateField('buildingRoomNumber', event.target.value)}
                required
                placeholder="Building A, Room 12"
                className={inputClassName} />
              
            </FormField>
            <FormField label="Location" htmlFor="shop-location">
              <div className="relative">
                <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wa-textSecondary" />
                <input
                  id="shop-location"
                  value={form.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  required
                  placeholder="City or neighborhood"
                  className={`${inputClassName} pl-9`} />
                
              </div>
            </FormField>
          </div>

          <div className="flex justify-end gap-3 border-t border-wa-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
              
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-wa-header px-5 py-2.5 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
              
              Register shop
            </button>
          </div>
        </form>
      </div>
    </div>);

}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-sm font-medium text-wa-textPrimary">{label}</span>
      {children}
    </label>);

}

const inputClassName =
'w-full rounded-lg border border-wa-border bg-wa-panel px-3 py-2.5 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30';