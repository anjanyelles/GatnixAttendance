import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import { USER_ROLES } from '../../utils/constants'

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.EMPLOYEE,
    managerId: '',
    status: 'ACTIVE',
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getEmployees()
      setEmployees(response.data.employees || response.data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingEmployee(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: USER_ROLES.EMPLOYEE,
      managerId: '',
      status: 'ACTIVE',
    })
    setShowModal(true)
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
      managerId: employee.managerId || '',
      status: employee.status,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
        await adminAPI.updateEmployee(editingEmployee.id, formData)
        toast.success('Employee updated successfully!')
      } else {
        await adminAPI.addEmployee(formData)
        toast.success('Employee added successfully!')
      }
      setShowModal(false)
      await loadEmployees()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save employee'
      toast.error(message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return

    try {
      await adminAPI.deleteEmployee(id)
      toast.success('Employee deleted successfully!')
      await loadEmployees()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete employee'
      toast.error(message)
    }
  }

  const roleOptions = Object.values(USER_ROLES).map((role) => ({
    value: role,
    label: role,
  }))

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ]

  const managerOptions = employees
    .filter((emp) => emp.role === USER_ROLES.MANAGER || emp.role === USER_ROLES.HR || emp.role === USER_ROLES.ADMIN)
    .map((emp) => ({
      value: emp.id,
      label: emp.name,
    }))

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const employeeColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Role',
      accessor: 'role',
    },
    {
      header: 'Manager',
      accessor: 'managerName',
      render: (row) => row.managerName || '-',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Employee
        </Button>
      </div>

      <Card title="Employees">
        <div className="mb-4">
          <Input
            label="Search"
            type="text"
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email"
          />
        </div>
        <Table
          columns={employeeColumns}
          data={filteredEmployees}
          loading={loading}
          emptyMessage="No employees found"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingEmployee(null)
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label={editingEmployee ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingEmployee}
          />
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={roleOptions}
            required
          />
          <Select
            label="Manager"
            name="managerId"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            options={[{ value: '', label: 'No Manager' }, ...managerOptions]}
          />
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
            required
          />
          <div className="flex space-x-2">
            <Button type="submit" variant="primary" className="flex-1">
              {editingEmployee ? 'Update' : 'Add'} Employee
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingEmployee(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Employees

