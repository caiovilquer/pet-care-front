export const API_CONFIG = {
  baseUrl: 'https://localhost:8443',
  version: 'v1',
  endpoints: {
    auth: '/auth',
    tutors: '/tutors',
    pets: '/pets',
    events: '/events',
    public: '/public'
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.baseUrl}/api/${API_CONFIG.version}${endpoint}`;
};
