// Centralized API configuration supporting both local development and cloud production deployments
export const NODE_API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'
export const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API_BASE || 'http://localhost:8000/api'
