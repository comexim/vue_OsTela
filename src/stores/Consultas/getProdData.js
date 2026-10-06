import { mande } from 'mande';
import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const prodData = defineStore('prodData', {
    state: () => ({
        prodData: null
    }),

    actions: {
        async getProdData(params = {}) {
            try {
                console.log("=== getProdData API Call ===");
                console.log("Parâmetros recebidos:", params);
                
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token_Node');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!"};
                }

                console.log("Fazendo requisição GET com parâmetros:", params);
                
                // Constrói a query string com dataIni e dataFim
                const queryParams = Object.keys(params)
                    .map(key => `${key}=${encodeURIComponent(params[key] || '')}`)
                    .join('&');
                    
                const url = queryParams ? `?${queryParams}` : '';
                
                const api = mande(`${import.meta.env.VITE_NODE_API_BASE_URL}/getProdData${url}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const response = await api.get();
                
                console.log("Resposta da API getProdData:", response);
                this.prodData = response;
                
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API getProdData:", error);
                console.error("Detalhes do erro:", error.message);
                return { success: false, message: "Erro ao conectar com a API", error: error.message };
            }
        }
    }
})