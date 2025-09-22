<template>
  <v-dialog v-model="dialogLocal" max-width="800px" persistent>
    <v-card>
      <v-card-title class="text-h5 pa-4 bg-primary text-white d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-content-copy</v-icon>
          Selecionar OS para Clonar
        </div>
        <v-btn
          icon
          variant="text"
          color="white"
          @click="fechar"
          size="small"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-alert 
          type="info" 
          variant="tonal" 
          class="mb-4"
          text="Selecione uma Ordem de Serviço da lista abaixo para clonar"
        />

        <!-- Debug Info (remover em produção) -->
        <!-- 
        <v-alert type="warning" variant="outlined" class="mb-4">
          <strong>Debug Info:</strong><br>
          Selected OS: {{ JSON.stringify(selectedOS) }}<br>
          Selected Length: {{ selectedOS.length }}<br>
          Button Disabled: {{ isCloneButtonDisabled }}<br>
          Filtered Items Count: {{ filteredItems.length }}<br>
          OS Detalhes: {{ JSON.stringify(osDetalhes) }}<br>
          Props osDisponiveis length: {{ props.osDisponiveis.length }}<br>
          First item structure: {{ JSON.stringify(props.osDisponiveis[0]) }}
        </v-alert>
        -->

        <!-- Campo de busca -->
        <v-text-field
          v-model="busca"
          label="Buscar OS..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          hide-details
          class="mb-4"
        />

        <!-- Tabela de seleção -->
        <v-data-table
          v-model:selected="selectedOS"
          :headers="headers"
          :items="filteredItems"
          :loading="loading"
          :search="busca"
          item-value="osid"
          show-select
          single-select
          class="selection-table"
          height="230px"
          fixed-header
          :items-per-page="-1"
          hide-default-footer
          @update:selected="onSelectionChange"
        >
          <template v-slot:[`item.osdata`]="{ item }">
            {{ formatDateValue(item.osdata) }}
          </template>
          
          <template v-slot:[`item.itOSHora`]="{ item }">
            {{ formatTimeValue(item.itOSHora) }}
          </template>

          <!-- Template para linha clicável como alternativa -->
          <template v-slot:item="{ item }">
            <tr 
              :class="{ 'bg-blue-lighten-4': isItemSelected(item) }"
              @click="toggleSelection(item)"
              style="cursor: pointer"
            >
              <td>
                <v-checkbox 
                  :model-value="isItemSelected(item)"
                  @click.stop="toggleSelection(item)"
                  color="primary"
                />
              </td>
              <td>{{ item.osid }}</td>
              <td>{{ item.opTck }}</td>
              <td>{{ formatDateValue(item.osdata) }}</td>
              <td>{{ formatTimeValue(item.itOSHora) }}</td>
              <td>{{ item.enderDestino || 'N/A' }}</td>
            </tr>
          </template>

          <template v-slot:no-data>
            <div class="text-center pa-4">
              <v-icon size="48" color="grey">mdi-table-off</v-icon>
              <p class="text-grey mt-2">Nenhuma OS encontrada</p>
            </div>
          </template>
        </v-data-table>

        <!-- Seleção de Moega -->
        <v-card v-if="selectedOS.length > 0" class="mt-4 bg-orange-lighten-5" variant="outlined">
          <v-card-text class="pa-3">
            <div class="d-flex align-center mb-3">
              <v-icon color="orange" class="mr-2">mdi-factory</v-icon>
              <strong>Selecione a Moega de Destino:</strong>
            </div>
            
            <v-select
              v-model="selectedMoega"
              :items="moegasOptions"
              :loading="loadingMoegas"
              label="Selecionar Moega"
              placeholder="Escolha uma moega..."
              variant="outlined"
              density="compact"
              item-title="label"
              item-value="label"
              clearable
              :rules="[v => !!v || 'Selecione uma moega para continuar']"
              class="mb-2"
            >
              <template v-slot:prepend-inner>
                <v-icon color="orange">mdi-factory</v-icon>
              </template>
            </v-select>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn 
          color="grey" 
          variant="text" 
          @click="fechar"
        >
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          variant="elevated"
          :disabled="isCloneButtonDisabled"
          :loading="processando"
          @click="confirmarClonagem"
        >
          <v-icon class="mr-1">mdi-content-copy</v-icon>
          <span v-if="selectedOS.length === 0">
            Selecione uma OS
          </span>
          <span v-else-if="!selectedMoega">
            Selecione uma Moega
          </span>
          <span v-else>
            Clonar OS → {{ getMoegaLabel(selectedMoega) }}
          </span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { WMSOS } from '../../../stores/Consultas/setWMSOS';
import { moegas } from '../../../stores/Consultas/getMoega';

