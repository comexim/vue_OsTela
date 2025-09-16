import { defineStore } from 'pinia';
import { mande } from 'mande';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const enderColor = defineStore('enderColor', {
    state: () => ({
        enderCodData: null
    }),

    actions: {
        async enderColor(params = {}) {
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!"};
                }

                let query = '';
                if (params && Object.keys(params).length > 0) {
                    const searchParams = new URLSearchParams(params).toString();
                    query = `?${searchParams}`;
                }
                
                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getEnderColor${query}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const response = await api.get();
                this.enderCodData = response;
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API EnderColor, verifique!");
            }
        }
    }
})