import { defineStore } from 'pinia';
import { mande } from 'mande';
import { useToken } from '../Auth/getToken';
import CryptoJS from 'crypto-js';

export const motivoParada = defineStore('motivoParada', {
    state: () => ({
        motivos: [],
        motivosMaquinario: []
    }),

    actions: {
        async getMotivoParada() {
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return [];
                }

                const api = mande('http://192.168.1.213:8090/api_supervisorio/getMotivoParada', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const response = await api.get();

                if (response && Array.isArray(response)) {
                    this.motivos = response;
                    return response;
                }

                return [];
            } catch (error) {
                console.error('Erro ao buscar motivos de parada:', error);
                throw error;
            }
        },

        /**
         * Busca motivos de parada por maquinário
         * @param {string} motMaq - Código do maquinário (opcional - se vazio retorna todos)
         * @returns {Array} Lista de motivos de parada do maquinário
         */
        async getMotivoParadaMaquinario(motMaq = '') {
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getToken();

                const tokenCrp = localStorage.getItem('api_token');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return [];
                }

                // Sempre inclui o parâmetro MotMaq, mesmo que vazio
                const api = mande(`http://192.168.1.213:8090/api_supervisorio/getMotivoParadaMaquinario?MotMaq=${encodeURIComponent(motMaq)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const response = await api.get();

                if (response && Array.isArray(response)) {
                    this.motivosMaquinario = response;
                    return response;
                }

                return [];
            } catch (error) {
                console.error('Erro ao buscar motivos de parada por maquinário:', error);
                throw error;
            }
        },

        /**
         * Busca a descrição completa de um motivo pelo código
         * @param {string} codigo - O código do motivo (ex: "A00")
         * @returns {string} A descrição completa ou o código original se não encontrado
         */
        getDescricaoPorCodigo(codigo) {
            if (!codigo) return '';

            const motivo = this.motivos.find(m => m.cod === codigo.trim());
            return motivo ? motivo.descr : codigo;
        },

        /**
         * Busca a descrição de um motivo de parada por maquinário
         * Tenta primeiro em motivosMaquinario, depois em motivos
         * @param {string} codigo - O código do motivo
         * @returns {string} Código + Descrição ou apenas o código se não encontrado
         */
        getDescricaoMotivoMaquinario(codigo) {
            if (!codigo) return '';

            const codigoTrim = codigo.trim();
            
            // Primeiro tenta em motivosMaquinario
            let motivo = this.motivosMaquinario.find(m => 
                (m.cod && m.cod === codigoTrim) || 
                (m.motCod && m.motCod === codigoTrim) ||
                (m.MOT_COD && m.MOT_COD === codigoTrim)
            );
            
            // Se não encontrar, tenta em motivos gerais
            if (!motivo) {
                motivo = this.motivos.find(m => m.cod === codigoTrim);
            }

            if (motivo) {
                // Tenta diferentes variações de campos de descrição
                const descricao = motivo.descr || motivo.motDescr || motivo.MOT_DESCR || motivo.descricao || '';
                const cod = motivo.cod || motivo.motCod || motivo.MOT_COD || codigoTrim;
                return descricao ? `${cod} - ${descricao}` : cod;
            }

            return codigoTrim;
        }
    }
});
