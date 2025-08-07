import api from "./api"; // este es tu wrapper de axios con headers y baseURL configurados

// Actualiza el plan del usuario autenticado (upgrade a premium)
export const upgradeUserPlan = async (planId) => {
  try {
    const res = await api.put(`/account/upgrade`, null, {
      params: { planId },
    });
    return res.data?.result;
  } catch (err) {
    throw err.response || err;
  }
};

// Actualiza los datos del perfil del usuario
export const updateUserProfile = async (userId, payload) => {
  try {
    const res = await api.put(`/account/${userId}/profile`, payload);
    return res.data?.result;
  } catch (err) {
    throw err.response || err;
  }
};
