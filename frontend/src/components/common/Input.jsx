import React from 'react'

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  register,
  validationRules,
  rows,
  ...props
}) => {
  // If register is provided, it should be the register function from react-hook-form
  // If it's already an object (result of register call), use it directly
  const inputProps = register
    ? (typeof register === 'function' 
        ? register(name, validationRules || { required: required && 'This field is required' })
        : register) // Already registered, use as-is
    : { name, value, onChange }

  const baseClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows || 4}
          className={baseClasses}
          {...inputProps}
          {...props}
        />
      ) : (
        <input
          type={type}
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          className={baseClasses}
          {...inputProps}
          {...props}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default Input

