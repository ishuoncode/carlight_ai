import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import Outlet from "@/models/outlet";

export async function GET() {
  try {
    await connectToDB();

    const outlets = await Outlet.find({ active: true })
      .sort({ name: 1 })
      .lean();

    const formattedOutlets = outlets.map(outlet => ({
      id: outlet._id.toString(),
      name: outlet.name,
      address: outlet.address,
      active: outlet.active,
      createdAt: outlet.createdAt,
    }));

    return NextResponse.json(formattedOutlets);

  } catch (error) {
    console.error('Error fetching outlets:', error);
    return NextResponse.json(
      { message: 'Failed to fetch outlets', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();

    const body = await request.json();
    const { name, address } = body;

    if (!name || !address) {
      return NextResponse.json(
        { message: 'Name and address are required' },
        { status: 400 }
      );
    }

    const newOutlet = await Outlet.create({
      name,
      address,
    });

    return NextResponse.json(
      {
        message: 'Outlet created successfully',
        data: {
          id: newOutlet._id.toString(),
          name: newOutlet.name,
          address: newOutlet.address,
          active: newOutlet.active,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating outlet:', error);
    return NextResponse.json(
      { message: 'Failed to create outlet', error: error.message },
      { status: 500 }
    );
  }
}
