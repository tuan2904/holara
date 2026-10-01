import api from "./api";

const getAllBranches = async () => {
  const response = await api.get("/branches");
  return response.data;
};

const getMyBranches = async () => {
  const response = await api.get("/branches/my");
  return response.data;
};

const getBranchById = async (id) => {
  const response = await api.get(`/branches/${id}`);
  return response.data;
};

const getNextBranchCode = async () => {
  const response = await api.get("/branches/next-code");
  return response.data;
};

const createBranch = async (payload) => {
  const response = await api.post("/branches", payload);
  return response.data;
};

const updateBranch = async (id, payload) => {
  const response = await api.put(`/branches/${id}`, payload);
  return response.data;
};

const deleteBranch = async (id) => {
  const response = await api.delete(`/branches/${id}`);
  return response.data;
};

export default {
  getAllBranches,
  getMyBranches,
  getBranchById,
  getNextBranchCode,
  createBranch,
  updateBranch,
  deleteBranch,
};
