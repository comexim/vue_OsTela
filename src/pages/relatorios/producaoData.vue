<template>
    <v-container class="container">
      <v-card>
        <v-card-title>
          <v-row align="center" justify="space-between">
            <v-col cols="auto">
              <h1 class="titulo-pagina">Relatório Produção por data</h1>
            </v-col>
            <v-col cols="auto" class="d-flex align-center ga-3">
              <v-chip 
                v-if="dados.length > 0"
                color="success"
                variant="tonal"
                prepend-icon="mdi-table"
              >
                {{ dados.length }} registros
              </v-chip>
              <v-btn 
                color="primary" 
                @click="onFilter"
                :loading="loading"
                prepend-icon="mdi-refresh"
                variant="elevated"
              >
                Atualizar
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="w-100 pa-3 border rounded-xl elevation-2 mb-4">
            <div class="text-h6 text-left mb-3">Filtros</div>
            <v-form @submit.prevent="onFilter">
              <v-row align="start" justify="start" dense>
                <v-col cols="12" md="3">
                  <v-text-field 
                    label="Data Inicial" 
                    variant="outlined" 
                    v-model="dataInicial"
                    type="date"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field 
                    label="Data Final" 
                    variant="outlined" 
                    v-model="dataFinal"
                    type="date"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    label="Filtrar por Pilha/SS"
                    variant="outlined"
                    v-model="pilhaSS"
                    :items="['Não', 'Sim']"
                    density="compact"
                    hide-details
                  ></v-select>
                </v-col>
                <v-col cols="12" md="3" class="d-flex align-end">
                  <v-btn 
                    variant="tonal" 
                    color="blue-accent-4" 
                    prepend-icon="mdi-magnify" 
                    @click="onFilter"
                    :loading="loading"
                    block
                  >
                    Filtrar
                  </v-btn>
                </v-col>
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
            :altura-tabela="450"
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
.titulo-pagina {
  color: #2e7d32;
  font-size: 1.5rem;
  margin-bottom: 0;
}

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