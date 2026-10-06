<template>
    <v-container class="centralizado container">
      <!-- Balão de alerta para OPs sem apontamento -->
      <div v-if="opsSemApontamento.length > 0 && mostrarBalao" class="alert-balloon">
        <div class="balloon-header">
          <span class="balloon-title">⚠️ Lembrete: Apontamento Pendente</span>
          <button class="close-btn" @click="fecharBalao">×</button>
        </div>
        <div class="balloon-content">
          <p class="balloon-text">Impurezas nos ímãs não apontadas:</p>
          <ul class="ops-list">
            <li v-for="(item, index) in opsSemApontamento" :key="index">
              <strong>{{ item.op }}</strong>
            </li>
          </ul>
        </div>
      </div>

      <v-card class="formulario-card">
        <v-card-title class="title-header">
          <h1>Apontamento Imãs</h1>
          <button type="button" class="refresh-alert-btn" @click="reabrirBalao" :disabled="loadingBalao" title="Verificar apontamentos pendentes">
            <span v-if="loadingBalao" class="bell-spinner"></span>
            <span v-else>🔔</span>
          </button>
        </v-card-title>
        
        <v-card-text class="pa-3">
          <v-col cols="12" class="py-1">
            <v-select
              v-model="tipoSelecionado"
              :items="tiposDisponiveis"
              label="Setor"
              outlined
              dense
              class="campo-destaque"
              @update:model-value="equipamento = ''"
            ></v-select>
          </v-col>

          <v-col cols="12" class="py-1" v-if="tipoSelecionado">
            <v-select
              v-model="equipamento"
              :items="equipamentosFiltrados"
              label="Equipamento"
              item-title="cadAuxDescr"
              item-value="cadAuxCod"
              outlined
              dense
              class="campo-destaque"
            ></v-select>
          </v-col>

          <v-row class="ma-0">
            <v-col cols="3" class="py-1 pr-1">
              <v-select
                v-model="lotePrefixo"
                :items="prefixosLote"
                label=""
                outlined
                dense
                class="campo-destaque"
              ></v-select>
            </v-col>
            <v-col cols="9" class="py-1 pl-1">
              <v-text-field
                v-model="loteNumero"
                label="Número do Lote"
                type="number"
                outlined
                dense
                class="campo-destaque"
                autocomplete="off"
                :maxlength="lotePrefixo === 'BC' || lotePrefixo === 'TF' ? 10 : 6"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-col cols="12" class="py-1">
            <v-text-field
              v-model="quantidade"
              label="Quantidade (g)"
              type="number"
              outlined
              dense
              class="campo-destaque"
              autocomplete="off"
            ></v-text-field>
          </v-col>

          <v-col cols="12" class="py-1">
            <v-text-field
              v-model="observacao"
              label="Observação"
              outlined
              dense
              class="campo-destaque"
              autocomplete="off"
            ></v-text-field>
          </v-col>

          <v-row class="ma-0">
            <v-col cols="6" class="py-1">
              <v-text-field
                v-model="data"
                label="Data"
                readonly
                outlined
                dense
                class="campo-destaque"
              ></v-text-field>
            </v-col>

            <v-col cols="6" class="py-1">
              <v-text-field
                v-model="hora"
                label="Hora"
                readonly
                outlined
                dense
                class="campo-destaque"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row class="ma-0">
            <v-col cols="12" class="text-center py-2">
              <v-btn color="blue" class="white--text" @click="salvar">Salvar</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { cadUsrMaq } from '../../stores/Consultas/getCadUsrMaq';
import { apImas } from '../../stores/Consultas/postApImas';
import { checkOpImas } from '../../stores/Consultas/getCheckOs';
import { cadAux as cadAuxAll } from '../../stores/Movimentos/getCadAux';
import axios from 'axios';

const equipamentoStore = cadUsrMaq();
const apImasStore = apImas();
const checkOpImasStore = checkOpImas();
const allEquipStore = cadAuxAll();

// Agrupamento de setores: Produção é independente; os outros 3 são um grupo
const SETORES_GRUPO3 = ['Expedicao', 'Recebimento', 'Preparo'];
const SETOR_PROD = 'Producao';

const tipoSelecionado = ref('');
const equipamento = ref('');
const equipamentos = ref([]);
const lotePrefixo = ref('');
const loteNumero = ref('');
const prefixosLote = ref(['RB', 'PP', 'CA', 'TR', 'VA', 'VE', 'VC', 'BC', 'TF']);
const quantidade = ref(null);
const observacao = ref('');
const data = ref('');
const hora = ref('');
const opsSemApontamento = ref([]);
const mostrarBalao = ref(false);
const intervalBalao = ref(null);
const ops = ref([]);
const verificandoOps = ref(false); // Flag para evitar chamadas simultâneas
const loadingBalao = ref(false);
const todosEquipamentosAPT = ref([]); // Todos os equipamentos APT (todos os setores)
const equipamentosCarregados = ref(false); // Garante que ambos os carregamentos terminaram antes do check

