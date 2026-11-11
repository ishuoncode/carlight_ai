'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];

const TOOLTIP_STYLE = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#f3f4f6'
};

const Analytics = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toast = React.useRef(null);
  const [outlets, setOutlets] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedOutlet, setSelectedOutlet] = useState('');

  // Data states
  const [bills, setBills] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [expensePieData, setExpensePieData] = useState([]);
  const [allYearsData, setAllYearsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: current - 2022 + 2 }, (_, i) => 2022 + i).reverse();
  }, []);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

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

  // Bills for the selected year (revenue, payments, packages, customers, car types)
  const fetchBills = async () => {
    try {
      let url = `${API_BASE_URL}/api/bills/yearly?year=${selectedYear}`;
      if (selectedOutlet) url += `&outletId=${selectedOutlet}`;
      const response = await fetch(url, { headers: authHeaders() });
      if (response.ok) {
        setBills(await response.json());
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  // All expenses — filtered by year/outlet on the client for monthly comparison
  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`, { headers: authHeaders() });
      if (response.ok) {
        setAllExpenses(await response.json());
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  // Expense category breakdown for the pie chart
  const fetchExpensePie = async () => {
    try {
      let url = `${API_BASE_URL}/api/expenses/pie/yearly?year=${selectedYear}`;
      if (selectedOutlet) url += `&outletId=${selectedOutlet}`;
      const response = await fetch(url, { headers: authHeaders() });
      if (response.ok) {
        setExpensePieData(await response.json());
      }
    } catch (error) {
      console.error('Error fetching expense pie:', error);
    }
  };

  // Cars serviced across all years
  const fetchAllYears = async () => {
    try {
      let url = `${API_BASE_URL}/api/reports/cars-serviced/all-years`;
      if (selectedOutlet) url += `?outletId=${selectedOutlet}`;
      const response = await fetch(url, { headers: authHeaders() });
      if (response.ok) {
        setAllYearsData(await response.json());
      }
    } catch (error) {
      console.error('Error fetching all-years data:', error);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBills(), fetchExpenses(), fetchExpensePie(), fetchAllYears()]);
      setLoading(false);
    };
    load();
  }, [selectedYear, selectedOutlet]);

  // ---------- Derived analytics (all computed from fetched data) ----------

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  // Compact labels for chart axes: ₹1.2L, ₹45k ...
  const fmtCompact = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
    return `₹${Math.round(v)}`;
  };

  const filteredExpenses = useMemo(() =>
    allExpenses.filter(e => {
      const d = new Date(e.createdAt);
      if (d.getFullYear() !== selectedYear) return false;
      if (selectedOutlet && (e.outlet?.id ?? e.outletId) !== Number(selectedOutlet)) return false;
      return true;
    }), [allExpenses, selectedYear, selectedOutlet]);

  const totalBill = useMemo(() =>
    bills.reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0), [bills]);

  const totalDiscount = useMemo(() =>
    bills.reduce((s, b) => s + (parseFloat(b.discount) || 0), 0), [bills]);

  const totalExpense = useMemo(() =>
    filteredExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0), [filteredExpenses]);

  const totalProfit = totalBill - totalExpense;
  const profitMargin = totalBill > 0 ? (totalProfit / totalBill) * 100 : 0;
  const avgBill = bills.length ? totalBill / bills.length : 0;

  // Monthly revenue / expenses / car count
  const monthlyData = useMemo(() => {
    const rev = Array(12).fill(0);
    const exp = Array(12).fill(0);
    const cars = Array(12).fill(0);
    bills.forEach(b => {
      const d = new Date(b.createdAt);
      if (d.getFullYear() !== selectedYear) return;
      rev[d.getMonth()] += parseFloat(b.totalAmount) || 0;
      cars[d.getMonth()] += 1;
    });
    filteredExpenses.forEach(e => {
      const d = new Date(e.createdAt);
      exp[d.getMonth()] += parseFloat(e.amount) || 0;
    });
    return MONTHS.map((m, i) => ({ month: m, revenue: rev[i], expenses: exp[i], cars: cars[i] }));
  }, [bills, filteredExpenses, selectedYear]);

  const bestMonth = useMemo(() =>
    [...monthlyData].sort((a, b) => b.revenue - a.revenue)[0], [monthlyData]);

  // Payment method split (bill counts)
  const paymentData = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      const pm = (b.paymentMethod || 'OTHER').replace(/_/g, ' ');
      map[pm] = (map[pm] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [bills]);

  // Revenue by outlet
  const outletRevenue = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      const o = b.outletName || 'Unknown';
      map[o] = (map[o] || 0) + (parseFloat(b.totalAmount) || 0);
    });
    return Object.entries(map).map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [bills]);

  // Top packages by visits
  const packageData = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      const p = b.packageName || 'Other';
      if (!map[p]) map[p] = { name: p, visits: 0, revenue: 0 };
      map[p].visits += 1;
      map[p].revenue += parseFloat(b.totalAmount) || 0;
    });
    return Object.values(map).sort((a, b) => b.visits - a.visits).slice(0, 6);
  }, [bills]);

  // Top customers by spend
  const customerSpendAll = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      const key = b.customerName || b.phoneNumber || 'Unknown';
      map[key] = (map[key] || 0) + (parseFloat(b.totalAmount) || 0);
    });
    return Object.entries(map).map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [bills]);

  const topCustomers = customerSpendAll.slice(0, 8);

  // Car type distribution
  const carTypeData = useMemo(() => {
    const map = {};
    bills.forEach(b => {
      const ct = (b.carType || 'UNKNOWN').replace(/_/g, ' ');
      map[ct] = (map[ct] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [bills]);

  const expenseBreakdown = useMemo(() =>
    expensePieData
      .map(item => ({ name: (item.category || 'OTHER').replace(/_/g, ' '), value: parseFloat(item.total) || 0 }))
      .filter(i => i.value > 0)
      .sort((a, b) => b.value - a.value), [expensePieData]);

  // Reusable chart card wrapper
  const ChartCard = ({ title, icon, children, className = '', height = 320 }) => (
    <div className={`bg-gray-800 rounded-lg p-4 sm:p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-100 flex items-center gap-2">
        <i className={`pi ${icon} text-purple-400`}></i>
        {title}
      </h3>
      <div style={{ width: '100%', height }}>
        {children}
      </div>
    </div>
  );

  const renderPie = (data, dataKey = 'value') => (
    data.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="75%"
            paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#f3f4f6' }} />
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex items-center justify-center text-gray-400 h-full">No data available</div>
    )
  );

  // ✅ Multi-sheet Excel report of everything on this page
  const exportReport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Monthly summary
    const monthly = monthlyData.map(m => ({
      Month: m.month,
      'Revenue (INR)': Number(m.revenue.toFixed(2)),
      'Expenses (INR)': Number(m.expenses.toFixed(2)),
      'Profit (INR)': Number((m.revenue - m.expenses).toFixed(2)),
      'Cars Serviced': m.cars
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthly), 'Monthly Summary');

    // Sheet 2: Expense breakdown
    const expSheet = expenseBreakdown.map(e => ({ Category: e.name, 'Amount (INR)': e.value }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expSheet), 'Expense Breakdown');

    // Sheet 3: Payment methods
    const paySheet = paymentData.map(p => ({ 'Payment Method': p.name, Bills: p.value }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paySheet), 'Payment Methods');

    // Sheet 4: Revenue by outlet
    const outletSheet = outletRevenue.map(o => ({ Outlet: o.name, 'Revenue (INR)': o.total }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(outletSheet), 'Revenue by Outlet');

    // Sheet 5: Package popularity
    const pkgSheet = packageData.map(p => ({
      Package: p.name, Visits: p.visits, 'Revenue (INR)': Number(p.revenue.toFixed(2))
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pkgSheet), 'Wash Packages');

    // Sheet 6: All customers by spend
    const custSheet = customerSpendAll.map((c, i) => ({
      Rank: i + 1, Customer: c.name, 'Total Spend (INR)': c.total
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(custSheet), 'Customers');

    // Sheet 7: Yearly cars serviced
    const yearSheet = allYearsData.map(a => ({ Year: a.year, 'Cars Serviced': a.totalCars }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(yearSheet), 'Yearly Cars');

    XLSX.writeFile(wb, `CarLight_Analytics_${selectedYear}.xlsx`);

    toast.current?.show({
      severity: 'success',
      summary: 'Report Exported',
      detail: `7-sheet analytics report for ${selectedYear} downloaded`,
      life: 3000
    });
  };

  // ---------- Render ----------

  return (
    <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100%' }}>
      <Toast ref={toast} />
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <i className="pi pi-chart-line text-purple-400"></i>
          Business Analytics
        </h2>
        <p className="text-gray-400 mt-2">
          Revenue, expenses, customers and performance insights for {selectedYear}
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-800 rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
          <Dropdown
            value={selectedYear}
            options={years}
            onChange={(e) => setSelectedYear(e.value)}
            className="w-full border border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Outlet</label>
          <Dropdown
            value={selectedOutlet}
            options={outlets}
            onChange={(e) => setSelectedOutlet(e.value)}
            className="w-full border border-gray-600"
            showClear
            placeholder="All Outlets"
          />
        </div>
        <div className="flex items-end">
          <Button
            icon="pi pi-file-excel"
            label="Export Report"
            onClick={exportReport}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 border-0 text-white mr-2"
            tooltip="Download full 7-sheet analytics report"
            tooltipOptions={{ position: 'top' }}
          />
          <Button
            icon="pi pi-refresh"
            label={loading ? 'Loading...' : 'Refresh'}
            onClick={() => {
              setLoading(true);
              Promise.all([fetchBills(), fetchExpenses(), fetchExpensePie(), fetchAllYears()])
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 border-0 text-white"
          />
        </div>
      </div>

      {/* KPI Cards — row of 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-800 rounded-xl p-5 border-l-4 border-green-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold text-green-400">{formatCurrency(totalBill)}</h3>
              <p className="text-xs text-gray-500 mt-1">{bills.length} bills</p>
            </div>
            <i className="pi pi-money-bill text-3xl text-green-500 opacity-60"></i>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border-l-4 border-red-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
              <h3 className="text-2xl font-bold text-red-400">{formatCurrency(totalExpense)}</h3>
              <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} entries</p>
            </div>
            <i className="pi pi-wallet text-3xl text-red-500 opacity-60"></i>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border-l-4 border-blue-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Net Profit</p>
              <h3 className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatCurrency(totalProfit)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Margin: {profitMargin.toFixed(1)}%</p>
            </div>
            <i className="pi pi-chart-line text-3xl text-blue-500 opacity-60"></i>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border-l-4 border-purple-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Cars Serviced</p>
              <h3 className="text-2xl font-bold text-purple-400">{bills.length}</h3>
              <p className="text-xs text-gray-500 mt-1">Avg bill: {formatCurrency(avgBill)}</p>
            </div>
            <i className="pi pi-car text-3xl text-purple-500 opacity-60"></i>
          </div>
        </div>
      </div>

      {/* Insight strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-md flex items-center gap-3">
          <i className="pi pi-star text-2xl opacity-70"></i>
          <div>
            <p className="text-xs text-indigo-100">Best Month (Revenue)</p>
            <p className="font-bold">{bestMonth?.month} — {formatCurrency(bestMonth?.revenue || 0)}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white shadow-md flex items-center gap-3">
          <i className="pi pi-tags text-2xl opacity-70"></i>
          <div>
            <p className="text-xs text-emerald-100">Discounts Given</p>
            <p className="font-bold">{formatCurrency(totalDiscount)}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-4 text-white shadow-md flex items-center gap-3">
          <i className="pi pi-users text-2xl opacity-70"></i>
          <div>
            <p className="text-xs text-orange-100">Unique Customers</p>
            <p className="font-bold">{new Set(bills.map(b => b.phoneNumber).filter(Boolean)).size}</p>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue vs Expenses by month — full width */}
        <ChartCard title={`Revenue vs Expenses — ${selectedYear}`} icon="pi-chart-bar" className="lg:col-span-2" height={380}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={fmtCompact} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#f3f4f6' }}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={28} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={28} />
              <Line type="monotone" dataKey="revenue" name="Revenue Trend" stroke="#4ade80" strokeWidth={2} dot={false} legendType="none" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Expense breakdown donut */}
        <ChartCard title="Expense Breakdown by Category" icon="pi-wallet">
          {renderPie(expenseBreakdown)}
        </ChartCard>

        {/* Payment methods donut */}
        <ChartCard title="Payment Methods" icon="pi-credit-card">
          {renderPie(paymentData)}
        </ChartCard>

        {/* Expense category list with amounts */}
        <ChartCard title="Expense Categories Detail" icon="pi-list" height={300}>
          {expenseBreakdown.length > 0 ? (
            <div className="space-y-3 overflow-y-auto h-full pr-1">
              {expenseBreakdown.map((item, i) => {
                const pct = totalExpense > 0 ? ((item.value / expenseBreakdown.reduce((s, x) => s + x.value, 0)) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-gray-100 font-semibold">{formatCurrency(item.value)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center text-gray-400 h-full">No expenses recorded</div>
          )}
        </ChartCard>

        {/* Revenue by outlet — horizontal bars */}
        <ChartCard title="Revenue by Outlet" icon="pi-building">
          {outletRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outletRevenue} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tickFormatter={fmtCompact} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" width={110} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="total" name="Revenue" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center text-gray-400 h-full">No data available</div>
          )}
        </ChartCard>

        {/* Top packages — horizontal bars */}
        <ChartCard title="Most Popular Wash Packages" icon="pi-box">
          {packageData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" width={110} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value, name) => name === 'visits' ? [value, 'Visits'] : [formatCurrency(value), 'Revenue']}
                />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                <Bar dataKey="visits" name="Visits" fill="#a78bfa" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center text-gray-400 h-full">No data available</div>
          )}
        </ChartCard>

        {/* Top customers — horizontal bars, full width */}
        <ChartCard title={`Top Customers by Spend — ${selectedYear}`} icon="pi-users" className="lg:col-span-2">
          {topCustomers.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tickFormatter={fmtCompact} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" width={140} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value) => [formatCurrency(value), 'Total Spend']}
                />
                <Bar dataKey="total" name="Total Spend" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center text-gray-400 h-full">No data available</div>
          )}
        </ChartCard>

        {/* Car type distribution */}
        <ChartCard title="Car Type Distribution" icon="pi-car">
          {renderPie(carTypeData)}
        </ChartCard>

        {/* Cars serviced monthly — area chart */}
        <ChartCard title={`Cars Serviced Monthly — ${selectedYear}`} icon="pi-car">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="carsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#f3f4f6' }} />
              <Area type="monotone" dataKey="cars" name="Cars Serviced" stroke="#a78bfa" strokeWidth={2} fill="url(#carsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* All years growth — full width line chart */}
        <ChartCard title="Cars Serviced — Year over Year Growth" icon="pi-chart-line" className="lg:col-span-2" height={340}>
          {allYearsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={allYearsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#f3f4f6' }} />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                <Line
                  type="monotone"
                  dataKey="totalCars"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  name="Total Cars Serviced"
                  dot={{ fill: '#60a5fa', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center text-gray-400 h-full">No data available</div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
