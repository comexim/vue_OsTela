import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const WMSOS = defineStore('WMSOS', {
    state: () => ({
        WMSOSData: null,
        UPDWMSOSData: null,
        DELOEData: null,
        UPDENDDESTOEData: null,
    }),

    actions: {
        async WMSOS(payload) {
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

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/setWMSOS`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post(payload);
                this.WMSOSData = response;
                return response;
            } catch (error) {
                console.error("Falha ao enviar dados para a API WMSOS, verifique!");
                throw error;
            }
        },

        async UPDWMSOS(payload) {
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

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/updOrdemServicoOP`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post(payload);
                this.UPDWMSOSData = response;
                return response;
            } catch (error) {
                console.error("Falha ao enviar dados para a API UPDWMSOS, verifique!");
                throw error;
            }
        },

        async DELOE(payload) {
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

                // Monta a query string a partir do payload
                const queryString = Object.keys(payload)
                  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`)
                  .join('&');

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/delOE?${queryString}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post();
                this.DELOEData = response;
                return response;
            } catch (error) {
                console.error("Falha ao enviar dados para a API DELOE, verifique!");
                throw error;
            }
        },

        async UPDENDDESTOE(payload) {
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

                // Monta a query string a partir do payload
                const queryString = Object.keys(payload)
                  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`)
                  .join('&');

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/updEndDestOE?${queryString}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post();
                this.UPDENDDESTOEData = response;
                return response;
            } catch (error) {
                console.error("Falha ao enviar dados para a API UPDENDDESTOE, verifique!");
                throw error;
            }
        },

        async pegarBag(payload) {
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

                // Monta a query string a partir do payload
                const queryString = Object.keys(payload)
                  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`)
                  .join('&');

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/setPegarBag?${queryString}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post();
                this.pegarBagData = response;
                return response;
            } catch (error) {
                console.error("Falha ao enviar dados para a API pegarBag, verifique!");
                throw error;
            }
        },

        async soltarBag(payload) {
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

                // Monta a query string a partir do payload
                const queryString = Object.keys(payload)
                  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`)
                  .join('&');

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/setSoltarBag?${queryString}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post();
                this.soltarBagData = response;
                return response;
            } catch (error) {
                console.error("Falha ao enviar dados para a API soltarBag, verifique!");
                throw error;
            }
        },

        async cortarBag(payload) {
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

                // Monta a query string a partir do payload
                const queryString = Object.keys(payload)
                  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`)
                  .join('&');

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/setCortarBag?${queryString}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                const response = await api.post();
                this.cortarBagData = response;
                return response;
            } catch (error) {
                console.error("Falha ao enviar dados para a API cortarBag, verifique!");
                throw error;
            }
        }
    }
})