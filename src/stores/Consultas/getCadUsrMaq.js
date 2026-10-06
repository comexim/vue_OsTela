import { defineStore } from "pinia";
import { mande } from 'mande';
import { useToken } from '../Auth/getToken';
import CryptoJS from "crypto-js";

export const cadUsrMaq = defineStore('cadUsrMaq', {
    state: () => ({
        cadUsrMaqData: null
    }),

    actions: {
        async getCadUsrMaq(usuario) {
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if (!token) {
                    console.error("Token não encontrado, verifique!");
                    return [];
                }
                
                const api = mande(`http://192.168.1.213:8090/api_wms/getCadUsrMaq`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const response = await api.get('', { query: { usuario } });
                
                this.cadUsrMaqData = response;
                return Array.isArray(response) ? response : [];
            } catch (error) {
                console.error("Erro ao buscar getCadUsrMaq:", error.message);
                return [];
            }
        }
    }
});
