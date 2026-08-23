'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function YourBilling() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toastRef = React.useRef(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/bills/staff/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBills(data);
        toast.success('Bills loaded successfully');
      } else {
        toast.error('Failed to fetch bills');
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      toast.error('Error loading bills');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
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

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = bills.map((bill, index) => ({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Your Bills');

    // Generate filename with current date
    const date = new Date();
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const filename = `Your_Bills_${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

    toast.success('Bills exported to Excel successfully');
  };

  const dateBodyTemplate = (rowData) => {
    return formatDateTime(rowData.createdAt);
  };

  const amountBodyTemplate = (rowData) => {
    return formatCurrency(rowData.totalAmount);
  };

  const paymentMethodBodyTemplate = (rowData) => {
    const methodColors = {
      'CASH': 'bg-green-100 text-green-800',
      'CARD': 'bg-blue-100 text-blue-800',
      'UPI': 'bg-purple-100 text-purple-800',
      'NET_BANKING': 'bg-orange-100 text-orange-800'
    };
    
    const colorClass = methodColors[rowData.paymentMethod] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
        {rowData.paymentMethod?.replace('_', ' ')}
      </span>
    );
  };

  const lastVisitBodyTemplate = (rowData) => {
    return (
      <span className="text-xs text-gray-600">
        {formatLastVisit(rowData.createdAt)}
      </span>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => viewBillDetails(rowData)}
        tooltip="View Details"
      />
    );
  };

  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setViewDialogVisible(true);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className="pi pi-receipt text-blue-600"></i>
            Your Billing History
          </h2>
          <p className="text-sm text-gray-600 mt-1">View all bills created by you</p>
        </div>
        <Button
          icon="pi pi-refresh"
          label="Refresh"
          onClick={fetchBills}
          loading={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
        />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toast ref={toastRef} />
      
      <div className="mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 sm:p-3 rounded-full">
              <i className="pi pi-file text-white text-xl sm:text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800">My Bills</h1>
              <p className="text-gray-600 mt-1">Track all your billing transactions</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="bill-history-card">
        <DataTable
          value={bills}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={renderHeader()}
          emptyMessage="No bills found"
          className="p-datatable-sm"
          stripedRows
          showGridlines
        >
          <Column 
            field="billId" 
            header="Bill ID" 
            sortable 
            headerClassName="hidden md:table-cell"
            bodyClassName="hidden md:table-cell"
            style={{ width: '8%' }}
          />
          <Column 
            field="invoiceNo" 
            header="Invoice No" 
            sortable 
            headerClassName="hidden md:table-cell"
            bodyClassName="hidden md:table-cell"
            style={{ width: '12%' }}
          />
          <Column 
            field="customerName" 
            header="Customer" 
            sortable 
            style={{ width: '13%' }}
          />
          <Column 
            field="phoneNumber" 
            header="Phone" 
            sortable 
            headerClassName="hidden lg:table-cell"
            bodyClassName="hidden lg:table-cell"
            style={{ width: '11%' }}
          />
          <Column 
            field="carNo" 
            header="Vehicle No." 
            sortable 
            style={{ width: '11%' }}
          />
          <Column 
            field="packageName" 
            header="Package" 
            sortable 
            headerClassName="hidden md:table-cell"
            bodyClassName="hidden md:table-cell"
            style={{ width: '13%' }}
          />
          <Column 
            field="totalAmount" 
            header="Amount" 
            body={amountBodyTemplate}
            sortable 
            style={{ width: '10%' }}
          />
          <Column 
            field="paymentMethod" 
            header="Payment" 
            body={paymentMethodBodyTemplate}
            sortable 
            headerClassName="hidden md:table-cell"
            bodyClassName="hidden md:table-cell"
            style={{ width: '10%' }}
          />
          <Column 
            field="createdAt" 
            header="Date & Time" 
            body={dateBodyTemplate}
            sortable 
            style={{ width: '12%' }}
          />
          <Column 
            header="Actions" 
            body={actionBodyTemplate}
            style={{ width: '8%' }}
          />
        </DataTable>
      </Card>

      {/* View Bill Details Dialog */}
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
    </div>
  );
}
