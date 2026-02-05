
export const getApiBaseUrl = () => {
  const useRelativeUrl = import.meta.env.VITE_USE_RELATIVE_API_URL === 'true';
  // If useRelativeUrl is true, return relative path /api
  // Otherwise return absolute URL from env or default to localhost:5001/api
  return useRelativeUrl 
    ? '/api' 
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api');
};

export const getAuthEndpoints = () => {
  const baseUrl = getApiBaseUrl();
  return {
    LOGIN: `${baseUrl}/auth/login`,
    CHECK: `${baseUrl}/auth/check`,
    ME: `${baseUrl}/auth/me`,
    CHANGE_PASSWORD: `${baseUrl}/auth/change-password`,
  };
};
