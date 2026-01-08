const pool = require('../config/database');
const { calculateDistance } = require('../utils/haversine');
const { isValidLatitude, isValidLongitude, isValidIP } = require('../utils/validators');

/**
 * Get office settings
 */
const getOfficeSettings = async () => {
  const result = await pool.query(
    'SELECT latitude, longitude, radius_meters, office_public_ip FROM office_settings ORDER BY id DESC LIMIT 1'
  );
  
  if (result.rows.length === 0) {
    // Return defaults if no settings exist - Collabra Technologies, KPHB Colony, Hyderabad
    return {
      latitude: parseFloat(process.env.DEFAULT_OFFICE_LATITUDE || '17.489313654492967'),
      longitude: parseFloat(process.env.DEFAULT_OFFICE_LONGITUDE || '78.39285505628658'),
      radius_meters: parseInt(process.env.DEFAULT_OFFICE_RADIUS || '50'), // 50m geofence
      office_public_ip: process.env.DEFAULT_OFFICE_PUBLIC_IP || '103.206.104.149',
    };
  }
  
  return result.rows[0];
};

/**
 * Validate location and IP
 * Returns detailed validation results for both location and Wi-Fi separately
 */
const validateLocationAndIP = async (latitude, longitude, ipAddress) => {
  const settings = await getOfficeSettings();
  
  // Validate location format
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return { 
      valid: false, 
      locationValid: false,
      wifiValid: false,
      error: 'Invalid latitude or longitude' 
    };
  }
  
  // Validate IP format
  if (!isValidIP(ipAddress)) {
    return { 
      valid: false, 
      locationValid: false,
      wifiValid: false,
      error: 'Invalid IP address format' 
    };
  }
  
  // Calculate distance
  const distance = calculateDistance(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(settings.latitude),
    parseFloat(settings.longitude)
  );
  
  // Check location (distance) - separate validation
  const locationValid = distance <= settings.radius_meters;
  const locationError = locationValid 
    ? null 
    : `Location is ${distance.toFixed(2)} meters away from office. Must be within ${settings.radius_meters} meters.`;
  
  // Check IP match (Wi-Fi) - separate validation
  const wifiValid = ipAddress === settings.office_public_ip;
  const wifiError = wifiValid 
    ? null 
    : `Not connected to office Wi-Fi. Your IP: ${ipAddress}, Office IP: ${settings.office_public_ip}`;
  
  // Both must be valid for overall validation
  const valid = locationValid && wifiValid;
  const error = !locationValid ? locationError : (!wifiValid ? wifiError : null);
  
  return { 
    valid, 
    locationValid,
    wifiValid,
    distance: distance.toFixed(2),
    error,
    locationError,
    wifiError,
  };
};

/**
 * Punch In
 */
/**
 * Punch In - Supports multiple punches per day (max 4)
 */
