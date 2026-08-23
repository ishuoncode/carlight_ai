'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import * as XLSX from 'xlsx';

const CouponManagement = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toast = React.useRef(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [cars, setCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(false);

  // Renew (expired / exhausted coupons)
  const [renewDialogVisible, setRenewDialogVisible] = useState(false);
  const [couponToRenew, setCouponToRenew] = useState(null);
  const [renewForm, setRenewForm] = useState({ validTill: null, resetUsage: false, maxUses: null });
  const [renewError, setRenewError] = useState('');
  const [renewingCoupon, setRenewingCoupon] = useState(false);

  // Edit usage (any time — active or expired coupons)
  const [usageDialogVisible, setUsageDialogVisible] = useState(false);
  const [usageCoupon, setUsageCoupon] = useState(null);
  const [usageForm, setUsageForm] = useState({ maxUses: null, usedCount: null });
  const [usageError, setUsageError] = useState('');
  const [savingUsage, setSavingUsage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENT',
    discountValue: '',
    validTill: null,
    outletId: null,
    carId: null,
    maxUses: 999999,
    oncePerCar: false
  });

  // Fetch outlets
  const fetchOutlets = async () => {
    try {
      const cachedOutlets = localStorage.getItem('outlets');
      if (cachedOutlets) {
        const parsedOutlets = JSON.parse(cachedOutlets);
        setOutlets(parsedOutlets.map(outlet => ({
          label: outlet.name,
          value: outlet.id
        })));
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/outlets`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('outlets', JSON.stringify(data));
        setOutlets(data.map(outlet => ({
          label: outlet.name,
          value: outlet.id
        })));
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  // Fetch cars
  const fetchCars = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCars(data.map(car => ({
          label: `${car.carNo || car.carNumber || 'N/A'} - ${car.customerName || car.ownerName || car.owner || 'Unknown'}`,
          value: car.id
        })));
      } else {
        console.error('Failed to fetch cars:', response.status);
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  // Fetch coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch coupons',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch coupons',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // Add coupon
  const validateForm = () => {
    const errors = {};
    if (!formData.code || formData.code.trim().length < 3) {
      errors.code = 'Code must be at least 3 characters';
    }
    const value = parseFloat(formData.discountValue);
    if (!formData.discountValue || isNaN(value) || value <= 0) {
      errors.discountValue = 'Enter a discount greater than 0';
    } else if (formData.discountType === 'PERCENT' && value > 100) {
      errors.discountValue = 'Percentage cannot exceed 100%';
    }
    if (!formData.validTill) {
      errors.validTill = 'Please choose an expiry date';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCoupon = async () => {
    if (!validateForm() || creatingCoupon) return;

    try {
      setCreatingCoupon(true);
      const token = localStorage.getItem('token');
      
      // Prepare request body
      const requestBody = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        validTill: formData.validTill.toISOString().split('T')[0],
        maxUses: formData.maxUses,
        oncePerCar: formData.oncePerCar
      };

      // Add optional fields only if they have values
      if (formData.outletId) {
        requestBody.outletId = formData.outletId;
      }
      if (formData.carId) {
        requestBody.carId = formData.carId;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Coupon Created ✓',
          detail: `${formData.code.toUpperCase()} — ${formData.discountType === 'PERCENT' ? `${formData.discountValue}% OFF` : `₹${formData.discountValue} OFF`}`,
          life: 3000
        });

        setAddDialogVisible(false);
        resetForm();
        fetchCoupons();
      } else {
        let detail = 'Failed to create coupon';
        try {
          const errorData = await response.json();
          if (errorData.message) detail = errorData.message;
        } catch (_) {}
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail,
          life: 4000
        });
      }
    } catch (error) {
      console.error('Error adding coupon:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create coupon',
        life: 3000
      });
    } finally {
      setCreatingCoupon(false);
    }
  };

  const clearFieldError = (field) => {
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Delete coupon
  const confirmDeleteCoupon = (coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogVisible(true);
  };

  // ---------- Export coupons to Excel ----------
  const exportToExcel = () => {
    if (coupons.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No coupons to export', life: 3000 });
      return;
    }

    const exportData = coupons.map((c, index) => {
      const expired = isExpired(c.validTill);
      return {
        'S.No': index + 1,
        'Code': c.code,
        'Discount': c.discountType === 'PERCENT' ? `${c.discountValue}%` : `Rs. ${c.discountValue}`,
        'Scope': c.outletId && c.carId
          ? `${c.outletName || 'Outlet'} / ${c.carNo || 'Car'}`
          : c.outletId ? (c.outletName || 'Outlet') + ' only'
          : c.carId ? (c.carNo || 'Car') + ' only'
          : 'All Outlets & Cars',
        'Once Per Car': c.oncePerCar ? 'Yes' : 'No',
        'Used': c.usedCount || 0,
        'Max Uses': (c.maxUses || 0) >= 999999 ? 'Unlimited' : c.maxUses,
        'Valid Till': formatDate(c.validTill),
        'Status': expired ? 'Expired' : (c.active ? 'Active' : 'Inactive')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 26 }, { wch: 13 },
      { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 12 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Coupons');
    XLSX.writeFile(workbook, `Coupons_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: `${coupons.length} coupons exported`,
      life: 3000
    });
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete || deletingCoupon) return;
    setDeletingCoupon(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${couponToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Deleted',
          detail: `Coupon "${couponToDelete.code}" was removed`,
          life: 3000
        });
        setDeleteDialogVisible(false);
        setCouponToDelete(null);
        fetchCoupons();
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete coupon',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete coupon',
        life: 3000
      });
    } finally {
      setDeletingCoupon(false);
    }
  };

  // ---------- Renew (expired / exhausted coupon) ----------
  const openRenewDialog = (coupon) => {
    setCouponToRenew(coupon);
    setRenewForm({
      validTill: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })(), // sensible default: +1 month
      resetUsage: false,
      maxUses: coupon.maxUses
    });
    setRenewError('');
    setRenewDialogVisible(true);
  };

  const handleRenewCoupon = async () => {
    if (!couponToRenew || renewingCoupon) return;
    if (!renewForm.validTill) {
      setRenewError('Please choose a new expiry date');
      return;
    }
    setRenewingCoupon(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${couponToRenew.id}/renew`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          validTill: renewForm.validTill.toISOString().split('T')[0],
          resetUsage: renewForm.resetUsage,
          maxUses: renewForm.maxUses   // ✅ optional limit change while renewing
        })
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Coupon Renewed ✓',
          detail: `${couponToRenew.code} is active again until ${formatDate(renewForm.validTill)}${renewForm.resetUsage ? ' with a fresh usage count' : ''}`,
          life: 3500
        });
        setRenewDialogVisible(false);
        setCouponToRenew(null);
        fetchCoupons();
      } else {
        let detail = 'Failed to renew coupon';
        try {
          const err = await response.json();
          if (err.message) detail = err.message;
        } catch (_) {}
        setRenewError(detail);
      }
    } catch (error) {
      console.error('Error renewing coupon:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to renew coupon', life: 3000 });
    } finally {
      setRenewingCoupon(false);
    }
  };

  // ---------- Edit usage numbers (works on active AND expired coupons) ----------
  const openUsageEditor = (coupon) => {
    setUsageCoupon(coupon);
    setUsageForm({ maxUses: coupon.maxUses, usedCount: coupon.usedCount || 0 });
    setUsageError('');
    setUsageDialogVisible(true);
  };

  const handleSaveUsage = async () => {
    if (!usageCoupon || savingUsage) return;
    if (usageForm.maxUses == null || usageForm.maxUses < 1) {
      setUsageError('Max uses must be at least 1');
      return;
    }
    if (usageForm.usedCount == null || usageForm.usedCount < 0) {
      setUsageError('Used count cannot be negative');
      return;
    }
    if (usageForm.usedCount > usageForm.maxUses) {
      setUsageError('Used count cannot exceed max uses');
      return;
    }

    setSavingUsage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${usageCoupon.id}/usage`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxUses: usageForm.maxUses,
          usedCount: usageForm.usedCount
        })
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Usage Updated ✓',
          detail: `${usageCoupon.code}: now ${usageForm.usedCount} / ${usageForm.maxUses} uses`,
          life: 3000
        });
        setUsageDialogVisible(false);
        setUsageCoupon(null);
        fetchCoupons();
      } else {
        let detail = 'Failed to update usage';
        try {
          const err = await response.json();
          if (err.message) detail = err.message;
        } catch (_) {}
        setUsageError(detail);
      }
    } catch (error) {
      console.error('Error updating usage:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update usage', life: 3000 });
    } finally {
      setSavingUsage(false);
    }
  };

  // Toggle coupon status
  const handleToggleStatus = async (couponId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${couponId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          active: !currentStatus   // ✅ FIX: send a real boolean, not a string
        })
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
          life: 3000
        });
        fetchCoupons();
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update coupon status',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update coupon status',
        life: 3000
      });
    }
  };

  const isExpired = (validTill) => {
    if (!validTill) return false;
    const d = new Date(validTill);
    const today = new Date();
    d.setHours(23, 59, 59, 999);
    return d < today;
  };

  const filteredCoupons = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return coupons;
    return coupons.filter(c =>
      (c.code || '').toLowerCase().includes(term) ||
      prettyScope(c).toLowerCase().includes(term)
    );
  }, [coupons, searchTerm]);

  const prettyScope = (c) => {
    if (c.outletId && c.carId) return `outlet ${c.outletName || c.outletId} car ${c.carNo || c.carId}`;
    if (c.outletId) return c.outletName || 'outlet';
    if (c.carId) return c.carNo || 'car';
    return 'all outlets cars global';
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'PERCENT',
      discountValue: '',
      validTill: null,
      outletId: null,
      carId: null,
      maxUses: 999999,
      oncePerCar: false
    });
  };

  useEffect(() => {
    fetchOutlets();
    fetchCars();
    fetchCoupons();
  }, []);

  const formatDate = (value) => {
    const date = new Date(value);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const discountTypeOptions = [
    { label: 'Percentage (%)', value: 'PERCENT' },
    { label: 'Flat Amount (₹)', value: 'FLAT' }
  ];

  const statusBodyTemplate = (rowData) => {
    return (
      <InputSwitch
        checked={rowData.active}
        onChange={() => handleToggleStatus(rowData.id, rowData.active)}
        tooltip={rowData.active ? 'Deactivate' : 'Activate'}
        tooltipOptions={{ position: 'top' }}
      />
    );
  };

  const discountBodyTemplate = (rowData) => {
    if (rowData.discountType === 'PERCENT') {
      return `${rowData.discountValue}%`;
    }
    return `₹${rowData.discountValue}`;
  };

  const scopeBodyTemplate = (rowData) => {
    const hasOncePerCar = rowData.oncePerCar;
    
    if (rowData.outletId && rowData.carId) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <i className="pi pi-building text-blue-600 text-xs"></i>
            <span className="text-xs font-semibold text-gray-700">{rowData.outletName || `Outlet #${rowData.outletId}`}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="pi pi-car text-purple-600 text-xs"></i>
            <span className="text-xs font-semibold text-gray-700">{rowData.carNo || `Car #${rowData.carId}`}</span>
          </div>
          {hasOncePerCar && (
            <div className="flex items-center gap-2 mt-1">
              <i className="pi pi-shield text-orange-600 text-xs"></i>
              <span className="text-xs font-semibold text-orange-700">Once Per Car</span>
            </div>
          )}
        </div>
      );
    } else if (rowData.outletId) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <i className="pi pi-building text-blue-600 text-sm"></i>
            <span className="text-sm font-semibold text-gray-700">{rowData.outletName || `Outlet #${rowData.outletId}`}</span>
          </div>
          {hasOncePerCar && (
            <div className="flex items-center gap-2 mt-1">
              <i className="pi pi-shield text-orange-600 text-xs"></i>
              <span className="text-xs font-semibold text-orange-700">Once Per Car</span>
            </div>
          )}
        </div>
      );
    } else if (rowData.carId) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <i className="pi pi-car text-purple-600 text-sm"></i>
            <span className="text-sm font-semibold text-gray-700">{rowData.carNo || `Car #${rowData.carId}`}</span>
          </div>
          {hasOncePerCar && (
            <div className="flex items-center gap-2 mt-1">
              <i className="pi pi-shield text-orange-600 text-xs"></i>
              <span className="text-xs font-semibold text-orange-700">Once Per Car</span>
            </div>
          )}
        </div>
      );
    }
    
    // Global scope
    if (hasOncePerCar) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <i className="pi pi-globe text-green-600 text-sm"></i>
            <span className="text-sm font-semibold text-green-700">All Outlets & Cars</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <i className="pi pi-shield text-orange-600 text-xs"></i>
            <span className="text-xs font-semibold text-orange-700">Once Per Car</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <i className="pi pi-globe text-green-600 text-sm"></i>
        <span className="text-sm font-semibold text-green-700">All Outlets & Cars</span>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toast ref={toast} />

      <div className="bg-white shadow-sm rounded-lg p-3 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <i className="pi pi-ticket text-blue-600"></i>
              Coupon Management
            </h2>
            <p className="text-gray-600 mt-2">Create and manage discount coupons</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              icon="pi pi-file-excel"
              label="Export"
              onClick={exportToExcel}
              disabled={coupons.length === 0}
              className="bg-green-600 hover:bg-green-700 border-0 text-white px-3 py-2 text-sm sm:px-4 sm:py-3"
              tooltip="Export all coupons to Excel"
              tooltipOptions={{ position: 'bottom' }}
            />
            <Button
              icon="pi pi-refresh"
              onClick={fetchCoupons}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 sm:px-4 sm:py-3"
              tooltip="Refresh data"
              tooltipOptions={{ position: 'bottom' }}
              outlined
            />
            <Button
              label="Create Coupon"
              icon="pi pi-plus"
              onClick={() => setAddDialogVisible(true)}
              className="bg-blue-600 hover:bg-blue-700 border-0 text-white px-4 sm:px-6 py-2 sm:py-3 flex-1 sm:flex-none"
            />
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 max-w-md">
          <div className="relative">
            <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <InputText
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code or scope..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Coupon Table */}
        <div className="overflow-auto">
          <DataTable
            value={filteredCoupons}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="No coupons found"
            stripedRows
            showGridlines
            sortField="createdAt"
            sortOrder={-1}
            size="small"
          >
            <Column field="code" header="Coupon Code" sortable style={{ width: '12rem' }} 
              body={(rowData) => {
                const expired = isExpired(rowData.validTill);
                return (
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${expired ? 'text-gray-400 line-through' : 'text-blue-600'}`}>{rowData.code}</span>
                    {expired && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">EXPIRED</span>}
                    {!rowData.active && !expired && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">OFF</span>}
                  </div>
                );
              }} 
            />
            <Column field="discountType" header="Discount" sortable body={discountBodyTemplate} style={{ width: '9rem' }} />
            <Column header="Scope" body={scopeBodyTemplate} headerClassName="hidden md:table-cell" bodyClassName="hidden md:table-cell" style={{ width: '17rem' }} />
            <Column header="Usage" sortable sortField="usedCount" style={{ width: '10rem' }}
              body={(rowData) => (
                <span className={`text-sm font-semibold ${(rowData.usedCount || 0) >= (rowData.maxUses || 0) ? 'text-red-600' : 'text-gray-700'}`}>
                  {rowData.usedCount || 0} / {(rowData.maxUses || 0) >= 999999 ? '∞' : rowData.maxUses}
                </span>
              )}
            />
            <Column field="validTill" header="Valid Till" sortable body={(rowData) => formatDate(rowData.validTill)} headerClassName="hidden md:table-cell" bodyClassName="hidden md:table-cell" style={{ width: '11rem' }} />
            <Column field="active" header="Status" body={statusBodyTemplate} headerClassName="hidden sm:table-cell" bodyClassName="hidden sm:table-cell" style={{ width: '8rem' }} />
            <Column
              header="Actions"
              body={(rowData) => {
                const expired = isExpired(rowData.validTill);
                return (
                  <div className="flex items-center justify-center gap-1">
                    {expired && (
                      <Button
                        icon="pi pi-refresh"
                        label="Renew"
                        size="small"
                        onClick={() => openRenewDialog(rowData)}
                        className="px-3 py-1 text-xs"
                        tooltip="Extend validity and re-activate this coupon"
                        tooltipOptions={{ position: 'top' }}
                      />
                    )}
                    <Button
                      icon="pi pi-sliders-h"
                      severity="secondary"
                      text
                      rounded
                      onClick={() => openUsageEditor(rowData)}
                      tooltip="Edit usage count / limit"
                      tooltipOptions={{ position: 'top' }}
                    />
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      onClick={() => confirmDeleteCoupon(rowData)}
                      tooltip="Delete coupon permanently"
                      tooltipOptions={{ position: 'top' }}
                    />
                  </div>
                );
              }}
              style={{ width: '11rem', textAlign: 'center' }}
            />
          </DataTable>
        </div>
      </div>

      {/* Add Coupon Dialog */}
      <Dialog
        visible={addDialogVisible}
        onHide={() => {
          setAddDialogVisible(false);
          resetForm();
        }}
        modal
        header={
          <div className="flex items-center gap-4 pb-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <i className="pi pi-ticket text-2xl sm:text-3xl text-white"></i>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Create New Coupon</h3>
              <p className="text-sm text-gray-500 mt-1">Design and launch your discount campaign</p>
            </div>
          </div>
        }
        style={{ width: '650px', maxWidth: '95vw' }}
        className="add-coupon-dialog"
      >
        <div className="pt-6 space-y-6">
          {/* Coupon Code */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border-2 border-blue-200">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <i className="pi pi-tag text-white text-sm"></i>
              </div>
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <InputText
              value={formData.code}
              onChange={(e) => { setFormData({ ...formData, code: e.target.value.toUpperCase() }); clearFieldError('code'); }}
              placeholder="e.g., SUMMER25, FLASH50, VIP100"
              className={`w-full text-lg font-bold tracking-wider uppercase p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${formErrors.code ? 'border-2 border-red-500' : 'border-2 border-blue-300'}`}
              maxLength={20}
              autoFocus
            />
            {formErrors.code && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>{formErrors.code}</p>}
            <div className="flex items-center gap-2 mt-2">
              <i className="pi pi-info-circle text-blue-600 text-xs"></i>
              <small className="text-gray-600 font-medium">Create a memorable code using letters and numbers</small>
            </div>
          </div>

          {/* Discount Section */}
          <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-600 p-2 rounded-lg">
                <i className="pi pi-percentage text-white text-sm"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Discount Details</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Discount Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  value={formData.discountType}
                  options={discountTypeOptions}
                  onChange={(e) => setFormData({ ...formData, discountType: e.value })}
                  className="w-full border-2 border-gray-300 rounded-lg"
                />
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Value <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  value={formData.discountValue}
                  onValueChange={(e) => { setFormData({ ...formData, discountValue: e.value }); clearFieldError('discountValue'); }}
                  placeholder={formData.discountType === 'PERCENT' ? '10' : '100'}
                  className={`w-full rounded-lg ${formErrors.discountValue ? 'border-2 border-red-500' : 'border-2 border-gray-300'}`}
                  inputClassName="text-lg font-bold"
                  min={0}
                  max={formData.discountType === 'PERCENT' ? 100 : undefined}
                  suffix={formData.discountType === 'PERCENT' ? '%' : ' ₹'}
                />
                {formErrors.discountValue && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>{formErrors.discountValue}</p>}
              </div>
            </div>

            {/* Preview Badge */}
            {formData.discountValue > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                <div className="flex items-center gap-2">
                  <i className="pi pi-eye text-green-700"></i>
                  <span className="text-sm font-semibold text-green-700">Preview:</span>
                  <span className="text-lg font-bold text-green-800">
                    {formData.discountType === 'PERCENT' 
                      ? `${formData.discountValue}% OFF` 
                      : `₹${formData.discountValue} OFF`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Validity & Usage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Valid Till */}
            <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                <i className="pi pi-calendar text-orange-600"></i>
                Valid Till <span className="text-red-500">*</span>
              </label>
              <Calendar
                value={formData.validTill}
                onChange={(e) => { setFormData({ ...formData, validTill: e.value }); clearFieldError('validTill'); }}
                dateFormat="dd M yy"
                placeholder="Select date"
                className={`w-full rounded-lg ${formErrors.validTill ? 'border-2 border-red-500' : 'border-2 border-orange-300'}`}
                showIcon
                minDate={new Date()}
              />
              {formErrors.validTill && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>{formErrors.validTill}</p>}
            </div>

            {/* Max Uses */}
            <div className="bg-pink-50 p-4 rounded-xl border-2 border-pink-200">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                <i className="pi pi-hashtag text-pink-600"></i>
                Maximum Uses
              </label>
              <InputNumber
                value={formData.maxUses}
                onValueChange={(e) => setFormData({ ...formData, maxUses: e.value })}
                placeholder="999999"
                className="w-full border-2 border-pink-300 rounded-lg"
                min={1}
                useGrouping
              />
              <small className="text-gray-600 text-xs mt-1 block">∞ for unlimited</small>
            </div>
          </div>

          {/* Advanced Restrictions */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-600 p-2 rounded-lg">
                <i className="pi pi-filter text-white text-sm"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Advanced Restrictions</h4>
              <span className="ml-auto text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-semibold">Optional</span>
            </div>

            <div className="space-y-4">
              {/* Outlet */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i className="pi pi-building text-purple-600"></i>
                  Specific Outlet
                </label>
                <Dropdown
                  value={formData.outletId}
                  options={outlets}
                  onChange={(e) => setFormData({ ...formData, outletId: e.value })}
                  placeholder="🌍 Apply to all outlets"
                  className="w-full border-2 border-purple-300 rounded-lg"
                  showClear
                  filter
                />
                {formData.outletId && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-purple-700 bg-purple-100 px-3 py-2 rounded-lg">
                    <i className="pi pi-lock"></i>
                    <span>Coupon restricted to selected outlet only</span>
                  </div>
                )}
              </div>

              {/* Car */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i className="pi pi-car text-purple-600"></i>
                  Specific Car / Customer
                </label>
                <Dropdown
                  value={formData.carId}
                  options={cars}
                  onChange={(e) => setFormData({ ...formData, carId: e.value })}
                  placeholder="🚗 Apply to all customers"
                  className="w-full border-2 border-purple-300 rounded-lg"
                  showClear
                  filter
                />
                {formData.carId && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-purple-700 bg-purple-100 px-3 py-2 rounded-lg">
                    <i className="pi pi-lock"></i>
                    <span>VIP coupon for selected customer only</span>
                  </div>
                )}
              </div>

              {/* Once Per Car */}
              <div className="bg-white p-4 rounded-lg border-2 border-purple-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <i className="pi pi-shield text-white text-sm"></i>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-gray-800">Once Per Car</h5>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formData.oncePerCar ? 'Each car can use this coupon only once' : 'Cars can use this coupon multiple times'}
                      </p>
                    </div>
                  </div>
                  <InputSwitch
                    checked={formData.oncePerCar}
                    onChange={(e) => setFormData({ ...formData, oncePerCar: e.value })}
                  />
                </div>
                
                {formData.oncePerCar && (
                  <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded-lg">
                    <div className="flex items-start gap-2">
                      <i className="pi pi-info-circle text-orange-700 text-sm"></i>
                      <p className="text-xs text-orange-700">
                        This coupon will be valid only once per vehicle, regardless of the total max uses limit
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t-2 border-gray-200">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setAddDialogVisible(false);
                resetForm();
              }}
              className="w-full sm:w-auto px-4 sm:px-8 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold rounded-lg"
              outlined
            />
            <Button
              label={creatingCoupon ? 'Creating...' : 'Create Coupon'}
              icon={creatingCoupon ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
              onClick={handleAddCoupon}
              loading={creatingCoupon}
              disabled={creatingCoupon}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white w-full sm:w-auto px-4 sm:px-8 py-2.5 sm:py-3 font-semibold rounded-lg shadow-lg"
            />
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={deleteDialogVisible}
        onHide={() => {
          setDeleteDialogVisible(false);
          setCouponToDelete(null);
        }}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-red-100 p-2 sm:p-3 rounded-full">
              <i className="pi pi-exclamation-triangle text-2xl text-red-600"></i>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Delete Coupon</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
        }
        style={{ width: 'min(480px, 92vw)' }}
      >
        <div className="pt-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start">
              <i className="pi pi-info-circle text-red-600 text-xl mt-1 mr-3"></i>
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Delete coupon &quot;{couponToDelete?.code}&quot;?
                </p>
                <p className="text-sm text-red-700">
                  Customers will no longer be able to use it. Past bills are not affected.
                </p>
              </div>
            </div>
          </div>

          {couponToDelete && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border border-gray-200 space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Discount:</span><span className="text-sm font-semibold">{discountBodyTemplate(couponToDelete)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Used:</span><span className="text-sm font-semibold">{couponToDelete.usedCount || 0} / {(couponToDelete.maxUses || 0) >= 999999 ? '∞' : couponToDelete.maxUses}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Valid Till:</span><span className="text-sm font-semibold">{formatDate(couponToDelete.validTill)}</span></div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button
              label="Cancel"
              icon="pi pi-times"
              outlined
              disabled={deletingCoupon}
              onClick={() => {
                setDeleteDialogVisible(false);
                setCouponToDelete(null);
              }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2"
            />
            <Button
              label={deletingCoupon ? 'Deleting...' : 'Delete'}
              loading={deletingCoupon}
              onClick={handleDeleteCoupon}
              severity="danger"
              className="w-full sm:w-auto px-4 sm:px-6 py-2"
            />
          </div>
        </div>
      </Dialog>

      {/* Renew Coupon Dialog */}
      <Dialog
        visible={renewDialogVisible}
        onHide={() => {
          setRenewDialogVisible(false);
          setCouponToRenew(null);
        }}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
              <i className="pi pi-refresh text-2xl text-green-600"></i>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Renew Coupon</h3>
              <p className="text-sm text-gray-500">Give an expired coupon a new life</p>
            </div>
          </div>
        }
        style={{ width: 'min(460px, 92vw)' }}
      >
        <div className="pt-3 sm:pt-4 space-y-4 sm:space-y-5">
          {/* Coupon summary */}
          {couponToRenew && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Code:</span><span className="text-sm font-bold text-blue-600">{couponToRenew.code}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Discount:</span><span className="text-sm font-semibold">{discountBodyTemplate(couponToRenew)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Expired On:</span><span className="text-sm font-semibold text-red-600">{formatDate(couponToRenew.validTill)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Used:</span><span className="text-sm font-semibold">{couponToRenew.usedCount || 0} / {(couponToRenew.maxUses || 0) >= 999999 ? '∞' : couponToRenew.maxUses}</span></div>
            </div>
          )}

          {/* New expiry */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-calendar text-green-600"></i>
              New Expiry Date <span className="text-red-500">*</span>
            </label>
            <Calendar
              value={renewForm.validTill}
              onChange={(e) => { setRenewForm({ ...renewForm, validTill: e.value }); setRenewError(''); }}
              dateFormat="dd M yy"
              placeholder="Select new expiry date"
              className={`w-full rounded-lg ${renewError ? 'border-2 border-red-500' : 'border-2 border-green-300'}`}
              showIcon
              minDate={new Date()}
            />
            {renewError && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>{renewError}</p>}
          </div>

          {/* Reset usage option */}
          <div className="bg-white p-4 rounded-lg border-2 border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <i className="pi pi-replay text-white text-sm"></i>
              </div>
              <div>
                <h5 className="text-sm font-bold text-gray-800">Also reset usage count</h5>
                <p className="text-xs text-gray-600 mt-0.5">
                  {renewForm.resetUsage
                    ? 'Usage counter will start from 0 again'
                    : 'Keeps the current used count'}
                </p>
              </div>
            </div>
            <InputSwitch
              checked={renewForm.resetUsage}
              onChange={(e) => setRenewForm({ ...renewForm, resetUsage: e.value })}
            />
          </div>

          {/* ✅ Change max uses while renewing */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-sliders-h text-blue-600"></i>
              Max Uses Limit
            </label>
            <InputNumber
              value={renewForm.maxUses}
              onValueChange={(e) => setRenewForm({ ...renewForm, maxUses: e.value })}
              className="w-full border-2 border-gray-300 rounded-lg"
              min={1}
              useGrouping
            />
            <small className="text-gray-500 text-xs mt-1 block">
              {renewForm.resetUsage
                ? 'Total times this coupon can be used after renewal.'
                : 'Total allowed uses — must stay at or above the current used count.'}
            </small>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg flex items-start gap-2">
            <i className="pi pi-info-circle text-blue-600 mt-0.5"></i>
            <p className="text-xs text-blue-700">
              The coupon will be automatically re-activated and immediately usable at billing.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2 border-t">
            <Button
              label="Cancel"
              icon="pi pi-times"
              outlined
              disabled={renewingCoupon}
              onClick={() => {
                setRenewDialogVisible(false);
                setCouponToRenew(null);
              }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2"
            />
            <Button
              label={renewingCoupon ? 'Renewing...' : 'Renew Coupon'}
              icon="pi pi-refresh"
              loading={renewingCoupon}
              onClick={handleRenewCoupon}
              className="bg-green-600 hover:bg-green-700 border-0 text-white px-6 py-2"
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Usage Dialog — available for active AND expired coupons */}
      <Dialog
        visible={usageDialogVisible}
        onHide={() => {
          setUsageDialogVisible(false);
          setUsageCoupon(null);
        }}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-indigo-100 p-2 sm:p-3 rounded-full">
              <i className="pi pi-sliders-h text-2xl text-indigo-600"></i>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Usage</h3>
              <p className="text-sm text-gray-500">Change the usage limit or correct the used counter</p>
            </div>
          </div>
        }
        style={{ width: 'min(440px, 92vw)' }}
      >
        <div className="pt-3 sm:pt-4 space-y-4 sm:space-y-5">
          {usageCoupon && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Code:</span><span className="text-sm font-bold text-blue-600">{usageCoupon.code}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Current Usage:</span><span className="text-sm font-semibold">{usageCoupon.usedCount || 0} / {(usageCoupon.maxUses || 0) >= 999999 ? '∞' : usageCoupon.maxUses}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Status:</span><span className={`text-sm font-semibold ${usageCoupon.active && !isExpired(usageCoupon.validTill) ? 'text-green-600' : 'text-red-600'}`}>{usageCoupon.active && !isExpired(usageCoupon.validTill) ? 'Active' : 'Inactive / Expired'}</span></div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Max Uses */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="pi pi-hashtag text-pink-600"></i>
                Max Uses
              </label>
              <InputNumber
                value={usageForm.maxUses}
                onValueChange={(e) => { setUsageForm({ ...usageForm, maxUses: e.value }); setUsageError(''); }}
                className="w-full border-2 border-gray-300 rounded-lg"
                min={1}
                useGrouping
              />
            </div>

            {/* Used Count */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="pi pi-check-square text-blue-600"></i>
                Used Count
              </label>
              <InputNumber
                value={usageForm.usedCount}
                onValueChange={(e) => { setUsageForm({ ...usageForm, usedCount: e.value }); setUsageError(''); }}
                className="w-full border-2 border-gray-300 rounded-lg"
                min={0}
                useGrouping
              />
            </div>
          </div>

          {usageError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
              <p className="text-red-700 text-sm"><i className="pi pi-exclamation-circle mr-2"></i>{usageError}</p>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg flex items-start gap-2">
            <i className="pi pi-info-circle text-blue-600 mt-0.5"></i>
            <p className="text-xs text-blue-700">
              Use this to raise a limit for a busy campaign, or correct the counter if bills were created outside the system.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2 border-t">
            <Button
              label="Cancel"
              icon="pi pi-times"
              outlined
              disabled={savingUsage}
              onClick={() => {
                setUsageDialogVisible(false);
                setUsageCoupon(null);
              }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2"
            />
            <Button
              label={savingUsage ? 'Saving...' : 'Save Changes'}
              icon="pi pi-check"
              loading={savingUsage}
              onClick={handleSaveUsage}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 border-0 text-white px-4 sm:px-6 py-2"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CouponManagement;
