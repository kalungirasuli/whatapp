import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BarChart3Icon,
  PackageIcon,
  PlusIcon,
  Settings2Icon,
  StoreIcon,
  SparklesIcon,
} from 'lucide-react';
import { ProductItem, ShopItem } from '../types';
import { ShopManagementModal } from '../components/ShopManagementModal';
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
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
  }, files?: File[]) => {
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
      for (const file of files ?? []) await uploadProductImage(created.id, file, managedShop.id);
      setShopProducts(await getMyProducts(managedShop.id));
      showToast('Product added to your catalog');
    } catch (error) {
      showToast(`Could not add product: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const handleUpdateProduct = async (product: ProductItem, files?: File[], removedImageIds?: number[]) => {
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
      for (const file of files ?? []) await uploadProductImage(product.id, file, managedShop.id);
      for (const imageId of removedImageIds ?? []) await deleteProductImage(product.id, imageId, managedShop.id);
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
    <div className="flex h-full w-full min-w-0 flex-1 flex-col bg-wa-panelAlt">
      <header className="flex shrink-0 items-center gap-3 bg-wa-panelHeader px-4 py-3 md:px-5" style={{borderBottom: '1px solid rgba(42,57,66,0.5)'}}>
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to chat"
          className="rounded-full p-2 text-wa-textSecondary transition-colors hover:bg-white/5 hover:text-wa-textPrimary focus:outline-none focus:ring-2 focus:ring-wa-header">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-wa-header to-wa-green text-white shadow-glow">
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
          className="btn-gradient flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-wa-header focus:ring-offset-2 focus:ring-offset-wa-panelHeader">
          <PlusIcon className="h-4 w-4" />
          New shop
        </button>
      </header>

      <main className="wa-scroll min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
        <div className="mx-auto max-w-5xl">
          {shops.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-wa-header to-wa-green text-white shadow-glow glow-pulse">
                <StoreIcon className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-wa-textPrimary">You do not have a shop yet</h2>
              <p className="mt-2 max-w-sm text-sm text-wa-textSecondary">
                Open your WhatsApp storefront to list products and see how buyers find you.
              </p>
              <button
                type="button"
                onClick={onCreateShop}
                className="btn-gradient mt-5 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-wa-header focus:ring-offset-2 focus:ring-offset-wa-panelAlt">
                <PlusIcon className="h-4 w-4" />
                Create a shop
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <article key={shop.id} className="card-hover flex flex-col rounded-2xl p-4 shadow-card" style={{background: 'linear-gradient(145deg, #182229, #111b21)', border: '1px solid rgba(42,57,66,0.5)'}}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wa-header/15 text-wa-header" style={{border: '1px solid rgba(0,168,132,0.2)'}}>
                      <StoreIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-wa-textPrimary">{shop.business_name}</h2>
                      <p className="truncate text-xs text-wa-textSecondary">{shop.category}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-wa-header/10 px-2.5 py-1 text-[11px] font-medium text-wa-header" style={{border: '1px solid rgba(0,168,132,0.15)'}}>
                      {shop.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 border-t border-wa-border/50 pt-3 text-xs text-wa-textSecondary">
                    <span className="flex items-center gap-1.5">
                      <PackageIcon className="h-4 w-4 text-wa-header/60" />
                      {shop.product_count} product{shop.product_count === 1 ? '' : 's'}
                    </span>
                    <span className="truncate">{shop.phone_number}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void openManager(shop)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-wa-border px-3 py-2 text-sm font-medium text-wa-textPrimary transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-wa-header">
                      <Settings2Icon className="h-4 w-4 text-wa-textSecondary" />
                      Manage
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/${shop.id}`)}
                      className="btn-gradient flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-wa-header focus:ring-offset-2 focus:ring-offset-wa-panelAlt">
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
          onCreate={(product, files) => void handleCreateProduct(product, files)}
          onUpdate={(product, files, removedImageIds) => void handleUpdateProduct(product, files, removedImageIds)}
          onDelete={(productId) => void handleDeleteProduct(productId)}
          onUploadImage={(productId, file) => void uploadProductImage(productId, file, managedShop.id)}
        />
      )}
    </div>
  );
}
