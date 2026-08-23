'use client';
import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import toast from 'react-hot-toast';

export default function AddOutlet({ onOutletAdded }) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [outletForm, setOutletForm] = useState({
    name: '',
    address: ''
  });
  const [outletSubmitting, setOutletSubmitting] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [togglingId, setTogglingId] = useState(null);

  // ✅ load existing outlets so they can be managed here too
  const fetchOutlets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/outlets`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setOutlets(await response.json());
      }
    } catch (err) {
      console.error('Error fetching outlets:', err);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  // ✅ enable / disable a whole outlet (ADMIN)
  const handleToggleOutlet = async (outlet) => {
    if (togglingId) return;
    setTogglingId(outlet.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/outlets/${outlet.id}/status?active=${!outlet.active}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        toast.success(`Outlet "${outlet.name}" ${!outlet.active ? 'enabled' : 'disabled'}`);
        await fetchOutlets();
        localStorage.removeItem('outlets');   // refresh cached list used across the app
        if (onOutletAdded) onOutletAdded();
      } else {
        toast.error('Failed to update outlet status');
      }
    } catch (err) {
      console.error('Error toggling outlet:', err);
      toast.error('Failed to update outlet status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleOutletFormChange = (field, value) => {
    setOutletForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddOutlet = async (e) => {
    e.preventDefault();
    setOutletSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/outlets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(outletForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Outlet added successfully!');
        // Clear localStorage to force refresh of outlets
        localStorage.removeItem('outlets');
        // Reset form
        setOutletForm({
          name: '',
          address: ''
        });
        // Call callback to refresh outlets in parent
        if (onOutletAdded) {
          onOutletAdded();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add outlet');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setOutletSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i className="pi pi-building text-green-600"></i>
          Add New Outlet
        </h1>
        <p className="text-gray-600 mt-2">Create a new outlet location for your business</p>
      </div>

      <Card className="shadow-lg">
        <form onSubmit={handleAddOutlet} className="space-y-6">
          {/* Outlet Name Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="outletName" className="font-semibold text-gray-700 flex items-center gap-2">
              <i className="pi pi-tag text-green-600"></i>
              Outlet Name
            </label>
            <InputText
              id="outletName"
              value={outletForm.name}
              onChange={(e) => handleOutletFormChange('name', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 transition-all"
              required
              placeholder="e.g., Main Branch, Downtown Outlet"
            />
          </div>

          {/* Address Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="address" className="font-semibold text-gray-700 flex items-center gap-2">
              <i className="pi pi-map-marker text-green-600"></i>
              Address
            </label>
            <InputText
              id="address"
              value={outletForm.address}
              onChange={(e) => handleOutletFormChange('address', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 transition-all"
              required
              placeholder="e.g., Lucknow, Gomti Nagar"
            />
          </div>

          <Divider />

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              label="Cancel"
              icon="pi pi-times"
              className="p-button-outlined p-button-secondary"
              onClick={() => setOutletForm({
                name: '',
                address: ''
              })}
            />
            <Button
              type="submit"
              label={outletSubmitting ? 'Creating...' : 'Create Outlet'}
              icon={outletSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
              className="p-button-success px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
              disabled={outletSubmitting}
              loading={outletSubmitting}
            />
          </div>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-green-50 border-l-4 border-green-600">
        <div className="flex gap-3">
          <i className="pi pi-info-circle text-green-600 text-xl"></i>
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Outlet Information</h3>
            <p className="text-sm text-green-700">
              Once created, this outlet will be available for user assignment and business operations.
            </p>
          </div>
        </div>
      </Card>

      {/* ✅ Existing Outlets — enable / disable whole outlets here */}
      <Card className="mt-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className="pi pi-building text-blue-600"></i>
            Your Outlets
            <span className="text-sm font-normal text-gray-500">({outlets.length})</span>
          </h2>
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            outlined
            onClick={fetchOutlets}
            className="px-4 py-2 text-sm"
          />
        </div>

        {outlets.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No outlets yet — create your first one above.</p>
        ) : (
          <div className="space-y-3">
            {outlets.map(outlet => {
              const disabled = outlet.active === false;
              return (
                <div
                  key={outlet.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 border-l-4 transition-all ${
                    disabled ? 'bg-gray-100 border-gray-300 opacity-75' : 'bg-green-50 border-green-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`pi pi-building text-xl ${disabled ? 'text-gray-400' : 'text-blue-600'}`}></i>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${disabled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {outlet.name}
                        </span>
                        <Tag
                          value={disabled ? 'Disabled' : 'Active'}
                          severity={disabled ? 'danger' : 'success'}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{outlet.address || 'No address'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium mr-1">
                      {disabled ? 'Enable outlet' : 'Disable outlet'}
                    </span>
                    <InputSwitch
                      checked={outlet.active !== false}
                      loading={togglingId === outlet.id}
                      onChange={() => handleToggleOutlet(outlet)}
                      tooltip={disabled ? 'Enable this outlet' : 'Disable this outlet (staff can no longer select it)'}
                      tooltipOptions={{ position: 'left' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
