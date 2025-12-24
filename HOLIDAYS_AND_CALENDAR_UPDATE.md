# Holidays and Calendar Updates - Complete Implementation

## ✅ Features Implemented

### 1. **Manager-Approved Leaves**
- ✅ Calendar now shows leaves when **MANAGER_APPROVED** (not just HR_APPROVED)
- ✅ Both `MANAGER_APPROVED` and `HR_APPROVED` leaves are displayed
- ✅ Leave status reflects immediately after manager approval

### 2. **Holidays Management (Admin)**
- ✅ New `holidays` table in database
- ✅ Admin can add/edit/delete holidays from Settings page
- ✅ Holidays are marked in calendar with "H" status
- ✅ Holidays override weekends and attendance

### 3. **Employee Monthly Calendar View**
- ✅ New page: `/my-calendar` for employees
- ✅ Shows employee's own monthly attendance calendar
- ✅ Same color coding as admin calendar
- ✅ Summary statistics per employee
- ✅ Calendar grid view with all days

## Database Schema

### Holidays Table
```sql
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**To create the table, run:**
```sql
-- Run this in your PostgreSQL database
\i backend/src/config/holidays-schema.sql
```

Or manually:
```sql
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
```

## Backend Endpoints

### Admin Holidays Management
- `GET /api/admin/holidays?year=2025` - Get all holidays for a year
- `POST /api/admin/holidays` - Create holiday
  ```json
  {
    "date": "2025-12-25",
    "name": "Christmas",
    "description": "Christmas Day"
  }
  ```
- `PUT /api/admin/holidays/:id` - Update holiday
- `DELETE /api/admin/holidays/:id` - Delete holiday

### Employee Monthly Calendar
- `GET /api/attendance/my-calendar?month=12&year=2025` - Get employee's monthly calendar

### Admin Monthly Calendar (Updated)
- `GET /api/admin/monthly-attendance-calendar?month=12&year=2025` - Now includes:
  - Manager-approved leaves
  - Admin-defined holidays
  - Weekend detection

## Frontend Pages

### 1. Admin Settings - Holidays Tab
**Path**: `/admin/settings` → Click "Holidays" tab

**Features**:
- View all holidays for selected year
- Add new holiday (date, name, description)
- Edit existing holiday
- Delete holiday
- Filter by year

### 2. Employee Monthly Calendar
**Path**: `/my-calendar`

**Features**:
- Monthly calendar grid view
- Color-coded status (P/A/L/I/H)
- Summary statistics
- Shows:
  - Present days
  - Absent days
  - Leave days (Manager/HR approved)
  - Incomplete days
  - Holidays (admin-defined + weekends)

### 3. Admin Monthly Calendar (Updated)
**Path**: `/admin/monthly-calendar`

**Now includes**:
- Manager-approved leaves
- Admin-defined holidays
- All employees in one view

## Status Priority Logic

The calendar determines status in this order:
1. **Admin-defined Holiday** → Shows "H" (Holiday)
2. **Weekend** → Shows "H" (Holiday)
3. **Leave (Manager/HR Approved)** → Shows "L" (Leave)
4. **Attendance** → Shows "P" (Present), "I" (Incomplete), or "A" (Absent)

## Color Coding

- 🟢 **Green (P)** = Present (punched in and out)
- 🔴 **Red (A)** = Absent (no punch in)
- 🔵 **Blue (L)** = Leave (approved)
- 🟡 **Yellow (I)** = Incomplete (punched in but not out)
- ⚪ **Gray (H)** = Holiday/Weekend

## Navigation Updates

### Employee Sidebar
- Added "My Calendar" link

### Admin Settings
- Added "Holidays" tab in Settings page

## Testing Checklist

1. **Create Holiday**:
   - Go to Admin → Settings → Holidays
   - Click "Add Holiday"
   - Enter date, name, description
   - Save
   - Check calendar - should show "H" on that date

2. **Manager Approve Leave**:
   - Employee applies for leave
   - Manager approves it
   - Check employee calendar - should show "L" on leave dates
   - Check admin calendar - should show "L" for that employee

3. **Employee Calendar**:
   - Login as employee
   - Go to "My Calendar"
   - Select month/year
   - Should see personal calendar with all statuses

4. **Holiday Override**:
   - Create a holiday on a weekday
   - Check calendar - should show "H" even if employee was present
   - Holiday takes priority over attendance

## Files Modified/Created

### Backend
- `backend/src/config/holidays-schema.sql` (NEW)
- `backend/src/controllers/adminController.js` (UPDATED)
- `backend/src/controllers/attendanceController.js` (UPDATED - added getMyMonthlyCalendar)
- `backend/src/routes/admin.js` (UPDATED - added holidays routes)
- `backend/src/routes/attendance.js` (UPDATED - added my-calendar route)

### Frontend
- `frontend/src/pages/admin/Holidays.jsx` (NEW)
- `frontend/src/pages/admin/Settings.jsx` (UPDATED - added holidays tab)
- `frontend/src/pages/MyMonthlyCalendar.jsx` (NEW)
- `frontend/src/services/api.js` (UPDATED - added holidays and calendar APIs)
- `frontend/src/App.jsx` (UPDATED - added my-calendar route)
- `frontend/src/components/layout/Sidebar.jsx` (UPDATED - added My Calendar link)

## Next Steps

1. **Run the holidays table creation SQL** in your database
2. **Restart backend server** to load new routes
3. **Test holidays management** from admin panel
4. **Test employee calendar** view
5. **Verify manager-approved leaves** show correctly

All features are now complete! 🎉

