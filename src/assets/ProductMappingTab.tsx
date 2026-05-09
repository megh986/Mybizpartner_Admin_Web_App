import React, { useState } from 'react';
import type { Company, Product, ProductMappingRow } from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

export interface ProductMappingTabProps {
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
    focusRingColor: string,
    useCompanyName?: boolean
  ) => React.ReactNode;
  renderSearchableProductDropdown?: (
    disabled: boolean,
    onProductChange: (id: string) => void,
    placeholder: string,
    focusRingColor: string
  ) => React.ReactNode;
}

const ProductMappingTab: React.FC<ProductMappingTabProps> = ({
  companies,
  selectedCompany,
  loading,
  error,
  success,
  setError,
  setSuccess,
  setLoading,
  setSelectedCompany,
  isCompanyAutoSelected,
  renderSearchableCompanyDropdown,
}) => {
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [mappingData, setMappingData] = useState<ProductMappingRow[]>([]);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerData, setImageViewerData] = useState<{
    product_id: string;
    company_id: string;
    myntra_images?: string[];
    amazon_images?: string[];
  } | null>(null);
  const [imageViewerTab, setImageViewerTab] = useState<'myntra' | 'amazon' | 'all'>('all');

  const handleUploadProductMapping = () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    if (!mappingFile) {
      setError('Please select a CSV file to upload');
      return;
    }
    const file = mappingFile;
    const company = selectedCompany;
    setError('');
    setSuccess('Uploading mapping in background…');
    setMappingFile(null);
    const fileInput = document.getElementById('mappingFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setUploadInProgress(true);

    (async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${IMAGE_API_BASE_URL}/product-mapping/upload/${company}`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          setSuccess(data.message || 'Successfully uploaded product mapping');
          handleFetchProductMapping();
        } else {
          setError(data.detail || data.message || 'Failed to upload mapping');
        }
      } catch (err) {
        setError('Error uploading product mapping. Please try again.');
        console.error(err);
      } finally {
        setUploadInProgress(false);
      }
    })();
  };

  const handleFetchProductMapping = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${IMAGE_API_BASE_URL}/product-mapping/${selectedCompany}`);
      const data = await response.json();
      if (data.success) {
        setMappingData(data.mappings || []);
        if (data.mappings?.length === 0) {
          setSuccess('No mappings found for this company');
        } else {
          setSuccess(`Found ${data.mappings.length} product mappings`);
        }
      } else {
        setError(data.detail || data.message || 'Failed to fetch mappings');
      }
    } catch (err) {
      setError('Error fetching product mappings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportProductMapping = async () => {
    if (!selectedCompany) return;
    if (mappingData.length === 0) {
      setError('No mappings to export. Please view existing mappings first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch(
        `${IMAGE_API_BASE_URL}/product-mapping/${selectedCompany}/export?format=xlsx`,
        { method: 'GET' }
      );
      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || data.message || 'Failed to export mappings');
        setLoading(false);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product_mappings_${selectedCompany}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Successfully exported product mappings');
    } catch (err) {
      setError('Error exporting product mappings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllProductMapping = async () => {
    if (!selectedCompany) return;
    if (!window.confirm('Are you sure you want to delete ALL product mappings for this company?')) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch(`${IMAGE_API_BASE_URL}/product-mapping/${selectedCompany}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(data.message || 'Successfully deleted all product mappings');
        setMappingData([]);
      } else {
        setError(data.detail || data.message || 'Failed to delete mappings');
      }
    } catch (err) {
      setError('Error deleting product mappings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingleMapping = async (product_id: string) => {
    if (!selectedCompany) return;
    if (!window.confirm(`Are you sure you want to delete the mapping for "${product_id}"?`)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(
        `${IMAGE_API_BASE_URL}/product-mapping/${selectedCompany}/entry/${encodeURIComponent(product_id)}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess(data.message || 'Mapping deleted successfully');
        setMappingData((prev) => prev.filter((item) => item.product_id !== product_id));
      } else {
        setError(data.detail || data.message || 'Failed to delete mapping');
      }
    } catch (err) {
      setError('Error deleting product mapping');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewImages = (product_id: string) => {
    const mapping = mappingData.find((m) => m.product_id === product_id);
    if (!mapping) {
      setError('Product mapping not found');
      return;
    }
    const myntraImages = mapping.myntra_review_urls || [];
    const amazonImages = mapping.amazon_review_urls || [];
    setImageViewerData({
      product_id,
      company_id: selectedCompany,
      myntra_images: myntraImages,
      amazon_images: amazonImages,
    });
    setImageViewerOpen(true);
    if (myntraImages.length === 0 && amazonImages.length === 0) {
      setSuccess('No images found for this product');
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    setError('');
    setSuccess('');
    setMappingData([]);
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
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-text">Product Mapping</h2>
            <p className="text-xs text-secondary-text mt-1">
              Upload CSV to map products to external store links (Amazon, Myntra, etc.)
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {!isCompanyAutoSelected && (
            <label className="flex flex-col w-full">
              <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Select Company</p>
              {renderSearchableCompanyDropdown(
                loading,
                handleCompanyChange,
                'Select company...',
                'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                false
              )}
            </label>
          )}

          {selectedCompany && (
            <>
              <div className="border-t border-gray-100 pt-5">
                <label className="flex flex-col w-full">
                  <p className="text-primary-text text-sm font-semibold leading-normal pb-2">
                    Upload CSV/Excel File
                  </p>
                  <p className="text-xs text-secondary-text pb-3">
                    File should contain columns: product_id (or handle), amazon_link, myntra_link
                  </p>
                  <input
                    id="mappingFile"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setMappingFile(e.target.files[0]);
                    }}
                    className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-3 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    disabled={loading}
                  />
                  {mappingFile && (
                    <p className="text-xs text-primary-text mt-2 font-medium">Selected: {mappingFile.name}</p>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={handleUploadProductMapping}
                  disabled={uploadInProgress || !mappingFile}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined !text-[18px]">upload</span>
                  {uploadInProgress ? 'Uploading…' : 'Upload'}
                </button>
                <button
                  onClick={handleFetchProductMapping}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined !text-[18px]">visibility</span>
                  {loading ? 'Loading...' : 'View'}
                </button>
                <button
                  onClick={handleExportProductMapping}
                  disabled={loading || mappingData.length === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined !text-[18px]">download</span>
                  Export
                </button>
                <button
                  onClick={handleDeleteAllProductMapping}
                  disabled={loading || mappingData.length === 0}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined !text-[18px]">delete</span>
                  Delete All
                </button>
              </div>

              {mappingData.length > 0 && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-bold text-primary-text mb-3">
                    Product Mappings ({mappingData.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-background-light/50 border-b border-gray-100">
                          <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Product ID</th>
                          <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Amazon Link</th>
                          <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Amazon Status</th>
                          <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Myntra Link</th>
                          <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Myntra Status</th>
                          <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Last Updated</th>
                          <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">View Images</th>
                          <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {mappingData.map((mapping, index) => (
                          <tr key={mapping.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-primary-text">{mapping.product_id}</p>
                            </td>
                            <td className="px-4 py-3">
                              {mapping.amazon_link ? (
                                <a
                                  href={mapping.amazon_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline truncate block max-w-[150px]"
                                  title={mapping.amazon_link}
                                >
                                  {mapping.amazon_link}
                                </a>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  mapping.amazon_status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : mapping.amazon_status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-700'
                                      : mapping.amazon_status === 'failed'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {mapping.amazon_status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {mapping.myntra_link ? (
                                <a
                                  href={mapping.myntra_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline truncate block max-w-[150px]"
                                  title={mapping.myntra_link}
                                >
                                  {mapping.myntra_link}
                                </a>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  mapping.myntra_status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : mapping.myntra_status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-700'
                                      : mapping.myntra_status === 'failed'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {mapping.myntra_status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {mapping.updated_at ? (
                                <span className="text-xs text-secondary-text">
                                  {new Date(mapping.updated_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewImages(mapping.product_id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                title="View images"
                              >
                                <span className="material-symbols-outlined !text-[18px]">image</span>
                                <span className="text-xs font-medium">View</span>
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleDeleteSingleMapping(mapping.product_id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete mapping"
                              >
                                <span className="material-symbols-outlined !text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {imageViewerOpen && imageViewerData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                    <span className="material-symbols-outlined">collections</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Product Images</h3>
                    <p className="text-sm text-gray-600">Product ID: {imageViewerData.product_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImageViewerOpen(false);
                    setImageViewerData(null);
                    setImageViewerTab('all');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setImageViewerTab('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    imageViewerTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Images ({(imageViewerData.myntra_images?.length || 0) + (imageViewerData.amazon_images?.length || 0)})
                </button>
                <button
                  onClick={() => setImageViewerTab('myntra')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    imageViewerTab === 'myntra' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Myntra ({imageViewerData.myntra_images?.length || 0})
                </button>
                <button
                  onClick={() => setImageViewerTab('amazon')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    imageViewerTab === 'amazon' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Amazon ({imageViewerData.amazon_images?.length || 0})
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {imageViewerTab === 'all' && (
                <div>
                  {(imageViewerData.myntra_images?.length || 0) + (imageViewerData.amazon_images?.length || 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                      <p className="text-sm">No images found for this product</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imageViewerData.myntra_images?.map((url, index) => (
                        <div key={`myntra-${index}`} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={url} alt={`Myntra ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-1 bg-pink-600 text-white text-xs font-medium rounded">Myntra</div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Open in new tab">
                            <span className="material-symbols-outlined !text-[16px]">open_in_new</span>
                          </a>
                        </div>
                      ))}
                      {imageViewerData.amazon_images?.map((url, index) => (
                        <div key={`amazon-${index}`} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={url} alt={`Amazon ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-1 bg-orange-600 text-white text-xs font-medium rounded">Amazon</div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Open in new tab">
                            <span className="material-symbols-outlined !text-[16px]">open_in_new</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {imageViewerTab === 'myntra' && (
                <div>
                  {!imageViewerData.myntra_images?.length ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                      <p className="text-sm">No Myntra images found for this product</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imageViewerData.myntra_images.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={url} alt={`Myntra ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Open in new tab">
                            <span className="material-symbols-outlined !text-[16px]">open_in_new</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {imageViewerTab === 'amazon' && (
                <div>
                  {!imageViewerData.amazon_images?.length ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                      <p className="text-sm">No Amazon images found for this product</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imageViewerData.amazon_images.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={url} alt={`Amazon ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Open in new tab">
                            <span className="material-symbols-outlined !text-[16px]">open_in_new</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMappingTab;
