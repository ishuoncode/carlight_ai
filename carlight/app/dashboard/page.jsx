'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { PanelMenu } from 'primereact/panelmenu';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AddUser from '../components/dashboard/AddUser';
import AddOutlet from '../components/dashboard/AddOutlet';
import ListStaff from '../components/dashboard/ListStaff';
import WashPackage from '../components/dashboard/WashPackage';
import OutletPricing from '../components/dashboard/OutletPricing';
import Billing from '../components/dashboard/Billing';
import Extras from '../components/dashboard/Extras';
import Customer from '../components/dashboard/Customer';
import CustomerInsights from '../components/dashboard/CustomerInsights';
import CarFrequency from '../components/dashboard/CarFrequency';
import ExpenseManagement from '../components/dashboard/ExpenseManagement';
import Analytics from '../components/dashboard/Analytics';
import YourBilling from '../components/dashboard/YourBilling';
import CarOwner from '../components/dashboard/CarOwner';
import CouponManagement from '../components/dashboard/CouponManagement';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  // ✅ collapsible sidebar (desktop): open = full menu, closed = icon-only rail
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    }
  }, [collapsed]);
  const [activeTab, setActiveTab] = useState(() => {
    // Get saved tab from localStorage or default based on role
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activeTab');
      const storedUser = localStorage.getItem('user');
      const userRole = storedUser ? JSON.parse(storedUser).role : null;
      
      // For CASHIER, default to billing
      if (userRole === 'CASHIER') {
        return 'bills';
      }
      
      return savedTab || 'service';
    }
    return 'service';
  });
  const [outlets, setOutlets] = useState([]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Fetch outlets from API or localStorage
  useEffect(() => {
    const fetchOutlets = async () => {
      // Check if outlets are already in localStorage
      const cachedOutlets = localStorage.getItem('outlets');
      if (cachedOutlets) {
        const parsedOutlets = JSON.parse(cachedOutlets);
        setOutlets(parsedOutlets.map(outlet => ({
          label: outlet.name,
          value: outlet.id
        })));
        return;
      }

      // Fetch from API if not in localStorage
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/outlets`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Store in localStorage
          localStorage.setItem('outlets', JSON.stringify(data));
          // Set dropdown options
          setOutlets(data.map(outlet => ({
            label: outlet.name,
            value: outlet.id
          })));
        } else {
          toast.error('Failed to fetch outlets');
        }
      } catch (err) {
        console.error('Error fetching outlets:', err);
        toast.error('Error loading outlets');
      }
    };

    if (user) {
      fetchOutlets();
    }
  }, [user]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  const fetchOutletsData = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/outlets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('outlets', JSON.stringify(data));
      setOutlets(data.map(outlet => ({
        label: outlet.name,
        value: outlet.id
      })));
    }
  };

  const menuItems = [
    {
      label: 'Your Billing',
      icon: 'pi pi-receipt',
      command: () => setActiveTab('yourBilling'),
      className: activeTab === 'yourBilling' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role === 'CASHIER'
    },
    {
      label: 'Service',
      icon: 'pi pi-wrench',
      command: () => setActiveTab('service'),
      className: activeTab === 'service' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Add Staff',
      icon: 'pi pi-user-plus',
      command: () => setActiveTab('addUser'),
      className: activeTab === 'addUser' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'List Staff',
      icon: 'pi pi-users',
      command: () => setActiveTab('listStaff'),
      className: activeTab === 'listStaff' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Add Outlet',
      icon: 'pi pi-building',
      command: () => setActiveTab('addOutlet'),
      className: activeTab === 'addOutlet' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Billing',
      icon: 'pi pi-file',
      command: () => setActiveTab('bills'),
      className: activeTab === 'bills' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: true
    },
    {
      label: 'Analytics',
      icon: 'pi pi-chart-line',
      command: () => setActiveTab('analytics'),
      className: activeTab === 'analytics' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Extras',
      icon: 'pi pi-plus-circle',
      command: () => setActiveTab('extras'),
      className: activeTab === 'extras' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Bill History',
      icon: 'pi pi-history',
      command: () => setActiveTab('customer'),
      className: activeTab === 'customer' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Customer Insights',
      icon: 'pi pi-sparkles',
      command: () => setActiveTab('customerInsights'),
      className: activeTab === 'customerInsights' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Car Frequency',
      icon: 'pi pi-car',
      command: () => setActiveTab('carfrequency'),
      className: activeTab === 'carfrequency' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Car & Owner',
      icon: 'pi pi-id-card',
      command: () => setActiveTab('carowner'),
      className: activeTab === 'carowner' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: true   // staff can look up and correct owner details (same rights as admin here)
    },
    {
      label: 'Expense Management',
      icon: 'pi pi-money-bill',
      command: () => setActiveTab('expenses'),
      className: activeTab === 'expenses' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    },
    {
      label: 'Coupon Management',
      icon: 'pi pi-ticket',
      command: () => setActiveTab('coupons'),
      className: activeTab === 'coupons' ? 'bg-blue-100 border-l-4 border-blue-600' : '',
      visible: user?.role !== 'CASHIER'
    }
  ].filter(item => item.visible);

  const renderContent = () => {
    switch (activeTab) {
      case 'service':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <i className="pi pi-cog text-blue-600"></i>
                Service Management
              </h1>
              <p className="text-gray-600 mt-2">Manage wash packages and outlet pricing</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wash Package Card */}
              <div 
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setActiveTab('washPackage')}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-500 transition-all">
                    <i className="pi pi-box text-3xl text-blue-600 group-hover:text-white"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600">Wash Package</h2>
                    <p className="text-gray-500 text-sm">Manage wash packages</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  Create, edit, and manage different wash packages and services offered to customers.
                </p>
              </div>

              {/* Outlet Pricing Card */}
              <div 
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setActiveTab('outletPricing')}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-green-100 p-4 rounded-full group-hover:bg-green-500 transition-all">
                    <i className="pi pi-dollar text-3xl text-green-600 group-hover:text-white"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-green-600">Outlet Pricing</h2>
                    <p className="text-gray-500 text-sm">Manage outlet-specific pricing</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  Set and manage pricing for wash packages at different outlet locations.
                </p>
              </div>
            </div>
          </div>
        );
      case 'washPackage':
        return <WashPackage onBack={() => setActiveTab('service')} />;
      case 'outletPricing':
        return <OutletPricing onBack={() => setActiveTab('service')} />;
      case 'addUser':
        return <AddUser outlets={outlets} />;
      case 'listStaff':
        return <ListStaff outlets={outlets} />;
      case 'addOutlet':
        return <AddOutlet onOutletAdded={fetchOutletsData} />;
      case 'bills':
        return <Billing />;
      case 'analytics':
        return <Analytics />;
      case 'extras':
        return <Extras />;
      case 'customer':
        return <Customer />;
      case 'customerInsights':
        return <CustomerInsights />;
      case 'carfrequency':
        return <CarFrequency />;
      case 'carowner':
        return <CarOwner />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'coupons':
        return <CouponManagement />;
      case 'yourBilling':
        return <YourBilling />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden p-4 bg-white shadow fixed top-0 left-0 right-0 z-50">
        <Button
          icon="pi pi-bars"
          onClick={() => setVisible(true)}
          className="p-button-text"
          label="Menu"
        />
      </div>

      {/* Mobile Sidebar */}
      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        className="lg:hidden w-64"
      >
        <h2 className="text-xl font-bold mb-4 px-3">Dashboard Menu</h2>
        <PanelMenu
          model={menuItems}
          className="w-full"
          onClick={() => setVisible(false)}
        />
      </Sidebar>

      <div className="flex flex-1 overflow-hidden pt-16 lg:pt-0">
        {/* ✅ Desktop Sidebar — collapses to an icon rail via the hamburger */}
        <aside
          className={`hidden lg:flex flex-col bg-white shadow-lg transition-all duration-300 ${
            collapsed ? 'w-[76px]' : 'w-64'
          }`}
        >
          {/* Header with hamburger */}
          <div className={`p-4 border-b flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && <h2 className="text-xl font-bold whitespace-nowrap">Dashboard</h2>}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Open menu' : 'Close menu'}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            >
              <i className="pi pi-bars text-lg"></i>
            </button>
          </div>

          {collapsed ? (
            /* Icon-only rail */
            <nav className="flex-1 overflow-y-auto scrollbar-hide py-3">
              {menuItems
                .filter(item => item.visible !== false)
                .map(item => {
                  const isActive = (item.className || '').includes('bg-blue-100');
                  return (
                    <button
                      key={item.label}
                      onClick={item.command}
                      title={item.label}
                      className={`relative w-full flex items-center justify-center py-3 my-0.5 transition-colors group ${
                        isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <i className={`${item.icon} text-xl`}></i>
                      {isActive && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l bg-blue-600"></span>
                      )}
                      {/* hover label */}
                      <span className="absolute left-[110%] z-50 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
            </nav>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                <PanelMenu model={menuItems} className="w-full" />
              </div>
              <div className="p-3 border-t">
                <button
                  onClick={() => setCollapsed(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  <i className="pi pi-angle-double-left"></i>
                  Collapse Menu
                </button>
              </div>
            </>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
