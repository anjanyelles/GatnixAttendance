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

const RegularizationRequests = () => {
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
      const response = await regularizationAPI.getManagerRegularizations()
      // Filter only pending requests
      const regs = response.data.regularizationRequests || response.data || []
      const pendingRegs = regs.filter(
        (reg) => reg.status === REGULARIZATION_STATUS.PENDING
      )
      setRegularizations(pendingRegs)
    } catch (error) {
      console.error('Error loading regularization requests:', error)
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
      await regularizationAPI.approveManager(selectedRegularization.id, {
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
      const message = error.response?.data?.message || 'Failed to process request'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const regularizationColumns = [
    {
      header: 'Employee Name',
      accessor: 'employeeName',
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => format(new Date(row.date), 'MMM dd, yyyy'),
    },
    {
      header: 'Requested Punch In',
      accessor: 'requestedPunchIn',
      render: (row) =>
        row.requestedPunchIn
          ? format(new Date(`2000-01-01T${row.requestedPunchIn}`), 'h:mm a')
          : '-',
    },
    {
      header: 'Requested Punch Out',
      accessor: 'requestedPunchOut',
      render: (row) =>
        row.requestedPunchOut
          ? format(new Date(`2000-01-01T${row.requestedPunchOut}`), 'h:mm a')
          : '-',
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
      <h1 className="text-3xl font-bold text-gray-900">Regularization Requests</h1>

      <Card title="Pending Regularization Requests">
        <Table
          columns={regularizationColumns}
          data={regularizations}
          loading={loading}
          emptyMessage="No pending regularization requests"
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
                Date: {format(new Date(selectedRegularization.date), 'MMM dd, yyyy')}
              </p>
              <p className="text-sm text-gray-600">
                Requested Times: {selectedRegularization.requestedPunchIn} -{' '}
                {selectedRegularization.requestedPunchOut}
              </p>
              <p className="text-sm text-gray-600">
                Reason: {selectedRegularization.reason}
              </p>
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
                {action === 'approve' ? 'Approve' : 'Reject'}
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

export default RegularizationRequests

