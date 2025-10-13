# Admin Panel Setup for Love of Travel

This document provides setup instructions for the contact form submissions and newsletter subscription management sections of the admin panel.

## Features

### Contact Management
- View all contact form submissions
- Filter by status (new, read, replied, archived) and priority (low, medium, high, urgent)
- Search contacts by name, email, subject, or message
- Bulk actions (change status, priority, delete)
- Individual contact detail view with full message and metadata
- Reply functionality (opens email client)
- View UTM parameters and technical details

### Newsletter Management
- View all newsletter subscribers
- Filter by status (active, unsubscribed, bounced, complained), frequency, and source
- Search subscribers by email, tags, or notes
- Bulk actions (change status, unsubscribe, delete)
- Individual subscriber detail view with preferences and engagement stats
- Manage subscriber preferences (frequency, categories, language)
- Add/remove tags and notes
- View subscription history and email statistics

### Dashboard
- Overview statistics for contacts and newsletter subscribers
- Status breakdowns and trends
- Recent activity summaries
- Quick navigation to detailed views

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Backend API URL (if using separate backend)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Preview URL secret for signed URLs
PREVIEW_SECRET=your-preview-secret-here

# Revalidation webhook secret
REVALIDATE_SECRET=your-revalidation-secret-here

# Email configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Analytics (optional)
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
MIXPANEL_TOKEN=your-mixpanel-token

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis (optional for caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

### 2. Backend Integration

**Current Implementation**: The admin panel currently uses mock data for demonstration purposes. 

**For Production**: You'll need to integrate with your backend API by:

1. **Setting up the backend API** (separate Node.js/Express server) with MongoDB
2. **Updating the API calls** in the frontend to point to your backend
3. **Implementing the actual database operations** in the backend

The frontend is designed to work with a REST API backend that provides the same endpoints as the mock implementations.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

The admin panel will be available at `http://localhost:3002/layout-1/blog/dashboard`

## API Endpoints

### Admin Endpoints (Protected)

#### Contacts
- `GET /api/admin/contacts` - List contacts with filters and pagination
- `POST /api/admin/contacts` - Bulk actions on contacts
- `GET /api/admin/contacts/[id]` - Get single contact
- `PUT /api/admin/contacts/[id]` - Update contact
- `DELETE /api/admin/contacts/[id]` - Delete contact

#### Newsletter
- `GET /api/admin/newsletter` - List subscribers with filters and pagination
- `POST /api/admin/newsletter` - Bulk actions on subscribers
- `GET /api/admin/newsletter/[email]` - Get single subscriber
- `PUT /api/admin/newsletter/[email]` - Update subscriber
- `DELETE /api/admin/newsletter/[email]` - Delete subscriber

#### Statistics
- `GET /api/admin/stats` - Get dashboard statistics

### Public Endpoints

#### Contact Form
- `POST /api/contact` - Submit contact form

#### Newsletter
- `POST /api/newsletter` - Subscribe to newsletter
- `DELETE /api/newsletter?email=...` - Unsubscribe from newsletter

## Data Models

### Contact
```typescript
interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ip: string;
  userAgent: string;
  metadata: {
    referrer?: string;
    source: string;
    campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_term?: string;
    utm_content?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  repliedAt?: Date;
  archivedAt?: Date;
}
```

### Newsletter
```typescript
interface Newsletter {
  _id: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  source: 'website' | 'popup' | 'footer' | 'admin' | 'import';
  preferences: {
    frequency: 'weekly' | 'monthly' | 'quarterly';
    categories: string[];
    language: string;
  };
  metadata: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  subscribedAt: Date;
  unsubscribedAt?: Date;
  lastEmailSent?: Date;
  emailCount: number;
  bounceCount: number;
  complaintCount: number;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Features

- JWT-based authentication for admin endpoints
- Role-based access control (RBAC)
- Input validation using Zod schemas
- Rate limiting for public endpoints
- CSRF protection
- Sanitized user inputs
- Secure error handling

## Usage Examples

### Contact Form Submission (Frontend)
```javascript
const response = await fetch('/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Question about travel',
    message: 'I have a question about...',
    source: 'website',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'travel-ads'
  }),
});
```

### Newsletter Subscription (Frontend)
```javascript
const response = await fetch('/api/newsletter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    source: 'popup',
    preferences: {
      frequency: 'monthly',
      categories: ['travel-tips', 'destinations'],
      language: 'en'
    }
  }),
});
```

## Customization

### Adding New Contact Fields
1. Update the `Contact` model in `lib/models/Contact.ts`
2. Update the validation schema in `lib/validation.ts`
3. Update the API routes to handle the new fields
4. Update the UI components to display/edit the new fields

### Adding New Newsletter Preferences
1. Update the `Newsletter` model in `lib/models/Newsletter.ts`
2. Update the validation schema in `lib/validation.ts`
3. Update the API routes to handle the new preferences
4. Update the UI components to manage the new preferences

### Styling
The admin panel uses Tailwind CSS and shadcn/ui components. You can customize the appearance by:
- Modifying the component styles
- Updating the Tailwind configuration
- Adding custom CSS classes
- Using the theme system for dark/light mode

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in your environment variables
   - Verify network connectivity

2. **Authentication Issues**
   - Check JWT_SECRET is set in environment variables
   - Ensure proper role permissions are configured
   - Verify session management

3. **API Errors**
   - Check browser console for error messages
   - Verify API endpoint URLs
   - Ensure proper request headers and body format

4. **UI Issues**
   - Check for missing dependencies
   - Verify component imports
   - Ensure proper TypeScript types

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Review the server logs
3. Verify your environment configuration
4. Check the API endpoint responses
5. Ensure all dependencies are installed correctly

## Production Deployment

For production deployment:

1. Set up a production MongoDB instance
2. Configure environment variables for production
3. Set up proper authentication and authorization
4. Configure rate limiting and security headers
5. Set up monitoring and logging
6. Configure backup strategies for the database
7. Set up SSL/TLS certificates
8. Configure CDN for static assets

## License

This admin panel is part of the Love of Travel project and follows the same licensing terms.
