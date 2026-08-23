import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import OutletPackage from "@/models/outletPackage";

export async function PUT(request, { params }) {
  try {
    await connectToDB();

    const { id } = params;
    const body = await request.json();
    const { price } = body;

    if (price === undefined || price < 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Valid price is required' 
        },
        { status: 400 }
      );
    }

    const updatedPackage = await OutletPackage.findByIdAndUpdate(
      id,
      { price, updatedAt: Date.now() },
      { new: true }
    )
      .populate('outlet', 'name address active')
      .populate('washPackage', 'name description active');

    if (!updatedPackage) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Outlet package not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Outlet package updated successfully',
      data: {
        id: updatedPackage._id.toString(),
        price: updatedPackage.price,
      }
    });

  } catch (error) {
    console.error('Error updating outlet package:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to update outlet package',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDB();

    const { id } = params;

    const deletedPackage = await OutletPackage.findByIdAndDelete(id);

    if (!deletedPackage) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Outlet package not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Outlet package deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting outlet package:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to delete outlet package',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
