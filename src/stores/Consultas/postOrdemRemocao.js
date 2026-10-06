import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const ordemRemocao = defineStore('ordemRemocao', {
    state: () => ({
        ordemRemocaoData: null
    }),

    actions: {
        async ordemRemocao(payload) {
            try {
                console.log("==== ENVIANDO PARA API ====");
                console.log("Endpoint:", `${import.meta.env.VITE_JAVA_API_BASE_URL}/setOrdemRemocao`);
                console.log("Payload:", JSON.stringify(payload, null, 2));
                
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!"};
                }

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/setOrdemRemocao`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post(payload);
                console.log("==== RESPOSTA DA API ====");
                console.log(response);
                this.ordemRemocaoData = response;
                return response;
            } catch (error) {
                console.error("==== ERRO NA API ====");
                console.error("Status:", error.status);
                console.error("Response:", error.response);
                console.error("Body:", error.body);
                console.error("Erro completo:", error);
                throw error;
            }
        }
    }
})