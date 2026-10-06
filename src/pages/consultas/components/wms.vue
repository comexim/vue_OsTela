<template>
  <div>
    <!-- Mensagem de acesso negado para abas privadas -->
    <div v-if="!hasPermission && isPrivateTab" class="template-container">
      <v-card-text class="text-center pa-6">
        <v-icon size="64" color="error" class="mb-4">mdi-lock</v-icon>
        <p class="text-h6 text-error">Acesso Negado</p>
        <p class="text-body-2 text-grey-darken-1">
          Você não tem permissão para acessar esta operação.
        </p>
      </v-card-text>
    </div>

    <!-- Template para Remoção -->
    <RemocaoComponent 
      v-else-if="tipo === 'Remoção Lote'" 
      :empilhadeiras="empilhadeiras"
      :loading-empilhadeiras="loadingEmpilhadeiras"
      @ordem-enviada="handleOrdemEnviada"
    />

    <RemocaoOPComponent 
      v-else-if="tipo === 'Remoção OP'" 
      :empilhadeiras="empilhadeiras"
      :loading-empilhadeiras="loadingEmpilhadeiras"
      @ordem-enviada="handleOrdemEnviada"
    />

    <!-- Template para Despejo -->
    <DespejoComponent 
      v-else-if="tipo === 'Despejo'" 
      @ordem-enviada="handleOrdemEnviada"
    />

    <!-- Template para Filtro -->
    <FiltroWMSComponent 
      v-else-if="tipo === 'Filtro'" 
      @filtrado="handleFiltrado"
      @update-table="handleUpdateTable"
    />

    <!-- Mensagem quando nenhum tipo é selecionado -->
    <div v-else-if="!tipo" class="template-container">
      <v-card-text class="text-center pa-6">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-help-circle</v-icon>
        <p class="text-h6 text-grey">Selecione um tipo de operação</p>
        <p class="text-body-2 text-grey-darken-1">
          Escolha uma opção no menu acima
        </p>
      </v-card-text>
    </div>

    
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, onMounted } from 'vue';
import RemocaoComponent from '../models/remocao.vue';
import DespejoComponent from '../models/despejo.vue';
import RemocaoOPComponent from '../models/remocaoOP.vue';
import FiltroWMSComponent from './filtroWMS.vue';

const props = defineProps({
  tipo: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['selecionar-no-mapa', 'ativar-modo-selecao', 'desativar-modo-selecao', 'filtrado']);

// Estados para controle de permissões
const userDireitos = ref({});

// Estados para controle da tabela
const tableData = ref({
  show: false,
  minimized: false,
  data: [],
  totalSacas: 0,
  temCheckbox: false
});

const tableHeaders = [
  { title: 'Endereços', key: 'enderCod' },
  { title: 'Lote', key: 'bagLote' }
];

// Carrega as permissões do usuário
onMounted(() => {
  try {
    const direitosStr = localStorage.getItem('userDireitos');
    if (direitosStr) {
      userDireitos.value = JSON.parse(direitosStr);
    }
  } catch (e) {
    console.error('Erro ao carregar permissões do usuário:', e);
  }
});

// Verifica se o usuário tem a permissão necessária
const hasPermission = computed(() => {
  return userDireitos.value['MotDirRem'] === 'S';
});

// Verifica se a aba atual é privada
const isPrivateTab = computed(() => {
  const privateTabs = ['Remoção Lote', 'Remoção OP', 'Despejo'];
  return privateTabs.includes(props.tipo);
});

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

// Função para lidar com eventos de filtro
const handleFiltrado = (enderCodList) => {
  console.log('Filtro aplicado no WMS:', enderCodList);
  emit('filtrado', enderCodList);
};

// Função para lidar com atualização da tabela
const handleUpdateTable = (data) => {
  tableData.value = data;
  
  // Emitir evento global para o mapa.vue
  window.dispatchEvent(new CustomEvent('wms-update-table', {
    detail: data
  }));
};

// Função para minimizar/expandir a tabela
const toggleTableMinimized = () => {
  tableData.value.minimized = !tableData.value.minimized;
};
</script>

<style scoped>
.template-container {
  min-height: 400px;
}
</style>