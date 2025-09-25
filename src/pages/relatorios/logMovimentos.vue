<template>
  <BasePage>
    <v-container>
      <v-card>
        <v-card-title>
          <h1>Log Movimentações</h1>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="w-100 pa-4 border rounded-xl elevation-2 mb-4">
            <div class="text-h6 text-left mb-3">Filtros</div>
            <v-form @submit.prevent="onFilter">
              <v-row align="start" justify="start">
                <v-col cols="12" md="4">
                  <v-select
                    label="Tipo"
                    variant="outlined"
                    v-model="selectedTipo"
                    :items="tipos"
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field 
                    label="Data Inicial" 
                    variant="outlined" 
                    v-model="dataInicial"
                    type="date"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field 
                    label="Data Final" 
                    variant="outlined" 
                    v-model="dataFinal"
                    type="date"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row class="justify-center mt-2">
                <v-btn 
                  variant="tonal" 
                  color="blue-accent-4" 
                  prepend-icon="mdi-magnify" 
                  @click="onFilter"
                  :loading="loading"
                >
                  Filtrar
                </v-btn>
              </v-row>
            </v-form>
          </div>

          <!-- Componente da Tabela -->
          <logTable
            :dados="dados"
            :headers="headers"
            :label-map-completo="labelMapCompleto"
            :loading="loading"
            :mostrar-tabela="mostrarTabela"
            v-model:busca="busca"
            @atualizar="onFilter"
          />
        </v-card-text>
      </v-card>
    </v-container>
  </BasePage>
</template>

<script setup>
import { ref } from 'vue';
import BasePage from '@/components/BasePage.vue';
import logTable from './components/logTable.vue';
import { movEnder } from '../../stores/Consultas/getMovEnder';

const movEnderStore = movEnder();

const dados = ref([]);
const headers = ref([]);
const labelMapCompleto = ref([]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);

// Campos do filtro
const selectedTipo = ref('');
const dataInicial = ref('');
const dataFinal = ref('');
const tipos = ref(['Embegadora', 'Inventário', 'Pesagem', 'Empilhadeira']);

// Função para filtrar e carregar dados da API
const onFilter = async () => {
  // Validação básica
  if (!selectedTipo.value && !dataInicial.value && !dataFinal.value) {
    alert('Preencha pelo menos um campo do filtro');
    return;
  }

  loading.value = true;
  try {
    // Prepara os parâmetros para a API
    const params = {
      tipo: selectedTipo.value,
      dataIni: dataInicial.value ? dataInicial.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      dataFim: dataFinal.value ? dataFinal.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      usuario: localStorage.getItem('user')
    };

    console.log('Parâmetros enviados para a API:', params);

    const response = await movEnderStore.movEnder(params);
    console.log('Dados recebidos da API:', response);

    if (response && Array.isArray(response.listMov)) {
      dados.value = response.listMov;
      headers.value = gerarHeaders(response.listMov, response.labelMap);
      labelMapCompleto.value = response.labelMap || []; // Armazena labelMap completo
    } else {
      console.warn('Formato de dados inesperado:', response);
      dados.value = [];
      headers.value = [];
      labelMapCompleto.value = [];
    }

    mostrarTabela.value = true;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    dados.value = [];
    headers.value = [];
    alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
  } finally {
    loading.value = false;
  }
};

// Função para gerar headers dinâmicos baseados no labelMap da API
const gerarHeaders = (dadosArray, labelMap = []) => {
  if (!dadosArray || dadosArray.length === 0) return [];

  if (labelMap && Array.isArray(labelMap) && labelMap.length > 0) {
    return labelMap
      .filter(item => item.exibe === 'S')
      .map(item => ({
        title: item.label,
        key: item.key,
        align: 'start',
        sortable: true
      }));
  }

  const primeiroItem = dadosArray[0];
  return Object.keys(primeiroItem).map(key => ({
    title: key,
    key: key,
    align: 'start',
    sortable: true
  }));
};
</script>

<style scoped>
h1 {
  color: #2e7d32;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

/* Card principal */
.v-card {
  border-radius: 12px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
}

/* Animações */
.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2);
}

.v-chip {
  transition: all 0.3s ease;
}
</style>