<template>
  <v-dialog v-model="dialogLocal" max-width="900px" persistent>
    <v-card>
      <v-card-title class="text-h5 pa-4 bg-error text-white d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-delete-alert</v-icon>
          Selecionar OS para Excluir
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
          type="warning" 
          variant="tonal" 
          class="mb-4"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-alert-circle</v-icon>
            <div>
              <strong>Atenção:</strong> Serão excluídos todos os itens das OS selecionadas que não possuam status "ER".
              <br><small>Esta ação não pode ser desfeita!</small>
            </div>
          </div>
        </v-alert>

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
          :headers="headers"
          :items="filteredItems"
          :loading="loading"
          :search="busca"
          class="selection-table"
          height="300px"
          fixed-header
          :items-per-page="-1"
          hide-default-footer
        >
          <!-- Template customizado para seleção manual -->
          <template v-slot:item="{ item }">
            <tr 
              :class="{ 'bg-red-lighten-4': isOSSelected(item.osid) }"
              @click="toggleOSSelection(item)"
              style="cursor: pointer"
            >
              <td style="width: 50px;">
                <v-checkbox 
                  :model-value="isOSSelected(item.osid)"
                  @click.stop="toggleOSSelection(item)"
                  color="error"
                  hide-details
                />
              </td>
              <td>{{ item.osid }}</td>
              <td>{{ item.opTck }}</td>
              <td>{{ formatDateValue(item.osdata) }}</td>
              <td>{{ formatTimeValue(item.itOSHora) }}</td>
              <td class="text-center">
                <v-chip 
                  color="info" 
                  size="small" 
                  variant="tonal"
                >
                  {{ getItensValidosCount(item.osid) }} itens válidos
                </v-chip>
              </td>
            </tr>
          </template>

          <template v-slot:no-data>
            <div class="text-center pa-4">
              <v-icon size="48" color="grey">mdi-table-off</v-icon>
              <p class="text-grey mt-2">Nenhuma OS encontrada</p>
            </div>
          </template>
        </v-data-table>

        <!-- Resumo da seleção -->
        <v-card v-if="selectedOS.length > 0" class="mt-4 bg-orange-lighten-5" variant="outlined">
          <v-card-text class="pa-3">
            <div class="d-flex align-center mb-3">
              <v-icon color="error" class="mr-2">mdi-delete-sweep</v-icon>
              <strong>Resumo da Exclusão:</strong>
            </div>
            
            <div class="d-flex flex-wrap gap-2 mb-3">
              <v-chip 
                color="primary" 
                variant="tonal" 
                size="small"
              >
                {{ selectedOS.length }} OS selecionada(s)
              </v-chip>
              <v-chip 
                color="error" 
                variant="tonal" 
                size="small"
              >
                {{ totalItensParaExcluir }} item(ns) será(ão) excluído(s)
              </v-chip>
            </div>

            <!-- Lista das OS selecionadas -->
            <v-expansion-panels variant="accordion" class="mt-3">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
                  Ver detalhes das OS selecionadas
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list dense>
                    <v-list-item
                      v-for="osItem in selectedOS"
                      :key="osItem.osid"
                      class="pa-2"
                    >
                      <template v-slot:prepend>
                        <v-icon color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title>
                        OS {{ osItem.osid }} - {{ osItem.opTck }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        {{ getItensValidosCount(osItem.osid) }} itens válidos para exclusão
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
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
          color="error" 
          variant="elevated"
          :disabled="isDeleteButtonDisabled"
          :loading="processando"
          @click="confirmarExclusao"
        >
          <v-icon class="mr-1">mdi-delete</v-icon>
          <span v-if="selectedOS.length === 0">
            Selecione uma OS
          </span>
          <span v-else>
            Excluir {{ totalItensParaExcluir }} item(ns) de {{ selectedOS.length }} OS
          </span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { WMSOS } from '../../../stores/Consultas/setWMSOS';

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
  dadosCompletos: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:dialog', 'confirmar', 'exclusao-concluida', 'erro-exclusao']);

// State
const dialogLocal = ref(props.dialog);
const selectedOS = ref([]);
const busca = ref('');
const processando = ref(false);

// Store
const wmsStore = WMSOS();

// Headers da tabela
const headers = [
  {
    title: 'Selecionar',
    key: 'selecionar',
    align: 'center',
    sortable: false,
    width: '80px'
  },
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
    title: 'Itens Válidos',
    key: 'totalItens',
    align: 'center',
    sortable: false
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
  
  // Filtra apenas OS que tenham itens válidos para exclusão (não ER)
  const itemsComItensValidos = uniqueItems.filter(item => {
    const itensValidos = getItensValidosCount(item.osid);
    return itensValidos > 0;
  });
  
  // Aplica o filtro de busca se houver
  if (!busca.value) return itemsComItensValidos;
  
  const termo = busca.value.toLowerCase();
  return itemsComItensValidos.filter(item => 
    Object.values(item).some(valor => 
      String(valor).toLowerCase().includes(termo)
    )
  );
});

