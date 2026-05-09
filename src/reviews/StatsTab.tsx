import React, { useState, useEffect } from 'react';
import type { Company, Product, StatsResponse, StatsOption, ImageInfo } from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

export interface StatsTabProps {
  userData: { role?: string; company_ids?: string[] } | null;
  companies: Company[];
  products: Product[];
  selectedCompany: string;
  selectedProduct: string;
  loading: boolean;
  error: string;
  success: string;
  setError: (s: string) => void;
  setSuccess: (s: string) => void;
  setLoading: (b: boolean) => void;
  setSelectedCompany: (id: string) => void;
  setSelectedProduct: (id: string) => void;
  isCompanyAutoSelected: boolean;
  renderSearchableCompanyDropdown: (
    disabled: boolean,
    onCompanyChange: (id: string) => void,
    placeholder: string,
    focusRingColor: string
  ) => React.ReactNode;
  renderSearchableProductDropdown: (
    disabled: boolean,
    onProductChange: (id: string) => void,
    placeholder: string,
    focusRingColor: string
  ) => React.ReactNode;
}

const StatsTab: React.FC<StatsTabProps> = ({
  userData,
  companies,
  products,
  selectedCompany,
  selectedProduct,
  loading,
  error,
  success,
  setError,
  setSuccess,
  setLoading,
  setSelectedCompany,
  setSelectedProduct,
  isCompanyAutoSelected,
  renderSearchableCompanyDropdown,
  renderSearchableProductDropdown
}) => {
  const [statsOption, setStatsOption] = useState<StatsOption>('company');
  const [statsResult, setStatsResult] = useState<StatsResponse | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setStatsResult(null);
  }, [selectedCompany, selectedProduct, statsOption]);

  const fetchStats = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    if (statsOption === 'product' && !selectedProduct) {
      setError('Please select a product');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setStatsResult(null);

      const url =
        statsOption === 'company'
          ? `${IMAGE_API_BASE_URL}/image-stats/company/${selectedCompany}`
          : `${IMAGE_API_BASE_URL}/image-stats/product/${selectedCompany}/${selectedProduct}`;
      const response = await fetch(url);
      const data: StatsResponse = await response.json();

      if (data.success) {
        setStatsResult(data);
      } else {
        setError(data.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError('Error fetching statistics. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    setError('');
    setSuccess('');
    setStatsResult(null);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    setError('');
    setSuccess('');
    setStatsResult(null);
  };

  const toggleExpanded = (index: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <span className="material-symbols-outlined">bar_chart</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-text">Image Statistics</h2>
            <p className="text-xs text-secondary-text mt-1">View image statistics by company or product</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-primary-text text-sm font-semibold leading-normal pb-3">View Statistics By</p>
            <div className="flex flex-col gap-2">
              <label
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  statsOption === 'company' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="statsOption"
                  value="company"
                  checked={statsOption === 'company'}
                  onChange={() => setStatsOption('company')}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium text-primary-text">All Products</span>
              </label>
              <label
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  statsOption === 'product' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="statsOption"
                  value="product"
                  checked={statsOption === 'product'}
                  onChange={() => setStatsOption('product')}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium text-primary-text">Specific Product</span>
              </label>
            </div>
          </div>

          <div
            className={`grid gap-4 ${
              isCompanyAutoSelected
                ? statsOption === 'company'
                  ? 'grid-cols-1'
                  : 'grid-cols-1'
                : statsOption === 'company'
                  ? 'grid-cols-1'
                  : 'grid-cols-1 md:grid-cols-2'
            }`} style={{ overflow: 'visible' }}
          >
            {!isCompanyAutoSelected && (
              <div className="flex flex-col w-full" style={{ position: 'relative', zIndex: 30 }}>
                <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Select Company *</p>
                {renderSearchableCompanyDropdown(
                  loading,
                  handleCompanyChange,
                  'Select company...',
                  'focus:ring-2 focus:ring-primary/20 focus:border-primary'
                )}
              </div>
            )}

            {statsOption === 'product' && (
              <div className="flex flex-col w-full" style={{ position: 'relative', zIndex: 20 }}>
                <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Select Product *</p>
                {renderSearchableProductDropdown(
                  !selectedCompany || loading,
                  handleProductChange,
                  'Select product...',
                  'focus:ring-2 focus:ring-primary/20 focus:border-primary'
                )}
              </div>
            )}
          </div>

          <button
            onClick={fetchStats}
            disabled={loading || !selectedCompany || (statsOption === 'product' && !selectedProduct)}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
          >
            <span className="material-symbols-outlined !text-[20px]">bar_chart</span>
            {loading ? 'Loading...' : 'View Statistics'}
          </button>
        </div>
      </div>

      {statsResult && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-primary-text mb-6">Statistics Results</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-600 mb-1">Total Images</p>
              <p className="text-2xl font-bold text-blue-700">{statsResult.total_images}</p>
            </div>
            {statsResult.total_products !== undefined && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs font-medium text-green-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-green-700">{statsResult.total_products}</p>
              </div>
            )}
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs font-medium text-purple-600 mb-1">Company</p>
              <p className="text-lg font-bold text-purple-700">
                {statsResult.company_name || statsResult.company_id}
              </p>
            </div>
          </div>

          {statsResult.products && statsResult.products.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-primary-text mb-4">Products Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-background-light/50 border-b border-gray-100">
                      <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Image Count
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                        Preview
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statsResult.products.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-primary-text">{product.product_id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            {product.image_count} images
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {(expandedProducts.has(index) ? product.images : product.images.slice(0, 3)).map(
                              (img: ImageInfo, imgIdx: number) => (
                                <img
                                  key={imgIdx}
                                  src={img.s3_url}
                                  alt={img.filename || 'Product'}
                                  className="w-10 h-10 object-cover rounded border border-gray-200 cursor-pointer hover:border-primary transition-colors"
                                  onClick={() => setSelectedImage(img.s3_url)}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )
                            )}
                            {product.images.length > 3 && (
                              <button
                                onClick={() => toggleExpanded(index)}
                                className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs font-medium text-secondary-text hover:bg-primary hover:text-white hover:border-primary transition-colors cursor-pointer"
                              >
                                {expandedProducts.has(index) ? '−' : `+${product.images.length - 3}`}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {statsResult.images && statsResult.images.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-primary-text mb-4">
                Images ({statsResult.images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {statsResult.images.map((img: ImageInfo, index: number) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(img.s3_url)}
                  >
                    <img
                      src={img.s3_url}
                      alt={img.filename || 'Product'}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200 group-hover:border-primary transition-colors"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded text-xs text-white px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      Review #{img.review_index}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsTab;