// Computed para obter tipos únicos disponíveis
const tiposDisponiveis = computed(() => {
  if (!equipamentos.value || equipamentos.value.length === 0) return [];
  
  const tipos = [...new Set(equipamentos.value.map(eq => eq.cadAuxCodAlt))];
  return tipos.filter(tipo => tipo); // Remove valores vazios/null
});

// Computed para filtrar equipamentos por tipo
const equipamentosFiltrados = computed(() => {
  if (!tipoSelecionado.value || !equipamentos.value) return [];
  
  return equipamentos.value.filter(eq => eq.cadAuxCodAlt === tipoSelecionado.value);
});

const updateDateTime = () => {
  const now = new Date();
  data.value = now.toLocaleDateString('pt-BR');
  hora.value = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const carregarEquipametos = async() => {
    try {
        const usuario = localStorage.getItem('user');
        
        if (!usuario) {
            console.error('Usuário não encontrado no localStorage');
            alert('Usuário não encontrado. Faça login novamente.');
            equipamentos.value = [];
            return;
        }

        const usuarioUpper = usuario.toUpperCase();
        const dados = await equipamentoStore.getCadUsrMaq(usuarioUpper);
        
        equipamentos.value = Array.isArray(dados) ? dados : [];
        
        console.log('Equipamentos carregados:', equipamentos.value.length);
        
        // Se tiver apenas 1 setor, seleciona automaticamente
        // Extrai setores únicos manualmente para garantir sincronia
        const setoresUnicos = [...new Set(equipamentos.value.map(eq => eq.cadAuxCodAlt).filter(s => s))];
        console.log('Setores encontrados:', setoresUnicos);
        
        if (setoresUnicos.length === 1) {
            tipoSelecionado.value = setoresUnicos[0];
            console.log('✓ Auto-selecionado setor:', tipoSelecionado.value);
        }
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        equipamentos.value = [];
    }
}

const carregarTodosEquipamentos = async () => {
    try {
        const dados = await allEquipStore.cadAux('APT');
        todosEquipamentosAPT.value = Array.isArray(dados) ? dados : [];
        console.log('[DEBUG] getCadAux(APT) total:', todosEquipamentosAPT.value.length);
        console.log('[DEBUG] getCadAux(APT) amostra (3 primeiros):', JSON.stringify(todosEquipamentosAPT.value.slice(0, 3)));
    } catch (error) {
        console.error('Erro ao carregar todos os equipamentos APT:', error);
        todosEquipamentosAPT.value = [];
    }
}

const getOp = async () => {
  try {
    const response = await axios.get('http://192.168.1.213:8090/api_supervisorio/getOpDia');
    ops.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar as ordens de produção', error);
  }
};

const verificarOPsSemApontamento = async (setor = null) => {
  // Evita chamadas simultâneas
  if (verificandoOps.value) {
    console.log('Verificação já em andamento, aguarde...');
    return;
  }
  
  verificandoOps.value = true;
  
  try {
    await getOp();
    
    if (ops.value.length === 0) {
      console.log('Nenhuma OP disponível para verificar.');
      opsSemApontamento.value = [];
      return;
    }

    // Usa todos os equipamentos carregados (todos os setores)
    // Fallback para os equipamentos do usuário se não carregou os globais

    console.log('[DEBUG] === verificarOPsSemApontamento ===');
    console.log('[DEBUG] setor:', setor);
    console.log('[DEBUG] equipamentos.value (getCadUsrMaq):', equipamentos.value.length, JSON.stringify(equipamentos.value.slice(0, 2)));
    console.log('[DEBUG] todosEquipamentosAPT (getCadAux):', todosEquipamentosAPT.value.length, JSON.stringify(todosEquipamentosAPT.value.slice(0, 2)));
    console.log('[DEBUG] ops a verificar:', ops.value.length);

    let resultado = [];

    if (setor === SETOR_PROD) {
      // Produção: verificação independente — só equipamentos da Produção
      // Prioriza equipamentos do usuário (getCadUsrMaq tem cadAuxCodAlt confiável)
      const equipUsuarioProducao = equipamentos.value.filter(eq => eq.cadAuxCodAlt === SETOR_PROD);
      const equipProducao = equipUsuarioProducao.length > 0
        ? equipUsuarioProducao
        : todosEquipamentosAPT.value.filter(eq => eq.cadAuxCodAlt === SETOR_PROD);

      console.log('[Produção] equipamentos para check:', equipProducao.length);
      if (equipProducao.length > 0) {
        resultado = await checkOpImasStore.verificarOPsSemApontamento(ops.value, equipProducao);
      }
    } else if (SETORES_GRUPO3.includes(setor)) {
      // Grupo dos 3 (Expedição, Recebimento, Preparo): passa todos juntos.
      // Se qualquer um do grupo já apontou → backend retorna success → OP não entra na lista
      const equipGrupo3Global = todosEquipamentosAPT.value.filter(eq => SETORES_GRUPO3.includes(eq.cadAuxCodAlt));
      const equipGrupo3Fallback = equipamentos.value.filter(eq => SETORES_GRUPO3.includes(eq.cadAuxCodAlt));
      const equipGrupo3Base = equipGrupo3Global.length > 0 ? equipGrupo3Global : equipGrupo3Fallback;

      // CRUCIAL: unifica o setor de todos os equipamentos para um único valor (o setor atual).
      // O backend agrupa por setor; se passarmos Expedicao/Recebimento/Preparo separados, ele retorna
      // setoresPendentes para os que não apontaram ainda — mesmo que um já tenha apontado.
      // Ao unificar o setor, se QUALQUER dos 18 equipamentos tiver gravação, o backend retorna success.
      const equipGrupo3 = equipGrupo3Base.map(eq => ({ ...eq, cadAuxCodAlt: setor }));

      console.log('[Grupo3/' + setor + '] equipamentos para check:', equipGrupo3.length);
      if (equipGrupo3.length > 0) {
        resultado = await checkOpImasStore.verificarOPsSemApontamento(ops.value, equipGrupo3);
      }
    } else {
      // Setor desconhecido: usa equipamentos do próprio usuário como fallback
      const equipamentosDoSetor = equipamentos.value.filter(eq => eq.cadAuxCodAlt === setor);
      if (equipamentosDoSetor.length > 0) {
        resultado = await checkOpImasStore.verificarOPsSemApontamento(ops.value, equipamentosDoSetor);
      }
    }

    opsSemApontamento.value = resultado;
    console.log('OPs pendentes no setor', setor, ':', opsSemApontamento.value.length);
    
    // Mostra o balão se houver OPs pendentes
    if (opsSemApontamento.value.length > 0) {
      mostrarBalao.value = true;
    }
  } catch (error) {
    console.error('Erro ao verificar OPs sem apontamento:', error);
  } finally {
    verificandoOps.value = false;
  }
};

const fecharBalao = () => {
  mostrarBalao.value = false;
};

const reabrirBalao = async () => {
  if (tipoSelecionado.value) {
    loadingBalao.value = true;
    try {
      await verificarOPsSemApontamento(tipoSelecionado.value);
    } finally {
      loadingBalao.value = false;
    }
  } else {
    alert('Por favor, selecione um setor primeiro.');
  }
};

const salvar = async (forceInsert = false) => {
  try {
    // Validação do lote
    if (!lotePrefixo.value) {
      alert('Por favor, selecione um prefixo para o lote.');
      return;
    }
    
    if (!loteNumero.value) {
      alert('Por favor, digite o número do lote.');
      return;
    }

    const numeroDigitado = loteNumero.value.toString();
    const tamanhoEsperado = (lotePrefixo.value === 'BC' || lotePrefixo.value === 'TF') ? 10 : 6;
    
    if (numeroDigitado.length !== tamanhoEsperado) {
      alert(`O número do lote para o prefixo ${lotePrefixo.value} deve ter exatamente ${tamanhoEsperado} dígitos.`);
      return;
    }

    const loteCompleto = `${lotePrefixo.value}-${numeroDigitado}`;

    // Converte gramas para kg (divide por 1000)
    const quantidadeEmKg = Number(quantidade.value) / 1000;

    const payload = {
      apLote: loteCompleto,
      apEquipto: equipamento.value,
      apQuant: quantidadeEmKg,
      apObs: observacao.value,
      apData: data.value.split('/').reverse().join(''),
      apHora: hora.value,
      force: forceInsert,
    };

    console.log('======= DADOS ENVIADOS =======');
    console.log('Quantidade digitada (gramas):', quantidade.value);
    console.log('Quantidade convertida (kg):', quantidadeEmKg);
    console.log('Payload completo:', payload);
    console.log('==============================');

    const response = await apImasStore.apImas(payload);
    console.log('Resposta da API:', response);

    // Verifica se o lote já existe e pede confirmação
    if (response.code === 400) {
      const confirmar = confirm(`${response.message}\n\nDeseja incluir mesmo assim?`);
      if (confirmar) {
        // Reenvia com force = true
        await salvar(true);
      }
      return;
    }

    if (response === "success" || response.data === "success" || response.code === 600 || response.type === "seccess") {
      alert('Dados enviados com sucesso!');

      // Limpa os campos do formulário
      tipoSelecionado.value = '';
      equipamento.value = '';
      lotePrefixo.value = '';
      loteNumero.value = '';
      quantidade.value = null;
      observacao.value = '';
    } else {
      alert(`${response.message}`);
    }
  } catch (error) {
    console.error('Erro inesperado:', error);
    alert('Ocorreu um erro inesperado. Verifique o console para mais detalhes.');
  }
};

// Watch para verificar OPs quando o setor mudar
// Só dispara APÓS ambos os carregamentos terminarem (evita timing issue com todosEquipamentosAPT)
watch(tipoSelecionado, async (novoSetor) => {
  if (!equipamentosCarregados.value) return;

  mostrarBalao.value = false;
  opsSemApontamento.value = [];

  if (novoSetor) {
    await verificarOPsSemApontamento(novoSetor);
  }
});

onMounted(async () => {
  updateDateTime();
  setInterval(() => {
    updateDateTime();
  }, 60000); // Atualiza a cada 1 minuto
  
  // Carrega os equipamentos em paralelo e só habilita o watch após ambos terminarem
  await Promise.all([carregarEquipametos(), carregarTodosEquipamentos()]);
  equipamentosCarregados.value = true;

  // Dispara a verificação inicial manualmente (watch não atuou enquanto flag estava false)
  if (tipoSelecionado.value) {
    await verificarOPsSemApontamento(tipoSelecionado.value);
  }

  // Configura intervalo para verificar a cada 1 hora (3600000 ms)
  // Só verifica se houver um setor selecionado
  intervalBalao.value = setInterval(async () => {
    if (tipoSelecionado.value) {
      await verificarOPsSemApontamento(tipoSelecionado.value);
    }
  }, 3600000); // 1 hora
});

onBeforeUnmount(() => {
  // Limpa o intervalo quando o componente for destruído
  if (intervalBalao.value) {
    clearInterval(intervalBalao.value);
  }
});
</script>

<style scoped>
h1 {
  color: #2e7d32;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.title-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px !important;
}

.refresh-alert-btn {
  padding: 8px 16px;
  background-color: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  margin-left: auto;
}

.refresh-alert-btn:hover {
  background-color: #ee5a6f;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.refresh-alert-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.refresh-alert-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.bell-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.centralizado {
  max-width: 500px;
  margin: 0 auto;
  padding: 10px;
}

.container {
  min-width: 500px;
}

.formulario-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
  border: 2px solid #e0e0e0;
  padding: 8px;
}

