# Contact Us Endpoint Guide

## 📍 Current Contact Us Endpoint Locations

### 1. Frontend Pages
```
app/(layouts)/layout-1/blog/contacts/
├── page.tsx                    # Main contacts list page
└── [id]/page.tsx              # Individual contact detail page
```

### 2. API Routes
```
app/api/admin/contacts/
├── route.ts                    # GET/POST /api/admin/contacts
├── [id]/route.ts              # GET/PUT/DELETE /api/admin/contacts/[id]
└── test/route.ts              # Test route (can be removed)
```

### 3. Components
```
components/admin/
└── ContactsTable.tsx          # Contacts table component
```

### 4. API Client
```
lib/api-client.ts              # getContacts() function
lib/api-config.ts              # getBackendUrl() function
```

## 🔄 Guide to Change "Contacts" to "Contact Us"

### Step 1: Update Frontend Page Names

**File: `app/(layouts)/layout-1/blog/contacts/page.tsx`**
```typescript
// Change the page title and description
<h1 className="text-3xl font-bold">Contact Us Submissions</h1>
<p className="text-muted-foreground">
  Manage and respond to contact us form submissions
</p>
```

### Step 2: Update Component Names

**File: `components/admin/ContactsTable.tsx`**
```typescript
// Change the card title
<CardTitle>Contact Us Submissions</CardTitle>

// Change search placeholder
<SearchBar
  placeholder="Search contact us submissions..."
  // ...
/>
```

### Step 3: Update API Client Function Names

**File: `lib/api-client.ts`**
```typescript
// Rename the function
export async function getContactUsSubmissions(searchParams: {
  search?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: {
    rows: any[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  try {
    console.log('Admin Panel: Fetching contact us submissions with params:', searchParams);

    const query: Query = {
      search: searchParams.search,
      status: searchParams.status !== 'all' ? searchParams.status : undefined,
      priority: searchParams.priority !== 'all' ? searchParams.priority : undefined,
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      page: searchParams.page ?? 1,
      limit: searchParams.limit ?? 10,
    };

    const res = await apiFetch<{
      success: boolean;
      data: {
        rows: any[];
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(
      getBackendUrl('api/v1/contacts'),
      {
        method: 'GET',
        query,
      }
    );

    console.log('Admin Panel: Contact us submissions fetched successfully:', { 
      total: res.data.total, 
      page: res.data.page, 
      pages: res.data.pages, 
      rows: res.data.rows.length 
    });

    return res;
  } catch (error) {
    console.error('Admin Panel: Error fetching contact us submissions:', error);
    throw error;
  }
}
```

### Step 4: Update Frontend to Use New Function

**File: `app/(layouts)/layout-1/blog/contacts/page.tsx`**
```typescript
// Change import
import { getContactUsSubmissions } from '@/lib/api-client';

// Change function call
const response = await getContactUsSubmissions(searchParams);
```

### Step 5: Update Backend Endpoint (Optional)

If you want to change the backend endpoint from `/api/v1/contacts` to `/api/v1/contactus`:

**File: `lib/api-client.ts`**
```typescript
// Change the endpoint
getBackendUrl('api/v1/contactus')  // Instead of 'api/v1/contacts'
```

## 🎯 Complete Renaming Guide

### Option 1: Just Change Display Names (Easiest)
- Update page titles and descriptions
- Keep all technical names the same
- No code changes needed for functionality

### Option 2: Full Rename (More Comprehensive)
- Rename files and folders
- Update all function names
- Update all variable names
- Update backend endpoints

## 📋 Quick Display Name Changes

### 1. Page Title
```typescript
// In contacts/page.tsx
<h1 className="text-3xl font-bold">Contact Us Submissions</h1>
```

### 2. Table Header
```typescript
// In ContactsTable.tsx
<CardTitle>Contact Us Submissions</CardTitle>
```

### 3. Search Placeholder
```typescript
// In ContactsTable.tsx
<SearchBar placeholder="Search contact us submissions..." />
```

### 4. Navigation Menu
Update your navigation menu to show "Contact Us" instead of "Contacts"

## 🚀 Recommended Approach

**For quick changes:** Just update the display text in the UI components
**For complete rename:** Follow the full guide above

## 📝 Environment Variables

### Development (.env.local)
```env
# Development Environment Variables
# Backend API URL for development
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Next.js API Base URL (for internal API routes)
NEXT_PUBLIC_API_BASE_URL=/api
```

### Production
```env
# Production Environment Variables
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_API_BASE_URL=/api
```

## 🔧 Backend Endpoint Configuration

### Current Backend Endpoint
```
http://localhost:5000/api/v1/contacts
```

### Production Backend Endpoint
```
https://your-backend-domain.com/api/v1/contacts
```

## 📊 Data Structure

### Backend Response Format
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "_id": "68eca8c014af477e953bd639",
        "name": "tonyman",
        "email": "test2@gmail.com",
        "subject": "Welcome to the Admin Panel hoooowww",
        "message": "test message 2...",
        "status": "new",
        "priority": "medium",
        "ip": "::1",
        "userAgent": "node",
        "metadata": {
          "source": "website"
        },
        "createdAt": "2025-10-13T07:22:40.933Z",
        "updatedAt": "2025-10-13T07:22:40.937Z",
        "__v": 0
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

## 🛠️ Implementation Steps

1. **Update Display Names** - Change UI text to "Contact Us"
2. **Update Function Names** - Rename `getContacts` to `getContactUsSubmissions`
3. **Update Imports** - Update all imports to use new function names
4. **Test Functionality** - Ensure all features work with new names
5. **Update Documentation** - Update any documentation or comments

## 🎨 UI Components to Update

- Page titles and headings
- Table headers
- Search placeholders
- Button labels
- Navigation menu items
- Breadcrumbs
- Error messages
- Success messages

## 🔍 Testing Checklist

- [ ] Page loads correctly
- [ ] Data displays properly
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Bulk actions work
- [ ] Individual contact view works
- [ ] Error handling works
- [ ] Loading states work

## 📚 Additional Resources

- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [Environment Variables Guide](https://nextjs.org/docs/basic-features/environment-variables)
- [TypeScript Configuration](https://nextjs.org/docs/basic-features/typescript)
