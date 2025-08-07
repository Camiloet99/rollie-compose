// documentService.js
import api from './api';

// Subir un documento Excel
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post("/admin/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data?.result;
  } catch (err) {
    throw err.response || err;
  }
};

// Obtener lista de documentos subidos
export const getUploadedDocuments = async () => {
  try {
    const res = await api.get("/admin/documents/all");
    return res.data?.result || [];
  } catch (err) {
    throw err.response || err;
  }
};
