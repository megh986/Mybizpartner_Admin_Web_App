import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

const CreateCompanyTab: React.FC = () => {
  const [createCompanyEmail, setCreateCompanyEmail] = useState('');
  const [createCompanyName, setCreateCompanyName] = useState('');
  const [createCompanyId, setCreateCompanyId] = useState('');
  const [createCompanySuccess, setCreateCompanySuccess] = useState('');
  const [createCompanyError, setCreateCompanyError] = useState('');
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCompanyError('');
    setCreateCompanySuccess('');
    setCreateCompanyLoading(true);

    try {
      const response = await fetch(`${IMAGE_API_BASE_URL}/create-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createCompanyEmail,
          company_name: createCompanyName,
          company_id: createCompanyId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreateCompanySuccess(data.message || `Company "${createCompanyName}" created successfully!`);
        setCreateCompanyEmail('');
        setCreateCompanyName('');
        setCreateCompanyId('');
      } else {
        setCreateCompanyError(data.detail || data.message || 'Failed to create company');
      }
    } catch (err) {
      setCreateCompanyError('Error connecting to server. Please try again.');
      console.error('Create company error:', err);
    } finally {
      setCreateCompanyLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <span className="material-symbols-outlined">domain_add</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary-text">Create New Company</h2>
          <p className="text-xs text-secondary-text mt-1">
            Create a company and assign it to an existing user
          </p>
        </div>
      </div>

      <form onSubmit={handleCreateCompany} className="flex flex-col gap-4 max-w-xl">
        {createCompanyError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {createCompanyError}
          </div>
        )}
        {createCompanySuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {createCompanySuccess}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          Create a new company and assign it to an existing user by their email address.
        </div>

        <label className="flex flex-col">
          <p className="text-primary-text text-sm font-semibold leading-normal pb-2">User Email *</p>
          <input
            type="email"
            value={createCompanyEmail}
            onChange={(e) => setCreateCompanyEmail(e.target.value)}
            placeholder="Enter user's email address"
            required
            disabled={createCompanyLoading}
            className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3.5 outline-none transition-all"
          />
          <p className="text-xs text-secondary-text mt-1">The email of an existing user to assign this company to</p>
        </label>

        <label className="flex flex-col">
          <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Company Name *</p>
          <input
            type="text"
            value={createCompanyName}
            onChange={(e) => setCreateCompanyName(e.target.value)}
            placeholder="Enter company name"
            required
            disabled={createCompanyLoading}
            className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3.5 outline-none transition-all"
          />
        </label>

        <label className="flex flex-col">
          <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Company ID *</p>
          <input
            type="text"
            value={createCompanyId}
            onChange={(e) => setCreateCompanyId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="Enter unique company ID (e.g., my-company)"
            required
            disabled={createCompanyLoading}
            className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3.5 outline-none transition-all"
          />
          <p className="text-xs text-secondary-text mt-1">Use lowercase letters, numbers, and hyphens only</p>
        </label>

        <button
          type="submit"
          disabled={createCompanyLoading || !createCompanyEmail || !createCompanyName || !createCompanyId}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 mt-2"
        >
          <span className="material-symbols-outlined !text-[20px]">domain_add</span>
          {createCompanyLoading ? 'Creating...' : 'Create Company'}
        </button>
      </form>
    </div>
  );
};

export default CreateCompanyTab;
