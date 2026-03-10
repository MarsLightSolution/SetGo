import { API_ENDPOINTS } from '../config/api';
import logger from '../utils/logger';

const log = logger.create('Product');

export const productService = {
  async getProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `${API_ENDPOINTS.GET_PRODUCTS}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || {};
    } catch (error) {
      log.error('Error fetching products:', error);
      throw error;
    }
  },

  async getPriorityProducts() {
    try {
      const response = await fetch(API_ENDPOINTS.PRIORITY_PRODUCTS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || {};
    } catch (error) {
      log.error('Error fetching priority products:', error);
      throw error;
    }
  }
};