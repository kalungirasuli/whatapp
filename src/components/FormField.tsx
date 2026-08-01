import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-sm font-medium text-wa-textPrimary">{label}</span>
      {children}
    </label>);

}