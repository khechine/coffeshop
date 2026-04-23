const BASE_URL = 'https://api.coffeeshop.elkassa.com';

export const ApiService = {
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
  }
};