const punchIn = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const MAX_PUNCHES_PER_DAY = 4;
    
    // Validate input
    if (!latitude || !longitude || !ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and IP address are required',
      });
    }
    
    // Validate location and IP
    const validation = await validateLocationAndIP(latitude, longitude, ipAddress);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }
    
    // Check if there's an approved leave for today
    const leaveCheck = await pool.query(
      `SELECT id FROM leave_requests 
       WHERE employee_id = $1 
         AND status IN ('MANAGER_APPROVED', 'HR_APPROVED')
         AND DATE(from_date) <= $2 
         AND DATE(to_date) >= $2`,
      [employeeId, today]
    );
    
    if (leaveCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot mark attendance on approved leave dates',
      });
    }
    
    // Check if new punch event tables exist
    let useNewTables = false;
    try {
      const tableCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'punch_in_events')"
      );
      useNewTables = tableCheck.rows[0].exists;
    } catch (err) {
      useNewTables = false;
    }
    
    // Get or create today's attendance record
    let attendanceResult = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    let attendanceId;
    const punchInTime = new Date();
    
    if (useNewTables) {
      // Use new table structure with multiple punches
      if (attendanceResult.rows.length === 0) {
        // Create new attendance record
        const insertResult = await pool.query(
          'INSERT INTO attendance (employee_id, date, punch_in_count, punch_out_count, is_currently_in) VALUES ($1, $2, 0, 0, false) RETURNING id',
          [employeeId, today]
        );
        attendanceId = insertResult.rows[0].id;
      } else {
        attendanceId = attendanceResult.rows[0].id;
        
        // Check if already punched in (has active punch in)
        const activePunchIn = await pool.query(
          'SELECT id FROM punch_in_events WHERE attendance_id = $1 AND is_active = true LIMIT 1',
          [attendanceId]
        );
        
        if (activePunchIn.rows.length > 0) {
      return res.status(400).json({
        success: false,
            error: 'You are already punched in. Please punch out first.',
          });
        }
        
        // Check punch count limit
        const punchCountResult = await pool.query(
          'SELECT COUNT(*) as count FROM punch_in_events WHERE attendance_id = $1',
          [attendanceId]
        );
        const punchCount = parseInt(punchCountResult.rows[0].count);
        
        if (punchCount >= MAX_PUNCHES_PER_DAY) {
          return res.status(400).json({
            success: false,
            error: `Maximum ${MAX_PUNCHES_PER_DAY} punch ins allowed per day`,
          });
        }
    }
    
      // Create punch in event
      const punchInEventResult = await pool.query(
        `INSERT INTO punch_in_events 
         (attendance_id, employee_id, date, punch_in_time, latitude, longitude, distance_meters, ip_address, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) 
         RETURNING id`,
        [attendanceId, employeeId, today, punchInTime, latitude, longitude, validation.distance, ipAddress]
      );
      
      const punchInEventId = punchInEventResult.rows[0].id;
      
      // Update attendance record
        await pool.query(
        `UPDATE attendance 
         SET punch_in_count = COALESCE(punch_in_count, 0) + 1,
             current_punch_in_id = $1,
             is_currently_in = true,
             punch_in = $2,
             latitude = $3,
             longitude = $4,
             distance_meters = $5,
             ip_address = $6
         WHERE id = $7`,
        [punchInEventId, punchInTime, latitude, longitude, validation.distance, ipAddress, attendanceId]
      );
      
      // Fetch updated attendance with punch events
      const updatedAttendance = await pool.query(
        `SELECT a.*, 
                (SELECT COUNT(*) FROM punch_in_events WHERE attendance_id = a.id) as total_punch_ins,
                (SELECT COUNT(*) FROM punch_out_events WHERE attendance_id = a.id) as total_punch_outs
         FROM attendance a 
         WHERE a.id = $1`,
        [attendanceId]
      );
      
      // Get all punch events for today
      const punchEvents = await pool.query(
        `SELECT 
          pi.id as punch_in_id,
          pi.punch_in_time,
          pi.is_active,
          po.id as punch_out_id,
          po.punch_out_time,
          po.is_auto,
          po.reason
         FROM punch_in_events pi
         LEFT JOIN punch_out_events po ON pi.id = po.punch_in_event_id
         WHERE pi.attendance_id = $1
         ORDER BY pi.punch_in_time DESC`,
        [attendanceId]
      );
      
      res.json({
        success: true,
        message: 'Punched in successfully',
        attendance: updatedAttendance.rows[0],
        punchEvents: punchEvents.rows,
        punchInCount: parseInt(updatedAttendance.rows[0].total_punch_ins || 1),
        punchOutCount: parseInt(updatedAttendance.rows[0].total_punch_outs || 0),
      });
    } else {
      // Use basic table structure (single punch per day)
      if (attendanceResult.rows.length > 0 && attendanceResult.rows[0].punch_in) {
        return res.status(400).json({
          success: false,
          error: 'Already punched in for today',
        });
      }
      
      if (attendanceResult.rows.length === 0) {
        // Create new attendance record
        const insertResult = await pool.query(
          'INSERT INTO attendance (employee_id, date, punch_in, latitude, longitude, distance_meters, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [employeeId, today, punchInTime, latitude, longitude, validation.distance, ipAddress]
        );
        attendanceId = insertResult.rows[0].id;
      } else {
        // Update existing record
        attendanceId = attendanceResult.rows[0].id;
        await pool.query(
          'UPDATE attendance SET punch_in = $1, latitude = $2, longitude = $3, distance_meters = $4, ip_address = $5 WHERE id = $6',
          [punchInTime, latitude, longitude, validation.distance, ipAddress, attendanceId]
        );
    }
    
    // Fetch updated attendance
    const result = await pool.query(
        'SELECT * FROM attendance WHERE id = $1',
        [attendanceId]
    );
    
    res.json({
      success: true,
      message: 'Punched in successfully',
      attendance: result.rows[0],
        punchInCount: 1,
        punchOutCount: result.rows[0].punch_out ? 1 : 0,
    });
    }
  } catch (error) {
    console.error('Punch in error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Database error: ${error.message}${error.detail ? ` - ${error.detail}` : ''}`
      : 'Internal server error';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Punch Out
 */
/**
 * Punch Out - Supports multiple punches per day
 */
const punchOut = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Validate input
    if (!latitude || !longitude || !ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and IP address are required',
      });
    }
    
    // Validate location and IP
    const validation = await validateLocationAndIP(latitude, longitude, ipAddress);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }
    
    // Check if new punch event tables exist
    let useNewTables = false;
    try {
      const tableCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'punch_in_events')"
      );
      useNewTables = tableCheck.rows[0].exists;
    } catch (err) {
      useNewTables = false;
    }
    
    // Get today's attendance
    const attendanceResult = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (attendanceResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No attendance record found for today',
      });
    }
    
    const attendance = attendanceResult.rows[0];
    const punchOutTime = new Date();
    
    if (!attendance.punch_in) {
      return res.status(400).json({
        success: false,
        error: 'Must punch in before punching out',
      });
    }
    
    if (attendance.punch_out) {
      return res.status(400).json({
        success: false,
        error: 'Already punched out for today',
      });
    }
    
    // Check if attendance_out_periods table exists
    let totalOutTimeMinutes = attendance.total_out_time_minutes || 0;
    let hasOutPeriodsTable = false;
    
    try {
      const tableCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance_out_periods')"
      );
      hasOutPeriodsTable = tableCheck.rows[0].exists;
      
      if (hasOutPeriodsTable) {
        // Close any active OUT period
        const activeOutPeriodResult = await pool.query(
      `SELECT * FROM attendance_out_periods 
       WHERE attendance_id = $1 AND in_time IS NULL 
       ORDER BY out_time DESC LIMIT 1`,
          [attendance.id]
    );
    
        if (activeOutPeriodResult.rows.length > 0) {
          const outPeriod = activeOutPeriodResult.rows[0];
      const outTime = new Date(outPeriod.out_time);
      const durationMinutes = Math.floor((punchOutTime - outTime) / 1000 / 60);
      
      await pool.query(
        `UPDATE attendance_out_periods 
         SET in_time = $1, duration_minutes = $2, reason = 'MANUAL'
         WHERE id = $3`,
        [punchOutTime, durationMinutes, outPeriod.id]
      );
      
          totalOutTimeMinutes += durationMinutes;
        }
        
        // Recalculate total out time from all periods
        const allPeriodsResult = await pool.query(
          `SELECT SUM(duration_minutes) as total FROM attendance_out_periods 
           WHERE attendance_id = $1 AND in_time IS NOT NULL`,
          [attendance.id]
        );
        
        if (allPeriodsResult.rows[0].total) {
          totalOutTimeMinutes = parseInt(allPeriodsResult.rows[0].total);
        }
      }
    } catch (err) {
      console.log('Error handling out periods:', err.message);
    }
    
    // Calculate net working time
    const punchInTime = new Date(attendance.punch_in);
    const totalMinutes = Math.floor((punchOutTime - punchInTime) / 1000 / 60);
    const netWorkingMinutes = Math.max(0, totalMinutes - totalOutTimeMinutes);
    
    // Calculate status based on net working time
    let status = 'PRESENT';
    if (netWorkingMinutes < 240) { // Less than 4 hours
      status = 'ABSENT';
    } else if (netWorkingMinutes < 480) { // Less than 8 hours
      status = 'HALF_DAY';
    } else { // 8 hours or more
      status = 'PRESENT';
    }
    
    // Update attendance record
    await pool.query(
      `UPDATE attendance 
       SET punch_out = $1, 
           status = $2,
           total_out_time_minutes = $3
       WHERE id = $4`,
      [punchOutTime, status, totalOutTimeMinutes, attendance.id]
    );
    
    // Fetch updated attendance
    const result = await pool.query(
      'SELECT * FROM attendance WHERE id = $1',
      [attendance.id]
    );
    
    // Get OUT sessions if table exists
    let outSessions = [];
    if (hasOutPeriodsTable) {
      try {
        const sessionsResult = await pool.query(
          `SELECT * FROM attendance_out_periods 
           WHERE attendance_id = $1 
           ORDER BY out_time ASC`,
          [attendance.id]
        );
        outSessions = sessionsResult.rows.map(period => ({
          id: period.id,
          outTime: period.out_time,
          inTime: period.in_time,
          durationMinutes: period.duration_minutes,
          reason: period.reason,
        }));
      } catch (err) {
        console.log('Error fetching out sessions:', err.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Punched out successfully',
      attendance: result.rows[0],
      outCount: attendance.out_count || 0,
      totalOutTimeMinutes,
      totalOutTimeHours: parseFloat((totalOutTimeMinutes / 60).toFixed(2)),
      netWorkingMinutes,
      netWorkingHours: parseFloat((netWorkingMinutes / 60).toFixed(2)),
      totalTimeMinutes: totalMinutes,
      totalTimeHours: parseFloat((totalMinutes / 60).toFixed(2)),
      outSessions,
      status,
    });
  } catch (error) {
    console.error('Punch out error:', error);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Validate location before punch-in (pre-check)
 * Returns separate validation for location and Wi-Fi
 */
const validateLocation = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;
    
    if (!latitude || !longitude || !ipAddress) {
      return res.status(400).json({
        success: false,
        valid: false,
        locationValid: false,
        wifiValid: false,
        error: 'Latitude, longitude, and IP address are required',
      });
    }
    
    const validation = await validateLocationAndIP(latitude, longitude, ipAddress);
    const settings = await getOfficeSettings();
    
    res.json({
      success: validation.valid,
      valid: validation.valid,
      locationValid: validation.locationValid,
      wifiValid: validation.wifiValid,
      message: validation.valid 
        ? `Location and Wi-Fi validated successfully. Distance: ${validation.distance} meters from office.`
        : validation.error,
      locationError: validation.locationError || null,
      wifiError: validation.wifiError || null,
      distance: validation.distance || null,
      officeLocation: {
        latitude: settings.latitude,
        longitude: settings.longitude,
        radius: settings.radius_meters,
        ip: settings.office_public_ip,
      },
      employeeLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ip: ipAddress,
      },
    });
  } catch (error) {
    console.error('Validate location error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      locationValid: false,
      wifiValid: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get today's attendance status
 */
/**
 * Get today's attendance status
 */
/**
 * Get today's attendance status with detailed OUT-IN session tracking
 */
const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    const result = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        punchedIn: false,
        punchInTime: null,
        punchOutTime: null,
        insideOffice: false,
        outCount: 0,
        totalOutTimeMinutes: 0,
        netWorkingMinutes: 0,
        netWorkingHours: 0,
        outSessions: [],
        status: 'NOT_PUNCHED_IN',
      });
    }
    
    const attendance = result.rows[0];
    
    if (!attendance.punch_in) {
      return res.json({
        success: true,
        punchedIn: false,
        punchInTime: null,
        punchOutTime: null,
        insideOffice: false,
        outCount: 0,
        totalOutTimeMinutes: 0,
        netWorkingMinutes: 0,
        netWorkingHours: 0,
        outSessions: [],
        status: 'NOT_PUNCHED_IN',
      });
    }
    
    // Check if attendance_out_periods table exists
    let isOutside = false;
    let outSessions = [];
    let totalOutTimeMinutes = attendance.total_out_time_minutes || 0;
    let outCount = attendance.out_count || 0;
    
    try {
      const tableCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance_out_periods')"
      );
      
      if (tableCheck.rows[0].exists) {
        // Get all OUT periods for today
        const outPeriodsResult = await pool.query(
      `SELECT * FROM attendance_out_periods 
           WHERE attendance_id = $1 
           ORDER BY out_time ASC`,
      [attendance.id]
    );
    
        outSessions = outPeriodsResult.rows.map(period => ({
          id: period.id,
          outTime: period.out_time,
          inTime: period.in_time,
          durationMinutes: period.duration_minutes,
          reason: period.reason,
          isActive: period.in_time === null,
        }));
        
        // Check for active OUT period
        const activeOutPeriod = outPeriodsResult.rows.find(p => p.in_time === null);
        isOutside = !!activeOutPeriod;
        
        // Calculate total out time (including active period)
        totalOutTimeMinutes = outSessions.reduce((total, session) => {
          if (session.inTime) {
            return total + (session.durationMinutes || 0);
          } else {
            // Active session - calculate duration up to now
            const outTime = new Date(session.outTime);
            const durationMinutes = Math.floor((now - outTime) / 1000 / 60);
            return total + durationMinutes;
          }
        }, 0);
        
        outCount = outSessions.length;
      }
    } catch (err) {
      console.log('attendance_out_periods table not available:', err.message);
      isOutside = false;
    }
    
    // Calculate net working time
    let netWorkingMinutes = 0;
    let netWorkingHours = 0;
    
    if (attendance.punch_in) {
      const punchInTime = new Date(attendance.punch_in);
      const endTime = attendance.punch_out ? new Date(attendance.punch_out) : now;
      const totalMinutes = Math.floor((endTime - punchInTime) / 1000 / 60);
      netWorkingMinutes = Math.max(0, totalMinutes - totalOutTimeMinutes);
      netWorkingHours = parseFloat((netWorkingMinutes / 60).toFixed(2));
    }
    
    // Calculate status based on net working time (only if punched out)
    let status = attendance.status || 'PRESENT';
    if (attendance.punch_out) {
      if (netWorkingMinutes < 240) { // Less than 4 hours
        status = 'ABSENT';
      } else if (netWorkingMinutes < 480) { // Less than 8 hours
        status = 'HALF_DAY';
      } else { // 8 hours or more
        status = 'PRESENT';
      }
    } else {
      // Still punched in - status based on current state
      if (isOutside) {
        status = 'OUT_OF_OFFICE';
      } else {
        status = 'INSIDE_OFFICE';
      }
    }
    
    res.json({
      success: true,
      punchedIn: !!attendance.punch_in,
      punchInTime: attendance.punch_in,
      punchOutTime: attendance.punch_out || null,
      insideOffice: attendance.punch_in && !attendance.punch_out ? !isOutside : null,
      lastHeartbeat: attendance.last_heartbeat || null,
      outCount,
      totalOutTimeMinutes,
      totalOutTimeHours: parseFloat((totalOutTimeMinutes / 60).toFixed(2)),
      netWorkingMinutes,
      netWorkingHours,
      outSessions,
      status,
      // Additional info
      totalTimeMinutes: attendance.punch_in ? Math.floor(((attendance.punch_out ? new Date(attendance.punch_out) : now) - new Date(attendance.punch_in)) / 1000 / 60) : 0,
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get my attendance
 */
const getMyAttendance = async (req, res) => {
  // ... rest of the function
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;
    
    let query = 'SELECT * FROM attendance WHERE employee_id = $1';
    const params = [employeeId];
    
    if (month && year) {
      query += ' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3 ORDER BY date DESC';
      params.push(parseInt(month), parseInt(year));
    } else {
      query += ' ORDER BY date DESC LIMIT 30';
    }
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get my monthly attendance calendar
 */
const getMyMonthlyCalendar = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required',
      });
    }
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    // Get first and last day of month (in UTC to avoid timezone issues)
    const firstDay = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const lastDay = new Date(Date.UTC(yearNum, monthNum, 0));
    const daysInMonth = lastDay.getUTCDate();
    
    // Get employee info
    const empResult = await pool.query(
      'SELECT id, name, email, role FROM employees WHERE id = $1',
      [employeeId]
    );
    
    if (empResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }
    
    const employee = empResult.rows[0];
    
    // Get attendance records for the month
    const attendanceResult = await pool.query(
      `SELECT 
        a.date,
        a.punch_in,
        a.punch_out,
        CASE 
          WHEN a.punch_in IS NOT NULL AND a.punch_out IS NOT NULL THEN 'PRESENT'
          WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 'INCOMPLETE'
          WHEN a.punch_in IS NULL AND a.punch_out IS NULL THEN 'ABSENT'
          ELSE 'ABSENT'
        END as status
       FROM attendance a
       WHERE a.employee_id = $1
         AND EXTRACT(MONTH FROM a.date) = $2 
         AND EXTRACT(YEAR FROM a.date) = $3
       ORDER BY a.date`,
      [employeeId, monthNum, yearNum]
    );
    
    // Get approved leave requests for the month
    // Check if leave date range overlaps with the month
    // Use UTC methods to get date strings to avoid timezone issues
    const firstDayStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDayStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    
    const leaveResult = await pool.query(
      `SELECT 
        lr.from_date,
        lr.to_date,
        lr.leave_type,
        lr.status
       FROM leave_requests lr
       WHERE lr.employee_id = $1
         AND lr.status IN ('MANAGER_APPROVED', 'HR_APPROVED')
         AND DATE(lr.from_date) <= $2
         AND DATE(lr.to_date) >= $3
       ORDER BY lr.from_date`,
      [employeeId, lastDayStr, firstDayStr]
    );
    
    console.log(`[getMyMonthlyCalendar] Employee ${employeeId}, Month ${monthNum}/${yearNum}`);
    console.log(`[getMyMonthlyCalendar] Date range: ${firstDayStr} to ${lastDayStr}`);
    console.log(`[getMyMonthlyCalendar] Found ${leaveResult.rows.length} approved leaves`);
    
    // Get holidays for the month (handle case where table doesn't exist)
    let holidaysResult = { rows: [] };
    try {
      holidaysResult = await pool.query(
        `SELECT date, name, description
         FROM holidays
         WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
         ORDER BY date`,
        [monthNum, yearNum]
      );
    } catch (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.warn('Holidays table does not exist. Please run: node setup-holidays-table.js');
      } else {
        throw error;
      }
    }
    
    // Get approved regularization requests for the month
    let regularizationResult = { rows: [] };
    try {
      regularizationResult = await pool.query(
        `SELECT 
          attendance_date,
          requested_punch_in,
          requested_punch_out,
          status
         FROM regularization_requests
         WHERE employee_id = $1
           AND status = 'HR_APPROVED'
           AND EXTRACT(MONTH FROM attendance_date) = $2
           AND EXTRACT(YEAR FROM attendance_date) = $3
         ORDER BY attendance_date`,
        [employeeId, monthNum, yearNum]
      );
    } catch (error) {
      console.warn('Error fetching regularization requests:', error.message);
    }
    
    // Build calendar data
    const attendanceMap = new Map();
    const leaveMap = new Map();
    const holidaysSet = new Set();
    const regularizationMap = new Map();
    
    // Map attendance by date
    attendanceResult.rows.forEach(att => {
      const dateStr = att.date.toISOString().split('T')[0];
      attendanceMap.set(dateStr, att);
    });
    
    // Map leaves by date
    leaveResult.rows.forEach((leave, idx) => {
      console.log(`[getMyMonthlyCalendar] Processing leave ${idx + 1}: from_date=${leave.from_date}, to_date=${leave.to_date}, type=${leave.leave_type}`);
      // Handle date strings or Date objects from PostgreSQL
      // PostgreSQL returns dates as strings in ISO format or Date objects
      let fromDateStr, toDateStr;
      
      if (leave.from_date instanceof Date) {
        fromDateStr = leave.from_date.toISOString().split('T')[0];
      } else if (typeof leave.from_date === 'string') {
        // Handle both ISO strings and date-only strings
        fromDateStr = leave.from_date.split('T')[0];
      } else {
        fromDateStr = new Date(leave.from_date).toISOString().split('T')[0];
      }
      
      if (leave.to_date instanceof Date) {
        toDateStr = leave.to_date.toISOString().split('T')[0];
      } else if (typeof leave.to_date === 'string') {
        toDateStr = leave.to_date.split('T')[0];
      } else {
        toDateStr = new Date(leave.to_date).toISOString().split('T')[0];
      }
      
      // Parse dates in UTC to avoid timezone issues
      const fromDate = new Date(fromDateStr + 'T00:00:00.000Z');
      const toDate = new Date(toDateStr + 'T23:59:59.999Z');
      
      // Iterate through each day in the leave range
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        // Get date string in YYYY-MM-DD format (UTC)
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const monthCheck = currentDate.getUTCMonth() + 1;
        const yearCheck = currentDate.getUTCFullYear();
        
        // Only add if it's in the requested month
        if (monthCheck === monthNum && yearCheck === yearNum) {
          if (!leaveMap.has(dateStr)) {
            leaveMap.set(dateStr, leave.leave_type);
            console.log(`[getMyMonthlyCalendar] Added leave for date: ${dateStr}, type: ${leave.leave_type}`);
          }
        }
        
        // Move to next day (in UTC)
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0);
      }
    });
    
    // Map holidays by date
    holidaysResult.rows.forEach(holiday => {
      const dateStr = holiday.date.toISOString().split('T')[0];
      holidaysSet.add(dateStr);
    });
    
    // Map approved regularizations by date
    regularizationResult.rows.forEach(reg => {
      let dateStr;
      try {
        if (reg.attendance_date instanceof Date) {
          dateStr = reg.attendance_date.toISOString().split('T')[0];
        } else if (typeof reg.attendance_date === 'string') {
          // Handle both ISO strings and date-only strings
          dateStr = reg.attendance_date.split('T')[0];
        } else {
          dateStr = new Date(reg.attendance_date).toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Error parsing regularization date:', reg.attendance_date, e);
        return;
      }
      
      // Regularization overrides attendance - always use regularization data if available
      regularizationMap.set(dateStr, {
        punch_in: reg.requested_punch_in,
        punch_out: reg.requested_punch_out,
        status: 'PRESENT',
      });
    });
    
    // Build calendar days
    const days = [];
    let summary = {
      totalDays: daysInMonth,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      incompleteDays: 0,
      holidayDays: 0,
    };
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Use UTC to avoid timezone issues - construct date string directly
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(Date.UTC(yearNum, monthNum - 1, day));
      const dayOfWeek = currentDate.getUTCDay();
      
      let dayStatus = 'ABSENT';
      let dayType = 'WORKDAY';
      let leaveType = null;
      
      // Priority 1: Check for approved regularization (overrides everything)
      const regularization = regularizationMap.get(dateStr);
      if (regularization) {
        dayType = 'WORKDAY';
        dayStatus = 'PRESENT';
        summary.presentDays++;
      }
      // Priority 2: Check if it's an admin-defined holiday (but not if there's regularization)
      else if (holidaysSet.has(dateStr)) {
        dayType = 'HOLIDAY';
        dayStatus = 'HOLIDAY';
        summary.holidayDays++;
      }
      // Priority 3: Check if it's a weekend (but not if there's regularization)
      else if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayType = 'WEEKEND';
        dayStatus = 'HOLIDAY';
        summary.holidayDays++;
      } else {
        // Priority 4: Check for leave
        if (leaveMap.has(dateStr)) {
          dayType = 'LEAVE';
          dayStatus = 'LEAVE';
          leaveType = leaveMap.get(dateStr);
          summary.leaveDays++;
        } else {
          // Priority 5: Check attendance
          const attendance = attendanceMap.get(dateStr);
          if (attendance) {
            dayStatus = attendance.status;
            if (attendance.status === 'PRESENT') {
              summary.presentDays++;
            } else if (attendance.status === 'INCOMPLETE') {
              summary.incompleteDays++;
            } else {
              summary.absentDays++;
            }
          } else {
            summary.absentDays++;
          }
        }
      }
      
      // Get punch in/out from regularization (priority) or attendance
      const attendance = regularizationMap.get(dateStr) || attendanceMap.get(dateStr);
      
      days.push({
        day,
        date: dateStr,
        status: dayStatus,
        type: dayType,
        leaveType,
        punchIn: attendance?.punch_in || null,
        punchOut: attendance?.punch_out || null,
      });
    }
    
    res.json({
      success: true,
      month: monthNum,
      year: yearNum,
      daysInMonth,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
      days,
      summary,
    });
  } catch (error) {
    console.error('Get my monthly calendar error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Send heartbeat - monitors user presence
 * Auto punches out if user is outside geofence or IP changed
 */
/**
 * Send heartbeat - Track OUT-IN sessions (DOES NOT auto punch out)
 * Tracks when employee goes outside office radius or disconnects from Wi-Fi
 */
const sendHeartbeat = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Validate input
    if (!latitude || !longitude || !ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and IP address are required',
      });
    }
    
    // Get today's attendance
    const attendanceResult = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (attendanceResult.rows.length === 0 || !attendanceResult.rows[0].punch_in) {
      return res.json({
        success: true,
        message: 'Not currently punched in',
        punchedIn: false,
      });
    }
    
    const attendance = attendanceResult.rows[0];
    
    // If already punched out, return
    if (attendance.punch_out) {
      return res.json({
        success: true,
        message: 'Already punched out',
        punchedIn: false,
      });
    }
    
    // Validate location and IP
    let validation;
    let settings;
    let isOutsideOffice = false;
    
    try {
      // Edge case: If GPS is off or location unavailable, treat as outside
      // Edge case: If IP is null/empty, treat as disconnected
      if (!latitude || !longitude || !ipAddress) {
        isOutsideOffice = true; // Missing data = outside
        validation = { locationValid: false, wifiValid: false };
        settings = await getOfficeSettings();
      } else {
        validation = await validateLocationAndIP(latitude, longitude, ipAddress);
        settings = await getOfficeSettings();
    
        // Check if user is outside office (geo > radius OR IP changed from office Wi-Fi)
        isOutsideOffice = !validation.locationValid || 
                         (ipAddress !== settings.office_public_ip);
      }
    } catch (err) {
      // Edge case: Network error or validation failure - assume outside
      console.error('Validation error in heartbeat:', err.message);
      isOutsideOffice = true;
      validation = { locationValid: false, wifiValid: false };
      try {
        settings = await getOfficeSettings();
      } catch {
        settings = { office_public_ip: '' };
      }
    }
    
    // Update last heartbeat
    try {
    await pool.query(
        'UPDATE attendance SET last_heartbeat = $1, latitude = $2, longitude = $3, ip_address = $4 WHERE id = $5',
        [now, latitude, longitude, ipAddress, attendance.id]
    );
    } catch (err) {
      // Column doesn't exist - use basic update
      await pool.query(
        'UPDATE attendance SET latitude = $1, longitude = $2, ip_address = $3 WHERE id = $4',
        [latitude, longitude, ipAddress, attendance.id]
      );
    }
    
    // Check if attendance_out_periods table exists
    let hasOutPeriodsTable = false;
    try {
      const tableCheck = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance_out_periods')"
      );
      hasOutPeriodsTable = tableCheck.rows[0].exists;
    } catch (err) {
      hasOutPeriodsTable = false;
    }
    
    if (hasOutPeriodsTable) {
      // Check for active OUT period
      const activeOutPeriodResult = await pool.query(
        `SELECT * FROM attendance_out_periods 
         WHERE attendance_id = $1 AND in_time IS NULL 
         ORDER BY out_time DESC LIMIT 1`,
        [attendance.id]
      );
      
      const hasActiveOutPeriod = activeOutPeriodResult.rows.length > 0;
      
      if (isOutsideOffice && !hasActiveOutPeriod) {
        // Employee just went OUT - create new OUT period
        const reason = !validation.locationValid ? 'GEO_FENCE_EXIT' : 'IP_CHANGE';
        
          await pool.query(
          `INSERT INTO attendance_out_periods 
           (attendance_id, out_time, reason) 
           VALUES ($1, $2, $3)`,
          [attendance.id, now, reason]
        );
        
        // Increment out count
        await pool.query(
          'UPDATE attendance SET out_count = COALESCE(out_count, 0) + 1 WHERE id = $1',
          [attendance.id]
        );
      
      return res.json({
        success: true,
          message: 'Marked as OUT OF OFFICE',
        punchedIn: true,
          insideOffice: false,
          status: 'OUT_OF_OFFICE',
        locationValid: validation.locationValid,
        wifiValid: validation.wifiValid,
          outTime: now,
      });
      } else if (!isOutsideOffice && hasActiveOutPeriod) {
        // Employee just came back IN - close the OUT period
        const outPeriod = activeOutPeriodResult.rows[0];
        const outTime = new Date(outPeriod.out_time);
        const durationMinutes = Math.floor((now - outTime) / 1000 / 60);
        
        await pool.query(
          `UPDATE attendance_out_periods 
           SET in_time = $1, duration_minutes = $2 
           WHERE id = $3`,
          [now, durationMinutes, outPeriod.id]
        );
        
        // Update total out time
        await pool.query(
          'UPDATE attendance SET total_out_time_minutes = COALESCE(total_out_time_minutes, 0) + $1 WHERE id = $2',
          [durationMinutes, attendance.id]
          );
          
          return res.json({
            success: true,
          message: 'Back IN OFFICE',
          punchedIn: true,
          insideOffice: true,
          status: 'INSIDE_OFFICE',
          locationValid: validation.locationValid,
          wifiValid: validation.wifiValid,
          inTime: now,
          outDurationMinutes: durationMinutes,
        });
      } else if (isOutsideOffice && hasActiveOutPeriod) {
        // Still outside - update status
      return res.json({
        success: true,
          message: 'Still OUT OF OFFICE',
          punchedIn: true,
          insideOffice: false,
          status: 'OUT_OF_OFFICE',
          locationValid: validation.locationValid,
          wifiValid: validation.wifiValid,
        });
      } else {
        // Still inside - update status
        return res.json({
          success: true,
          message: 'Inside office',
          punchedIn: true,
        insideOffice: true,
          status: 'INSIDE_OFFICE',
          locationValid: validation.locationValid,
          wifiValid: validation.wifiValid,
        });
      }
    } else {
      // Table doesn't exist - return basic status
      return res.json({
        success: true,
        message: isOutsideOffice ? 'Outside office area' : 'Inside office',
        punchedIn: true,
        insideOffice: !isOutsideOffice,
        status: isOutsideOffice ? 'OUT_OF_OFFICE' : 'INSIDE_OFFICE',
        locationValid: validation.locationValid,
        wifiValid: validation.wifiValid,
      });
    }
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Check and auto punch out users with no heartbeat for > 10 minutes
 * This should be called by a cron job or scheduled task
 */
