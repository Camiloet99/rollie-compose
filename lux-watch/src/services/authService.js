import api from './api';

export const loginUser = async (credentials) => {
  try {
    const res = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    const token = res.data?.result?.token;
    if (token) {
      localStorage.setItem('rollie_token', token);
    }
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const registerUser = async (formData) => {
  try {
    const res = await api.post('/auth/register', {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phone
    });
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};

export async function verifyUserIdentity(email, phoneNumber) {
  const response = await api.post("/auth/verify-reset", {
    email,
    phoneNumber,
  });
  return response.data.result; // retorna el userId si es válido
}

// Paso 2: Resetear la contraseña
export async function resetPassword(userId, newPassword) {
  const response = await api.put(`/auth/${userId}/reset-password`, {
    newPassword,
  });
  return response.data.result; // true o false
}