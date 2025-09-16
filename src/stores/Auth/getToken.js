import { mande } from "mande";
import { defineStore } from "pinia";
import CryptoJS from "crypto-js";

const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getToken`);

export const useToken = defineStore('token', {
    state: () => ({
        tokenData: [],
        nodeTokenData: [] 
    }),

    actions: {
        async getToken(){
            try {
                const response = await api.post({
                    login: import.meta.env.VITE_TOKEN_LOGIN,
                    senha: import.meta.env.VITE_TOKEN_SENHA
                });
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                this.tokenData = response;

                const encryptedToken = CryptoJS.AES.encrypt(this.tokenData.token, secretKey).toString();
                localStorage.setItem('api_token', encryptedToken);

                return response;
            } catch (error) {
                console.error("Erro ao obter token:", error);
                return null;
            }
        },

        async getNodeToken() {
            try {
                const nodeApi = mande(`${import.meta.env.VITE_NODE_API_BASE_URL}/getToken`);
                const response = await nodeApi.post({
                    username: import.meta.env.VITE_TOKEN_LOGIN,
                    password: import.meta.env.VITE_TOKEN_SENHA
                });
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                this.nodeTokenData = response;

                const encryptedToken = CryptoJS.AES.encrypt(this.nodeTokenData.token, secretKey).toString();
                localStorage.setItem(`api_token_Node`, encryptedToken);

                return response;
            } catch (error) {
                console.error(`Erro ao obter token para a rota token node:`, error);
                return null;
            }
        }
    }
});