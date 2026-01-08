import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Helper function to safely get from storage (works on mobile)
  const getStorageItem = (key) => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key)
    } catch (error) {
      console.error(`Error accessing storage for ${key}:`, error)
      return null
    }
  }
  
  // Helper function to safely set in storage (prefers localStorage, falls back to sessionStorage)
  const setStorageItem = (key, value) => {
    try {
      localStorage.setItem(key, value)
      // Also store in sessionStorage as backup
      sessionStorage.setItem(key, value)
    } catch (error) {
      console.error(`Error setting storage for ${key}:`, error)
      // Fallback to sessionStorage only
      try {
        sessionStorage.setItem(key, value)
      } catch (e) {
        console.error(`Error setting sessionStorage for ${key}:`, e)
      }
    }
  }
  
  // Helper function to safely remove from storage
  const removeStorageItem = (key) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing storage for ${key}:`, error)
    }
  }
  
  const [token, setToken] = useState(getStorageItem('token'))

  useEffect(() => {
    const storedUser = getStorageItem('user')
    const storedToken = getStorageItem('token')

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setToken(storedToken)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        removeStorageItem('user')
        removeStorageItem('token')
        setUser(null)
        setToken(null)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { token: newToken, user: userData } = response.data

      if (!newToken || !userData) {
        throw new Error('Invalid response from server')
      }

      // Set storage (works on mobile browsers)
      setStorageItem('token', newToken)
      setStorageItem('user', JSON.stringify(userData))
      
      // Then update state - use functional updates to ensure they happen
      setToken(newToken)
      setUser(userData)

      toast.success('Login successful!')
      
      // Return success - the navigation will happen in Login component
      // or via the useEffect that watches isAuthenticated
      return { success: true, user: userData }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    setToken(null)
    removeStorageItem('token')
    removeStorageItem('user')
    toast.info('Logged out successfully')
  }

  const updateUser = (userData) => {
    setUser(userData)
    setStorageItem('user', JSON.stringify(userData))
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}