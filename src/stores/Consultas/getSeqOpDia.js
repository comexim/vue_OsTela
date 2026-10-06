import { defineStore } from 'pinia';
import { mande } from 'mande';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const seqOpDia = defineStore('seqOpDia', {
    state: () => ({
        seqOpDiaData: null
    }),

    actions: {
        async getSeqOpDia(lado) {
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if (!token) {
                    console.error("Token não encontrado, verifique!");
                    return { success: false, message: "Token não encontrado!" };
                }

                const api = mande(`http://192.168.1.213:8090/api_wms/getseqopdia`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const response = await api.get('', { query: { lado } });

                this.seqOpDiaData = response;
                return response;
            } catch (error) {
                console.error("Falha ao buscar dados da API getSeqOpDia:", error);
                return { success: false, message: "Erro ao conectar com a API", error: error.message };
            }
        }
    }
});
