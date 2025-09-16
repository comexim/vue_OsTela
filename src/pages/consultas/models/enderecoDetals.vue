<template>
  <div>
    <!-- Loading -->
    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      class="ma-4"
    ></v-progress-circular>

    <!-- Tabela de Dados -->
    <v-data-table
      v-else-if="enderecoData && enderecoData.length > 0"
      :headers="headers"
      :items="enderecoData"
      class="elevation-1"
      hide-default-footer
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>
            Dados do Endereço - {{ enderecoCod }}
          </v-toolbar-title>
        </v-toolbar>
      </template>
    </v-data-table>

    <!-- Mensagem de erro -->
    <v-alert
      v-else-if="error"
      type="error"
      text
    >
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, watch } from 'vue';
import { listaEndereco } from '../../../stores/Consultas/getListaEndereco';

// Props
const props = defineProps({
  enderecoCod: {
    type: String,
    required: true
  }
});

// Store
const listaEnderecoStore = listaEndereco();

// Estado
const loading = ref(false);
const enderecoData = ref([]);
const error = ref(null);

// Headers da tabela - customize conforme sua necessidade
const headers = ref([
  { title: 'Endereço', key: 'enderCod', sortable: true },
  { title: 'Tag', key: 'bagTag', sortable: false },//Arrumar pra aparecer somente os ultimos 6 numeros
  { title: 'Lote', key: 'bagLote', sortable: false },
  { title: 'Sacas', key: 'sacas', sortable: true },
  { title: 'OS', key: 'os', sortable: true },
  { title: 'Linha', key: 'linha', sortable: true },
  { title: '%pen14', key: 'pen14', sortable: true },
  { title: '%pen17', key: 'pen17', sortable: true },
  { title: '%Grinder', key: 'grinder', sortable: true },
  { title: '%PVA', key: 'pva', sortable: true },
  { title: '%Impureza', key: 'impureza', sortable: true },
  { title: 'Safra', key: 'safra', sortable: true },
  { title: 'Empenho', key: 'empPeso', sortable: true },
]);

// Função para converter enderecoCod em parâmetros
function parseEnderecoCod(cod) {
  // Assumindo que enderecoCod está no formato "100A01"
  // Você pode ajustar esta lógica conforme o formato real
  const match = cod.match(/^(\d+)([A-Z])(\d+)$/);
  if (match) {
    return {
      bloco: match[1],
      quadra: match[2],
      posicao: match[3]
    };
  }
  
  // Formato alternativo se necessário
  return {
    bloco: cod.substring(0, 3),
    quadra: cod.substring(3, 4),
    posicao: cod.substring(4, 6)
  };
}

// Função para buscar dados
async function loadEnderecoData() {
  if (!props.enderecoCod) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const params = parseEnderecoCod(props.enderecoCod);
    console.log('Buscando dados para:', params);
    
    const response = await listaEnderecoStore.listaEndereco(params);
    
    if (response) {
      // Mapeia todos os registros para mostrar só os últimos 6 caracteres de bagTag
      enderecoData.value = (Array.isArray(response) ? response : [response]).map(item => ({
        ...item,
        bagTag: item.bagTag ? item.bagTag.slice(-6) : ''
      }));
    } else {
      enderecoData.value = [];
    }
  } catch (err) {
    console.error('Erro ao carregar dados do endereço:', err);
    error.value = 'Erro ao carregar os dados do endereço.';
    enderecoData.value = [];
  } finally {
    loading.value = false;
  }
}

// Watcher para recarregar dados quando enderecoCod muda
watch(() => props.enderecoCod, loadEnderecoData, { immediate: true });

// Load inicial
onMounted(() => {
  loadEnderecoData();
});
</script>

<style scoped>
.ma-4 {
  margin: 16px;
}
</style>