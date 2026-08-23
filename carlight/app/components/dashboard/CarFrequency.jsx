'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import * as XLSX from 'xlsx';

const CarFrequency = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toast = React.useRef(null);
  const [carData, setCarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const [carVisits, setCarVisits] = useState([]);
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
  const [allBills, setAllBills] = useState([]);
  const [dateRange, setDateRange] = useState(null);

  const getBillsInDateRange = (bills) => {
    if (!dateRange || (!dateRange[0] && !dateRange[1])) {
      return bills;
    }

    const startDate = dateRange[0] ? new Date(dateRange[0]) : null;
    const endDate = dateRange[1] ? new Date(dateRange[1]) : null;

    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    return bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);

      if (startDate && billDate < startDate) {
        return false;
      }

      if (endDate && billDate > endDate) {
        return false;
      }

      return true;
    });
  };

  const buildCarFrequencyData = (bills) => {
    const carFrequencyMap = {};

    bills.forEach((bill) => {
      const carNo = bill.carNo;
      if (carNo) {
        if (!carFrequencyMap[carNo]) {
          carFrequencyMap[carNo] = {
            carNo: carNo,
            carType: bill.carType,
            customerName: bill.customerName,
            phoneNumber: bill.phoneNumber,
            visitCount: 0,
            totalSpent: 0,
            lastVisit: bill.createdAt
          };
        }

        carFrequencyMap[carNo].visitCount += 1;
        carFrequencyMap[carNo].totalSpent += bill.totalAmount || 0;

        if (new Date(bill.createdAt) > new Date(carFrequencyMap[carNo].lastVisit)) {
          carFrequencyMap[carNo].lastVisit = bill.createdAt;
        }
      }
    });

    return Object.values(carFrequencyMap).sort((a, b) => b.visitCount - a.visitCount);
  };

  const fetchCarFrequency = async () => {
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
        const bills = await response.json();
        setAllBills(bills);
        setCarData(buildCarFrequencyData(getBillsInDateRange(bills)));
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch car frequency data',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching car frequency:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch car frequency data',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarFrequency();
  }, []);

  useEffect(() => {
    if (allBills.length > 0) {
      setCarData(buildCarFrequencyData(getBillsInDateRange(allBills)));
    }
  }, [allBills, dateRange]);

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

  const viewDetailsTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-eye"
        label="Visits"
        className="p-button-sm p-button-info"
        onClick={() => {
          setSelectedCar(rowData);
          const visits = getBillsInDateRange(allBills).filter(bill => bill.carNo === rowData.carNo);
          setCarVisits(visits);
          setDetailsDialogVisible(true);
        }}
        tooltip="View All Visits"
      />
    );
  };

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredCars.map((car, index) => ({
      'S.No': index + 1,
      'Car Number': car.carNo,
      'Car Type': car.carType || 'N/A',
      'Customer Name': car.customerName,
      'Phone Number': car.phoneNumber,
      'Total Visits': car.visitCount,
      'Total Spent (₹)': car.totalSpent.toFixed(2),
      'Average Per Visit (₹)': (car.totalSpent / car.visitCount).toFixed(2),
      'Last Visit': formatDate(car.lastVisit)
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 15 }, // Car Number
      { wch: 12 }, // Car Type
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Phone Number
      { wch: 12 }, // Total Visits
      { wch: 15 }, // Total Spent
      { wch: 18 }, // Average Per Visit
      { wch: 15 }  // Last Visit
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Car Frequency');

    // Generate filename with current date
    const date = new Date();
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const filename = `Car_Frequency_${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: 'Data exported to Excel successfully',
      life: 3000
    });
  };

  const filteredCars = carData.filter(car => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (car.carNo && car.carNo.toLowerCase().includes(search)) ||
      (car.customerName && car.customerName.toLowerCase().includes(search)) ||
      (car.phoneNumber && car.phoneNumber.toLowerCase().includes(search))
    );
  });

  const totalVehicles = filteredCars.length;
  const totalVisits = filteredCars.reduce((sum, car) => sum + (car.visitCount || 0), 0);
  const totalRevenue = filteredCars.reduce((sum, car) => sum + (car.totalSpent || 0), 0);
  const activeRangeLabel = dateRange?.[0] && dateRange?.[1]
    ? `${formatDate(dateRange[0])} - ${formatDate(dateRange[1])}`
    : dateRange?.[0]
      ? `From ${formatDate(dateRange[0])}`
      : dateRange?.[1]
        ? `Until ${formatDate(dateRange[1])}`
        : 'All time';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <Toast ref={toast} />
      
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="border-b border-slate-100 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <i className="pi pi-car text-blue-600"></i>
                Car Frequency
              </h2>
              <p className="text-gray-600 mt-2">Track vehicle visit frequency and spending</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                label="Export to Excel"
                icon="pi pi-file-excel"
                onClick={exportToExcel}
                className="border-0 bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                disabled={filteredCars.length === 0}
              />
              <Button
                type="button"
                label="Refresh"
                icon="pi pi-refresh"
                onClick={fetchCarFrequency}
                loading={loading}
                className="border-0 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 bg-slate-50/80 p-6 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Cars in view</p>
                <p className="mt-1 text-2xl font-semibold text-slate-800">{totalVehicles}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <i className="pi pi-car"></i>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total visits</p>
                <p className="mt-1 text-2xl font-semibold text-slate-800">{totalVisits}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <i className="pi pi-check-circle"></i>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Revenue</p>
                <p className="mt-1 text-2xl font-semibold text-slate-800">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <i className="pi pi-wallet"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-white p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <i className="pi pi-search text-gray-400"></i>
              </div>
              <input
                type="text"
                placeholder="Search by car number, customer name, or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Range:</span> {activeRangeLabel}
              </div>
              <Calendar
                value={dateRange}
                onChange={(e) => setDateRange(e.value)}
                selectionMode="range"
                showIcon
                maxDate={new Date()}
                dateFormat="dd/mm/yy"
                placeholder="From - To"
                className="w-full md:w-72"
              />
              <Button
                type="button"
                label="Clear"
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={() => setDateRange(null)}
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-auto p-6" style={{ width: '100%' }}>
          <DataTable
            value={filteredCars}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="No car data found"
            stripedRows
            showGridlines
            className="p-datatable-sm"
          >
            <Column field="carNo" header="Car No" sortable style={{ width: '10rem' }} />
            <Column field="carType" header="Car Type" sortable style={{ width: '10rem' }} />
            <Column field="customerName" header="Customer Name" sortable style={{ width: '12rem' }} />
            <Column field="phoneNumber" header="Phone Number" sortable style={{ width: '11rem' }} />
            <Column 
              field="visitCount" 
              header="Total Visits" 
              sortable 
              style={{ width: '10rem' }}
              body={(rowData) => (
                <span className="font-semibold text-blue-600">{rowData.visitCount}</span>
              )}
            />
            <Column 
              field="totalSpent" 
              header="Total Spent" 
              sortable 
              body={(rowData) => formatCurrency(rowData.totalSpent)} 
              style={{ width: '10rem' }} 
            />
            <Column 
              field="lastVisit" 
              header="Last Visit" 
              sortable 
              body={(rowData) => formatDate(rowData.lastVisit)} 
              style={{ width: '11rem' }} 
            />
            <Column 
              header="Action" 
              body={viewDetailsTemplate} 
              style={{ width: '10rem', textAlign: 'center' }} 
            />
          </DataTable>
        </div>
      </div>

      {/* Car Visits Details Dialog */}
      <Dialog
        header={selectedCar ? `All Visits - ${selectedCar.carNo}` : 'Car Visits'}
        visible={detailsDialogVisible}
        style={{ width: '80vw' }}
        onHide={() => setDetailsDialogVisible(false)}
        modal
        className="p-fluid"
      >
        {selectedCar && (
          <div className="space-y-4 p-1">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Car Number</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{selectedCar.carNo}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Car Type</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{selectedCar.carType}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Customer Name</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{selectedCar.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Phone Number</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{selectedCar.phoneNumber}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-blue-200 pt-4 md:grid-cols-3">
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <p className="text-sm font-semibold text-slate-500">Total Visits</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{selectedCar.visitCount}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <p className="text-sm font-semibold text-slate-500">Total Spent</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(selectedCar.totalSpent)}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <p className="text-sm font-semibold text-slate-500">Average Per Visit</p>
                  <p className="mt-1 text-2xl font-bold text-violet-600">{formatCurrency(selectedCar.totalSpent / selectedCar.visitCount)}</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800">Visit History</h3>
            <DataTable
              value={carVisits}
              paginator
              rows={5}
              rowsPerPageOptions={[5, 10, 15]}
              emptyMessage="No visits found"
              stripedRows
              showGridlines
              className="p-datatable-sm"
            >
              <Column 
                field="billId" 
                header="Bill ID" 
                sortable 
                style={{ width: '8rem' }}
              />
              <Column 
                field="invoiceNo" 
                header="Invoice No" 
                sortable 
                style={{ width: '15rem' }}
              />
              <Column 
                field="createdAt" 
                header="Visit Date" 
                sortable 
                body={(rowData) => formatDateTime(rowData.createdAt)} 
                style={{ width: '15rem' }}
              />
              <Column 
                field="outletName" 
                header="Outlet" 
                sortable 
                style={{ width: '12rem' }}
              />
              <Column 
                field="packageName" 
                header="Package" 
                sortable 
                style={{ width: '12rem' }}
              />
              <Column 
                field="totalAmount" 
                header="Amount" 
                sortable 
                body={(rowData) => formatCurrency(rowData.totalAmount)} 
                style={{ width: '10rem' }}
              />
              <Column 
                field="paymentMethod" 
                header="Payment" 
                sortable 
                style={{ width: '10rem' }}
              />
            </DataTable>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default CarFrequency;
