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
import toast from 'react-hot-toast';

export default function WashPackage({ onBack }) {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [activeFilter, setActiveFilter] = useState(true);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Edit Dialog
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    active: true
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Add Dialog
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: ''
  });
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    let filtered = packages;

    // Filter by active status
    if (activeFilter !== null && activeFilter !== undefined) {
      filtered = filtered.filter(p => p.active === activeFilter);
    }

    setFilteredPackages(filtered);
  }, [activeFilter, packages]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/wash-packages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(data);
        setFilteredPackages(data);
      } else if (response.status === 401 || response.status === 403) {
        toast.error('Session expired — please log out and log in again');
      } else {
        toast.error('Failed to fetch wash packages');
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      toast.error('Error loading wash packages');
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

  const openEditDialog = (pkg) => {
    setSelectedPackage(pkg);
    setEditForm({
      name: pkg.name,
      description: pkg.description,
      active: pkg.active
    });
    setEditDialogVisible(true);
  };

  const openAddDialog = () => {
    setAddForm({
      name: '',
      description: ''
    });
    setAddDialogVisible(true);
  };

  const handleAddSubmit = async () => {
    setAddSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/wash-packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      });

      if (response.ok) {
        toast.success('Wash package added successfully!');
        setAddDialogVisible(false);
        fetchPackages();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add wash package');
      }
    } catch (err) {
      console.error('Error adding package:', err);
      toast.error('Error adding wash package');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    setEditSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/wash-packages/${selectedPackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast.success('Wash package updated successfully!');
        setEditDialogVisible(false);
        fetchPackages();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update wash package');
      }
    } catch (err) {
      console.error('Error updating package:', err);
      toast.error('Error updating wash package');
    } finally {
      setEditSubmitting(false);
    }
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
          tooltip="Edit Package"
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
          <h2 className="text-xl font-bold">Wash Packages</h2>
          <Button
            label="Add Package"
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
              placeholder="Search packages..."
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
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <Button
              icon="pi pi-arrow-left"
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-600 text-white border-0 px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
              tooltip="Back to Service Options"
              tooltipOptions={{ position: 'bottom' }}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <i className="pi pi-box text-blue-600"></i>
              Wash Package Management
            </h1>
            <p className="text-gray-600 mt-2">View and manage wash packages</p>
          </div>
        </div>
      </div>

      <Card>
        <DataTable
          value={filteredPackages}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          globalFilterFields={['name', 'description']}
          header={renderHeader()}
          emptyMessage="No packages found"
          className="p-datatable-sm"
          stripedRows
          style={{ tableLayout: 'fixed' }}
        >
          <Column field="id" header="ID" sortable style={{ width: '8%' }}></Column>
          <Column 
            field="name" 
            header="Name" 
            sortable 
            style={{ width: '35%' }}
            body={(rowData) => (
              <div className="truncate overflow-hidden" title={rowData.name}>
                {rowData.name}
              </div>
            )}
          ></Column>
          <Column 
            field="description" 
            header="Description" 
            sortable 
            style={{ width: '25%' }}
            body={(rowData) => (
              <div className="truncate overflow-hidden whitespace-nowrap" style={{ maxWidth: '100%' }} title={rowData.description}>
                {rowData.description?.length > 40 
                  ? rowData.description.substring(0, 40) + '...' 
                  : rowData.description}
              </div>
            )}
          ></Column>
          <Column field="active" header="Status" body={activeBodyTemplate} sortable style={{ width: '12%' }}></Column>
          <Column header="Actions" body={actionBodyTemplate} style={{ width: '20%' }}></Column>
        </DataTable>
      </Card>

      {/* Edit Package Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <i className="pi pi-pencil text-blue-600"></i>
            <span className="font-bold text-lg">Edit Wash Package</span>
          </div>
        }
        visible={editDialogVisible}
        style={{ width: '600px' }}
        onHide={() => setEditDialogVisible(false)}
        modal
        className="p-dialog-custom"
        footer={
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setEditDialogVisible(false)} 
              className="p-button-text p-button-secondary" 
            />
            <Button 
              label="Save Changes" 
              icon="pi pi-check" 
              onClick={handleEditSubmit} 
              loading={editSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4" 
            />
          </div>
        }
      >
        <div className="space-y-5 pt-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-tag text-gray-500 mr-2"></i>
              Package Name
            </label>
            <InputText
              id="edit-name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ cursor: 'text !important', caretColor: '#000' }}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-align-left text-gray-500 mr-2"></i>
              Description
            </label>
            <InputTextarea
              id="edit-description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ cursor: 'text !important', caretColor: '#000' }}
              rows={3}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="edit-active" className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-check-circle text-gray-500 mr-2"></i>
              Status
            </label>
            <Dropdown
              id="edit-active"
              value={editForm.active}
              options={[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false }
              ]}
              onChange={(e) => setEditForm({ ...editForm, active: e.value })}
              className="w-full"
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800">
              <i className="pi pi-info-circle mr-2"></i>
              <strong>Package ID:</strong> {selectedPackage?.id}
            </p>
          </div>
        </div>
      </Dialog>

      {/* Add Package Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <i className="pi pi-plus-circle text-green-600"></i>
            <span className="font-bold text-lg">Add New Wash Package</span>
          </div>
        }
        visible={addDialogVisible}
        style={{ width: '600px' }}
        onHide={() => setAddDialogVisible(false)}
        modal
        className="p-dialog-custom"
        footer={
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setAddDialogVisible(false)} 
              className="p-button-text p-button-secondary" 
            />
            <Button 
              label="Add Package" 
              icon="pi pi-check" 
              onClick={handleAddSubmit} 
              loading={addSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-4" 
            />
          </div>
        }
      >
        <div className="space-y-5 pt-4">
          <div>
            <label htmlFor="add-name" className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-tag text-gray-500 mr-2"></i>
              Package Name
            </label>
            <InputText
              id="add-name"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              style={{ cursor: 'text !important', caretColor: '#000' }}
              autoComplete="off"
              placeholder="e.g., Premium Wash"
            />
          </div>
          <div>
            <label htmlFor="add-description" className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-align-left text-gray-500 mr-2"></i>
              Description
            </label>
            <InputTextarea
              id="add-description"
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              style={{ cursor: 'text !important', caretColor: '#000' }}
              rows={3}
              autoComplete="off"
              placeholder="e.g., Foam + Wax + Interior Cleaning"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
