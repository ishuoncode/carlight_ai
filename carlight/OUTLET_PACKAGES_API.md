# Outlet Package Pricing API Documentation

## Overview
This API manages pricing for wash packages across different outlet locations. It provides endpoints to create, read, update, and delete outlet-specific package pricing with filtering capabilities.

## Database Models

### Outlet Model
```javascript
{
  name: String (required),
  address: String (required),
  active: Boolean (default: true),
  createdAt: Date
}
```

### Wash Package Model
```javascript
{
  name: String (required),
  description: String (required),
  active: Boolean (default: true),
  createdAt: Date
}
```

### Outlet Package Model
```javascript
{
  outlet: ObjectId (ref: 'Outlet', required),
  washPackage: ObjectId (ref: 'WashPackage', required),
  price: Number (required, min: 0),
  active: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```
**Note:** Unique index on `outlet` + `washPackage` combination to prevent duplicates.

---

## API Endpoints

### 1. Get All Outlet Packages
**Endpoint:** `GET /api/admin/outlet-packages`

**Description:** Retrieves all outlet packages with populated outlet and wash package details. Supports optional filtering by outlet.

**Query Parameters:**
- `outletId` (optional): Filter packages by specific outlet ID

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "outletId": "507f1f77bcf86cd799439012",
      "outletName": "Main Branch",
      "outletAddress": "123 Main St, City",
      "outletActive": true,
      "packageId": "507f1f77bcf86cd799439013",
      "packageName": "Premium Wash",
      "packageDescription": "Complete car wash with wax",
      "packageActive": true,
      "price": 500,
      "active": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Example Usage:**
```javascript
// Get all outlet packages
const response = await fetch('/api/admin/outlet-packages');

// Get packages for a specific outlet
const response = await fetch('/api/admin/outlet-packages?outletId=507f1f77bcf86cd799439012');
```

---

### 2. Create Outlet Package
**Endpoint:** `POST /api/admin/outlet-packages`

**Description:** Creates a new outlet package pricing entry.

**Request Body:**
```json
{
  "outletId": "507f1f77bcf86cd799439012",
  "washPackageId": "507f1f77bcf86cd799439013",
  "price": 500
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Outlet package created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "outletId": "507f1f77bcf86cd799439012",
    "outletName": "Main Branch",
    "packageId": "507f1f77bcf86cd799439013",
    "packageName": "Premium Wash",
    "price": 500,
    "active": true
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `404`: Outlet or wash package not found
- `409`: Outlet-package combination already exists
- `500`: Server error

---

### 3. Update Outlet Package Price
**Endpoint:** `PUT /api/admin/outlet-packages/[id]`

**Description:** Updates the price of an existing outlet package.

**URL Parameters:**
- `id`: Outlet package ID

**Request Body:**
```json
{
  "price": 600
}
```

**Response:**
```json
{
  "success": true,
  "message": "Outlet package updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "price": 600
  }
}
```

**Error Responses:**
- `400`: Invalid price
- `404`: Outlet package not found
- `500`: Server error

---

### 4. Delete Outlet Package
**Endpoint:** `DELETE /api/admin/outlet-packages/[id]`

**Description:** Deletes an outlet package pricing entry.

**URL Parameters:**
- `id`: Outlet package ID

**Response:**
```json
{
  "success": true,
  "message": "Outlet package deleted successfully"
}
```

**Error Responses:**
- `404`: Outlet package not found
- `500`: Server error

---

## Supporting Endpoints

### Get All Outlets
**Endpoint:** `GET /api/outlets`

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "Main Branch",
    "address": "123 Main St, City",
    "active": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Get All Wash Packages
**Endpoint:** `GET /api/admin/wash-packages`

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439013",
    "name": "Premium Wash",
    "description": "Complete car wash with wax",
    "active": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

## Frontend Component

### OutletPricing Component
Located at: `app/components/dashboard/OutletPricing.jsx`

**Features:**
1. **DataTable Display:** Shows all outlet packages with sortable columns
2. **Outlet Filter:** Dropdown to filter packages by specific outlet
3. **Add Pricing:** Dialog to add new outlet-package pricing
4. **Edit Price:** Update existing pricing
5. **Delete:** Remove outlet-package pricing
6. **Status Indicators:** Shows active/inactive status with color-coded tags

**Usage in Dashboard:**
```jsx
import OutletPricing from '../components/dashboard/OutletPricing';

// In your dashboard component
case 'outletPricing':
  return <OutletPricing />;
```

---

## Environment Variables
Ensure the following is set in your `.env` file:
```
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

## Testing the API

### Using cURL

**Get all outlet packages:**
```bash
curl -X GET http://localhost:3000/api/admin/outlet-packages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get packages for specific outlet:**
```bash
curl -X GET "http://localhost:3000/api/admin/outlet-packages?outletId=OUTLET_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create new outlet package:**
```bash
curl -X POST http://localhost:3000/api/admin/outlet-packages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"outletId":"OUTLET_ID","washPackageId":"PACKAGE_ID","price":500}'
```

**Update price:**
```bash
curl -X PUT http://localhost:3000/api/admin/outlet-packages/PACKAGE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"price":600}'
```

**Delete outlet package:**
```bash
curl -X DELETE http://localhost:3000/api/admin/outlet-packages/PACKAGE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes
- All prices are stored as numbers (e.g., 500 for ₹500)
- The frontend displays prices in INR format with proper localization
- Only active outlets and packages are shown in dropdowns
- The unique index prevents duplicate outlet-package combinations
- All timestamps are in ISO 8601 format
