import axios from 'axios';
import { API_BASE_URL } from '@utils/constants';
import { readAuthToken } from '@features/auth/authStorage';

/**
 * Axios instance with:
 *   - request interceptor: attaches `Bearer <token>` from localStorage
 *   - response interceptor: invokes the registered onUnauthorized handler on 401
 *
 * We DO NOT import the Redux store here to avoid a circular dependency
 * (store → api → axios → store). Instead:
 *   - Token comes straight from localStorage (fastest, no state indirection)
 *   - Logout on 401 goes through a callback registered from main.jsx
 */
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Content-Type is deliberately NOT set as a default. Axios sets it per
  // request based on the body type:
  //   - plain object → 'application/json'
  //   - FormData     → 'multipart/form-data; boundary=...' (browser sets it)
  // Hard-coding a default JSON header would break multipart uploads.
  headers: {
    Accept: 'application/json',
  },
});

let onUnauthorized = null;

/**
 * Register a handler that runs when any request comes back 401.
 * Typically this dispatches logout() and redirects to /login.
 */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

instance.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default instance;
