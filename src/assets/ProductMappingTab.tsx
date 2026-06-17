import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const gsap = (window as any).gsap;
    if (gsap) {
      gsap.to('.gsap-assets-floater-orange-1', {
        y: -6,
        x: 3,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      gsap.to('.gsap-assets-floater-orange-2', {
        y: 6,
        x: -3,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.4
      });
    }
  }, []);

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
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined !text-[18px]">error</span>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined !text-[18px]">check_circle</span>
          {success}
        </div>
      )}

      {/* Card 1: Header & Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 transition-all duration-300">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-3.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm">
            <span className="material-symbols-outlined !text-[18px]">inventory_2</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Product Mapping</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Upload CSV to map products to external store links (Amazon, Myntra, etc.)
            </p>
          </div>
        </div>

        {!isCompanyAutoSelected && (
          <label className="flex flex-col w-full">
            <span className="text-slate-755 dark:text-slate-300 text-xs font-bold leading-normal pb-1">Select Company</span>
            {renderSearchableCompanyDropdown(
              loading,
              handleCompanyChange,
              'Select company...',
              'focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]',
              false
            )}
          </label>
        )}
      </div>

      {/* Card 2: Upload CSV / Action buttons */}
      {selectedCompany && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 transition-all duration-300">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2.5">Upload & Actions</h3>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col w-full gap-1">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                Upload CSV/Excel File
              </span>
              
              <div className="relative group mt-0.5">
                <input
                  id="mappingFile"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setMappingFile(e.target.files[0]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={loading}
                />
                <div className="border border-dashed border-slate-200 dark:border-slate-800 group-hover:border-[#FF6B35] rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/30 group-hover:bg-white dark:group-hover:bg-slate-950">
                  <div className="size-8 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined !text-[16px]">upload_file</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {mappingFile ? mappingFile.name : 'Click to upload or drag CSV/Excel'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      File should contain columns: product_id, amazon_link, myntra_link
                    </p>
                  </div>
                </div>
              </div>
            </label>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-2">
              <button
                onClick={handleUploadProductMapping}
                disabled={uploadInProgress || !mappingFile}
                className="bg-[#FF6B35] hover:bg-[#E5521C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined !text-[16px]">upload</span>
                {uploadInProgress ? 'Uploading…' : 'Upload CSV'}
              </button>
              <button
                onClick={handleFetchProductMapping}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined !text-[16px]">visibility</span>
                {loading ? 'Loading...' : 'View Mappings'}
              </button>
              <button
                onClick={handleExportProductMapping}
                disabled={loading || mappingData.length === 0}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined !text-[16px]">download</span>
                Export Data
              </button>
              <button
                onClick={handleDeleteAllProductMapping}
                disabled={loading || mappingData.length === 0}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined !text-[16px]">delete_forever</span>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card 3: Mappings Table */}
      {selectedCompany && mappingData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 transition-all duration-300">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF6B35] !text-[16px]">list_alt</span>
                    Product Mappings 
                    <span className="text-[10px] font-semibold bg-[#FF6B35]/10 text-[#FF6B35] px-2 py-0.5 rounded-full">
                      {mappingData.length} entries
                    </span>
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
                          <th className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product ID</th>
                          <th className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amazon Link</th>
                          <th className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amazon Status</th>
                          <th className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Myntra Link</th>
                          <th className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Myntra Status</th>
                          <th className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Last Updated</th>
                          <th className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">View Images</th>
                          <th className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {mappingData.map((mapping, index) => (
                          <tr key={mapping.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-150">
                            <td className="px-3 py-1.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{mapping.product_id}</p>
                            </td>
                            <td className="px-3 py-1.5">
                              {mapping.amazon_link ? (
                                <a
                                  href={mapping.amazon_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-[#FF6B35] hover:text-[#E5521C] hover:underline truncate flex items-center gap-1 max-w-[150px]"
                                  title={mapping.amazon_link}
                                >
                                  {mapping.amazon_link}
                                  <span className="material-symbols-outlined !text-[13px]">open_in_new</span>
                                </a>
                              ) : (
                                <span className="text-xs text-slate-350">-</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  mapping.amazon_status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                    : mapping.amazon_status === 'in_progress'
                                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border-sky-100 dark:border-sky-500/20'
                                      : mapping.amazon_status === 'failed'
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                }`}
                              >
                                {mapping.amazon_status || 'pending'}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              {mapping.myntra_link ? (
                                <a
                                  href={mapping.myntra_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-[#FF6B35] hover:text-[#E5521C] hover:underline truncate flex items-center gap-1 max-w-[150px]"
                                  title={mapping.myntra_link}
                                >
                                  {mapping.myntra_link}
                                  <span className="material-symbols-outlined !text-[13px]">open_in_new</span>
                                </a>
                              ) : (
                                <span className="text-xs text-slate-350">-</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  mapping.myntra_status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                    : mapping.myntra_status === 'in_progress'
                                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border-sky-100 dark:border-sky-500/20'
                                      : mapping.myntra_status === 'failed'
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                }`}
                              >
                                {mapping.myntra_status || 'pending'}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              {mapping.updated_at ? (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  {new Date(mapping.updated_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-350">-</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5">
                              <button
                                onClick={() => handleViewImages(mapping.product_id)}
                                className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-[#FF6B35]/5 text-[#FF6B35] transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                title="View images"
                              >
                                <span className="material-symbols-outlined !text-[13px]">image</span>
                                View
                              </button>
                            </td>
                            <td className="px-3 py-1.5">
                              <button
                                onClick={() => handleDeleteSingleMapping(mapping.product_id)}
                                className="p-1 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                                title="Delete mapping"
                              >
                                <span className="material-symbols-outlined !text-[14px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

      {/* Image Viewer Modal */}
      {imageViewerOpen && imageViewerData && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#FF6B35]/10 text-[#FF6B35] rounded-xl">
                    <span className="material-symbols-outlined !text-[20px]">collections</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Product Images</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Product ID: {imageViewerData.product_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImageViewerOpen(false);
                    setImageViewerData(null);
                    setImageViewerTab('all');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setImageViewerTab('all')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    imageViewerTab === 'all'
                      ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All Images ({(imageViewerData.myntra_images?.length || 0) + (imageViewerData.amazon_images?.length || 0)})
                </button>
                <button
                  onClick={() => setImageViewerTab('myntra')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    imageViewerTab === 'myntra'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Myntra ({imageViewerData.myntra_images?.length || 0})
                </button>
                <button
                  onClick={() => setImageViewerTab('amazon')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    imageViewerTab === 'amazon'
                      ? 'bg-[#FF6B35] text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Amazon ({imageViewerData.amazon_images?.length || 0})
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-950/20">
              {imageViewerTab === 'all' && (
                <div>
                  {(imageViewerData.myntra_images?.length || 0) + (imageViewerData.amazon_images?.length || 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                      <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                      <p className="text-sm font-medium">No images found for this product</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
                      {imageViewerData.myntra_images?.map((url, index) => (
                        <div key={`myntra-${index}`} className="relative group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 shadow-sm hover:shadow-md transition-all">
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-50">
                            <img src={url} alt={`Myntra ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                          </div>
                          <div className="absolute top-4 right-4 px-2 py-0.5 bg-pink-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">Myntra</div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 p-2 bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-700 dark:text-slate-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex items-center justify-center" title="Open in new tab">
                            <span className="material-symbols-outlined !text-[16px]">open_in_new</span>
                          </a>
                        </div>
                      ))}
                      {imageViewerData.amazon_images?.map((url, index) => (
                        <div key={`amazon-${index}`} className="relative group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 shadow-sm hover:shadow-md transition-all">
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-50">
                            <img src={url} alt={`Amazon ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                          </div>
                          <div className="absolute top-4 right-4 px-2 py-0.5 bg-[#FF6B35] text-white text-[10px] font-bold rounded-md uppercase tracking-wider">Amazon</div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 p-2 bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-700 dark:text-slate-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex items-center justify-center" title="Open in new tab">
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
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                      <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                      <p className="text-sm font-medium">No Myntra images found for this product</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
                      {imageViewerData.myntra_images.map((url, index) => (
                        <div key={index} className="relative group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 shadow-sm hover:shadow-md transition-all">
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-50">
                            <img src={url} alt={`Myntra ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 p-2 bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-700 dark:text-slate-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex items-center justify-center" title="Open in new tab">
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
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                      <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                      <p className="text-sm font-medium">No Amazon images found for this product</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
                      {imageViewerData.amazon_images.map((url, index) => (
                        <div key={index} className="relative group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 shadow-sm hover:shadow-md transition-all">
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-50">
                            <img src={url} alt={`Amazon ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 p-2 bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-700 dark:text-slate-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex items-center justify-center" title="Open in new tab">
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
