# Gatnix - Frontend

A comprehensive React.js frontend application for managing employee attendance with location and Wi-Fi validation.

## Features

- **Role-based Access Control**: Employee, Manager, HR, and Admin roles with different access levels
- **Attendance Tracking**: Punch in/out with geolocation and Wi-Fi validation
- **Leave Management**: Apply, approve, and track leave requests
- **Regularization**: Request and approve attendance corrections
- **Reports**: Generate and export attendance reports
- **Employee Management**: Admin can manage employees and system settings
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- React.js (v18+)
- React Router v6
- Axios (API calls)
- Context API (state management)
- Tailwind CSS (styling)
- React Hook Form (form handling)
- Date-fns (date formatting)
- React Toastify (notifications)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:3000/api`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components (Button, Input, Modal, etc.)
│   │   ├── layout/          # Layout components (Navbar, Sidebar)
│   │   └── attendance/      # Attendance-specific components
│   ├── pages/
│   │   ├── manager/         # Manager pages
│   │   ├── hr/              # HR pages
│   │   └── admin/            # Admin pages
│   ├── context/             # React Context (AuthContext)
│   ├── hooks/               # Custom hooks (useLocation)
│   ├── services/            # API service layer
│   ├── utils/               # Utility functions and constants
│   ├── App.jsx              # Main app component with routing
│   └── main.jsx             # Entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## User Roles

### Employee
- Mark attendance (punch in/out)
- Apply for leave
- Apply for regularization
- View own attendance history

### Manager
- All employee features
- View team attendance
- Approve/reject leave requests
- Approve/reject regularization requests

### HR
- All manager features
- Final approval of leave requests
- Final approval of regularization requests
- Generate and export reports

### Admin
- All HR features
- Manage employees (add, edit, delete)
- Configure office settings (location, Wi-Fi, radius)

## API Integration

The frontend expects the backend API to be running at `http://localhost:3000/api`. Make sure your backend implements the following endpoints:

### Authentication
- `POST /auth/login` - User login

### Attendance
- `GET /attendance/today` - Get today's attendance status
- `POST /attendance/punch-in` - Punch in
- `POST /attendance/punch-out` - Punch out
- `GET /attendance/my?month={month}&year={year}` - Get attendance history

### Leave
- `POST /leave/apply` - Apply for leave
- `GET /leave/my` - Get my leave requests
- `GET /manager/leave-requests` - Get team leave requests (Manager)
- `PUT /manager/leave-requests/:id` - Approve/reject leave (Manager)
- `GET /hr/leave-requests` - Get HR leave requests
- `PUT /hr/leave-requests/:id` - Final approve/reject leave (HR)

### Regularization
- `POST /regularization/apply` - Apply for regularization
- `GET /regularization/my` - Get my regularization requests
- `GET /manager/regularization-requests` - Get team regularization requests
- `PUT /manager/regularization-requests/:id` - Approve/reject regularization
- `GET /hr/regularization-requests` - Get HR regularization requests
- `PUT /hr/regularization-requests/:id` - Final approve/reject regularization

### Manager
- `GET /manager/team/attendance` - Get team attendance

### HR
- `GET /hr/reports` - Get attendance reports
- `GET /hr/reports/export` - Export reports

### Admin
- `GET /admin/employees` - Get all employees
- `POST /admin/employees` - Add employee
- `PUT /admin/employees/:id` - Update employee
- `DELETE /admin/employees/:id` - Delete employee
- `GET /admin/settings` - Get office settings
- `PUT /admin/settings` - Update office settings

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Features in Detail

### Authentication
- JWT-based authentication
- Token stored in localStorage
- Automatic token refresh on API calls
- Protected routes with role-based access

### Attendance
- Real-time location tracking using browser geolocation API
- Wi-Fi validation (handled by backend)
- Visual feedback for location and Wi-Fi status
- Attendance history with calendar view

### Forms
- Comprehensive form validation
- Error handling and user feedback
- Loading states during submission
- Success/error notifications

### Responsive Design
- Mobile-first approach
- Tailwind CSS for styling
- Accessible components with proper ARIA labels

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## Troubleshooting

### Location Permission Denied
- Ensure the browser has location permissions enabled
- Check browser settings for location access

### API Connection Errors
- Verify the backend API is running
- Check the `VITE_API_BASE_URL` in `.env`
- Check browser console for CORS errors

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (should be v16+)

## License

This project is part of Gatnix.

