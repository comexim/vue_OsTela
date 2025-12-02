import { defineStore } from 'pinia';
import axios from 'axios';

export const motivoParada = defineStore('motivoParada', {
    state: () => ({
        motivos: []
    }),

    actions: {
        async getMotivoParada() {
            try {
                const response = await axios.get('http://192.168.1.213:8090/api_supervisorio/getMotivoParada');

                if (response.data && Array.isArray(response.data)) {
                    this.motivos = response.data;
                    return response.data;
                }

                return [];
            } catch (error) {
                console.error('Erro ao buscar motivos de parada:', error);
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
        }
    }
});
