import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import OutletPackage from "@/models/outletPackage";
import Outlet from "@/models/outlet";
import WashPackage from "@/models/washPackage";

export async function GET(request) {
  try {
    await connectToDB();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get('outletId');

    // Build query
    let query = {};
    if (outletId) {
      query.outlet = outletId;
    }

    // Fetch outlet packages with populated references
    const outletPackages = await OutletPackage.find(query)
      .populate('outlet', 'name address active')
      .populate('washPackage', 'name description active')
      .sort({ 'outlet.name': 1, 'washPackage.name': 1 })
      .lean();

    // Transform data for better readability
    const formattedPackages = outletPackages.map(pkg => ({
      id: pkg._id.toString(),
      outletId: pkg.outlet._id.toString(),
      outletName: pkg.outlet.name,
      outletAddress: pkg.outlet.address,
      outletActive: pkg.outlet.active,
      packageId: pkg.washPackage._id.toString(),
      packageName: pkg.washPackage.name,
      packageDescription: pkg.washPackage.description,
      packageActive: pkg.washPackage.active,
      price: pkg.price,
      active: pkg.active,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      count: formattedPackages.length,
      data: formattedPackages
    });

  } catch (error) {
    console.error('Error fetching outlet packages:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch outlet packages',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();

    const body = await request.json();
    const { outletId, washPackageId, price } = body;

    // Validate required fields
    if (!outletId || !washPackageId || price === undefined) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Outlet ID, Wash Package ID, and Price are required' 
        },
        { status: 400 }
      );
    }

    // Check if outlet exists
    const outlet = await Outlet.findById(outletId);
    if (!outlet) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Outlet not found' 
        },
        { status: 404 }
      );
    }

    // Check if wash package exists
    const washPackage = await WashPackage.findById(washPackageId);
    if (!washPackage) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Wash package not found' 
        },
        { status: 404 }
      );
    }

    // Create new outlet package
    const newOutletPackage = await OutletPackage.create({
      outlet: outletId,
      washPackage: washPackageId,
      price: price,
    });

    // Populate references for response
    const populatedPackage = await OutletPackage.findById(newOutletPackage._id)
      .populate('outlet', 'name address active')
      .populate('washPackage', 'name description active')
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Outlet package created successfully',
        data: {
          id: populatedPackage._id.toString(),
          outletId: populatedPackage.outlet._id.toString(),
          outletName: populatedPackage.outlet.name,
          packageId: populatedPackage.washPackage._id.toString(),
          packageName: populatedPackage.washPackage.name,
          price: populatedPackage.price,
          active: populatedPackage.active,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating outlet package:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false,
          message: 'This outlet-package combination already exists' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to create outlet package',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
