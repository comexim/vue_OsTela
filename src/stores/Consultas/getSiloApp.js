import { mande } from 'mande';
import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const siloApp = defineStore('siloApp', {
    state: () => ({
        siloAppData: null
    }),

    actions: {
        async siloApp() {
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

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getSiloApp`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const response = await api.get();
                this.siloAppData = response;
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API silosApp, verifique!");
            }
        }
    }
})