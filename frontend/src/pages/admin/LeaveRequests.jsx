import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { format } from 'date-fns'
import { LEAVE_STATUS, getStatusColor } from '../../utils/constants'

const AdminLeaveRequests = () => {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    loadEmployees()
    loadLeaveRequests()
  }, [filterStatus, filterEmployee])

  const loadEmployees = async () => {
    try {
      const response = await adminAPI.getEmployees()
      setEmployees(response.data.employees || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadLeaveRequests = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterEmployee) params.employeeId = filterEmployee
      
      const response = await adminAPI.getAllLeaveRequests(params)
      // Map field names
      const leaves = (response.data.leaveRequests || []).map(leave => ({
        ...leave,
        employeeName: leave.employee_name || leave.employeeName,
        employeeEmail: leave.employee_email || leave.employeeEmail,
        leaveType: leave.leave_type || leave.leaveType,
        fromDate: leave.from_date || leave.fromDate,
        toDate: leave.to_date || leave.toDate,
        reviewerName: leave.reviewer_name || leave.reviewerName,
        reviewerEmail: leave.reviewer_email || leave.reviewerEmail,
        reviewedAt: leave.reviewed_at || leave.reviewedAt,
        createdAt: leave.created_at || leave.createdAt,
      }))
      setLeaves(leaves)
    } catch (error) {
      console.error('Error loading leave requests:', error)
      toast.error('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: '', label: 'All Status' },
    ...Object.values(LEAVE_STATUS).map((status) => ({
      value: status,
      label: status.replace(/_/g, ' '),
    })),
  ]

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...employees.map((emp) => ({
      value: emp.id.toString(),
      label: emp.name,
    })),
  ]

  const leaveColumns = [
    {
      header: 'Employee Name',
      accessor: 'employeeName',
      render: (row) => (
        <div>
          <div className="font-medium">{row.employeeName || row.employee_name || '-'}</div>
          <div className="text-xs text-gray-500">{row.employeeEmail || row.employee_email || ''}</div>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      accessor: 'leaveType',
      render: (row) => row.leaveType || row.leave_type || '-',
    },
    {
      header: 'From Date',
      accessor: 'fromDate',
      render: (row) => {
        const date = row.fromDate || row.from_date
        return date ? format(new Date(date), 'MMM dd, yyyy') : '-'
      },
    },
    {
      header: 'To Date',
      accessor: 'toDate',
      render: (row) => {
        const date = row.toDate || row.to_date
        return date ? format(new Date(date), 'MMM dd, yyyy') : '-'
      },
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => <span className="truncate max-w-xs">{row.reason || '-'}</span>,
    },
    {
      header: 'Applied On',
      accessor: 'createdAt',
      render: (row) => {
        const date = row.createdAt || row.created_at
        return date ? format(new Date(date), 'MMM dd, yyyy') : '-'
      },
    },
    {
      header: 'Approved/Rejected By',
      accessor: 'reviewerName',
      render: (row) => (
        <div>
          {row.reviewerName || row.reviewer_name ? (
            <>
              <div className="font-medium text-green-600">{row.reviewerName || row.reviewer_name}</div>
              {row.reviewedAt || row.reviewed_at ? (
                <div className="text-xs text-gray-500">
                  {format(new Date(row.reviewedAt || row.reviewed_at), 'MMM dd, yyyy')}
                </div>
              ) : null}
            </>
          ) : (
            <span className="text-gray-400">Pending</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status ? row.status.replace(/_/g, ' ') : 'PENDING'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">All Leave Requests</h1>

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Filter by Status"
            name="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
          />
          <Select
            label="Filter by Employee"
            name="filterEmployee"
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            options={employeeOptions}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilterStatus('')
                setFilterEmployee('')
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Leave Requests">
        <div className="mb-4 text-sm text-gray-600">
          View all leave requests with approval history. Shows who applied, who approved/rejected, and when.
        </div>
        <Table
          columns={leaveColumns}
          data={leaves}
          loading={loading}
          emptyMessage="No leave requests found"
        />
      </Card>
    </div>
  )
}

export default AdminLeaveRequests

