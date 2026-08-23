import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/utils/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get('outletId');
    const carId = searchParams.get('carId');

    if (!outletId || !carId) {
      return NextResponse.json(
        { message: 'outletId and carId are required' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const today = new Date().toISOString().split('T')[0];

    // Find eligible coupons
    // Global coupons, outlet-specific, or car-specific
    const query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM CouponUsage cu WHERE cu.couponId = c.id) as usedCount
      FROM Coupon c
      WHERE c.active = 1
        AND c.validTill >= ?
        AND (
          (c.outletId IS NULL AND c.carId IS NULL) OR
          (c.outletId = ? AND c.carId IS NULL) OR
          (c.outletId IS NULL AND c.carId = ?) OR
          (c.outletId = ? AND c.carId = ?)
        )
      HAVING usedCount < c.maxUses
    `;

    const coupons = await db.all(query, [today, outletId, carId, outletId, carId]);

    // Filter by oncePerCar rule
    const eligibleCoupons = [];
    for (const coupon of coupons) {
      if (coupon.oncePerCar) {
        // Check if this car has already used this coupon
        const usage = await db.get(
          'SELECT id FROM CouponUsage WHERE couponId = ? AND carId = ?',
          [coupon.id, carId]
        );
        if (!usage) {
          eligibleCoupons.push(coupon);
        }
      } else {
        eligibleCoupons.push(coupon);
      }
    }

    return NextResponse.json(eligibleCoupons, { status: 200 });
  } catch (error) {
    console.error('Error fetching eligible coupons:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
