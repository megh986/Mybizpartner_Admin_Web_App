import React, { useState, useEffect, useCallback } from 'react';
import type { Company } from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

type InputMode = 'keyvalue' | 'json';

interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  children: KeyValueRow[];
}

function generateRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Convert details object to tree of rows; nested objects become rows with children */
function objectToRows(obj: Record<string, unknown>): KeyValueRow[] {
  return Object.entries(obj).map(([k, v]) => {
    const isNested = v !== null && typeof v === 'object' && !Array.isArray(v);
    return {
      id: generateRowId(),
      key: k,
      value: isNested ? '' : (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)),
      children: isNested ? objectToRows(v as Record<string, unknown>) : [],
    };
  });
}

/** Parse a single value string to number, boolean, or JSON object/array */
function parseValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d*\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/** Build details object from tree of rows; rows with children become nested objects */
function rowsToObject(rows: KeyValueRow[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  rows.forEach((row) => {
    const trimmedKey = row.key.trim();
    if (!trimmedKey) return;
    if (row.children.length > 0) {
      out[trimmedKey] = rowsToObject(row.children);
    } else {
      out[trimmedKey] = parseValue(row.value);
    }
  });
  return out;
}

/** Immutable update: find row by id and apply updater (returns new tree) */
function updateRowInTree(rows: KeyValueRow[], id: string, updater: (r: KeyValueRow) => KeyValueRow): KeyValueRow[] {
  return rows.map((r) => {
    if (r.id === id) return updater(r);
    return { ...r, children: updateRowInTree(r.children, id, updater) };
  });
}

/** Immutable: add a child to the row with given id */
function addSubfieldInTree(rows: KeyValueRow[], parentId: string, child: KeyValueRow): KeyValueRow[] {
  return rows.map((r) => {
    if (r.id === parentId) {
      return { ...r, children: [...r.children, child] };
    }
    return { ...r, children: addSubfieldInTree(r.children, parentId, child) };
  });
}

/** Immutable: remove row (and its subtree) by id */
function removeRowInTree(rows: KeyValueRow[], id: string): KeyValueRow[] {
  return rows
    .filter((r) => r.id !== id)
    .map((r) => ({ ...r, children: removeRowInTree(r.children, id) }));
}

interface NestedRowBlockProps {
  row: KeyValueRow;
  depth: number;
  isViewMode: boolean;
  canEdit: boolean;
  onUpdateRow: (id: string, field: 'key' | 'value', value: string) => void;
  onRemoveRow: (id: string) => void;
  onAddSubfield: (parentId: string) => void;
}

function NestedRowBlock({
  row,
  depth,
  isViewMode,
  canEdit,
  onUpdateRow,
  onRemoveRow,
  onAddSubfield,
}: NestedRowBlockProps) {
  const hasChildren = row.children.length > 0;
  const indent = depth * 24;

  return (
    <div className="space-y-1.5 relative">
      {depth > 0 && (
        <div 
          className="absolute left-[-16px] top-0 bottom-1/2 w-4 border-l-2 border-b-2 border-slate-200 dark:border-slate-800 rounded-bl-xl pointer-events-none" 
          style={{ height: '24px' }}
        />
      )}
      <div
        className="grid grid-cols-12 gap-3 items-center relative"
        style={{ marginLeft: indent }}
      >
        <div className="col-span-4 relative">
          <input
            type="text"
            value={row.key}
            onChange={(e) => onUpdateRow(row.id, 'key', e.target.value)}
            readOnly={isViewMode}
            placeholder={depth === 0 ? 'e.g. homepage_banner_text' : 'e.g. season'}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm px-3.5 py-2.5 outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all disabled:opacity-60 disabled:cursor-default"
          />
        </div>
        {hasChildren ? (
          <div className="col-span-5 text-xs text-slate-400 dark:text-slate-500 font-semibold italic flex items-center gap-1.5 pl-2">
            <span className="material-symbols-outlined !text-[16px] text-slate-350 dark:text-slate-700">folder_open</span>
            (nested, {row.children.length} subfield{row.children.length !== 1 ? 's' : ''})
          </div>
        ) : (
          <div className="col-span-5">
            <input
              type="text"
              value={row.value}
              onChange={(e) => onUpdateRow(row.id, 'value', e.target.value)}
              readOnly={isViewMode}
              placeholder="e.g. Glow like never before"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm px-3.5 py-2.5 outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all disabled:opacity-60 disabled:cursor-default"
            />
          </div>
        )}
        <div className="col-span-3 flex items-center gap-1 justify-end">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => onAddSubfield(row.id)}
                className="p-2 rounded-xl text-[#FF6B35] hover:bg-[#FF6B35]/10 dark:hover:bg-[#FF6B35]/20 transition-all cursor-pointer"
                title="Add subfield"
              >
                <span className="material-symbols-outlined !text-[18px]">subdirectory_arrow_right</span>
              </button>
              <button
                type="button"
                onClick={() => onRemoveRow(row.id)}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 transition-all cursor-pointer"
                title="Remove row"
              >
                <span className="material-symbols-outlined !text-[18px]">delete</span>
              </button>
            </>
          )}
        </div>
      </div>
      {row.children.map((child) => (
        <NestedRowBlock
          key={child.id}
          row={child}
          depth={depth + 1}
          isViewMode={isViewMode}
          canEdit={canEdit}
          onUpdateRow={onUpdateRow}
          onRemoveRow={onRemoveRow}
          onAddSubfield={onAddSubfield}
        />
      ))}
    </div>
  );
}

