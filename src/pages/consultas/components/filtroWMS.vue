<template>
  <div class="template-container">
    <v-card-title class="text-h6 text-center bg-blue-lighten-1 text-white">
      Filtro WMS
    </v-card-title>
    <v-card-text class="pa-4">
      <v-form @submit.prevent="onFilter">
        <!-- OP -->
        <v-text-field
          v-model="op"
          label="OP"
          prepend-icon="mdi-file-document"
          variant="outlined"
          density="compact"
          autocomplete="off"
          class="mb-3"
        ></v-text-field>

        <!-- Lote -->
        <v-text-field
          v-model="lote"
          label="Lote"
          prepend-icon="mdi-package"
          variant="outlined"
          density="compact"
          autocomplete="off"
          class="mb-3"
        ></v-text-field>

        <!-- Tag Bag -->
        <v-text-field
          v-model="tagBag"
          label="Tag Bag"
          prepend-icon="mdi-tag"
          variant="outlined"
          density="compact"
          autocomplete="off"
          class="mb-3"
        ></v-text-field>

        <!-- Endereço -->
        <v-text-field
          v-model="endereco"
          label="Endereço"
          prepend-icon="mdi-map-marker"
          variant="outlined"
          density="compact"
          autocomplete="off"
          class="mb-3"
        ></v-text-field>

        <!-- Silo -->
        <v-autocomplete
          v-model="silo"
          label="Silo"
          prepend-icon="mdi-silo"
          :items="silosOptions"
          :custom-filter="siloFilter"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="compact"
          class="mb-3"
          clearable
          :loading="loadingSilos"
          autocomplete="off"
          no-data-text="Nenhum silo encontrado"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:title>
                <div class="d-flex justify-space-between align-center">
                  <span class="font-weight-bold">{{ item.raw.siloCod }}</span>
                  <v-chip size="x-small" color="primary" variant="flat">
                    {{ item.raw.siloLote || 'Vazio' }}
                  </v-chip>
                </div>
              </template>
              <template v-slot:subtitle>
                <span class="text-caption">{{ item.raw.siloSetor }} - {{ item.raw.siloSaca }} sacas</span>
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>

        <!-- Linha -->
        <v-select
          v-model="linha"
          label="Linha"
          prepend-icon="mdi-line-scan"
          :items="linhasOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="compact"
          class="mb-3"
          multiple
          chips
          closable-chips
          clearable
          :loading="loadingLinhas"
        ></v-select>

        <!-- Checkboxes -->
        <div class="mb-3">
          <v-row dense>
            <v-col cols="6">
              <v-checkbox
                v-model="selectedCheckboxes"
                label="Graudo"
                value="Graudo"
                density="compact"
                hide-details
              ></v-checkbox>
            </v-col>
            <v-col cols="6">
              <v-checkbox
                v-model="selectedCheckboxes"
                label="MTGB"
                value="MTGB"
                density="compact"
                hide-details
              ></v-checkbox>
            </v-col>
            <v-col cols="6">
              <v-checkbox
                v-model="selectedCheckboxes"
                label="Grinder"
                value="Grinder"
                density="compact"
                hide-details
              ></v-checkbox>
            </v-col>
            <v-col cols="6">
              <v-checkbox
                v-model="selectedCheckboxes"
                label="PVA"
                value="PVA"
                density="compact"
                hide-details
              ></v-checkbox>
            </v-col>
          </v-row>
        </div>
      </v-form>

      <!-- Botões de ação -->
      <div class="d-flex justify-center gap-2">
        <v-btn
          color="blue"
          variant="flat"
          prepend-icon="mdi-magnify"
          @click="onFilter"
          :loading="loadingFilter"
        >
          Filtrar
        </v-btn>
        <v-btn
          color="grey"
          variant="outlined"
          prepend-icon="mdi-broom"
          @click="limparFiltros"
        >
          Limpar
        </v-btn>
      </div>
    </v-card-text>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { listaBag } from '../../../stores/Consultas/getListaBag';
