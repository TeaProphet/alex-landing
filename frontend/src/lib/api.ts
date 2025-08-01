export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'https://fitness-trainer.online',
  token: import.meta.env.VITE_DIRECTUS_TOKEN || null
};

export const apiHeaders = {
  'Content-Type': 'application/json',
  ...(API_CONFIG.token && { 'Authorization': `Bearer ${API_CONFIG.token}` })
};