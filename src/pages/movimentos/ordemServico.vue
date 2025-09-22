<template>
  <BasePage>
    <v-container>
      <v-card>
        <v-card-title>
          <h1>Ordem de Serviço</h1>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="w-100 pa-4 border rounded-xl elevation-2 mb-4">
            <div class="text-h6 text-left mb-3">Filtros</div>
            <v-form @submit.prevent="onFilter">
              <v-row align="start" justify="start">
                  <!-- Ordem de Serviço -->
                  <v-col cols="12" md="4">
                    <v-text-field 
                      label="Ordem de Serviço" 
                      variant="outlined"
                      v-model="ordemServico"
                      density="compact"
                    ></v-text-field>
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
                  <!-- Tag -->
                  <v-col cols="12" md="4">
                    <v-text-field 
                      label="Tag" 
                      variant="outlined"
                      v-model="tag"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  <!-- Em Aberto (Select) -->
                  <v-col cols="12" md="4">
                    <v-select
                      label="Em Aberto"
                      variant="outlined"
                      v-model="emAberto"
                      :items="emAbertoOptions"
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
          <OrdemServTable
            :dados="dados"
            :dados-completos="dadosCompletos"
            :headers="headers"
            :loading="loading"
            :mostrar-tabela="mostrarTabela"
            v-model:busca="busca"
            @atualizar="onFilter"
            @abrir-detalhes="abrirDetalhes"
            @excluir-ordem="abrirModalExcluir"
            @clonar-despejo="abrirModalClonar"
            @nova-ordem="abrirModalNovaOrdem"
          />

          <!-- Modal de Detalhes -->
          <DetalhesOrdemServico
            v-model="modalDetalhesVisible"
            :dados-completos="dadosCompletos"
            :item-selecionado="itemSelecionado"
            :loading="loading"
            @dados-alterados="recarregarDetalhes"
          />

          <!-- Modal de Seleção para Clonagem -->
          <SelecionarOS
            v-model:dialog="modalClonarVisible"
            :os-disponiveis="dadosCompletos"
            :loading="loading"
            @confirmar="confirmarClonagem"
          />

          <!-- Modal de Seleção para Exclusão -->
          <SelecionarOSParaExclusao
            v-model:dialog="modalSelecionarExclusaoVisible"
            :os-disponiveis="dadosCompletos"
            :dados-completos="dadosCompletos"
            :loading="loading"
            @exclusao-concluida="onExclusaoConcluida"
            @erro-exclusao="onErroExclusao"
          />

          <!-- Modal de Exclusão (mantido para compatibilidade futura se necessário) -->
          <!--
          <ExcluirServico
            v-model="modalExcluirVisible"
            :dados-ordem-servico="dadosExclusao.dadosOrdemServico"
            :item-selecionado="dadosExclusao.itensParaExcluir"
            :dados-completos="dadosCompletos"
            @exclusao-concluida="onExclusaoConcluida"
            @erro-exclusao="onErroExclusao"
          />
          -->
        </v-card-text>
      </v-card>
    </v-container>
  </BasePage>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BasePage from '@/components/BasePage.vue';
import OrdemServTable from './components/ordemServTable.vue';
import DetalhesOrdemServico from './models/detalhesOrdemServico.vue';
import SelecionarOS from './models/selecionarOS.vue';
import SelecionarOSParaExclusao from './models/selecionarOSParaExclusao.vue';
import ExcluirServico from './models/excluirServico.vue';
import { getOE } from '../../stores/Consultas/getOE';

const OEStore = getOE();

const dados = ref([]);
const dadosCompletos = ref([]); // Armazena todos os dados da API
const headers = ref([]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);

// Modal de detalhes
const modalDetalhesVisible = ref(false);
const itemSelecionado = ref({});

// Modal de clonagem
const modalClonarVisible = ref(false);

// Modal de seleção para exclusão
const modalSelecionarExclusaoVisible = ref(false);

// Modal de exclusão (antigo - agora não usado diretamente)
const modalExcluirVisible = ref(false);
const dadosExclusao = ref({
  dadosOrdemServico: {},
  itensParaExcluir: []
});

// Campos do filtro
const dataInicial = ref('');
const dataFinal = ref('');
const ordemServico = ref('');
const tag = ref('');
const emAberto = ref('');
const emAbertoOptions = [
  { title: 'Selecione', value: '' },
  { title: 'Em aberto', value: 'AB' },
  { title: 'Atendida', value: 'AT' },
  { title: 'Em atendimento', value: 'EA' },
  { title: 'Em trânsito', value: 'ET' }
];

