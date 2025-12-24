import React, { useState, useEffect } from 'react'
import { leaveAPI } from '../../services/api'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { format } from 'date-fns'
import { LEAVE_STATUS, getStatusColor } from '../../utils/constants'

const LeaveApproval = () => {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [action, setAction] = useState('')
  const [comments, setComments] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadLeaveRequests()
  }, [])

  const loadLeaveRequests = async () => {
    try {
      setLoading(true)
      const response = await leaveAPI.getHRLeaves()
      // Filter only manager approved requests and map field names
      const leaves = (response.data.leaveRequests || response.data || []).map(leave => ({
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
      const managerApproved = leaves.filter(
        (leave) => leave.status === LEAVE_STATUS.MANAGER_APPROVED
      )
      setLeaves(managerApproved)
    } catch (error) {
      console.error('Error loading leave requests:', error)
      toast.error('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (leave) => {
    setSelectedLeave(leave)
    setAction('approve')
    setComments('')
    setShowModal(true)
  }

  const handleReject = (leave) => {
    setSelectedLeave(leave)
    setAction('reject')
    setComments('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!selectedLeave) return

    try {
      setSubmitting(true)
      await leaveAPI.approveHR(selectedLeave.id, {
        action,
        comments,
      })
      toast.success(
        `Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`
      )
      setShowModal(false)
      setSelectedLeave(null)
      await loadLeaveRequests()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to process request'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

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
      header: 'Approved By (Manager)',
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
            <span className="text-gray-400">-</span>
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
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button variant="success" size="sm" onClick={() => handleApprove(row)}>
            Approve
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleReject(row)}>
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">HR Leave Approval</h1>

      <Card title="Manager Approved Leave Requests">
        <div className="mb-4 text-sm text-gray-600">
          Showing leave requests that have been approved by managers and need your final approval
        </div>
        <Table
          columns={leaveColumns}
          data={leaves}
          loading={loading}
          emptyMessage="No leave requests pending HR approval"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedLeave(null)
        }}
        title={`${action === 'approve' ? 'Approve' : 'Reject'} Leave Request`}
      >
        {selectedLeave && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-gray-700">Employee Details</p>
                <p className="text-sm text-gray-600">
                  Name: {selectedLeave.employeeName || selectedLeave.employee_name || '-'}
                </p>
                <p className="text-sm text-gray-600">
                  Email: {selectedLeave.employeeEmail || selectedLeave.employee_email || '-'}
                </p>
                <p className="text-sm text-gray-600">
                  Applied On: {selectedLeave.createdAt || selectedLeave.created_at 
                    ? format(new Date(selectedLeave.createdAt || selectedLeave.created_at), 'MMM dd, yyyy h:mm a')
                    : '-'}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-gray-700">Leave Details</p>
                <p className="text-sm text-gray-600">
                  Leave Type: {selectedLeave.leaveType || selectedLeave.leave_type || '-'}
                </p>
                <p className="text-sm text-gray-600">
                  Dates: {format(new Date(selectedLeave.fromDate || selectedLeave.from_date), 'MMM dd')} -{' '}
                  {format(new Date(selectedLeave.toDate || selectedLeave.to_date), 'MMM dd, yyyy')}
                </p>
                <p className="text-sm text-gray-600">Reason: {selectedLeave.reason || '-'}</p>
              </div>
              {selectedLeave.reviewerName || selectedLeave.reviewer_name ? (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700">Manager Approval</p>
                  <p className="text-sm text-gray-600">
                    Approved By: <span className="font-medium text-green-600">
                      {selectedLeave.reviewerName || selectedLeave.reviewer_name}
                    </span>
                  </p>
                  {selectedLeave.reviewedAt || selectedLeave.reviewed_at ? (
                    <p className="text-sm text-gray-600">
                      Approved On: {format(new Date(selectedLeave.reviewedAt || selectedLeave.reviewed_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  ) : null}
                  {(selectedLeave.managerComments || selectedLeave.manager_comments) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Comments: {selectedLeave.managerComments || selectedLeave.manager_comments}
                    </p>
                  )}
                </div>
              ) : null}
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
                  setSelectedLeave(null)
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

export default LeaveApproval

