import { AuthService } from './auth';

const BASE_URL = 'https://api.coffeeshop.elkassa.com';
const STORAGE_URL = BASE_URL; // Or a specific bucket URL if different

export const ApiService = {
  getFileUrl(path: string | null | undefined) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${STORAGE_URL}${cleanPath}`;
  },
  async get(endpoint: string) {
    try {
      const session = await AuthService.getSession();
      const headers: any = {};
      if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`ApiService.get(${endpoint}) failed:`, error);
      throw error;
    }
  },

  async post(endpoint: string, bodyData: any) {
    try {
      const session = await AuthService.getSession();
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`ApiService.post(${endpoint}) failed:`, error);
      throw error;
    }
  },

  async put(endpoint: string, bodyData: any) {
    try {
      const session = await AuthService.getSession();
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(bodyData),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`ApiService.put(${endpoint}) failed:`, error);
      throw error;
    }
  },

  async delete(endpoint: string) {
    try {
      const session = await AuthService.getSession();
      const headers: any = {};
      if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`ApiService.delete(${endpoint}) failed:`, error);
      throw error;
    }
  },

  async upload(endpoint: string, formData: FormData) {
    try {
      const session = await AuthService.getSession();
      const headers: any = {};
      if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`ApiService.upload(${endpoint}) failed:`, error);
      throw error;
    }
  }
};

