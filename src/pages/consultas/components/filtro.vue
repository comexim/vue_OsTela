<template>
  <v-container fluid>
    <div class="position-relative">
        <div class="w-100 pa-4 border rounded-xl elevation-8">
            <div class="text-h6 text-left">Filtro</div>
            <v-sheet class="mx-auto" width="100%" color="transparent">
                <v-form @submit.prevent="onFilter">
            <!-- Primeira linha: OP, Lote e Endereço -->
            <v-row align="start" justify="start">
                <v-col cols="12" md="4">
                    <v-text-field 
                        label="OP" 
                        variant="outlined"
                        v-model="op"
                    ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-text-field label="Lote" variant="outlined" v-model="lote"></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-text-field label="Endereço" variant="outlined" v-model="endereco"></v-text-field>
                </v-col>
            </v-row>
            <!-- Segunda linha: Linha e checkboxes -->
            <v-row align="center" justify="start">
                <v-col cols="12" md="3">
                    <v-select 
                    label="Linha" 
                    clearable
                    chips
                    v-model="linha"
                    :items="linhasOptions"
                    item-title="label"
                    item-value="value"
                    multiple
                    variant="outlined"
                    ></v-select>
                </v-col>
                <v-col cols="6" md="2">
                    <v-checkbox label="Graudo" v-model="selectedCheckboxes" value="Graudo"></v-checkbox>
                </v-col>
                <v-col cols="6" md="2">
                    <v-checkbox label="MTGB" v-model="selectedCheckboxes" value="MTGB"></v-checkbox>
                </v-col>
                <v-col cols="6" md="2">
                    <v-checkbox label="Grinder" v-model="selectedCheckboxes" value="Grinder"></v-checkbox>
                </v-col>
                <v-col cols="6" md="2">
                    <v-checkbox label="PVA" v-model="selectedCheckboxes" value="PVA"></v-checkbox>
                </v-col>
            </v-row>
                </v-form>
            </v-sheet>
            <v-card-actions class="justify-center">
                <v-btn variant="tonal" color="blue-accent-4" prepend-icon="mdi-magnify" @click="onFilter">Filtrar</v-btn>
            </v-card-actions>
        </div>
        
        <!-- Tabela centralizada no topo da página -->
        <v-card 
            v-if="showTable" 
            class="pa-4 elevation-8 position-fixed" 
            style="top: 60px; left: 85%; transform: translateX(-50%); min-width: 400px; max-height: 400px; z-index: 1000; background-color: white; overflow-y: auto;"
        >
            <v-card-title class="d-flex justify-space-between align-center">
                <span>Endereços Filtrados{{ temCheckboxMarcado ? '' : ' | Sacas: ' + totalSacasUltimaPesquisa.toFixed(2) }}</span>
                <v-btn icon size="small" @click="toggleTable">
                    <v-icon>{{ isTableMinimized ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                </v-btn>
            </v-card-title>
            <v-card-text v-if="!isTableMinimized">
                <!-- Informação do silo encontrado -->
                <v-alert 
                    v-if="siloEncontrado" 
                    type="info" 
                    variant="tonal" 
                    class="mb-3"
                    density="compact"
                >
                    <div class="text-body-2">
                        <strong>Silo:</strong> {{ siloEncontrado.siloCod }} | 
                        <strong>Setor:</strong> {{ siloEncontrado.siloSetor }} | 
                        <strong>Saldo:</strong> {{ siloEncontrado.siloSaldo }} | 
                        <strong>Sacas:</strong> {{ siloEncontrado.siloSaca }}
                    </div>
                </v-alert>
                <v-data-table
                    :headers="headers"
                    :items="filteredData"
                    item-key="enderCod"
                    class="elevation-1"
                    density="compact"
                    hide-default-footer
                    :items-per-page="-1"
                >
                </v-data-table>
            </v-card-text>
        </v-card>
    </div>
  </v-container>
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

// Variável para armazenar o total de sacas da última pesquisa
const totalSacasUltimaPesquisa = ref(0);

// Variável para armazenar informações do silo encontrado
const siloEncontrado = ref(null);

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

defineProps({
	title: {
		type: String,
		required: true
	}
});

const op = ref('');
const lote = ref('');
const endereco = ref('');
const linha = ref(null);
const selectedCheckboxes = ref([]);
const linhasOptions = ref([]);
const showTable = ref(false);
const isTableMinimized = ref(false);
const filteredData = ref([]);

const headers = [
    { title: 'Endereços', key: 'enderCod' },
    { title: 'Lote', key: 'bagLote' },
    { title: 'Silo', key: 'silo' }
];

const cadAuxStore = cadAux();

const emit = defineEmits(['filtrado']);

async function loadCadAux() {
    try {
        const response = await cadAuxStore.cadAux("LIN");
        linhasOptions.value = response.map(item => ({
            label: item.cadAuxDescr, // Ajustado para usar cadAuxDescr como texto
            value: item.cadAuxCod   // Ajustado para usar cadAuxCod como valor
        }));
    } catch (error) {
        console.error('Erro ao carregar cadAux: ', error);
    }
}

onMounted(() => {
    loadCadAux();
});

function toggleTable() {
    isTableMinimized.value = !isTableMinimized.value;
}

function reopenTable() {
    showTable.value = true;
    isTableMinimized.value = false;
}

function closeTable() {
    showTable.value = false;
    isTableMinimized.value = false;
    filteredData.value = [];
    siloEncontrado.value = null;
}

// Função para enriquecer dados com bagKgAtu
async function enriquecerComBagKgAtu(item) {
    if (!item.bagLote) return { ...item, bagKgAtu: 0 };
    try {
        const dados = await listaBagStore.listaBag({ lote: item.bagLote });
        if (dados && Array.isArray(dados) && dados.length > 0) {
            const dadosLote = dados.find(b => b.bagLote === item.bagLote) || dados[0];
            return { ...item, bagKgAtu: dadosLote.bagKgAtu || 0 };
        }
        return { ...item, bagKgAtu: 0 };
    } catch (e) {
        return { ...item, bagKgAtu: 0 };
    }
}


async function onFilter() {
    const checkboxFields = ['Graudo', 'MTGB', 'Grinder', 'PVA']

    // Lógica para enviar os dados do formulário
    const formData = {
        op: op.value,
        lote: lote.value,
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

    console.log('Dados do formulário:', formData);

    const response = await enderColorStore.enderColor(formData);
    
    // Buscar informações do silo se houver lote pesquisado
    siloEncontrado.value = null;
    if (lote.value) {
        try {
            const silosData = await siloAppStore.siloApp();
            if (silosData && silosData.listaSilos) {
                const siloComLote = silosData.listaSilos.find(silo => silo.siloLote === lote.value);
                if (siloComLote) {
                    siloEncontrado.value = siloComLote;
                    console.log('Silo encontrado:', siloComLote);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados dos silos:', error);
        }
    }
    
    // Se houver lote pesquisado e não houver checkboxes marcados, soma todos os bagKgAtu do listaBag
    const temFiltroBasico = op.value || lote.value || endereco.value;
    if (temFiltroBasico && selectedCheckboxes.value.length === 0) {
        let enriched = Array.isArray(response) ? response : [];
        
        // Adiciona informação do silo nos dados filtrados
        enriched = enriched.map(item => ({
            ...item,
            silo: siloEncontrado.value ? siloEncontrado.value.siloCod : '-'
        }));
        
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
        let dados = Array.isArray(response) ? response : [];
        
        // Adiciona informação do silo nos dados filtrados
        dados = dados.map(item => ({
            ...item,
            silo: siloEncontrado.value ? siloEncontrado.value.siloCod : '-'
        }));
        
        filteredData.value = dados;
        // Reset do total de sacas quando não há filtro básico ou há checkboxes marcados
        totalSacasUltimaPesquisa.value = 0;
        console.log('Resposta da API (sem sacas):', filteredData.value);
    }
    
    showTable.value = true;
    isTableMinimized.value = false;
    const cods = filteredData.value.map(item => item.enderCod);
    emit('filtrado', cods);
    op.value = '';
    lote.value = '';
    endereco.value = '';
    linha.value = null; // Corrigido para null
    selectedCheckboxes.value = [];
}
</script>