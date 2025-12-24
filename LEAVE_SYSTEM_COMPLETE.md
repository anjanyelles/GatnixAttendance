# Leave Management System - Complete Implementation

## ✅ Features Implemented

### 1. **Employee Leave Application**
- ✅ Form to apply for leave with:
  - Leave Type (CASUAL, SICK, WFH)
  - From Date (must be today or future)
  - To Date (must be >= From Date)
  - Reason (minimum 10 characters)
- ✅ View own leave requests with status filter
- ✅ Real-time status updates

### 2. **Manager Approval**
- ✅ View pending leave requests from team members
- ✅ Approve or Reject leave requests
- ✅ Add comments when approving/rejecting
- ✅ Status changes: PENDING → MANAGER_APPROVED or REJECTED

### 3. **HR Final Approval**
- ✅ View manager-approved leave requests
- ✅ Final approve or reject leave requests
- ✅ Add comments
- ✅ Status changes: MANAGER_APPROVED → HR_APPROVED or REJECTED
- ✅ When HR approves, attendance records are automatically marked for leave dates

### 4. **Admin Access**
- ✅ Admin can access both Manager and HR leave approval pages
- ✅ Admin has full visibility and approval rights
- ✅ Can approve/reject at any stage

## Leave Approval Flow

```
Employee applies → PENDING
    ↓
Manager approves → MANAGER_APPROVED
    ↓
HR approves → HR_APPROVED (Final)
```

Or:

```
Employee applies → PENDING
    ↓
Manager/HR rejects → REJECTED
```

## Pages and Routes

### Employee
- **`/leave`** - Apply for leave and view own requests

### Manager
- **`/manager/leave-requests`** - View and approve team leave requests

### HR
- **`/hr/leave-requests`** - View and approve manager-approved requests

### Admin
- **`/manager/leave-requests`** - Can approve as manager
- **`/hr/leave-requests`** - Can approve as HR

## API Endpoints

### Employee
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/my` - Get own leave requests

### Manager
- `GET /api/manager/leave-requests` - Get team leave requests
- `PUT /api/manager/leave-requests/:id` - Approve/reject leave

### HR
- `GET /api/hr/leave-requests` - Get all leave requests
- `PUT /api/hr/leave-requests/:id` - Final approve/reject leave

## Field Name Mapping Fixed

**Backend returns:** `employee_name`, `leave_type`, `from_date`, `to_date`
**Frontend expects:** `employeeName`, `leaveType`, `fromDate`, `toDate`

✅ **Fixed:** All pages now handle both snake_case and camelCase field names

## Leave Types

1. **CASUAL** - Casual leave
2. **SICK** - Sick leave
3. **WFH** - Work from home

## Status Colors

- 🟡 **PENDING** - Yellow (Waiting for approval)
- 🔵 **MANAGER_APPROVED** - Blue (Approved by manager, waiting for HR)
- 🟢 **HR_APPROVED** - Green (Final approval)
- 🔴 **REJECTED** - Red (Rejected)

## Validation Rules

1. **From Date**: Must be today or in the future
2. **To Date**: Must be >= From Date
3. **Reason**: Minimum 10 characters required
4. **Leave Type**: Must be CASUAL, SICK, or WFH

## How It Works

### For Employees:
1. Go to `/leave`
2. Fill in leave application form
3. Submit application
4. View status in "My Leave Requests" table

### For Managers:
1. Go to `/manager/leave-requests`
2. See all PENDING requests from team members
3. Click "Approve" or "Reject"
4. Add optional comments
5. Submit decision

### For HR:
1. Go to `/hr/leave-requests`
2. See all MANAGER_APPROVED requests
3. Click "Approve" or "Reject"
4. Add optional comments
5. Submit final decision
6. If approved, attendance records are automatically created for leave dates

### For Admin:
- Can access both Manager and HR pages
- Has full approval rights at both levels

## Testing Checklist

1. ✅ Employee can apply for leave
2. ✅ Manager can see pending requests
3. ✅ Manager can approve/reject
4. ✅ HR can see manager-approved requests
5. ✅ HR can final approve/reject
6. ✅ Admin can access both pages
7. ✅ Status updates correctly
8. ✅ Field names display correctly
9. ✅ Date validation works
10. ✅ Leave appears in calendar after HR approval

All features are complete and working! 🎉

