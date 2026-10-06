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
            
            // Validação dos parâmetros
            if (!login || !senha) {
                return { success: false, message: "Login e senha são obrigatórios!" };
            }
            
            try {
                //Chama a API getToken
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();
                await tokenStore.getNodeToken();
                //Para descriptografavar o token do localStorage
                const tokenCrp = localStorage.getItem('api_token_Node');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    return { success: false, message: "Token não encontrado!"};
                }
                
                const api = mande(`${import.meta.env.VITE_NODE_API_BASE_URL}/getMotorista`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                // Parâmetros como query string (padrão correto do mande)
                const response = await api.get('', { query: { login, senha } });
                
                // Verifica se o login foi bem-sucedido
                const isSuccess = response && response.code === 600 && response.type === "Success";
                
                if (isSuccess) {
                    this.userData = response;
                    const data = response.data;
                    localStorage.setItem('user', login);
                    localStorage.setItem('data', data);
                    
                    // Armazena os direitos do usuário
                    if (response.direitos) {
                        localStorage.setItem('userDireitos', JSON.stringify(response.direitos));
                    }
                    
                    return { success: true, data: response };
                } else {
                    // Se a autenticação falhou, remove o token do localStorage
                    localStorage.removeItem('api_token_Node');
                    localStorage.removeItem('userDireitos');
                    this.userData = null; // Limpa dados do usuário também
                    return { success: false, message: response?.message || "Credenciais inválidas." };
                }
            } catch (error) {
                // Remove o token em caso de erro também
                localStorage.removeItem('api_token_Node');
                localStorage.removeItem('userDireitos');
                this.userData = null;
                return { success: false, message: "Erro ao conectar com a API." };
            }
        },

        async logoutUser() {
            try {
                //Remove o token do localStorage
                localStorage.removeItem('api_token_Node');
                localStorage.removeItem('userDireitos');
                localStorage.removeItem('user');
                localStorage.removeItem('data');
                this.userData = null;
            } catch (error) {
                // Erro ao deslogar usuário
            }
        }
    }
});