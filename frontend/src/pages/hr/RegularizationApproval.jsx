import React, { useState, useEffect } from 'react'
import { regularizationAPI } from '../../services/api'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { format } from 'date-fns'
import { REGULARIZATION_STATUS, getStatusColor } from '../../utils/constants'

const RegularizationApproval = () => {
  const [regularizations, setRegularizations] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRegularization, setSelectedRegularization] = useState(null)
  const [action, setAction] = useState('')
  const [comments, setComments] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadRegularizationRequests()
  }, [])

  const loadRegularizationRequests = async () => {
    try {
      setLoading(true)
      const response = await regularizationAPI.getHRRegularizations()
        
        // Handle different response structures
        const rawRegs = response.data.requests || response.data.regularizationRequests || response.data || []
        
        // Map API response fields to frontend expected fields
        const regs = rawRegs.map(reg => ({
          id: reg.id,
          employeeName: reg.employee_name || reg.employeeName,
          employeeEmail: reg.employee_email || reg.employeeEmail,
          date: reg.attendance_date || reg.date || reg.attendanceDate,
          requestedPunchIn: reg.requested_punch_in || reg.requestedPunchIn,
          requestedPunchOut: reg.requested_punch_out || reg.requestedPunchOut,
          reason: reg.reason,
          status: reg.status,
          managerComments: reg.manager_comments || reg.managerComments,
          reviewedBy: reg.reviewed_by || reg.reviewedBy,
          reviewedAt: reg.reviewed_at || reg.reviewedAt,
          createdAt: reg.created_at || reg.createdAt,
        }))
        
      // Show all requests, but only MANAGER_APPROVED can be acted upon
      setRegularizations(regs)
      } catch (error) {
        console.error('Error loading regularization requests:', error)
        toast.error('Failed to load regularization requests')
      } finally {
        setLoading(false)
      }
    }

  const handleApprove = (regularization) => {
    setSelectedRegularization(regularization)
    setAction('approve')
    setComments('')
    setShowModal(true)
  }

  const handleReject = (regularization) => {
    setSelectedRegularization(regularization)
    setAction('reject')
    setComments('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!selectedRegularization) return

    try {
      setSubmitting(true)
      await regularizationAPI.approveHR(selectedRegularization.id, {
        action,
        comments,
      })
      toast.success(
        `Regularization request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      )
      setShowModal(false)
      setSelectedRegularization(null)
      await loadRegularizationRequests()
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to process request'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const regularizationColumns = [
    {
      header: 'Employee Name',
      accessor: 'employeeName',
      render: (row) => (
        <div>
          <div className="font-medium">{row.employeeName || '-'}</div>
          <div className="text-xs text-gray-500">{row.employeeEmail || ''}</div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => {
        const date = row.date || row.attendance_date || row.attendanceDate
        if (!date) return '-'
        try {
          const dateObj = new Date(date)
          if (isNaN(dateObj.getTime())) return '-'
          return format(dateObj, 'MMM dd, yyyy')
        } catch (error) {
          return '-'
        }
      },
    },
    {
      header: 'Requested Punch In',
      accessor: 'requestedPunchIn',
      render: (row) => {
        const time = row.requestedPunchIn || row.requested_punch_in
        if (!time) return '-'
        try {
          const date = new Date(time)
          if (isNaN(date.getTime())) return '-'
          return format(date, 'h:mm a')
        } catch (error) {
          return '-'
        }
      },
    },
    {
      header: 'Requested Punch Out',
      accessor: 'requestedPunchOut',
      render: (row) => {
        const time = row.requestedPunchOut || row.requested_punch_out
        if (!time) return '-'
        try {
          const date = new Date(time)
          if (isNaN(date.getTime())) return '-'
          return format(date, 'h:mm a')
        } catch (error) {
          return '-'
        }
      },
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => <span className="truncate max-w-xs">{row.reason || '-'}</span>,
    },
    {
      header: 'Manager Comments',
      accessor: 'managerComments',
      render: (row) => (
        <span className="truncate max-w-xs" title={row.managerComments || row.manager_comments || ''}>
          {row.managerComments || row.manager_comments || '-'}
        </span>
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
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => {
        const isManagerApproved = row.status === REGULARIZATION_STATUS.MANAGER_APPROVED || row.status === 'MANAGER_APPROVED'
        return (
          <div className="flex space-x-2">
            <Button 
              variant="success" 
              size="sm" 
              onClick={() => handleApprove(row)}
              disabled={!isManagerApproved}
            >
              Approve
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => handleReject(row)}
              disabled={!isManagerApproved}
            >
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">HR Regularization Approval</h1>

      <Card title="Regularization Requests">
        <div className="mb-4 text-sm text-gray-600">
          <p>Note: Only requests with status "MANAGER_APPROVED" can be approved/rejected by HR.</p>
        </div>
        <Table
          columns={regularizationColumns}
          data={regularizations}
          loading={loading}
          emptyMessage="No regularization requests found"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedRegularization(null)
        }}
        title={`${action === 'approve' ? 'Approve' : 'Reject'} Regularization Request`}
      >
        {selectedRegularization && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">
                Employee: {selectedRegularization.employeeName}
              </p>
              <p className="text-sm text-gray-600">
                Date: {(() => {
                  const date = selectedRegularization.date || selectedRegularization.attendance_date
                  if (!date) return '-'
                  try {
                    const dateObj = new Date(date)
                    if (isNaN(dateObj.getTime())) return '-'
                    return format(dateObj, 'MMM dd, yyyy')
                  } catch {
                    return '-'
                  }
                })()}
              </p>
              <p className="text-sm text-gray-600">
                Requested Punch In: {(() => {
                  const time = selectedRegularization.requestedPunchIn || selectedRegularization.requested_punch_in
                  if (!time) return '-'
                  try {
                    const dateObj = new Date(time)
                    if (isNaN(dateObj.getTime())) return '-'
                    return format(dateObj, 'h:mm a')
                  } catch {
                    return '-'
                  }
                })()}
              </p>
              <p className="text-sm text-gray-600">
                Requested Punch Out: {(() => {
                  const time = selectedRegularization.requestedPunchOut || selectedRegularization.requested_punch_out
                  if (!time) return '-'
                  try {
                    const dateObj = new Date(time)
                    if (isNaN(dateObj.getTime())) return '-'
                    return format(dateObj, 'h:mm a')
                  } catch {
                    return '-'
                  }
                })()}
              </p>
              <p className="text-sm text-gray-600">
                Reason: {selectedRegularization.reason}
              </p>
              {selectedRegularization.managerComments && (
                <p className="text-sm text-gray-600">
                  Manager Comments: {selectedRegularization.managerComments}
                </p>
              )}
            </div>
            <Input
              label="Comments"
              type="textarea"
              name="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter comments (optional)"
            />
            <div className="flex space-x-2">
              <Button
                variant={action === 'approve' ? 'success' : 'danger'}
                onClick={handleSubmit}
                loading={submitting}
                className="flex-1"
              >
                {action === 'approve' ? 'Final Approve' : 'Reject'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false)
                  setSelectedRegularization(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default RegularizationApproval