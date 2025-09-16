<template>
  <div>
    <!-- Template para Remoção -->
    <RemocaoComponent 
      v-if="tipo === 'Remoção'" 
      :empilhadeiras="empilhadeiras"
      :loading-empilhadeiras="loadingEmpilhadeiras"
      @ordem-enviada="handleOrdemEnviada"
    />

    <!-- Template para Despejo -->
    <DespejoComponent 
      v-if="tipo === 'Despejo'" 
      @ordem-enviada="handleOrdemEnviada"
    />

    <!-- Mensagem quando nenhum tipo é selecionado -->
    <div v-if="!tipo" class="template-container">
      <v-card-text class="text-center pa-6">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-help-circle</v-icon>
        <p class="text-h6 text-grey">Selecione um tipo de operação</p>
        <p class="text-body-2 text-grey-darken-1">
          Escolha entre "Remoção" ou "Despejo" no menu acima
        </p>
      </v-card-text>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import RemocaoComponent from '../models/remocao.vue';
import DespejoComponent from '../models/despejo.vue';

const props = defineProps({
  tipo: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['selecionar-no-mapa', 'ativar-modo-selecao', 'desativar-modo-selecao']);

// Função para lidar com eventos dos componentes filhos
const handleOrdemEnviada = (data) => {
  console.log('Ordem enviada:', data);
  // Aqui você pode adicionar lógica adicional, como mostrar notificações
  if (data.error) {
    console.error('Erro ao enviar ordem:', data.error);
    // Mostrar notificação de erro
  } else {
    console.log('Ordem enviada com sucesso:', data.response);
    // Mostrar notificação de sucesso
  }
};
</script>

<style scoped>
.template-container {
  min-height: 400px;
}
</style>