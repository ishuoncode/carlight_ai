import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import WashPackage from "@/models/washPackage";

export async function GET() {
  try {
    await connectToDB();

    const packages = await WashPackage.find()
      .sort({ name: 1 })
      .lean();

    const formattedPackages = packages.map(pkg => ({
      id: pkg._id.toString(),
      name: pkg.name,
      description: pkg.description,
      active: pkg.active,
      createdAt: pkg.createdAt,
    }));

    return NextResponse.json(formattedPackages);

  } catch (error) {
    console.error('Error fetching wash packages:', error);
    return NextResponse.json(
      { message: 'Failed to fetch wash packages', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();

    const body = await request.json();
    const { name, description } = body;

    if (!name || !description) {
      return NextResponse.json(
        { message: 'Name and description are required' },
        { status: 400 }
      );
    }

    const newPackage = await WashPackage.create({
      name,
      description,
    });

    return NextResponse.json(
      {
        message: 'Wash package created successfully',
        data: {
          id: newPackage._id.toString(),
          name: newPackage.name,
          description: newPackage.description,
          active: newPackage.active,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating wash package:', error);
    return NextResponse.json(
      { message: 'Failed to create wash package', error: error.message },
      { status: 500 }
    );
  }
}
