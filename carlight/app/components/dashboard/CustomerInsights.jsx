'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import * as XLSX from 'xlsx';

// Recency quick-filter presets (in months)
const RECENCY_FILTERS = [
  { key: 'all', label: 'All Customers', icon: 'pi pi-users' },
  { key: '1', label: 'Within 1 Month', icon: 'pi pi-clock' },
  { key: '3', label: 'Within 3 Months', icon: 'pi pi-calendar-plus' },
  { key: '6', label: 'Within 6 Months', icon: 'pi pi-calendar' },
  { key: '12', label: 'Within 12 Months', icon: 'pi pi-calendar-times' },
];

const CustomerInsights = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toast = React.useRef(null);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [recencyFilter, setRecencyFilter] = useState('all');
  const [customMonths, setCustomMonths] = useState('');
  const [useCustomMonths, setUseCustomMonths] = useState(false);
  const [dormantOnly, setDormantOnly] = useState(false); // > 6 months absent

  // Detail dialog
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/customers/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch customer activity',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching customer activity:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch customer activity',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ---------- Derived analytics ----------

  const uniqueOutlets = useMemo(() => {
    const set = new Set();
    customers.forEach(c => (c.outlets || []).forEach(o => set.add(o)));
    return [...set].sort();
  }, [customers]);

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.daysSinceLastVisit != null && c.daysSinceLastVisit <= 90).length;
    const atRisk = customers.filter(c => c.daysSinceLastVisit != null && c.daysSinceLastVisit > 90 && c.daysSinceLastVisit <= 180).length;
    const dormant = customers.filter(c => c.daysSinceLastVisit == null || c.daysSinceLastVisit > 180).length;
    return { total, active, atRisk, dormant };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return customers.filter(customer => {
      // Search: name / phone / car no / model
      const matchesSearch = !term ||
        (customer.name && customer.name.toLowerCase().includes(term)) ||
        (customer.phoneNumber && customer.phoneNumber.includes(term)) ||
        (customer.cars || []).some(car =>
          (car.carNo && car.carNo.toLowerCase().includes(term)) ||
          (car.model && car.model.toLowerCase().includes(term))
        );

      // Outlet
      const matchesOutlet = !selectedOutlet ||
        (customer.outlets || []).includes(selectedOutlet);

      // Dormant toggle (> 6 months)
      const matchesDormant = !dormantOnly ||
        customer.daysSinceLastVisit == null || customer.daysSinceLastVisit > 180;

      // Recency (months since last visit; ~30 days per month)
      let matchesRecency = true;
      const monthsLimit = useCustomMonths
        ? parseInt(customMonths, 10)
        : (recencyFilter === 'all' ? null : parseInt(recencyFilter, 10));
      if (!isNaN(monthsLimit) && monthsLimit > 0) {
        matchesRecency = customer.daysSinceLastVisit != null &&
          customer.daysSinceLastVisit <= monthsLimit * 30;
      }

      return matchesSearch && matchesOutlet && matchesDormant && matchesRecency;
    });
  }, [customers, searchTerm, selectedOutlet, recencyFilter, customMonths, useCustomMonths, dormantOnly]);

  // ---------- Helpers ----------

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatCurrency = (value) => {
    return `₹${value ? Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`;
  };

  const formatPhone = (phone) => (phone ? `+91 ${phone}` : 'N/A');

  const whatsappLink = (customer) =>
    `https://wa.me/91${customer.phoneNumber}?text=${encodeURIComponent(
      `Hello ${customer.name}, this is CarLight. We miss you! Visit us again for a special offer on your next car wash.`
    )}`;

  const absentBadge = (days) => {
    if (days == null) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Unknown</span>;
    }
    if (days <= 30) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">{days} days ago</span>;
    }
    if (days <= 90) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{days} days ago</span>;
    }
    if (days <= 180) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{days} days ago</span>;
    }
    const months = Math.floor(days / 30);
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">{months}+ month{months > 1 ? 's' : ''} ago</span>;
  };

  const carsTemplate = (rowData) => {
    if (!rowData.cars || rowData.cars.length === 0) return <span className="text-gray-400">N/A</span>;
    return (
      <div className="flex flex-col gap-1">
        {rowData.cars.map((car, i) => (
          <span key={i} className="text-sm">
            <span className="font-semibold text-gray-800">{car.carNo}</span>
            {car.model && <span className="text-gray-500"> · {car.model}</span>}
            {car.carType && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                {car.carType}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  const contactTemplate = (rowData) => {
    if (!rowData.phoneNumber) return <span className="text-gray-400">N/A</span>;
    return (
      <div className="flex items-center justify-center gap-1">
        <a
          href={`tel:+91${rowData.phoneNumber}`}
          className="p-button p-button-rounded p-button-text p-button-success p-button-sm"
          style={{ textDecoration: 'none' }}
          title={`Call ${rowData.name}`}
        >
          <i className="pi pi-phone"></i>
        </a>
        <a
          href={whatsappLink(rowData)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-button p-button-rounded p-button-text p-button-sm"
          style={{ textDecoration: 'none', color: '#16a34a' }}
          title="Send WhatsApp message"
        >
          <i className="pi pi-whatsapp" style={{ fontWeight: 'bold' }}></i>
        </a>
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-text p-button-info p-button-sm"
          onClick={() => {
            setSelectedCustomer(rowData);
            setDetailDialogVisible(true);
          }}
          tooltip="View Full Details"
        />
      </div>
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedOutlet('');
    setRecencyFilter('all');
    setCustomMonths('');
    setUseCustomMonths(false);
    setDormantOnly(false);
  };

  const exportToExcel = () => {
    const exportData = filteredCustomers.map((c, index) => ({
      'S.No': index + 1,
      'Customer Name': c.name,
      'Phone Number': c.phoneNumber ? `+91${c.phoneNumber}` : 'N/A',
      'Cars': (c.cars || []).map(car => `${car.carNo}${car.model ? ` (${car.model})` : ''}`).join(', '),
      'Total Visits': c.totalVisits,
      'Total Spend (INR)': c.totalSpend ? Number(c.totalSpend).toFixed(2) : '0.00',
      'First Visit': formatDate(c.firstVisitDate),
      'Last Visit': formatDate(c.lastVisitDate),
      'Days Since Last Visit': c.daysSinceLastVisit ?? 'N/A',
      'Outlets': (c.outlets || []).join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 22 }, { wch: 15 }, { wch: 32 }, { wch: 12 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 24 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Insights');

    const date = new Date();
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    XLSX.writeFile(workbook, `Customer_Insights_${dateStr}.xlsx`);

    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: `${filteredCustomers.length} customers exported to Excel`,
      life: 3000
    });
  };

  const activeChipStyle = (isActive) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
      isActive
        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
    }`;

  // ---------- Render ----------

  return (
    <div className="p-6">
      <Toast ref={toast} />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i className="pi pi-sparkles text-purple-600"></i>
          Customer Insights
        </h2>
        <p className="text-gray-600 mt-2">
          Track customer visits, find long-absent customers and reach out personally
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Customers</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <i className="pi pi-users text-4xl opacity-40"></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active (≤ 90 days)</p>
              <p className="text-3xl font-bold mt-1">{stats.active}</p>
            </div>
            <i className="pi pi-check-circle text-4xl opacity-40"></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">At Risk (91–180 days)</p>
              <p className="text-3xl font-bold mt-1">{stats.atRisk}</p>
            </div>
            <i className="pi pi-exclamation-circle text-4xl opacity-40"></i>
          </div>
        </div>
        <div
          className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white shadow-md cursor-pointer hover:opacity-90 transition-all"
          onClick={() => { setDormantOnly(true); setRecencyFilter('all'); }}
          title="Click to view dormant customers"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Dormant (&gt; 180 days)</p>
              <p className="text-3xl font-bold mt-1">{stats.dormant}</p>
            </div>
            <i className="pi pi-user-minus text-4xl opacity-40"></i>
          </div>
        </div>
      </div>

      {/* Dormant Alert Banner */}
      {stats.dormant > 0 && !dormantOnly && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <i className="pi pi-bell text-red-600 text-xl"></i>
            <div>
              <p className="font-semibold text-red-800 text-sm">
                {stats.dormant} customer{stats.dormant > 1 ? 's have' : ' has'} not visited in over 6 months
              </p>
              <p className="text-red-600 text-xs">These customers may be lost — reach out personally with an offer to win them back.</p>
            </div>
          </div>
          <Button
            label="Show Them"
            icon="pi pi-arrow-right"
            iconPos="right"
            onClick={() => { setDormantOnly(true); setRecencyFilter('all'); }}
            className="bg-red-600 hover:bg-red-700 border-0 text-white px-4 py-2 text-sm"
          />
        </div>
      )}

      {/* Recency Quick Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <i className="pi pi-filter mr-1 text-blue-600"></i>
          Last Visited Within
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          {RECENCY_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setRecencyFilter(f.key); setUseCustomMonths(false); }}
              className={activeChipStyle(!useCustomMonths && recencyFilter === f.key)}
            >
              <i className={`${f.icon} mr-1`}></i>
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setUseCustomMonths(true)}
            className={activeChipStyle(useCustomMonths)}
          >
            <i className="pi pi-sliders-h mr-1"></i>
            Custom
          </button>
          {useCustomMonths && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="number"
                min="1"
                max="120"
                placeholder="Months"
                value={customMonths}
                onChange={(e) => setCustomMonths(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="text-sm text-gray-600">months</span>
            </div>
          )}
          <button
            onClick={() => setDormantOnly(!dormantOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
              dormantOnly
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
            }`}
          >
            <i className="pi pi-user-minus mr-1"></i>
            Not Visited (6+ Months)
          </button>
        </div>
      </div>

      {/* Search / Outlet / Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Name, phone, car number or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="lg:col-span-3">
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

        <div className="lg:col-span-4 flex items-end gap-2">
          <Button
            icon="pi pi-filter-slash"
            label="Clear"
            onClick={clearFilters}
            className="flex-1 bg-gray-500 hover:bg-gray-600 border-0 text-white"
            tooltip="Clear all filters"
          />
          <Button
            icon="pi pi-file-excel"
            label="Export"
            onClick={exportToExcel}
            className="flex-1 bg-green-600 hover:bg-green-700 border-0 text-white"
            disabled={filteredCustomers.length === 0}
            tooltip="Export filtered customers to Excel"
          />
          <Button
            icon="pi pi-refresh"
            onClick={fetchCustomers}
            loading={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 border-0 text-white"
            tooltip="Refresh data"
          />
        </div>
      </div>

      {/* Result count */}
      <div className="mb-2 text-sm text-gray-600">
        Showing <span className="font-bold text-gray-800">{filteredCustomers.length}</span> of{' '}
        <span className="font-bold text-gray-800">{customers.length}</span> customers
        {(searchTerm || selectedOutlet || dormantOnly || recencyFilter !== 'all' || useCustomMonths) && (
          <button onClick={clearFilters} className="ml-2 text-blue-600 hover:underline text-xs">
            reset filters
          </button>
        )}
      </div>

      {/* Customer Table */}
      <div className="overflow-auto" style={{ width: '100%' }}>
        <DataTable
          value={filteredCustomers}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No customers match your filters"
          stripedRows
          showGridlines
          sortField="daysSinceLastVisit"
          sortOrder={-1}
          removableSort
        >
          <Column field="name" header="Customer Name" sortable style={{ width: '14rem' }} body={(row) => (
            <div>
              <p className="font-semibold text-gray-800">{row.name}</p>
              <p className="text-xs text-gray-500">{formatPhone(row.phoneNumber)}</p>
            </div>
          )} />
          <Column header="Cars" body={carsTemplate} style={{ width: '18rem' }} />
          <Column field="totalVisits" header="Visits" sortable style={{ width: '7rem' }} body={(row) => (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              {row.totalVisits}
            </span>
          )} />
          <Column field="totalSpend" header="Total Spent" sortable style={{ width: '11rem' }} body={(row) => formatCurrency(row.totalSpend)} />
          <Column field="lastVisitDate" header="Last Visit" sortable style={{ width: '10rem' }} body={(row) => formatDate(row.lastVisitDate)} />
          <Column field="daysSinceLastVisit" header="Absent For" sortable style={{ width: '12rem' }} body={(row) => absentBadge(row.daysSinceLastVisit)} />
          <Column field="outlets" header="Outlets" style={{ width: '13rem' }} body={(row) => (
            <span className="text-sm text-gray-600">{(row.outlets || []).join(', ') || 'N/A'}</span>
          )} />
          <Column header="Contact" body={contactTemplate} style={{ width: '11rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* Customer Detail Dialog */}
      <Dialog
        header="Customer Details"
        visible={detailDialogVisible}
        style={{ width: '480px' }}
        onHide={() => {
          setDetailDialogVisible(false);
          setSelectedCustomer(null);
        }}
        modal
      >
        {selectedCustomer && (
          <div className="p-2">
            {/* Name & Phone */}
            <div className="text-center mb-4 pb-4 border-b">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                {selectedCustomer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{selectedCustomer.name}</h3>
              <p className="text-gray-500">{formatPhone(selectedCustomer.phoneNumber)}</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <a
                href={`tel:+91${selectedCustomer.phoneNumber}`}
                className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-phone"></i>
                Call Now
              </a>
              <a
                href={whatsappLink(selectedCustomer)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-lg bg-[#25D366] hover:bg-[#1eb855] text-white font-semibold transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-whatsapp"></i>
                WhatsApp
              </a>
            </div>

            {/* Visit Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600 font-medium">Total Visits</p>
                <p className="text-xl font-bold text-blue-800">{selectedCustomer.totalVisits}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600 font-medium">Total Spent</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(selectedCustomer.totalSpend)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-600 font-medium">First Visit</p>
                <p className="text-sm font-semibold text-purple-800">{formatDate(selectedCustomer.firstVisitDate)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-600 font-medium">Last Visit</p>
                <p className="text-sm font-semibold text-orange-800">{formatDate(selectedCustomer.lastVisitDate)}</p>
              </div>
            </div>

            {/* Cars */}
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                <i className="pi pi-car mr-1 text-blue-600"></i>Cars
              </p>
              {(selectedCustomer.cars || []).length === 0 ? (
                <p className="text-sm text-gray-400">No cars registered</p>
              ) : (
                <div className="space-y-1">
                  {selectedCustomer.cars.map((car, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                      <span className="font-semibold text-gray-800 text-sm">{car.carNo}</span>
                      <span className="text-xs text-gray-500">
                        {[car.model, car.carType].filter(Boolean).join(' · ') || ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outlets */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                <i className="pi pi-building mr-1 text-blue-600"></i>Outlets Visited
              </p>
              <p className="text-sm text-gray-600">
                {(selectedCustomer.outlets || []).join(', ') || 'N/A'}
              </p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default CustomerInsights;