// Props
const props = defineProps({
  dialog: {
    type: Boolean,
    default: false
  },
  osDisponiveis: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:dialog', 'confirmar']);

// State
const dialogLocal = ref(props.dialog);
const selectedOS = ref([]);
const busca = ref('');
const processando = ref(false);
const selectedMoega = ref('');
const moegasOptions = ref([]);
const loadingMoegas = ref(false);

// Store
const wmsStore = WMSOS();
const moegasStore = moegas();

// Headers da tabela
const headers = [
  {
    title: 'ID OS',
    key: 'osid',
    align: 'start',
    sortable: true
  },
  {
    title: 'Ticket',
    key: 'opTck',
    align: 'start',
    sortable: true
  },
  {
    title: 'Data',
    key: 'osdata',
    align: 'start',
    sortable: true
  },
  {
    title: 'Hora',
    key: 'itOSHora',
    align: 'start',
    sortable: true
  },
  {
    title: 'Endereço Destino',
    key: 'enderDestino',
    align: 'start',
    sortable: true
  }
];

// Computed
const filteredItems = computed(() => {
  // Primeiro remove os IDs duplicados (mantém apenas o primeiro de cada osid)
  const uniqueItems = [];
  const seenIds = new Set();
  
  props.osDisponiveis.forEach(item => {
    if (!seenIds.has(item.osid)) {
      seenIds.add(item.osid);
      uniqueItems.push(item);
    }
  });
  
  // Depois aplica o filtro de busca se houver
  if (!busca.value) return uniqueItems;
  
  const termo = busca.value.toLowerCase();
  return uniqueItems.filter(item => 
    Object.values(item).some(valor => 
      String(valor).toLowerCase().includes(termo)
    )
  );
});

const osDetalhes = computed(() => {
  if (selectedOS.value.length === 0) return {};
  
  // Agora selectedOS.value contém os IDs das OS selecionadas
  const selectedId = selectedOS.value[0];
  const osEncontrada = filteredItems.value.find(os => os.osid === selectedId);
  
  console.log('Calculando osDetalhes:', {
    selectedId,
    osEncontrada,
    filteredItemsLength: filteredItems.value.length
  });
  
  return osEncontrada || {};
});

const isCloneButtonDisabled = computed(() => {
  return selectedOS.value.length === 0 || !selectedMoega.value || processando.value;
});

// Watchers
watch(() => props.dialog, (newVal) => {
  dialogLocal.value = newVal;
  if (newVal) {
    // Reset state when opening
    selectedOS.value = [];
    busca.value = '';
    processando.value = false;
    selectedMoega.value = '';
    // Carrega as moegas quando abre o modal
    loadMoegas();
  }
});

watch(dialogLocal, (newVal) => {
  emit('update:dialog', newVal);
  if (!newVal) {
    // Reset state when closing
    selectedOS.value = [];
    busca.value = '';
    processando.value = false;
    selectedMoega.value = '';
  }
});

// Watch para resetar moega quando troca de OS
watch(selectedOS, (newVal, oldVal) => {
  console.log('selectedOS mudou:', {
    old: oldVal,
    new: newVal,
    length: newVal.length,
    buttonDisabled: selectedOS.value.length === 0 || !selectedMoega.value || processando.value
  });
  
  // Reseta a moega selecionada quando troca de OS
  if (newVal.length === 0) {
    selectedMoega.value = '';
  }
}, { deep: true });

// Methods
const formatDateValue = (value) => {
  if (!value) return '-';
  if (typeof value === 'string' && value.length === 8 && /^\d{8}$/.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  return value;
};

const formatTimeValue = (value) => {
  if (!value) return '-';
  if (typeof value === 'string' && value.length === 6 && /^\d{6}$/.test(value)) {
    const hour = value.substring(0, 2);
    const minute = value.substring(2, 4);
    const second = value.substring(4, 6);
    return `${hour}:${minute}:${second}`;
  }
  if (typeof value === 'string' && value.length === 4 && /^\d{4}$/.test(value)) {
    const hour = value.substring(0, 2);
    const minute = value.substring(2, 4);
    return `${hour}:${minute}`;
  }
  return value;
};

const fechar = () => {
  dialogLocal.value = false;
};

const loadMoegas = async () => {
  try {
    loadingMoegas.value = true;
    console.log('Carregando moegas...');
    
    const response = await moegasStore.moegas();
    console.log('Resposta das moegas:', response);
    
    if (response && Array.isArray(response)) {
      moegasOptions.value = response.map(moega => ({
        label: moega.enderCod,
        value: moega.enderBloco
      }));
    } else if (response && response.data && Array.isArray(response.data)) {
      moegasOptions.value = response.data.map(moega => ({
        label: `${moega.moegaCod} - ${moega.moegaDescr || moega.nome || moega.descricao}`,
        value: moega.moegaCod || moega.codigo || moega.id
      }));
    } else {
      console.warn('Formato de resposta das moegas não reconhecido:', response);
      moegasOptions.value = [];
    }
    
    console.log('Moegas processadas:', moegasOptions.value);
  } catch (error) {
    console.error('Erro ao carregar moegas:', error);
    moegasOptions.value = [];
  } finally {
    loadingMoegas.value = false;
  }
};

const getMoegaLabel = (value) => {
  const moega = moegasOptions.value.find(m => m.value === value);
  return moega ? moega.label : value;
};

const isItemSelected = (item) => {
  return selectedOS.value.includes(item.osid);
};

const toggleSelection = (item) => {
  console.log('toggleSelection chamado para item:', item);
  
  const isSelected = isItemSelected(item);
  console.log('Item está selecionado?', isSelected);
  
  if (isSelected) {
    // Remove da seleção
    selectedOS.value = selectedOS.value.filter(id => id !== item.osid);
    console.log('Item removido da seleção. Nova seleção:', selectedOS.value);
  } else {
    // Adiciona à seleção (single-select, então substitui)
    selectedOS.value = [item.osid];
    console.log('Item adicionado à seleção. Nova seleção:', selectedOS.value);
  }
};

const onSelectionChange = (selection) => {
  console.log('onSelectionChange chamado:', {
    selection,
    type: typeof selection,
    isArray: Array.isArray(selection),
    length: selection?.length
  });
  
  selectedOS.value = selection;
  
  console.log('selectedOS após mudança:', {
    value: selectedOS.value,
    length: selectedOS.value.length,
    buttonWillBeDisabled: selectedOS.value.length === 0 || processando.value
  });
};

const confirmarClonagem = async () => {
  console.log('confirmarClonagem - Estado inicial:', {
    selectedOS: selectedOS.value,
    selectedMoega: selectedMoega.value,
    length: selectedOS.value.length,
    processando: processando.value
  });
  
  if (selectedOS.value.length === 0) {
    console.warn('Nenhuma OS selecionada - interrompendo');
    alert('Por favor, selecione uma OS da tabela antes de clonar');
    return;
  }
  
  if (!selectedMoega.value) {
    console.warn('Nenhuma moega selecionada - interrompendo');
    alert('Por favor, selecione uma moega de destino antes de clonar');
    return;
  }
  
  try {
    processando.value = true;
    
    const osParaClonar = osDetalhes.value;
    console.log('OS para clonar (detalhes):', osParaClonar);
    
    if (!osParaClonar || !osParaClonar.osid) {
      console.error('OS para clonar não encontrada nos detalhes');
      alert('Erro: OS selecionada não encontrada');
      return;
    }
    
    const payload = {
      osID: osParaClonar.osid,
      enderDestino: selectedMoega.value // Usa a moega selecionada
    };
    
    console.log('Enviando para clonarOS:', payload);
    console.log('Moega selecionada:', getMoegaLabel(selectedMoega.value));
    
    const response = await wmsStore.clonarOS(payload);
    console.log('Resposta completa da API:', response);
    
    // Verifica se a resposta indica sucesso ou erro
    if (response && typeof response === 'object') {
      if (response.code === 200 || response.code === 201 || response.code === 600 || (!response.code && response.success !== false)) {
        // Sucesso
        console.log('Clonagem realizada com sucesso');
        alert(`OS ${osParaClonar.osid} clonada com sucesso!\nMoega de destino: ${getMoegaLabel(selectedMoega.value)}`);
        
        emit('confirmar', {
          os: osParaClonar,
          moega: selectedMoega.value,
          moegaLabel: getMoegaLabel(selectedMoega.value),
          response: response,
          success: true
        });
        
        dialogLocal.value = false;
      } else {
        // Erro retornado pela API
        const errorMessage = response.message || 'Erro desconhecido na API';
        console.error('Erro retornado pela API:', response);
        alert(`Erro ao clonar OS: ${errorMessage}`);
        
        // Não fecha o modal em caso de erro
        emit('confirmar', {
          os: osParaClonar,
          moega: selectedMoega.value,
          response: response,
          success: false,
          error: errorMessage
        });
      }
    } else {
      // Resposta inválida
      console.error('Resposta inválida da API:', response);
      alert('Erro: Resposta inválida da API');
    }
    
  } catch (error) {
    console.error('Erro ao chamar API clonarOS:', error);
    alert('Erro ao clonar OS: ' + (error.message || 'Erro de conexão com a API'));
  } finally {
    processando.value = false;
  }
};
</script>

<style scoped>
.selection-table {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.selection-table :deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: 600;
}

.selection-table :deep(.v-data-table__tr--selected) {
  background-color: #e3f2fd !important;
}

.selection-table :deep(.v-data-table__tr--selected:hover) {
  background-color: #bbdefb !important;
}
</style>