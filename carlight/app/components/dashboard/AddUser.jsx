'use client';
import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import toast from 'react-hot-toast';

export default function AddUser({ outlets }) {
  const [userForm, setUserForm] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    role: 'CASHIER',
    outletId: null
  });
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    { label: 'Cashier', value: 'CASHIER' }
  ];

  const handleUserFormChange = (field, value) => {
    setUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Staff added successfully!');
        // Reset form
        setUserForm({
          name: '',
          phoneNumber: '',
          password: '',
          role: 'CASHIER',
          outletId: null
        });
      } else {
        const errorData = await response.json();
        // Display the specific error message from the API
        const errorMessage = errorData.message || errorData.error || 'Failed to add staff';
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Error adding user:', err);
      toast.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i className="pi pi-user-plus text-blue-600"></i>
          Add New Staff
        </h1>
        <p className="text-gray-600 mt-2">Create a new staff account for your team</p>
      </div>

      <Card className="shadow-lg">
        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="pi pi-user text-blue-600"></i>
                Full Name
              </label>
              <InputText
                id="name"
                value={userForm.name}
                onChange={(e) => handleUserFormChange('name', e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                required
                placeholder="e.g., John Doe"
              />
            </div>

            {/* Phone Number Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="phoneNumber" className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="pi pi-phone text-blue-600"></i>
                Phone Number
              </label>
              <InputText
                id="phoneNumber"
                value={userForm.phoneNumber}
                onChange={(e) => handleUserFormChange('phoneNumber', e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                required
                placeholder="10-digit mobile number"
                keyfilter="int"
                maxLength={10}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="pi pi-lock text-blue-600"></i>
                Password
              </label>
              <Password
                id="password"
                value={userForm.password}
                onChange={(e) => handleUserFormChange('password', e.target.value)}
                className="w-full"
                inputClassName="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                required
                placeholder="Create a secure password"
                toggleMask
                feedback={false}
              />
            </div>

            {/* Role Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="role" className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="pi pi-briefcase text-blue-600"></i>
                Role
              </label>
              <Dropdown
                id="role"
                value={userForm.role}
                options={roles}
                onChange={(e) => handleUserFormChange('role', e.value)}
                className="w-full border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                placeholder="Select user role"
              />
            </div>
          </div>

          {/* Outlet Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="outletId" className="font-semibold text-gray-700 flex items-center gap-2">
              <i className="pi pi-building text-blue-600"></i>
              Outlet
            </label>
            <Dropdown
              id="outletId"
              value={userForm.outletId}
              options={outlets}
              onChange={(e) => handleUserFormChange('outletId', e.value)}
              className="w-full md:w-1/2 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
              placeholder="Select outlet"
              required
              filter
              filterPlaceholder="Search outlet"
              emptyMessage="No outlets available"
            />
          </div>

          <Divider />

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              label="Cancel"
              icon="pi pi-times"
              className="p-button-outlined p-button-secondary"
              onClick={() => setUserForm({
                name: '',
                phoneNumber: '',
                password: '',
                role: 'CASHIER',
                outletId: null
              })}
            />
            <Button
              type="submit"
              label={submitting ? 'Creating...' : 'Create User'}
              icon={submitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
              className="p-button-primary px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              disabled={submitting}
              loading={submitting}
            />
          </div>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50 border-l-4 border-blue-600">
        <div className="flex gap-3">
          <i className="pi pi-info-circle text-blue-600 text-xl"></i>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Staff Account Information</h3>
            <p className="text-sm text-blue-700">
              The new staff member will receive their login credentials and can access the system immediately after creation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
