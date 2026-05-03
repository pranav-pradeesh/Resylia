# Admin Team Management & Invite-Based Onboarding Setup Guide

## Overview

This system enables non-technical admins to manage team members and roles through an intuitive web interface, with an invite-based onboarding flow for new users.

## Files Created

### Database
- `supabase/migrations/20260427_invites.sql` - Invites table schema with auto-cleanup

### API Endpoints
- `apps/web/app/api/team/route.ts` - Team member management (list, update role, deactivate)
- `apps/web/app/api/invites/route.ts` - Updated to track invites (GET & POST)
- `apps/web/app/api/auth/me/route.ts` - Get current user info
- `apps/web/app/api/auth/complete-onboarding/route.ts` - Complete onboarding flow

### UI Pages
- `apps/web/app/(admin)/team/page.tsx` - Admin team management page
- `apps/web/app/(admin)/layout.tsx` - Admin route protection
- `apps/web/app/onboarding/page.tsx` - Onboarding flow for new users

### Database Functions
- Updated `packages/db/src/users.ts` - Invite management functions
- Updated `packages/db/src/types.ts` - Added Invites table types

### Enhanced
- `apps/web/app/(employee)/dashboard/page.tsx` - Added admin link for admins
- `apps/web/app/api/invites/route.ts` - Track invites in database

## Setup Steps

### 1. Run Database Migration
```bash
# Push the new invites table to your database
supabase db push
```

### 2. Verify Build
```bash
pnpm build
pnpm type-check
```

## Usage Guide

### For Admins

#### Accessing Team Management
1. Log in to dashboard
2. Look for "team admin" link in the header (orange colored)
3. Click to open Team Management page

#### Inviting Members
1. On Team Management page, find "Invite New Member" form
2. Fill in:
   - **Email**: New member's email address
   - **Role**: Select from Employee, Manager, or HR
   - **Department** (optional): e.g., "Engineering", "Sales"
3. Click "Send Invite"
4. An email is sent to the member with an invite link

#### Managing Team
1. See all active members in the "Team Members" tab
2. **Change Role**: Use dropdown next to member name
3. **Deactivate**: Click "Deactivate" button (member loses access)
4. **View Pending**: Check "Pending Invites" tab to see sent-but-not-yet-accepted invites
5. **Cancel Invite**: Click "Cancel" to revoke an invite

#### Seat Limits
- Invites respect organization seat limits
- Upgrade plan if "Seat limit reached" error appears

### For New Users (Onboarding)

#### Accepting Invite
1. Receive email from Resylia with "You've been invited" subject
2. Click the link in the email
3. You're sent to login/signup
4. Complete login with email/password or OAuth (Google/Slack)

#### Onboarding Flow
1. After login, redirected to onboarding page (Step 1/3)
2. **Step 1**: Enter First Name and Last Name
3. **Step 2**: Enter Department and optionally Manager's email
4. **Step 3**: Review info and click "Complete Setup"
5. Redirected to dashboard

#### Skip Onboarding
- Can click "Skip onboarding" to go straight to dashboard
- Profile info will be incomplete but user can update later

## API Endpoints

### Team Management

#### GET /api/team
- **Auth**: Admin only
- **Returns**: List of all active users in organization
- **Response**: `{ users: UserRow[] }`

#### PATCH /api/team
- **Auth**: Admin only
- **Body**: 
  ```json
  {
    "user_id": "uuid",
    "action": "update_role" | "deactivate",
    "role": "employee" | "manager" | "hr"  // Required if action is update_role
  }
  ```
- **Response**: `{ success: true, message: string }`

#### DELETE /api/team?invite_id=<uuid>
- **Auth**: Admin only
- **Purpose**: Cancel a pending invite
- **Response**: `{ success: true, message: string }`

### Invites

#### GET /api/invites
- **Auth**: Admin only
- **Returns**: All invites for organization
- **Response**: `{ invites: InviteRow[] }`

#### POST /api/invites
- **Auth**: Admin only
- **Body**:
  ```json
  {
    "email": "user@company.com",
    "role": "employee" | "manager" | "hr",
    "department": "optional department name"
  }
  ```
- **Response**: `{ invited: "user@company.com" }` (201)

### Auth

#### GET /api/auth/me
- **Returns**: Current user info with role
- **Response**: `{ user: { id, email, role, org_id, ... } }`

#### POST /api/auth/complete-onboarding
- **Auth**: Authenticated user
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "department": "optional",
    "manager": "optional@email.com"
  }
  ```
- **Response**: `{ success: true }`

## Database Schema

### Invites Table
```sql
- id (uuid, primary key)
- org_id (uuid, foreign key to organizations)
- email (text, unique per org when pending)
- role (text: 'employee', 'manager', 'hr')
- department (text, optional)
- invited_by (uuid, foreign key to users)
- invited_user_id (uuid, nullable, filled when accepted)
- status (text: 'pending', 'accepted', 'canceled')
- expires_at (timestamp, default +30 days)
- accepted_at (timestamp, nullable)
- created_at (timestamp)
```

### Auto-Cleanup
- Runs daily at 2 AM UTC
- Marks expired pending invites as 'canceled'
- Invites expire after 30 days

## Security

✅ **Admin-Only Access**: Team management page checks auth and role
✅ **Permission Checks**: API endpoints verify 'users:manage' permission
✅ **Rate Limiting**: Invite and team APIs use rate limiting
✅ **Self-Demotion Prevention**: Admins cannot demote themselves
✅ **Invitation Tracking**: All invites tracked in database with audit trail

## Troubleshooting

### Issue: "No invitation found for this email"
- **Cause**: User accepted invite from different email
- **Solution**: Use email address that received the invitation

### Issue: "Seat limit reached"
- **Cause**: Organization has hit maximum users
- **Solution**: Upgrade plan or deactivate unused accounts

### Issue: Admin link not showing
- **Cause**: User is not an admin
- **Solution**: Check user role in database, must be 'admin'

### Issue: Invite email not received
- **Cause**: Email provider issue or Resend not configured
- **Solution**: Check RESEND_API_KEY environment variable

## Future Enhancements

- Bulk invite upload (CSV)
- Department-based role templates
- Manager assignment UI
- Invite resend functionality
- Detailed audit logs for all team actions
- Custom onboarding fields
- Role-based dashboard views