const totalItensParaExcluir = computed(() => {
  console.log('Calculando totalItensParaExcluir com selectedOS:', selectedOS.value);
  return selectedOS.value.reduce((total, osItem) => {
    const osid = osItem.osid || osItem; // Pega osid do objeto ou usa como string
    const count = getItensValidosCount(osid);
    console.log(`OS ${osid}: ${count} itens válidos`);
    return total + count;
  }, 0);
});

const isDeleteButtonDisabled = computed(() => {
  const disabled = selectedOS.value.length === 0 || totalItensParaExcluir.value === 0 || processando.value;
  console.log('Button disabled:', {
    noSelection: selectedOS.value.length === 0,
    noItems: totalItensParaExcluir.value === 0,
    processing: processando.value,
    result: disabled
  });
  return disabled;
});

// Watchers
watch(() => props.dialog, (newVal) => {
  dialogLocal.value = newVal;
  if (newVal) {
    // Reset state when opening
    selectedOS.value = [];
    busca.value = '';
    processando.value = false;
    console.log('Modal aberto - estado resetado');
  }
});

watch(dialogLocal, (newVal) => {
  emit('update:dialog', newVal);
  if (!newVal) {
    // Reset state when closing
    selectedOS.value = [];
    busca.value = '';
    processando.value = false;
    console.log('Modal fechado - estado resetado');
  }
});

