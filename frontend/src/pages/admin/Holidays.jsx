import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import { format } from 'date-fns'

const Holidays = () => {
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState(null)
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: '',
  })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadHolidays()
  }, [selectedYear])

  const loadHolidays = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getHolidays({ year: selectedYear })
      setHolidays(response.data.holidays || [])
    } catch (error) {
      console.error('Error loading holidays:', error)
      toast.error('Failed to load holidays')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingHoliday) {
        await adminAPI.updateHoliday(editingHoliday.id, formData)
        toast.success('Holiday updated successfully!')
      } else {
        await adminAPI.createHoliday(formData)
        toast.success('Holiday created successfully!')
      }
      setShowModal(false)
      setEditingHoliday(null)
      setFormData({ date: '', name: '', description: '' })
      loadHolidays()
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save holiday'
      toast.error(message)
    }
  }

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday)
    setFormData({
      date: holiday.date.split('T')[0],
      name: holiday.name,
      description: holiday.description || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return
    }
    
    try {
      await adminAPI.deleteHoliday(id)
      toast.success('Holiday deleted successfully!')
      loadHolidays()
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete holiday'
      toast.error(message)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingHoliday(null)
    setFormData({ date: '', name: '', description: '' })
  }

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => format(new Date(row.date), 'MMM dd, yyyy'),
    },
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => row.description || '-',
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i
    return { value: year, label: year.toString() }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Holidays Management</h1>
        <div className="flex space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {years.map(year => (
              <option key={year.value} value={year.value}>{year.label}</option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
          >
            + Add Holiday
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={holidays}
          loading={loading}
          emptyMessage="No holidays found for this year"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Holiday Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., New Year, Independence Day"
            required
          />
          <Input
            label="Description"
            type="textarea"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
          />
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              {editingHoliday ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Holidays

