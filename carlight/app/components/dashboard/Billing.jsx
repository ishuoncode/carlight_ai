'use client';
import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { AutoComplete } from 'primereact/autocomplete';
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
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [carType, setCarType] = useState(null);
  const [carNumberQuery, setCarNumberQuery] = useState('');
  const [carFound, setCarFound] = useState(false);
  const [carData, setCarData] = useState(null);
  const [searching, setSearching] = useState(false);

  // Fast Billing mode toggle
  const [fastBillingMode, setFastBillingMode] = useState(false);
  const [fastBillingAmount, setFastBillingAmount] = useState('');
  const [fastBillingCarType, setFastBillingCarType] = useState(null);
  const [fastBillingPaymentMethod, setFastBillingPaymentMethod] = useState('CASH');

  // ✅ Default package ID for fast billing (manual package with price ₹0)
  // Set this to the outlet_package_id from create_default_manual_package.sql
  const [fastBillingPackageId, setFastBillingPackageId] = useState(null);

  // Fast Billing - Vehicle suggestions & quick registration (mirrors package mode)
  const [fastCarNumberQuery, setFastCarNumberQuery] = useState('');
  const [fastCarSuggestions, setFastCarSuggestions] = useState([]);
  const [fastQuickRegVisible, setFastQuickRegVisible] = useState(false);
  const [fastQuickCarNo, setFastQuickCarNo] = useState('');
  const [fastQuickPhone, setFastQuickPhone] = useState('');
  const [fastQuickPhoneStatus, setFastQuickPhoneStatus] = useState('idle');
  const [fastQuickCustomer, setFastQuickCustomer] = useState(null);
  const [fastQuickName, setFastQuickName] = useState('');
  const [fastQuickCarType, setFastQuickCarType] = useState(null);
  const [fastQuickModel, setFastQuickModel] = useState('');
  const [fastQuickSaving, setFastQuickSaving] = useState(false);

  // ⚡ Simplified flow: live suggestions + single inline registration panel
  // (replaces the old "Add Customer" modal -> "Add Car" modal chain)
  const [allCars, setAllCars] = useState([]);
  const [carSuggestions, setCarSuggestions] = useState([]);
  const [quickRegVisible, setQuickRegVisible] = useState(false);
  const [quickCarNo, setQuickCarNo] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickPhoneStatus, setQuickPhoneStatus] = useState('idle'); // idle | checking | found | notfound
  const [quickCustomer, setQuickCustomer] = useState(null);
  const [quickName, setQuickName] = useState('');
  const [quickCarType, setQuickCarType] = useState(null);
  const [quickModel, setQuickModel] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
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

  const fastBillingPaymentMethods = [
    { label: 'Cash', value: 'CASH' },
    { label: 'UPI', value: 'UPI' },
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

  // ⚡ Load all vehicles once so the car-number input can show live
  // suggestions (car no + owner name + phone) while typing.
  useEffect(() => {
    fetchAllCars();
  }, [user]);

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

        // ✅ Auto-set fastBillingPackageId from the manual package (price ₹0)
        const manualPkg = packages.find(p => p.price === 0 && (p.name || '').toUpperCase().includes('MANUAL'));
        if (manualPkg) {
          setFastBillingPackageId(manualPkg.value);
          console.log('Fast billing package set to:', manualPkg.value, manualPkg.label);
        }
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

  // ⚡ SIMPLIFIED BILLING FLOW
  // 1) Live suggestions while typing (car no / owner name / phone)
  // 2) Enter or exact match -> bill loads instantly
  // 3) New vehicle -> one inline panel: phone-first lookup reuses the existing
  //    customer (their other car), or creates customer + vehicle in one click.

  const fetchAllCars = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllCars(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching cars for suggestions:', error);
    }
  };

  const applyFoundCar = (data) => {
    setCarData(data);
    setCarFound(true);
    setCarId(data.id);
    setCustomerId(data.customerId);
    setVehicleNumber(data.carNo);
    setCustomerName(data.customerName);
    setPhoneNumber(data.customerPhone);
    setCarType(data.carType);
    setCarNumberQuery('');
    setCarSuggestions([]);
    setQuickRegVisible(false);

    toast.current?.show({
      severity: 'success',
      summary: `${data.carNo} • ${data.customerName || 'Customer'}`,
      detail: 'Customer & vehicle loaded. Select a package to continue.',
      life: 2500
    });
  };

  const handleCarSelect = (car) => {
    if (car && car.id) applyFoundCar(car);
  };

  const handleCarComplete = (e) => {
    const q = (e.query || '').trim().toUpperCase();
    if (!q) {
      setCarSuggestions([]);
      return;
    }
    setCarSuggestions(
      allCars
        .filter(
          (c) =>
            c.carNo?.toUpperCase().includes(q) ||
            c.customerName?.toUpperCase().includes(q) ||
            c.customerPhone?.includes(q)
        )
        .slice(0, 8)
    );
  };

  const openQuickRegister = (carNo) => {
    setQuickCarNo(carNo);
    setQuickRegVisible(true);
    setQuickPhone('');
    setQuickPhoneStatus('idle');
    setQuickCustomer(null);
    setQuickName('');
    setQuickCarType(null);
    setQuickModel('');
    setCarSuggestions([]);
    setCarNumberQuery('');

    toast.current?.show({
      severity: 'info',
      summary: 'New Vehicle',
      detail: `${carNo} is not in the records — enter the customer's phone to continue`,
      life: 3000
    });
  };

  // Enter pressed on the car input: pick the exact match if it exists,
  // otherwise open the quick-register panel for this new vehicle.
  const handleCarInputKey = async (e) => {
    if (e.key !== 'Enter') return;
    const typed = carNumberQuery.trim().toUpperCase();
    if (!typed) return;
    e.preventDefault();

    // 1) exact match from the loaded list
    const exact = allCars.find((c) => c.carNo === typed);
    if (exact) {
      applyFoundCar(exact);
      return;
    }

    // 2) confirm against the server (list could be stale)
    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars/search?carNo=${encodeURIComponent(typed)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setAllCars((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
          applyFoundCar(data);
          return;
        }
      }
      // 3) genuinely new vehicle -> quick register panel
      openQuickRegister(typed);
    } catch (error) {
      console.error('Error checking car number:', error);
      openQuickRegister(typed);
    } finally {
      setSearching(false);
    }
  };

  // Phone-first lookup inside the quick-register panel: if the phone matches
  // an existing customer we reuse them (this is just their other new car),
  // otherwise we only ask for the name and create everything in one click.
  const handleQuickPhoneChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setQuickPhone(digits);
    if (digits.length < 10) {
      setQuickPhoneStatus('idle');
      setQuickCustomer(null);
      return;
    }
    lookupQuickCustomer(digits);
  };

  const lookupQuickCustomer = async (phone) => {
    setQuickPhoneStatus('checking');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/customers/search/phone?phoneNumber=${encodeURIComponent(phone)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setQuickCustomer(data);
          setQuickPhoneStatus('found');
          return;
        }
      }
      setQuickCustomer(null);
      setQuickPhoneStatus('notfound');
    } catch (error) {
      console.error('Error looking up customer:', error);
      setQuickCustomer(null);
      setQuickPhoneStatus('notfound');
    }
  };


  const quickRegisterVehicle = async () => {
    if (!quickCarNo.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Vehicle number is missing', life: 2500 });
      return;
    }
    if (!quickCarType) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please select the vehicle type', life: 2500 });
      return;
    }
    if (!quickCustomer && quickPhone.length !== 10) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Enter a valid 10-digit phone number', life: 2500 });
      return;
    }
    if (!quickCustomer && !quickName.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please enter the customer name', life: 2500 });
      return;
    }

    setQuickSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      let customerIdToUse = quickCustomer?.id || null;

      // Create the customer only when the phone didn't match anyone
      if (!customerIdToUse) {
        const custRes = await fetch(`${API_BASE_URL}/api/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: quickName.trim(), phoneNumber: quickPhone })
        });
        if (custRes.ok) {
          const created = await custRes.json();
          customerIdToUse = created.id;
          setQuickCustomer(created);
        } else {
          // Customer may already exist (duplicate/race) — look them up by phone
          const found = await fetch(`${API_BASE_URL}/api/customers/search/phone?phoneNumber=${quickPhone}`, { headers });
          if (found.ok) {
            const data = await found.json();
            if (data && data.id) {
              customerIdToUse = data.id;
              setQuickCustomer(data);
            }
          }
        }
        if (!customerIdToUse) {
          const error = await custRes.json().catch(() => ({}));
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Could not save customer details', life: 3000 });
          setQuickSaving(false);
          return;
        }
      }

      const carRes = await fetch(`${API_BASE_URL}/api/cars`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          carNo: quickCarNo.trim().toUpperCase(),
          carType: quickCarType,
          model: quickModel.trim() || null,
          customerId: customerIdToUse
        })
      });

      if (carRes.ok) {
        const car = await carRes.json();
        setAllCars((prev) => [...prev.filter((c) => c.id !== car.id), car]);
        applyFoundCar(car);
        toast.current?.show({
          severity: 'success',
          summary: 'Vehicle Registered',
          detail: 'Continue with the bill below',
          life: 2500
        });
      } else {
        const error = await carRes.json().catch(() => ({}));
        if (error.message && error.message.toLowerCase().includes('already exists')) {
          // Car was created meanwhile — just load it
          const exactRes = await fetch(`${API_BASE_URL}/api/cars/search?carNo=${encodeURIComponent(quickCarNo.trim().toUpperCase())}`, { headers });
          if (exactRes.ok) {
            const data = await exactRes.json();
            if (data && data.id) {
              setAllCars((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
              applyFoundCar(data);
            }
          }
        } else {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to register vehicle', life: 3000 });
        }
      }
    } catch (error) {
      console.error('Error registering vehicle:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to register vehicle', life: 3000 });
    } finally {
      setQuickSaving(false);
    }
  };

  // ⚡ Fast Billing - Vehicle suggestions & quick registration handlers
  const applyFoundFastCar = (data) => {
    setCarData(data);
    setCarFound(true);
    setCarId(data.id);
    setCustomerId(data.customerId);
    setVehicleNumber(data.carNo);
    setCustomerName(data.customerName);
    setPhoneNumber(data.customerPhone);
    if (!fastBillingCarType) setFastBillingCarType(data.carType);
    setFastCarNumberQuery('');
    setFastCarSuggestions([]);
    setFastQuickRegVisible(false);

    toast.current?.show({
      severity: 'success',
      summary: `${data.carNo} • ${data.customerName || 'Customer'}`,
      detail: 'Customer & vehicle loaded. Enter amount to continue.',
      life: 2500
    });
  };

  const handleFastCarSelect = (car) => {
    if (car && car.id) applyFoundFastCar(car);
  };

  const handleFastCarComplete = (e) => {
    const q = (e.query || '').trim().toUpperCase();
    if (!q) {
      setFastCarSuggestions([]);
      return;
    }
    setFastCarSuggestions(
      allCars
        .filter(
          (c) =>
            c.carNo?.toUpperCase().includes(q) ||
            c.customerName?.toUpperCase().includes(q) ||
            c.customerPhone?.includes(q)
        )
        .slice(0, 8)
    );
  };

  const openFastQuickRegister = (carNo) => {
    setFastQuickCarNo(carNo);
    setFastQuickRegVisible(true);
    setFastQuickPhone('');
    setFastQuickPhoneStatus('idle');
    setFastQuickCustomer(null);
    setFastQuickName('');
    setFastQuickCarType(null);
    setFastQuickModel('');
    setFastCarSuggestions([]);
    setFastCarNumberQuery('');

    toast.current?.show({
      severity: 'info',
      summary: 'New Vehicle',
      detail: `${carNo} is not in the records — enter the customer's phone to continue`,
      life: 3000
    });
  };

  const handleFastCarInputKey = async (e) => {
    if (e.key !== 'Enter') return;
    const typed = fastCarNumberQuery.trim().toUpperCase();
    if (!typed) return;
    e.preventDefault();

    // 1) exact match from the loaded list
    const exact = allCars.find((c) => c.carNo === typed);
    if (exact) {
      applyFoundFastCar(exact);
      return;
    }

    // 2) confirm against the server (list could be stale)
    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars/search?carNo=${encodeURIComponent(typed)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setAllCars((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
          applyFoundFastCar(data);
          return;
        }
      }
      // 3) genuinely new vehicle -> quick register panel
      openFastQuickRegister(typed);
    } catch (error) {
      console.error('Error checking car number:', error);
      openFastQuickRegister(typed);
    } finally {
      setSearching(false);
    }
  };

  const handleFastQuickPhoneChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setFastQuickPhone(digits);
    if (digits.length < 10) {
      setFastQuickPhoneStatus('idle');
      setFastQuickCustomer(null);
      return;
    }
    lookupFastQuickCustomer(digits);
  };

  const lookupFastQuickCustomer = async (phone) => {
    setFastQuickPhoneStatus('checking');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/customers/search/phone?phoneNumber=${encodeURIComponent(phone)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setFastQuickCustomer(data);
          setFastQuickPhoneStatus('found');
          return;
        }
      }
      setFastQuickCustomer(null);
      setFastQuickPhoneStatus('notfound');
    } catch (error) {
      console.error('Error looking up customer:', error);
      setFastQuickCustomer(null);
      setFastQuickPhoneStatus('notfound');
    }
  };

  const fastQuickRegisterVehicle = async () => {
    if (!fastQuickCarNo.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Vehicle number is missing', life: 2500 });
      return;
    }
    if (!fastQuickCarType) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please select the vehicle type', life: 2500 });
      return;
    }
    if (!fastQuickCustomer && fastQuickPhone.length !== 10) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Enter a valid 10-digit phone number', life: 2500 });
      return;
    }
    if (!fastQuickCustomer && !fastQuickName.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please enter the customer name', life: 2500 });
      return;
    }

    setFastQuickSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      let customerIdToUse = fastQuickCustomer?.id || null;

      // Create the customer only when the phone didn't match anyone
      if (!customerIdToUse) {
        const custRes = await fetch(`${API_BASE_URL}/api/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: fastQuickName.trim(), phoneNumber: fastQuickPhone })
        });
        if (custRes.ok) {
          const created = await custRes.json();
          customerIdToUse = created.id;
          setFastQuickCustomer(created);
        } else {
          // Customer may already exist (duplicate/race) — look them up by phone
          const found = await fetch(`${API_BASE_URL}/api/customers/search/phone?phoneNumber=${fastQuickPhone}`, { headers });
          if (found.ok) {
            const data = await found.json();
            if (data && data.id) {
              customerIdToUse = data.id;
              setFastQuickCustomer(data);
            }
          }
        }
        if (!customerIdToUse) {
          const error = await custRes.json().catch(() => ({}));
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Could not save customer details', life: 3000 });
          setFastQuickSaving(false);
          return;
        }
      }

      const carRes = await fetch(`${API_BASE_URL}/api/cars`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          carNo: fastQuickCarNo.trim().toUpperCase(),
          carType: fastQuickCarType,
          model: fastQuickModel.trim() || null,
          customerId: customerIdToUse
        })
      });

      if (carRes.ok) {
        const car = await carRes.json();
        setAllCars((prev) => [...prev.filter((c) => c.id !== car.id), car]);
        applyFoundFastCar(car);
        toast.current?.show({
          severity: 'success',
          summary: 'Vehicle Registered',
          detail: 'Continue with the bill below',
          life: 2500
        });
      } else {
        const error = await carRes.json().catch(() => ({}));
        if (error.message && error.message.toLowerCase().includes('already exists')) {
          // Car was created meanwhile — just load it
          const exactRes = await fetch(`${API_BASE_URL}/api/cars/search?carNo=${encodeURIComponent(fastQuickCarNo.trim().toUpperCase())}`, { headers });
          if (exactRes.ok) {
            const data = await exactRes.json();
            if (data && data.id) {
              setAllCars((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
              applyFoundFastCar(data);
            }
          }
        } else {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to register vehicle', life: 3000 });
        }
      }
    } catch (error) {
      console.error('Error registering vehicle:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to register vehicle', life: 3000 });
    } finally {
      setFastQuickSaving(false);
    }
  };

  // Fast Billing - Create bill with manual amount entry
  const handleFastBillingSubmit = async (e) => {
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

    if (!phoneNumber.trim() || phoneNumber.length !== 10) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter a valid 10-digit phone number',
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

    if (!fastBillingAmount || parseFloat(fastBillingAmount) <= 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter a valid amount',
        life: 3000
      });
      return;
    }

    if (!fastBillingPaymentMethod) {
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

      // Get outletId
      let outletIdToSend = selectedOutlet;
      if (!outletIdToSend && user?.role === 'CASHIER') {
        const cashierOutletId = localStorage.getItem('outletId');
        if (cashierOutletId) {
          outletIdToSend = parseInt(cashierOutletId);
        }
      }

      if (!outletIdToSend) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No outlet selected',
          life: 3000
        });
        return;
      }

      // Check if customer exists by phone
      let customerIdToUse = customerId;
      let carIdToUse = carId;

      if (!customerIdToUse) {
        // Search for customer by phone
        const customerRes = await fetch(`${API_BASE_URL}/api/customers/search/phone?phoneNumber=${phoneNumber}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (customerRes.ok) {
          const customerData = await customerRes.json();
          if (customerData && customerData.id) {
            customerIdToUse = customerData.id;
            // Check if vehicle exists for this customer
            const carRes = await fetch(`${API_BASE_URL}/api/cars/search?carNo=${encodeURIComponent(vehicleNumber)}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (carRes.ok) {
              const carData = await carRes.json();
              if (carData && carData.id && carData.customerId === customerData.id) {
                carIdToUse = carData.id;
              }
            }
          }
        }

        // If customer not found, create new customer
        if (!customerIdToUse) {
          const createCustomerRes = await fetch(`${API_BASE_URL}/api/customers`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: customerName.trim(), phoneNumber })
          });

          if (createCustomerRes.ok) {
            const created = await createCustomerRes.json();
            customerIdToUse = created.id;
          } else {
            const error = await createCustomerRes.json().catch(() => ({}));
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Could not create customer', life: 3000 });
            setSubmitting(false);
            return;
          }
        }
      }

      // If car not found, create new car
      if (!carIdToUse) {
        const createCarRes = await fetch(`${API_BASE_URL}/api/cars`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            carNo: vehicleNumber.trim().toUpperCase(),
            carType: fastBillingCarType || 'HATCHBACK',
            model: null,
            customerId: customerIdToUse
          })
        });

        if (createCarRes.ok) {
          const created = await createCarRes.json();
          carIdToUse = created.id;
          setAllCars((prev) => [...prev.filter((c) => c.id !== created.id), created]);
        } else {
          const error = await createCarRes.json().catch(() => ({}));
          if (error.message && error.message.toLowerCase().includes('already exists')) {
            const exactRes = await fetch(`${API_BASE_URL}/api/cars/search?carNo=${encodeURIComponent(vehicleNumber.trim().toUpperCase())}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (exactRes.ok) {
              const data = await exactRes.json();
              if (data && data.id) {
                carIdToUse = data.id;
              }
            }
          } else {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to create vehicle', life: 3000 });
            setSubmitting(false);
            return;
          }
        }
      }

      // For fast billing, we create a bill with ONLY the manual amount
      // No package price should be added - the manual amount IS the total
      const amount = parseFloat(fastBillingAmount);

      const billData = {
        customerId: customerIdToUse,
        outletId: outletIdToSend,
        carId: carIdToUse,
        // Default manual package (price ₹0) for fast billing — manual amount IS the total
        outletPackageId: fastBillingPackageId,
        discount: 0,
        extraIds: [],
        paymentMethod: fastBillingPaymentMethod,
        createdBy: user?.id,
        // Send manual amount as the base amount, not as additional charge
        // The backend uses this as the total when manualAmount is provided
        additionalCharges: [],
        couponId: null,
        // Include manual amount for backend to use as total
        manualAmount: amount
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
        setLastBill(result || { totalAmount: amount });

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
      console.error('Error creating fast bill:', error);
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
    setCarNumberQuery('');
    setCarFound(false);
    setCarData(null);
    setCarSuggestions([]);
    setQuickRegVisible(false);
    setQuickCarNo('');
    setQuickPhone('');
    setQuickPhoneStatus('idle');
    setQuickCustomer(null);
    setQuickName('');
    setQuickCarType(null);
    setQuickModel('');
    setAdditionalCharges([]);
    setNewCharge({ title: '', amount: 0 });
    setCarId(null);
    setCustomerId(null);
    setCouponCode('');
    setSelectedCoupon(null);
    setCouponDiscount(0);
    setCouponValidated(false);
    // Fast billing state
    setFastBillingAmount('');
    setFastBillingCarType(null);
    setFastBillingPaymentMethod('CASH');
    setFastCarNumberQuery('');
    setFastCarSuggestions([]);
    setFastQuickRegVisible(false);
    setFastQuickCarNo('');
    setFastQuickPhone('');
    setFastQuickPhoneStatus('idle');
    setFastQuickCustomer(null);
    setFastQuickName('');
    setFastQuickCarType(null);
    setFastQuickModel('');
  };

  const formatCurrency = (value=0) => {
    return `₹${value.toFixed(2) }`;
  };

  return (
    <div className="flex flex-col h-full">
      <Toast ref={toast} />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4 flex-shrink-0">
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

          {/* Fast Billing Toggle */}
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${fastBillingMode ? 'text-green-600' : 'text-gray-600'}`}>
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${
                    fastBillingMode ? 'bg-green-500' : 'bg-gray-300'
                  }`} onClick={() => setFastBillingMode(!fastBillingMode)}>
                    <div className={`absolute top-0.5 transition-transform duration-200 ${
                      fastBillingMode ? 'translate-x-6' : 'translate-x-0.5'
                    } w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center`}>
                      <i className={`text-xs ${fastBillingMode ? 'pi pi-check text-green-600' : 'pi pi-bolt text-gray-600'}`}></i>
                    </div>
                  </div>
                </div>
                <div>
                  <p className={`font-semibold text-sm ${fastBillingMode ? 'text-green-700' : 'text-gray-700'}`}>
                    {fastBillingMode ? 'Fast Billing' : 'Package Billing'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fastBillingMode
                      ? 'Manual amount entry with car details'
                      : 'Select packages and extras'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col p-4 sm:p-6">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden flex-1 flex flex-col">
          <form onSubmit={fastBillingMode ? handleFastBillingSubmit : handleSubmit} className="flex flex-col h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0">
              {/* Left Side - Form Details */}
              <div className="lg:col-span-9 p-3 sm:p-5 lg:p-6 order-2 lg:order-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4">
                  {/* ⚡ Vehicle Search — live suggestions as you type */}
                  {!fastBillingMode && (
                    <>
                      <div className="col-span-1 sm:col-span-2">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2.5 sm:p-4 border-l-4 border-blue-500 mb-3 sm:mb-4">
                          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <i className="pi pi-bolt text-blue-600"></i>
                            Quick Vehicle Lookup
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">Start typing the car number, customer name or phone — matching records appear instantly</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                          <i className="pi pi-hashtag text-blue-600"></i>
                          Vehicle Registration Number *
                        </label>
                        <div className="flex gap-2">
                          <AutoComplete
                            value={carNumberQuery}
                            suggestions={carSuggestions}
                            completeMethod={handleCarComplete}
                            field="carNo"
                            inputId="billCarNumber"
                            placeholder="e.g., UP32AB1234 or customer name / phone"
                            className="flex-1"
                            inputClassName="w-full font-mono border border-gray-300 p-3 rounded-lg text-lg tracking-wide uppercase"
                            loading={searching}
                            onChange={(e) => {
                              const val = e.value;
                              if (val && typeof val === 'object') {
                                handleCarSelect(val);
                              } else {
                                setCarNumberQuery((val || '').toUpperCase());
                              }
                            }}
                            onKeyDown={handleCarInputKey}
                            itemTemplate={(car) => (
                              <div className="flex items-center justify-between w-full py-1 gap-3">
                                <span className="font-mono font-bold text-gray-800">{car.carNo}</span>
                                <span className="text-xs text-gray-500 truncate">
                                  {car.customerName} · {car.customerPhone} · {car.carType}
                                </span>
                              </div>
                            )}
                          />
                          <Button
                            type="button"
                            label="New Vehicle"
                            icon="pi pi-plus"
                            onClick={() => {
                              const typed = carNumberQuery.trim().toUpperCase();
                              if (!typed) {
                                toast.current?.show({
                                  severity: 'warn',
                                  summary: 'Warning',
                                  detail: 'Type the car number first, then click New Vehicle',
                                  life: 2500
                                });
                                return;
                              }
                              openQuickRegister(typed);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                          />
                        </div>
                        {carNumberQuery && !carFound && carSuggestions.length === 0 && (
                          <small className="text-amber-600 block flex items-center gap-1">
                            <i className="pi pi-info-circle"></i>
                            No match in records — press Enter or click "New Vehicle" to register it
                          </small>
                        )}
                      </div>

                      {/* ⚡ Quick Vehicle Registration — one inline panel instead of two modals */}
                      {quickRegVisible && (
                        <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-200 rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 rounded-xl shadow-md">
                                <i className="pi pi-car text-xl text-white"></i>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800">Register Vehicle</h4>
                                <p className="text-xs text-gray-500">
                                  New vehicle <span className="font-mono font-bold text-purple-700">{quickCarNo}</span> — check the customer&apos;s phone first
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              icon="pi pi-times"
                              rounded
                              text
                              severity="secondary"
                              onClick={() => setQuickRegVisible(false)}
                              disabled={quickSaving}
                            />
                          </div>

                          {/* Step 1 — Phone number (auto-checks existing customers) */}
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                              <i className="pi pi-phone text-purple-600"></i>
                              Customer Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative max-w-xs">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">+91</span>
                              <input
                                type="text"
                                value={quickPhone}
                                onChange={(e) => handleQuickPhoneChange(e.target.value)}
                                placeholder="9876543210"
                                maxLength={10}
                                autoFocus
                                className="w-full border border-gray-300 pl-14 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              />
                            </div>
                            {quickPhoneStatus === 'checking' && (
                              <small className="text-blue-600 block mt-1.5 flex items-center gap-1">
                                <i className="pi pi-spin pi-spinner"></i> Checking existing customers…
                              </small>
                            )}
                          </div>

                          {/* Existing customer found → reuse them, no re-typing */}
                          {quickPhoneStatus === 'found' && quickCustomer && (
                            <div className="space-y-2">
                              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 flex items-start gap-3">
                                <i className="pi pi-check-circle text-green-600 text-lg mt-0.5"></i>
                                <div className="text-sm">
                                  <p className="font-semibold text-green-800">
                                    Existing customer: {quickCustomer.name} · +91 {quickCustomer.phoneNumber}
                                  </p>
                                  <p className="text-green-700 text-xs mt-0.5">Customer matched — this is their new car. Just pick the vehicle type below.</p>
                                </div>
                              </div>
                              {allCars.filter((c) => c.customerId === quickCustomer.id).length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600">Their vehicles:</span>
                                  {allCars
                                    .filter((c) => c.customerId === quickCustomer.id)
                                    .map((c) => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => applyFoundCar(c)}
                                        className="px-3 py-1 bg-white border border-green-300 hover:border-green-500 hover:bg-green-50 rounded-full text-xs font-mono font-bold text-gray-700 transition-all cursor-pointer"
                                        title={`Bill ${c.carNo} directly`}
                                      >
                                        {c.carNo} <i className="pi pi-arrow-right text-[10px] text-green-600 ml-1"></i>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Not found → only then ask for the name */}
                          {quickPhoneStatus === 'notfound' && (
                            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 space-y-2">
                              <p className="text-sm text-amber-800 flex items-center gap-2">
                                <i className="pi pi-user-plus"></i>
                                New customer — enter their name to create the record
                              </p>
                              <InputText
                                value={quickName}
                                onChange={(e) => setQuickName(e.target.value)}
                                placeholder="e.g., John Doe"
                                className="w-full max-w-xs border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              />
                            </div>
                          )}

                          {/* Step 2 — Vehicle details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                                <i className="pi pi-sitemap text-purple-600"></i>
                                Vehicle Type <span className="text-red-500">*</span>
                              </label>
                              <Dropdown
                                value={quickCarType}
                                onChange={(e) => setQuickCarType(e.value)}
                                options={carTypes}
                                placeholder="Select vehicle type"
                                className="w-full border border-gray-300"
                                panelClassName="custom-dropdown-panel"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                                <i className="pi pi-tag text-purple-600"></i>
                                Vehicle Model <span className="text-gray-400">(Optional)</span>
                              </label>
                              <InputText
                                value={quickModel}
                                onChange={(e) => setQuickModel(e.target.value)}
                                placeholder="e.g., Creta, Swift, City"
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                            <Button
                              label="Cancel"
                              icon="pi pi-times"
                              onClick={() => setQuickRegVisible(false)}
                              className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
                              outlined
                              disabled={quickSaving}
                            />
                            <Button
                              label={quickPhoneStatus === 'found' ? 'Save Vehicle & Continue' : 'Create Customer & Vehicle'}
                              icon="pi pi-check"
                              onClick={quickRegisterVehicle}
                              loading={quickSaving}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ⚡ Fast Billing Mode - Manual Amount Entry with Vehicle Lookup */}
                  {fastBillingMode && (
                    <>
                      {/* Quick Vehicle Lookup - Live suggestions */}
                      <div className="col-span-1 sm:col-span-2">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-2.5 sm:p-4 border-l-4 border-amber-500 mb-3 sm:mb-4">
                          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <i className="pi pi-bolt text-amber-600"></i>
                            Quick Vehicle Lookup
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">Start typing the car number, customer name or phone — matching records appear instantly</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                          <i className="pi pi-hashtag text-amber-600"></i>
                          Vehicle Registration Number *
                        </label>
                        <div className="flex gap-2">
                          <AutoComplete
                            value={fastCarNumberQuery}
                            suggestions={fastCarSuggestions}
                            completeMethod={handleFastCarComplete}
                            field="carNo"
                            inputId="fastBillCarNumber"
                            placeholder="e.g., UP32AB1234 or customer name / phone"
                            className="flex-1"
                            inputClassName="w-full font-mono border border-gray-300 p-3 rounded-lg text-lg tracking-wide uppercase"
                            loading={searching}
                            onChange={(e) => {
                              const val = e.value;
                              if (val && typeof val === 'object') {
                                handleFastCarSelect(val);
                              } else {
                                setFastCarNumberQuery((val || '').toUpperCase());
                              }
                            }}
                            onKeyDown={handleFastCarInputKey}
                            itemTemplate={(car) => (
                              <div className="flex items-center justify-between w-full py-1 gap-3">
                                <span className="font-mono font-bold text-gray-800">{car.carNo}</span>
                                <span className="text-xs text-gray-500 truncate">
                                  {car.customerName} · {car.customerPhone} · {car.carType}
                                </span>
                              </div>
                            )}
                          />
                          <Button
                            type="button"
                            label="New Vehicle"
                            icon="pi pi-plus"
                            onClick={() => {
                              const typed = fastCarNumberQuery.trim().toUpperCase();
                              if (!typed) {
                                toast.current?.show({
                                  severity: 'warn',
                                  summary: 'Warning',
                                  detail: 'Type the car number first, then click New Vehicle',
                                  life: 2500
                                });
                                return;
                              }
                              openFastQuickRegister(typed);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                          />
                        </div>
                        {fastCarNumberQuery && !carFound && fastCarSuggestions.length === 0 && (
                          <small className="text-amber-600 block flex items-center gap-1">
                            <i className="pi pi-info-circle"></i>
                            No match in records — press Enter or click "New Vehicle" to register it
                          </small>
                        )}
                      </div>

                      {/* ⚡ Quick Vehicle Registration — inline panel */}
                      {fastQuickRegVisible && (
                        <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-200 rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 rounded-xl shadow-md">
                                <i className="pi pi-car text-xl text-white"></i>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800">Register Vehicle</h4>
                                <p className="text-xs text-gray-500">
                                  New vehicle <span className="font-mono font-bold text-purple-700">{fastQuickCarNo}</span> — check the customer&apos;s phone first
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              icon="pi pi-times"
                              rounded
                              text
                              severity="secondary"
                              onClick={() => setFastQuickRegVisible(false)}
                              disabled={fastQuickSaving}
                            />
                          </div>

                          {/* Step 1 — Phone number (auto-checks existing customers) */}
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                              <i className="pi pi-phone text-purple-600"></i>
                              Customer Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative max-w-xs">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">+91</span>
                              <input
                                type="text"
                                value={fastQuickPhone}
                                onChange={(e) => handleFastQuickPhoneChange(e.target.value)}
                                placeholder="9876543210"
                                maxLength={10}
                                autoFocus
                                className="w-full border border-gray-300 pl-14 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              />
                            </div>
                            {fastQuickPhoneStatus === 'checking' && (
                              <small className="text-blue-600 block mt-1.5 flex items-center gap-1">
                                <i className="pi pi-spin pi-spinner"></i> Checking existing customers…
                              </small>
                            )}
                          </div>

                          {/* Existing customer found → reuse them, no re-typing */}
                          {fastQuickPhoneStatus === 'found' && fastQuickCustomer && (
                            <div className="space-y-2">
                              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 flex items-start gap-3">
                                <i className="pi pi-check-circle text-green-600 text-lg mt-0.5"></i>
                                <div className="text-sm">
                                  <p className="font-semibold text-green-800">
                                    Existing customer: {fastQuickCustomer.name} · +91 {fastQuickCustomer.phoneNumber}
                                  </p>
                                  <p className="text-green-700 text-xs mt-0.5">Customer matched — this is their new car. Just pick the vehicle type below.</p>
                                </div>
                              </div>
                              {allCars.filter((c) => c.customerId === fastQuickCustomer.id).length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600">Their vehicles:</span>
                                  {allCars
                                    .filter((c) => c.customerId === fastQuickCustomer.id)
                                    .map((c) => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => applyFoundFastCar(c)}
                                        className="px-3 py-1 bg-white border border-green-300 hover:border-green-500 hover:bg-green-50 rounded-full text-xs font-mono font-bold text-gray-700 transition-all cursor-pointer"
                                        title={`Bill ${c.carNo} directly`}
                                      >
                                        {c.carNo} <i className="pi pi-arrow-right text-[10px] text-green-600 ml-1"></i>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Not found → only then ask for the name */}
                          {fastQuickPhoneStatus === 'notfound' && (
                            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 space-y-2">
                              <p className="text-sm text-amber-800 flex items-center gap-2">
                                <i className="pi pi-user-plus"></i>
                                New customer — enter their name to create the record
                              </p>
                              <InputText
                                value={fastQuickName}
                                onChange={(e) => setFastQuickName(e.target.value)}
                                placeholder="e.g., John Doe"
                                className="w-full max-w-xs border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              />
                            </div>
                          )}

                          {/* Step 2 — Vehicle details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                                <i className="pi pi-sitemap text-purple-600"></i>
                                Vehicle Type <span className="text-red-500">*</span>
                              </label>
                              <Dropdown
                                value={fastQuickCarType}
                                onChange={(e) => setFastQuickCarType(e.value)}
                                options={carTypes}
                                placeholder="Select vehicle type"
                                className="w-full border border-gray-300"
                                panelClassName="custom-dropdown-panel"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                                <i className="pi pi-tag text-purple-600"></i>
                                Vehicle Model <span className="text-gray-400">(Optional)</span>
                              </label>
                              <InputText
                                value={fastQuickModel}
                                onChange={(e) => setFastQuickModel(e.target.value)}
                                placeholder="e.g., Creta, Swift, City"
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                            <Button
                              label="Cancel"
                              icon="pi pi-times"
                              onClick={() => setFastQuickRegVisible(false)}
                              className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
                              outlined
                              disabled={fastQuickSaving}
                            />
                            <Button
                              label={fastQuickPhoneStatus === 'found' ? 'Save Vehicle & Continue' : 'Create Customer & Vehicle'}
                              icon="pi pi-check"
                              onClick={fastQuickRegisterVehicle}
                              loading={fastQuickSaving}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* Manual Amount Entry Form */}
                      <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-amber-300 rounded-xl p-4 sm:p-6 space-y-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-xl shadow-md">
                            <i className="pi pi-bolt text-xl text-white"></i>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">Fast Billing - Manual Entry</h3>
                            <p className="text-xs text-gray-600 mt-0.5">Enter billing details manually without selecting packages</p>
                          </div>
                        </div>

                        {/* Outlet Selection for ADMIN in Fast Billing Mode */}
                        {user?.role === 'ADMIN' && (
                          <div className="space-y-1.5 col-span-1 sm:col-span-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                              <i className="pi pi-map-marker text-amber-600"></i>
                              Select Outlet *
                            </label>
                            <Dropdown
                              value={selectedOutlet}
                              onChange={(e) => {
                                console.log('Fast Billing - Outlet selected:', e.value);
                                setSelectedOutlet(e.value);
                              }}
                              options={outlets}
                              placeholder="Select outlet"
                              className="w-full border-2 border-amber-200 focus:border-amber-500"
                              filter
                            />
                            <small className="text-gray-500 block mt-1">📍 Available outlets: {outlets.length}</small>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Customer Name */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                              <i className="pi pi-user text-amber-600"></i>
                              Customer Name <span className="text-red-500">*</span>
                            </label>
                            <InputText
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="e.g., John Doe"
                              className="w-full border-2 border-amber-200 focus:border-amber-500 p-3 rounded-lg transition-all"
                            />
                          </div>

                          {/* Phone Number */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                              <i className="pi pi-phone text-amber-600"></i>
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative max-w-full">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">+91</span>
                              <InputText
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="9876543210"
                                maxLength={10}
                                className="w-full border-2 border-amber-200 focus:border-amber-500 pl-14 pr-4 py-3 rounded-lg transition-all"
                              />
                            </div>
                          </div>

                          {/* Vehicle Number */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                              <i className="pi pi-car text-amber-600"></i>
                              Vehicle Number <span className="text-red-500">*</span>
                            </label>
                            <InputText
                              value={vehicleNumber}
                              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                              placeholder="e.g., UP32AB1234"
                              className="w-full font-mono border-2 border-amber-200 focus:border-amber-500 p-3 rounded-lg text-lg tracking-wide uppercase transition-all"
                            />
                          </div>

                          {/* Car Type (Optional) */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                              <i className="pi pi-sitemap text-amber-600"></i>
                              Car Type <span className="text-gray-400">(Optional)</span>
                            </label>
                            <Dropdown
                              value={fastBillingCarType}
                              onChange={(e) => setFastBillingCarType(e.value)}
                              options={carTypes}
                              placeholder="Select car type"
                              className="w-full border-2 border-amber-200 focus:border-amber-500"
                              panelClassName="custom-dropdown-panel"
                            />
                          </div>

                          {/* Amount */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                              <i className="pi pi-indian-rupee text-amber-600"></i>
                              Amount (₹) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                                <i className="pi pi-indian-rupee text-amber-500 text-lg"></i>
                              </div>
                              <InputNumber
                                value={fastBillingAmount ? parseFloat(fastBillingAmount) : null}
                                onValueChange={(e) => setFastBillingAmount(e.value ? e.value.toString() : '')}
                                placeholder="0.00"
                                className="w-full"
                                inputClassName="pl-10 pr-4 py-3 border-2 border-amber-200 focus:border-amber-500 rounded-lg text-lg font-semibold transition-all"
                                mode="decimal"
                                minFractionDigits={2}
                                maxFractionDigits={2}
                                min={0}
                              />
                            </div>
                          </div>

                          {/* Payment Method - Radio Buttons */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                              <i className="pi pi-wallet text-amber-600"></i>
                              Payment Method <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-4">
                              {fastBillingPaymentMethods.map((method) => (
                                <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="fastBillingPaymentMethod"
                                    value={method.value}
                                    checked={fastBillingPaymentMethod === method.value}
                                    onChange={(e) => setFastBillingPaymentMethod(e.target.value)}
                                    className="w-5 h-5 text-amber-600 border-amber-300 focus:ring-amber-500 focus:ring-2 rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700">{method.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Outlet Selection - Admin Only (First) - Only in Package Mode */}
                  {!fastBillingMode && user?.role === 'ADMIN' && (
                    <>
                      <div className="col-span-1 sm:col-span-2">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2.5 sm:p-4 border-l-4 border-purple-500 mb-3 mt-3 sm:mb-4 sm:mt-4">
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

                  {/* Car Type for CASHIER - Only in Package Mode */}
                  {!fastBillingMode && user?.role === 'CASHIER' && (
                    <div className="col-span-1 sm:col-span-2">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2.5 sm:p-4 border-l-4 border-purple-500 shadow-sm mb-3 sm:mb-4">
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

                  {/* Customer Information - Show in both modes but read-only in package mode when car found */}
                  <div className="col-span-1 sm:col-span-2 mt-3 sm:mt-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2.5 sm:p-4 border-l-4 border-green-500 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-green-500 p-2 rounded-full">
                          <i className="pi pi-user text-white"></i>
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">
                          {!fastBillingMode ? 'Customer & Vehicle Details' : 'Customer & Vehicle Details'}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {/* Customer Name */}
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <i className="pi pi-user text-green-600"></i>
                            <span className="font-medium">Customer Name</span>
                          </div>
                          {!fastBillingMode ? (
                            <div className="text-sm font-bold text-gray-900 truncate" title={customerName || 'Not set'}>
                              {customerName || <span className="text-gray-400 italic">Not set</span>}
                            </div>
                          ) : (
                            <InputText
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="e.g., John Doe"
                              className="w-full border-2 border-amber-200 focus:border-amber-500 p-2 rounded-lg text-sm"
                            />
                          )}
                        </div>

                        {/* Phone Number */}
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <i className="pi pi-phone text-green-600"></i>
                            <span className="font-medium">Phone Number</span>
                          </div>
                          {!fastBillingMode ? (
                            <div className="text-sm font-bold text-gray-900">
                              {phoneNumber ? `+91 ${phoneNumber}` : <span className="text-gray-400 italic">Not set</span>}
                            </div>
                          ) : (
                            <div className="relative max-w-full">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">+91</span>
                              <InputText
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="9876543210"
                                maxLength={10}
                                className="w-full border-2 border-amber-200 focus:border-amber-500 pl-14 pr-4 py-2 rounded-lg text-sm transition-all"
                              />
                            </div>
                          )}
                        </div>

                        {/* Vehicle Number */}
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <i className="pi pi-car text-green-600"></i>
                            <span className="font-medium">Vehicle Number</span>
                          </div>
                          {!fastBillingMode ? (
                            <div className="text-sm font-bold text-gray-900 font-mono tracking-wider">
                              {vehicleNumber || <span className="text-gray-400 italic font-sans">Not set</span>}
                            </div>
                          ) : (
                            <InputText
                              value={vehicleNumber}
                              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                              placeholder="e.g., UP32AB1234"
                              className="w-full font-mono border-2 border-amber-200 focus:border-amber-500 p-2 rounded-lg text-sm tracking-wide uppercase transition-all"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Selection - Only in Package Mode */}
                  {!fastBillingMode && (
                    <>
                      <div className="col-span-1 sm:col-span-2 mt-3 sm:mt-4">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-2.5 sm:p-4 border-l-4 border-blue-500 mb-3 sm:mb-4">
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
                            <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
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
                                  <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-orange-200 shadow-sm">
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
                                    <div className="mt-3 sm:mt-4 pt-3 border-t-2 border-orange-200 flex items-center justify-between">
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
                    </>
                  )}

                  {/* Payment Details - Only in Package Mode */}
                  {!fastBillingMode && (
                    <>
                      <div className="col-span-1 sm:col-span-2 mt-3 sm:mt-4">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-2.5 sm:p-4 border-l-4 border-indigo-500 mb-3 sm:mb-4">
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
                                className="bg-purple-600 hover:bg-purple-700 border-0 text-white px-4 sm:px-6 py-2.5 sm:py-3"
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
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="col-span-1 sm:col-span-2 mt-4 sm:mt-6 pt-4 border-t-2 border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="submit"
                        label={fastBillingMode
                          ? (submitting ? "Creating Fast Bill..." : "Create Fast Bill")
                          : (submitting ? "Creating Bill..." : "Create Bill")}
                        className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-0 text-white py-3 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all"
                        loading={submitting}
                        disabled={submitting}
                      />
                      <Button
                        type="button"
                        label="Reset Form"
                        icon="pi pi-refresh"
                        className="w-full sm:w-auto bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 border-0 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                        onClick={resetForm}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Bill Summary */}
              <div className="lg:col-span-3 bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-5 lg:p-6 border-b lg:border-b-0 lg:border-l-2 border-gray-200 order-1 lg:order-2 overflow-y-auto flex-1 lg:flex-none">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
                      <i className="pi pi-calculator text-blue-600 text-lg"></i>
                      {fastBillingMode ? 'Fast Bill Summary' : 'Bill Summary'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {fastBillingMode
                        ? 'Manual amount entry summary'
                        : 'Invoice breakdown and total'}
                    </p>
                  </div>

                  {!fastBillingMode && (
                    <>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-gray-600 text-xs mb-1 font-medium">💼 Package Amount</div>
                          <div className="font-bold text-xl text-gray-900">{formatCurrency(packageAmount)}</div>
                        </div>

                        <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-gray-600 text-xs mb-1 font-medium">✨ Extras Amount</div>
                          <div className="font-bold text-xl text-gray-900">{formatCurrency(extrasAmount)}</div>
                        </div>

                        {additionalCharges.length > 0 && (
                          <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-gray-600 text-xs mb-1 font-medium">➕ Additional Charges</div>
                            <div className="font-bold text-xl text-gray-900">
                              {formatCurrency(additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0))}
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-gray-400 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-gray-600 text-xs mb-1 font-medium">📊 Subtotal</div>
                          <div className="font-bold text-xl text-gray-900">{formatCurrency(totalAmount)}</div>
                        </div>

                        <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-gray-600 text-xs mb-1 font-medium">🎫 Discount</div>
                          <div className="font-bold text-xl text-red-600">-{formatCurrency(discount || 0)}</div>
                        </div>

                        {couponValidated && couponDiscount > 0 && (
                          <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-gray-600 text-xs mb-1 font-medium">🎟️ Coupon Discount ({couponCode})</div>
                            <div className="font-bold text-xl text-purple-600">-{formatCurrency(couponDiscount)}</div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 sm:p-5 mt-3 sm:mt-4 shadow-lg">
                        <div className="text-green-100 text-xs font-semibold mb-1 uppercase tracking-wide">💰 Total Amount</div>
                        <div className="text-white font-bold text-3xl">{formatCurrency(finalAmount)}</div>
                      </div>
                    </>
                  )}

                  {fastBillingMode && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-amber-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-gray-600 text-xs mb-1 font-medium">⚡ Fast Bill Amount</div>
                        <div className="font-bold text-xl text-gray-900">{formatCurrency(fastBillingAmount ? parseFloat(fastBillingAmount) : 0)}</div>
                      </div>

                      <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-gray-400 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-gray-600 text-xs mb-1 font-medium">💳 Payment Method</div>
                        <div className="font-bold text-xl text-gray-900">
                          {fastBillingPaymentMethods.find(m => m.value === fastBillingPaymentMethod)?.label || fastBillingPaymentMethod}
                        </div>
                      </div>

                      {fastBillingCarType && (
                        <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-gray-600 text-xs mb-1 font-medium">🚗 Car Type</div>
                          <div className="font-bold text-xl text-gray-900">
                            {carTypes.find(t => t.value === fastBillingCarType)?.label || fastBillingCarType}
                          </div>
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 sm:p-5 mt-3 sm:mt-4 shadow-lg">
                        <div className="text-amber-100 text-xs font-semibold mb-1 uppercase tracking-wide">💰 Total Amount</div>
                        <div className="text-white font-bold text-3xl">{formatCurrency(fastBillingAmount ? parseFloat(fastBillingAmount) : 0)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>


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
              <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(lastBill.totalAmount ?? finalAmount ?? (fastBillingAmount ? parseFloat(fastBillingAmount) : 0))}</p>
              <p className="text-xs text-gray-500 mt-1">Paid via {lastBill.paymentMethod || paymentMethod || fastBillingPaymentMethod}</p>
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