# POS System API Contracts

## Authentication Endpoints

### GET /api/auth/csrf-token
Get CSRF token for secure requests.

**Response (200 OK):**
```json
{
  "csrfToken": "string"
}
```

---

### POST /api/auth/login
Authenticate user and create session.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  },
  "role": "admin|supervisor|kasir",
  "csrfToken": "string"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

---

### POST /api/auth/logout
Logout user and destroy session.

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

---

### GET /api/auth/me
Get current authenticated user.

**Response (200 OK):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  },
  "role": "admin|supervisor|kasir",
  "csrfToken": "string"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Not authenticated"
}
```

---

### POST /api/auth/refresh-token
Silent token refresh for expired sessions.

**Response (200 OK):**
```json
{
  "csrfToken": "string"
}
```

---

## Products Endpoints

### GET /api/products
Fetch all products with HPP field.

**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search by product name
- `page` (optional): Pagination page
- `limit` (optional): Items per page (default: 50)

**Response (200 OK):**
```json
[
  {
    "id": "string",
    "name": "string",
    "category": "string",
    "sellingPrice": 50000,
    "hpp": 30000,
    "margin": 40,
    "stock": 100,
    "image": "string (URL or base64)",
    "description": "string",
    "sku": "string"
  }
]
```

---

### GET /api/products/:id
Get single product details.

**Response (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "sellingPrice": 50000,
  "hpp": 30000,
  "margin": 40,
  "stock": 100,
  "image": "string",
  "description": "string",
  "sku": "string",
  "supplier": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

### GET /api/products/:id/hpp
Get HPP and profit calculations for product.

**Response (200 OK):**
```json
{
  "productId": "string",
  "name": "string",
  "hpp": 30000,
  "currentPrice": 50000,
  "margin": 40,
  "marginAmount": 20000
}
```

---

### PUT /api/products/:id
Update product (admin only).

**Request:**
```json
{
  "name": "string",
  "sellingPrice": 50000,
  "hpp": 30000,
  "stock": 100,
  "category": "string"
}
```

**Response (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "sellingPrice": 50000,
  "hpp": 30000,
  "stock": 100
}
```

---

## Orders Endpoints

### POST /api/orders
Create new order.

**Request:**
```json
{
  "items": [
    {
      "productId": "string",
      "quantity": 2,
      "price": 50000,
      "hpp": 30000,
      "discount": 0
    }
  ],
  "memberPhone": "string (optional)",
  "notes": "string (optional)",
  "discountPercent": 0,
  "taxPercent": 10
}
```

**Response (201 Created):**
```json
{
  "orderId": "string",
  "receiptNumber": "string",
  "total": 110000,
  "createdAt": "ISO8601"
}
```

---

### GET /api/orders/:id
Get order details.

**Response (200 OK):**
```json
{
  "id": "string",
  "receiptNumber": "string",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "quantity": 2,
      "price": 50000,
      "hpp": 30000,
      "subtotal": 100000
    }
  ],
  "summary": {
    "subtotal": 100000,
    "discount": 0,
    "tax": 10000,
    "total": 110000
  },
  "member": {
    "id": "string",
    "name": "string",
    "phone": "string"
  },
  "createdAt": "ISO8601",
  "createdBy": "string (user id)"
}
```

---

## Finance Endpoints

### POST /api/finance/reconciliation
Submit cash reconciliation (supervisor/admin only).

**Request:**
```json
{
  "physicalCash": 2500000,
  "systemTotal": 2480000,
  "cashierNotes": "string",
  "supervisorId": "string"
}
```

**Response (200 OK):**
```json
{
  "reconciliationId": "string",
  "physicalCash": 2500000,
  "systemTotal": 2480000,
  "difference": 20000,
  "differencePercent": 0.81,
  "status": "balanced|shortage|surplus",
  "approvalRequired": false,
  "createdAt": "ISO8601"
}
```

**Calculation Logic:**
```
Difference (Selisih) = Physical Cash - System Total
                     = 2,500,000 - 2,480,000
                     = 20,000 (surplus)

Difference Percent   = (Difference / System Total) × 100
                     = (20,000 / 2,480,000) × 100
                     = 0.81%

Status Determination:
- If Difference = 0 or < ±1,000 → "balanced"
- If Difference < 0 → "shortage"
- If Difference > 0 → "surplus"
- If |Difference Percent| > 5% → Requires approval
```

---

### GET /api/finance/reconciliation
Fetch reconciliation history.

**Query Parameters:**
- `startDate` (ISO8601): Filter from date
- `endDate` (ISO8601): Filter to date
- `page` (optional): Pagination
- `limit` (optional): Items per page

