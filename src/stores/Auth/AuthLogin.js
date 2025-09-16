import { defineStore } from 'pinia';
import { mande } from 'mande';
import { useToken } from './getToken';
import CryptoJS from "crypto-js";

export const useUsers = defineStore('users', {
    state: () => ({
        userData: null
    }),

    actions: {
        async loginUser(login, senha) {
            // Limpa o estado anterior
            this.userData = null;
            
            try {
                //Chama a API getToken
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();
                await tokenStore.getNodeToken();
                //Para descriptografavar o token do localStorage
                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!"};
                }
                
                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getMotorista`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Tentativa 1: Parâmetros na URL manualmente
                const url = `?login=${encodeURIComponent(login)}&senha=${encodeURIComponent(senha)}`;
                
                const response = await api.get(url);
                
                console.log("Resposta da API:", response);
                console.log("Code:", response.code, "Type:", response.type);
                
                // Verifica se o login foi bem-sucedido
                const isSuccess = response && response.code === 600 && response.type === "Success";
                
                if (isSuccess) {
                    this.userData = response;
                    localStorage.setItem('user', login);
                    console.log(response.message || `Bem vindo de volta!`);
                    return { success: true, data: response };
                } else {
                    // Se a autenticação falhou, remove o token do localStorage
                    console.log("Autenticação falhou, removendo token...");
                    localStorage.removeItem('api_token');
                    this.userData = null; // Limpa dados do usuário também
                    console.error(response?.message || "Erro ao autenticar usuário.");
                    return { success: false, message: response?.message || "Credenciais inválidas." };
                }
            } catch (error) {
                // Remove o token em caso de erro também
                console.log("Erro capturado, removendo token...");
                localStorage.removeItem('api_token');
                this.userData = null;
                console.error("Erro ao conectar com a API.");
                console.error("Detalhes do erro:", error);
                return { success: false, message: "Erro ao conectar com a API." };
            }
        },

        async logoutUser() {
            try {
                //Remove o token do localStorage
                localStorage.removeItem('api_token');
                this.userData = null;
            } catch (error) {
                console.log("Erro ao deslogar usuário: ", error);
            }
        }
    }
});