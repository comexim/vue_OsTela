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
import { parseBrazilianNumber } from '../../../utils/numberFormat';

const listaBagStore = listaBag();
const enderColorStore = enderColor();
const siloAppStore = siloApp();

// Estados de loading
const loadingLinhas = ref(false);
const loadingFilter = ref(false);

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
const linha = ref(null);
const selectedCheckboxes = ref([]);
const linhasOptions = ref([]);
const showTable = ref(false);
const isTableMinimized = ref(false);
const filteredData = ref([]);

const headers = [
    { title: 'Endereços', key: 'enderCod' },
    { title: 'Lote', key: 'bagLote' }
];

const cadAuxStore = cadAux();

const emit = defineEmits(['filtrado', 'update-table']);

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

onMounted(() => {
    loadCadAux();
});

const normalizeText = (value) => String(value || '').trim().toUpperCase();

const calcularSacasPorPeso = (peso) => {
    const pesoNumerico = Number(peso || 0);
    return pesoNumerico > 0 ? pesoNumerico / 59 : 0;
};

async function buscarBagsPorLote(loteBag, cacheLotes) {
    const loteNormalizado = normalizeText(loteBag);
    if (!loteNormalizado) return [];

    if (!cacheLotes.has(loteNormalizado)) {
        try {
            const bags = await listaBagStore.listaBag({ lote: loteBag });
            cacheLotes.set(loteNormalizado, Array.isArray(bags) ? bags : []);
        } catch (error) {
            console.error(`Erro ao buscar bags do lote ${loteBag}:`, error);
            cacheLotes.set(loteNormalizado, []);
        }
    }

    return cacheLotes.get(loteNormalizado);
}

async function enriquecerComSacas(dados) {
    const cacheLotes = new Map();

    return Promise.all(dados.map(async (item) => {
        if (item.tipo === 'SILO') {
            return {
                ...item,
                siloSaca: parseBrazilianNumber(item.siloSaca)
            };
        }

        if (!item.bagLote) {
            return {
                ...item,
                siloSaca: calcularSacasPorPeso(item.bagKgAtu)
            };
        }

        const bags = await buscarBagsPorLote(item.bagLote, cacheLotes);
        const enderecoItem = normalizeText(item.enderCod);
        const tagItem = normalizeText(item.enderTag || item.bagTag || item.tagBag);

        const bagsDoItem = bags.filter(bag => {
            const mesmoEndereco = enderecoItem && normalizeText(bag.bagAtuEnder) === enderecoItem;
            const mesmaTag = tagItem && normalizeText(bag.bagTag) === tagItem;
            return mesmaTag || mesmoEndereco;
        });

        const pesoTotal = bagsDoItem.reduce((acc, bag) => acc + Number(bag.bagKgAtu || 0), 0);
        const sacas = pesoTotal > 0
            ? calcularSacasPorPeso(pesoTotal)
            : Number(item.enderSacas || 0) || calcularSacasPorPeso(item.bagKgAtu);

        return {
            ...item,
            siloSaca: sacas,
            bagKgAtu: pesoTotal > 0 ? pesoTotal : item.bagKgAtu
        };
    }));
}

const somarSacas = (dados) => {
    return dados.reduce((acc, item) => acc + parseBrazilianNumber(item.siloSaca), 0);
};

function toggleTable() {
    isTableMinimized.value = !isTableMinimized.value;
}

function limparFiltros() {
    op.value = '';
    lote.value = '';
    tagBag.value = '';
    endereco.value = '';
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
        
        // Se houver lote pesquisado, também busca silos com esse lote
        let silosComLote = [];
        if (lote.value) {
            try {
                const silosResponse = await siloAppStore.siloApp();
                if (silosResponse && silosResponse.listaSilos) {
                    // Filtra silos que contêm o lote pesquisado
                    silosComLote = silosResponse.listaSilos.filter(silo => 
                        silo.siloLote && silo.siloLote.toLowerCase().includes(lote.value.toLowerCase())
                    );
                    console.log('Silos encontrados com o lote:', silosComLote);
                }
            } catch (error) {
                console.error('Erro ao buscar silos:', error);
            }
        }
        
        // Se houver lote pesquisado e não houver checkboxes marcados, soma todos os bagKgAtu do listaBag
        const temFiltroBasico = op.value || lote.value || endereco.value;
        if (temFiltroBasico && selectedCheckboxes.value.length === 0) {
            let enriched = Array.isArray(response) ? response : [];
            
            // Adiciona silos aos dados filtrados se houver (silos aparecem primeiro)
            if (silosComLote.length > 0) {
                // Converte silos para o formato compatível com a estrutura de dados
                const silosFormatados = silosComLote.map(silo => ({
                    enderCod: silo.siloCod,
                    bagLote: silo.siloLote,
                    tipo: 'SILO',
                    siloSetor: silo.siloSetor,
                    siloSaca: silo.siloSaca
                }));
                enriched = [...silosFormatados, ...enriched];
            }
            
            filteredData.value = await enriquecerComSacas(enriched);
            totalSacasUltimaPesquisa.value = somarSacas(filteredData.value);
            console.log('Resposta da API (com sacas e silos):', filteredData.value);
            console.log('Total de sacas calculado:', totalSacasUltimaPesquisa.value);
            /*
            // Se pesquisou por lote, busca todos os bags desse lote e soma os bagKgAtu + sacas dos silos
            if (lote.value) {
                try {
                    const bags = await listaBagStore.listaBag({ lote: lote.value });
                    const somaBags = Array.isArray(bags) ? bags.reduce((acc, bag) => acc + (bag.bagKgAtu || 0), 0) : 0;
                    const sacasBags = Number(somaBags / 59);
                    
                    // Soma as sacas dos silos convertendo para número
                    const sacasSilos = silosComLote.reduce((acc, silo) => acc + parseBrazilianNumber(silo.siloSaca), 0);
                    
                    totalSacasUltimaPesquisa.value = Number(sacasBags) + Number(sacasSilos);
                    console.log('Sacas dos bags:', sacasBags, 'Sacas dos silos:', sacasSilos, 'Total:', totalSacasUltimaPesquisa.value);
                } catch (e) {
                    totalSacasUltimaPesquisa.value = 0;
                }
            } else {
                // Caso não seja pesquisa por lote, mantém lógica antiga
                totalSacasUltimaPesquisa.value = enriched.reduce((acc, item) => acc + ((item.bagKgAtu || 0) / 59), 0);
            }
            console.log('Resposta da API (com sacas e silos):', enriched);
            console.log('Total de sacas calculado:', totalSacasUltimaPesquisa.value);
            */
        } else {
            filteredData.value = await enriquecerComSacas(Array.isArray(response) ? response : []);
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
