import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/utils/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      outletId,
      carId,
      outletPackageId,
      extraIds = [],
      additionalCharges = [],
      manualDiscount = 0
    } = body;

    if (!code || !outletId || !carId) {
      return NextResponse.json(
        { message: 'Coupon code, outletId, and carId are required' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const today = new Date().toISOString().split('T')[0];

    // Find the coupon
    const coupon = await db.get(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM CouponUsage cu WHERE cu.couponId = c.id) as usedCount
       FROM Coupon c
       WHERE c.code = ? AND c.active = 1`,
      [code.toUpperCase()]
    );

    if (!coupon) {
      return NextResponse.json(
        { valid: false, message: 'Coupon not found or inactive' },
        { status: 200 }
      );
    }

    // Check if coupon is expired
    if (coupon.validTill < today) {
      return NextResponse.json(
        { valid: false, message: 'Coupon has expired' },
        { status: 200 }
      );
    }

    // Check max uses
    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, message: 'Coupon usage limit reached' },
        { status: 200 }
      );
    }

    // Check outlet scope
    if (coupon.outletId && coupon.outletId != outletId) {
      return NextResponse.json(
        { valid: false, message: 'Coupon not valid for this outlet' },
        { status: 200 }
      );
    }

    // Check car scope
    if (coupon.carId && coupon.carId != carId) {
      return NextResponse.json(
        { valid: false, message: 'Coupon not valid for this vehicle' },
        { status: 200 }
      );
    }

    // Check oncePerCar rule
    if (coupon.oncePerCar) {
      const previousUsage = await db.get(
        'SELECT id FROM CouponUsage WHERE couponId = ? AND carId = ?',
        [coupon.id, carId]
      );
      if (previousUsage) {
        return NextResponse.json(
          { valid: false, message: 'This coupon has already been used for this vehicle' },
          { status: 200 }
        );
      }
    }

    // Calculate order total
    let orderTotal = 0;

    // Add package amount
    if (outletPackageId) {
      const packageData = await db.get(
        'SELECT price FROM OutletPackage WHERE id = ?',
        [outletPackageId]
      );
      if (packageData) {
        orderTotal += packageData.price;
      }
    }

    // Add extras amount
    if (extraIds && extraIds.length > 0) {
      const placeholders = extraIds.map(() => '?').join(',');
      const extras = await db.all(
        `SELECT SUM(price) as total FROM Extra WHERE id IN (${placeholders})`,
        extraIds
      );
      if (extras && extras[0] && extras[0].total) {
        orderTotal += extras[0].total;
      }
    }

    // Add additional charges
    if (additionalCharges && additionalCharges.length > 0) {
      const additionalTotal = additionalCharges.reduce(
        (sum, charge) => sum + (charge.amount || 0),
        0
      );
      orderTotal += additionalTotal;
    }

    // Calculate coupon discount
    let couponDiscount = 0;
    if (coupon.discountType === 'PERCENT') {
      // Percentage discount - calculate before manual discount
      couponDiscount = Math.round((orderTotal * coupon.discountValue) / 100);
    } else if (coupon.discountType === 'FLAT') {
      // Flat amount discount
      couponDiscount = coupon.discountValue;
      // Make sure discount doesn't exceed order total
      if (couponDiscount > orderTotal) {
        couponDiscount = orderTotal;
      }
    }

    return NextResponse.json(
      {
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        couponDiscount: couponDiscount,
        orderTotal: orderTotal,
        message: `Coupon applied successfully! You saved ₹${couponDiscount}`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
