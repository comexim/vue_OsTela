import { defineStore } from "pinia";
import { mande } from 'mande';
import { useToken } from '../Auth/getToken';
import CryptoJS from "crypto-js";

export const cadAux = defineStore('cadAux', {
    state: () => ({
        cadAuxData: null
    }),

    actions: {
        async cadAux(tipo) {
            try{
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!"};
                }

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getCadAux?tipo=${tipo}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const response = await api.get();
                this.cadAuxData = response;
                console.log("Resposta da API:", response);
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da api cadAux, verifique!");
            }
        }
    }
})