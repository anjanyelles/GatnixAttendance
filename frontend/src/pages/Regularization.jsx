import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { regularizationAPI } from '../services/api'
import { toast } from 'react-toastify'
import { REGULARIZATION_STATUS, getStatusColor } from '../utils/constants'
import { isPastDate } from '../utils/validators'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import { format } from 'date-fns'

const Regularization = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  const [regularizations, setRegularizations] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    loadRegularizations()
  }, [])

  const loadRegularizations = async () => {
    try {
      setLoading(true)
      const response = await regularizationAPI.getMyRegularizations()
      setRegularizations(response.data.requests || response.data.regularizationRequests || response.data || [])
    } catch (error) {
      console.error('Error loading regularizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)
      // Convert form data to match backend expectations
      const requestData = {
        attendanceDate: data.date,
        requestedPunchIn: `${data.date}T${data.requestedPunchIn}:00`,
        requestedPunchOut: data.requestedPunchOut ? `${data.date}T${data.requestedPunchOut}:00` : null,
        reason: data.reason,
      }
      await regularizationAPI.apply(requestData)
      toast.success('Regularization request submitted successfully!')
      reset()
      await loadRegularizations()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit regularization request'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const statusOptions = [
    { value: '', label: 'All Status' },
    ...Object.values(REGULARIZATION_STATUS).map((status) => ({
      value: status,
      label: status.replace('_', ' '),
    })),
  ]

  const filteredRegularizations = filterStatus
    ? regularizations.filter((reg) => reg.status === filterStatus)
    : regularizations

  const regularizationColumns = [
    {
      header: 'Date',
      accessor: 'attendance_date',
      render: (row) => format(new Date(row.attendance_date || row.date), 'MMM dd, yyyy'),
    },
    {
      header: 'Requested Punch In',
      accessor: 'requested_punch_in',
      render: (row) => {
        const time = row.requested_punch_in || row.requestedPunchIn
        if (!time) return '-'
        const date = new Date(time)
        return format(date, 'h:mm a')
      },
    },
    {
      header: 'Requested Punch Out',
      accessor: 'requested_punch_out',
      render: (row) => {
        const time = row.requested_punch_out || row.requestedPunchOut
        if (!time) return '-'
        const date = new Date(time)
        return format(date, 'h:mm a')
      },
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

  // Get yesterday's date as max date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const maxDate = yesterday.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Regularization</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Apply for Regularization">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Date"
              type="date"
              name="date"
              register={register('date', {
                required: 'Date is required',
                validate: (value) => {
                  if (!value) return true
                  const selectedDate = new Date(value)
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  yesterday.setHours(0, 0, 0, 0)
                  selectedDate.setHours(0, 0, 0, 0)
                  return selectedDate <= yesterday || 'Date must be in the past'
                },
              })}
              error={errors.date?.message}
              required
              max={maxDate}
            />

            <Input
              label="Requested Punch In Time"
              type="time"
              name="requestedPunchIn"
              register={register('requestedPunchIn', { required: 'Punch in time is required' })}
              error={errors.requestedPunchIn?.message}
              required
            />

            <Input
              label="Requested Punch Out Time"
              type="time"
              name="requestedPunchOut"
              register={register('requestedPunchOut', { required: 'Punch out time is required' })}
              error={errors.requestedPunchOut?.message}
              required
            />

            <Input
              label="Reason"
              type="textarea"
              name="reason"
              register={register('reason', {
                required: 'Reason is required',
                minLength: { value: 10, message: 'Reason must be at least 10 characters' },
              })}
              error={errors.reason?.message}
              required
              rows={4}
              placeholder="Enter reason for regularization"
            />

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="w-full"
            >
              Submit Request
            </Button>
          </form>
        </Card>

        <Card title="My Regularization Requests">
          <div className="mb-4">
            <select
              name="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Table
            columns={regularizationColumns}
            data={filteredRegularizations}
            loading={loading}
            emptyMessage="No regularization requests found"
          />
        </Card>
      </div>
    </div>
  )
}

export default Regularization

