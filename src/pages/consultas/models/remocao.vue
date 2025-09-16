<template>
  <div class="template-container">
    <v-card-title class="text-h6 text-center bg-red-lighten-1 text-white">
      Operação de Remoção
    </v-card-title>
    <v-card-text class="pa-4">
      <v-form>
        <!-- Origem -->
        <div class="mb-3">
          <v-text-field
            v-model="remocao.origem"
            label="Origem"
            prepend-icon="mdi-map-marker-outline"
            variant="outlined"
            density="compact"
            readonly
          >
            <template #append>
              <v-btn 
                size="small" 
                :color="(modoSelecao.ativo || mapSelectionState.isActive) && (modoSelecao.tipo === 'origem' || mapSelectionState.type === 'origem') ? 'orange' : 'primary'"
                :variant="(modoSelecao.ativo || mapSelectionState.isActive) && (modoSelecao.tipo === 'origem' || mapSelectionState.type === 'origem') ? 'flat' : 'flat'"
                @click="selecionarNoMapa('origem')"
                :loading="(modoSelecao.ativo || mapSelectionState.isActive) && (modoSelecao.tipo === 'origem' || mapSelectionState.type === 'origem')"
              >
                {{ (modoSelecao.ativo || mapSelectionState.isActive) && (modoSelecao.tipo === 'origem' || mapSelectionState.type === 'origem') ? 'Selecione no Mapa...' : 'Selecionar no Mapa' }}
              </v-btn>
            </template>
          </v-text-field>
        </div>

        <!-- Destino -->
        <div class="mb-3">
          <v-text-field
            v-model="remocao.destino"
            label="Destino"
            prepend-icon="mdi-map-marker"
            variant="outlined"
            density="compact"
            readonly
          >
            <template #append>
              <v-btn 
                size="small" 
                :color="(modoSelecao.ativo || mapSelectionState.isActive) && (modoSelecao.tipo === 'destino' || mapSelectionState.type === 'destino') ? 'orange' : 'primary'"
                :variant="(modoSelecao.ativo || mapSelectionState.isActive) && (modoSelecao.tipo === 'destino' || mapSelectionState.type === 'destino') ? 'flat' : 'flat'"
                @click="selecionarNoMapa('destino')"
                :loading="(modoSelecao.ativo || mapSelectionState.isActive) && (modoSelecao.tipo === 'destino' || mapSelectionState.type === 'destino')"
              >
                {{ (modoSelecao.ativo || mapSelectionState.isActive) && (modoSelecao.tipo === 'destino' || mapSelectionState.type === 'destino') ? 'Selecione no Mapa...' : 'Selecionar no Mapa' }}
              </v-btn>
            </template>
          </v-text-field>
        </div>

        <!-- Tabela de Endereços -->
        <div class="mb-4" v-if="remocao.origem">
          <v-divider class="mb-3"></v-divider>
          <h4 class="text-subtitle-1 mb-2">Lotes Disponíveis</h4>
          
          <v-progress-circular
            v-if="loadingEnderecoData"
            indeterminate
            color="primary"
            size="small"
            class="ma-2"
          ></v-progress-circular>

          <!-- Adiciona scroll aqui -->
          <div v-else-if="enderecoData && enderecoData.length > 0" class="table-scroll">
            <v-data-table
              v-model="remocao.lotesSelecionados"
              :headers="headersRemocao"
              :items="enderecoData"
              item-value="id"
              show-select
              density="compact"
              class="elevation-1 mb-3"
              hide-default-footer
              :items-per-page="-1"
            >
              <template v-slot:top>
                <v-toolbar flat density="compact">
                  <v-toolbar-title class="text-subtitle-2">
                    Endereço: {{ remocao.origem }}
                  </v-toolbar-title>
                </v-toolbar>
              </template>
            </v-data-table>
          </div>

          <!-- Mensagem quando não há dados -->
          <v-alert
            v-else-if="!loadingEnderecoData && remocao.origem"
            type="info"
            text
            density="compact"
          >
            Nenhum lote encontrado para este endereço.
          </v-alert>
        </div>

        <!-- Empilhadeiras -->
        <v-select
          v-model="remocao.empilhadeira"
          label="Empilhadeiras"
          prepend-icon="mdi-forklift"
          :items="empilhadeiras"
          item-title="empidescr"
          item-value="empicod"
          variant="outlined"
          density="compact"
          class="mb-4"
          :loading="loadingEmpilhadeiras"
        ></v-select>
      </v-form>
      
      <!-- Botão de enviar -->
      <div class="d-flex justify-center">
        <v-btn 
          color="green" 
          variant="flat" 
          size="large"
          prepend-icon="mdi-send"
          @click="enviarOrdemRemocao"
        >
          Enviar Ordem de Remoção
        </v-btn>
      </div>
    </v-card-text>

    <!-- Dialog de resultado no centro da tela -->
    <v-dialog 
      v-model="mensagemResultado.mostrar" 
      max-width="500"
      persistent
    >
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon 
            :color="mensagemResultado.tipo === 'success' ? 'success' : 'error'" 
            class="me-2"
            size="large"
          >
            {{ mensagemResultado.tipo === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          {{ mensagemResultado.titulo }}
        </v-card-title>
        
        <v-card-text class="py-4">
          <p class="text-body-1 mb-0">{{ mensagemResultado.texto }}</p>
        </v-card-text>
        
        <v-card-actions class="justify-end pa-4">
          <v-btn 
            :color="mensagemResultado.tipo === 'success' ? 'success' : 'error'"
            variant="flat"
            @click="mensagemResultado.mostrar = false"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useMapSelection } from '../../../composables/useMapSelection';
import { listaEndereco } from '../../../stores/Consultas/getListaEndereco';
import { empilhadeira } from '../../../stores/Consultas/getEmpilhadeira';
import { ordemRemocao } from '../../../stores/Consultas/postOrdemRemocao';
import { listaBag } from '../../../stores/Consultas/getListaBag';

// Props
const props = defineProps({
  empilhadeiras: {
    type: Array,
    default: () => []
  },
  loadingEmpilhadeiras: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['ordem-enviada']);

// Stores
const listaEnderecoStore = listaEndereco();
const empilhadeiraStore = empilhadeira();
const ordemRemocaoStore = ordemRemocao();
const listaBagStore = listaBag();

// Composable para seleção no mapa
const { mapSelectionState, activateSelection, deactivateSelection } = useMapSelection();

// Estados do formulário
const remocao = ref({
  origem: '',
  destino: '',
  empilhadeira: null,
  lotesSelecionados: []
});

// Estados de loading
const loadingEnderecoData = ref(false);
const loadingEmpilhadeiras = ref(false);

// Estado para mensagem de resultado
const mensagemResultado = ref({
  mostrar: false,
  tipo: 'success',
  titulo: '',
  texto: ''
});

// Estado para controle de seleção no mapa
const modoSelecao = ref({
  ativo: false,
  tipo: null // 'origem' ou 'destino'
});

// Dados
const enderecoData = ref([]);
const empilhadeiras = ref([]);

// Headers da tabela
const headersRemocao = ref([
  { title: 'Endereço', key: 'enderCod', sortable: true },
  { title: 'Lote', key: 'bagLote', sortable: false }
]);

// Função para converter enderecoCod em parâmetros
function parseEnderecoCod(cod) {
  const match = cod.match(/^(\d+)([A-Z])(\d+)$/);
  if (match) {
    return {
      bloco: match[1],
      quadra: match[2],
      posicao: match[3]
    };
  }
  
  return {
    bloco: cod.substring(0, 3),
    quadra: cod.substring(3, 4),
    posicao: cod.substring(4, 6)
  };
}

// Função para enriquecer dados do lote com informações da API getListaBag
async function enriquecerDadosLote(lote) {
  try {
    if (!lote.bagLote) return lote;
    
    const dadosCompletos = await listaBagStore.listaBag({ lote: lote.bagLote });
    
    if (dadosCompletos && Array.isArray(dadosCompletos) && dadosCompletos.length > 0) {
      // Filtra os dados para pegar apenas o lote que corresponde ao enderCod atual
      const dadosLoteFiltrado = dadosCompletos.find(item => 
        item.bagAtuEnder === lote.enderCod || 
        item.enderCod === lote.enderCod
      );
      
      // Se não encontrar correspondência exata, pega o primeiro resultado como fallback
      const dadosLote = dadosLoteFiltrado || dadosCompletos[0];
      
      return {
        ...lote,
        bagAtuEnder: lote.enderCod,
        bagDestino: '',
        bagPeso: dadosLote.bagKgAtu || 0,
        bagSacas: dadosLote.bagKgAtu ? Math.round(dadosLote.bagKgAtu / 59) : 0,
        bagTag: dadosLote.bagTag || lote.bagTag || ''
      };
    }
    
    return lote;
  } catch (error) {
    console.error(`Erro ao buscar dados para o lote ${lote.bagLote}:`, error);
    return lote;
  }
}

// Função para carregar dados do endereço (Remoção)
async function loadEnderecoData() {
  if (!remocao.value.origem) {
    enderecoData.value = [];
    return;
  }
  
  loadingEnderecoData.value = true;
  
  try {
    const params = parseEnderecoCod(remocao.value.origem);
    console.log('Buscando dados para:', params);
    
    const response = await listaEnderecoStore.listaEndereco(params);
    
    if (response) {
      // Mapeia os dados e adiciona um ID único para cada item
      const dadosBasicos = (Array.isArray(response) ? response : [response]).map((item, index) => ({
        ...item,
        id: `${item.enderCod}-${item.bagLote}-${index}` // ID único para seleção
      }));
      
      // Enriquece cada lote com dados da API getListaBag
      const dadosEnriquecidos = await Promise.all(
        dadosBasicos.map(async (lote) => await enriquecerDadosLote(lote))
      );
      
      enderecoData.value = dadosEnriquecidos;
      console.log('Dados enriquecidos:', dadosEnriquecidos);
    } else {
      enderecoData.value = [];
    }
  } catch (err) {
    console.error('Erro ao carregar dados do endereço:', err);
    enderecoData.value = [];
  } finally {
    loadingEnderecoData.value = false;
  }
}

// Função para seleção no mapa
const selecionarNoMapa = (tipo) => {
  console.log(`Ativando seleção de ${tipo} no mapa...`);
  
  // Ativa o modo de seleção local
  modoSelecao.value.ativo = true;
  modoSelecao.value.tipo = tipo;
  
  // Ativa a seleção global usando o composable
  activateSelection(tipo, (enderCod) => {
    console.log(`Endereço selecionado para ${tipo}:`, enderCod);
    
    // Preenche o campo correspondente
    if (tipo === 'origem') {
      remocao.value.origem = enderCod;
    } else if (tipo === 'destino') {
      remocao.value.destino = enderCod;
    }
    
    // Desativa o modo de seleção local
    modoSelecao.value.ativo = false;
    modoSelecao.value.tipo = null;
  });
};

// Função para enviar ordem de remoção
const enviarOrdemRemocao = async () => {
  if (!remocao.value.origem || !remocao.value.destino || !remocao.value.empilhadeira) {
    console.warn('Todos os campos são obrigatórios');
    return;
  }
  
  // Busca os lotes selecionados e cria o array de objetos completos
  const lotesSelecionadosCompletos = remocao.value.lotesSelecionados.map(id => {
    const lote = enderecoData.value.find(item => item.id === id);
    if (lote) {
      return {
        bagAtuEnder: lote.bagAtuEnder || lote.enderCod,
        bagDestino: lote.bagDestino || remocao.value.destino,
        bagLote: lote.bagLote || '',
        bagPeso: lote.bagPeso || 0,
        bagSacas: lote.bagSacas || 0,
        bagTag: lote.bagTag || '',
        checked: false
      };
    }
    return null;
  }).filter(item => item !== null);

  // Função para extrair a posição do enderCod (última letra)
  const extrairPosicao = (enderCod) => {
    if (!enderCod) return 'Z'; // Fallback para ordenação
    // Extrai a última letra do endereço (ex: 440H05A -> A)
    const ultimaLetra = enderCod.slice(-1);
    return ultimaLetra.match(/[A-Z]/) ? ultimaLetra : 'Z';
  };

  // Ordena os lotes pela posição (D primeiro, depois C, B, A)
  const lotesOrdenados = lotesSelecionadosCompletos.sort((a, b) => {
    const posicaoA = extrairPosicao(a.bagAtuEnder);
    const posicaoB = extrairPosicao(b.bagAtuEnder);
    
    // Ordenação decrescente (D, C, B, A)
    return posicaoB.localeCompare(posicaoA);
  });
  
  const payload = {
    empicod: remocao.value.empilhadeira,
    enderDestino: remocao.value.destino,
    listBag: lotesOrdenados,
    tagDestino: enderecoData.value.find(item => item.enderCod === remocao.value.destino)?.enderTag || '',
    tagOrigem: enderecoData.value.find(item => item.enderCod === remocao.value.origem)?.enderTag || ''
  };
  
  try {
    console.log("payload da remoção: ", payload);
    const response = await ordemRemocaoStore.ordemRemocao(payload);
    console.log('Resposta da API: ', response);
    
    // Verifica se a resposta foi bem-sucedida
    if (response && response.code === 600) {
      // Exibe mensagem de sucesso
      mensagemResultado.value = {
        mostrar: true,
        tipo: 'success',
        titulo: 'Sucesso!',
        texto: `${response.message} - Código: ${response.code}. Ordem: ${response.data}`
      };
      
      // Limpa o formulário após sucesso
      remocao.value = {
        origem: '',
        destino: '',
        empilhadeira: null,
        lotesSelecionados: []
      };
      enderecoData.value = [];
    } else {
      // Exibe mensagem de erro se o código não for 600
      mensagemResultado.value = {
        mostrar: true,
        tipo: 'error',
        titulo: 'Erro!',
        texto: `${response?.message || 'Erro desconhecido'} - Código: ${response?.code || 'N/A'}`
      };
    }
    
    // Emite evento para o componente pai
    emit('ordem-enviada', { tipo: 'remocao', response, payload });
    
  } catch (error) {
    console.error('Erro ao enviar ordem de remoção: ', error);
    
    // Exibe mensagem de erro
    mensagemResultado.value = {
      mostrar: true,
      tipo: 'error',
      titulo: 'Erro de Comunicação!',
      texto: 'Não foi possível enviar a ordem de remoção. Tente novamente.'
    };
    
    emit('ordem-enviada', { tipo: 'remocao', error, payload });
  }
};

// Função para carregar empilhadeiras
const carregarEmpilhadeiras = async () => {
  loadingEmpilhadeiras.value = true;
  try {
    const dados = await empilhadeiraStore.empilhadeira();
    empilhadeiras.value = Array.isArray(dados) ? dados : [];
    console.log('Empilhadeiras carregadas:', empilhadeiras.value);
  } catch (error) {
    console.error('Erro ao carregar empilhadeiras:', error);
    empilhadeiras.value = [];
  } finally {
    loadingEmpilhadeiras.value = false;
  }
};

// Watchers
watch(() => remocao.value.origem, loadEnderecoData);

// Lifecycle hooks
onMounted(() => {
  carregarEmpilhadeiras();
});
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

/* Estilo para as tabelas com scroll */
.table-scroll {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
