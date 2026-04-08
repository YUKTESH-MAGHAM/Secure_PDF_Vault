import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'),
})

// Automatically attach JWT or Admin token to all requests if they exist
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    const adminToken = localStorage.getItem('admin_token')

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    if (adminToken) {
        config.headers['x-admin-token'] = adminToken
    }
    return config
}, (error) => Promise.reject(error))

// --- Auth ---
export const register = (email, password) => api.post('/auth/register', { email, password })
export const login = (email, password) => api.post('/auth/login', { email, password })
export const acceptAdminMessage = (email, password) => api.post('/auth/accept-message', { email, password })

// --- Files ---
// Upload a PDF file
export const uploadFile = (formData, onUploadProgress) =>
    api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
    })

// Access a file by PDF ID and secret key
export const accessFile = (pdf_id, secret_key) =>
    api.post('/access', { pdf_id, secret_key })

// Update text in a notepad
export const updateFileText = (pdf_id, secret_key, text_content) =>
    api.put('/access/update', { pdf_id, secret_key, text_content })

// Get all files (admin)
export const getAllFiles = () => api.get('/files')

// Get my files (logged in user)
export const getMyFiles = () => api.get('/files/my-files')

// Delete a file by database UUID
export const deleteFile = (id) => api.delete(`/file/${id}`)

// Get analytics
export const getAnalytics = () => api.get('/analytics')

// --- User Management ---
export const getAllUsers = () => api.get('/users')
export const suspendUser = (id, status) => api.put(`/users/${id}/suspend`, { status })
export const sendAdminMessage = (id, message) => api.post(`/users/${id}/message`, { message })
export const updateStorageLimit = (id, limit_mb) => api.put(`/users/${id}/limit`, { limit_mb })
export const deleteUser = (id) => api.delete(`/users/${id}`)
export const resetUserPassword = (id, new_password) => api.put(`/users/${id}/reset-password`, { new_password })

// --- Admin Inbox ---
export const getAdminInbox = () => api.get('/inbox')
export const sendMessageToAdmin = (message) => api.post('/inbox', { message })
export const markAdminMessageRead = (id, is_read) => api.put(`/inbox/${id}/read`, { is_read })

export default api