import { cadAux } from '../../../stores/Movimentos/getCadAux';
import { enderColor } from '../../../stores/Consultas/getEnderColor';
import { siloApp } from '../../../stores/Consultas/getSiloApp';

const listaBagStore = listaBag();
const enderColorStore = enderColor();
const siloAppStore = siloApp();

// Estados de loading
const loadingLinhas = ref(false);
const loadingFilter = ref(false);
const loadingSilos = ref(false);

// Variável para armazenar o total de sacas da última pesquisa
const totalSacasUltimaPesquisa = ref(0);

// Computed para somar todas as sacas do lote pesquisado, somando todos os bagKgAtu retornados pelo listaBag
const totalSacas = computed(() => {
    if (!filteredData.value || filteredData.value.length === 0) return totalSacasUltimaPesquisa.value;
    const temFiltroBasico = op.value || lote.value || endereco.value;
    if (!temFiltroBasico || temCheckboxMarcado.value) return totalSacasUltimaPesquisa.value;
    // Se houver lote pesquisado, soma todos os bagKgAtu do listaBag
    if (lote.value) {
        // Busca todos os bags do lote pesquisado
        // Como não podemos fazer await aqui, usamos o valor já salvo na última pesquisa
        return totalSacasUltimaPesquisa.value;
    }
    return totalSacasUltimaPesquisa.value;
});

// Computed para verificar se tem algum checkbox marcado
const temCheckboxMarcado = computed(() => {
  return selectedCheckboxes.value && selectedCheckboxes.value.length > 0;
});

const op = ref('');
const lote = ref('');
const tagBag = ref('');
const endereco = ref('');
const silo = ref('');
const linha = ref(null);
const selectedCheckboxes = ref([]);
const linhasOptions = ref([]);
const silosOptions = ref([]);
const silosData = ref([]);
const showTable = ref(false);
const isTableMinimized = ref(false);
const filteredData = ref([]);

const headers = [
    { title: 'Endereços', key: 'enderCod' },
    { title: 'Lote', key: 'bagLote' }
];

const cadAuxStore = cadAux();

const emit = defineEmits(['filtrado', 'update-table']);

// Função customizada de filtro para buscar por código do silo ou lote
function siloFilter(itemTitle, queryText, item) {
    const query = queryText.toLowerCase();
    const siloCod = item.raw.siloCod?.toLowerCase() || '';
    const siloLote = item.raw.siloLote?.toLowerCase() || '';
    
    // Busca tanto pelo código do silo quanto pelo lote
    return siloCod.includes(query) || siloLote.includes(query);
}

async function loadCadAux() {
    loadingLinhas.value = true;
    try {
        const response = await cadAuxStore.cadAux("LIN");
        linhasOptions.value = response.map(item => ({
            label: item.cadAuxDescr, // Ajustado para usar cadAuxDescr como texto
            value: item.cadAuxCod   // Ajustado para usar cadAuxCod como valor
        }));
    } catch (error) {
        console.error('Erro ao carregar cadAux: ', error);
        linhasOptions.value = [];
    } finally {
        loadingLinhas.value = false;
    }
}

async function loadSilos() {
    loadingSilos.value = true;
    try {
        const response = await siloAppStore.siloApp();
        if (response && response.listaSilos) {
            silosData.value = response.listaSilos;
            silosOptions.value = response.listaSilos.map(silo => ({
                label: `${silo.siloCod} - ${silo.siloLote || 'Vazio'}`,
                value: silo.siloCod,
                siloCod: silo.siloCod,
                siloLote: silo.siloLote,
                siloSetor: silo.siloSetor,
                siloSaca: silo.siloSaca
            }));
        }
    } catch (error) {
        console.error('Erro ao carregar silos:', error);
        silosOptions.value = [];
    } finally {
        loadingSilos.value = false;
    }
}

onMounted(() => {
    loadCadAux();
    loadSilos();
});