const checkHeartbeatTimeouts = async () => {
  try {
    // Check if last_heartbeat column exists
    let hasHeartbeatColumn = false;
    try {
      const columnCheck = await pool.query(
        `SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'attendance' 
          AND column_name = 'last_heartbeat'
        )`
      );
      hasHeartbeatColumn = columnCheck.rows[0].exists;
    } catch (err) {
      // If check fails, assume column doesn't exist
      hasHeartbeatColumn = false;
    }
    
    // If heartbeat column doesn't exist, skip this check
    if (!hasHeartbeatColumn) {
      console.log('[Heartbeat Check] last_heartbeat column not found. Skipping heartbeat timeout check.');
      return 0;
    }
    
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];
    
    // Find all users who punched in today, haven't punched out, and haven't sent heartbeat in 10+ minutes
    const result = await pool.query(
      `SELECT a.*, e.name, e.email 
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.date = $1 
         AND a.punch_in IS NOT NULL 
         AND a.punch_out IS NULL
         AND (a.last_heartbeat IS NULL OR a.last_heartbeat < $2)`,
      [today, tenMinutesAgo]
    );
    
    const now = new Date();
    
    for (const attendance of result.rows) {
      // Auto punch out
      try {
        // Check if is_auto_punched_out column exists
        const autoPunchColumnCheck = await pool.query(
          `SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'attendance' 
            AND column_name = 'is_auto_punched_out'
          )`
        );
        const hasAutoPunchColumn = autoPunchColumnCheck.rows[0].exists;
        
        if (hasAutoPunchColumn) {
          await pool.query(
            'UPDATE attendance SET punch_out = $1, is_auto_punched_out = true, status = $2 WHERE id = $3',
            [now, 'INCOMPLETE', attendance.id]
          );
        } else {
          await pool.query(
            'UPDATE attendance SET punch_out = $1, status = $2 WHERE id = $3',
            [now, 'INCOMPLETE', attendance.id]
          );
        }
      } catch (err) {
        console.error('Error auto punching out:', err.message);
        continue;
      }
      
      // If there's an active OUT period, close it (only if table exists)
      try {
        const outPeriodResult = await pool.query(
          `SELECT * FROM attendance_out_periods 
           WHERE attendance_id = $1 AND in_time IS NULL 
           ORDER BY out_time DESC LIMIT 1`,
          [attendance.id]
        );
        
        if (outPeriodResult.rows.length > 0) {
          const outPeriod = outPeriodResult.rows[0];
          const outTime = new Date(outPeriod.out_time);
          const durationMinutes = Math.floor((now - outTime) / 1000 / 60);
          
          await pool.query(
            `UPDATE attendance_out_periods 
             SET in_time = $1, duration_minutes = $2, reason = 'HEARTBEAT_TIMEOUT'
             WHERE id = $3`,
            [now, durationMinutes, outPeriod.id]
          );
          
          // Check if total_out_time_minutes column exists
          const outTimeColumnCheck = await pool.query(
            `SELECT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'attendance' 
              AND column_name = 'total_out_time_minutes'
            )`
          );
          const hasOutTimeColumn = outTimeColumnCheck.rows[0].exists;
          
          if (hasOutTimeColumn) {
            await pool.query(
              'UPDATE attendance SET total_out_time_minutes = COALESCE(total_out_time_minutes, 0) + $1 WHERE id = $2',
              [durationMinutes, attendance.id]
            );
          }
        }
      } catch (err) {
        // Table doesn't exist or query failed - ignore and continue
        console.log('attendance_out_periods table not available in checkHeartbeatTimeouts:', err.message);
      }
      
      console.log(`Auto punched out employee ${attendance.employee_id} (${attendance.name}) due to heartbeat timeout`);
    }
    
    return result.rows.length;
  } catch (error) {
    // Don't throw error, just log it to prevent server crashes
    console.error('Check heartbeat timeouts error:', error.message);
    return 0;
  }
};

