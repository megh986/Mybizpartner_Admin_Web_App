import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://staging.thewordofmouth.in/api';
const WA_API_BASE_URL = API_BASE_URL;
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

interface UploadResult {
  queued: number;
  triggered: number;
  skipped_active: number;
  errors: string[];
  message: string;
}

interface PreviewRow {
  phone: string;
  customer_name: string;
  product_name: string;
  order_id: string;
  location?: string;
  product_id?: string;
  product_handle?: string;
}

const REQUIRED_COLS = ['phone', 'customer_name', 'product_name', 'order_id', 'location', 'product_handle'];

const CustomCompanyDropdown: React.FC<{
  value: string;
  options: string[];
  onChange: (val: string) => void;
  disabled: boolean;
}> = ({ value, options, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all flex justify-between items-center shadow-sm"
      >
        <span className="truncate">{value || '-- Select a company --'}</span>
        <span className="material-symbols-outlined !text-[16px] text-slate-400">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            -- Select a company --
          </button>
          {options.map(c => (
            <button
              key={c}
              type="button"
              className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${value === c ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
              onClick={() => {
                onChange(c);
                setIsOpen(false);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const BulkUploadTab: React.FC = () => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [columnError, setColumnError] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sessionToken = localStorage.getItem('session_token');
    fetch(`${IMAGE_API_BASE_URL}/all-companies`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setCompanies(d.companies.map((c: { company_id: string }) => c.company_id)); })
      .catch(() => {});
  }, []);

  const validateHeaders = (headers: string[]) => {
    const missing = REQUIRED_COLS.filter(col => !headers.includes(col));
    setColumnError(missing);
    return missing;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setColumnError([]);
    setPreview([]);

    if (f.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { setColumnError(['File appears empty or has no data rows']); return; }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        const missing = validateHeaders(headers);
        if (missing.length > 0) return; // don't generate preview if columns are wrong
        const rows: PreviewRow[] = lines.slice(1, 6).map(line => {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const get = (key: string) => {
            const i = headers.indexOf(key);
            return i >= 0 ? cols[i] || '' : '';
          };
          return {
            phone: get('phone'),
            customer_name: get('customer_name'),
            product_name: get('product_name'),
            order_id: get('order_id'),
            location: get('location'),
            product_handle: get('product_handle'),
          };
        }).filter(r => r.phone || r.product_name);
        setPreview(rows);
      };
      reader.readAsText(f);
    }
    // For .xlsx: column validation happens on the backend
  };

  const handleSubmit = async () => {
    if (!selectedCompany) { setError('Please select a company.'); return; }
    if (!file) { setError('Please select an Excel file.'); return; }
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('company_id', selectedCompany);
      formData.append('file', file);
      const res = await fetch(`${WA_API_BASE_URL}/whatsapp/bulk-upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setFile(null);
        setPreview([]);
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setError(data.message || 'Upload failed.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [
      'phone,customer_name,product_name,order_id,location,product_handle,product_id',
      '919876543210,Ayush Sharma,Blue T-Shirt,#1001,Jaipur,blue-t-shirt,',
      '918765432109,Priya Singh,Lens Cap,#1002,Mumbai,lens-cap,',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Instructions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-3 transition-all duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md shadow-sm">
              <span className="material-symbols-outlined !text-[16px]">upload_file</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">Bulk Upload Reviews</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Upload an Excel or CSV file to send WhatsApp review requests in bulk</p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-md"
          >
            <span className="material-symbols-outlined !text-[14px]">download</span>
            Download Sample (.csv)
          </button>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-900/30 rounded-lg p-2.5 text-[10px] text-blue-800 dark:text-blue-300">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <p className="font-bold mb-1">Required columns:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1 font-mono text-[9px] opacity-80">
                <span>• phone</span>
                <span>• customer_name</span>
                <span>• product_name</span>
                <span>• order_id</span>
                <span>• location</span>
                <span>• product_handle</span>
              </div>
            </div>
            <div className="sm:border-l border-blue-200 dark:border-blue-800/30 sm:pl-4">
              <p className="font-bold mb-1">Optional columns:</p>
              <div className="font-mono text-[9px] opacity-80 mb-2">
                <span>• product_id</span>
              </div>
              <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-auto">Format: 919876543210 (country code + number, no spaces)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-3 transition-all duration-300">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl items-start">
            {/* Company Selector */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-0.5">Select Company <span className="text-red-500">*</span></label>
              <CustomCompanyDropdown
                value={selectedCompany}
                options={companies}
                onChange={val => { setSelectedCompany(val); setResult(null); setError(''); }}
                disabled={uploading}
              />
            </div>

            {/* File Upload */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-0.5">Upload File (.xlsx or .csv) <span className="text-red-500">*</span></label>
              <div
                className={`border border-dashed rounded-lg px-3 py-1.5 text-center transition-all h-[38px] flex items-center justify-center ${
                  file
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10 cursor-pointer bg-slate-50/50 dark:bg-slate-900/50'
                }`}
                onClick={(e) => {
                  if (!file) fileRef.current?.click();
                }}
              >
                <div className={`flex items-center gap-2 w-full ${!file ? 'justify-center' : ''}`}>
                  <span className={`material-symbols-outlined !text-[18px] ${file ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`}>
                    {file ? 'description' : 'cloud_upload'}
                  </span>
                  
                  {file ? (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold truncate text-left">
                        {file.name} <span className="font-normal opacity-70">({(file.size / 1024).toFixed(1)} KB)</span>
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreview([]);
                          setColumnError([]);
                          setError('');
                          setResult(null);
                          if (fileRef.current) fileRef.current.value = '';
                        }}
                        className="p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-full text-indigo-500 dark:text-indigo-400 transition-colors flex-shrink-0 ml-1"
                        title="Remove file"
                      >
                        <span className="material-symbols-outlined !text-[14px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Select file or drag & drop
                    </p>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* Column validation error */}
          {columnError.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined !text-[18px] text-red-500 mt-0.5">error</span>
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Missing required columns:</p>
                  <div className="flex flex-wrap gap-1">
                    {columnError.map(col => (
                      <span key={col} className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-mono text-xs">{col}</span>
                    ))}
                  </div>
                  <p className="text-xs text-red-500 mt-2">Check your column headers — they must match exactly (lowercase, use underscore not space).</p>
                </div>
              </div>
            </div>
          )}

          {/* CSV Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview (first {preview.length} rows)</p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Phone', 'Customer', 'Product', 'Order ID', 'Location', 'Handle'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-mono">{row.phone}</td>
                        <td className="px-3 py-2">{row.customer_name}</td>
                        <td className="px-3 py-2">{row.product_name}</td>
                        <td className="px-3 py-2">{row.order_id}</td>
                        <td className="px-3 py-2">{row.location}</td>
                        <td className="px-3 py-2">{row.product_handle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-secondary-text mt-1">Showing first {preview.length} rows only. All rows will be uploaded.</p>
            </div>
          )}

          {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-xs font-bold max-w-2xl">{error}</div>}

          {/* Result */}
          {result && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-900/30 rounded-lg p-3 flex items-center gap-2 max-w-2xl">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 !text-[18px]">check_circle</span>
              <p className="text-green-700 dark:text-green-300 font-bold text-[11px]">{result.message}</p>
            </div>
          )}

          <div className="flex justify-center max-w-3xl mt-2">
            <button
              onClick={handleSubmit}
              disabled={uploading || !selectedCompany || !file || columnError.length > 0}
              className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs"
            >
              <span className="material-symbols-outlined !text-[16px]">send</span>
              {uploading ? 'Uploading...' : 'Upload & Send Messages'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadTab;
