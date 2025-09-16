import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const setOsMoega = defineStore('setOsMoega', {
    state: () => ({
        setOsMoegaData: null
    }),

    actions: {
        async setOsMoega(payload) {
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

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/setOSMoega`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post(payload);
                this.setOsMoegaData = response;
                return response;
            } catch (error) {
                console.error("Falha ao enviar dados para a API setOSMoega, verifique!");
                throw error;
            }
        }
    }
})