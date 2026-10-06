import { mande } from 'mande';
import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const getEmpenhoProd = defineStore('getEmpenhoProd', {
    state: () => ({
        getEmpenhoProdData: null
    }),

    actions: {
        async getEmpenhoProd(params = {}) {
            try {
                this.getEmpenhoProdData = null;

                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if (!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!" };
                }

                const queryParams = Object.keys(params)
                    .map(key => `${key}=${encodeURIComponent(params[key] ?? '')}`)
                    .join('&');

                const url = queryParams ? `?${queryParams}` : '';

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getEmpenhoProd${url}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                const response = await api.get();
                this.getEmpenhoProdData = response;

                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API getEmpenhoProd:", error);
                console.error("Detalhes do erro:", error.message);
                return { success: false, message: "Erro ao conectar com a API", error: error.message };
            }
        }
    }
})
