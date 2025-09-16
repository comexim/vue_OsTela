import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const listaEndereco = defineStore('listaEndereco', {
    state: () => ({
        listaEnderecoData: null
    }),

    actions: {
        async listaEndereco(params = {}) {
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

                const searchParams = new URLSearchParams(params).toString();
                const query = `?${searchParams}`;

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getListaEndereco${query}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.get();
                this.listaEnderecoData = response;
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API ListaEndereço, verifique!");
                throw error;
            }
        }
    }
})