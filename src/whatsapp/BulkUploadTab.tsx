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
    <div className="flex flex-col gap-6">
      {/* Instructions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined">upload_file</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-text">Bulk Upload Reviews</h2>
            <p className="text-xs text-secondary-text mt-1">Upload an Excel or CSV file to send WhatsApp review requests in bulk</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">Required columns in your file:</p>
          <div className="grid grid-cols-2 gap-1 font-mono text-xs">
            <span>• phone</span>
            <span>• customer_name</span>
            <span>• product_name</span>
            <span>• order_id</span>
            <span>• location</span>
            <span>• product_handle</span>
          </div>
          <p className="mt-2 font-semibold">Optional columns:</p>
          <div className="grid grid-cols-2 gap-1 font-mono text-xs">
            <span>• product_id</span>
          </div>
          <p className="mt-3 text-xs text-blue-600">Phone number format: 919876543210 (country code + number, no + or spaces)</p>
        </div>

        <button
          onClick={downloadTemplate}
          className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <span className="material-symbols-outlined !text-[18px]">download</span>
          Download sample template (.csv)
        </button>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col gap-5 max-w-2xl">
          {/* Company Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-primary-text">Select Company *</label>
            <select
              value={selectedCompany}
              onChange={e => { setSelectedCompany(e.target.value); setResult(null); setError(''); }}
              className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3.5 outline-none transition-all"
            >
              <option value="">-- Select a company --</option>
              {companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-primary-text">Upload File (.xlsx or .csv) *</label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              <span className="material-symbols-outlined text-gray-400 !text-[40px] mb-2">cloud_upload</span>
              <p className="text-sm text-secondary-text">
                {file ? (
                  <span className="text-indigo-600 font-medium">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                ) : (
                  <>Click to select file or drag and drop</>
                )}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
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

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600 !text-[22px]">check_circle</span>
              <p className="text-green-700 font-semibold text-sm">{result.message}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={uploading || !selectedCompany || !file || columnError.length > 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <span className="material-symbols-outlined !text-[20px]">send</span>
            {uploading ? 'Uploading & Sending...' : 'Upload & Send Messages'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadTab;
