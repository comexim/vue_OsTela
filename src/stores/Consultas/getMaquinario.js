import { defineStore } from 'pinia';
import { mande } from 'mande';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const maquinario = defineStore('maquinario', {
    state: () => ({
        maquinarioData: null
    }),

    actions: {
        async maquinario() {
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
                
                const api = mande(`http://192.168.1.213:9090/api_supervisorio_teste/getMaquinario`);

                const response = await api.get();
                this.maquinarioData = response;
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API EnderColor, verifique!");
            }
        }
    }
})