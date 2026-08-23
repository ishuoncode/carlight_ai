'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import * as XLSX from 'xlsx';
import { generateInvoicePDF } from '@/app/utils/invoicePdf';

const Customer = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toast = React.useRef(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bills`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch bills',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch bills',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

 

  const formatDate = (value) => {
    const date = new Date(value);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const formatDateTime = (value) => {
    const date = new Date(value);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = hours % 12 || 12;
    
    return `${day} ${month} ${year} ${hour12}:${minutes} ${ampm}`;
  };

  const formatCurrency = (value) => {
    return `₹${value ? value.toFixed(2) : '0.00'}`;
  };

  const calculateBillAmount = (bill) => {
    if (!bill) return 0;

    const packagePrice = bill.packagePrice || 0;
    const extrasTotal = (bill.extras || []).reduce((sum, extra) => sum + (extra.price || 0), 0);
    const additionalChargesTotal = (bill.additionalCharges || []).reduce((sum, charge) => sum + (charge.amount || 0), 0);

    return packagePrice + extrasTotal + additionalChargesTotal;
  };

  const formatLastVisit = (createdAt) => {
    if (!createdAt) return 'N/A';
    
    const days = differenceInDays(new Date(), new Date(createdAt));
    
    if (days > 90) {
      const months = Math.floor(days / 30);
      return `last ${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `last ${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  const viewMoreTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-text p-button-info"
        onClick={() => {
          setSelectedBill(rowData);
          setViewDialogVisible(true);
        }}
        tooltip="View Details"
      />
    );
  };

  // Open delete confirmation modal
  const confirmDeleteBill = (bill) => {
    setBillToDelete(bill);
    setDeleteDialogVisible(true);
  };

  // Delete bill
  const handleDeleteBill = async () => {
    if (!billToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bills/${billToDelete.billId}/permanent`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Bill deleted successfully',
          life: 3000
        });
        setDeleteDialogVisible(false);
        setBillToDelete(null);
        fetchBills();
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete bill',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete bill',
        life: 3000
      });
    }
  };

  const deleteTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        onClick={() => confirmDeleteBill(rowData)}
        tooltip="Delete Bill"
      />
    );
  };


  // Professional invoice PDF built by the shared utility (app/utils/invoicePdf.js)
  const generateBillPDF = (billData) => generateInvoicePDF(billData);


  const printBill = (billData) => {
    const doc = generateBillPDF(billData);
    doc.autoPrint();   // ✅ opens the PDF with the print dialog ready
    const url = doc.output('bloburl');
    const printWindow = window.open(url, '_blank');

    if (!printWindow) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Popup Blocked',
        detail: 'Please allow popups for this site to print bills',
        life: 4000
      });
    }
  };

  const downloadBill = (billData) => {
    try {
      const doc = generateBillPDF(billData);
      doc.save(`Bill_${billData.invoiceNo}.pdf`);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Bill downloaded as PDF successfully',
        life: 3000
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate PDF',
        life: 3000
      });
    }
  };

  const printTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-print"
        className="p-button-rounded p-button-text p-button-secondary"
        onClick={() => printBill(rowData)}
        tooltip="Print Bill"
      />
    );
  };

  const downloadTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-download"
        className="p-button-rounded p-button-text p-button-success"
        onClick={() => downloadBill(rowData)}
        tooltip="Download Bill"
      />
    );
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = !searchTerm || (
      (bill.phoneNumber && bill.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bill.customerName && bill.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bill.carNo && bill.carNo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const matchesOutlet = !selectedOutlet || bill.outletName === selectedOutlet;
    
    // Date filter
    let matchesDate = true;
    if (startDate || endDate) {
      const billDate = new Date(bill.createdAt);
      billDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && billDate >= start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of day
        matchesDate = matchesDate && billDate <= end;
      }
    }
    
    return matchesSearch && matchesOutlet && matchesDate;
  });

  const uniqueOutlets = [...new Set(bills.map(bill => bill.outletName).filter(Boolean))];

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredBills.map((bill, index) => ({
      'S.No': index + 1,
      'Bill ID': bill.billId,
      'Invoice No': bill.invoiceNo,
      'Car Number': bill.carNo,
      'Car Type': bill.carType || 'N/A',
      'Customer Name': bill.customerName,
      'Phone Number': bill.phoneNumber,
      'Outlet Name': bill.outletName,
      'Package Name': bill.packageName,
      'Total Amount (INR)': bill.totalAmount ? bill.totalAmount.toFixed(2) : '0.00',
      'Discount (INR)': bill.discount ? bill.discount.toFixed(2) : '0.00',
      'Payment Method': bill.paymentMethod,
      'Created At': formatDateTime(bill.createdAt),
      'Created By': bill.createdBy
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 10 }, // Bill ID
      { wch: 22 }, // Invoice No
      { wch: 15 }, // Car Number
      { wch: 12 }, // Car Type
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Phone Number
      { wch: 15 }, // Outlet Name
      { wch: 18 }, // Package Name
      { wch: 18 }, // Total Amount
      { wch: 15 }, // Discount
      { wch: 15 }, // Payment Method
      { wch: 20 }, // Created At
      { wch: 25 }  // Created By
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bill History');

    // Generate filename with current date
    const date = new Date();
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const filename = `Bill_History_${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: 'Bill history exported to Excel successfully',
      life: 3000
    });
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toast ref={toast} />
      
      <div className="bg-white shadow-sm rounded-lg p-3 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <i className="pi pi-history text-blue-600"></i>
                Bill History
              </h2>
              <p className="text-gray-600 mt-2">View complete billing history</p>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search Box */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Phone, customer name, or car number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Outlet Dropdown */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
              <div className="relative">
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">All Outlets</option>
                  {uniqueOutlets.map((outlet, index) => (
                    <option key={index} value={outlet}>{outlet}</option>
                  ))}
                </select>
                <i className="pi pi-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            {/* Start Date */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="lg:col-span-2 flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 invisible">Actions</label>
              <div className="flex gap-2">
                <Button
                  icon="pi pi-filter-slash"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedOutlet('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 border-0 text-white"
                  tooltip="Clear Filters"
                />
                <Button
                  icon="pi pi-file-excel"
                  onClick={exportToExcel}
                  className="flex-1 bg-green-600 hover:bg-green-700 border-0 text-white"
                  disabled={filteredBills.length === 0}
                  tooltip="Export to Excel"
                />
                <Button
                  icon="pi pi-refresh"
                  onClick={fetchBills}
                  loading={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 border-0 text-white"
                  tooltip="Refresh"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-auto" style={{ width: '100%' }}>
          <DataTable
            value={filteredBills}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="No bills found"
            stripedRows
            showGridlines
            size="small"
          >
          <Column field="carNo"  header="Car No" sortable style={{ width: '10rem' }} />
            <Column field="carType"  header="Car Type" sortable headerClassName="hidden sm:table-cell"
            bodyClassName="hidden sm:table-cell"
            style={{ width: '10rem' }} />
          <Column field="customerName" header="Customer Name" sortable style={{ width: '12rem' }} />
          <Column field="phoneNumber" header="Phone Number" sortable headerClassName="hidden lg:table-cell"
            bodyClassName="hidden lg:table-cell"
            style={{ width: '11rem' }} />
          <Column 
            field="createdAt" 
            header="Created At" 
            sortable 
            body={(rowData) => formatDate(rowData.createdAt)} 
            style={{ width: '14rem' }} 
          />
          <Column field="outletName" header="Outlet Name" sortable headerClassName="hidden md:table-cell"
            bodyClassName="hidden md:table-cell"
            style={{ width: '12rem' }} />
          <Column 
            field="totalAmmount" 
            header="Total Amount" 
            sortable 
            body={(rowData) => `₹${rowData.totalAmount.toFixed(1)}`} 
            style={{ width: '10rem' }} 
          />
          <Column 
            header="Action" 
            body={(rowData) => (
              <div className="flex gap-1">
                {printTemplate(rowData)}
                {downloadTemplate(rowData)}
                {viewMoreTemplate(rowData)}
                {deleteTemplate(rowData)}
              </div>
            )} 
            style={{ width: '12rem', textAlign: 'center' }} 
          />
        </DataTable>
        </div>
      </div>

      {/* View More Dialog */}
      <Dialog
        header="Bill Details"
        visible={viewDialogVisible}
        style={{ width: 'min(720px, 92vw)' }}
        onHide={() => setViewDialogVisible(false)}
        modal
      >
        {selectedBill && (
          <div className="p-2 sm:p-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600 font-semibold">Bill ID:</p>
                <p className="text-gray-800">{selectedBill.billId}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Invoice No:</p>
                <p className="text-gray-800">{selectedBill.invoiceNo}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Customer Name:</p>
                <p className="text-gray-800">{selectedBill.customerName}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Phone Number:</p>
                <p className="text-gray-800">{selectedBill.phoneNumber}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Car Number:</p>
                <p className="text-gray-800">{selectedBill.carNo}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Car Type:</p>
                <p className="text-gray-800">{selectedBill.carType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Outlet:</p>
                <p className="text-gray-800">{selectedBill.outletName}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Payment Method:</p>
                <p className="text-gray-800">{selectedBill.paymentMethod}</p>
              </div>
            </div>

            {/* Package Details */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h3 className="font-bold text-gray-700 mb-2">Package Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-600 font-semibold">Package Name:</p>
                  <p className="text-gray-800">{selectedBill.packageName}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-semibold">Package Price:</p>
                  <p className="text-gray-800">{formatCurrency(selectedBill.packagePrice || 0)}</p>
                </div>
              </div>
            </div>

            {/* Extras */}
            {selectedBill.extras && selectedBill.extras.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <h3 className="font-bold text-gray-700 mb-2">Extras</h3>
                <div className="space-y-2">
                  {selectedBill.extras.map((extra, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded">
                      <span className="text-gray-800">{extra.name}</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(extra.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Charges */}
            {selectedBill.additionalCharges && selectedBill.additionalCharges.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 rounded">
                <h3 className="font-bold text-gray-700 mb-2">Additional Charges</h3>
                <div className="space-y-2">
                  {selectedBill.additionalCharges.map((charge, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded">
                      <span className="text-gray-800">{charge.title}</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(charge.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="p-3 bg-green-50 rounded">
              <h3 className="font-bold text-gray-700 mb-2">Payment Summary</h3>
              <div className="space-y-2">
                  <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-black-600 font-semibold">{formatCurrency(calculateBillAmount(selectedBill))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-red-600 font-semibold">- {formatCurrency(selectedBill.discount || 0)}</span>
                </div>
                {selectedBill.couponCode && selectedBill.couponDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Coupon Discount ({selectedBill.couponCode}):
                    </span>
                    <span className="text-purple-600 font-semibold">- {formatCurrency(selectedBill.couponDiscount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                  <span className="text-gray-800 font-bold text-lg">Total Amount:</span>
                  <span className="text-green-600 font-bold text-lg">{formatCurrency(selectedBill.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-gray-600 font-semibold">Created At:</p>
                <p className="text-gray-800">{formatDateTime(selectedBill.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Created By:</p>
                <p className="text-gray-800">{selectedBill.createdBy}</p>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={deleteDialogVisible}
        onHide={() => {
          setDeleteDialogVisible(false);
          setBillToDelete(null);
        }}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-red-100 p-3 rounded-full">
              <i className="pi pi-exclamation-triangle text-2xl text-red-600"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Delete Bill</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
        }
        style={{ width: '500px' }}
        className="delete-bill-dialog"
      >
        <div className="pt-4">
          {/* Warning Message */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start">
              <i className="pi pi-info-circle text-red-600 text-xl mt-1 mr-3"></i>
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Are you sure you want to delete this bill?
                </p>
                <p className="text-sm text-red-700">
                  This will permanently remove the bill from your records. This action is irreversible.
                </p>
              </div>
            </div>
          </div>

          {/* Bill Details */}
          {billToDelete && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i className="pi pi-file text-blue-600"></i>
                Bill Details
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Invoice No:</span>
                  <span className="text-sm font-semibold text-gray-800">{billToDelete.invoiceNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="text-sm font-semibold text-gray-800">{billToDelete.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vehicle No:</span>
                  <span className="text-sm font-semibold text-gray-800">{billToDelete.carNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(billToDelete.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Package:</span>
                  <span className="text-sm font-semibold text-gray-800">{billToDelete.packageName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Outlet:</span>
                  <span className="text-sm font-semibold text-gray-800">{billToDelete.outletName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-semibold text-gray-800">{formatDateTime(billToDelete.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setDeleteDialogVisible(false);
                setBillToDelete(null);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              outlined
            />
            <Button
              label="Delete Bill"
              icon="pi pi-trash"
              onClick={handleDeleteBill}
              className="bg-red-600 hover:bg-red-700 border-0 text-white px-6 py-2"
              severity="danger"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Customer;
