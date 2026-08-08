import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BarChart3Icon,
  PackageIcon,
  PlusIcon,
  Settings2Icon,
  StoreIcon,
} from 'lucide-react';
import { ProductItem, ShopItem } from '../types';
import { ShopManagementModal } from '../components/ShopManagementModal';
import {
  createProduct,
  deleteProduct,
  getMyProducts,
  updateProduct,
  uploadProductImage,
} from '../api';

interface ShopsPageProps {
  shops: ShopItem[];
  showToast: (message: string) => void;
  onCreateShop: () => void;
}

export function ShopsPage({ shops, showToast, onCreateShop }: ShopsPageProps) {
  const navigate = useNavigate();
  const [managedShop, setManagedShop] = useState<ShopItem | null>(null);
  const [shopProducts, setShopProducts] = useState<ProductItem[]>([]);

  const openManager = async (shop: ShopItem) => {
    setManagedShop(shop);
    try {
      setShopProducts(await getMyProducts(shop.id));
    } catch {
      setShopProducts([]);
    }
  };

  const handleCreateProduct = async (product: {
    name: string;
    price: string;
    category: string;
    description: string;
    stock: string;
    attributes?: Record<string, unknown>;
    imageUrl?: string;
  }, file?: File) => {
    if (!managedShop) return;
    const price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const stock = parseInt(product.stock.replace(/\D/g, ''), 10);
    if (Number.isNaN(price)) {
      showToast('Please enter a valid price');
      return;
    }
    try {
      const created = await createProduct({
        name: product.name,
        category: product.category,
        price,
        stock_qty: Number.isNaN(stock) ? 0 : stock,
        brand: product.description,
        attributes: product.attributes,
      }, managedShop.id);
      if (file) await uploadProductImage(created.id, file, managedShop.id);
      setShopProducts(await getMyProducts(managedShop.id));
      showToast('Product added to your catalog');
    } catch (error) {
      showToast(`Could not add product: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const handleUpdateProduct = async (product: ProductItem) => {
    if (!managedShop) return;
    try {
      await updateProduct(product.id, {
        name: product.name,
        category: product.category,
        price: product.price,
        brand: product.brand ?? undefined,
        stock_qty: product.stock_qty,
        attributes: product.attributes,
      }, managedShop.id);
      setShopProducts(await getMyProducts(managedShop.id));
      showToast('Product updated');
    } catch (error) {
      showToast(`Could not update product: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!managedShop) return;
    try {
      await deleteProduct(productId, managedShop.id);
      setShopProducts((current) => current.filter((item) => item.id !== productId));
      showToast('Product deleted');
    } catch (error) {
      showToast(`Could not delete product: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-wa-panelAlt">
      <header className="flex shrink-0 items-center gap-3 border-b border-wa-border bg-wa-panel px-4 py-3 shadow-sm md:px-5">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to chat"
          className="rounded-full p-2 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-wa-header text-white">
          <StoreIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold text-wa-textPrimary">My shops</h1>
          <p className="truncate text-xs text-wa-textSecondary">
            {shops.length === 0 ? 'No shops yet' : `${shops.length} shop${shops.length === 1 ? '' : 's'} on your account`}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateShop}
          className="flex items-center gap-1.5 rounded-lg bg-wa-header px-3 py-2 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
          <PlusIcon className="h-4 w-4" />
          New shop
        </button>
      </header>

      <main className="wa-scroll min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          {shops.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-wa-panel text-wa-header shadow-sm">
                <StoreIcon className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-semibold text-wa-textPrimary">You do not have a shop yet</h2>
              <p className="mt-1 max-w-sm text-sm text-wa-textSecondary">
                Open your WhatsApp storefront to list products and see how buyers find you.
              </p>
              <button
                type="button"
                onClick={onCreateShop}
                className="mt-5 flex items-center gap-2 rounded-lg bg-wa-header px-5 py-2.5 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
                <PlusIcon className="h-4 w-4" />
                Create a shop
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shops.map((shop) => (
                <article key={shop.id} className="flex flex-col rounded-2xl border border-wa-border bg-wa-panel p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wa-header/10 text-wa-header">
                      <StoreIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-wa-textPrimary">{shop.business_name}</h2>
                      <p className="truncate text-xs text-wa-textSecondary">{shop.category}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-wa-panelAlt px-2.5 py-1 text-[11px] font-medium text-wa-textSecondary">
                      {shop.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 border-t border-wa-border pt-4 text-xs text-wa-textSecondary">
                    <span className="flex items-center gap-1.5">
                      <PackageIcon className="h-4 w-4" />
                      {shop.product_count} product{shop.product_count === 1 ? '' : 's'}
                    </span>
                    <span className="truncate">{shop.phone_number}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void openManager(shop)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-wa-border px-3 py-2 text-sm font-medium text-wa-textPrimary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
                      <Settings2Icon className="h-4 w-4" />
                      Manage
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/${shop.id}`)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-wa-header px-3 py-2 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
                      <BarChart3Icon className="h-4 w-4" />
                      Dashboard
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {managedShop && (
        <ShopManagementModal
          shop={{
            shopName: managedShop.business_name,
            location: managedShop.location_lat != null ? `${managedShop.location_lat.toFixed(4)}, ${managedShop.location_lng?.toFixed(4)}` : '',
            phoneNumber: managedShop.phone_number,
          }}
          products={shopProducts}
          onClose={() => setManagedShop(null)}
          onCreate={(product, file) => void handleCreateProduct(product, file)}
          onUpdate={(product) => void handleUpdateProduct(product)}
          onDelete={(productId) => void handleDeleteProduct(productId)}
          onUploadImage={(productId, file) => void uploadProductImage(productId, file, managedShop.id)}
        />
      )}
    </div>
  );
}
