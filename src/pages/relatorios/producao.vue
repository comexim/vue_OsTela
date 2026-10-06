<template>
  <v-container fluid class="page-wrap pa-0">
    <v-card class="w-100">
      <v-card-title>
        <v-row align="center" justify="space-between">
          <v-col cols="auto">
            <h1 class="titulo-pagina">Monitoramento de Produção</h1>
          </v-col>
          <v-col cols="auto" class="d-flex align-center ga-2">
            <v-btn
              v-if="veioDoDashboard"
              variant="text"
              prepend-icon="mdi-arrow-left"
              @click="router.push('/relatorios/producaoDashboard')"
            >
              Voltar
            </v-btn>
            <v-btn
              color="primary"
              @click="carregarDados"
              :loading="loading"
              :disabled="!selectedMaquinario || visualizandoHistorico"
              prepend-icon="mdi-refresh"
              variant="elevated"
            >
              Atualizar
            </v-btn>
            <div v-if="refreshProgress > 0 && !visualizandoHistorico" class="mt-1" style="min-width: 110px">
              <v-progress-linear
                :model-value="refreshProgress"
                color="primary"
                height="4"
                rounded
              ></v-progress-linear>
              <div class="text-center mt-1" style="font-size:0.6rem; color:#9e9e9e">
                {{ refreshSecondsLeft }}s para atualizar
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-title>

      <v-card-text>
        <!-- Loading -->
        <div v-if="loading" class="text-center py-10">
          <v-progress-circular indeterminate color="success" size="64"></v-progress-circular>
          <p class="mt-3 text-grey">Carregando dados de produção...</p>
        </div>

        <!-- Conteúdo principal -->
        <v-row v-else-if="selectedMaquinario" class="mt-1" no-gutters>
          <!-- Coluna esquerda: cards de guia -->
          <v-col cols="12" md="8" class="pr-md-4">

            <!-- Guia Anterior + Próxima Guia lado a lado -->
            <v-row dense class="mb-2">
              <!-- Guia Anterior -->
              <v-col cols="6">
                <v-card
                  variant="outlined"
                  class="pa-2 rounded-lg guia-nav-card h-100"
                  :class="{ 'guia-nav-clickable': guiaAnterior && !visualizandoHistorico }"
                  @click="abrirGuiaAnterior"
                >
                  <div class="label-meta mb-1">
                    <v-icon size="12" class="mr-1">mdi-chevron-left</v-icon>GUIA ANTERIOR
                  </div>
                  <template v-if="guiaAnterior">
                    <div class="d-flex align-center flex-wrap ga-1">
                      <span class="text-body-1 font-weight-bold">{{ guiaAnterior.guia }}</span>
                      <span class="text-caption text-grey-darken-2">{{ guiaAnterior.guiadg }}</span>
                    </div>
                    <div class="d-flex align-center justify-space-between mt-1">
                      <span class="text-caption text-grey">Fim: {{ guiaAnterior.fim }}</span>
                      <v-chip color="success" size="x-small" variant="flat">Finalizada</v-chip>
                    </div>
                  </template>
                  <div v-else class="text-caption text-grey mt-1">—</div>
                </v-card>
              </v-col>

              <!-- Próxima Guia -->
              <v-col cols="6">
                <v-card
                  variant="outlined"
                  class="pa-2 rounded-lg guia-nav-card h-100"
                  :class="{ 'guia-nav-clickable': visualizandoHistorico && proximaGuia }"
                  @click="visualizandoHistorico ? voltarGuiaOriginal() : undefined"
                >
                  <div class="label-meta mb-1">
                    PRÓXIMA GUIA <v-icon size="12" class="ml-1">mdi-chevron-right</v-icon>
                  </div>
                  <template v-if="proximaGuia">
                    <div class="d-flex align-center flex-wrap ga-1">
                      <span class="text-body-1 font-weight-bold">{{ proximaGuia.guia }}</span>
                      <span class="text-caption text-grey-darken-2">{{ proximaGuia.guiadg }}</span>
                    </div>
                    <div class="mt-1">
                      <span class="text-caption text-grey">Previsão: </span>
                      <span class="text-caption text-primary font-weight-medium">{{ proximaGuia.previsaoInicio }}</span>
                    </div>
                  </template>
                  <div v-else class="text-caption text-grey mt-1">—</div>
                </v-card>
              </v-col>
            </v-row>

            <!-- Guia Atual -->
            <v-card
              v-if="guiaAtual"
              class="mb-3 rounded-lg"
              :class="guiaAtual.status === 'PRODUZINDO' ? 'guia-atual-card' : guiaAtual.status === 'FINALIZADA' ? 'guia-hist-card' : 'guia-parado-card'"
              elevation="3"
            >
              <v-card-text class="pa-3">
                <!-- Status -->
                <v-chip
                  :color="guiaAtual.status === 'PRODUZINDO' ? 'success' : guiaAtual.status === 'FINALIZADA' ? 'grey' : 'error'"
                  size="x-small"
                  variant="flat"
                  class="mb-2"
                >
                  <v-icon start size="x-small">mdi-circle</v-icon>
                  STATUS: {{ guiaAtual.status }}
                </v-chip>

                <!-- Setor -->
                <div class="label-green mb-1">SETOR</div>
                <div class="text-body-1 font-weight-bold text-green-darken-4 mb-2">{{ guiaAtual.setor }}</div>

                <!-- Lote / Quant. labels + valores alinhados -->
                <div class="d-flex align-end justify-center ga-4 mb-2">
                  <div>
                    <div class="label-green mb-1">LOTE</div>
                    <div class="text-guia font-weight-bold text-green-darken-4">{{ guiaAtual.quantidade }}</div>
                  </div>
                  <div class="text-guia font-weight-bold text-green-darken-4" style="line-height:1.1">–</div>
                  <div>
                    <div class="label-green mb-1">QUANT.</div>
                    <div class="text-guia font-weight-bold text-green-darken-4">{{ guiaAtual.sacas }}</div>
                  </div>
                </div>

                <!-- Início / Previsão Término / Duração -->
                <v-row dense class="mb-2">
                  <v-col cols="4">
                    <div class="label-green mb-1">INÍCIO</div>
                    <div class="text-caption font-weight-bold text-green-darken-4">{{ guiaAtual.inicio }}</div>
                  </v-col>
                  <v-col cols="4">
                    <div class="label-green mb-1">PREVISÃO TÉRMINO</div>
                    <div class="text-caption font-weight-bold text-green-darken-4">{{ guiaAtual.previsaoTermino }}</div>
                  </v-col>
                  <v-col cols="4">
                    <div class="label-green mb-1">DURAÇÃO EST.</div>
                    <div class="text-caption font-weight-bold text-green-darken-4">{{ guiaAtual.duracaoEst }}</div>
                  </v-col>
                </v-row>

                <!-- Peneira / Cate / Desde -->
                <div class="peneira-box pa-2 rounded-lg mb-2">
                  <v-row align="center" dense>
                    <v-col v-if="guiaAtual.status !== 'PARADO'" cols="auto">
                      <v-icon color="success" size="18" class="mr-1">mdi-pulse</v-icon>
                    </v-col>
                    <v-col v-if="maquinarioTipo !== 'classificador' && guiaAtual.status !== 'PARADO'" cols="auto" class="mr-3">
                      <div class="label-green">PENEIRA</div>
                      <div class="text-caption font-weight-bold text-green-darken-4">{{ guiaAtual.peneira }}</div>
                    </v-col>
                    <v-col v-if="maquinarioTipo !== 'classificador' && guiaAtual.status !== 'PARADO'" cols="auto" class="mr-3">
                      <div class="label-green">{{ maquinarioTipo === 'mesa' ? 'VENTO' : 'CATE' }}</div>
                      <div class="text-caption font-weight-bold text-green-darken-4">{{ guiaAtual.cate }}</div>
                    </v-col>
                    <v-col cols="auto">
                      <div class="label-green">DESDE</div>
                      <div class="text-caption font-weight-bold text-green-darken-4">{{ guiaAtual.desde }}</div>
                    </v-col>
                    <v-col v-if="guiaAtual.status === 'PARADO' && guiaAtual.paradaMotivo" cols="auto">
                      <div class="label-red">MOTIVO PARADA</div>
                      <div class="text-caption font-weight-bold text-red-darken-3">{{ guiaAtual.paradaMotivo }} – {{ guiaAtual.paradaDescricao }}</div>
                    </v-col>
                    <v-col cols="12" sm="auto" class="ml-sm-auto">
                      <div class="label-green">REFERÊNCIA</div>
                      <div class="text-caption font-weight-bold text-green-darken-4">{{ guiaAtual.refer }}</div>
                    </v-col>
                  </v-row>
                </div>

                <!-- Horas em Produção / Horas Parado -->
                <v-row dense>
                  <v-col cols="6">
                    <div class="horas-prod-box pa-2 rounded-lg">
                      <div class="label-green mb-1">HORAS EM PRODUÇÃO</div>
                      <div class="d-flex align-center ga-1 mb-1">
                        <v-icon color="success" size="16">mdi-chart-line-variant</v-icon>
                        <span class="text-body-2 font-weight-bold text-green-darken-4">{{ guiaAtual.horasProducao }}</span>
                        <span class="text-caption text-green-darken-3">{{ guiaAtual.percentProducao }}</span>
                      </div>
                      <v-progress-linear
                        :model-value="guiaAtual.percentProducaoNum"
                        color="success"
                        height="4"
                        rounded
                      ></v-progress-linear>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="horas-par-box pa-2 rounded-lg">
                      <div class="label-red mb-1">HORAS PARADO</div>
                      <div class="d-flex align-center ga-1 mb-1">
                        <v-icon color="error" size="16">mdi-pause</v-icon>
                        <span class="text-body-2 font-weight-bold text-red-darken-3">{{ guiaAtual.horasParado }}</span>
                        <span class="text-caption text-red-darken-2">{{ guiaAtual.percentParado }}</span>
                      </div>
                      <v-progress-linear
                        :model-value="guiaAtual.percentParadoNum"
                        color="error"
                        height="4"
                        rounded
                      ></v-progress-linear>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Sem guia atual -->
            <v-alert
              v-else
              type="info"
              variant="tonal"
              class="mb-3"
            >
              Nenhuma guia em produção no momento.
            </v-alert>

          </v-col>

          <!-- Coluna direita: Resumo Paradas -->
          <v-col cols="12" md="4" class="mt-4 mt-md-0">

            <div class="label-meta d-flex align-center ga-1 mb-3">
              <v-icon size="15">mdi-chart-bar</v-icon> RESUMO PARADAS
            </div>

            <v-table density="compact" class="rounded-lg paradas-table">
              <thead>
                <tr>
                  <th class="text-caption font-weight-bold">CÓD</th>
                  <th class="text-caption font-weight-bold">DESCRIÇÃO</th>
                  <th class="text-caption font-weight-bold text-right">OCORR.</th>
                  <th class="text-caption font-weight-bold text-right">TOTAL</th>
                  <th class="text-caption font-weight-bold text-right">%</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="parada in resumoParadas"
                  :key="parada.cod"
                  class="parada-clickable"
                  title="Clique para ver os detalhes"
                  @click="abrirDetalhesParada(parada)"
                >
                  <td class="text-caption font-weight-bold text-error">{{ parada.cod }}</td>
                  <td class="text-caption">{{ parada.descricao }}</td>
                  <td class="text-caption text-right">{{ parada.ocorrencias }}</td>
                  <td class="text-caption text-right">{{ parada.total }}</td>
                  <td class="text-caption text-right">{{ parada.percentual }}</td>
                </tr>
                <tr v-if="resumoParadas.length > 0" class="totais-row">
                  <td colspan="2" class="text-caption font-weight-bold">TOTAL</td>
                  <td></td>
                  <td class="text-caption font-weight-bold text-right">{{ totalParadaHoras }}</td>
                  <td class="text-caption font-weight-bold text-right">100%</td>
                </tr>
                <tr v-if="resumoParadas.length === 0">
                  <td colspan="5" class="text-center text-caption text-grey py-4">
                    Nenhuma parada registrada
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div class="label-meta d-flex align-center ga-1 mb-3 mt-5">
              <v-icon size="15">mdi-package-variant-closed</v-icon> LOTES DA OP
            </div>

            <div class="lotes-table-scroll rounded-lg">
              <v-table density="compact" class="lotes-table">
                <thead>
                  <tr>
                    <th class="text-caption font-weight-bold text-center">LOTE</th>
                    <th class="text-caption font-weight-bold text-right">SACAS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingLotes">
                    <td colspan="2" class="text-center text-caption text-grey py-4">
                      <v-progress-circular indeterminate size="18" width="2" class="mr-2" />
                      Carregando lotes...
                    </td>
                  </tr>
                  <tr v-for="item in lotesAgrupados" v-else :key="item.lote">
                    <td class="text-caption font-weight-bold">{{ item.lote }}</td>
                    <td class="text-caption text-right">{{ item.sacas.toFixed(2) }}</td>
                  </tr>
                  <tr v-if="!loadingLotes && lotesAgrupados.length === 0">
                    <td colspan="2" class="text-center text-caption text-grey py-5">
                      Nenhum lote encontrado
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-col>
        </v-row>

        <!-- Estado vazio: nenhum maquinário selecionado -->
        <div v-else-if="!loading" class="text-center py-10">
          <v-icon size="64" color="grey-lighten-2">mdi-cog-outline</v-icon>
          <p class="mt-3 text-grey">Selecione um maquinário para visualizar a produção</p>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="modalDetalhesParada" max-width="850px">
      <v-card>
        <v-card-title class="d-flex align-center bg-primary text-white pa-3">
          <v-icon class="mr-2">mdi-timer-alert-outline</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Parada {{ paradaSelecionada?.cod }}</div>
            <div class="text-caption">{{ paradaSelecionada?.descricao }}</div>
          </div>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" color="white" @click="modalDetalhesParada = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <v-table density="compact" class="rounded-lg detalhes-parada-table">
            <thead>
              <tr>
                <th class="text-caption font-weight-bold">#</th>
                <th class="text-caption font-weight-bold">INÍCIO</th>
                <th class="text-caption font-weight-bold">FIM</th>
                <th class="text-caption font-weight-bold text-right">DURAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in detalhesParadaSelecionada" :key="`${item.inicio}-${index}`">
                <td class="text-caption">{{ index + 1 }}</td>
                <td class="text-caption">{{ item.inicio }}</td>
                <td class="text-caption" :class="{ 'text-error font-weight-bold': item.emAberto }">
                  {{ item.fim }}
                </td>
                <td class="text-caption text-right">{{ item.duracao }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="modalDetalhesParada = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { maquinario } from '../../stores/Consultas/getMaquinario';
import { prodPar } from '../../stores/Consultas/getProdPar';
import { motivoParada } from '../../stores/Consultas/getMotivoParada';
import { getSeqOpOP } from '../../stores/Consultas/getSeqOpOP';
import { getZ71Prod } from '../../stores/Consultas/getZ71Prod';

const route             = useRoute();
const router            = useRouter();
const maquinarioStore   = maquinario();
const prodParStore      = prodPar();
const motivoParadaStore = motivoParada();
const getSeqOpOPStore   = getSeqOpOP();
const getZ71ProdStore   = getZ71Prod();

const veioDoDashboard = computed(() => !!route.query.maq);

const TIPO_MAP = {
  '007': 'classificador',
  '008': 'classificador',
  '005': 'mesa',
  '006': 'mesa',
  '001': 'eletronica',
  '002': 'eletronica',
};

const maquinarios        = ref([]);
const selectedMaquinario = ref('');
const loading            = ref(false);
const loadingMaquinarios = ref(false);

const dadosParadas  = ref([]);
const guiaAnterior  = ref(null);
const guiaAtual     = ref(null);
const proximaGuia   = ref(null);
const motivosCache  = ref([]);
const autoRefreshTimer = ref(null);
const refreshProgress  = ref(0);
const lotesAgrupados   = ref([]);
const loadingLotes     = ref(false);
const paradasDetalhadas = ref([]);
const modalDetalhesParada = ref(false);
const paradaSelecionada = ref(null);
const visualizandoHistorico = ref(false);
const snapshotGuiaOriginal = ref(null);

const maquinarioTipo = computed(() => TIPO_MAP[selectedMaquinario.value] || 'eletronica');


// ─── Computed: Resumo de Paradas ────────────────────────────────────────────
const resumoParadas = computed(() => {
  if (!dadosParadas.value.length) return [];
  const totalMin = dadosParadas.value.reduce((s, p) => s + p.totalMin, 0);
  return [...dadosParadas.value]
    .sort((a, b) => a.totalMin - b.totalMin)
    .map(p => {
      const motivo = motivosCache.value.find(m => m.cod === p.cod);
      return {
        cod:         p.cod,
        descricao:   motivo ? motivo.descr : p.descricao,
        ocorrencias: p.ocorrencias,
        total:       `${(p.totalMin / 60).toFixed(2)}h`,
        percentual:  totalMin > 0 ? `${Math.round((p.totalMin / totalMin) * 100)}%` : '0%',
      };
    });
});

const totalParadaHoras = computed(() => {
  const total = dadosParadas.value.reduce((s, p) => s + p.totalMin, 0);
  return `${(total / 60).toFixed(2)}h`;
});

const refreshSecondsLeft = computed(() =>
  Math.max(0, 60 - Math.round(refreshProgress.value / 100 * 60))
);

const detalhesParadaSelecionada = computed(() => {
  if (!paradaSelecionada.value) return [];
  return paradasDetalhadas.value.filter(item => item.cod === paradaSelecionada.value.cod);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isoData(d) {
  // "20260525" → "2026-05-25"
  return d ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : '';
}

function calcularHoras(dataIni, horaIni, dataFim, horaFim) {
  if (!dataIni || !horaIni) return 0;
  try {
    const inicio = new Date(`${isoData(dataIni)}T${horaIni}:00`);
    const fim    = dataFim && horaFim
      ? new Date(`${isoData(dataFim)}T${horaFim}:00`)
      : new Date();
    return Math.max(0, (fim - inicio) / 3_600_000);
  } catch {
    return 0;
  }
}

function formatarDataHora(dataStr, hora) {
  if (!dataStr || !hora) return '-';
  return `${dataStr.slice(6, 8)}/${dataStr.slice(4, 6)}/${dataStr.slice(0, 4)} ${hora}`;
}

function adicionarHoras(dataStr, hora, horas) {
  if (!dataStr || !hora) return '-';
  try {
    const dt = new Date(`${isoData(dataStr)}T${hora}:00`);
    dt.setTime(dt.getTime() + horas * 3_600_000);
    const dia = String(dt.getDate()).padStart(2, '0');
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const ano = dt.getFullYear();
    const hh  = String(dt.getHours()).padStart(2, '0');
    const mm  = String(dt.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hh}:${mm}`;
  } catch {
    return '-';
  }
}

function normalizarOP(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function extrairItensSequencia(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.retorno)) return response.retorno;
  if (Array.isArray(response?.data)) return response.data;
  if (response?.retorno && typeof response.retorno === 'object') return [response.retorno];
  if (response?.data && typeof response.data === 'object') return [response.data];
  return [];
}

function encontrarItemOP(seqItems, opNumerico) {
  const porTipo = seqItems.find(i => String(i.tipo || '').trim().toUpperCase() === 'OP');
  if (porTipo) return porTipo;

  // Em produções sem guia, o serviço pode não marcar a linha atual como tipo "OP".
  return seqItems.find(i =>
    normalizarOP(i.op || i.OP || i.opTck || i.optck) === opNumerico
  );
}

function numero(valor) {
  const texto = String(valor ?? '').trim();
  const normalizado = texto.includes(',') && texto.includes('.')
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto.replace(',', '.');
  const convertido = Number(normalizado);
  return Number.isFinite(convertido) ? convertido : 0;
}

function dataAtualYYYYMMDD() {
  const hoje = new Date();
  return `${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}`;
}

function loteSemPrefixoOP(loteCompleto, opNumerico) {
  const lote = String(loteCompleto || '').trim();
  const indiceOP = lote.indexOf(opNumerico);
  if (indiceOP === -1) return lote;
  return lote.slice(indiceOP + opNumerico.length).replace(/^[-_\s]+/, '') || lote;
}

function formatarDuracao(horas) {
  const minutosTotais = Math.max(0, Math.round(horas * 60));
  const horasInteiras = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;
  return `${horasInteiras}h ${String(minutos).padStart(2, '0')}min`;
}

function abrirDetalhesParada(parada) {
  paradaSelecionada.value = parada;
  modalDetalhesParada.value = true;
}

function criarResumoParadas(movimentos) {
  const mapa = {};
  const detalhes = [];
  for (const m of movimentos) {
    const cod = m.parMotivo || m.parTipo || '---';
    if (!cod.startsWith('N')) continue;
    const duracaoHoras = calcularHoras(m.parDataIni, m.parHoraIni, m.parDataFim, m.parHoraFim);
    if (!mapa[cod]) mapa[cod] = { cod, descricao: cod, ocorrencias: 0, totalMin: 0 };
    mapa[cod].ocorrencias++;
    mapa[cod].totalMin += duracaoHoras * 60;
    detalhes.push({
      cod,
      inicio: formatarDataHora(m.parDataIni, m.parHoraIni),
      fim: m.parDataFim && m.parHoraFim ? formatarDataHora(m.parDataFim, m.parHoraFim) : 'Em andamento',
      duracao: formatarDuracao(duracaoHoras),
      emAberto: !m.parDataFim || !m.parHoraFim,
    });
  }
  return { resumo: Object.values(mapa), detalhes };
}

function salvarSnapshotOriginal() {
  snapshotGuiaOriginal.value = {
    guiaAnterior: guiaAnterior.value,
    guiaAtual: guiaAtual.value,
    proximaGuia: proximaGuia.value,
    dadosParadas: dadosParadas.value,
    paradasDetalhadas: paradasDetalhadas.value,
    lotesAgrupados: lotesAgrupados.value,
  };
}

async function abrirGuiaAnterior() {
  if (!guiaAnterior.value || visualizandoHistorico.value || loading.value) return;

  const anterior = guiaAnterior.value;
  const item = anterior.raw;
  const opNumerico = normalizarOP(item?.op || anterior.guia);
  if (!opNumerico) return;

  salvarSnapshotOriginal();
  visualizandoHistorico.value = true;
  clearInterval(autoRefreshTimer.value);
  refreshProgress.value = 0;
  loading.value = true;

  try {
    const maqCod = selectedMaquinario.value;
    const maqNome = maquinarios.value.find(m => m.id === maqCod)?.nome ?? '';
    const usuario = localStorage.getItem('user') ?? '';
    const dataIni = item?.dtini?.trim() || item?.dtprevini?.trim() || '';
    const dataFim = item?.dtfim?.trim() || item?.dtprevfim?.trim() || dataAtualYYYYMMDD();
    const response = await prodParStore.prodPar({ op: opNumerico, maqCod, dataIni, dataFim, usuario });
    const movimentos = (response?.listaMov ?? []).filter(m => normalizarOP(m.parOP || m.parOp) === opNumerico);
    const movPro = movimentos.filter(m => m.parTipo === 'PRO' || m.parTipo === 'PRF');
    const movPar = movimentos.filter(m => m.parTipo !== 'PRO' && m.parTipo !== 'PRF');
    const movParNaoPlanejada = movPar.filter(m => (m.parMotivo || '').startsWith('N'));
    const horasProd = movPro.reduce((s, m) => s + calcularHoras(m.parDataIni, m.parHoraIni, m.parDataFim, m.parHoraFim), 0);
    const horasPar = movParNaoPlanejada.reduce((s, m) => s + calcularHoras(m.parDataIni, m.parHoraIni, m.parDataFim, m.parHoraFim), 0);
    const totalH = horasProd + horasPar;
    const percProd = totalH ? horasProd / totalH * 100 : 0;
    const percPar = totalH ? horasPar / totalH * 100 : 0;
    const primeiroMov = movimentos.reduce((maisAntigo, m) => !maisAntigo || `${m.parDataIni}${m.parHoraIni}` < `${maisAntigo.parDataIni}${maisAntigo.parHoraIni}` ? m : maisAntigo, null);
    const ultimoPro = movPro[movPro.length - 1];
    const duracaoHoras = calcularHoras(dataIni, item?.hrini || item?.hrprevini, dataFim, item?.hrfim || item?.hrprevfim);

    guiaAnterior.value = null;
    guiaAtual.value = {
      status: 'FINALIZADA', setor: maqNome, guia: opNumerico,
      quantidade: item?.guiadg?.trim() || '-', sacas: item?.sacas?.trim() || '-',
      refer: item?.refer?.trim() || '-',
      inicio: formatarDataHora(primeiroMov?.parDataIni || dataIni, primeiroMov?.parHoraIni || item?.hrini || item?.hrprevini),
      previsaoTermino: formatarDataHora(dataFim, item?.hrfim || item?.hrprevfim),
      duracaoEst: formatarDuracao(duracaoHoras),
      peneira: ultimoPro?.parPeneira || '-', cate: ultimoPro?.parQtdVez ? `${ultimoPro.parQtdVez}°` : '-', desde: '-',
      horasProducao: `${horasProd.toFixed(2)}h`, percentProducao: `${percProd.toFixed(1)}%`, percentProducaoNum: percProd,
      horasParado: `${horasPar.toFixed(2)}h`, percentParado: `${percPar.toFixed(1)}%`, percentParadoNum: percPar,
      paradaMotivo: '', paradaDescricao: '',
    };
    proximaGuia.value = {
      guia: snapshotGuiaOriginal.value.guiaAtual.guia,
      guiadg: snapshotGuiaOriginal.value.guiaAtual.quantidade,
      previsaoInicio: snapshotGuiaOriginal.value.guiaAtual.inicio,
    };
    const resumo = criarResumoParadas(movPar);
    dadosParadas.value = resumo.resumo;
    paradasDetalhadas.value = resumo.detalhes;
    await carregarLotesDaOP(opNumerico);
  } catch (error) {
    console.error('[producao] Erro ao abrir guia anterior:', error);
    voltarGuiaOriginal();
  } finally {
    loading.value = false;
  }
}

function voltarGuiaOriginal() {
  if (!visualizandoHistorico.value || !snapshotGuiaOriginal.value) return;
  const original = snapshotGuiaOriginal.value;
  guiaAnterior.value = original.guiaAnterior;
  guiaAtual.value = original.guiaAtual;
  proximaGuia.value = original.proximaGuia;
  dadosParadas.value = original.dadosParadas;
  paradasDetalhadas.value = original.paradasDetalhadas;
  lotesAgrupados.value = original.lotesAgrupados;
  visualizandoHistorico.value = false;
  startAutoRefresh();
}

function extrairListaZ71(response) {
  if (Array.isArray(response)) return response.flat(Infinity).filter(item => item && typeof item === 'object');
  if (Array.isArray(response?.data)) return response.data.flat(Infinity).filter(item => item && typeof item === 'object');
  if (Array.isArray(response?.retorno)) return response.retorno.flat(Infinity).filter(item => item && typeof item === 'object');
  return [];
}

function agruparLotesZ71(response, opNumerico) {
  const agrupados = new Map();
  for (const item of extrairListaZ71(response)) {
    const lote = loteSemPrefixoOP(item.lote, opNumerico);
    if (!lote) continue;
    const sacas = numero(item.sacas) || (numero(item.peso) / 59);
    agrupados.set(lote, (agrupados.get(lote) || 0) + sacas);
  }
  return Array.from(agrupados, ([lote, sacas]) => ({ lote, sacas }))
    .sort((a, b) => a.lote.localeCompare(b.lote, 'pt-BR', { numeric: true }));
}

async function carregarLotesDaOP(opNumerico) {
  loadingLotes.value = true;
  lotesAgrupados.value = [];

  try {
    const response = await getZ71ProdStore.getZ71Prod({ opticket: opNumerico });
    lotesAgrupados.value = agruparLotesZ71(response, opNumerico);
  } catch (error) {
    console.error('[producao] Erro ao carregar lotes da OP:', error);
    lotesAgrupados.value = [];
  } finally {
    loadingLotes.value = false;
  }
}

// ─── Ações ───────────────────────────────────────────────────────────────────
const carregarMaquinarios = async () => {
  loadingMaquinarios.value = true;
  try {
    const response = await maquinarioStore.maquinario();
    if (Array.isArray(response)) {
      maquinarios.value = response.map((nome, index) => ({
        nome: nome.trim(),
        id: String(index + 1).padStart(3, '0'),
      }));
    }
  } catch (error) {
    console.error('Erro ao carregar maquinários:', error);
  } finally {
    loadingMaquinarios.value = false;
  }
};

const carregarDados = async () => {
  if (!selectedMaquinario.value) return;
  if (visualizandoHistorico.value) return;
  loading.value      = true;
  guiaAnterior.value = null;
  guiaAtual.value    = null;
  proximaGuia.value  = null;
  dadosParadas.value = [];
  lotesAgrupados.value = [];
  paradasDetalhadas.value = [];

  try {
    const maqCod  = selectedMaquinario.value;
    const maqNome = maquinarios.value.find(m => m.id === maqCod)?.nome ?? '';
    const usuario = localStorage.getItem('user') ?? '';

    // Data de hoje em YYYYMMDD
    const hojeStr = dataAtualYYYYMMDD();

    // 1. Movimentos de hoje para identificar a OP atual
    const respHoje     = await prodParStore.prodPar({ op: '', maqCod, dataIni: hojeStr, dataFim: hojeStr, usuario });
    const listaMovHoje = respHoje?.listaMov ?? [];
    console.log('[producao] listaMovHoje.length:', listaMovHoje.length);

    if (!listaMovHoje.length) return;

    const ultimoMov  = listaMovHoje.find(m => !m.parHoraFim) ?? listaMovHoje[0];
    console.log('[producao] ultimoMov completo:', ultimoMov);
    const opAtual    = (ultimoMov.parOP || ultimoMov.parOp || ultimoMov.parOp || '').trim();
    const opNumerico = normalizarOP(opAtual); // 'CA-071426' → '071426'
    console.log('[producao] opAtual:', opAtual, '| opNumerico:', opNumerico);

    if (!opNumerico) return;

    // Busca a produção realizada e agrupa os registros pelo lote da OP atual.
    await carregarLotesDaOP(opNumerico);

    // 2. Buscar sequência ANT / OP / POS
    const seqRaw = await getSeqOpOPStore.getSeqOpOP({
      op: opNumerico,
      reben: maquinarioTipo.value === 'classificador' ? 'Sim' : 'Nao',
    });
    console.log('[getseqopop] opNumerico:', opNumerico, '| resposta:', JSON.stringify(seqRaw));

    const seqItems = extrairItensSequencia(seqRaw);

    console.log('[getseqopop] seqItems:', seqItems.length, seqItems);

    const itemOP  = encontrarItemOP(seqItems, opNumerico);
    const itemANT = seqItems.find(i => i.tipo?.trim().toUpperCase() === 'ANT');
    const itemPOS = seqItems.find(i => i.tipo?.trim().toUpperCase() === 'POS');
    console.log('[getseqopop] itemOP:', itemOP, '| itemANT:', itemANT, '| itemPOS:', itemPOS);

    if (itemANT) {
      const fimExibir = itemANT.dtfim?.trim() && itemANT.hrfim?.trim()
        ? formatarDataHora(itemANT.dtfim.trim(), itemANT.hrfim.trim())
        : formatarDataHora(itemANT.dtprevfim, itemANT.hrprevfim);
      guiaAnterior.value = {
        guia:   itemANT.op,
        guiadg: itemANT.guiadg?.trim() ?? '',
        fim:    fimExibir,
        raw:    itemANT,
      };
    }

    if (itemPOS) {
      proximaGuia.value = {
        guia:           itemPOS.op,
        guiadg:         itemPOS.guiadg?.trim() ?? '',
        previsaoInicio: itemPOS.dtprevini && itemPOS.hrprevini
          ? formatarDataHora(itemPOS.dtprevini, itemPOS.hrprevini)
          : '-',
      };
    }

    // 3. Usa apenas os movimentos da OP atual para calcular as métricas
    const listaMov = listaMovHoje.filter(m =>
      normalizarOP(m.parOP || m.parOp) === opNumerico
    );

    if (!listaMov.length) return;

    const movPro = listaMov.filter(m => m.parTipo === 'PRO' || m.parTipo === 'PRF');
    const movPar = listaMov.filter(m => m.parTipo !== 'PRO' && m.parTipo !== 'PRF');
    const movParNaoPlanejada = movPar.filter(m => (m.parMotivo || '').startsWith('N'));

    const horasProd = movPro.reduce(
      (s, m) => s + calcularHoras(m.parDataIni, m.parHoraIni, m.parDataFim, m.parHoraFim), 0
    );
    const horasPar = movParNaoPlanejada.reduce(
      (s, m) => s + calcularHoras(m.parDataIni, m.parHoraIni, m.parDataFim, m.parHoraFim), 0
    );

    const totalH   = horasProd + horasPar;
    const percProd = totalH > 0 ? (horasProd / totalH) * 100 : 0;
    const percPar  = totalH > 0 ? (horasPar  / totalH) * 100 : 0;

    const movAberto  = listaMov.find(m => !m.parHoraFim);
    const lastMovPro = movPro[movPro.length - 1];
    const peneiraCod = movAberto?.parPeneira || lastMovPro?.parPeneira;
    const peneira    = peneiraCod ? `${peneiraCod}` : '-';
    const cate       = movAberto?.parQtdVez
      ? `${movAberto.parQtdVez}°`
      : '-';
    const desde      = movAberto?.parHoraIni ?? '-';

    const primeiroMov = listaMov.reduce((oldest, m) => {
      if (!oldest) return m;
      return (`${m.parDataIni}${m.parHoraIni}`) < (`${oldest.parDataIni}${oldest.parHoraIni}`) ? m : oldest;
    }, null);
    const primeiroMovPro = movPro.reduce((oldest, m) => {
      if (!oldest) return m;
      return (`${m.parDataIni}${m.parHoraIni}`) < (`${oldest.parDataIni}${oldest.parHoraIni}`) ? m : oldest;
    }, null);

    const movInicioGeral = maquinarioTipo.value === 'classificador'
      ? primeiroMovPro
      : primeiroMov;
    const inicio = formatarDataHora(movInicioGeral?.parDataIni, movInicioGeral?.parHoraIni);

    const eProd  = movAberto?.parTipo === 'PRO' || movAberto?.parTipo === 'PRF';
    const status = eProd ? 'PRODUZINDO' : movAberto ? 'PARADO' : 'FINALIZADA';

    const paradaMotivo = !eProd && movAberto ? (movAberto.parMotivo || '') : '';
    const paradaDescricao = paradaMotivo
      ? (motivosCache.value.find(m => m.cod === paradaMotivo)?.descr ?? paradaMotivo)
      : '';

    const horasClassificador = maquinarioTipo.value === 'classificador'
      ? numero(itemOP?.sacas) / 180
      : 0;

    const previsaoTermino = maquinarioTipo.value === 'classificador'
      ? adicionarHoras(primeiroMovPro?.parDataIni, primeiroMovPro?.parHoraIni, horasClassificador)
      : itemOP?.dtprevfim && itemOP?.hrprevfim
        ? formatarDataHora(itemOP.dtprevfim, itemOP.hrprevfim)
        : '-';

    let duracaoEst = '-';
    const dataIniDuracao = itemOP?.dtprevini?.trim() || itemOP?.dtini?.trim() || primeiroMov?.parDataIni;
    const horaIniDuracao = itemOP?.hrprevini?.trim() || itemOP?.hrini?.trim() || primeiroMov?.parHoraIni;
    if (itemOP?.dtprevfim && itemOP?.hrprevfim && dataIniDuracao && horaIniDuracao) {
      const totalEstH = calcularHoras(
        dataIniDuracao, horaIniDuracao,
        itemOP.dtprevfim, itemOP.hrprevfim
      );
      const h = Math.floor(totalEstH);
      const m = Math.round((totalEstH - h) * 60);
      duracaoEst = `${h}h${m > 0 ? ` ${m}min` : ''}`;
    }

    guiaAtual.value = {
      status,
      setor:              maqNome,
      guia:               opNumerico,
      quantidade:         itemOP?.guiadg?.trim() ?? '-',
      sacas:              itemOP?.sacas?.trim() ?? '-',
      refer:              itemOP?.refer?.trim() || '-',
      inicio,
      previsaoTermino,
      duracaoEst,
      peneira,
      cate,
      desde,
      horasProducao:      `${horasProd.toFixed(2)}h`,
      percentProducao:    `${percProd.toFixed(1)}%`,
      percentProducaoNum: percProd,
      horasParado:        `${horasPar.toFixed(2)}h`,
      percentParado:      `${percPar.toFixed(1)}%`,
      percentParadoNum:   percPar,
      paradaMotivo,
      paradaDescricao,
    };

    // 4. Resumo de paradas — agrupar por parMotivo (apenas códigos começando com N)
    const paradaMap = {};
    for (const m of movPar) {
      const cod = m.parMotivo || m.parTipo || '---';
      if (!cod.startsWith('N')) continue;
      const duracaoHoras = calcularHoras(m.parDataIni, m.parHoraIni, m.parDataFim, m.parHoraFim);
      if (!paradaMap[cod]) {
        paradaMap[cod] = { cod, descricao: cod, ocorrencias: 0, totalMin: 0 };
      }
      paradaMap[cod].ocorrencias++;
      paradaMap[cod].totalMin += duracaoHoras * 60;
      paradasDetalhadas.value.push({
        cod,
        inicio: formatarDataHora(m.parDataIni, m.parHoraIni),
        fim: m.parDataFim && m.parHoraFim
          ? formatarDataHora(m.parDataFim, m.parHoraFim)
          : 'Em andamento',
        duracao: formatarDuracao(duracaoHoras),
        emAberto: !m.parDataFim || !m.parHoraFim,
      });
    }
    dadosParadas.value = Object.values(paradaMap);
    salvarSnapshotOriginal();

  } catch (error) {
    console.error('Erro ao carregar dados de produção:', error);
  } finally {
    loading.value = false;
    startAutoRefresh();
  }
};

// ─── Auto-refresh ────────────────────────────────────────────────────
function startAutoRefresh() {
  clearInterval(autoRefreshTimer.value);
  refreshProgress.value = 0;
  if (!selectedMaquinario.value || visualizandoHistorico.value) return;
  let elapsed = 0;
  autoRefreshTimer.value = setInterval(() => {
    elapsed++;
    refreshProgress.value = Math.round((elapsed / 60) * 100);
    if (elapsed >= 60) {
      elapsed = 0;
      refreshProgress.value = 0;
      carregarDados();
    }
  }, 1_000);
}

onMounted(async () => {
  await carregarMaquinarios();
  try {
    const motivos = await motivoParadaStore.getMotivoParadaMaquinario('');
    if (Array.isArray(motivos)) motivosCache.value = motivos;
  } catch (e) {
    console.error('Erro ao carregar motivos de parada:', e);
  }
  // Pré-selecionar máquina vinda do dashboard (?maq=001)
  if (route.query.maq) {
    selectedMaquinario.value = route.query.maq;
    carregarDados();
  }
});

onUnmounted(() => {
  clearInterval(autoRefreshTimer.value);
});
</script>

<style scoped>
.page-wrap {
  width: 1400px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px !important;
}

.titulo-pagina {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2e7d32;
}

/* Labels de seção */
.label-meta {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #757575;
}

.label-green {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #388e3c;
}

.label-red {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #c62828;
}

/* Cards navegação (anterior / próxima) */
.guia-nav-card {
  background-color: #ffffff;
}

/* Card da guia atual */
.guia-atual-card {
  background-color: #90EE90 !important;
  border: 2px solid #1b5e20 !important;
  color: #1b5e20;
}
.guia-atual-card .label-green,
.guia-atual-card .label-meta,
.guia-atual-card .text-green-darken-4,
.guia-atual-card .text-green-darken-3,
.guia-atual-card .text-grey {
  color: #1b5e20 !important;
}
.guia-atual-card .peneira-box {
  background-color: rgba(27, 94, 32, 0.18);
  border-color: rgba(27, 94, 32, 0.3);
}
.guia-atual-card .horas-prod-box {
  background-color: rgba(27, 94, 32, 0.18);
  border-color: rgba(27, 94, 32, 0.3);
}
.guia-atual-card .horas-par-box {
  background-color: rgba(183, 28, 28, 0.18);
  border-color: rgba(183, 28, 28, 0.3);
}

/* Card da guia parada */
.guia-parado-card {
  background-color: #f96b69 !important;
  border: 2px solid #b71c1c !important;
  color: white;
}
.guia-parado-card .label-green,
.guia-parado-card .label-red,
.guia-parado-card .label-meta,
.guia-parado-card .text-green-darken-4,
.guia-parado-card .text-green-darken-3,
.guia-parado-card .text-red-darken-3,
.guia-parado-card .text-grey {
  color: white !important;
}
.guia-parado-card .peneira-box {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}
.guia-parado-card .horas-prod-box {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}
.guia-parado-card .horas-par-box {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Card de guia histórica finalizada */
.guia-hist-card {
  background-color: #f5f5f5 !important;
  border: 2px solid #bdbdbd !important;
}

/* Cards de navegação clicáveis */
.guia-nav-clickable {
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.guia-nav-clickable:hover {
  box-shadow: 0 2px 10px rgba(0,0,0,0.12) !important;
  border-color: #90a4ae !important;
}

/* Tamanho do texto da guia principal */
.text-guia {
  font-size: 1.6rem;
  line-height: 1.1;
}

/* Box de Peneira/Cate/Desde */
.peneira-box {
  background-color: #f1f8f1;
  border: 1px solid #c8e6c9;
}

/* Box de Horas em Produção */
.horas-prod-box {
  background-color: #f1f8f1;
  border: 1px solid #c8e6c9;
  height: 100%;
}

/* Box de Horas Parado */
.horas-par-box {
  background-color: #fff5f5;
  border: 1px solid #ffcdd2;
  height: 100%;
}

/* Box de sequência (ANT/POS) */
.seq-guia-box {
  background-color: #fafafa;
  border: 1px solid #e0e0e0;
  height: 100%;
}

/* Tabela de paradas */
.paradas-table thead th {
  background-color: #fafafa;
  white-space: nowrap;
}

.lotes-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #fafafa;
  white-space: nowrap;
}

.lotes-table-scroll {
  max-height: 270px;
  overflow-y: auto;
  border: 1px solid #eeeeee;
}

.lotes-table-scroll::-webkit-scrollbar {
  width: 7px;
}

.lotes-table-scroll::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background-color: #bdbdbd;
}

.lotes-table-scroll::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}

.totais-row td {
  border-top: 1px solid #e0e0e0;
}

.parada-clickable {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.parada-clickable:hover {
  background-color: #f5f5f5;
}

.detalhes-parada-table thead th {
  background-color: #fafafa;
  white-space: nowrap;
}
</style>
