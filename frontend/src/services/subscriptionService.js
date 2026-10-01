import api from "./api";

const getPlans = async () => {
  const response = await api.get("/subscriptions/plans");
  return response.data;
};

const getMySubscriptions = async () => {
  const response = await api.get("/subscriptions/me");
  return response.data;
};

const activateSubscription = async (payload) => {
  const response = await api.post("/subscriptions/activate", payload);
  return response.data;
};

const createPayment = async (payload) => {
  const response = await api.post("/subscriptions/create-payment", payload);
  return response.data;
};

const confirmPayment = async (payload) => {
  const response = await api.post("/subscriptions/confirm-payment", payload);
  return response.data;
};

const getPaymentHistory = async () => {
  const response = await api.get("/subscriptions/payment-history");
  return response.data;
};

export default {
  getPlans,
  getMySubscriptions,
  activateSubscription,
  createPayment,
  confirmPayment,
  getPaymentHistory,
};