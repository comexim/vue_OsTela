import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const updEndOrigOE = defineStore('updEndOrigOE', {
    state: () => ({
        updEndOrigOEData: null
    }),

    actions: {
        async updEndOrigOE(payload) {
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

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/updEndOrigOE?osid=${payload.osid}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                // Envia osid como query parameter na URL
                const response = await api.post({});
                this.updEndOrigOEData = response;
                return response;
            } catch (error) {
                console.error("Falha ao atualizar os endereços em updEndOrigOE, verifique!");
                throw error;
            }
        }
    }
})