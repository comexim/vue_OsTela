import { mande } from 'mande';
import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const z1aJustif = defineStore('z1aJustif', {
    state: () => ({
        z1aJustifData: null
    }),

    actions: {
        async z1aJustif(params = {}) {
            try {
                console.log("=== getZ1AJustif API Call ===");
                console.log("Parâmetros recebidos:", params);
                
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!"};
                }

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getZ1AJustif`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log("Fazendo requisição GET com parâmetros:", params);
                
                // Constrói a query string manualmente como no AuthLogin.js
                const queryParams = Object.keys(params)
                    .filter(key => params[key] !== '' && params[key] !== null && params[key] !== undefined)
                    .map(key => `${key}=${encodeURIComponent(params[key])}`)
                    .join('&');
                    
                const url = queryParams ? `?${queryParams}` : '';
                console.log("URL final:", `${import.meta.env.VITE_JAVA_API_BASE_URL}/getZ1AJustif${url}`);
                
                const response = await api.get(url);
                
                console.log("Resposta da API getZ1AJustif:", response);
                this.z1aJustifData = response;
                
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API getZ1AJustif:", error);
                console.error("Detalhes do erro:", error.message);
                return { success: false, message: "Erro ao conectar com a API", error: error.message };
            }
        }
    }
})