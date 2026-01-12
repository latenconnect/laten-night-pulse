import { useState, useEffect, useCallback } from 'react';
import { usePlatform } from './usePlatform';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// iOS In-App Purchase Product IDs
export const IOS_PRODUCT_IDS = {
  bartender: 'com.laten.bartender.sub',
  dj: 'com.laten.dj.sub',
  party_boost: 'com.laten.party.boost',
  professional: 'com.laten.pro.sub',
} as const;

export type IOSProductType = keyof typeof IOS_PRODUCT_IDS;

interface IOSProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceMicros: number;
  currency: string;
}

interface IOSPurchase {
  productId: string;
  transactionId: string;
  receipt: string;
}

interface UseIOSPurchasesReturn {
  products: IOSProduct[];
  loading: boolean;
  purchasing: boolean;
  error: string | null;
  isAvailable: boolean;
  purchase: (productType: IOSProductType, profileId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  getProduct: (productType: IOSProductType) => IOSProduct | undefined;
}

declare global {
  interface Window {
    CdvPurchase?: {
      store: {
        register: (products: Array<{ id: string; type: string; platform: string }>) => void;
        when: () => {
          productUpdated: (callback: (product: any) => void) => any;
          approved: (callback: (transaction: any) => void) => any;
          verified: (callback: (receipt: any) => void) => any;
          finished: (callback: (transaction: any) => void) => any;
          error: (callback: (error: any) => void) => any;
        };
        initialize: (platforms?: string[]) => Promise<void>;
        get: (productId: string, platform?: string) => any;
        order: (product: any) => Promise<any>;
        restorePurchases: () => Promise<any>;
        ready: (callback: () => void) => void;
        update: () => Promise<void>;
      };
      ProductType: {
        PAID_SUBSCRIPTION: string;
      };
      Platform: {
        APPLE_APPSTORE: string;
      };
    };
  }
}

export const useIOSPurchases = (): UseIOSPurchasesReturn => {
  const { isIOS } = usePlatform();
  const { user } = useAuth();
  const [products, setProducts] = useState<IOSProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [pendingProductType, setPendingProductType] = useState<IOSProductType | null>(null);

  // Initialize the store when on iOS
  useEffect(() => {
    if (!isIOS) {
      setLoading(false);
      return;
    }

    const initializeStore = async () => {
      try {
        // Wait for the plugin to be available
        const checkPlugin = () => {
          return new Promise<boolean>((resolve) => {
            let attempts = 0;
            const check = () => {
              if (window.CdvPurchase) {
                resolve(true);
              } else if (attempts < 10) {
                attempts++;
                setTimeout(check, 500);
              } else {
                resolve(false);
              }
            };
            check();
          });
        };

        const pluginAvailable = await checkPlugin();
        if (!pluginAvailable) {
          console.log('IAP plugin not available');
          setLoading(false);
          return;
        }

        const store = window.CdvPurchase!.store;
        const ProductType = window.CdvPurchase!.ProductType;
        const Platform = window.CdvPurchase!.Platform;

        // Register all products
        const productList = Object.values(IOS_PRODUCT_IDS).map(id => ({
          id,
          type: ProductType.PAID_SUBSCRIPTION,
          platform: Platform.APPLE_APPSTORE,
        }));

        store.register(productList);

        // Set up event handlers
        store.when()
          .productUpdated((product: any) => {
            console.log('Product updated:', product);
            if (product.canPurchase) {
              setProducts(prev => {
                const existing = prev.find(p => p.id === product.id);
                const newProduct: IOSProduct = {
                  id: product.id,
                  title: product.title || product.id,
                  description: product.description || '',
                  price: product.pricing?.price || '',
                  priceMicros: product.pricing?.priceMicros || 0,
                  currency: product.pricing?.currency || 'EUR',
                };
                if (existing) {
                  return prev.map(p => p.id === product.id ? newProduct : p);
                }
                return [...prev, newProduct];
              });
            }
          })
          .approved(async (transaction: any) => {
            console.log('Transaction approved:', transaction);
            // Verify with our server
            await verifyPurchase(transaction);
            transaction.verify();
          })
          .verified((receipt: any) => {
            console.log('Receipt verified:', receipt);
            receipt.finish();
          })
          .finished((transaction: any) => {
            console.log('Transaction finished:', transaction);
            setPurchasing(false);
            toast.success('Subscription activated!');
          })
          .error((err: any) => {
            console.error('Store error:', err);
            setError(err.message || 'Purchase error');
            setPurchasing(false);
            if (err.code !== 'E_USER_CANCELLED') {
              toast.error(err.message || 'Purchase failed');
            }
          });

        // Initialize the store
        await store.initialize([Platform.APPLE_APPSTORE]);
        await store.update();

        setIsAvailable(true);
        setLoading(false);
        console.log('IAP store initialized');
      } catch (err) {
        console.error('Failed to initialize IAP:', err);
        setError('Failed to initialize purchases');
        setLoading(false);
      }
    };

    initializeStore();
  }, [isIOS]);

  // Verify purchase with our backend
  const verifyPurchase = useCallback(async (transaction: any) => {
    if (!user || !pendingProfileId || !pendingProductType) {
      console.error('Missing user or profile data for verification');
      return false;
    }

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-ios-receipt', {
        body: {
          receipt: transaction.transactionReceipt,
          productId: transaction.productId,
          transactionId: transaction.transactionId,
          profileId: pendingProfileId,
          subscriptionType: pendingProductType,
        },
      });

      if (verifyError) {
        console.error('Receipt verification failed:', verifyError);
        toast.error('Could not verify purchase');
        return false;
      }

      console.log('Receipt verified successfully:', data);
      return true;
    } catch (err) {
      console.error('Verification error:', err);
      return false;
    }
  }, [user, pendingProfileId, pendingProductType]);

  // Purchase a subscription
  const purchase = useCallback(async (
    productType: IOSProductType,
    profileId: string
  ): Promise<boolean> => {
    if (!isAvailable || !window.CdvPurchase) {
      toast.error('In-app purchases not available');
      return false;
    }

    if (!user) {
      toast.error('Please log in to subscribe');
      return false;
    }

    const productId = IOS_PRODUCT_IDS[productType];
    const store = window.CdvPurchase.store;
    const Platform = window.CdvPurchase.Platform;

    const product = store.get(productId, Platform.APPLE_APPSTORE);
    if (!product) {
      toast.error('Product not found');
      return false;
    }

    setPurchasing(true);
    setPendingProfileId(profileId);
    setPendingProductType(productType);
    setError(null);

    try {
      const offer = product.getOffer();
      if (!offer) {
        throw new Error('No offer available');
      }
      
      await store.order(offer);
      return true;
    } catch (err: any) {
      console.error('Purchase error:', err);
      if (err.code !== 'E_USER_CANCELLED') {
        setError(err.message || 'Purchase failed');
        toast.error(err.message || 'Purchase failed');
      }
      setPurchasing(false);
      return false;
    }
  }, [isAvailable, user]);

  // Restore previous purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isAvailable || !window.CdvPurchase) {
      toast.error('In-app purchases not available');
      return false;
    }

    setLoading(true);

    try {
      await window.CdvPurchase.store.restorePurchases();
      toast.success('Purchases restored');
      return true;
    } catch (err: any) {
      console.error('Restore error:', err);
      toast.error('Could not restore purchases');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  // Get a specific product
  const getProduct = useCallback((productType: IOSProductType): IOSProduct | undefined => {
    const productId = IOS_PRODUCT_IDS[productType];
    return products.find(p => p.id === productId);
  }, [products]);

  return {
    products,
    loading,
    purchasing,
    error,
    isAvailable,
    purchase,
    restorePurchases,
    getProduct,
  };
};

export default useIOSPurchases;
