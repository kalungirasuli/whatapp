import React, { ChangeEvent, FormEvent, useRef, useState } from 'react';
import {
  BoxIcon,
  ImagePlusIcon,
  PencilIcon,
  PlusIcon,
  StoreIcon,
  Trash2Icon,
  XIcon } from
'lucide-react';
import { ProductItem } from '../types';
import { FormField } from './FormField';

interface ShopManagementModalProps {
  shop: { shopName: string; location: string; phoneNumber?: string };
  products: ProductItem[];
  onClose: () => void;
  onCreate: (product: { name: string; price: string; category: string; description: string; stock: string; attributes?: Record<string, unknown>; imageUrl?: string }, file?: File) => void;
  onUpdate: (product: ProductItem) => void;
  onDelete: (productId: number) => void;
  onUploadImage: (productId: number, file: File) => void;
}

interface Draft {
  name: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  attributes: string;
  imageUrl?: string;
  file?: File;
}

const emptyDraft: Draft = {
  name: '',
  price: '',
  stock: '',
  category: '',
  description: '',
  attributes: '',
  imageUrl: undefined,
  file: undefined,
};

export function ShopManagementModal({ shop, products, onClose, onCreate, onUpdate, onDelete, onUploadImage }: ShopManagementModalProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const updateDraft = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const resetEditor = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const editProduct = (product: ProductItem) => {
    setEditingId(product.id);
    setDraft({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock_qty),
      category: product.category,
      description: product.brand ?? '',
      attributes: product.attributes ? JSON.stringify(product.attributes) : '',
      imageUrl: product.images[0]?.url,
      file: undefined,
    });
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDraft((current) => ({ ...current, imageUrl: URL.createObjectURL(file), file }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId !== null) {
      const existing = products.find((item) => item.id === editingId);
      if (existing) {
        onUpdate({ ...existing, ...structuredProductFromDraft() });
        if (draft.file) onUploadImage(editingId, draft.file);
      }
    } else {
      onCreate(
        {
          name: draft.name,
          price: draft.price,
          stock: draft.stock,
          category: draft.category,
          description: draft.description,
          attributes: parseAttributes(draft.attributes),
          imageUrl: draft.imageUrl,
        },
        draft.file,
      );
    }
    resetEditor();
  };

  const structuredProductFromDraft = () => {
    const price = parseFloat(draft.price.replace(/[^0-9.]/g, '')) || 0;
    const stock = parseInt(draft.stock.replace(/\D/g, ''), 10) || 0;
    return { name: draft.name, category: draft.category, price, stock_qty: stock, brand: draft.description || null, attributes: parseAttributes(draft.attributes) };
  };

  const imageUrlFor = (product: ProductItem): string | undefined => product.images.find((img) => img.is_primary)?.url ?? product.images[0]?.url;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="shop-manager-title" className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-6">
      <div className="flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] bg-wa-panel shadow-panel sm:h-[88vh] sm:rounded-[28px]">
        <header className="flex items-center justify-between border-b border-wa-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wa-header text-white"><StoreIcon className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h2 id="shop-manager-title" className="truncate font-semibold text-wa-textPrimary">{shop.shopName}</h2>
              <p className="truncate text-xs text-wa-textSecondary">{products.length} {products.length === 1 ? 'product' : 'products'} · {shop.location || (shop.phoneNumber ? shop.phoneNumber : '')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close shop" className="rounded-full p-2 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green"><XIcon className="h-5 w-5" /></button>
        </header>

        <div className="wa-scroll grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_1.05fr] md:overflow-hidden">
          <section className="border-b border-wa-border bg-wa-panelAlt p-4 md:overflow-y-auto md:border-b-0 md:border-r">
            <div className="mb-4 flex items-center justify-between">
              <div><p className="font-medium text-wa-textPrimary">Your catalog</p><p className="text-xs text-wa-textSecondary">View and manage listed items</p></div>
              <button type="button" onClick={resetEditor} className="flex items-center gap-1.5 rounded-lg bg-wa-header px-3 py-2 text-sm font-medium text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2"><PlusIcon className="h-4 w-4" /> Add</button>
            </div>
            {products.length === 0 ?
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-wa-border bg-wa-panel px-5 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-wa-header/10 text-wa-header"><BoxIcon className="h-5 w-5" /></div>
                <p className="font-medium text-wa-textPrimary">Your shop is ready</p>
                <p className="mt-1 text-sm text-wa-textSecondary">Add your first product to start building your catalog.</p>
              </div> :

            <div className="space-y-2">
                {products.map((product) =>
              <article key={product.id} className={`flex flex-col overflow-hidden rounded-xl border ${editingId === product.id ? 'border-wa-header bg-[#e7fce3]' : 'border-wa-border bg-wa-panel'}`}>
                    {imageUrlFor(product) ? <img src={imageUrlFor(product)} alt={product.name} loading="lazy" className="max-h-44 w-full rounded-md object-contain bg-gray-50" /> : <div className="flex h-32 w-full items-center justify-center bg-wa-header/10 text-wa-header"><BoxIcon className="h-8 w-8" /></div>}
                    <div className="min-w-0 flex-1 p-3">
                      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-sm font-medium text-wa-textPrimary">{product.name}</h3><p className="mt-1 text-sm font-semibold text-wa-header">{formatPrice(product.price, product.currency)}</p></div><span className="shrink-0 rounded-full bg-wa-panelAlt px-2 py-0.5 text-[11px] text-wa-textSecondary">{product.stock_qty} in stock</span></div>
                      <p className="mt-1 truncate text-xs text-wa-textSecondary">{product.category}</p>
                      <div className="mt-2 flex gap-2"><button type="button" onClick={() => editProduct(product)} className="flex items-center gap-1 text-xs font-medium text-wa-header hover:underline focus:outline-none focus:ring-2 focus:ring-wa-green"><PencilIcon className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => onDelete(product.id)} className="flex items-center gap-1 text-xs font-medium text-[#d94841] hover:underline focus:outline-none focus:ring-2 focus:ring-wa-green"><Trash2Icon className="h-3.5 w-3.5" /> Delete</button></div>
                    </div>
                  </article>
              )}
              </div>
            }
          </section>

          <section className="p-4 md:overflow-y-auto">
            <div className="mb-4"><p className="font-medium text-wa-textPrimary">{editingId !== null ? 'Edit product' : 'Add product'}</p><p className="text-xs text-wa-textSecondary">{editingId !== null ? 'Update the item details below.' : 'Create a product for your WhatsApp catalog.'}</p></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-wa-panelAlt p-3">
                {draft.imageUrl ? <img src={draft.imageUrl} alt="Product preview" className="h-16 w-16 rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-wa-header/10 text-wa-header"><ImagePlusIcon className="h-5 w-5" /></div>}
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-wa-textPrimary">Product photo</p><p className="mt-0.5 text-xs text-wa-textSecondary">Optional — choose an image from your device. New photos train the image search.</p><button type="button" onClick={() => imageInputRef.current?.click()} className="mt-2 text-xs font-medium text-wa-header hover:underline focus:outline-none focus:ring-2 focus:ring-wa-green">Upload image</button><input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="sr-only" /></div>
              </div>
              <FormField label="Product name" htmlFor="product-name"><input id="product-name" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required placeholder="e.g. Handmade tote bag" className={inputClassName} /></FormField>
              <div className="grid gap-4 sm:grid-cols-2"><FormField label="Price (UGX)" htmlFor="product-price"><input id="product-price" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} required placeholder="e.g. 150000" inputMode="numeric" className={inputClassName} /></FormField><FormField label="Stock" htmlFor="product-stock"><input id="product-stock" inputMode="numeric" value={draft.stock} onChange={(event) => updateDraft('stock', event.target.value)} required placeholder="e.g. 12" className={inputClassName} /></FormField></div>
              <FormField label="Category" htmlFor="product-category"><input id="product-category" value={draft.category} onChange={(event) => updateDraft('category', event.target.value)} required placeholder="e.g. Accessories" className={inputClassName} /></FormField>
              <FormField label="Description" htmlFor="product-description"><textarea id="product-description" value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} rows={3} placeholder="Describe your product" className={`${inputClassName} resize-none`} /></FormField>
              <FormField label="Product attributes" htmlFor="product-attributes"><textarea id="product-attributes" value={draft.attributes} onChange={(event) => updateDraft('attributes', event.target.value)} rows={3} placeholder="color=brown, size=45, material=leather, year=2020" className={`${inputClassName} resize-none`} /></FormField>
              <div className="flex justify-end gap-3 border-t border-wa-border pt-4"><button type="button" onClick={resetEditor} className="rounded-lg px-4 py-2.5 text-sm font-medium text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">Clear</button><button type="submit" className="rounded-lg bg-wa-header px-5 py-2.5 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">{editingId !== null ? 'Save product' : 'Add product'}</button></div>
            </form>
          </section>
        </div>
      </div>
    </div>);

}

function formatPrice(price: number, currency: string): string {
  if (currency === 'UGX') return `UGX ${price.toLocaleString()}`;
  const symbol = currency === 'KES' ? 'KSh ' : currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${price.toLocaleString()}`;
}

const inputClassName = 'w-full rounded-lg border border-wa-border bg-wa-panel px-3 py-2.5 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30';

function parseAttributes(value: string): Record<string, string> {
  return Object.fromEntries(
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split('=');
        return [key.trim(), rest.join('=').trim()];
      })
      .filter(([key, itemValue]) => Boolean(key && itemValue)),
  );
}
