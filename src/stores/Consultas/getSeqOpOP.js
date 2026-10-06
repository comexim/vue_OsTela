import { mande } from 'mande';
import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const getSeqOpOP = defineStore('getSeqOpOP', {
    state: () => ({
        getSeqOpOPData: null
    }),

    actions: {
        async getSeqOpOP(params = {}) {
            try {
                this.getSeqOpOPData = null;

                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if (!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!" };
                }

                const op = params.op ?? '';
                const reben = params.reben === 'Sim' ? 'Sim' : 'Nao';
                const url = `?op=${encodeURIComponent(op)}&reben=${encodeURIComponent(reben)}`;

                const api = mande(`${import.meta.env.VITE_JAVA_API_BASE_URL}/getseqopop${url}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                const response = await api.get();
                this.getSeqOpOPData = response;

                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API getseqopop:", error);
                console.error("Detalhes do erro:", error.message);
                return { success: false, message: "Erro ao conectar com a API", error: error.message };
            }
        }
    }
})
