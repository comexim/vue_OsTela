import { defineStore } from 'pinia';
import { useToken } from '../Auth/getToken';
import { mande } from 'mande';
import CryptoJS from 'crypto-js';

export const checkOpImas = defineStore('checkOpImas', {
    state: () => ({
        opsSemApontamento: []
    }),

    actions: {
        async verificarOPsSemApontamento(ops, equipamentos = []) {
            try {
                const secretKey = import.meta.env.VITE_SECRET_KEY;
                const tokenStore = useToken();
                await tokenStore.getNodeToken();

                const tokenCrp = localStorage.getItem('api_token_Node');
                const token = CryptoJS.AES.decrypt(tokenCrp, secretKey).toString(CryptoJS.enc.Utf8);

                if(!token) {
                    console.error("Token não encontrado, verifique!");
                    return [];
                }

                const opsPendentes = [];
                
                // Cria um mapa de equipamentos com seus setores
                const equipamentosComSetor = equipamentos.map(eq => ({
                    codigo: eq.cadAuxCod,
                    setor: eq.cadAuxCodAlt
                }));

                // Verifica cada OP
                for (const op of ops) {
                    try {
                        const api = mande(`${import.meta.env.VITE_NODE_API_BASE_URL}/getCheckOp`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        // Envia os equipamentos com seus setores
                        const queryParams = equipamentosComSetor.length > 0 
                            ? { op: op, equipamentos: JSON.stringify(equipamentosComSetor) }
                            : { op: op };
                            
                        const response = await api.get('', { query: queryParams });

                        // Determina se a OP está pendente para os nossos equipamentos específicos
                        let pendente = true;

                        if (response && response.success) {
                            if (response.apontamentos && Array.isArray(response.apontamentos) && response.apontamentos.length > 0) {
                                // Verifica se algum apontamento retornado pertence aos nossos equipamentos
                                const equipCodigos = equipamentosComSetor.map(eq => eq.codigo);
                                pendente = !response.apontamentos.some(ap => equipCodigos.includes(ap.ApEquipto));
                            } else {
                                // API legada sem array de apontamentos — confia no success do backend
                                pendente = false;
                            }
                        }
                        // Se response.message === "Lembrete..." → pendente permanece true (nenhuma gravação)

                        if (pendente) {
                            const setoresUnicos = [...new Set(equipamentosComSetor.map(eq => eq.setor))].filter(Boolean);
                            opsPendentes.push({
                                op: op,
                                equipamentos: (response?.setoresPendentes?.length > 0)
                                    ? response.setoresPendentes
                                    : setoresUnicos.length > 0 ? setoresUnicos : ['Geral'],
                                equipamentosCod: response?.equipamentosPendentes || []
                            });
                        }
                    } catch (error) {
                        console.error(`Erro ao verificar OP ${op}:`, error);
                    }
                }

                this.opsSemApontamento = opsPendentes;
                return opsPendentes;
            } catch (error) {
                console.error("Falha ao verificar OPs sem apontamento:", error);
                throw error;
            }
        }
    }
})
