import { mande } from 'mande';
import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const getOE = defineStore('getOE', {
    state: () => ({
        getOEData: null
    }),

    actions: {
        async getOE(params = {}) {
            try {
                console.log("=== getOE API Call ===");
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

                console.log("Fazendo requisição GET com parâmetros:", params);
                
                // Constrói a query string manualmente 
                const queryParams = Object.keys(params)
                    .map(key => `${key}=${encodeURIComponent(params[key] || '')}`) // Inclui todos os parâmetros, mesmo vazios
                    .join('&');
                    
                const url = queryParams ? `?${queryParams}` : '';
                
                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getOE${url}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const response = await api.get();
                
                console.log("Resposta da API ProdPar:", response);
                this.getOEData = response;
                
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API getOE:", error);
                console.error("Detalhes do erro:", error.message);
                return { success: false, message: "Erro ao conectar com a API", error: error.message };
            }
        }
    }
})