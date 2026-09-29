import api from "./api";

// Get all specialties
const getAllSpecialties = async () => {
  const response = await api.get("/specialties");
  return response.data;
};

// Get specialty by ID
const getSpecialtyById = async (id) => {
  const response = await api.get(`/specialties/${id}`);
  return response.data;
};

// Create specialty
const createSpecialty = async (payload) => {
  const response = await api.post("/specialties", payload);
  return response.data;
};

// Update specialty
const updateSpecialty = async (id, payload) => {
  const response = await api.put(`/specialties/${id}`, payload);
  return response.data;
};

const updateSpecialtyParent = async (id, parentId) => {
  const response = await api.patch(`/specialties/${id}/parent`, {
    parent_id: parentId,
  });
  return response.data;
};

const reassignAndDeleteSpecialty = async (id, targetSpecialtyId) => {
  const response = await api.post(`/specialties/${id}/reassign-delete`, {
    target_specialty_id: targetSpecialtyId,
  });
  return response.data;
};

// Delete specialty
const deleteSpecialty = async (id) => {
  const response = await api.delete(`/specialties/${id}`);
  return response.data;
};

export default {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  updateSpecialtyParent,
  reassignAndDeleteSpecialty,
  deleteSpecialty
};
