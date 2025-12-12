<template>
    <v-container class="container">
      <v-card>
        <v-card-title>
          <h1>Relatório Produção por data</h1>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="w-100 pa-4 border rounded-xl elevation-2 mb-4">
            <div class="text-h6 text-left mb-3">Filtros</div>
            <v-form @submit.prevent="onFilter">
              <v-row align="start" justify="start">
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
                <v-col cols="12" md="4">
                  <v-select
                    label="Filtrar por Pilha/SS"
                    variant="outlined"
                    v-model="pilhaSS"
                    :items="['Não', 'Sim']"
                    density="compact"
                  ></v-select>
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
          <ProdDataTable
            :dados="dados"
            :headers="headers"
            :loading="loading"
            :mostrar-tabela="mostrarTabela"
            v-model:busca="busca"
            @atualizar="onFilter"
          />
        </v-card-text>
      </v-card>
    </v-container>
</template>

<script setup>
import { ref } from 'vue';
import ProdDataTable from './components/prodDataTable.vue';
import { prodData } from '../../stores/Consultas/getProdData';

const apiStore = prodData();

const dados = ref([]);
const headers = ref([
  { title: 'Data', key: 'DATA', align: 'center', sortable: true },
  { title: 'Lote', key: 'LOTE', align: 'center', sortable: true },
  { title: 'Peso Total', key: 'PESO_TOTAL', align: 'center', sortable: true },
  { title: 'Sacas', key: 'SACAS', align: 'center', sortable: true }
]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);

// Campos do filtro
const loteInicial = ref('');
const dataInicial = ref('');
const dataFinal = ref('');
const pilhaSS = ref('Não');

// Função para filtrar
const onFilter = async () => {
  // Validação básica
  if (!dataInicial.value || !dataFinal.value) {
    alert('Preencha as datas inicial e final');
    return;
  }

  loading.value = true;
  
  try {
    // Converte datas de YYYY-MM-DD para YYYYMMDD
    const params = {
      dataIni: dataInicial.value.replace(/-/g, ''),
      dataFim: dataFinal.value.replace(/-/g, ''),
      pilha: pilhaSS.value
    };
    
    console.log('Filtros aplicados:', params);
    
    const response = await apiStore.getProdData(params);
    
    // Limpa os dados antes de processar a resposta
    dados.value = [];
    
    if (Array.isArray(response) && response.length > 0) {
      // Extrai apenas os cabeçalhos para exibição inicial
      dados.value = response.map((item, index) => {
        const rowData = {
          ...item.cabecalho,
          _detalhes: item.detalhes, // Armazena detalhes ocultos
          id: `${item.cabecalho?.LOTE || index}-${item.cabecalho?.DATA || index}` // ID único para expansão
        };
        console.log('Dados da linha:', rowData);
        return rowData;
      });
      mostrarTabela.value = true;
      console.log('Total de registros carregados:', dados.value.length);
    } else {
      console.warn('Nenhum dado retornado ou formato inesperado:', response);
      dados.value = [];
      mostrarTabela.value = true; // Mantém a tabela visível para mostrar "Nenhum dado encontrado"
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert('Erro ao carregar dados. Verifique o console.');
    dados.value = [];
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
h1 {
  color: #2e7d32;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.container {
  min-width: 1300px;
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