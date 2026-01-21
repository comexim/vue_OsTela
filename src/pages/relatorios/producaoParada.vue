<template>
    <v-container class="container">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-3">
            <h1 class="titulo-pagina">Produção e parada de maquinários</h1>
            <v-chip
              v-if="dados.length > 0"
              color="success"
              variant="tonal"
              prepend-icon="mdi-table"
            >
              {{ dados.length }} registros
            </v-chip>
          </div>
          
          <v-btn
            v-if="mostrarTabela"
            color="primary"
            @click="onFilter"
            :loading="loading"
            prepend-icon="mdi-refresh"
            variant="elevated"
            size="default"
          >
            Atualizar
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="w-100 pa-3 border rounded-xl elevation-2 mb-3">
            <v-form @submit.prevent="onFilter">
              <v-row align="center" justify="start" dense>
                <v-col cols="12" md="3">
                  <v-text-field 
                    label="OP" 
                    variant="outlined"
                    v-model="op"
                    density="compact"
                    autocomplete="off"
                    hide-details
                  ></v-text-field>
                </v-col>
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
                <v-col cols="12" md="2">
                  <v-text-field 
                    label="Data Final" 
                    variant="outlined" 
                    v-model="dataFinal"
                    type="date"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="2">
                  <v-select
                    label="Maquinário"
                    variant="outlined"
                    v-model="selectedMaquinario"
                    :items="maquinarios"
                    item-title="nome"
                    item-value="id"
                    density="compact"
                    hide-details
                  ></v-select>
                </v-col>
                <v-col cols="12" md="2" class="d-flex justify-center">
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
          <TableProdPar
            :dados="dados"
            :headers="headers"
            :label-map-completo="labelMapCompleto"
            :loading="loading"
            :mostrar-tabela="mostrarTabela"
            :altura-tabela="450"
            v-model:busca="busca"
            @atualizar="onFilter"
          />
        </v-card-text>
      </v-card>
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BasePage from '@/components/BasePage.vue';
import TableProdPar from './components/tableProdPar.vue'
import { prodPar } from '../../stores/Consultas/getProdPar';
import { maquinario } from '../../stores/Consultas/getMaquinario';
import { motivoParada } from '../../stores/Consultas/getMotivoParada';

const prodParStore = prodPar();
const maquinarioStore = maquinario();
const motivoParadaStore = motivoParada();

const dados = ref([]);
const headers = ref([]);
const labelMapCompleto = ref([]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);
const maquinarios = ref([]);


// Campos do filtro
const op = ref('');
const selectedMaquinario = ref('');
const dataInicial = ref('');
const dataFinal = ref('');
const motivosParada = ref([]);

// Função para carregar motivos de parada
const carregarMotivosParada = async () => {
  try {
    const response = await motivoParadaStore.getMotivoParada();
    motivosParada.value = response;
  } catch (error) {
    console.error('Erro ao carregar motivos de parada:', error);
  }
};

// Função para carregar maquinários
const carregarMaquinarios = async () => {
  try {
    const response = await maquinarioStore.maquinario();
    if (Array.isArray(response)) {
      maquinarios.value = [
        { nome: 'Todos', id: '' }, 
        ...response.map((nome, index) => {
          return {
            nome: nome.trim(), // Remove espaços desnecessários
            id: String(index + 1).padStart(3, '0') // Adiciona IDs sequenciais formatados como 001, 002, etc.
          };
        })
      ];
    }
  } catch (error) {
    console.error('Erro ao carregar maquinários:', error);
  }
};

// Função para formatar títulos das colunas
const formatarTituloColuna = (key) => {
  const mapeamento = {
    'parID': 'ID Parada',
    'maqCod': 'Código Máquina',
    'parDataIni': 'Data Início',
    'parHoraIni': 'Hora Início',
    'parDataFim': 'Data Fim',
    'parHoraFim': 'Hora Fim',
    'parTipo': 'Tipo Parada',
    'parOP': 'OP',
    'userCod': 'Usuário',
    'parMotivo': 'Motivo',
    'parQtdVez': 'Quantidade',
    'parPeneira': 'Peneira'
  };
  
  return mapeamento[key] || key;
};