// Função para gerar headers dinâmicos baseados no labelMap da API
const gerarHeaders = (dadosArray, labelMap = []) => {
  if (!dadosArray || dadosArray.length === 0) return [];
  
  console.log('gerarHeaders - dadosArray length:', dadosArray.length);
  console.log('gerarHeaders - labelMap:', labelMap);
  
  // Se tiver labelMap, usa ele para definir as colunas
  if (labelMap && Array.isArray(labelMap) && labelMap.length > 0) {
    console.log('Usando labelMap para gerar headers');
    const headersFromLabelMap = labelMap
      .filter(item => {
        console.log(`Campo ${item.key}: exibe = ${item.exibe}`);
        return item.exibe === 'S';
      })
      .map(item => ({
        title: item.label,
        key: item.key,
        align: 'start',
        sortable: true
      }));
    
    console.log('Headers gerados do labelMap:', headersFromLabelMap);
    return headersFromLabelMap;
  }
  
  console.log('Usando fallback para gerar headers');
  // Fallback: se não tiver labelMap, usa o método anterior
  const primeiroItem = dadosArray[0];
  return Object.keys(primeiroItem).map(key => ({
    title: key.toUpperCase(), // Formatação simples do título
    key: key,
    align: 'start',
    sortable: true
  }));
};

// Função para filtrar e carregar dados da API
const onFilter = async () => {
  // Validação básica: pelo menos um campo preenchido
  if (!dataInicial.value && !dataFinal.value && !ordemServico.value && !tag.value && !emAberto.value) {
    alert('Preencha pelo menos um campo do filtro');
    return;
  }

  loading.value = true;
  try {
    // Prepara os parâmetros para a API
      const params = {
        dataIni: dataInicial.value ? dataInicial.value.replace(/-/g, '') : '',
        dataFim: dataFinal.value ? dataFinal.value.replace(/-/g, '') : '',
        optck: ordemServico.value || '',
        tagBag: tag.value || '',
        status: emAberto.value || '',
        salto: "0",
        regPPagina: "9999"
      };

    console.log('Parâmetros enviados para a API:', params);

    const response = await OEStore.getOE(params);
    console.log('Dados recebidos da API:', response);
    
    if (Array.isArray(response)) {
      dadosCompletos.value = response; // Armazena todos os dados
      dados.value = response;
      headers.value = gerarHeaders(response);
    } else if (response && Array.isArray(response.data)) {
      dadosCompletos.value = response.data; // Armazena todos os dados
      dados.value = response.data;
      headers.value = gerarHeaders(response.data, response.labelMap);
    } else if (response && Array.isArray(response.listOE)) {
      // Trata o caso específico da API getOE que retorna listOE
      dadosCompletos.value = response.listOE; // Armazena todos os dados
      dados.value = response.listOE;
      headers.value = gerarHeaders(response.listOE, response.labelMap);
      console.log('LabelMap recebido:', response.labelMap);
      console.log('Headers gerados:', headers.value);
    } else {
      console.warn('Formato de dados inesperado:', response);
      dadosCompletos.value = [];
      dados.value = [];
      headers.value = [];
    }
    
    mostrarTabela.value = true;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    dadosCompletos.value = [];
    dados.value = [];
    headers.value = [];
    alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
  } finally {
    loading.value = false;
  }
};

// Função para abrir o modal de detalhes
const abrirDetalhes = async (item) => {
  loading.value = true;
  try {
    // Faz uma nova chamada à API com apenas o optck selecionado e status em branco
    const params = {
      dataIni: '',
      dataFim: '',
      optck: item.opTck || '',
      tagBag: '',
      status: '', // Status em branco para trazer todos os itens
      salto: "0",
      regPPagina: "9999"
    };

    console.log('Parâmetros para buscar detalhes:', params);

    const response = await OEStore.getOE(params);
    console.log('Dados recebidos para detalhes:', response);
    
    let dadosDetalhes = [];
    if (Array.isArray(response)) {
      dadosDetalhes = response;
    } else if (response && Array.isArray(response.data)) {
      dadosDetalhes = response.data;
    } else if (response && Array.isArray(response.listOE)) {
      dadosDetalhes = response.listOE;
    }

    // Atualiza os dados completos com os dados específicos deste optck
    dadosCompletos.value = dadosDetalhes;
    itemSelecionado.value = item;
    modalDetalhesVisible.value = true;
  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
    alert('Erro ao carregar detalhes. Verifique o console para mais detalhes.');
  } finally {
    loading.value = false;
  }
};

