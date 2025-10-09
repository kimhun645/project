// Environment Configuration
export const ENV_CONFIG = {
  // Development URLs
  DEVELOPMENT: {
    BASE_URL: 'http://localhost:3000',
    LOGOUT_REDIRECT: 'http://localhost:3000/',
    API_BASE_URL: 'http://localhost:8080/api'
  },
  
  // Production URLs
  PRODUCTION: {
    BASE_URL: 'https://stock-6e930.web.app',
    LOGOUT_REDIRECT: 'https://stock-6e930.web.app/',
    API_BASE_URL: 'https://your-api-domain.com/api'
  },
  
  // Custom Production URLs (สามารถเพิ่มได้)
  CUSTOM_PRODUCTION: {
    BASE_URL: 'https://your-custom-domain.com',
    LOGOUT_REDIRECT: 'https://your-custom-domain.com/',
    API_BASE_URL: 'https://your-api-domain.com/api'
  }
};

// ตรวจสอบ environment
export const isDevelopment = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '127.0.0.1';
};

export const isProduction = () => {
  const hostname = window.location.hostname;
  return hostname.includes('stock-6e930.web.app') || hostname.includes('your-custom-domain.com');
};

// 获取当前环境的配置
export const getCurrentConfig = () => {
  if (isDevelopment()) {
    return ENV_CONFIG.DEVELOPMENT;
  } else if (isProduction()) {
    return ENV_CONFIG.PRODUCTION;
  } else {
    // Fallback to current origin
    return {
      BASE_URL: window.location.origin,
      LOGOUT_REDIRECT: window.location.origin + '/',
      API_BASE_URL: window.location.origin + '/api'
    };
  }
};

// 获取 logout redirect URL
export const getLogoutRedirectUrl = () => {
  const config = getCurrentConfig();
  return config.LOGOUT_REDIRECT;
};

// 获取 API base URL
export const getApiBaseUrl = () => {
  const config = getCurrentConfig();
  return config.API_BASE_URL;
};
