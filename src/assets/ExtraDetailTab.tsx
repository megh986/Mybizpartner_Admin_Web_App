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
  const indent = depth * 20;

  return (
    <div className="space-y-1">
      <div
        className="grid grid-cols-12 gap-2 items-center"
        style={{ marginLeft: indent }}
      >
        <input
          type="text"
          value={row.key}
          onChange={(e) => onUpdateRow(row.id, 'key', e.target.value)}
          readOnly={isViewMode}
          placeholder={depth === 0 ? 'e.g. homepage_banner_text' : 'e.g. season'}
          className="col-span-4 rounded-lg border border-gray-200 bg-gray-50 text-primary-text text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100 disabled:cursor-default"
        />
        {hasChildren ? (
          <div className="col-span-5 text-xs text-secondary-text flex items-center gap-1">
            <span className="italic">(nested, {row.children.length} subfield{row.children.length !== 1 ? 's' : ''})</span>
          </div>
        ) : (
          <input
            type="text"
            value={row.value}
            onChange={(e) => onUpdateRow(row.id, 'value', e.target.value)}
            readOnly={isViewMode}
            placeholder="e.g. Glow like never before"
            className="col-span-5 rounded-lg border border-gray-200 bg-gray-50 text-primary-text text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100 disabled:cursor-default"
          />
        )}
        <div className="col-span-3 flex items-center gap-1 justify-end">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => onAddSubfield(row.id)}
                className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                title="Add subfield"
              >
                <span className="material-symbols-outlined !text-[18px]">subdirectory_arrow_right</span>
              </button>
              <button
                type="button"
                onClick={() => onRemoveRow(row.id)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Remove row"
              >
                <span className="material-symbols-outlined !text-[20px]">delete</span>
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
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-primary-text mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">tune</span>
          Extra Details
        </h2>
        <p className="text-secondary-text text-sm mb-6">
          Store flexible key-value data per company (e.g. homepage banner text, theme, feature flags). Different companies can have different keys.
        </p>

        {/* Action: View vs Create */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-primary-text mb-3">Action</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="extraDetailAction"
                checked={action === 'view'}
                onChange={() => {
                  setAction('view');
                  setIsEditing(false);
                  setError('');
                  setSuccess('');
                }}
                className="w-4 h-4 text-primary"
              />
              <span className="text-primary-text">View / Edit</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="extraDetailAction"
                checked={action === 'create'}
                onChange={() => {
                  setAction('create');
                  setIsEditing(true);
                  setDetails({});
                  setDetailsJson('{}');
                  setKeyValueRows([{ id: generateRowId(), key: '', value: '', children: [] }]);
                  setInputMode('keyvalue');
                  setError('');
                  setSuccess('');
                }}
                className="w-4 h-4 text-primary"
              />
              <span className="text-primary-text">Create</span>
            </label>
          </div>
        </div>

        {/* Company: auto-selected for single-company users, else show dropdown */}
        {!isCompanyAutoSelected && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-primary-text mb-2">Company *</label>
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
              'focus:ring-2 focus:ring-primary/20 focus:border-primary',
              false
            )}
          </div>
        )}

        {action === 'view' && !selectedCompany && (
          <div className="mb-6">
            <p className="text-sm text-secondary-text">
              {isCompanyAutoSelected ? 'Loading company…' : 'Select a company to view or edit extra details.'}
            </p>
          </div>
        )}

        {action === 'view' && selectedCompany && (
          <div className="mb-6 space-y-3">
            {fetchLoading && (
              <p className="text-sm text-secondary-text">Loading extra details…</p>
            )}
            {!fetchLoading && Object.keys(details).length === 0 && !isEditing && (
              <p className="text-sm text-secondary-text">
                No extra details found for this company yet.
              </p>
            )}
            {!fetchLoading && (Object.keys(details).length > 0 || isEditing) && (
              <button
                type="button"
                onClick={handleFetch}
                disabled={fetchLoading}
                className="text-sm text-primary hover:underline"
              >
                Refresh
              </button>
            )}
          </div>
        )}

        {/* Details display / edit */}
        {(action === 'create' || (action === 'view' && (Object.keys(details).length > 0 || isEditing || fetchLoading))) && (
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="text-sm font-bold text-primary-text">
                {inputMode === 'keyvalue' ? 'Details (Key–Value)' : 'Details (JSON)'}
              </h3>
              <div className="flex items-center gap-3">
                {action === 'view' && isViewMode && Object.keys(details).length > 0 && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined !text-[16px]">edit</span>
                    Edit
                  </button>
                )}
                {(action === 'create' || isEditing) && (
                  <button
                    type="button"
                    onClick={inputMode === 'keyvalue' ? switchToJson : switchToKeyValue}
                    className="text-sm text-secondary-text hover:text-primary hover:underline"
                  >
                    {inputMode === 'keyvalue' ? 'Use JSON instead' : 'Use Key–Value instead'}
                  </button>
                )}
              </div>
            </div>

            {inputMode === 'keyvalue' ? (
              <div className="space-y-3">
                {action === 'view' && fetchLoading ? (
                  <p className="text-sm text-secondary-text py-4">Loading extra details…</p>
                ) : (
                  <>
                    <p className="text-xs text-secondary-text mb-1">
                      Use <strong>Add subfield</strong> on a row to nest keys under it (e.g. <code className="bg-gray-100 px-1 rounded">extra_notes</code> with subfields <code className="bg-gray-100 px-1 rounded">season</code>, <code className="bg-gray-100 px-1 rounded">campaign</code>). For arrays, enter JSON in Value (e.g. <code className="bg-gray-100 px-1 rounded">["id1", "id2"]</code>).
                    </p>
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-secondary-text px-1">
                      <div className="col-span-4">Key</div>
                      <div className="col-span-5">Value</div>
                      <div className="col-span-3" />
                    </div>
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
                    {(action === 'create' || isEditing) && (
                      <button
                        type="button"
                        onClick={addRow}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-2"
                      >
                        <span className="material-symbols-outlined !text-[18px]">add_circle</span>
                        Add row
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <textarea
                value={detailsJson}
                onChange={(e) => setDetailsJson(e.target.value)}
                readOnly={action === 'view' && isViewMode}
                placeholder='{"key1": "value1", "key2": 123, "nested": {"a": true}}'
                rows={14}
                className={`w-full rounded-lg border border-gray-200 bg-gray-50 text-primary-text font-mono text-sm p-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${isViewMode ? 'cursor-default' : ''}`}
                spellCheck={false}
              />
            )}

            {(action === 'create' || isEditing) && (
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-white font-medium px-4 py-2.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined !text-[18px]">save</span>
                  {saveLoading ? 'Saving...' : action === 'create' ? 'Create' : 'Save'}
                </button>
                {action === 'view' && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saveLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-primary-text font-medium px-4 py-2.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtraDetailTab;
