import { mande } from 'mande';
import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const getZ71Prod = defineStore('getZ71Prod', {
  state: () => ({
    getZ71ProdData: null,
  }),

  actions: {
    async getZ71Prod(params = {}) {
      try {
        this.getZ71ProdData = null;

        const secretKey = import.meta.env.VITE_SECRET_KEY;
        const tokenStore = useToken();
        await tokenStore.getToken();

        const tokenCrp = localStorage.getItem('api_token');
        const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

        if (!token) {
          return { success: false, message: 'Token não encontrado!' };
        }

        const opticket = params.opticket ?? '';
        const api = mande(
          `${import.meta.env.VITE_JAVA_API_BASE_URL}/getz71prod?opticket=${encodeURIComponent(opticket)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          }
        );

        const response = await api.get();
        this.getZ71ProdData = response;
        return response;
      } catch (error) {
        console.error('Falha ao buscar dados da API getz71prod:', error);
        return { success: false, message: 'Erro ao conectar com a API', error: error.message };
      }
    },
  },
});
