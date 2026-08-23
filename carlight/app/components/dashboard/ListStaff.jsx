'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { FilterMatchMode } from 'primereact/api';
import toast from 'react-hot-toast';

export default function ListStaff({ outlets }) {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [activeFilter, setActiveFilter] = useState(true);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Edit Staff Dialog
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: '',
    role: '',
    outletId: null
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Password Dialog
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: ''
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Delete Dialog
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    let filtered = staff;

    // Filter by outlet
    if (selectedOutlet !== null && selectedOutlet !== undefined && selectedOutlet !== '') {
      filtered = filtered.filter(s => s.outletId === selectedOutlet);
    }

    // Filter by active status
    if (activeFilter !== null && activeFilter !== undefined) {
      filtered = filtered.filter(s => s.active === activeFilter);
    }

    setFilteredStaff(filtered);
  }, [selectedOutlet, activeFilter, staff]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/staff`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data);
        setFilteredStaff(data);
      } else {
        toast.error('Failed to fetch staff');
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      toast.error('Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const openEditDialog = (staffMember) => {
    setSelectedStaff(staffMember);
    setEditForm({
      name: staffMember.name,
      phoneNumber: staffMember.phoneNumber,
      role: staffMember.role,
      outletId: staffMember.outletId
    });
    setEditDialogVisible(true);
  };

  const openPasswordDialog = (staffMember) => {
    setSelectedStaff(staffMember);
    setPasswordForm({ newPassword: '' });
    setPasswordDialogVisible(true);
  };

  const handleEditSubmit = async () => {
    setEditSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast.success('Staff updated successfully!');
        setEditDialogVisible(false);
        fetchStaff();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update staff');
      }
    } catch (err) {
      console.error('Error updating staff:', err);
      toast.error('Error updating staff');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/staff/${selectedStaff.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordForm)
      });

      if (response.ok) {
        toast.success('Password updated successfully!');
        setPasswordDialogVisible(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      toast.error('Error updating password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const openDeleteDialog = (staffMember) => {
    setStaffToDelete(staffMember);
    setDeleteDialogVisible(true);
  };

  const handleDeleteSubmit = async () => {
    setDeleteSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/staff/${staffToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Staff deleted successfully!');
        setDeleteDialogVisible(false);
        fetchStaff();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete staff');
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
      toast.error('Error deleting staff');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const getOutletName = (outletId) => {
    const outlet = outlets.find(o => o.value === outletId);
    return outlet ? outlet.label : 'N/A';
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => openEditDialog(rowData)}
          tooltip="Edit Staff"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-key"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => openPasswordDialog(rowData)}
          tooltip="Change Password"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => openDeleteDialog(rowData)}
          tooltip="Delete Staff"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const outletBodyTemplate = (rowData) => {
    return getOutletName(rowData.outletId);
  };

  const activeBodyTemplate = (rowData) => {
    return (
      <span className={`px-3 py-1 rounded-full text-white font-semibold text-xs ${
        rowData.active ? 'bg-green-600' : 'bg-red-600'
      }`}>
        {rowData.active ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const renderHeader = () => {
    const statusOptions = [
      { label: 'Active', value: true },
      { label: 'Inactive', value: false }
    ];

    return (
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl font-bold">Staff Members</h2>
        <div className="flex gap-3 items-center">
          <Dropdown
            value={activeFilter}
            options={statusOptions}
            onChange={(e) => setActiveFilter(e.value)}
            placeholder="Filter by Status"
            className="w-40"
            showClear
          />
          <Dropdown
            value={selectedOutlet}
            options={outlets}
            onChange={(e) => setSelectedOutlet(e.value)}
            placeholder="Filter by Outlet"
            className="w-48"
            showClear
          />
          <span className="p-input-icon-left">
            <i className="pi pi-search" style={{ left: '0.75rem' }} />
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Search staff..."
              className="p-inputtext-sm pl-10 pr-4 py-2 border border-gray-300"
            />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i className="pi pi-users text-purple-600"></i>
          Staff Management
        </h1>
        <p className="text-gray-600 mt-2">View and manage your staff members</p>
      </div>

      <Card>
        <DataTable
          value={filteredStaff}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          globalFilterFields={['name', 'phoneNumber', 'role']}
          header={renderHeader()}
          emptyMessage="No staff found"
          className="p-datatable-sm"
          stripedRows
        >
          <Column field="id" header="ID" sortable style={{ width: '5%' }}></Column>
          <Column 
            field="name" 
            header="Name" 
            sortable 
            style={{ width: '20%' }}
            body={(rowData) => (
              <span className="block truncate" title={rowData.name}>
                {rowData.name}
              </span>
            )}
          ></Column>
          <Column field="phoneNumber" header="Phone Number" sortable style={{ width: '15%' }}></Column>
          <Column field="role" header="Role" sortable style={{ width: '12%' }}></Column>
          <Column field="outletId" header="Outlet" body={outletBodyTemplate} sortable style={{ width: '15%' }}></Column>
          <Column field="active" header="Status" body={activeBodyTemplate} sortable style={{ width: '10%' }}></Column>
          <Column header="Actions" body={actionBodyTemplate} style={{ width: '18%' }}></Column>
        </DataTable>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <i className="pi pi-pencil text-blue-600"></i>
            <span className="font-bold text-lg">Edit Staff Member</span>
          </div>
        }
        visible={editDialogVisible}
        style={{ width: '550px' }}
        onHide={() => setEditDialogVisible(false)}
        modal
        className="p-dialog-custom"
        footer={
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setEditDialogVisible(false)} 
              className="p-button-text p-button-secondary" 
            />
            <Button 
              label="Save Changes" 
              icon="pi pi-check" 
              onClick={handleEditSubmit} 
              loading={editSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4" 
            />
          </div>
        }
      >
        <div className="space-y-5 pt-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-user text-gray-500 mr-2"></i>
              Full Name
            </label>
            <InputText
              id="edit-name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ cursor: 'text !important', caretColor: '#000' }}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="edit-phone" className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-phone text-gray-500 mr-2"></i>
              Phone Number
            </label>
            <InputText
              id="edit-phone"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={10}
              style={{ cursor: 'text !important', caretColor: '#000' }}
              autoComplete="off"
              placeholder="Enter 10-digit phone number"
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800">
              <i className="pi pi-info-circle mr-2"></i>
              <strong>Staff ID:</strong> {selectedStaff?.id}
            </p>
          </div>
        </div>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <i className="pi pi-key text-orange-600"></i>
            <span className="font-bold text-lg">Change Password</span>
          </div>
        }
        visible={passwordDialogVisible}
        style={{ width: '480px' }}
        onHide={() => setPasswordDialogVisible(false)}
        modal
        className="p-dialog-custom"
        footer={
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setPasswordDialogVisible(false)} 
              className="p-button-text p-button-secondary" 
            />
            <Button 
              label="Update Password" 
              icon="pi pi-check" 
              onClick={handlePasswordSubmit} 
              loading={passwordSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4" 
            />
          </div>
        }
      >
        <div className="space-y-5 pt-4">
          <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
            <p className="text-sm text-orange-900">
              <i className="pi pi-user text-orange-600 mr-2"></i>
              Changing password for: <strong className="text-orange-800">{selectedStaff?.name}</strong>
            </p>
            <p className="text-xs text-orange-700 mt-1">
              <i className="pi pi-id-card text-orange-600 mr-2"></i>
              Staff ID: {selectedStaff?.id}
            </p>
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-lock text-gray-500 mr-2"></i>
              New Password
            </label>
            <Password
              id="new-password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
              className="w-full"
              inputClassName="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              inputStyle={{ cursor: 'text !important', caretColor: '#000' }}
              toggleMask
              feedback={false}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </div>
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <i className="pi pi-exclamation-triangle text-yellow-600 mr-2"></i>
              The staff member will need to use this new password for their next login.
            </p>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <i className="pi pi-exclamation-triangle text-red-600"></i>
            <span className="font-bold text-lg">Confirm Delete</span>
          </div>
        }
        visible={deleteDialogVisible}
        style={{ width: '450px' }}
        onHide={() => setDeleteDialogVisible(false)}
        modal
        footer={
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setDeleteDialogVisible(false)} 
              className="p-button-text p-button-secondary" 
            />
            <Button 
              label="Delete" 
              icon="pi pi-trash" 
              onClick={handleDeleteSubmit} 
              loading={deleteSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-4" 
            />
          </div>
        }
      >
        <div className="space-y-4 pt-4">
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <p className="text-red-900 font-semibold mb-2">
              <i className="pi pi-exclamation-circle text-red-600 mr-2"></i>
              Are you sure you want to delete this staff member?
            </p>
            <div className="mt-3 space-y-1 text-sm text-red-800">
              <p><strong>Name:</strong> {staffToDelete?.name}</p>
              <p><strong>Phone:</strong> {staffToDelete?.phoneNumber}</p>
              <p><strong>Role:</strong> {staffToDelete?.role}</p>
              <p><strong>Outlet:</strong> {getOutletName(staffToDelete?.outletId)}</p>
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <i className="pi pi-info-circle text-yellow-600 mr-2"></i>
              <strong>Warning:</strong> This action cannot be undone. All data associated with this staff member will be permanently deleted.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
