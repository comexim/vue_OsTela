import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const useTempoMotorista = defineStore('getTempoMotorista', {
    state: () => ({
        getTempoMotoristaData: null,
        loading: false,
        error: null
    }),

    actions: {
        async getTempoMotorista(params) {
            this.loading = true;
            this.error = null;
            
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getNodeToken();
                
                const tokenCrp = localStorage.getItem('api_token_Node');
                
                if (!tokenCrp) {
                    console.error("Token criptografado não encontrado no localStorage");
                    return { success: false, message: "Token não encontrado no localStorage" };
                }

                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if (!token) {
                    console.error("Token não encontrado após descriptografia, verifique!");
                    return { success: false, message: "Token não encontrado após descriptografia" };
                }

                console.log("URL da API:", import.meta.env.VITE_NODE_API_BASE_URL);
                console.log("Parâmetros enviados:", params);

                const api = mande(`${import.meta.env.VITE_NODE_API_BASE_URL}/getTempoMotorista`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Se há parâmetros, envia como query string
                const response = await api.get('', { query: params });
                console.log("Resposta da API getTempoMotorista:", response);
                
                this.getTempoMotoristaData = response;
                return response;
                
            } catch (error) {
                console.error("Falha ao buscar dados da API getTempoMotorista:", error);
                console.error("Detalhes do erro:", error.message);
                
                this.error = error.message;
                
                // Retorna um objeto de erro estruturado
                return { 
                    success: false, 
                    message: 'Erro ao conectar com a API', 
                    error: error.message 
                };
            } finally {
                this.loading = false;
            }
        }
    }
})