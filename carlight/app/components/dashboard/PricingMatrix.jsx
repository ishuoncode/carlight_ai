'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import toast from 'react-hot-toast';

const PricingMatrix = ({ onBack }) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [outlets, setOutlets] = useState([]);
  const [washPackages, setWashPackages] = useState([]);
  const [rows, setRows] = useState([]);          // all outlet-package rows
  const [carTypes, setCarTypes] = useState([]);
  // ✅ start as loading so the first paint never differs from server-rendered HTML
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [editing, setEditing] = useState(null);  // { key, outletId, pkgId, carType, value, isNew }
  const [togglingPkg, setTogglingPkg] = useState(null);

  // ✅ Add-pricing dialog (opened from empty cells or the header button)
  const [addDlgOpen, setAddDlgOpen] = useState(false);
  const [addDlgOutlet, setAddDlgOutlet] = useState(null);
  const [addDlgPkg, setAddDlgPkg] = useState(null);
  const [addDlgPrices, setAddDlgPrices] = useState([]);
  const [addDlgType, setAddDlgType] = useState(null);
  const [addDlgPrice, setAddDlgPrice] = useState(0);
  const [addingPricing, setAddingPricing] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [enumsRes, outletsRes, wpRes, opRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/meta/enums`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/outlets`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/wash-packages`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/outlet-packages`, { headers: authHeaders() })
      ]);

      if (enumsRes.ok) {
        const data = await enumsRes.json();
        setCarTypes((data.carTypes || []).map(type => ({
          label: String(type).toLowerCase().replace('_', ' '),
          value: type
        })));
      }
      if (outletsRes.ok) setOutlets(await outletsRes.json());
      if (wpRes.ok) setWashPackages(await wpRes.json());
      if (opRes.ok) setRows(await opRes.json());
    } catch (err) {
      console.error('Error loading pricing matrix:', err);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // lookup: "pkgId|outletId|carType" -> row
  const rowMap = useMemo(() => {
    const map = {};
    rows.forEach(r => {
      map[`${r.washPackageId}|${r.outletId}|${r.carType}`] = r;
    });
    return map;
  }, [rows]);

  const startEdit = (pkgId, outlet, carType) => {
    const existing = rowMap[`${pkgId}|${outlet.id}|${carType}`];
    setEditing({
      key: `${pkgId}-${outlet.id}-${carType}`,
      pkgId,
      outletId: outlet.id,
      carType,
      value: existing ? existing.price : null,
      isNew: !existing
    });
  };

  const saveCell = async () => {
    if (!editing || editing.value == null || editing.value <= 0) {
      toast.error('Enter a price greater than 0');
      return;
    }
    const key = editing.key;
    setSavingKey(key);
    try {
      let response;
      if (editing.isNew) {
        response = await fetch(
          `${API_BASE_URL}/api/admin/outlet-packages/outlets/${editing.outletId}/wash-packages/${editing.pkgId}/pricing`,
          { method: 'POST', headers: authHeaders(), body: JSON.stringify({ active: true, prices: [{ carType: editing.carType, price: editing.value }] }) }
        );
      } else {
        const existing = rowMap[`${editing.pkgId}|${editing.outletId}|${editing.carType}`];
        response = await fetch(
          `${API_BASE_URL}/api/admin/outlet-packages/${existing.id}/price`,
          { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ price: editing.value }) }
        );
      }

      if (response.ok) {
        toast.success(editing.isNew ? 'Pricing added ✓' : 'Price updated ✓');
        setEditing(null);
        await loadAll();
      } else {
        let detail = 'Save failed';
        try {
          const err = await response.json();
          if (err.message) detail = err.message;
        } catch (_) {}
        toast.error(detail);
      }
    } catch (err) {
      console.error('Error saving price:', err);
      toast.error('Error saving price');
    } finally {
      setSavingKey(null);
    }
  };

  const toggleCell = async (row) => {
    const key = `toggle-${row.id}`;
    setSavingKey(key);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/outlet-packages/${row.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ active: !row.active })
      });
      if (response.ok) {
        toast.success(`Pricing ${row.active ? 'disabled' : 'enabled'} for ${row.carNo || row.carType}`);
        await loadAll();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Error updating status');
    } finally {
      setSavingKey(null);
    }
  };

  const togglePackage = async (pkg) => {
    setTogglingPkg(pkg.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/wash-packages/${pkg.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: pkg.name,
          description: pkg.description,
          active: !pkg.active
        })
      });
      if (response.ok) {
        toast.success(`Wash package "${pkg.name}" ${pkg.active ? 'deactivated' : 'activated'}`);
        await loadAll();
      } else {
        toast.error('Failed to update wash package');
      }
    } catch (err) {
      console.error('Error toggling package:', err);
      toast.error('Error updating wash package');
    } finally {
      setTogglingPkg(null);
    }
  };

  // ---------- Add-pricing dialog (works from matrix cells & header button) ----------
  const openAddDlg = (pkgId, outletId) => {
    setAddDlgPkg(pkgId || null);
    setAddDlgOutlet(outletId || null);
    setAddDlgPrices([]);
    setAddDlgType(null);
    setAddDlgPrice(0);
    setAddDlgOpen(true);
  };

  const addPriceRowToDlg = () => {
    if (!addDlgType) { toast.error('Please select a car type'); return; }
    if (!addDlgPrice || addDlgPrice <= 0) { toast.error('Enter a price greater than 0'); return; }
    if (addDlgPrices.some(p => p.carType === addDlgType)) {
      toast.error('That car type is already in the list');
      return;
    }
    setAddDlgPrices(prev => [...prev, { carType: addDlgType, price: Number(addDlgPrice) }]);
    setAddDlgType(null);
    setAddDlgPrice(0);
  };

  const removePriceRowFromDlg = (carType) => {
    setAddDlgPrices(prev => prev.filter(p => p.carType !== carType));
  };

  const submitAddDlg = async () => {
    if (!addDlgOutlet || !addDlgPkg) { toast.error('Select outlet and wash package first'); return; }
    if (addDlgPrices.length === 0) { toast.error('Add at least one car type price'); return; }

    setAddingPricing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/outlet-packages/outlets/${addDlgOutlet}/wash-packages/${addDlgPkg}/pricing`,
        { method: 'POST', headers: authHeaders(), body: JSON.stringify({ active: true, prices: addDlgPrices }) }
      );
      if (response.ok) {
        toast.success(`${addDlgPrices.length} price(s) saved ✓`);
        setAddDlgOpen(false);
        await loadAll();
      } else {
        let detail = 'Failed to save pricing';
        try {
          const err = await response.json();
          if (err.message) detail = err.message;
        } catch (_) {}
        toast.error(detail);
      }
    } catch (err) {
      console.error('Error saving pricing:', err);
      toast.error('Error saving pricing');
    } finally {
      setAddingPricing(false);
    }
  };

  // ---------- Render ----------

  const renderCell = (pkg, outlet, carType) => {
    const key = `${pkg.id}-${outlet.id}-${carType}`;
    const row = rowMap[`${pkg.id}|${outlet.id}|${carType}`];
    const isEditing = editing && editing.key === key;

    if (isEditing) {
      return (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <span className="text-gray-500 font-bold">₹</span>
          <input
            type="number"
            min="1"
            step="1"
            autoFocus
            placeholder="Price"
            value={editing.value ?? ''}
            onChange={(e) => setEditing({ ...editing, value: e.target.value === '' ? null : Number(e.target.value) })}
            onKeyDown={(e) => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') setEditing(null); }}
            className="w-24 px-2 py-1 border-2 border-blue-500 rounded-md text-right text-sm font-semibold focus:outline-none"
          />
          <button
            type="button"
            onClick={saveCell}
            disabled={savingKey === key}
            title="Save price"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <i className={`pi ${savingKey === key ? 'pi-spin pi-spinner' : 'pi-check'} text-xs`}></i>
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
            title="Cancel"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          >
            <i className="pi pi-times text-xs"></i>
          </button>
        </div>
      );
    }

    if (row) {
      return (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => startEdit(pkg, outlet, carType)}
            className={`font-semibold hover:underline underline-offset-2 ${row.active ? 'text-gray-800 hover:text-blue-600' : 'text-gray-400 line-through decoration-red-400'}`}
            title={row.active ? 'Click to edit price' : 'Pricing is disabled — click to edit'}
          >
            ₹{Number(row.price).toLocaleString('en-IN')}
          </button>
          <InputSwitch
            checked={row.active}
            onChange={() => toggleCell(row)}
            className="scale-75"
            tooltip={row.active ? 'Disable this pricing' : 'Enable this pricing'}
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      );
    }

    // No pricing row for this combination yet — opens the Add Pricing dialog pre-filled
    if (!row) {
      return (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => openAddDlg(pkg.id, outlet.id)}
            title={`Add ${pkg.name} pricing for ${outlet.name} — ${carType.replace('_', ' ')}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 hover:border-green-400 transition-colors cursor-pointer"
          >
            <i className="pi pi-plus text-[10px]"></i>
            Add Price
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-gray-300">—</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
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
              <i className="pi pi-th-large text-blue-600"></i>
              Service Pricing Matrix
            </h1>
            <p className="text-gray-600 mt-2">
              Manage wash packages and their pricing at every outlet — all in one place
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              label="Add Pricing"
              icon="pi pi-plus"
              onClick={() => openAddDlg(null, null)}
              className="bg-green-600 hover:bg-green-700 border-0 text-white px-4 py-2"
            />
            <Button icon="pi pi-refresh" label="Refresh" onClick={loadAll} loading={loading} outlined className="px-4 py-2" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-600">
        <span className="flex items-center gap-1"><i className="pi pi-pencil text-blue-600"></i> Click a price to edit</span>
        <span className="flex items-center gap-1"><i className="pi pi-plus text-green-600"></i> Add missing pricing</span>
        <span className="flex items-center gap-1"><InputSwitch checked readOnly className="scale-[0.6]" /> Enabled</span>
        <span>Switch off to disable a pricing row</span>
        <span className="flex items-center gap-1 text-purple-700 font-medium"><i className="pi pi-info-circle"></i> To add many prices at once, switch to List View → “Add Pricing”</span>
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-500">
          <i className="pi pi-spin pi-spinner text-2xl"></i>
          <p className="mt-2">Loading pricing matrix…</p>
        </div>
      )}

      {/* One matrix per wash package */}
      {!loading && (
        <div className="space-y-8">
          {washPackages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              {/* Package header — manage the package itself here too */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2.5 rounded-lg">
                    <i className="pi pi-box text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 capitalize">{pkg.name}</h3>
                    <p className="text-xs text-gray-500">{pkg.description || 'No description'}</p>
                  </div>
                  <Tag value={pkg.active ? 'Active' : 'Inactive'} severity={pkg.active ? 'success' : 'danger'} className="ml-2" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Package:</span>
                  <InputSwitch
                    checked={pkg.active}
                    loading={togglingPkg === pkg.id}
                    onChange={() => togglePackage(pkg)}
                    tooltip={`${pkg.active ? 'Deactivate' : 'Activate'} this wash package`}
                    tooltipOptions={{ position: 'left' }}
                  />
                </div>
              </div>

              {/* Matrix table: rows = car types, columns = outlets */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wide">
                      <th className="text-left px-5 py-3 font-semibold">Car Type</th>
                      {outlets.map(o => (
                        <th key={o.id} className="text-center px-5 py-3 font-semibold">{o.name}</th>
                      ))}
                      {outlets.length === 0 && <th className="text-center px-5 py-3 text-gray-400">No outlets yet</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {carTypes.map(ct => {
                      const hasAny = outlets.some(o => rowMap[`${pkg.id}|${o.id}|${ct.value}`]);
                      return (
                        <tr key={ct.value} className="border-t border-gray-100 hover:bg-blue-50/40 transition-colors">
                          <td className="px-5 py-2.5">
                            <span className={`font-medium capitalize ${hasAny ? 'text-gray-800' : 'text-gray-400'}`}>
                              {ct.label}
                            </span>
                          </td>
                          {outlets.map(o => (
                            <td key={o.id} className="px-5 py-2.5 text-center">
                              {renderCell(pkg, o, ct.value)}
                            </td>
                          ))}
                          {outlets.length === 0 && <td className="text-center text-gray-400">—</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {washPackages.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              <i className="pi pi-inbox text-4xl mb-2"></i>
              <p>No wash packages yet — create one in Wash Package Management first.</p>
            </div>
          )}
        </div>
      )}

      {/* ✅ Add Pricing Dialog (from matrix) */}
      <Dialog
        visible={addDlgOpen}
        onHide={() => setAddDlgOpen(false)}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="bg-green-100 p-3 rounded-full">
              <i className="pi pi-plus text-2xl text-green-600"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Add Outlet Pricing</h3>
              <p className="text-sm text-gray-500">Set prices per car type for a wash package</p>
            </div>
          </div>
        }
        style={{ width: '560px' }}
      >
        <div className="pt-4 space-y-5">
          {/* Outlet + Package */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Outlet <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={addDlgOutlet}
                options={outlets.map(o => ({ label: o.name, value: o.id }))}
                onChange={(e) => setAddDlgOutlet(e.value)}
                placeholder="Select outlet"
                className={`w-full ${!addDlgOutlet ? 'border border-gray-300' : ''}`}
                filter
              />
              {!addDlgOutlet && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>Outlet is required</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wash Package <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={addDlgPkg}
                options={washPackages.map(p => ({ label: p.name, value: p.id }))}
                onChange={(e) => setAddDlgPkg(e.value)}
                placeholder="Select package"
                className={`w-full ${!addDlgPkg ? 'border border-gray-300' : ''}`}
                filter
              />
              {!addDlgPkg && <p className="text-red-600 text-xs mt-1"><i className="pi pi-exclamation-circle mr-1"></i>Package is required</p>}
            </div>
          </div>

          {/* Price row builder */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-xl border border-green-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              <i className="pi pi-dollar text-yellow-600 mr-1"></i>Add car type with price
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Car Type</label>
                <Dropdown
                  value={addDlgType}
                  options={carTypes}
                  onChange={(e) => setAddDlgType(e.value)}
                  placeholder="Select type"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹)</label>
                <InputNumber
                  value={addDlgPrice}
                  onValueChange={(e) => setAddDlgPrice(e.value || 0)}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  min={0}
                  className="w-full"
                  inputClassName="py-2 w-full text-right"
                />
              </div>
              <Button
                label="Add to list"
                icon="pi pi-plus"
                onClick={addPriceRowToDlg}
                className="bg-blue-600 hover:bg-blue-700 border-0 text-white h-[38px]"
              />
            </div>

            {/* Added rows */}
            {addDlgPrices.length > 0 && (
              <div className="mt-4 space-y-2">
                {addDlgPrices.map((p, i) => {
                  const label = String(p.carType).toLowerCase().replace('_', ' ');
                  return (
                    <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <span className="text-sm font-medium capitalize text-gray-700">{label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-700">₹{Number(p.price).toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => removePriceRowFromDlg(p.carType)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 transition-colors"
                          title="Remove"
                        >
                          <i className="pi pi-times text-xs"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {addDlgOutlet && addDlgPkg && addDlgPrices.length > 0 && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg flex items-start gap-2">
              <i className="pi pi-check-circle text-green-600 mt-0.5"></i>
              <p className="text-sm text-green-700">
                Ready to save {addDlgPrices.length} price(s). Existing prices for this outlet &amp; package will be updated.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              label="Cancel"
              icon="pi pi-times"
              outlined
              disabled={addingPricing}
              onClick={() => setAddDlgOpen(false)}
              className="px-6 py-2"
            />
            <Button
              label={addingPricing ? 'Saving...' : 'Save Pricing'}
              icon="pi pi-check"
              loading={addingPricing}
              onClick={submitAddDlg}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 border-0 text-white"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PricingMatrix;
