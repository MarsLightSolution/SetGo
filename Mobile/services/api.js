// services/api.js
import axios from 'axios';
import Constants from 'expo-constants';

// support both older & newer Constants shapes:
const extra = (Constants.expoConfig || Constants.manifest || {}).extra || {};
const API_URL = extra.apiUrl || 'http://51.20.123.49/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true, // enable if your API requires cookies
});

export default api;
