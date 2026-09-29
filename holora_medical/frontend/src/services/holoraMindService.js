import api from './api';

export const holoraMindService = {
  getChats: async () => {
    const response = await api.get('/holoramind/chats');
    return response.data;
  },
  
  getChatMessages: async (chatId) => {
    const response = await api.get(`/holoramind/chats/${chatId}/messages`);
    return response.data;
  },
  
  sendMessage: async (chatId, content) => {
    const response = await api.post('/holoramind/send', { chatId, content });
    return response.data;
  }
};
