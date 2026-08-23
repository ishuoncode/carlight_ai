import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import WashPackage from "@/models/washPackage";

export async function PUT(request, { params }) {
  try {
    await connectToDB();

    const { id } = params;
    const body = await request.json();
    const { name, description, active } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (active !== undefined) updateData.active = active;

    const updatedPackage = await WashPackage.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPackage) {
      return NextResponse.json(
        { message: 'Wash package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Wash package updated successfully',
      data: {
        id: updatedPackage._id.toString(),
        name: updatedPackage.name,
        description: updatedPackage.description,
        active: updatedPackage.active,
      }
    });

  } catch (error) {
    console.error('Error updating wash package:', error);
    return NextResponse.json(
      { message: 'Failed to update wash package', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDB();

    const { id } = params;

    const deletedPackage = await WashPackage.findByIdAndDelete(id);

    if (!deletedPackage) {
      return NextResponse.json(
        { message: 'Wash package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Wash package deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting wash package:', error);
    return NextResponse.json(
      { message: 'Failed to delete wash package', error: error.message },
      { status: 500 }
    );
  }
}
