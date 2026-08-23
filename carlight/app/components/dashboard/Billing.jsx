'use client';
import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { useAuth } from '@/app/context/AuthContext';

const Billing = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const toast = React.useRef(null);
  const { user } = useAuth();

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedWashPackage, setSelectedWashPackage] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [carType, setCarType] = useState(null);
  const [searchCarNumber, setSearchCarNumber] = useState('');
  const [carFound, setCarFound] = useState(false);
  const [carData, setCarData] = useState(null);
  const [searching, setSearching] = useState(false);
  const [newCustomerModalVisible, setNewCustomerModalVisible] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phoneNumber: '' });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [addCarModalVisible, setAddCarModalVisible] = useState(false);
  const [carForm, setCarForm] = useState({ carNo: '', carType: '', model: '', customerId: null });
  const [creatingCar, setCreatingCar] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({ title: '', amount: 0 });
  const [carId, setCarId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  
  // Coupon state
  const [eligibleCoupons, setEligibleCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValidated, setCouponValidated] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  // Data state
  const [washPackages, setWashPackages] = useState([]);
  const [extras, setExtras] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  
  // Calculated amounts
  const [packageAmount, setPackageAmount] = useState(0);
  const [extrasAmount, setExtrasAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  
  const paymentMethods = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Card', value: 'CARD' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Net Banking', value: 'NET_BANKING' },
  ];
  
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchOutlets();
      fetchCarTypeEnums();
    } else if (user?.role === 'CASHIER') {
      // For CASHIER, get outlet ID from localStorage
      const cashierOutletId = localStorage.getItem('outletId');
      if (cashierOutletId) {
        setSelectedOutlet(parseInt(cashierOutletId));
      }
      fetchCarTypeEnums();
      fetchExtras();
    } else {
      fetchWashPackages();
      fetchExtras();
    }
  }, [user]);
  
  useEffect(() => {
    if (user?.role === 'ADMIN' && selectedOutlet && carType) {
      console.log('Fetching packages for outlet ID:', selectedOutlet, 'and car type:', carType);
      // Clear previous packages
      setWashPackages([]);
      setSelectedWashPackage(null);
      // Fetch new packages for selected outlet and car type
      fetchWashPackages(selectedOutlet, carType);
      fetchExtras();
    } else if (user?.role === 'CASHIER' && selectedOutlet && carType) {
      console.log('CASHIER: Fetching packages for outlet ID:', selectedOutlet, 'and car type:', carType);
      // Clear previous packages
      setWashPackages([]);
      setSelectedWashPackage(null);
      // Fetch packages for cashier's outlet and car type
      fetchWashPackages(selectedOutlet, carType);
      fetchExtras();
    }
  }, [selectedOutlet, carType, user]);
  
  useEffect(() => {
    fetchEligibleCoupons();
  }, [selectedOutlet, carId]);
  
  useEffect(() => {
    calculateAmounts();
  }, [selectedWashPackage, selectedExtras, discount, additionalCharges, couponDiscount]);

  // ✅ FIX: re-validate the applied coupon whenever the cart changes
  // (package/extras/charges/discount), otherwise the shown coupon
  // discount goes stale and the cashier sees a wrong total.
  const cartSignature = `${selectedWashPackage}|${(selectedExtras || []).join(',')}|${additionalCharges.length}|${additionalCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0)}|${discount}`;
  useEffect(() => {
    if (couponValidated && couponCode && selectedOutlet && carId) {
      validateCoupon(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature]);
  
  const fetchWashPackages = async (outletId = null, carTypeFilter = null) => {
    try {
      const token = localStorage.getItem('token');
      const url = outletId 
        ? `${API_BASE_URL}/api/admin/outlets/${outletId}/outlet-packages`
        : `${API_BASE_URL}/api/admin/wash-packages`;
      console.log('Fetching packages from:', url, 'for car type:', carTypeFilter);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched packages:', data);
        
        // Check if data is array of packages or needs transformation
        let packagesArray = Array.isArray(data) ? data : (data.packages || []);
        
        // Filter by car type if provided
        if (carTypeFilter) {
          packagesArray = packagesArray.filter(pkg => pkg.carType === carTypeFilter);
          console.log('Filtered packages by car type:', carTypeFilter, packagesArray);
        }
        
        // Transform to dropdown format
        const packages = packagesArray.map(pkg => ({
          label: `${pkg.washPackageName} - ₹${pkg.price} (${pkg.carType})`,
          value: pkg.id,
          price: pkg.price,
          name: pkg.washPackageName,
          carType: pkg.carType,
          washPackageId: pkg.washPackageId,
          outletId: pkg.outletId
        }));
        
        console.log('Transformed packages:', packages);
        setWashPackages(packages);
      } else {
        console.error('Failed to fetch packages:', response.status);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch wash packages',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching wash packages:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch wash packages',
        life: 3000
      });
    }
  };
  
  const fetchExtras = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/extras`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched extras from API:', data);
        
        // Filter only active extras and transform to multiselect format
        const extrasList = data
          .filter(extra => extra.active === true)
          .map(extra => ({
            label: `${extra.name} - ₹${extra.price}`,
            value: extra.id,
            price: extra.price,
            name: extra.name
          }));
        
        setExtras(extrasList);
        console.log('Transformed extras:', extrasList);
      } else {
        console.error('Failed to fetch extras:', response.status);
      }
    } catch (error) {
      console.error('Error fetching extras:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch extras',
        life: 3000
      });
    }
  };
  
  const fetchEligibleCoupons = async () => {
    if (!selectedOutlet || !carId) {
      setEligibleCoupons([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/coupons/eligible?outletId=${selectedOutlet}&carId=${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const coupons = data.map(coupon => ({
          label: `${coupon.code} - ${coupon.discountType === 'PERCENT' ? coupon.discountValue + '%' : '₹' + coupon.discountValue} OFF`,
          value: coupon.code,
          ...coupon
        }));
        setEligibleCoupons(coupons);
      }
    } catch (error) {
      console.error('Error fetching eligible coupons:', error);
    }
  };
  
  const fetchOutlets = async () => {
    try {
      // Check localStorage first
      const cachedOutlets = localStorage.getItem('outlets');
      if (cachedOutlets) {
        const parsed = JSON.parse(cachedOutlets);
        console.log('Loaded outlets from cache:', parsed);
        
        // Check if data needs transformation (raw API format vs dropdown format)
        const outletsList = parsed[0]?.label 
          ? parsed  // Already in dropdown format
          : parsed.map(outlet => ({  // Transform raw API data
              label: outlet.name,
              value: outlet.id
            }));
        
        setOutlets(outletsList);
        console.log('Transformed outlets:', outletsList);
        return;
      }

      // If not in cache, fetch from API
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/outlets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched outlets from API:', data);
        const outletsList = data.map(outlet => ({
          label: outlet.name,
          value: outlet.id
        }));
        // Store transformed data in localStorage
        localStorage.setItem('outlets', JSON.stringify(outletsList));
        setOutlets(outletsList);
      } else {
        console.error('Failed to fetch outlets:', response.status);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch outlets',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch outlets',
        life: 3000
      });
    }
  };
  
  const fetchCarTypeEnums = async () => {
    try {
      // Check localStorage first
      const cachedEnums = localStorage.getItem('carTypeEnums');
      if (cachedEnums) {
        const enumsList = JSON.parse(cachedEnums);
        setCarTypes(enumsList);
        console.log('Loaded car type enums from cache:', enumsList);
        return;
      }

      // If not in cache, fetch from API
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/meta/enums`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched enums from API:', data);
        
        // Transform enums to dropdown format
        const carTypeEnums = data.carTypes || data.CAR_TYPES || data;
        const enumsList = Array.isArray(carTypeEnums) 
          ? carTypeEnums.map(type => ({
              label: type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' '),
              value: type
            }))
          : [];
        
        // Store in localStorage
        localStorage.setItem('carTypeEnums', JSON.stringify(enumsList));
        setCarTypes(enumsList);
        console.log('Transformed car type enums:', enumsList);
      } else {
        console.error('Failed to fetch enums:', response.status);
      }
    } catch (error) {
      console.error('Error fetching car type enums:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch car types',
        life: 3000
      });
    }
  };
  
  const searchCarByNumber = async () => {
    if (!searchCarNumber.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter a car number',
        life: 3000
      });
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars/search?carNo=${searchCarNumber.toUpperCase()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Search response:', data);
        
        // Check if car data exists (not null or empty)
        if (data && data.id) {
          // Car found - auto-fill form fields
          setCarData(data);
          setCarFound(true);
          setCarId(data.id);
          setCustomerId(data.customerId);
          setVehicleNumber(data.carNo);
          setCustomerName(data.customerName);
          setPhoneNumber(data.customerPhone);
          setCarType(data.carType);
          
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Car found! Details auto-filled',
            life: 3000
          });
        } else {
          // Car not found (200 but empty/null response)
          console.log('Car not found (empty response)');
          setCarFound(false);
          setCarData(null);
          setCarId(null);
          setCustomerId(null);
          setVehicleNumber(searchCarNumber.toUpperCase());
          
          // Open modal to create new customer
          setNewCustomerModalVisible(true);
          
          toast.current?.show({
            severity: 'info',
            summary: 'Not Found',
            detail: 'Car not found. Please add customer details',
            life: 3000
          });
        }
      } else if (response.status === 404 || response.status === 400) {
        // Car not found (404 or 400 with "not found" message)
        console.log('Car not found (status:', response.status, ')');
        setCarFound(false);
        setCarData(null);
        setVehicleNumber(searchCarNumber.toUpperCase());
        
        // Open modal to create new customer
        setNewCustomerModalVisible(true);
        
        toast.current?.show({
          severity: 'info',
          summary: 'Not Found',
          detail: 'Car not found. Please add customer details',
          life: 3000
        });
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Error searching car:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to search car',
        life: 3000
      });
    } finally {
      setSearching(false);
    }
  };
  
  const createNewCustomer = async () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.phoneNumber.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill all customer details',
        life: 3000
      });
      return;
    }

    if (newCustomerForm.phoneNumber.length !== 10) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Phone number must be 10 digits',
        life: 3000
      });
      return;
    }

    setCreatingCustomer(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCustomerForm.name,
          phoneNumber: newCustomerForm.phoneNumber
        })
      });
      
      if (response.ok) {
        const customerData = await response.json();
        console.log('Customer created:', customerData);
        
        // Store customer data
        setSelectedCustomerData({
          id: customerData.id,
          name: newCustomerForm.name,
          phoneNumber: newCustomerForm.phoneNumber
        });
        
        // Auto-fill form fields
        setCustomerName(newCustomerForm.name);
        setPhoneNumber(newCustomerForm.phoneNumber);
        
        // Close customer modal
        setNewCustomerModalVisible(false);
        setNewCustomerForm({ name: '', phoneNumber: '' });
        
        // Open add car modal with customer info pre-filled
        setCarForm({
          carNo: vehicleNumber,
          carType: carType || '',
          model: '',
          customerId: customerData.id
        });
        setCustomerSearchQuery(newCustomerForm.phoneNumber);
        setAddCarModalVisible(true);
        
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Customer created! Now add car details',
          life: 3000
        });
      } else {
        const error = await response.json();
        console.log('Customer creation error:', error);
        
        // Check if customer already exists
        if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate') || response.status === 409)) {
          // Customer already exists, search for them by phone number
          toast.current?.show({
            severity: 'info',
            summary: 'Customer Exists',
            detail: 'Customer already exists. Proceeding to add car...',
            life: 3000
          });
          
          // Search for existing customer by phone number
          try {
            const searchToken = localStorage.getItem('token');
            const searchResponse = await fetch(`${API_BASE_URL}/api/customers/search/phone?phoneNumber=${newCustomerForm.phoneNumber}`, {
              headers: {
                'Authorization': `Bearer ${searchToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (searchResponse.ok) {
              const existingCustomer = await searchResponse.json();
              
              // Store customer data
              setSelectedCustomerData({
                id: existingCustomer.id,
                name: existingCustomer.name,
                phoneNumber: existingCustomer.phoneNumber
              });
              
              // Auto-fill form fields
              setCustomerName(existingCustomer.name);
              setPhoneNumber(existingCustomer.phoneNumber);
              
              // Close customer modal
              setNewCustomerModalVisible(false);
              setNewCustomerForm({ name: '', phoneNumber: '' });
              
              // Open add car modal with customer info pre-filled
              setCarForm({
                carNo: vehicleNumber,
                carType: carType || '',
                model: '',
                customerId: existingCustomer.id
              });
              setCustomerSearchQuery(existingCustomer.phoneNumber);
              setAddCarModalVisible(true);
            }
          } catch (searchError) {
            console.error('Error finding existing customer:', searchError);
          }
        } else {
          // Other error
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to create customer',
            life: 3000
          });
        }
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create customer',
        life: 3000
      });
    } finally {
      setCreatingCustomer(false);
    }
  };
  
  const searchCustomers = async (query) => {
    if (!query || query.trim().length === 0) {
      setCustomerSearchResults([]);
      return;
    }

    setSearchingCustomer(true);
    try {
      const token = localStorage.getItem('token');
      // Search by phone number
      const response = await fetch(`${API_BASE_URL}/api/customers/search/phone?phoneNumber=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Customer found by phone:', data);
        
        // Auto-select the customer
        if (data && data.id) {
          setCarForm(prev => ({ ...prev, customerId: data.id }));
          setSelectedCustomerData(data);
          setCustomerSearchResults([]);
          
          toast.current?.show({
            severity: 'success',
            summary: 'Customer Found',
            detail: `${data.name} selected`,
            life: 2000
          });
        }
      } else if (response.status === 404 || response.status === 400) {
        console.log('Customer not found by phone');
        setCustomerSearchResults([]);
        setSelectedCustomerData(null);
        setCarForm(prev => ({ ...prev, customerId: null }));
        
        toast.current?.show({
          severity: 'info',
          summary: 'Not Found',
          detail: 'No customer found with this phone number',
          life: 2000
        });
      } else {
        setCustomerSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      setCustomerSearchResults([]);
    } finally {
      setSearchingCustomer(false);
    }
  };
  
  const createCar = async () => {
    if (!carForm.carNo.trim() || !carForm.carType || !carForm.customerId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill car number, car type, and select a customer.',
        life: 3000
      });
      return;
    }

    setCreatingCar(true);
    try {
      const token = localStorage.getItem('token');
      const carPayload = {
        carNo: carForm.carNo.toUpperCase(),
        carType: carForm.carType,
        model: carForm.model,
        customerId: carForm.customerId
      };
      
      console.log('Creating car with payload:', carPayload);
      
      const response = await fetch(`${API_BASE_URL}/api/cars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(carPayload)
      });
      
      if (response.ok) {
        const carData = await response.json();
        console.log('Car created:', carData);
        
        // Store the created car's ID and customer ID
        setCarId(carData.id);
        setCustomerId(carData.customerId);
        setCarFound(true);
        setVehicleNumber(carData.carNo);
        setCarType(carData.carType);
        
        // Close modal and reset form
        setAddCarModalVisible(false);
        setCarForm({ carNo: '', carType: '', model: '', customerId: null });
        setCustomerSearchQuery('');
        setCustomerSearchResults([]);
        
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Car added successfully',
          life: 3000
        });
      } else {
        const error = await response.json();
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to add car',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error creating car:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to add car',
        life: 3000
      });
    } finally {
      setCreatingCar(false);
    }
  };
  
  const addAdditionalCharge = () => {
    if (!newCharge.title.trim() || !newCharge.amount || newCharge.amount <= 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter valid charge title and amount',
        life: 3000
      });
      return;
    }
    
    setAdditionalCharges([...additionalCharges, { ...newCharge }]);
    setNewCharge({ title: '', amount: 0 });
  };
  
  const removeAdditionalCharge = (index) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };
  
  const validateCoupon = async (silent = false) => {
    if (!couponCode || !selectedOutlet || !carId) {
      if (!silent) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validation Error',
          detail: 'Please fill all required fields before applying coupon',
          life: 3000
        });
      }
      return;
    }
    
    setValidatingCoupon(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get selected package details
      const pkg = washPackages.find(p => p.value === selectedWashPackage);
      const outletPackageId = pkg?.value;
      
      const requestBody = {
        code: couponCode,
        outletId: selectedOutlet,
        carId: carId,
        outletPackageId: outletPackageId,
        extraIds: selectedExtras,
        additionalCharges: additionalCharges.map(charge => ({
          title: charge.title,
          amount: charge.amount
        })),
        manualDiscount: discount || 0
      };
      
      const response = await fetch(`${API_BASE_URL}/api/coupons/best`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setCouponDiscount(data.couponDiscount || 0);
          setCouponValidated(true);
          setSelectedCoupon(data);
          if (!silent) {
            toast.current?.show({
              severity: 'success',
              summary: 'Coupon Applied',
              detail: data.message || `Coupon ${couponCode} applied successfully!`,
              life: 3000
            });
          }
        } else {
          // ✅ coupon became invalid (expired / limit reached / cart changed) — remove it
          setCouponValidated(false);
          setSelectedCoupon(null);
          setCouponDiscount(0);
          setCouponCode('');
          toast.current?.show({
            severity: 'warn',
            summary: silent ? 'Coupon Removed' : 'Invalid Coupon',
            detail: data.message || 'Coupon is not valid',
            life: 3500
          });
        }
      } else {
        const errorData = await response.json();
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: errorData.message || 'Failed to validate coupon',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to validate coupon',
        life: 3000
      });
    } finally {
      setValidatingCoupon(false);
    }
  };
  
  const removeCoupon = () => {
    setCouponCode('');
    setSelectedCoupon(null);
    setCouponDiscount(0);
    setCouponValidated(false);
  };
  
  const handleCouponSelection = (couponValue) => {
    // If a coupon is already validated, reset it first
    if (couponValidated) {
      setCouponValidated(false);
      setSelectedCoupon(null);
      setCouponDiscount(0);
    }
    
    // Just set the coupon code in the input field
    setCouponCode(couponValue);
  };
  
  const calculateAmounts = () => {
    let pkgAmt = 0;
    let extAmt = 0;
    
    if (selectedWashPackage) {
      const pkg = washPackages.find(p => p.value === selectedWashPackage);
      pkgAmt = pkg ? pkg.price : 0;
    }
    
    if (selectedExtras && selectedExtras.length > 0) {
      extAmt = selectedExtras.reduce((sum, extraId) => {
        const extra = extras.find(e => e.value === extraId);
        return sum + (extra ? extra.price : 0);
      }, 0);
    }
    
    // Add additional charges
    const additionalAmt = additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    
    const total = pkgAmt + extAmt + additionalAmt;
    // ✅ FIX: never show a negative payable (manual discount + coupon can exceed total)
    const final = Math.max(0, total - (discount || 0) - (couponDiscount || 0));
    
    setPackageAmount(pkgAmt);
    setExtrasAmount(extAmt);
    setTotalAmount(total);
    setFinalAmount(final);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!customerName.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Customer name is required',
        life: 3000
      });
      return;
    }
    
    if (!phoneNumber.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Phone number is required',
        life: 3000
      });
      return;
    }
    
    if (!vehicleNumber.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Vehicle number is required',
        life: 3000
      });
      return;
    }
    
    if (!selectedWashPackage) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select a wash package',
        life: 3000
      });
      return;
    }
    
    if (!paymentMethod) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select a payment method',
        life: 3000
      });
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Get outletId from selectedOutlet (ADMIN) or from the selected package (CASHIER)
      let outletIdToSend = selectedOutlet;
      if (!outletIdToSend && selectedWashPackage) {
        const pkg = washPackages.find(p => p.value === selectedWashPackage);
        outletIdToSend = pkg?.outletId;
      }
      
      const billData = {
        customerId: customerId,
        outletId: outletIdToSend,
        carId: carId,
        outletPackageId: selectedWashPackage,
        discount: discount || 0,
        extraIds: selectedExtras || [],
        paymentMethod: paymentMethod,
        createdBy: user?.id,
        additionalCharges: additionalCharges || [],
        couponId: selectedCoupon?.couponId || null
      };
      
      const response = await fetch(`${API_BASE_URL}/api/bills`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(billData)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // ✅ show success dialog with invoice details instead of just a toast
        setLastBill(result || { totalAmount: finalAmount });
        
      } else {
        const error = await response.json();
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to create bill',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create bill',
        life: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setCustomerName('');
    setPhoneNumber('');
    setVehicleNumber('');
    setSelectedWashPackage(null);
    setSelectedExtras([]);
    setDiscount(0);
    setPaymentMethod(null);
    setSelectedOutlet(null);
    setCarType(null);
    setSearchCarNumber('');
    setCarFound(false);
    setCarData(null);
    setNewCustomerModalVisible(false);
    setNewCustomerForm({ name: '', phoneNumber: '' });
    setAddCarModalVisible(false);
    setCarForm({ carNo: '', carType: '', model: '', customerId: null });
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setSelectedCustomerData(null);
    setAdditionalCharges([]);
    setNewCharge({ title: '', amount: 0 });
    setCarId(null);
    setCustomerId(null);
    setCouponCode('');
    setSelectedCoupon(null);
    setCouponDiscount(0);
    setCouponValidated(false);
  };
  
  const formatCurrency = (value=0) => {
    return `₹${value.toFixed(2) }`;
  };
  
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <Toast ref={toast} />
      
      <div className="h-full overflow-auto">
        {/* Page Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                <i className="pi pi-receipt text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Create New Bill</h1>
                <p className="text-sm text-gray-600 mt-0.5">Generate invoice for car wash services</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white shadow-lg m-4 sm:m-6 rounded-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-full">
              {/* Left Side - Form Details */}
              <div className="lg:col-span-9 p-4 sm:p-6 order-2 lg:order-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4">
                  {/* Car Number Search */}
                  <div className="col-span-1 sm:col-span-2">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500 mb-4">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <i className="pi pi-search text-blue-600"></i>
                        Vehicle Search
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">Search by registration number to auto-fill details</p>
                    </div>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                      <i className="pi pi-hashtag text-blue-600"></i>
                      Vehicle Registration Number *
                    </label>
                    <div className="flex gap-2">
                      <InputText
                        value={searchCarNumber}
                        onChange={(e) => setSearchCarNumber(e.target.value.toUpperCase())}
                        placeholder="e.g., UP32AB1234"
                        className="flex-1 font-mono border border-gray-300 p-3 rounded-lg text-lg tracking-wide"
                        onKeyPress={(e) => e.key === 'Enter' && searchCarByNumber()}
                      />
                      <Button
                        type="button"
                        label="Search"
                        icon="pi pi-search"
                        onClick={searchCarByNumber}
                        loading={searching}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* Outlet Selection - Admin Only (First) */}
                  {user?.role === 'ADMIN' && (
                    <>
                      <div className="col-span-1 sm:col-span-2">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-l-4 border-purple-500 mb-4 mt-4">
                          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <i className="pi pi-building text-purple-600"></i>
                            Outlet & Vehicle Configuration
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">Select outlet and vehicle type for pricing</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <i className="pi pi-map-marker text-purple-600"></i>
                          Select Outlet *
                        </label>
                        <Dropdown
                          value={selectedOutlet}
                          onChange={(e) => {
                            console.log('Outlet selected:', e.value);
                            setSelectedOutlet(e.value);
                          }}
                          options={outlets}
                          placeholder="Select outlet"
                          className="w-full border border-gray-300"
                          filter
                        />
                        <small className="text-gray-500 block mt-1">📍 Available outlets: {outlets.length}</small>
                      </div>
                      
                      <div className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">
                          Car Type *
                        </label>
                        <Dropdown
                          value={carType}
                          onChange={(e) => setCarType(e.value)}
                          options={carTypes}
                          placeholder="Select car type"
                          className="w-full border border-gray-300"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Car Type for CASHIER */}
                  {user?.role === 'CASHIER' && (
                    <div className="col-span-1 sm:col-span-2">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-l-4 border-purple-500 shadow-sm mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-purple-500 p-2 rounded-full">
                            <i className="pi pi-car text-white"></i>
                          </div>
                          <h3 className="text-sm font-bold text-gray-800">
                            Vehicle Selection
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">Select vehicle type for pricing</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-700">
                          Car Type *
                        </label>
                        <Dropdown
                          value={carType}
                          onChange={(e) => setCarType(e.value)}
                          options={carTypes}
                          placeholder="Select car type"
                          className="w-full border border-gray-300"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Customer Information */}
                  <div className="col-span-1 sm:col-span-2 mt-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-green-500 p-2 rounded-full">
                          <i className="pi pi-user text-white"></i>
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">Customer & Vehicle Details</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Customer Name */}
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <i className="pi pi-user text-green-600"></i>
                            <span className="font-medium">Customer Name</span>
                          </div>
                          <div className="text-sm font-bold text-gray-900 truncate" title={customerName || 'Not set'}>
                            {customerName || <span className="text-gray-400 italic">Not set</span>}
                          </div>
                        </div>
                        
                        {/* Phone Number */}
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <i className="pi pi-phone text-green-600"></i>
                            <span className="font-medium">Phone Number</span>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {phoneNumber ? `+91 ${phoneNumber}` : <span className="text-gray-400 italic">Not set</span>}
                          </div>
                        </div>
                        
                        {/* Vehicle Number */}
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <i className="pi pi-car text-green-600"></i>
                            <span className="font-medium">Vehicle Number</span>
                          </div>
                          <div className="text-sm font-bold text-gray-900 font-mono tracking-wider">
                            {vehicleNumber || <span className="text-gray-400 italic font-sans">Not set</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Service Selection */}
                  <div className="col-span-1 sm:col-span-2 mt-4">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border-l-4 border-blue-500 mb-4">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <i className="pi pi-box text-blue-600"></i>
                        Service Selection
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">Choose wash package and additional services</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Wash Package *
                    </label>
                    <Dropdown
                      value={selectedWashPackage}
                      onChange={(e) => setSelectedWashPackage(e.value)}
                      options={washPackages}
                      placeholder="Select package"
                      className="w-full border border-gray-300"
                      filter
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Extra Services <span className="text-gray-400">(Optional)</span>
                    </label>
                    <MultiSelect
                      value={selectedExtras}
                      onChange={(e) => setSelectedExtras(e.value)}
                      options={extras}
                      placeholder="Add extras"
                      className="w-full border border-gray-300"
                      display="chip"
                    />
                  </div>
                  
                  {/* Additional Charges Accordion */}
                  <div className="col-span-1 sm:col-span-2 mt-2">
                    <Accordion className="border-2 border-orange-200 rounded-xl overflow-hidden shadow-sm">
                      <AccordionTab
                        header={
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                              <i className="pi pi-plus-circle text-white"></i>
                            </div>
                            <div>
                              <span className="font-bold text-gray-800">Additional Charges</span>
                              <p className="text-xs text-gray-500 mt-0.5">Add custom charges to the bill</p>
                            </div>
                            {additionalCharges.length > 0 && (
                              <span className="ml-auto bg-gradient-to-r from-orange-600 to-orange-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                {additionalCharges.length} {additionalCharges.length === 1 ? 'charge' : 'charges'}
                              </span>
                            )}
                          </div>
                        }
                      >
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {/* Charge Title */}
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                <i className="pi pi-tag text-orange-600"></i>
                                Charge Title
                              </label>
                              <InputText
                                value={newCharge.title}
                                onChange={(e) => setNewCharge({ ...newCharge, title: e.target.value })}
                                placeholder="e.g., Seat Cleaning, AC Service"
                                className="w-full border-2 border-orange-200 focus:border-orange-500 p-3 rounded-lg transition-all"
                              />
                            </div>
                            
                            {/* Amount */}
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                <i className="pi pi-indian-rupee text-orange-600"></i>
                                Amount
                              </label>
                              <div className="flex gap-2">
                                <InputNumber
                                  value={newCharge.amount}
                                  onValueChange={(e) => setNewCharge({ ...newCharge, amount: e.value || 0 })}
                                  placeholder="Enter amount"
                                  className="flex-1"
                                  inputClassName="border-2 border-orange-200 focus:border-orange-500 p-3 rounded-lg"
                                  mode="currency"
                                  currency="INR"
                                  locale="en-IN"
                                  min={0}
                                />
                                <Button
                                  type="button"
                                  icon="pi pi-plus"
                                  onClick={addAdditionalCharge}
                                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 border-0 text-white px-4 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                                  tooltip="Add Charge"
                                  tooltipOptions={{ position: 'top' }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* List of Added Charges */}
                          {additionalCharges.length > 0 && (
                            <div className="col-span-1 sm:col-span-2">
                              <div className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-100">
                                  <i className="pi pi-list text-orange-600"></i>
                                  <span className="text-sm font-bold text-gray-800">Added Charges</span>
                                </div>
                                <div className="space-y-2">
                                  {additionalCharges.map((charge, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow group">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <div className="bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                            {index + 1}
                                          </div>
                                          <div className="text-sm font-bold text-gray-900">{charge.title}</div>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 ml-8 font-semibold">{formatCurrency(charge.amount)}</div>
                                      </div>
                                      <Button
                                        type="button"
                                        icon="pi pi-trash"
                                        onClick={() => removeAdditionalCharge(index)}
                                        className="p-button-rounded bg-red-500 hover:bg-red-600 border-0 text-white opacity-70 group-hover:opacity-100 transition-all"
                                        tooltip="Remove Charge"
                                        tooltipOptions={{ position: 'top' }}
                                        size="small"
                                      />
                                    </div>
                                  ))}
                                </div>
                                {/* Total Additional Charges */}
                                <div className="mt-4 pt-3 border-t-2 border-orange-200 flex items-center justify-between">
                                  <span className="text-sm font-bold text-gray-700">Total Additional:</span>
                                  <span className="text-lg font-bold text-orange-600">
                                    {formatCurrency(additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionTab>
                    </Accordion>
                  </div>
                  
                  {/* Payment Details */}
                  <div className="col-span-1 sm:col-span-2 mt-4">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border-l-4 border-indigo-500 mb-4">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <i className="pi pi-wallet text-indigo-600"></i>
                        Payment Details
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">Set discount and choose payment method</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <i className="pi pi-percentage text-red-600"></i>
                      Discount Amount
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                        <i className="pi pi-tag text-red-500 text-sm"></i>
                        <span className="text-gray-500 font-semibold">₹</span>
                      </div>
                      <InputNumber
                        value={discount}
                        onValueChange={(e) => setDiscount(e.value || 0)}
                        placeholder="0.00"
                        className="w-full"
                        inputClassName="pl-14 pr-4 py-3 border-2 border-red-200 focus:border-red-500 rounded-lg text-lg font-semibold transition-all"
                        mode="decimal"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        min={0}
                        max={Math.max(0, totalAmount - couponDiscount)}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                      <span className="text-gray-600 font-medium">Maximum discount available:</span>
                      <span className="font-bold text-red-600">{formatCurrency(Math.max(0, totalAmount - couponDiscount))}</span>
                    </div>
                  </div>
                  
                  {/* Coupon Section */}
                  <div className="col-span-1 sm:col-span-2 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <i className="pi pi-ticket text-purple-600"></i>
                      Apply Coupon <span className="text-gray-400">(Optional)</span>
                    </label>
                    
                    {/* Coupon Input Bar */}
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <InputText
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Enter coupon code"
                            className="w-full border-2 border-purple-300 focus:border-purple-500 rounded-lg px-4 py-3 pr-24 text-sm font-bold tracking-wider uppercase"
                            disabled={couponValidated}
                            style={{
                              backgroundColor: couponValidated ? '#f0fdf4' : 'white',
                              borderColor: couponValidated ? '#22c55e' : undefined
                            }}
                          />
                          {couponValidated && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-xs font-semibold text-green-700">
                                -{formatCurrency(couponDiscount)}
                              </span>
                              <button
                                onClick={removeCoupon}
                                className="p-1 hover:bg-red-100 rounded-full transition-colors"
                                title="Remove coupon"
                              >
                                <i className="pi pi-times text-red-600 text-sm"></i>
                              </button>
                            </div>
                          )}
                        </div>
                        {!couponValidated && (
                          <Button
                            label="Apply"
                            icon="pi pi-check"
                            onClick={validateCoupon}
                            loading={validatingCoupon}
                            disabled={!couponCode || validatingCoupon}
                            className="bg-purple-600 hover:bg-purple-700 border-0 text-white px-6 py-3"
                          />
                        )}
                      </div>
                      
                      {couponValidated && (
                        <div className="flex items-center gap-2 mt-2 px-2">
                          <i className="pi pi-check-circle text-green-600 text-sm"></i>
                          <span className="text-xs font-semibold text-green-700">
                            Coupon applied successfully!
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Available Coupons List */}
                    {!couponValidated && eligibleCoupons.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 bg-purple-50 border border-purple-200 rounded-lg p-2 flex items-center gap-2">
                          <i className="pi pi-info-circle text-purple-600"></i>
                          <span className="font-medium">{eligibleCoupons.length} coupon{eligibleCoupons.length > 1 ? 's' : ''} available - Click to apply</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {eligibleCoupons.map((coupon) => (
                            <div
                              key={coupon.value}
                              onClick={() => handleCouponSelection(coupon.value)}
                              className="group relative bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-2 border-purple-300 hover:border-purple-500 rounded-lg p-3 cursor-pointer transition-all shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="bg-purple-600 p-1.5 rounded-md">
                                    <i className="pi pi-ticket text-white text-xs"></i>
                                  </div>
                                  <span className="font-bold text-purple-900 text-sm">{coupon.label}</span>
                                </div>
                                <i className="pi pi-arrow-right text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                              </div>
                              <div className="text-xs text-purple-700 ml-8 flex items-center justify-between">
                                <span>
                                  {coupon.validTill ? `Till ${new Date(coupon.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'No expiry'}
                                  {(coupon.maxUses ?? 0) < 999999 ? ` · ${(coupon.maxUses || 0) - (coupon.usedCount || 0)} left` : ''}
                                  {coupon.oncePerCar ? ' · Once per car' : ''}
                                </span>
                                <span className="font-semibold">Click to apply</span>
                              </div>
                              {validatingCoupon && couponCode === coupon.value && (
                                <div className="absolute inset-0 bg-purple-100 bg-opacity-80 rounded-lg flex items-center justify-center">
                                  <i className="pi pi-spin pi-spinner text-purple-600 text-xl"></i>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <i className="pi pi-credit-card text-indigo-600"></i>
                      Payment Method *
                    </label>
                    <Dropdown
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.value)}
                      options={paymentMethods}
                      placeholder="Select method"
                      className="w-full border border-gray-300"
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="col-span-1 sm:col-span-2 mt-6 pt-4 border-t-2 border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="submit"
                        label={submitting ? "Creating Bill..." : "Create Bill"}
                        className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-0 text-white py-3 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all"
                        loading={submitting}
                        disabled={submitting}
                      />
                      <Button
                        type="button"
                        label="Reset Form"
                        icon="pi pi-refresh"
                        className="w-full sm:w-auto bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 border-0 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                        onClick={resetForm}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Bill Summary */}
              <div className="lg:col-span-3 bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 border-b lg:border-b-0 lg:border-l-2 border-gray-200 order-1 lg:order-2">
                <div className="sticky top-0">
                  <div className="bg-white rounded-xl p-4 shadow-md mb-5">
                    <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
                      <i className="pi pi-calculator text-blue-600 text-lg"></i>
                      Bill Summary
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Invoice breakdown and total</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-gray-600 text-xs mb-1 font-medium">💼 Package Amount</div>
                      <div className="font-bold text-xl text-gray-900">{formatCurrency(packageAmount)}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-gray-600 text-xs mb-1 font-medium">✨ Extras Amount</div>
                      <div className="font-bold text-xl text-gray-900">{formatCurrency(extrasAmount)}</div>
                    </div>
                    
                    {additionalCharges.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-gray-600 text-xs mb-1 font-medium">➕ Additional Charges</div>
                        <div className="font-bold text-xl text-gray-900">
                          {formatCurrency(additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0))}
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-white rounded-lg p-4 border-l-4 border-gray-400 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-gray-600 text-xs mb-1 font-medium">📊 Subtotal</div>
                      <div className="font-bold text-xl text-gray-900">{formatCurrency(totalAmount)}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-gray-600 text-xs mb-1 font-medium">🎫 Discount</div>
                      <div className="font-bold text-xl text-red-600">-{formatCurrency(discount || 0)}</div>
                    </div>
                    
                    {couponValidated && couponDiscount > 0 && (
                      <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-gray-600 text-xs mb-1 font-medium">🎟️ Coupon Discount ({couponCode})</div>
                        <div className="font-bold text-xl text-purple-600">-{formatCurrency(couponDiscount)}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-5 mt-4 shadow-lg">
                    <div className="text-green-100 text-xs font-semibold mb-1 uppercase tracking-wide">💰 Total Amount</div>
                    <div className="text-white font-bold text-3xl">{formatCurrency(finalAmount)}</div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* New Customer Modal */}
      <Dialog
        visible={newCustomerModalVisible}
        onHide={() => setNewCustomerModalVisible(false)}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
              <i className="pi pi-user-plus text-2xl text-white"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Add New Customer</h3>
              <p className="text-sm text-gray-500">Register a new customer in the system</p>
            </div>
          </div>
        }
        style={{ width: '600px' }}
        className="add-customer-dialog"
      >
        <div className="pt-4 space-y-5">
          {/* Customer Name Field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-user text-green-600"></i>
              Customer Name <span className="text-red-500">*</span>
            </label>
            <InputText
              value={newCustomerForm.name}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
              placeholder="e.g., John Doe"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
            <small className="text-gray-500 mt-1 block">Enter the full name of the customer</small>
          </div>

          {/* Phone Number Field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-phone text-green-600"></i>
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">+91</span>
              <InputText
                value={newCustomerForm.phoneNumber}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phoneNumber: e.target.value })}
                placeholder="9876543210"
                className="w-full border border-gray-300 pl-14 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                keyfilter="int"
                maxLength={10}
              />
            </div>
            <small className="text-gray-500 mt-1 block">Enter a valid 10-digit mobile number</small>
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-start gap-3">
            <i className="pi pi-info-circle text-green-600 text-lg mt-0.5"></i>
            <div className="text-sm">
              <p className="font-semibold text-green-800 mb-1">Customer Record</p>
              <p className="text-green-700">The customer will be registered and can be linked to multiple vehicles for future billing and tracking.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setNewCustomerModalVisible(false);
                setNewCustomerForm({ name: '', phoneNumber: '' });
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
              outlined
              disabled={creatingCustomer}
            />
            <Button
              label="Create Customer"
              icon="pi pi-check"
              onClick={createNewCustomer}
              loading={creatingCustomer}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-0 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            />
          </div>
        </div>
      </Dialog>
      
      {/* Add Car Modal */}
      <Dialog
        visible={addCarModalVisible}
        onHide={() => setAddCarModalVisible(false)}
        modal
        header={
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-md">
              <i className="pi pi-car text-2xl text-white"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Add New Vehicle</h3>
              <p className="text-sm text-gray-500">Register a new vehicle for a customer</p>
            </div>
          </div>
        }
        style={{ width: '650px' }}
        className="add-car-dialog"
      >
        <div className="pt-4 space-y-5">
          {/* Show customer info if pre-filled */}
          {selectedCustomerData && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-full">
                  <i className="pi pi-user text-white"></i>
                </div>
                <div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Linked Customer</div>
                  <div className="text-lg font-bold text-gray-900 mt-0.5">{selectedCustomerData.name}</div>
                  <div className="text-sm text-gray-700 flex items-center gap-1 mt-0.5">
                    <i className="pi pi-phone text-xs"></i>
                    {selectedCustomerData.phoneNumber}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Car Number Field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-hashtag text-purple-600"></i>
              Vehicle Registration Number <span className="text-red-500">*</span>
            </label>
            <InputText
              value={carForm.carNo}
              onChange={(e) => setCarForm({ ...carForm, carNo: e.target.value.toUpperCase() })}
              placeholder="e.g., UP32AB1234, MH01CD5678"
              className="w-full font-mono text-lg tracking-wider border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase"
            />
            <small className="text-gray-500 mt-1 block">Enter the vehicle&apos;s registration/license plate number</small>
          </div>

          {/* Car Type Field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-sitemap text-purple-600"></i>
              Vehicle Type <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={carForm.carType}
              onChange={(e) => setCarForm({ ...carForm, carType: e.value })}
              options={carTypes}
              placeholder="Select vehicle type"
              className="w-full border border-gray-300"
              panelClassName="custom-dropdown-panel"
            />
            <small className="text-gray-500 mt-1 block">Select the category of the vehicle</small>
          </div>

          {/* Model Field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-tag text-purple-600"></i>
              Vehicle Model <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <InputText
              value={carForm.model}
              onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
              placeholder="e.g., Creta, Swift, City"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
            <small className="text-gray-500 mt-1 block">Specify the make and model for better identification</small>
          </div>

          {/* Customer Search Field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="pi pi-phone text-purple-600"></i>
              Customer Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">+91</span>
                <InputText
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="9876543210"
                  className="w-full border border-gray-300 pl-14 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  keyfilter="int"
                  maxLength={10}
                />
              </div>
              <Button
                type="button"
                label="Search"
                icon="pi pi-search"
                onClick={() => searchCustomers(customerSearchQuery)}
                loading={searchingCustomer}
                className="bg-purple-600 hover:bg-purple-700 border-0 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
              />
            </div>
            <small className="text-gray-500 mt-1 block">Search for an existing customer to link this vehicle</small>
            
            {carForm.customerId && selectedCustomerData && (
              <div className="mt-3 bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-3 shadow-sm">
                <div className="bg-green-500 p-2 rounded-full">
                  <i className="pi pi-check-circle text-white"></i>
                </div>
                <div>
                  <div className="font-semibold text-green-800">Customer Linked Successfully</div>
                  <div className="text-sm text-green-700">{selectedCustomerData.name}</div>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4 flex items-start gap-3">
            <i className="pi pi-info-circle text-purple-600 text-lg mt-0.5"></i>
            <div className="text-sm">
              <p className="font-semibold text-purple-800 mb-1">Vehicle Registration</p>
              <p className="text-purple-700">This vehicle will be linked to the customer and can be used for quick billing in future visits.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setAddCarModalVisible(false);
                setCarForm({ carNo: '', carType: '', model: '', customerId: null });
                setCustomerSearchQuery('');
                setCustomerSearchResults([]);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
              outlined
              disabled={creatingCar}
            />
            <Button
              label="Add Vehicle"
              icon="pi pi-check"
              onClick={createCar}
              loading={creatingCar}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            />
          </div>
        </div>
      </Dialog>

      {/* ✅ Bill Created Success Dialog */}
      <Dialog
        visible={!!lastBill}
        onHide={() => {
          setLastBill(null);
          resetForm();
        }}
        modal
        closable={false}
        header={
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-full">
              <i className="pi pi-check-circle text-2xl text-green-600"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Bill Created!</h3>
              <p className="text-sm text-gray-500">Invoice generated successfully</p>
            </div>
          </div>
        }
        style={{ width: '420px' }}
      >
        {lastBill && (
          <div className="pt-2">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Invoice No</p>
              <p className="text-xl font-bold text-green-800">{lastBill.invoiceNo || '—'}</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(lastBill.totalAmount ?? finalAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">Paid via {lastBill.paymentMethod || paymentMethod}</p>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <div className="flex justify-between"><span>Customer:</span><span className="font-semibold text-gray-800">{lastBill.customerName || customerName}</span></div>
              <div className="flex justify-between"><span>Vehicle:</span><span className="font-semibold text-gray-800">{lastBill.carNo || vehicleNumber}</span></div>
              {selectedCoupon?.code && (
                <div className="flex justify-between">
                  <span>Coupon:</span>
                  <span className="font-semibold text-purple-700">
                    {selectedCoupon.code} (−{formatCurrency(couponDiscount)})
                  </span>
                </div>
              )}
            </div>

            <Button
              label="Start New Bill"
              icon="pi pi-plus"
              onClick={() => {
                setLastBill(null);
                resetForm();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 border-0 text-white py-3 font-bold"
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Billing;
