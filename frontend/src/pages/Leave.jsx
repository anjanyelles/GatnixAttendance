import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { leaveAPI } from '../services/api'
import { toast } from 'react-toastify'
import { LEAVE_TYPES, LEAVE_STATUS, getStatusColor } from '../utils/constants'
import { validateDateRange, isFutureDate } from '../utils/validators'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import { format } from 'date-fns'

const Leave = () => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const fromDate = watch('fromDate')
  const toDate = watch('toDate')

  useEffect(() => {
    loadLeaves()
  }, [])

  const loadLeaves = async () => {
    try {
      setLoading(true)
      const response = await leaveAPI.getMyLeaves()
      // Map field names from backend (snake_case) to frontend (camelCase)
      const leaves = (response.data.leaveRequests || response.data || []).map(leave => ({
        ...leave,
        leaveType: leave.leave_type || leave.leaveType,
        fromDate: leave.from_date || leave.fromDate,
        toDate: leave.to_date || leave.toDate,
        createdAt: leave.created_at || leave.createdAt,
      }))
      setLeaves(leaves)
    } catch (error) {
      console.error('Error loading leaves:', error)
      toast.error('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)
      // Map camelCase to snake_case for backend
      const payload = {
        leaveType: data.leaveType,
        fromDate: data.fromDate,
        toDate: data.toDate,
        reason: data.reason,
      }
      await leaveAPI.apply(payload)
      toast.success('Leave application submitted successfully!')
      reset()
      await loadLeaves()
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to submit leave application'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const leaveTypeOptions = Object.values(LEAVE_TYPES).map((type) => ({
    value: type,
    label: type,
  }))

  const statusOptions = [
    { value: '', label: 'All Status' },
    ...Object.values(LEAVE_STATUS).map((status) => ({
      value: status,
      label: status.replace('_', ' '),
    })),
  ]

  const filteredLeaves = filterStatus
    ? leaves.filter((leave) => leave.status === filterStatus)
    : leaves

  const leaveColumns = [
    {
      header: 'Leave Type',
      accessor: 'leaveType',
    },
    {
      header: 'From Date',
      accessor: 'fromDate',
      render: (row) => format(new Date(row.fromDate), 'MMM dd, yyyy'),
    },
    {
      header: 'To Date',
      accessor: 'toDate',
      render: (row) => format(new Date(row.toDate), 'MMM dd, yyyy'),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => <span className="truncate max-w-xs">{row.reason}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Applied On',
      accessor: 'createdAt',
      render: (row) => format(new Date(row.createdAt), 'MMM dd, yyyy'),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Apply for Leave">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Select
              label="Leave Type"
              name="leaveType"
              register={register}
              validationRules={{ required: 'Leave type is required' }}
              options={leaveTypeOptions}
              error={errors.leaveType?.message}
              required
            />

            <Input
              label="From Date"
              type="date"
              name="fromDate"
              register={register}
              validationRules={{
                required: 'From date is required',
                validate: (value) => {
                  if (!value) return true
                  const selectedDate = new Date(value)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  selectedDate.setHours(0, 0, 0, 0)
                  return selectedDate >= today || 'From date must be today or in the future'
                },
              }}
              error={errors.fromDate?.message}
              required
              min={new Date().toISOString().split('T')[0]}
            />

            <Input
              label="To Date"
              type="date"
              name="toDate"
              register={register}
              validationRules={{
                required: 'To date is required',
                validate: (value) => {
                  if (!value) return true
                  if (fromDate && new Date(value) < new Date(fromDate)) {
                    return 'To date must be after or equal to from date'
                  }
                  return true
                },
              }}
              error={errors.toDate?.message}
              required
              min={fromDate || new Date().toISOString().split('T')[0]}
            />

            <Input
              label="Reason"
              type="textarea"
              name="reason"
              register={register}
              validationRules={{
                required: 'Reason is required',
                minLength: { value: 10, message: 'Reason must be at least 10 characters' },
              }}
              error={errors.reason?.message}
              required
              rows={4}
              placeholder="Enter reason for leave"
            />

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="w-full"
            >
              Submit Application
            </Button>
          </form>
        </Card>

        <Card title="My Leave Requests">
          <div className="mb-4">
            <Select
              label="Filter by Status"
              name="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={statusOptions}
            />
          </div>
          <Table
            columns={leaveColumns}
            data={filteredLeaves}
            loading={loading}
            emptyMessage="No leave requests found"
          />
        </Card>
      </div>
    </div>
  )
}

export default Leave

