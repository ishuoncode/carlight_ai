'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];

const ALL_MONTHS = [
  { label: 'January', value: 1 }, { label: 'February', value: 2 },
  { label: 'March', value: 3 }, { label: 'April', value: 4 },
  { label: 'May', value: 5 }, { label: 'June', value: 6 },
  { label: 'July', value: 7 }, { label: 'August', value: 8 },
  { label: 'September', value: 9 }, { label: 'October', value: 10 },
  { label: 'November', value: 11 }, { label: 'December', value: 12 }
];

// "ELECTRICITY_BILL" -> "Electricity Bill"
const prettyLabel = (s = '') =>
  String(s).toLowerCase().split('_').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const EMPTY_FORM = {
  outletId: '',
  title: '',
  amount: '',
  category: '',
  notes: '',
  createdAt: new Date()
};

const ExpenseManagement = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toast = React.useRef(null);

  const [expenses, setExpenses] = useState([]);   // all expenses — filtered on the client
  const [loading, setLoading] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [categoryValues, setCategoryValues] = useState([]);

  // Filters
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add form
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  // ---------- Data loading (ONE request for all expenses) ----------
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`, { headers: authHeaders() });
      if (response.ok) {
        setExpenses(await response.json());
      } else {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch expenses', life: 3000 });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch expenses', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnums = async () => {
    try {
      const cached = localStorage.getItem('enumsData');
      if (cached) {
        const enums = JSON.parse(cached);
        if (enums.expenseCategories) {
          setCategoryValues(enums.expenseCategories);
          return;
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/meta/enums`, { headers: authHeaders() });
      if (response.ok) {
        const enums = await response.json();
        localStorage.setItem('enumsData', JSON.stringify(enums));
        if (enums.expenseCategories) setCategoryValues(enums.expenseCategories);
      }
    } catch (error) {
      console.error('Error fetching enums:', error);
    }
  };

  const fetchOutlets = async () => {
    try {
      const cachedOutlets = localStorage.getItem('outlets');
      if (cachedOutlets) {
        try {
          const parsed = JSON.parse(cachedOutlets);
          // Validate that cached data has the expected format (array with objects having name/id)
          if (Array.isArray(parsed)) {
            setOutlets(parsed.map(o => ({ label: o.name, value: o.id })));
            return;
          }
        } catch (e) {
          // Invalid JSON or unexpected format, fall through to fetch
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/outlets`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('outlets', JSON.stringify(data));
        setOutlets(data.map(o => ({ label: o.name, value: o.id })));
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  useEffect(() => {
    fetchEnums();
    fetchOutlets();
    fetchExpenses();
  }, []);

  // ---------- Derived: ONE consistent filter pipeline drives table + pie + totals ----------
  const periodFiltered = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.createdAt);
      if (selectedOutlet && (e.outlet?.id ?? e.outletId) !== Number(selectedOutlet)) return false;
      if (viewMode === 'monthly') {
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
      }
      if (viewMode === 'yearly') {
        return d.getFullYear() === selectedYear;
      }
      if (viewMode === 'range') {
        if (!fromDate || !toDate) return false;
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
        return day >= from && day <= to;
      }
      return true;
    });
  }, [expenses, viewMode, selectedYear, selectedMonth, selectedOutlet, fromDate, toDate]);

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return periodFiltered;
    return periodFiltered.filter(e =>
      (e.title || '').toLowerCase().includes(term) ||
      prettyLabel(e.category || '').toLowerCase().includes(term) ||
      (e.notes || '').toLowerCase().includes(term) ||
      (e.outlet?.name || '').toLowerCase().includes(term)
    );
  }, [periodFiltered, searchTerm]);

  const totalAmount = useMemo(() =>
    filteredExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0), [filteredExpenses]);

  const avgAmount = filteredExpenses.length ? totalAmount / filteredExpenses.length : 0;

  const maxExpense = useMemo(() =>
    filteredExpenses.reduce((max, e) => ((parseFloat(e.amount) || 0) > (parseFloat(max?.amount) || 0) ? e : max), null),
    [filteredExpenses]);

  // Pie computed from the SAME filtered list — always matches the table & totals
  const pieData = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(e => {
      const key = prettyLabel(e.category || 'Other');
      map[key] = (map[key] || 0) + (parseFloat(e.amount) || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(i => i.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const categoryOptions = useMemo(() =>
    categoryValues.map(c => ({
      label: prettyLabel(typeof c === 'string' ? c : c.value),
      value: typeof c === 'string' ? c : c.value
    })), [categoryValues]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: current - 2024 + 2 }, (_, i) => ({ label: String(current - i), value: current - i }));
  }, []);

  const months = selectedYear === new Date().getFullYear()
    ? ALL_MONTHS.filter(m => m.value <= new Date().getMonth() + 1)
    : ALL_MONTHS;

  // ---------- Helpers ----------
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (value) => {
    const date = new Date(value);
    return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
  };

  const periodLabel = viewMode === 'monthly'
    ? `${months.find(m => m.value === selectedMonth)?.label || ''} ${selectedYear}`
    : viewMode === 'yearly' ? `Year ${selectedYear}`
    : fromDate && toDate ? `${formatDate(fromDate)} – ${formatDate(toDate)}`
    : 'Date Range';

  // ---------- Add expense ----------
  const validateForm = () => {
    const errors = {};
    if (!formData.outletId) errors.outletId = 'Please select an outlet';
    if (!formData.title.trim()) errors.title = 'Please enter a title';
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) errors.amount = 'Enter an amount greater than 0';
    if (!formData.category) errors.category = 'Please select a category';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddExpense = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!validateForm() || saving) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          outletId: formData.outletId,
          title: formData.title.trim(),
          amount: parseFloat(formData.amount),
          category: formData.category,
          notes: formData.notes.trim(),
          createdAt: formData.createdAt.toISOString()
        })
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Expense Saved ✓',
          detail: `${formatCurrency(formData.amount)} — ${formData.title.trim()}`,
          life: 3000
        });
        closeAddDialog();
        fetchExpenses(); // pie, totals & table all update from this one list
      } else {
        let detail = 'Failed to add expense. Please try again.';
        try {
          const err = await response.json();
          if (err?.message) detail = err.message;
        } catch (_) {}
        toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to add expense', life: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const openAddDialog = () => {
    setFormData({ ...EMPTY_FORM, createdAt: new Date() });
    setFormErrors({});
    setAddDialogVisible(true);
  };

  const closeAddDialog = () => {
    setAddDialogVisible(false);
    setFormErrors({});
  };

  const clearFieldError = (field) => {
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const confirmDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogVisible(true);
  };

  // ---------- Delete ----------
  const handleDeleteExpense = async () => {
    if (!expenseToDelete || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseToDelete.id}/permanent`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (response.ok) {
        toast.current?.show({ severity: 'success', summary: 'Deleted', detail: `"${expenseToDelete.title}" was removed`, life: 3000 });
        setDeleteDialogVisible(false);
        setExpenseToDelete(null);
        fetchExpenses();
      } else {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete expense', life: 3000 });
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete expense', life: 3000 });
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Export CSV of exactly what's on screen ----------
  const exportToExcel = () => {
    if (filteredExpenses.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export', life: 3000 });
      return;
    }
    const exportData = filteredExpenses.map(expense => ({
      Title: expense.title,
      Outlet: expense.outlet?.name || 'N/A',
      Category: prettyLabel(expense.category),
      Amount: expense.amount,
      Date: formatDate(expense.createdAt),
      Notes: expense.notes || ''
    }));
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(h => {
        const value = row[h];
        return (typeof value === 'string' && (value.includes(',') || value.includes('"')))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `expenses_${periodLabel.replace(/[^\w-]+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.current?.show({ severity: 'success', summary: 'Success', detail: `${filteredExpenses.length} expenses exported`, life: 3000 });
  };

  // ---------- Render ----------
  const errClass = (field) => formErrors[field] ? 'border-red-500 border-2' : 'border-gray-300';

  return (
    <div className="p-4 sm:p-6">
      <Toast ref={toast} />

      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <i className="pi pi-money-bill text-blue-600"></i>
              Expense Management
            </h2>
            <p className="text-gray-600 mt-2">Track and manage your business expenses</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Button
              icon="pi pi-refresh"
              onClick={fetchExpenses}
              loading={loading}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3"
              tooltip="Refresh data"
              tooltipOptions={{ position: 'bottom' }}
              outlined
            />
            <Button
              label="Export"
              icon="pi pi-file-excel"
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 border-0 text-white px-5 py-3"
              tooltip="Export the filtered list to CSV"
              tooltipOptions={{ position: 'bottom' }}
            />
            <Button
              label="Add Expense"
              icon="pi pi-plus"
              onClick={openAddDialog}
              className="bg-blue-600 hover:bg-blue-700 border-0 text-white px-5 py-3"
            />
          </div>
        </div>

        {/* Summary Cards for the selected period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700">Total Spent — {periodLabel}</p>
                <h3 className="text-2xl font-bold text-red-800">{formatCurrency(totalAmount)}</h3>
              </div>
              <i className="pi pi-wallet text-2xl text-red-400"></i>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Entries</p>
                <h3 className="text-2xl font-bold text-blue-800">{filteredExpenses.length}</h3>
              </div>
              <i className="pi pi-list text-2xl text-blue-400"></i>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-700">Average Expense</p>
                <h3 className="text-2xl font-bold text-emerald-800">{formatCurrency(avgAmount)}</h3>
              </div>
              <i className="pi pi-chart-line text-2xl text-emerald-400"></i>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700">Biggest Single Expense</p>
                <h3 className="text-xl font-bold text-orange-800 truncate" title={maxExpense?.title}>
                  {maxExpense ? formatCurrency(maxExpense.amount) : '—'}
                </h3>
              </div>
              <i className="pi pi-arrow-up text-2xl text-orange-400"></i>
            </div>
          </div>
        </div>

        {/* Filters + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Filter controls */}
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
                <Dropdown
                  value={viewMode}
                  options={[
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Yearly', value: 'yearly' },
                    { label: 'Date Range', value: 'range' }
                  ]}
                  onChange={(e) => setViewMode(e.value)}
                  className="w-full border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <Dropdown
                  value={selectedYear}
                  options={years}
                  onChange={(e) => setSelectedYear(e.value)}
                  className="w-full border border-gray-300"
                  disabled={viewMode === 'range'}
                />
              </div>
            </div>

            {viewMode === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <Dropdown
                  value={selectedMonth}
                  options={months}
                  onChange={(e) => setSelectedMonth(e.value)}
                  className="w-full border border-gray-300"
                />
              </div>
            )}

            {viewMode === 'range' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <Calendar
                    value={fromDate}
                    onChange={(e) => setFromDate(e.value)}
                    dateFormat="dd M yy"
                    placeholder="Start date"
                    className="w-full border border-gray-300"
                    showIcon
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <Calendar
                    value={toDate}
                    onChange={(e) => setToDate(e.value)}
                    dateFormat="dd M yy"
                    placeholder="End date"
                    className="w-full border border-gray-300"
                    showIcon
                    minDate={fromDate}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
              <Dropdown
                value={selectedOutlet}
                options={outlets}
                onChange={(e) => setSelectedOutlet(e.value)}
                className="w-full border border-gray-300"
                placeholder="Select an outlet"
                showClear
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <InputText
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Title, category, notes..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Pie chart */}
          <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Expense Distribution — <span className="text-blue-600">{periodLabel}</span>
            </h3>
            {pieData.length > 0 ? (
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="75%"
                      dataKey="value"
                      nameKey="name"
                      labelLine={{ stroke: '#9ca3af' }}
                      minAngle={4}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: '320px' }} className="flex flex-col items-center justify-center text-gray-400 gap-2">
                <i className="pi pi-inbox text-4xl"></i>
                <span>No expenses recorded for {periodLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table summary + table */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-gray-800">{filteredExpenses.length}</span> expenses
            {' '}for <span className="font-semibold text-blue-600">{periodLabel}</span>
          </p>
          <p className="text-sm text-gray-600">
            Total: <span className="font-bold text-red-600 text-lg">{formatCurrency(totalAmount)}</span>
          </p>
        </div>

        <div className="overflow-auto">
          <DataTable
            value={filteredExpenses}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="No expenses found for this period"
            stripedRows
            showGridlines
            sortField="createdAt"
            sortOrder={-1}
          >
            <Column field="title" header="Title" sortable style={{ width: '16rem' }} />
            <Column field="outlet.name" header="Outlet" sortable style={{ width: '12rem' }} />
            <Column
              field="category"
              header="Category"
              sortable
              style={{ width: '11rem' }}
              body={(rowData) => (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {prettyLabel(rowData.category)}
                </span>
              )}
            />
            <Column field="amount" header="Amount" sortable body={(rowData) => formatCurrency(rowData.amount)} style={{ width: '10rem' }} />
            <Column field="createdAt" header="Date" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ width: '10rem' }} />
            <Column field="notes" header="Notes" style={{ width: '15rem' }} body={(rowData) => (
              <span className="text-sm text-gray-600 block truncate" title={rowData.notes}>{rowData.notes || '—'}</span>
            )} />
            <Column
              header="Actions"
              body={(rowData) => (
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  onClick={() => confirmDeleteExpense(rowData)}
                  tooltip="Delete expense"
                  tooltipOptions={{ position: 'top' }}
                />
              )}
              style={{ width: '6rem', textAlign: 'center' }}
            />
          </DataTable>
        </div>
      </div>

      {/* Add Expense Dialog */}
      <Dialog
        visible={addDialogVisible}
        onHide={closeAddDialog}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-blue-100 p-3 rounded-full">
              <i className="pi pi-money-bill text-2xl text-blue-600"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Add New Expense</h3>
              <p className="text-sm text-gray-500">Fields marked * are required</p>
            </div>
          </div>
        }
        style={{ width: '560px' }}
        className="add-expense-dialog"
      >
        <form onSubmit={handleAddExpense} className="pt-4 space-y-5" noValidate>
          {/* Outlet */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-building text-blue-600"></i>
              Outlet <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={formData.outletId}
              options={outlets}
              onChange={(e) => { setFormData({ ...formData, outletId: e.value }); clearFieldError('outletId'); }}
              placeholder="Select an outlet"
              className={`w-full ${errClass('outletId')}`}
              showClear
              filter
              optionLabel="label"
              optionValue="value"
            />
            {formErrors.outletId && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>{formErrors.outletId}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-tag text-blue-600"></i>
              Title <span className="text-red-500">*</span>
            </label>
            <InputText
              value={formData.title}
              onChange={(e) => { setFormData({ ...formData, title: e.target.value }); clearFieldError('title'); }}
              placeholder="e.g., Shop Rent - January 2026"
              className={`w-full ${errClass('title')}`}
              autoFocus
              maxLength={100}
            />
            {formErrors.title && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="pi pi-list text-blue-600"></i>
                Category <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={formData.category}
                options={categoryOptions}
                onChange={(e) => { setFormData({ ...formData, category: e.value }); clearFieldError('category'); }}
                placeholder="Select category"
                className={`w-full ${errClass('category')}`}
                filter
              />
              {formErrors.category && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>{formErrors.category}</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="pi pi-dollar text-blue-600"></i>
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                <InputText
                  type="number"
                  value={formData.amount}
                  onChange={(e) => { setFormData({ ...formData, amount: e.target.value }); clearFieldError('amount'); }}
                  placeholder="0.00"
                  className={`w-full pl-8 ${errClass('amount')}`}
                  min="0"
                  step="0.01"
                />
              </div>
              {formErrors.amount && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>{formErrors.amount}</p>}
              <div className="flex gap-2 mt-2">
                {[100, 500, 1000, 5000].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      const base = parseFloat(formData.amount) || 0;
                      setFormData(prev => ({ ...prev, amount: String(base + q) }));
                      clearFieldError('amount');
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-full border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    title={`Add ₹${q} to amount`}
                  >
                    +{q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-calendar text-blue-600"></i>
              Expense Date <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs font-normal">(defaults to now)</span>
            </label>
            <Calendar
              value={formData.createdAt}
              onChange={(e) => setFormData({ ...formData, createdAt: e.value })}
              showTime
              hourFormat="24"
              showIcon
              dateFormat="dd M yy"
              placeholder="Select date and time"
              className="w-full border border-gray-300"
              maxDate={new Date()}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-file-edit text-blue-600"></i>
              Notes <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <InputTextarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional details or remarks..."
              rows={3}
              className="w-full border border-gray-300"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              label="Cancel"
              icon="pi pi-times"
              type="button"
              onClick={closeAddDialog}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              outlined
              disabled={saving}
            />
            <Button
              label={saving ? 'Saving...' : 'Save Expense'}
              icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
              type="submit"
              loading={saving}
              className="bg-blue-600 hover:bg-blue-700 border-0 text-white px-6 py-2"
            />
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={deleteDialogVisible}
        onHide={() => {
          setDeleteDialogVisible(false);
          setExpenseToDelete(null);
        }}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-red-100 p-3 rounded-full">
              <i className="pi pi-exclamation-triangle text-2xl text-red-600"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Delete Expense</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
        }
        style={{ width: '500px' }}
        className="delete-expense-dialog"
      >
        <div className="pt-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start">
              <i className="pi pi-info-circle text-red-600 text-xl mt-1 mr-3"></i>
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Are you sure you want to delete this expense?
                </p>
                <p className="text-sm text-red-700">
                  This will permanently remove it from your records.
                </p>
              </div>
            </div>
          </div>

          {expenseToDelete && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Title:</span>
                <span className="text-sm font-semibold text-gray-800">{expenseToDelete.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-sm font-bold text-red-600">{formatCurrency(expenseToDelete.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-semibold text-gray-800">{prettyLabel(expenseToDelete.category)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-semibold text-gray-800">{formatDate(expenseToDelete.createdAt)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setDeleteDialogVisible(false);
                setExpenseToDelete(null);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              outlined
              disabled={deleting}
            />
            <Button
              label={deleting ? 'Deleting...' : 'Delete'}
              loading={deleting}
              onClick={handleDeleteExpense}
              className="bg-red-600 hover:bg-red-700 border-0 text-white px-6 py-2"
              severity="danger"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ExpenseManagement;