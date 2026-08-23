'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import * as XLSX from 'xlsx';
import { useAuth } from '@/app/context/AuthContext';

const CarOwner = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toast = React.useRef(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    carNo: '',
    customerName: '',
    customerPhone: '',
    carModel: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCars(data);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch cars',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch cars',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = cars.filter(car => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (car.carNo && car.carNo.toLowerCase().includes(searchLower)) ||
      (car.customerName && car.customerName.toLowerCase().includes(searchLower)) ||
      (car.customerPhone && car.customerPhone.toLowerCase().includes(searchLower)) ||
      (car.model && car.model.toLowerCase().includes(searchLower)) ||
      (car.carType && car.carType.toLowerCase().includes(searchLower))
    );
  });

  const carTypeBodyTemplate = (rowData) => {
    const typeColors = {
      'SEDAN': 'bg-blue-100 text-blue-800',
      'SUV': 'bg-green-100 text-green-800',
      'HATCHBACK': 'bg-yellow-100 text-yellow-800',
      'MUV': 'bg-purple-100 text-purple-800',
      'LUXURY': 'bg-pink-100 text-pink-800'
    };
    
    const colorClass = typeColors[rowData.carType] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
        {rowData.carType}
      </span>
    );
  };

  const phoneBodyTemplate = (rowData) => {
    return rowData.customerPhone ? `+91 ${rowData.customerPhone}` : 'N/A';
  };

  // Owner cell: phone stacks under the name on small screens (phone column is hidden there)
  const ownerBodyTemplate = (rowData) => (
    <div>
      <span className="font-medium text-gray-800">{rowData.customerName || 'N/A'}</span>
      {rowData.customerPhone && (
        <span className="block md:hidden text-xs text-gray-500">+91 {rowData.customerPhone}</span>
      )}
    </div>
  );

  // Open update modal
  const openUpdateModal = (car) => {
    setSelectedCar(car);
    setUpdateForm({
      carNo: car.carNo || '',
      customerName: car.customerName || '',
      customerPhone: car.customerPhone || '',
      carModel: car.model || ''
    });
    setUpdateDialogVisible(true);
  };

  // Handle update car details
  const handleUpdateCar = async () => {
    if (!updateForm.carNo || !updateForm.customerName || !updateForm.customerPhone) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill all required fields',
        life: 3000
      });
      return;
    }

    if (updateForm.customerPhone.length !== 10) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Phone number must be 10 digits',
        life: 3000
      });
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        carNo: updateForm.carNo,
        customerName: updateForm.customerName,
        customerPhone: updateForm.customerPhone
      };

      // Only add carModel if it's provided
      if (updateForm.carModel && updateForm.carModel.trim()) {
        payload.carModel = updateForm.carModel;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/cars/${selectedCar.id}/owner`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Car details updated successfully',
          life: 3000
        });
        setUpdateDialogVisible(false);
        setSelectedCar(null);
        setUpdateForm({
          carNo: '',
          customerName: '',
          customerPhone: '',
          carModel: ''
        });
        fetchCars();
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update car details',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error updating car:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update car details',
        life: 3000
      });
    } finally {
      setUpdating(false);
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        onClick={() => openUpdateModal(rowData)}
        tooltip="Correct Owner / Vehicle Details"
      />
    );
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredCars.map((car, index) => ({
        'S.No': index + 1,
        'Car ID': car.id,
        'Car Number': car.carNo,
        'Car Type': car.carType,
        'Model': car.model || 'N/A',
        'Owner Name': car.customerName,
        'Phone Number': car.customerPhone ? `+91 ${car.customerPhone}` : 'N/A',
        'Customer ID': car.customerId
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 6 },  // S.No
        { wch: 10 }, // Car ID
        { wch: 15 }, // Car Number
        { wch: 12 }, // Car Type
        { wch: 20 }, // Model
        { wch: 25 }, // Owner Name
        { wch: 18 }, // Phone Number
        { wch: 12 }  // Customer ID
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Car & Owner Details');
      
      // Generate filename with current date
      const date = new Date();
      const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      const filename = `CarOwner_Data_${dateStr}.xlsx`;
      
      // Export file
      XLSX.writeFile(workbook, filename);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Exported ${filteredCars.length} records to Excel`,
        life: 3000
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export data',
        life: 3000
      });
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toast ref={toast} />

      <div className="bg-white shadow-sm rounded-lg p-3 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <i className="pi pi-car text-blue-600"></i>
                Car & Owner Details
              </h2>
              <p className="text-gray-600 mt-2">View all registered vehicles and their owners</p>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                icon="pi pi-file-excel"
                label="Export"
                onClick={exportToExcel}
                disabled={filteredCars.length === 0}
                className="bg-green-600 hover:bg-green-700 border-0 text-white px-4 sm:px-6 py-2 sm:py-3"
                tooltip="Export to Excel"
              />
              <Button
                icon="pi pi-refresh"
                label="Refresh"
                onClick={fetchCars}
                loading={loading}
                className="bg-blue-600 hover:bg-blue-700 border-0 text-white px-4 sm:px-6 py-2 sm:py-3"
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <InputText
                type="text"
                placeholder="Car number, owner name, phone, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cars</p>
                <p className="text-2xl font-bold text-gray-800">{cars.length}</p>
              </div>
              <i className="pi pi-car text-3xl text-blue-500"></i>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 sm:p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Owners</p>
                <p className="text-2xl font-bold text-gray-800">
                  {[...new Set(cars.map(car => car.customerId))].length}
                </p>
              </div>
              <i className="pi pi-users text-3xl text-green-500"></i>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-800">{filteredCars.length}</p>
              </div>
              <i className="pi pi-filter text-3xl text-purple-500"></i>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Car Types</p>
                <p className="text-2xl font-bold text-gray-800">
                  {[...new Set(cars.map(car => car.carType))].length}
                </p>
              </div>
              <i className="pi pi-sitemap text-3xl text-orange-500"></i>
            </div>
          </div>
        </div>

        {/* Cars Table */}
        <div className="overflow-auto">
          <DataTable
            value={filteredCars}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="No cars found"
            stripedRows
            showGridlines
            sortField="carNo"
            sortOrder={1}
            size="small"
          >
            <Column 
              field="id" 
              header="Car ID" 
              sortable 
              headerClassName="hidden md:table-cell"
              bodyClassName="hidden md:table-cell"
              style={{ width: '8%' }}
            />
            <Column 
              field="carNo" 
              header="Car Number" 
              sortable 
              style={{ width: '12%', fontWeight: '600', fontFamily: 'monospace' }}
            />
            <Column 
              field="carType" 
              header="Car Type" 
              sortable 
              body={carTypeBodyTemplate}
              headerClassName="hidden sm:table-cell"
              bodyClassName="hidden sm:table-cell"
              style={{ width: '11%' }}
            />
            <Column 
              field="model" 
              header="Model" 
              sortable 
              headerClassName="hidden md:table-cell"
              bodyClassName="hidden md:table-cell"
              style={{ width: '14%' }}
            />
            <Column 
              field="customerName" 
              header="Owner Name" 
              sortable 
              body={ownerBodyTemplate}
              style={{ width: '16%' }}
            />
            <Column 
              field="customerPhone" 
              header="Phone Number" 
              sortable
              body={phoneBodyTemplate}
              headerClassName="hidden md:table-cell"
              bodyClassName="hidden md:table-cell"
              style={{ width: '14%' }}
            />
            <Column 
              field="customerId" 
              header="Customer ID" 
              sortable 
              headerClassName="hidden lg:table-cell"
              bodyClassName="hidden lg:table-cell"
              style={{ width: '10%' }}
            />
            <Column 
              header="Actions" 
              body={actionBodyTemplate}
              style={{ width: '8%', textAlign: 'center' }}
            />
          </DataTable>
        </div>
      </div>

      {/* Update Car Details Dialog */}
      <Dialog
        visible={updateDialogVisible}
        onHide={() => {
          setUpdateDialogVisible(false);
          setSelectedCar(null);
          setUpdateForm({
            carNo: '',
            customerName: '',
            customerPhone: '',
            carModel: ''
          });
        }}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
              <i className="pi pi-pencil text-2xl text-blue-600"></i>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Update Car Details</h3>
              <p className="text-sm text-gray-500">Update vehicle and owner information</p>
            </div>
          </div>
        }
        style={{ width: 'min(550px, 92vw)' }}
        className="update-car-dialog"
      >
        <div className="pt-4 space-y-4">
          {/* Car ID Display */}
          {selectedCar && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Car ID:</span>
                <span className="text-sm font-bold text-gray-800">{selectedCar.id}</span>
              </div>
            </div>
          )}

          {/* Car Number */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-car text-blue-600"></i>
              Car Number <span className="text-red-500">*</span>
            </label>
            <InputText
              value={updateForm.carNo}
              onChange={(e) => setUpdateForm({ ...updateForm, carNo: e.target.value.toUpperCase() })}
              placeholder="e.g., UP32AB1234"
              className="w-full border border-gray-300 p-3 rounded-lg uppercase font-mono"
            />
          </div>

          {/* Owner Name */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-user text-blue-600"></i>
              Owner Name <span className="text-red-500">*</span>
            </label>
            <InputText
              value={updateForm.customerName}
              onChange={(e) => setUpdateForm({ ...updateForm, customerName: e.target.value })}
              placeholder="e.g., Raman Singh"
              className="w-full border border-gray-300 p-3 rounded-lg"
            />
          </div>

          {/* Phone Number */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-phone text-blue-600"></i>
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">+91</span>
              <InputText
                value={updateForm.customerPhone}
                onChange={(e) => setUpdateForm({ ...updateForm, customerPhone: e.target.value })}
                placeholder="9876543210"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
                keyfilter="int"
                maxLength={10}
              />
            </div>
          </div>

          {/* Car Model */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-tag text-blue-600"></i>
              Car Model <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <InputText
              value={updateForm.carModel}
              onChange={(e) => setUpdateForm({ ...updateForm, carModel: e.target.value })}
              placeholder="e.g., Innova, Swift, Creta"
              className="w-full border border-gray-300 p-3 rounded-lg"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3 sm:p-4 flex items-start gap-3">
            <i className="pi pi-info-circle text-blue-600 text-lg mt-0.5"></i>
            <div className="text-sm">
              <p className="font-semibold text-blue-800 mb-1">Update Information</p>
              <p className="text-blue-700">This will update the car details and owner information in the system.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setUpdateDialogVisible(false);
                setSelectedCar(null);
                setUpdateForm({
                  carNo: '',
                  customerName: '',
                  customerPhone: '',
                  carModel: ''
                });
              }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              outlined
              disabled={updating}
            />
            <Button
              label="Update Details"
              icon="pi pi-check"
              onClick={handleUpdateCar}
              loading={updating}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 border-0 text-white px-4 sm:px-6 py-2"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CarOwner;