export interface ExtraDetailTabProps {
  userData: { role?: string; company_ids?: string[] } | null;
  companies: Company[];
  selectedCompany: string;
  loading: boolean;
  error: string;
  success: string;
  setError: (s: string) => void;
  setSuccess: (s: string) => void;
  setLoading: (b: boolean) => void;
  setSelectedCompany: (id: string) => void;
  isCompanyAutoSelected: boolean;
  renderSearchableCompanyDropdown: (
    disabled: boolean,
    onCompanyChange: (id: string) => void,
    placeholder: string,
    focusRingColor: string,
    useCompanyName?: boolean
  ) => React.ReactNode;
}

type ExtraDetailAction = 'view' | 'create';

const ExtraDetailTab: React.FC<ExtraDetailTabProps> = ({
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
  const [action, setAction] = useState<ExtraDetailAction>('view');
  const [details, setDetails] = useState<Record<string, unknown>>({});
  const [detailsJson, setDetailsJson] = useState('{}');
  const [inputMode, setInputMode] = useState<InputMode>('keyvalue');
  const [keyValueRows, setKeyValueRows] = useState<KeyValueRow[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('session_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const parseJson = (raw: string): Record<string, unknown> | null => {
    try {
      const trimmed = raw.trim();
      if (!trimmed) return {};
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return null;
    }
  };

  const doFetch = useCallback(async () => {
    if (!selectedCompany) return;
    setError('');
    setSuccess('');
    setFetchLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/extra-details/${selectedCompany}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.message || 'Failed to fetch extra details');
        return;
      }
      const d = data.details ?? {};
      setDetails(d as Record<string, unknown>);
      setDetailsJson(JSON.stringify(d, null, 2));
      setKeyValueRows(objectToRows(d as Record<string, unknown>));
      setInputMode('keyvalue');
      setIsEditing(false);
      setSuccess(Object.keys(d).length ? 'Extra details loaded.' : 'No extra details for this company.');
    } catch (err) {
      setError('Error fetching extra details. Please try again.');
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedCompany, setError, setSuccess]);

  const handleFetch = () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    doFetch();
  };

  // In View mode, auto-fetch extra details when company is selected (e.g. auto-selected on login)
  useEffect(() => {
    if (action === 'view' && selectedCompany) {
      doFetch();
    }
  }, [action, selectedCompany, doFetch]);

  const handleSave = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    const parsed = inputMode === 'keyvalue'
      ? rowsToObject(keyValueRows)
      : parseJson(detailsJson);
    if (parsed === null) {
      setError('Invalid JSON in details. Please fix and try again.');
      return;
    }
    setError('');
    setSuccess('');
    setSaveLoading(true);
    try {
      if (action === 'create') {
        const res = await fetch(`${API_BASE_URL}/extra-details`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ company_id: selectedCompany, details: parsed }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || data.message || 'Failed to save extra details');
          return;
        }
        setSuccess('Extra details created successfully.');
        setDetails(parsed);
        setDetailsJson(JSON.stringify(parsed, null, 2));
        setKeyValueRows(objectToRows(parsed));
        setInputMode('keyvalue');
        setAction('view');
        setIsEditing(false);
      } else {
        const res = await fetch(`${API_BASE_URL}/extra-details/${selectedCompany}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ details: parsed }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || data.message || 'Failed to update extra details');
          return;
        }
        setSuccess('Extra details updated successfully.');
        setDetails(parsed);
        setDetailsJson(JSON.stringify(parsed, null, 2));
        setKeyValueRows(objectToRows(parsed));
        setInputMode('keyvalue');
        setIsEditing(false);
      }
    } catch (err) {
      setError('Error saving extra details. Please try again.');
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const startEdit = () => {
    setDetailsJson(JSON.stringify(details, null, 2));
    setKeyValueRows(objectToRows(details));
    setInputMode('keyvalue');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDetailsJson(JSON.stringify(details, null, 2));
    setKeyValueRows(objectToRows(details));
    setIsEditing(false);
  };

  const addRow = () => {
    setKeyValueRows((prev) => [...prev, { id: generateRowId(), key: '', value: '', children: [] }]);
  };

  const addSubfield = (parentId: string) => {
    setKeyValueRows((prev) =>
      addSubfieldInTree(prev, parentId, { id: generateRowId(), key: '', value: '', children: [] })
    );
  };

  const removeRow = (id: string) => {
    setKeyValueRows((prev) => removeRowInTree(prev, id));
  };

  const updateRow = (id: string, field: 'key' | 'value', value: string) => {
    setKeyValueRows((prev) =>
      updateRowInTree(prev, id, (r) => ({ ...r, [field]: value }))
    );
  };

  const switchToJson = () => {
    const obj = inputMode === 'keyvalue' ? rowsToObject(keyValueRows) : parseJson(detailsJson) ?? {};
    setDetailsJson(JSON.stringify(obj, null, 2));
    setInputMode('json');
  };

  const switchToKeyValue = () => {
    const obj = parseJson(detailsJson) ?? {};
    setKeyValueRows(objectToRows(obj));
    setInputMode('keyvalue');
  };

  const isViewMode = action === 'view' && !isEditing;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden mt-2 transition-all duration-300">
      <div className="flex flex-col md:flex-row min-h-[450px]">
        
        {/* ── Left sidebar: Settings & Context ── */}
        <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col">
          
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm">
                <span className="material-symbols-outlined !text-[16px]">tune</span>
              </div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Extra Details</h2>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
              Store flexible key-value configurations per company (e.g. homepage text, active flags).
            </p>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-5">
            {/* Action Toggle */}
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Mode</span>
              <div className="flex flex-col gap-1.5">
                {(['view', 'create'] as const).map((act) => {
                  const isActive = action === act;
                  return (
                    <button
                      key={act}
                      onClick={() => {
                        setAction(act);
                        if (act === 'view') {
                          setIsEditing(false);
                          setError('');
                          setSuccess('');
                        } else {
                          setIsEditing(true);
                          setDetails({});
                          setDetailsJson('{}');
                          setKeyValueRows([{ id: generateRowId(), key: '', value: '', children: [] }]);
                          setInputMode('keyvalue');
                          setError('');
                          setSuccess('');
                        }
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'border-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined !text-[18px] shrink-0 ${isActive ? '' : 'text-slate-400 dark:text-slate-500'}`}>
                          {act === 'view' ? 'visibility' : 'add_circle'}
                        </span>
                        <span className="text-xs font-bold leading-tight">{act === 'view' ? 'View / Edit' : 'Create New'}</span>
                        {isActive && <span className="material-symbols-outlined !text-[14px] ml-auto shrink-0">check_circle</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company Selection */}
            {!isCompanyAutoSelected && (
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Company</span>
                {renderSearchableCompanyDropdown(
                  loading,
                  (id) => {
                    setSelectedCompany(id);
                    setError('');
                    setSuccess('');
                    if (action === 'view') {
                      setDetails({});
                      setDetailsJson('{}');
                      setIsEditing(false);
                    }
                  },
                  'Search by company ID...',
                  'focus:ring-indigo-500/20 focus:border-indigo-500',
                  false
                )}
              </div>
            )}

            {/* View Context Messages */}
            {action === 'view' && !selectedCompany && (
              <div className="mt-auto py-4 text-center bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-2xl mb-1 text-slate-300 dark:text-slate-600 block">info</span>
                <span className="text-[10px] font-semibold px-2 block">{isCompanyAutoSelected ? 'Loading company…' : 'Select a company to load'}</span>
              </div>
            )}

            {action === 'view' && selectedCompany && (
              <div className="mt-auto">
                {fetchLoading ? (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 justify-center py-2">
                    <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading details…
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleFetch}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined !text-[14px]">refresh</span>
                    Refresh Details
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: Configuration workspace ── */}
        <div className="flex-1 min-w-0 p-4 md:p-6 flex flex-col bg-white dark:bg-slate-900">
          
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 text-red-750 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined !text-[18px]">error</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 cursor-pointer"><span className="material-symbols-outlined !text-[16px]">close</span></button>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined !text-[18px]">check_circle</span>
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer"><span className="material-symbols-outlined !text-[16px]">close</span></button>
            </div>
          )}

          {(!selectedCompany && action === 'create') || (action === 'view' && !selectedCompany) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-60">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-3 block">domain</span>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Company Required</h3>
              <p className="text-xs text-slate-500 dark:text-slate-500">Please select a company from the sidebar to {action === 'create' ? 'create' : 'view'} extra details.</p>
            </div>
          ) : (
            <>
              {/* Workspace Header */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500 !text-[18px]">
                    {inputMode === 'keyvalue' ? 'list_alt' : 'data_object'}
                  </span>
                  {inputMode === 'keyvalue' ? 'Configuration Fields' : 'JSON Raw Editor'}
                </h3>
                <div className="flex items-center gap-3">
                  {action === 'view' && isViewMode && Object.keys(details).length > 0 && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined !text-[14px]">edit</span>
                      Edit Fields
                    </button>
                  )}
                  {(action === 'create' || isEditing) && (
                    <div className="flex gap-1 bg-slate-100/70 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200/40 dark:border-slate-700/40">
                      <button
                        type="button"
                        onClick={switchToKeyValue}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          inputMode === 'keyvalue'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <span className="material-symbols-outlined !text-[14px]">table_rows</span>
                        Key-Value
                      </button>
                      <button
                        type="button"
                        onClick={switchToJson}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          inputMode === 'json'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <span className="material-symbols-outlined !text-[14px]">data_object</span>
                        JSON
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Workspace Content */}
              {inputMode === 'keyvalue' ? (
                <div className="flex-1 overflow-visible">
                  {action === 'view' && fetchLoading ? (
                    <div className="py-12 text-center text-slate-400 dark:text-slate-550 font-semibold text-sm">
                      <span className="material-symbols-outlined text-4xl mb-2 animate-pulse">hourglass_empty</span>
                      <p>Loading fields…</p>
                    </div>
                  ) : action === 'view' && Object.keys(details).length === 0 && !isEditing ? (
                    <div className="py-12 flex flex-col items-center text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                      <span className="material-symbols-outlined text-4xl mb-2 text-slate-300 dark:text-slate-600">inbox</span>
                      <p className="font-semibold text-xs">No configuration fields saved yet.</p>
                      <p className="text-[10px] mt-1">Switch to Create New mode to add fields.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-3 rounded-xl mb-4 flex items-start gap-2">
                        <span className="material-symbols-outlined text-indigo-500 !text-[16px] mt-0.5 shrink-0">info</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          Use <strong>Add subfield</strong> on a row to nest keys under it (e.g. <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-indigo-600">extra_notes</code> with subfields <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-indigo-600">season</code>). For arrays, enter valid JSON in Value field (e.g. <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-indigo-600">["id1"]</code>).
                        </p>
                      </div>
                      <div className="grid grid-cols-12 gap-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 px-1 pb-2 border-b border-slate-100 dark:border-slate-800/60 mb-2">
                        <div className="col-span-4 pl-1">Key</div>
                        <div className="col-span-5">Value</div>
                        <div className="col-span-3 text-right pr-2">Actions</div>
                      </div>
                      <div className="space-y-2">
                        {(action === 'view' && isViewMode ? objectToRows(details) : keyValueRows).map((row) => (
                          <NestedRowBlock
                            key={row.id}
                            row={row}
                            depth={0}
                            isViewMode={action === 'view' && isViewMode}
                            canEdit={action === 'create' || isEditing}
                            onUpdateRow={updateRow}
                            onRemoveRow={removeRow}
                            onAddSubfield={addSubfield}
                          />
                        ))}
                      </div>
                      {(action === 'create' || isEditing) && (
                        <button
                          type="button"
                          onClick={addRow}
                          className="inline-flex items-center justify-center w-full gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-xl py-3 mt-4 cursor-pointer transition-all"
                        >
                          <span className="material-symbols-outlined !text-[16px]">add</span>
                          Add Root Field
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex-1 relative flex flex-col">
                  <textarea
                    value={detailsJson}
                    onChange={(e) => setDetailsJson(e.target.value)}
                    readOnly={action === 'view' && isViewMode}
                    placeholder='{"key1": "value1", "key2": 123, "nested": {"a": true}}'
                    className={`flex-1 min-h-[300px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-sm p-4 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent ${isViewMode ? 'cursor-default opacity-90' : ''}`}
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Save/Cancel Action Footer */}
              {(action === 'create' || isEditing) && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                  {action === 'view' && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saveLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 disabled:opacity-50 transition-colors text-xs cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <span className="material-symbols-outlined !text-[16px]">close</span>
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined !text-[16px]">save</span>
                    {saveLoading ? 'Saving...' : action === 'create' ? 'Create Settings' : 'Save Changes'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtraDetailTab;
