import api from './api';

// Crear un nuevo tier
export const createTier = async (tierData) => {
  try {
    const res = await api.post("/tiers", tierData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to create tier";
  }
};

export const getAllTiers = async () => {
  try {
    const res = await api.get('/tiers');
    const data = res.data?.result || [];

    // Transformar extraProperties de string a array para cada tier
    return data.map((tier) => ({
      ...tier,
      extraProperties: tier.extraProperties
        ? tier.extraProperties.split(',').map((p) => p.trim())
        : [],
    }));
  } catch (error) {
    throw error.response || 'Failed to fetch tiers';
  }
};


// Actualizar un tier existente
export const updateTier = async (id, tierData) => {
  try {
    const res = await api.put(`/tiers/${id}`, tierData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to update tier";
  }
};

// Eliminar un tier
export const deleteTier = async (id) => {
  try {
    await api.delete(`/tiers/${id}`);
    return true;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete tier';
  }
};

// Desactivar un tier
export const deactivateTier = async (id) => {
  try {
    const res = await api.patch(`/tiers/${id}/deactivate`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to deactivate tier';
  }
};

// Activar un tier
export const activateTier = async (id) => {
  try {
    const res = await api.patch(`/tiers/${id}/activate`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to activate tier';
  }
};