**Response (200 OK):**
```json
[
  {
    "reconciliationId": "string",
    "date": "ISO8601",
    "physicalCash": 2500000,
    "systemTotal": 2480000,
    "difference": 20000,
    "differencePercent": 0.81,
    "status": "balanced",
    "approvedBy": "string (supervisor id)",
    "approvedAt": "ISO8601"
  }
]
```

---

### GET /api/finance/profit-report
Generate profit report based on HPP calculations.

**Query Parameters:**
- `startDate` (ISO8601): Report start date
- `endDate` (ISO8601): Report end date
- `groupBy` (optional): 'daily|weekly|monthly' (default: daily)

**Response (200 OK):**
```json
[
  {
    "period": "2024-01-15",
    "totalRevenue": 1000000,
    "totalHPP": 600000,
    "grossProfit": 400000,
    "profitMargin": 40,
    "itemsCount": 20,
    "orders": 5
  }
]
```

**Calculation Logic:**
```
For each order item:
  Revenue per Item    = Quantity × Selling Price
  Cost per Item (HPP) = Quantity × HPP
  Profit per Item     = Revenue - Cost

Total by Period:
  Total Revenue       = Σ(All items revenue)
  Total HPP Cost      = Σ(All items hpp × qty)
  Gross Profit        = Total Revenue - Total HPP Cost
  Profit Margin %     = (Gross Profit / Total Revenue) × 100
  Items Count         = Σ(All items sold)

Example:
  Item A: 10 × Rp 50,000 = Rp 500,000 (revenue)
          10 × Rp 30,000 = Rp 300,000 (hpp)
          = Rp 200,000 (profit)

  Item B: 5 × Rp 100,000 = Rp 500,000 (revenue)
          5 × Rp 60,000 = Rp 300,000 (hpp)
          = Rp 200,000 (profit)

  Total Revenue   = Rp 1,000,000
  Total HPP       = Rp 600,000
  Gross Profit    = Rp 400,000
  Profit Margin   = 40%
```

**Mathematical Accuracy:**
- All calculations use fixed-point arithmetic (2 decimals for IDR)
- Rounding: Bankers' Rounding (round half to even) to prevent systematic bias
- Server-side calculations are authoritative
- Client-side calculations for preview only

---

## Audit Log Endpoints

### POST /api/audit/log-supervisor-action
Log supervisor authorization actions.

**Request:**
```json
{
  "action": "discount|priceChange",
  "orderId": "string",
  "supervisorId": "string",
  "metadata": {
    "reason": "string",
    "amount": 100000,
    "timestamp": "ISO8601"
  }
}
```

**Response (201 Created):**
```json
{
  "auditId": "string",
  "action": "discount",
  "orderId": "string",
  "supervisorId": "string",
  "timestamp": "ISO8601"
}
```

---

### GET /api/audit/logs
Fetch audit logs (admin only).

**Query Parameters:**
- `action` (optional): Filter by action type
- `supervisor` (optional): Filter by supervisor ID
- `startDate` (ISO8601): Filter from date
- `endDate` (ISO8601): Filter to date
- `page` (optional): Pagination
- `limit` (optional): Items per page

**Response (200 OK):**
```json
[
  {
    "auditId": "string",
    "action": "discount",
    "orderId": "string",
    "supervisor": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "metadata": {
      "reason": "Special discount for VIP customer",
      "amount": 100000
    },
    "timestamp": "ISO8601"
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "string",
  "errors": {
    "fieldName": ["error message 1", "error message 2"]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required or session expired"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions for this action"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "message": "Validation error",
  "errors": {
    "email": ["Invalid email format"],
    "hpp": ["HPP must be less than selling price"]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## HTTP Headers

### Request Headers
- `Content-Type: application/json`
- `X-CSRF-Token: string` (required for POST/PUT/DELETE)
- `Authorization: Bearer HTTPONLY_COOKIE` (JWT in httpOnly cookie, header for tracking)

### Response Headers
- `Content-Type: application/json`
- `X-CSRF-Token: string` (new CSRF token in response)
- `Set-Cookie: jwt=...; HttpOnly; Secure; SameSite=Strict` (server sets this)

---

## Rate Limiting

All endpoints are rate-limited:
- Standard endpoints: 100 requests per minute per user
- Auth endpoints: 5 requests per minute per IP
- Report generation: 10 requests per minute per user

**Rate Limit Headers:**
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 95`
- `X-RateLimit-Reset: 1234567890`
