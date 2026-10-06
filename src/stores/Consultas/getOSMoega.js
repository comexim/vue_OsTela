import { mande } from 'mande';
import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const osMoega = defineStore('osMoega', {
    state: () => ({
        osMoegaData: null
    }),

    actions: {
        async movEnder(params = {}) {
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    return { success: false, message: "Token não encontrado!"};
                }
                
                // Constrói a query string manualmente 
                const queryParams = Object.keys(params)
                    .map(key => `${key}=${encodeURIComponent(params[key] || '')}`) // Inclui todos os parâmetros, mesmo vazios
                    .join('&');
                    
                const url = queryParams ? `?${queryParams}` : '';
                
                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getOSMoega${url}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const response = await api.get();
                
                this.osMoegaData = response;
                
                return response;
            } catch (error) {
                return { success: false, message: "Erro ao conectar com a API", error: error.message };
            }
        }
    }
})