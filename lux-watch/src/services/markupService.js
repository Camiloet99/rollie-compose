import api from './api';

export const getMarkupPercentage = async () => {
  try {
    const res = await api.get("/admin/config/markup");
    return res.data?.result ?? 0;
  } catch (err) {
    throw err.response || err;
  }
};

export const updateMarkupPercentage = async (value) => {
  try {
    const res = await api.put("/admin/config/markup", { value });
    return res.data?.result;
  } catch (err) {
    throw err.response || err;
  }
};
