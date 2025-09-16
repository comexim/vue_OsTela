<template>
  <v-container fluid>
    <div class="d-flex flex-column flex-md-row justify-space-between">
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
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { cadAux } from '../../../stores/Movimentos/getCadAux';
import { enderColor } from '../../../stores/Consultas/getEnderColor';

const enderColorStore = enderColor();

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
    
    const cods = response.map(item => item.enderCod);
    emit('filtrado', cods);

    console.log('Resposta da API: ',response);
    op.value = '';
    lote.value = '';
    endereco.value = '';
    linha.value = null; // Corrigido para null
    selectedCheckboxes.value = [];
}
</script>