// Função para carregar dados da API (mantida para compatibilidade)
const carregarDados = async () => {
  // Chama a função de filtro se já tiver dados de filtro
  if (mostrarTabela.value) {
    await onFilter();
  }
};

// Função para recarregar detalhes quando dados forem alterados
const recarregarDetalhes = async () => {
  console.log('Recarregando detalhes após alteração de dados...');
  
  // Se tiver um item selecionado, recarrega os detalhes
  if (itemSelecionado.value && itemSelecionado.value.opTck) {
    await abrirDetalhes(itemSelecionado.value);
  }
  
  // Também recarrega a lista geral se estiver visível
  if (mostrarTabela.value) {
    await onFilter();
  }
};

// Função para abrir modal de exclusão
const abrirModalExcluir = () => {
  console.log('Abrindo modal de seleção para exclusão');
  
  if (dadosCompletos.value.length === 0) {
    alert('Nenhuma OS disponível para exclusão. Faça uma consulta primeiro.');
    return;
  }
  
  // Abre o modal de seleção de OS para exclusão
  modalSelecionarExclusaoVisible.value = true;
};

// Função para abrir modal de clonagem
const abrirModalClonar = () => {
  if (dadosCompletos.value.length === 0) {
    alert('Nenhuma OS disponível para clonagem. Faça uma consulta primeiro.');
    return;
  }
  modalClonarVisible.value = true;
};

// Função para abrir modal de nova ordem
const abrirModalNovaOrdem = () => {
  console.log('Abrir modal de nova ordem');
  // Implementar conforme necessário
};

// Função para confirmar clonagem
const confirmarClonagem = (evento) => {
  console.log('Clonagem confirmada no componente pai:', evento);
  
  if (evento.success === true) {
    // Sucesso confirmado
    alert(`OS ${evento.os.osid} clonada com sucesso!`);
    
    // Recarrega os dados apenas em caso de sucesso
    onFilter();
  } else if (evento.success === false) {
    // Erro confirmado - não fazer nada adicional pois o modal já mostrou o erro
    console.log('Clonagem falhou:', evento.error);
    // Não recarrega os dados em caso de erro
  } else {
    // Fallback para compatibilidade com versão anterior
    if (evento.response) {
      // Verifica se a resposta indica sucesso
      if (evento.response.code === 200 || evento.response.code === 201 || (!evento.response.code && !evento.response.message)) {
        alert(`OS ${evento.os.osid} clonada com sucesso!`);
        onFilter();
      } else {
        console.log('Erro detectado na resposta:', evento.response);
      }
    }
  }
};

// Função para lidar com exclusão bem-sucedida
const onExclusaoConcluida = (resultado) => {
  console.log('Exclusão concluída:', resultado);
  
  // Determina mensagem baseada no resultado
  let mensagem = '';
  if (resultado.erros > 0) {
    mensagem = `${resultado.sucessos} item(ns) excluído(s) com sucesso, ${resultado.erros} erro(s) encontrado(s)`;
  } else {
    mensagem = `${resultado.sucessos} item(ns) excluído(s) com sucesso!`;
  }
  
  if (resultado.osExcluidas && resultado.osExcluidas.length > 0) {
    mensagem += `\nOS processadas: ${resultado.osExcluidas.join(', ')}`;
  }
  
  alert(mensagem);
  
  // Fechar o modal de seleção
  modalSelecionarExclusaoVisible.value = false;
  
  // Fechar o modal de exclusão (se estiver aberto)
  modalExcluirVisible.value = false;
  
  // Limpar dados de exclusão
  dadosExclusao.value = {
    dadosOrdemServico: {},
    itensParaExcluir: []
  };
  
  // Recarregar dados da tabela
  if (mostrarTabela.value) {
    onFilter();
  }
};

// Função para lidar com erros na exclusão
const onErroExclusao = (resultado) => {
  console.error('Erro na exclusão:', resultado);
  
  // Exibir mensagem de erro
  let mensagem = resultado.erro || 'Erro desconhecido ao excluir itens';
  
  if (resultado.errosDetalhados && resultado.errosDetalhados.length > 0) {
    mensagem += '\n\nDetalhes dos erros:';
    resultado.errosDetalhados.forEach(erro => {
      mensagem += `\nOS ${erro.osid}, Item ${erro.item}: ${erro.erro}`;
    });
  }
  
  alert(`Erro na exclusão: ${mensagem}`);
  
  // Não fechar o modal para permitir nova tentativa
};

onMounted(() => {
  // Remove o carregamento automático - agora só carrega quando filtrar
  console.log('Página carregada. Use os filtros para buscar dados.');
});
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