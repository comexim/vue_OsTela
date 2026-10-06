import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const setColumn = defineStore('setColumn', {
    state: () => ({
        setColumnData: null
    }),

    actions: {
        async setColumn(payload, queryParams = {}) {
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

                // Construindo a URL completa com query parameters
                const baseURL = `${import.meta.env.VITE_JAVA_API_BASE_URL}/setcolumn`;
                const urlWithParams = new URL(baseURL);
                Object.keys(queryParams).forEach(key => urlWithParams.searchParams.append(key, queryParams[key]));

                console.log('URL final:', urlWithParams.toString());
                console.log('Payload para body:', payload);

                // Fazendo a requisição POST diretamente com fetch
                const response = await fetch(urlWithParams.toString(), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'text/plain'
                    },
                    body: payload
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.text();
                this.setColumnData = result;
                return result;
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API setColumn, verifique!");
                throw error;
            }
        }
    }
})