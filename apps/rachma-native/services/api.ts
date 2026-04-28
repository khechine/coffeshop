const BASE_URL = 'https://api.coffeeshop.elkassa.com';
const STORAGE_URL = BASE_URL;

export const ApiService = {
  getFileUrl(path: string | null | undefined) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${STORAGE_URL}${cleanPath}`;
  },
  async get(endpoint: string) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
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
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
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

  async seedTunisia(storeId: string) {
    return this.post(`/management/seed-tunisia/${storeId}`, {});
  }
};

