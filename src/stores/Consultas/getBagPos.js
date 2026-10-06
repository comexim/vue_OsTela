import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const getBagPos = defineStore('getBagPos', {
    state: () => ({
        bagData: null
    }),

    actions: {
        async getBagPos() {
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getNodeToken();

                const tokenCrp = localStorage.getItem('api_token_Node');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!"};
                }

                const api = mande(`${import.meta.env.VITE_NODE_API_BASE_URL}/getBagPos`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                // Faz a requisição GET sem parâmetros
                const response = await api.get('');
                console.log("Resposta:", response);
                this.bagData = response;
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API getBagPos, verifique!", error);
                throw error;
            }
        }
    }
})