.campo-destaque {
  background-color: #ffffff;
  border-radius: 8px;
  margin-bottom: 4px;
}

/* Estilos do balão de alerta */
.alert-balloon {
  position: fixed;
  top: 80px;
  left: 20px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  min-width: 280px;
  max-width: 350px;
  z-index: 1000;
  animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.balloon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.balloon-title {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.balloon-content {
  padding: 15px;
}

.balloon-text {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 500;
}

.ops-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.ops-list li {
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  transition: background-color 0.3s;
}

.ops-list li:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.ops-list li:last-child {
  margin-bottom: 0;
}

.equipamentos-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
  font-size: 13px;
}

.equipamentos-list li {
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 4px;
  font-weight: normal;
}

.equipamentos-list li:last-child {
  margin-bottom: 0;
}

.ops-list > li > strong {
  display: block;
  margin-bottom: 4px;
  font-size: 15px;
}

.ops-list::-webkit-scrollbar {
  width: 6px;
}

.ops-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.ops-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.ops-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.campo-destaque .v-input__control .v-input__slot {
  background-color: #ffffff !important;
  border: 1px solid #90caf9;
  border-radius: 8px;
  min-height: 36px !important;
}

.campo-destaque .v-input__control {
  min-height: 36px !important;
}

.campo-destaque .v-text-field__details {
  padding-top: 2px !important;
  margin-bottom: 2px !important;
}

.py-1 {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.pr-1 {
  padding-right: 4px !important;
}

.pl-1 {
  padding-left: 4px !important;
}

.py-2 {
  padding-top: 8px !important;
  padding-bottom: 4px !important;
}

.pa-3 {
  padding: 8px !important;
}

.ma-0 {
  margin: 0 !important;
}

.text-center {
  text-align: center;
}
</style>