function toggleTable() {
    isTableMinimized.value = !isTableMinimized.value;
}

function limparFiltros() {
    op.value = '';
    lote.value = '';
    tagBag.value = '';
    endereco.value = '';
    silo.value = '';
    linha.value = null;
    selectedCheckboxes.value = [];
    showTable.value = false;
    isTableMinimized.value = false;
    filteredData.value = [];
    totalSacasUltimaPesquisa.value = 0;
    
    // Emite para o pai que a tabela foi fechada
    emit('update-table', {
        show: false,
        minimized: false,
        data: [],
        totalSacas: 0,
        temCheckbox: false
    });
    
    emit('filtrado', []);
}

async function onFilter() {
    loadingFilter.value = true;
    try {
        const checkboxFields = ['Graudo', 'MTGB', 'Grinder', 'PVA']

        // Lógica para enviar os dados do formulário
        const formData = {
            op: op.value,
            lote: lote.value,
            tagBag: tagBag.value,
            endereco: endereco.value,
            silo: silo.value,
            linha: Array.isArray(linha.value) && linha.value.length > 0 ? linha.value.join(',') : '',
            // Para cada checkbox, envia True/False
            ...Object.fromEntries(
                checkboxFields.map(field => [
                    field.toLowerCase(),
                    selectedCheckboxes.value.includes(field) ? 'True' : 'False'
                ])
            )
        };

        console.log('Dados do formulário WMS:', formData);

        const response = await enderColorStore.enderColor(formData);
        
        // Se houver lote pesquisado e não houver checkboxes marcados, soma todos os bagKgAtu do listaBag
        const temFiltroBasico = op.value || lote.value || endereco.value;
        if (temFiltroBasico && selectedCheckboxes.value.length === 0) {
            let enriched = Array.isArray(response) ? response : [];
            filteredData.value = enriched;
            // Se pesquisou por lote, busca todos os bags desse lote e soma os bagKgAtu
            if (lote.value) {
                try {
                    const bags = await listaBagStore.listaBag({ lote: lote.value });
                    const somaBags = Array.isArray(bags) ? bags.reduce((acc, bag) => acc + (bag.bagKgAtu || 0), 0) : 0;
                    totalSacasUltimaPesquisa.value = somaBags / 59;
                    console.log('Soma de todos os bagKgAtu do lote:', somaBags, 'Total sacas:', totalSacasUltimaPesquisa.value);
                } catch (e) {
                    totalSacasUltimaPesquisa.value = 0;
                }
            } else {
                // Caso não seja pesquisa por lote, mantém lógica antiga
                totalSacasUltimaPesquisa.value = enriched.reduce((acc, item) => acc + ((item.bagKgAtu || 0) / 59), 0);
            }
            console.log('Resposta da API (com sacas):', enriched);
            console.log('Total de sacas calculado:', totalSacasUltimaPesquisa.value);
        } else {
            filteredData.value = Array.isArray(response) ? response : [];
            // Reset do total de sacas quando não há filtro básico ou há checkboxes marcados
            totalSacasUltimaPesquisa.value = 0;
            console.log('Resposta da API (sem sacas):', filteredData.value);
        }
        
        showTable.value = true;
        isTableMinimized.value = false;
        const cods = filteredData.value.map(item => item.enderCod);
        
        // Emite os dados da tabela para o componente pai
        emit('update-table', {
            show: true,
            minimized: false,
            data: filteredData.value,
            totalSacas: totalSacasUltimaPesquisa.value,
            temCheckbox: temCheckboxMarcado.value
        });
        
        emit('filtrado', cods);
    } catch (error) {
        console.error('Erro ao filtrar:', error);
    } finally {
        loadingFilter.value = false;
    }
}
</script>

<style scoped>
.template-container {
  min-height: 400px;
}

.v-card-title {
  border-radius: 4px 4px 0 0;
}

.v-btn {
  font-weight: 500;
}

.gap-2 {
  gap: 0.5rem;
}
</style>