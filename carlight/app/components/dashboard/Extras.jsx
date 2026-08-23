'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { FilterMatchMode } from 'primereact/api';
import { InputSwitch } from 'primereact/inputswitch';
import toast from 'react-hot-toast';

export default function Extras() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [extras, setExtras] = useState([]);
  const [filteredExtras, setFilteredExtras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [activeFilter, setActiveFilter] = useState(true);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Edit Dialog
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    active: true
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Add Dialog
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    price: 0
  });
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    fetchExtras();
  }, []);

  useEffect(() => {
    let filtered = extras;

    // Filter by active status
    if (activeFilter !== null && activeFilter !== undefined) {
      filtered = filtered.filter(e => e.active === activeFilter);
    }

    setFilteredExtras(filtered);
  }, [activeFilter, extras]);

  const fetchExtras = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/extras`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExtras(data);
        setFilteredExtras(data);
      } else {
        toast.error('Failed to fetch extras');
      }
    } catch (err) {
      console.error('Error fetching extras:', err);
      toast.error('Error loading extras');
    } finally {
      setLoading(false);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const openEditDialog = (extra) => {
    setSelectedExtra(extra);
    setEditForm({
      name: extra.name,
      price: extra.price,
      active: extra.active
    });
    setEditDialogVisible(true);
  };

  const openAddDialog = () => {
    setAddForm({
      name: '',
      price: 0
    });
    setAddDialogVisible(true);
  };

  const handleAddSubmit = async () => {
    if (!addForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!addForm.price || addForm.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setAddSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/extras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: addForm.name,
          price: addForm.price,
          active: true
        })
      });

      if (response.ok) {
        toast.success('Extra service added successfully!');
        setAddDialogVisible(false);
        fetchExtras();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add extra service');
      }
    } catch (err) {
      console.error('Error adding extra:', err);
      toast.error('Error adding extra service');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editForm.price || editForm.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setEditSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/extras/${selectedExtra.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast.success('Extra service updated successfully!');
        setEditDialogVisible(false);
        fetchExtras();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update extra service');
      }
    } catch (err) {
      console.error('Error updating extra:', err);
      toast.error('Error updating extra service');
    } finally {
      setEditSubmitting(false);
    }
  };

  const priceBodyTemplate = (rowData) => {
    return <span className="font-semibold">₹{rowData.price.toFixed(2)}</span>;
  };

  const activeBodyTemplate = (rowData) => {
    return (
      <span className={`px-3 py-1 rounded-full text-white font-semibold text-xs ${
        rowData.active ? 'bg-green-600' : 'bg-red-600'
      }`}>
        {rowData.active ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => openEditDialog(rowData)}
          tooltip="Edit Extra"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const renderHeader = () => {
    const statusOptions = [
      { label: 'Active', value: true },
      { label: 'Inactive', value: false }
    ];

    return (
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Extra Services</h2>
          <Button
            label="Add Extra"
            icon="pi pi-plus"
            onClick={openAddDialog}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold shadow-md hover:shadow-lg transition-all"
          />
        </div>
        <div className="flex gap-3 items-center">
          <Dropdown
            value={activeFilter}
            options={statusOptions}
            onChange={(e) => setActiveFilter(e.value)}
            placeholder="Filter by Status"
            className="w-40"
            showClear
          />
          <span className="p-input-icon-left">
            <i className="pi pi-search" style={{ left: '0.75rem' }} />
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Search extras..."
              className="p-inputtext-sm pl-10 pr-4 py-2 border border-gray-300"
            />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i className="pi pi-plus-circle text-blue-600"></i>
          Extra Services Management
        </h1>
        <p className="text-gray-600 mt-2">Manage additional services like tyre polish, waxing, etc.</p>
      </div>

      <Card>
        <DataTable
          value={filteredExtras}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          globalFilterFields={['name']}
          header={renderHeader()}
          emptyMessage="No extra services found"
          stripedRows
          className="text-sm"
        >
          <Column
            field="name"
            header="Name"
            sortable
            style={{ minWidth: '200px' }}
            body={(rowData) => (
              <span className="block truncate max-w-xs" title={rowData.name}>
                {rowData.name}
              </span>
            )}
          />
          <Column
            field="price"
            header="Price"
            body={priceBodyTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="active"
            header="Status"
            body={activeBodyTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Actions"
            body={actionBodyTemplate}
            style={{ minWidth: '100px' }}
          />
        </DataTable>
      </Card>

      {/* Add Dialog */}
      <Dialog
        visible={addDialogVisible}
        onHide={() => setAddDialogVisible(false)}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
              <i className="pi pi-plus-circle text-2xl text-white"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Add Extra Service</h3>
              <p className="text-sm text-gray-500">Create a new additional service</p>
            </div>
          </div>
        }
        style={{ width: '600px' }}
        className="add-extra-dialog"
      >
        <div className="pt-4 space-y-5">
          {/* Name Field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-tag text-blue-600"></i>
              Service Name <span className="text-red-500">*</span>
            </label>
            <InputText
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="e.g., Tyre Polish, Dashboard Cleaning"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <small className="text-gray-500 mt-1 block">Enter a descriptive name for the service</small>
          </div>

          {/* Price Field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-indian-rupee text-blue-600"></i>
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">₹</span>
              <InputNumber
                value={addForm.price}
                onValueChange={(e) => setAddForm({ ...addForm, price: e.value || 0 })}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                placeholder="0.00"
                className="w-full border border-gray-300"
                inputClassName="pl-8 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                min={0}
              />
            </div>
            <small className="text-gray-500 mt-1 block">Set the price for this additional service</small>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 flex items-start gap-3">
            <i className="pi pi-info-circle text-blue-600 text-lg mt-0.5"></i>
            <div className="text-sm">
              <p className="font-semibold text-blue-800 mb-1">Service Information</p>
              <p className="text-blue-700">This extra service will be available for selection during billing and will be added to the total bill amount.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setAddDialogVisible(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
              outlined
              disabled={addSubmitting}
            />
            <Button
              label="Add Service"
              icon="pi pi-check"
              onClick={handleAddSubmit}
              loading={addSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        visible={editDialogVisible}
        onHide={() => setEditDialogVisible(false)}
        modal
        header={
          <div className="flex items-center gap-3 pb-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-md">
              <i className="pi pi-pencil text-xl text-white"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Edit Extra Service</h3>
              <p className="text-xs text-gray-500 mt-0.5">Update service details and availability</p>
            </div>
          </div>
        }
        style={{ width: '550px', maxWidth: '95vw' }}
        className="edit-extra-dialog"
      >
        <div className="pt-4 space-y-4">
          {/* Service Name */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-2">
              <div className="bg-blue-600 p-1.5 rounded-md">
                <i className="pi pi-tag text-white text-xs"></i>
              </div>
              Service Name <span className="text-red-500">*</span>
            </label>
            <InputText
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="e.g., Tyre Polish, Dashboard Cleaning"
              className="w-full border border-blue-300 text-sm font-semibold p-2 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />
          </div>

          {/* Price */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-green-600 p-1.5 rounded-md">
                <i className="pi pi-indian-rupee text-white text-xs"></i>
              </div>
              <h4 className="text-sm font-bold text-gray-800">Service Price</h4>
            </div>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
              <InputNumber
                value={editForm.price}
                onValueChange={(e) => setEditForm({ ...editForm, price: e.value || 0 })}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                placeholder="0.00"
                className="w-full border border-gray-300"
                inputClassName="pl-8 p-2 rounded-md text-sm font-bold focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min={0}
              />
            </div>
            
            {/* Price Preview */}
            {editForm.price > 0 && (
              <div className="mt-3 p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-md border border-green-300">
                <div className="flex items-center gap-2">
                  <i className="pi pi-eye text-green-700 text-xs"></i>
                  <span className="text-xs font-semibold text-green-700">Preview:</span>
                  <span className="text-sm font-bold text-green-800">₹{editForm.price.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Active/Inactive Status */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-purple-600 p-1.5 rounded-md">
                  <i className="pi pi-power-off text-white text-xs"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Service Status</h4>
                  <p className="text-xs text-gray-600">
                    {editForm.active ? 'Currently available' : 'Currently unavailable'}
                  </p>
                </div>
              </div>
              <InputSwitch
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.value })}
              />
            </div>
            
            {/* Status Info */}
            <div className={`p-2 rounded-md border text-xs ${
              editForm.active 
                ? 'bg-green-100 border-green-300' 
                : 'bg-red-100 border-red-300'
            }`}>
              <div className="flex items-start gap-2">
                <i className={`pi ${editForm.active ? 'pi-check-circle text-green-700' : 'pi-times-circle text-red-700'} text-sm`}></i>
                <p className={editForm.active ? 'text-green-700' : 'text-red-700'}>
                  {editForm.active 
                    ? 'Available for selection during billing' 
                    : 'Will not be shown during billing'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setEditDialogVisible(false)}
              className="px-5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold rounded-md text-sm"
              outlined
              disabled={editSubmitting}
            />
            <Button
              label="Update Service"
              icon="pi pi-check"
              onClick={handleEditSubmit}
              loading={editSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 text-white px-5 py-2 font-semibold rounded-md shadow-md text-sm"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