// Watch para debug da seleção
watch(selectedOS, (newVal, oldVal) => {
  console.log('selectedOS mudou:', {
    old: oldVal,
    new: newVal,
    length: newVal.length,
    totalItens: totalItensParaExcluir.value,
    buttonDisabled: isDeleteButtonDisabled.value
  });
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

const getItensValidosCount = (osid) => {
  // Conta quantos itens desta OS não são status "ER"
  return props.dadosCompletos.filter(item => 
    item.osid === osid && 
    item.itOSStatus !== 'ER'
  ).length;
};

const getOSTicket = (osid) => {
  const os = props.osDisponiveis.find(item => item.osid === osid);
  return os ? os.opTck : 'N/A';
};

const fechar = () => {
  dialogLocal.value = false;
};

// Funções de seleção manual
const isOSSelected = (osid) => {
  return selectedOS.value.some(item => 
    (typeof item === 'object' ? item.osid : item) === osid
  );
};

const toggleOSSelection = (osItem) => {
  const osid = osItem.osid;
  console.log(`Toggling selection for OS: ${osid}`);
  
  if (isOSSelected(osid)) {
    // Remove da seleção
    selectedOS.value = selectedOS.value.filter(item => 
      (typeof item === 'object' ? item.osid : item) !== osid
    );
    console.log(`OS ${osid} removida da seleção`);
  } else {
    // Adiciona à seleção (usando o objeto completo)
    selectedOS.value.push(osItem);
    console.log(`OS ${osid} adicionada à seleção`);
  }
  
  console.log('Seleção atual:', selectedOS.value);
};

const confirmarExclusao = async () => {
  console.log('Iniciando exclusão para OS:', selectedOS.value);
  
  if (selectedOS.value.length === 0) {
    alert('Por favor, selecione pelo menos uma OS da tabela');
    return;
  }
  
  if (totalItensParaExcluir.value === 0) {
    alert('Nenhum item válido encontrado para exclusão nas OS selecionadas');
    return;
  }

  // Confirma a ação com o usuário
  const confirma = confirm(
    `Tem certeza que deseja excluir ${totalItensParaExcluir.value} item(ns) de ${selectedOS.value.length} OS selecionada(s)?\n\n` +
    `Esta ação não pode ser desfeita!`
  );
  
  if (!confirma) {
    return;
  }
  
  try {
    processando.value = true;
    
    let totalSucessos = 0;
    let totalErros = 0;
    const errosDetalhados = [];
    
    // Para cada OS selecionada
    for (const osItem of selectedOS.value) {
      const osid = osItem.osid; // Agora sempre será um objeto
      console.log(`Processando OS: ${osid}`);
      
      // Busca todos os itens válidos desta OS
      const itensParaExcluir = props.dadosCompletos.filter(item => 
        item.osid === osid && 
        item.itOSStatus !== 'ER'
      );
      
      console.log(`OS ${osid}: ${itensParaExcluir.length} itens para excluir`);
      
      // Exclui cada item desta OS
      for (const item of itensParaExcluir) {
        try {
          const payload = {
            osid: item.osid,
            ositem: item.itOSItem
          };

          console.log(`Excluindo item ${item.itOSItem} da OS ${osid}:`, payload);
          await wmsStore.DELOE(payload);
          totalSucessos++;
        } catch (error) {
          console.error(`Erro ao excluir item ${item.itOSItem} da OS ${osid}:`, error);
          totalErros++;
          errosDetalhados.push({
            osid: osid,
            item: item.itOSItem,
            erro: error.message || 'Erro desconhecido'
          });
        }
      }
    }
    
    console.log(`Exclusão concluída. Sucessos: ${totalSucessos}, Erros: ${totalErros}`);
    
    // Converter selectedOS para array de IDs
    const osExcluidasIds = selectedOS.value.map(osItem => osItem.osid);
    
    // Emitir resultado baseado no que aconteceu
    if (totalErros === 0) {
      // Tudo certo
      emit('exclusao-concluida', {
        sucessos: totalSucessos,
        erros: 0,
        osExcluidas: osExcluidasIds
      });
      
      alert(`Exclusão concluída com sucesso!\n${totalSucessos} item(ns) excluído(s) de ${selectedOS.value.length} OS.`);
      dialogLocal.value = false;
    } else if (totalSucessos > 0) {
      // Parcialmente bem-sucedido
      emit('exclusao-concluida', {
        sucessos: totalSucessos,
        erros: totalErros,
        osExcluidas: osExcluidasIds,
        errosDetalhados: errosDetalhados
      });
      
      alert(
        `Exclusão parcialmente concluída:\n` +
        `${totalSucessos} item(ns) excluído(s) com sucesso\n` +
        `${totalErros} erro(s) encontrado(s)\n\n` +
        `Verifique os detalhes no console.`
      );
      dialogLocal.value = false;
    } else {
      // Todos os itens falharam
      emit('erro-exclusao', {
        sucessos: 0,
        erros: totalErros,
        errosDetalhados: errosDetalhados,
        erro: `Falha ao excluir todos os ${totalErros} item(ns)`
      });
      
      alert(`Erro: Nenhum item foi excluído.\n${totalErros} erro(s) encontrado(s).`);
    }
    
  } catch (error) {
    console.error('Erro geral na exclusão:', error);
    
    emit('erro-exclusao', {
      sucessos: 0,
      erros: 1,
      erro: error.message || 'Erro geral na exclusão'
    });
    
    alert('Erro geral ao processar exclusão: ' + (error.message || 'Erro desconhecido'));
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
  background-color: #ffebee !important;
}

.selection-table :deep(.v-data-table__tr--selected:hover) {
  background-color: #ffcdd2 !important;
}
</style>