// Utility functions for authentication and API calls

// Base API URL
const API_BASE_URL = 'http://localhost:8080';

// Helper function to get user data from cookies
export const getUserFromCookies = () => {
  const userDataCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('userData='));
  
  if (userDataCookie) {
    try {
      return JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]));
    } catch (error) {
      console.error('Error parsing user data from cookies:', error);
      return null;
    }
  }
  return null;
};

// Helper function to get user data from localStorage (fallback)
export const getUserFromStorage = () => {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');
  
  if (userId && userName) {
    return {
      userId,
      userName,
      email: userEmail,
    };
  }
  return null;
};

// Get current user (tries cookies first, then localStorage)
export const getCurrentUser = () => {
  return getUserFromCookies() || getUserFromStorage();
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getCurrentUser();
};

// API call wrapper with authentication
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    
    // Handle token refresh if needed
    if (response.status === 401) {
      const refreshResponse = await fetch(`${API_BASE_URL}/refreshAccessToken`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (refreshResponse.ok) {
        // Retry the original request
        return await fetch(url, finalOptions);
      } else {
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return null;
      }
    }
    
    return response;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Login function
export const login = async (email, password) => {
  const response = await apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const data = await response.json();
    
    // Store minimal user info in localStorage for frontend access
    if (data.user) {
      localStorage.setItem('userId', data.user.userId);
      localStorage.setItem('userName', data.user.userName);
      localStorage.setItem('userEmail', data.user.email);
    }
    
    return data;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }
};

// Logout function
export const logout = async () => {
  try {
    await apiCall('/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
    
    // Redirect to login
    window.location.href = '/login';
  }
};

// Register function
export const register = async (userData) => {
  const response = await apiCall('/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }
};

// Get user data
export const getUserData = async (userId) => {
  const response = await apiCall(`/userdata/${userId}`);
  
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error('Failed to fetch user data');
  }
};

// Protected route wrapper
export const withAuth = (Component) => {
  return (props) => {
    const user = getCurrentUser();
    
    if (!user) {
      window.location.href = '/login';
      return null;
    }
    
    return <Component {...props} user={user} />;
  };
};

// Chat API functions
export const chatApi = {
  // Connect user to chat
  connect: async (username) => {
    const response = await apiCall('/api/chat/connect', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to connect to chat');
    }
  },

  // Get conversations
  getConversations: async (userIdentifier) => {
    const response = await apiCall(`/api/chat/conversations/${userIdentifier}`);
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch conversations');
    }
  },

  // Create or get conversation
  createConversation: async (participants) => {
    const response = await apiCall('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ participants }),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to create conversation');
    }
  },

  // Get messages
  getMessages: async (conversationId) => {
    const response = await apiCall(`/api/chat/messages/${conversationId}`);
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch messages');
    }
  },

  // Send message
  sendMessage: async (messageData) => {
    const response = await apiCall('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to send message');
    }
  },

  // Upload file
  uploadFile: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to upload file');
    }
  },
};