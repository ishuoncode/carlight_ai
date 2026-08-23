'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import toast from 'react-hot-toast';
import PricingMatrix from './PricingMatrix';

export default function OutletPricing({ onBack }) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [viewMode, setViewMode] = useState('matrix'); // ✅ 'matrix' = combined package+pricing view
  const [outletPackages, setOutletPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [washPackages, setWashPackages] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [carTypes, setCarTypes] = useState([]);

  // Add Dialog
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [addForm, setAddForm] = useState({
    outletId: null,
    washPackageId: null,
    active: true,
    prices: []
  });
  const [currentPrice, setCurrentPrice] = useState({
    carType: null,
    price: 0
  });
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit Dialog
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Status Toggle Dialog
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [packageToToggle, setPackageToToggle] = useState(null);
  const [toggleSubmitting, setToggleSubmitting] = useState(false);

  useEffect(() => {
    fetchEnums();
    fetchOutlets();
    fetchWashPackages();
    fetchOutletPackages();
  }, []);

  useEffect(() => {
    filterPackagesByOutlet();
  }, [selectedOutlet, selectedStatus, outletPackages]);

  const fetchEnums = async () => {
    try {
      // Check localStorage first
      const cachedEnums = localStorage.getItem('enums');
      if (cachedEnums) {
        const enums = JSON.parse(cachedEnums);
        if (enums.carTypes) {
          setCarTypes(enums.carTypes.map(type => ({ label: type, value: type })));
        }
        return;
      }

      // Fetch from API if not in localStorage
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/meta/enums`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Store in localStorage
        localStorage.setItem('enums', JSON.stringify(data));
        // Set car types for dropdown
        if (data.carTypes) {
          setCarTypes(data.carTypes.map(type => ({ label: type, value: type })));
        }
      } else {
        console.error('Failed to fetch enums');
      }
    } catch (err) {
      console.error('Error fetching enums:', err);
    }
  };

  const fetchOutlets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/outlets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOutlets(data);
      } else {
        toast.error('Failed to fetch outlets');
      }
    } catch (err) {
      console.error('Error fetching outlets:', err);
      toast.error('Error loading outlets');
    }
  };

  const fetchWashPackages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/wash-packages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWashPackages(data.filter(pkg => pkg.active));
      } else {
        toast.error('Failed to fetch wash packages');
      }
    } catch (err) {
      console.error('Error fetching wash packages:', err);
      toast.error('Error loading wash packages');
    }
  };

  const fetchOutletPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/outlet-packages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // API returns array directly, not wrapped in data object
        setOutletPackages(data || []);
        setFilteredPackages(data || []);
      } else if (response.status === 401 || response.status === 403) {
        toast.error('Session expired — please log out and log in again');
      } else {
        toast.error('Failed to fetch outlet packages');
      }
    } catch (err) {
      console.error('Error fetching outlet packages:', err);
      toast.error('Error loading outlet packages');
    } finally {
      setLoading(false);
    }
  };

  const filterPackagesByOutlet = () => {
    let filtered = outletPackages;

    // Filter by outlet
    if (selectedOutlet) {
      filtered = filtered.filter(pkg => pkg.outletId === parseInt(selectedOutlet));
    }

    // Filter by status
    if (selectedStatus === 'active') {
      filtered = filtered.filter(pkg => pkg.active === true);
    } else if (selectedStatus === 'inactive') {
      filtered = filtered.filter(pkg => pkg.active === false);
    }
    // If 'all', don't filter by status

    setFilteredPackages(filtered);
  };

  const handleAddPriceToList = () => {
    if (!currentPrice.carType || !currentPrice.price) {
      toast.error('Please select car type and enter price');
      return;
    }

    // Check if car type already exists
    const exists = addForm.prices.some(p => p.carType === currentPrice.carType);
    if (exists) {
      toast.error('This car type is already added');
      return;
    }

    setAddForm({
      ...addForm,
      prices: [...addForm.prices, { ...currentPrice }]
    });

    // Reset current price
    setCurrentPrice({ carType: null, price: 0 });
  };

  const handleRemovePriceFromList = (carType) => {
    setAddForm({
      ...addForm,
      prices: addForm.prices.filter(p => p.carType !== carType)
    });
  };

  const handleAddPackage = async () => {
    if (!addForm.outletId || !addForm.washPackageId) {
      toast.error('Please select outlet and wash package');
      return;
    }

    if (addForm.prices.length === 0) {
      toast.error('Please add at least one car type with price');
      return;
    }

    setAddSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/admin/outlet-packages/outlets/${addForm.outletId}/wash-packages/${addForm.washPackageId}/pricing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            active: addForm.active,
            prices: addForm.prices
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success('Outlet package pricing added successfully!');
        setAddDialogVisible(false);
        setAddForm({
          outletId: null,
          washPackageId: null,
          active: true,
          prices: []
        });
        setCurrentPrice({ carType: null, price: 0 });
        fetchOutletPackages();
      } else {
        toast.error(result.message || 'Failed to add outlet package');
      }
    } catch (err) {
      console.error('Error adding outlet package:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setAddSubmitting(false);
    }
  };

  const openEditDialog = (pkg) => {
    setSelectedPackage(pkg);
    setEditPrice(pkg.price);
    setEditDialogVisible(true);
  };

  const handleEditPackage = async () => {
    setEditSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/admin/outlet-packages/${selectedPackage.id}/price`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ price: editPrice }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success('Price updated successfully!');
        setEditDialogVisible(false);
        fetchOutletPackages();
      } else {
        toast.error(result.message || 'Failed to update price');
      }
    } catch (err) {
      console.error('Error updating price:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = (pkg) => {
    setPackageToToggle(pkg);
    setStatusDialogVisible(true);
  };

  const confirmToggleStatus = async () => {
    if (!packageToToggle) return;

    const newStatus = !packageToToggle.active;
    setToggleSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/admin/outlet-packages/${packageToToggle.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ active: newStatus })
        }
      );

      if (response.ok) {
        toast.success(`Outlet package ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        setStatusDialogVisible(false);
        setPackageToToggle(null);
        fetchOutletPackages();
      } else {
        const result = await response.json();
        toast.error(result.message || 'Failed to update package status');
      }
    } catch (err) {
      console.error('Error updating package status:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setToggleSubmitting(false);
    }
  };

  const priceBodyTemplate = (rowData) => {
    return (
      <span className="text-green-600 font-semibold">
        ₹{rowData.price.toLocaleString('en-IN')}
      </span>
    );
  };

  const statusBodyTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.active ? 'Active' : 'Inactive'} 
        severity={rowData.active ? 'success' : 'danger'}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          onClick={() => openEditDialog(rowData)}
          tooltip="Edit Price"
        />
        <Button
          icon={rowData.active ? "pi pi-ban" : "pi pi-check-circle"}
          rounded
          text
          severity={rowData.active ? "danger" : "success"}
          onClick={() => handleToggleStatus(rowData)}
          tooltip={rowData.active ? "Deactivate" : "Activate"}
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-4 justify-between items-center">
      <div className="flex items-center gap-3">
        <i className="pi pi-dollar text-green-600 text-2xl"></i>
        <h2 className="text-2xl font-bold text-gray-800 m-0">Outlet Pricing Management</h2>
      </div>
      <div className="flex gap-3 items-center flex-wrap">
        <Dropdown
          value={selectedOutlet}
          options={[
            { label: 'All Outlets', value: null },
            ...outlets.map(outlet => ({ label: outlet.name, value: outlet.id }))
          ]}
          onChange={(e) => setSelectedOutlet(e.value)}
          placeholder="Filter by Outlet"
          className="w-64"
          showClear={selectedOutlet !== null}
        />
        <Dropdown
          value={selectedStatus}
          options={[
            { label: 'All Status', value: 'all' },
            { label: 'Active Only', value: 'active' },
            { label: 'Inactive Only', value: 'inactive' }
          ]}
          onChange={(e) => setSelectedStatus(e.value)}
          placeholder="Filter by Status"
          className="w-48"
        />
        <Button
          label="Add Pricing"
          icon="pi pi-plus"
          onClick={() => setAddDialogVisible(true)}
          className="bg-green-600 hover:bg-green-700 text-white h-12 px-6"
        />
      </div>
    </div>
  );

  const activeChip = 'px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all';
  const matrixBtnClass = viewMode === 'matrix'
    ? 'bg-blue-600 text-white border-0'
    : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400';
  const listBtnClass = viewMode === 'list'
    ? 'bg-blue-600 text-white border-0'
    : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400';

  // ✅ Matrix view: wash packages × outlets × car types in one combined table
  if (viewMode === 'matrix') {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-3 gap-2">
          <Button
            label="Matrix View"
            icon="pi pi-th-large"
            onClick={() => setViewMode('matrix')}
            className={`${activeChip} ${matrixBtnClass}`}
          />
          <Button
            label="List View"
            icon="pi pi-list"
            onClick={() => setViewMode('list')}
            className={listBtnClass}
          />
        </div>
        <PricingMatrix onBack={onBack} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* View switcher for list mode */}
      <div className="flex justify-end mb-3 gap-2">
        <Button
          label="Matrix View"
          icon="pi pi-th-large"
          onClick={() => setViewMode('matrix')}
          className={`${activeChip} ${matrixBtnClass}`}
        />
        <Button
          label="List View"
          icon="pi pi-list"
          onClick={() => setViewMode('list')}
          className={listBtnClass}
        />
      </div>
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
              <i className="pi pi-tag text-blue-600"></i>
              Outlet Pricing Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage pricing for wash packages across different outlet locations
            </p>
          </div>
        </div>
      </div>

      <Card>
        <DataTable
          value={filteredPackages}
          loading={loading}
          header={header}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No outlet packages found. Add pricing to get started."
          className="p-datatable-sm"
          stripedRows
        >
          <Column field="outletName" header="Outlet" sortable />
          <Column field="washPackageName" header="Wash Package" sortable />
          <Column field="carType" header="Car Type" sortable />
          <Column field="price" header="Price" body={priceBodyTemplate} sortable />
          <Column field="active" header="Status" body={statusBodyTemplate} sortable />
          <Column header="Actions" body={actionBodyTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>

      {/* Add Dialog */}
      <Dialog
        visible={addDialogVisible}
        onHide={() => setAddDialogVisible(false)}
        header={
          <div className="flex items-center gap-3">
            <i className="pi pi-plus-circle text-green-600 text-2xl"></i>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Add Outlet Package Pricing</h2>
              <p className="text-sm text-gray-500 font-normal">Configure pricing for multiple car types</p>
            </div>
          </div>
        }
        modal
        blockScroll
        className="w-full max-w-3xl"
        contentClassName="pb-0"
      >
        <div className="space-y-5 p-1">
          {/* Outlet and Package Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="outlet" className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="pi pi-building text-green-600"></i>
                Outlet <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="outlet"
                value={addForm.outletId}
                options={outlets.map(outlet => ({ 
                  label: outlet.name, 
                  value: outlet.id 
                }))}
                onChange={(e) => setAddForm({ ...addForm, outletId: e.value })}
                placeholder="Select outlet location"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="package" className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="pi pi-box text-blue-600"></i>
                Wash Package <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="package"
                value={addForm.washPackageId}
                options={washPackages.map(pkg => ({ 
                  label: pkg.name, 
                  value: pkg.id 
                }))}
                onChange={(e) => setAddForm({ ...addForm, washPackageId: e.value })}
                placeholder="Select wash package"
                className="w-full"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="pi pi-dollar text-yellow-600 text-lg"></i>
              <label className="font-semibold text-gray-800 text-base">
                Configure Pricing by Car Type <span className="text-red-500">*</span>
              </label>
            </div>
            
            {/* Input Section */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-5 rounded-xl border border-green-100 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="carType" className="font-medium text-gray-700 text-sm">
                    Car Type
                  </label>
                  <Dropdown
                    id="carType"
                    value={currentPrice.carType}
                    options={carTypes}
                    onChange={(e) => setCurrentPrice({ ...currentPrice, carType: e.value })}
                    placeholder="Select type"
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="priceInput" className="font-medium text-gray-700 text-sm">
                    Price (₹)
                  </label>
                  <InputNumber
                    id="priceInput"
                    value={currentPrice.price}
                    onValueChange={(e) => setCurrentPrice({ ...currentPrice, price: e.value })}
                    mode="currency"
                    currency="INR"
                    locale="en-IN"
                    className="w-full"
                    inputClassName="p-3"
                    min={0}
                  />
                </div>
              </div>

              <Button
                label="Add to List"
                icon="pi pi-plus"
                onClick={handleAddPriceToList}
                className="w-full bg-green-600 hover:bg-green-700 border-green-600 text-white h-12"
              />
            </div>

            {/* Display added prices */}
            {addForm.prices.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                    <i className="pi pi-list text-blue-600"></i>
                    Added Prices ({addForm.prices.length})
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                  {addForm.prices.map((p) => (
                    <div 
                      key={p.carType} 
                      className="flex justify-between items-center bg-white border-2 border-gray-200 hover:border-green-400 rounded-lg p-4 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-all">
                          <i className="pi pi-car text-green-600 text-lg"></i>
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 block">{p.carType}</span>
                          <span className="text-green-600 font-semibold text-lg">₹{p.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <Button
                        icon="pi pi-trash"
                        rounded
                        outlined
                        severity="danger"
                        size="small"
                        onClick={() => handleRemovePriceFromList(p.carType)}
                        tooltip="Remove"
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {addForm.prices.length === 0 && (
              <div className="mt-4 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <i className="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
                <p className="text-gray-500 text-sm">No prices added yet. Add car types and prices above.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={() => setAddDialogVisible(false)}
              disabled={addSubmitting}
              className="px-6"
            />
            <Button
              label="Save Pricing"
              icon="pi pi-check"
              onClick={handleAddPackage}
              loading={addSubmitting}
              className="px-6 bg-white text-green-600 border-2 border-green-600 hover:bg-green-50"
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        visible={editDialogVisible}
        onHide={() => setEditDialogVisible(false)}
        header={
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <i className="pi pi-pencil text-blue-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Edit Package Price</h2>
              <p className="text-sm text-gray-500 font-normal mt-1">Update pricing information</p>
            </div>
          </div>
        }
        modal
        blockScroll
        className="w-full max-w-xl"
        contentClassName="pb-0"
      >
        {selectedPackage && (
          <div className="space-y-6 p-1">
            {/* Package Information Card */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-blue-200 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-500 p-1.5 rounded-md">
                        <i className="pi pi-building text-white text-sm"></i>
                      </div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Outlet</p>
                    </div>
                    <p className="font-bold text-gray-900 text-lg pl-7">{selectedPackage.outletName}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-purple-500 p-1.5 rounded-md">
                        <i className="pi pi-car text-white text-sm"></i>
                      </div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Car Type</p>
                    </div>
                    <p className="font-bold text-gray-900 text-lg pl-7">{selectedPackage.carType}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-green-500 p-1.5 rounded-md">
                        <i className="pi pi-box text-white text-sm"></i>
                      </div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Package</p>
                    </div>
                    <p className="font-bold text-gray-900 text-lg pl-7">{selectedPackage.washPackageName}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-yellow-500 p-1.5 rounded-md">
                        <i className="pi pi-money-bill text-white text-sm"></i>
                      </div>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Current Price</p>
                    </div>
                    <p className="font-bold text-green-600 text-2xl pl-7">₹{selectedPackage.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Input Section */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
              <div className="flex flex-col gap-3">
                <label htmlFor="editPrice" className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <i className="pi pi-dollar text-orange-600"></i>
                  </div>
                  New Price
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <InputNumber
                  id="editPrice"
                  value={editPrice}
                  onValueChange={(e) => setEditPrice(e.value)}
                  mode="currency"
                  currency="INR"
                  locale="en-IN"
                  className="w-full"
                  inputClassName="p-4 text-xl font-bold border-2 border-gray-300 focus:border-blue-500"
                  min={0}
                  placeholder="Enter new price"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-5 border-t-2 border-gray-200">
              <Button
                label="Cancel"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={() => setEditDialogVisible(false)}
                disabled={editSubmitting}
                className="px-8 py-3 font-semibold"
              />
              <Button
                label="Update Price"
                icon="pi pi-check"
                onClick={handleEditPackage}
                loading={editSubmitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Status Toggle Dialog */}
      <Dialog
        visible={statusDialogVisible}
        onHide={() => setStatusDialogVisible(false)}
        header={
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${packageToToggle?.active ? 'bg-red-100' : 'bg-green-100'}`}>
              <i className={`text-xl ${packageToToggle?.active ? 'pi pi-ban text-red-600' : 'pi pi-check-circle text-green-600'}`}></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {packageToToggle?.active ? 'Deactivate' : 'Activate'} Package Pricing
              </h2>
              <p className="text-sm text-gray-500 font-normal mt-1">
                {packageToToggle?.active ? 'This will make the pricing inactive' : 'This will make the pricing active'}
              </p>
            </div>
          </div>
        }
        modal
        blockScroll
        className="w-full max-w-lg"
        contentClassName="pb-0"
      >
        {packageToToggle && (
          <div className="space-y-5 p-1">
            {/* Warning/Info Message */}
            <div className={`bg-gradient-to-br ${packageToToggle.active ? 'from-orange-50 to-red-50 border-orange-200' : 'from-green-50 to-emerald-50 border-green-200'} border-2 rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg mt-1 ${packageToToggle.active ? 'bg-orange-500' : 'bg-green-500'}`}>
                  <i className="pi pi-info-circle text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">What will happen?</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {packageToToggle.active ? (
                      <>
                        This pricing configuration will be marked as <span className="font-bold text-red-600">inactive</span> and will no longer be available for bookings. You can reactivate it later if needed.
                      </>
                    ) : (
                      <>
                        This pricing configuration will be marked as <span className="font-bold text-green-600">active</span> and will be available for bookings immediately.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i className="pi pi-list text-blue-600"></i>
                Package Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm font-medium">Outlet:</span>
                  <span className="font-bold text-gray-800">{packageToToggle.outletName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm font-medium">Package:</span>
                  <span className="font-bold text-gray-800">{packageToToggle.washPackageName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm font-medium">Car Type:</span>
                  <span className="font-bold text-gray-800">{packageToToggle.carType}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm font-medium">Current Price:</span>
                  <span className="font-bold text-green-600 text-lg">₹{packageToToggle.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-medium">Current Status:</span>
                  <span className={`font-bold text-lg ${packageToToggle.active ? 'text-green-600' : 'text-red-600'}`}>
                    {packageToToggle.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200">
              <Button
                label="Cancel"
                icon="pi pi-times"
                outlined
                onClick={() => {
                  setStatusDialogVisible(false);
                  setPackageToToggle(null);
                }}
                disabled={toggleSubmitting}
                className="px-6 py-3 font-semibold"
              />
              <Button
                label={packageToToggle.active ? 'Deactivate' : 'Activate'}
                icon={packageToToggle.active ? 'pi pi-ban' : 'pi pi-check-circle'}
                severity={packageToToggle.active ? 'danger' : 'success'}
                onClick={confirmToggleStatus}
                loading={toggleSubmitting}
                className={`px-6 py-3 font-semibold ${packageToToggle.active ? 'bg-red-600 hover:bg-red-700 border-red-600' : 'bg-green-600 hover:bg-green-700 border-green-600'} text-white`}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