/**
 * Get presence status - Inside/Outside Office
 */
const getPresenceStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's attendance
    const attendanceResult = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (attendanceResult.rows.length === 0 || !attendanceResult.rows[0].punch_in) {
      return res.json({
        success: true,
        punchedIn: false,
        insideOffice: false,
        status: 'NOT_PUNCHED_IN',
      });
    }
    
    const attendance = attendanceResult.rows[0];
    
    if (attendance.punch_out) {
      return res.json({
        success: true,
        punchedIn: false,
        insideOffice: false,
        status: 'PUNCHED_OUT',
        punchOutTime: attendance.punch_out,
      });
    }
    
    // Check if there's an active OUT period (only if table exists)
    let isOutside = false;
    try {
    const outPeriodResult = await pool.query(
      `SELECT * FROM attendance_out_periods 
       WHERE attendance_id = $1 AND in_time IS NULL 
       ORDER BY out_time DESC LIMIT 1`,
      [attendance.id]
    );
      isOutside = outPeriodResult.rows.length > 0;
    } catch (err) {
      // Table doesn't exist or query failed - ignore and continue
      console.log('attendance_out_periods table not available:', err.message);
      isOutside = false;
    }
    
    return res.json({
      success: true,
      punchedIn: true,
      insideOffice: !isOutside,
      status: isOutside ? 'OUTSIDE_OFFICE' : 'INSIDE_OFFICE',
      lastHeartbeat: attendance.last_heartbeat || null,
      outCount: attendance.out_count || 0,
      totalOutTimeMinutes: attendance.total_out_time_minutes || 0,
    });
  } catch (error) {
    console.error('Get presence status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  validateLocation,
  punchIn,
  punchOut,
  getTodayStatus,
  getMyAttendance,
  getMyMonthlyCalendar,
  sendHeartbeat,
  checkHeartbeatTimeouts,
  getPresenceStatus,
};