// Função para substituir códigos dos motivos pelas descrições completas
const substituirCodigosMotivos = (dadosArray) => {
  if (!dadosArray || dadosArray.length === 0) return;
  
  dadosArray.forEach(item => {
    // Procura pela chave 'parMotivo' (ou variações)
    const chaveMotivo = Object.keys(item).find(key => 
      key.toLowerCase() === 'parmotivo' || 
      key === 'parMotivo'
    );
    
    if (chaveMotivo && item[chaveMotivo]) {
      const codigoOriginal = item[chaveMotivo];
      const descricao = motivoParadaStore.getDescricaoPorCodigo(codigoOriginal);
      item[chaveMotivo] = descricao;
    }
  });
};

// Função para gerar headers dinâmicos baseados no labelMap da API
const gerarHeaders = (dadosArray, labelMap = []) => {
  if (!dadosArray || dadosArray.length === 0) return [];
  
  // Se tiver labelMap, usa ele para definir as colunas
  if (labelMap && Array.isArray(labelMap) && labelMap.length > 0) {
    const headersFromLabelMap = labelMap
      .filter(item => {
        return item.exibe === 'S';
      })
      .map(item => ({
        title: item.label,
        key: item.key,
        align: 'start',
        sortable: true
      }));
    
    return headersFromLabelMap;
  }
  
  // Fallback: se não tiver labelMap, usa o método anterior
  const primeiroItem = dadosArray[0];
  return Object.keys(primeiroItem).map(key => ({
    title: formatarTituloColuna(key),
    key: key,
    align: 'start',
    sortable: true
  }));
};

// Função para filtrar e carregar dados da API
const onFilter = async () => {
  // Validação básica
  if (!op.value && !dataInicial.value && !dataFinal.value && !selectedMaquinario.value) {
    alert('Preencha pelo menos um campo do filtro');
    return;
  }

  loading.value = true;
  try {
    // Prepara os parâmetros para a API
    const params = {
      op: op.value || '',
      dataIni: dataInicial.value ? dataInicial.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      dataFim: dataFinal.value ? dataFinal.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      maqCod: selectedMaquinario.value || 'Todos',
      usuario: localStorage.getItem('user')
    };

    const response = await prodParStore.prodPar(params);
    
    if (Array.isArray(response)) {
      dados.value = response;
      // Substitui códigos pelos nomes dos motivos
      substituirCodigosMotivos(dados.value);
      headers.value = gerarHeaders(response);
      labelMapCompleto.value = []; 
    } else if (response && Array.isArray(response.listaMov)) {
      // Trata o caso específico da API prodPar que retorna listaMov
      dados.value = response.listaMov;
      // Substitui códigos pelos nomes dos motivos
      substituirCodigosMotivos(dados.value);
      headers.value = gerarHeaders(response.listaMov, response.labelMap);
      labelMapCompleto.value = response.labelMap || []; // Armazena labelMap completo
    } else if (response && Array.isArray(response.data)) {
      dados.value = response.data;
      // Substitui códigos pelos nomes dos motivos
      substituirCodigosMotivos(dados.value);
      headers.value = gerarHeaders(response.data, response.labelMap);
      labelMapCompleto.value = response.labelMap || []; // Armazena labelMap completo
    } else if (response && Array.isArray(response.listaMov)) {
      dados.value = response.listaMov;
      // Substitui códigos pelos nomes dos motivos
      substituirCodigosMotivos(dados.value);
      headers.value = gerarHeaders(response.listaMov, response.labelMap);
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

onMounted(() => {
  carregarMaquinarios();
  carregarMotivosParada();
});
</script>

<style scoped>
h1.titulo-pagina {
  color: #2e7d32;
  font-size: 1.5rem;
  margin: 0;
  text-align: center;
}

.container {
  min-width: 1300px;
  margin-top: -30px;
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