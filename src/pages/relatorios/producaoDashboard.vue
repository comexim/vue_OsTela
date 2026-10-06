<template>
  <v-container fluid class="page-wrap pa-0">
    <v-card class="w-100">
      <v-card-text class="pa-2">
        <div class="d-flex align-start ga-2">

        <!-- Grid de máquinas -->
        <v-row class="flex-grow-1 ma-0">
          <v-col
            v-for="maq in maquinas"
            :key="maq.cod"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="maq-card pa-2 rounded-lg"
              :class="cardClass(maq)"
              elevation="2"
              @click="abrirDetalhe(maq)"
              style="cursor: pointer"
            >
              <!-- Loading -->
              <div v-if="maq.loading" class="card-inner d-flex align-center justify-center ga-3">
                <v-progress-circular indeterminate color="grey" size="24"></v-progress-circular>
                <span class="text-caption text-grey">Carregando...</span>
              </div>

              <template v-else>
                <div class="card-inner d-flex flex-column">
                <!-- Cabeçalho: nome + status chip -->
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="text-body-1 font-weight-bold nome-setor">{{ maq.nome || maq.cod }}</div>
                  <!--<v-chip
                    :color="maq.status === 'PRODUZINDO' ? 'success' : maq.status === 'PARADO' ? 'error' : 'grey'"
                    size="x-small"
                    variant="flat"
                  >
                    <v-icon start size="x-small">mdi-circle</v-icon>
                    {{ maq.status || 'SEM DADOS' }}
                  </v-chip>-->
                  <div class="d-flex align-center ga-2">
                    <v-tooltip
                      v-if="alertaDaParada(maq)"
                      :text="`Parada há ${alertaDaParada(maq).minutosDecorridos} min; limite de ${alertaDaParada(maq).limiteMinutos} min`"
                    >
                      <template #activator="{ props }">
                        <v-icon
                          v-bind="props"
                          class="alerta-sino"
                          size="24"
                          aria-label="Parada acima do tempo limite"
                          @click.stop
                        >
                          mdi-bell-alert
                        </v-icon>
                      </template>
                    </v-tooltip>

                    <v-chip :color="maq.status === 'PRODUZINDO' ? 'sucess' : maq.status === 'PARADO' ? 'error' : 'grey'" size="x-small" variant="flat">
                      <v-icon start size="x-small">mdi-circle</v-icon>
                        {{ maq.status || 'SEM DADOS' }}
                    </v-chip>
                  </div>
                </div>

                <!-- Lote e Quantidade -->
                <div v-if="maq.guia && !maq.sistemaParado" class="d-flex align-center justify-center ga-2 my-1">
                  <div class="text-center">
                    <div class="label-field">LOTE</div>
                    <div class="text-h6 font-weight-bold text-green-darken-4">{{ maq.quantidade }}</div>
                  </div>
                  <div class="text-h6 font-weight-bold text-green-darken-4">–</div>
                  <div class="text-center">
                    <div class="label-field">QUANT.</div>
                    <div class="text-h6 font-weight-bold text-green-darken-4">{{ maq.sacas }}</div>
                  </div>
                </div>
                <div v-else-if="maq.sistemaParado" class="flex-grow-1 d-flex flex-column align-center justify-center">
                  <v-icon size="32" color="grey-lighten-1">mdi-power-sleep</v-icon>
                  <div class="text-caption font-weight-bold text-grey-darken-1 mt-1">Sistema parado</div>
                  <div class="text-caption text-grey">há {{ maq.tempoPar }}</div>
                </div>
                <div v-else-if="!maq.guia" class="flex-grow-1 d-flex align-center justify-center text-caption text-grey">Sem produção hoje</div>

                <!-- Início / Previsão Término -->
                <v-row dense class="mb-0" v-if="maq.guia && !maq.sistemaParado">
                  <v-col cols="6">
                    <div class="label-field">INÍCIO</div>
                    <div class="text-caption font-weight-bold">{{ maq.inicio }}</div>
                  </v-col>
                  <v-col cols="6">
                    <div class="label-field">PREV. TÉRMINO</div>
                    <div class="text-caption font-weight-bold">{{ maq.previsaoTermino }}</div>
                  </v-col>
                </v-row>

                <!-- Peneira / Cate / Desde / Motivo Parada -->
                <div v-if="maq.guia && !maq.sistemaParado" class="peneira-box pa-1 rounded-lg mb-1">
                  <div class="d-flex align-center ga-1" style="flex-wrap: nowrap">
                    <v-icon v-if="maq.status === 'PRODUZINDO'" size="18" color="success" class="mr-1">mdi-pulse</v-icon>
                    <div v-if="maq.tipo !== 'classificador' || maq.status === 'PARADO'" style="flex-shrink: 0">
                      <div class="label-field">PENEIRA</div>
                      <div class="text-caption font-weight-bold">{{ maq.peneira }}</div>
                    </div>
                    <div v-if="maq.tipo !== 'classificador' && maq.status !== 'PARADO'" style="flex-shrink: 0">
                      <div class="label-field">{{ maq.tipo === 'mesa' ? 'VENTO' : 'CATE' }}</div>
                      <div class="text-caption font-weight-bold">{{ maq.cate }}</div>
                    </div>
                    <div style="flex-shrink: 0">
                      <div class="label-field">DESDE</div>
                      <div class="text-caption font-weight-bold">{{ maq.desde }}</div>
                    </div>
                    <div v-if="maq.status === 'PARADO' && maq.paradaMotivo" style="margin-left: auto; text-align: right; min-width: 0">
                      <div class="label-field-red">MOTIVO PARADA</div>
                      <div class="text-caption font-weight-bold text-red-darken-3">{{ maq.paradaMotivo }} – {{ maq.paradaDescricao }}</div>
                    </div>
                  </div>
                </div>

                <!-- Horas Produção / Parado -->
                <v-row dense v-if="maq.guia && !maq.sistemaParado" class="mt-auto">
                  <v-col cols="6">
                    <div class="horas-prod-box pa-1 rounded">
                      <div class="label-field">H. PRODUÇÃO</div>
                      <div class="d-flex align-center ga-1">
                        <span class="text-caption font-weight-bold text-green-darken-4">{{ maq.horasProducao }}</span>
                        <span class="text-caption text-green-darken-3">{{ maq.percentProducao }}</span>
                      </div>
                      <v-progress-linear :model-value="maq.percentProducaoNum" color="success" height="3" rounded></v-progress-linear>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="horas-par-box pa-1 rounded">
                      <div class="label-field">H. PARADO</div>
                      <div class="d-flex align-center ga-1">
                        <span class="text-caption font-weight-bold text-red-darken-3">{{ maq.horasParado }}</span>
                        <span class="text-caption text-red-darken-2">{{ maq.percentParado }}</span>
                      </div>
                      <v-progress-linear :model-value="maq.percentParadoNum" color="error" height="3" rounded></v-progress-linear>
                    </div>
                  </v-col>
                </v-row>
                </div>
              </template>
            </v-card>
          </v-col>
        </v-row>

        <!-- Controles de atualização -->
        <div class="d-flex flex-column align-center ga-2 pt-1" style="min-width: 110px">
          <v-btn
            color="primary"
            @click="carregarTodos"
            :loading="loadingGlobal"
            prepend-icon="mdi-refresh"
            variant="elevated"
            size="small"
            block
          >
            Atualizar
          </v-btn>
          <div v-if="refreshProgress > 0" style="width: 100%">
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
        </div>

        </div><!-- fim d-flex -->
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { maquinario } from '../../stores/Consultas/getMaquinario';
import { prodPar } from '../../stores/Consultas/getProdPar';
import { getSeqOpOP } from '../../stores/Consultas/getSeqOpOP';
import { motivoParada } from '../../stores/Consultas/getMotivoParada';
import { REGRAS_ALERTA_PARADA } from '../../config/alertasParada';

const router            = useRouter();
const maquinarioStore   = maquinario();
const prodParStore      = prodPar();
const getSeqOpOPStore   = getSeqOpOP();
const motivoParadaStore = motivoParada();

const MAQUINAS_COD = ['007', '005', '001', '008', '006', '002'];

const TIPO_MAP = {
  '007': 'classificador',
  '008': 'classificador',
  '005': 'mesa',
  '006': 'mesa',
  '001': 'eletronica',
  '002': 'eletronica',
};

const maquinas = ref(MAQUINAS_COD.map(cod => ({
  cod,
  tipo:               TIPO_MAP[cod],
  nome:               '',
  status:             null,
  guia:               '',
  quantidade:         '',
  sacas:              '',
  loading:            true,
  inicio:             '-',
  previsaoTermino:    '-',
  duracaoEst:         '-',
  peneira:            '-',
  cate:               '-',
  desde:              '-',
  horasProducao:      '0.00h',
  percentProducao:    '0.0%',
  percentProducaoNum: 0,
  horasParado:        '0.00h',
  percentParado:      '0.0%',
  percentParadoNum:   0,
  paradaMotivo:       '',
  paradaDescricao:    '',
  paradaInicioMs:     null,
  sistemaParado:      false,
  tempoPar:           '',
})));

const motivosCache    = ref([]);
const loadingGlobal   = ref(false);
const refreshProgress = ref(0);
const agoraMs = ref(Date.now());
let autoTimer = null;

const refreshSecondsLeft = computed(() =>
  Math.max(0, 60 - Math.round(refreshProgress.value / 100 * 60))
);

// ─── Helpers ────────────────────────────────────────────────────────────────
function getHoje() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function isoData(d) {
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

function obterIniciarParadaMs(data, hora) {
  const dataTexto = String(data ?? '').trim();
  const horaTexto = String(hora ?? '').trim();

  if (!/^\d{8}$/.test(dataTexto)) return null;
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horaTexto)) return null;

  const horaCompleta = horaTexto.length === 5 ? `${horaTexto}:00` : horaTexto;

  const inicio = new Date(`${isoData(dataTexto)}T${horaCompleta}`);

  return Number.isNaN(inicio.getTime()) ? null : inicio.getTime();
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

  // Produções sem guia ainda podem trazer a OP atual, porém sem o tipo "OP".
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

function cardClass(maq) {
  if (maq.loading)                  return 'card-loading';
  if (maq.status === 'PRODUZINDO')  return 'card-prod';
  if (maq.status === 'PARADO')      return 'card-par';
  return 'card-vazio';
}

function alertaDaParada(maq) {
  if (
    maq.status !== 'PARADO' || !maq.paradaMotivo || maq.paradaInicioMs == null
  ) {
    return null;
  }

  const regra = REGRAS_ALERTA_PARADA.find(item => item.maquinas.includes(maq.cod));

  if (!regra) return null;

  const limiteMinutos = regra.limitesPorMotivo[maq.paradaMotivo];

  if (limiteMinutos == null) return null;

  const tempoDecorridoMs = agoraMs.value - maq.paradaInicioMs;

  const limiteMs = limiteMinutos * 60_000;

  if (tempoDecorridoMs <= limiteMs) return null;

  return { 
    limiteMinutos,
    minutosDecorridos: Math.floor(
      tempoDecorridoMs / 60_000
    ),
  };
}

// ─── Carregar nomes dos maquinários ─────────────────────────────────────────
async function carregarNomes() {
  try {
    const response = await maquinarioStore.maquinario();
    if (Array.isArray(response)) {
      const lista = response.map((nome, index) => ({
        nome: nome.trim(),
        id:   String(index + 1).padStart(3, '0'),
      }));
      maquinas.value.forEach(maq => {
        const found = lista.find(m => m.id === maq.cod);
        if (found) maq.nome = found.nome;
      });
    }
  } catch (e) {
    console.error('Erro ao carregar nomes de maquinários:', e);
  }
}

// ─── Carregar dados de uma máquina ──────────────────────────────────────────
async function carregarMaquina(maq) {
  maq.loading             = true;
  maq.status              = null;
  maq.guia                = '';
  maq.quantidade          = '';
  maq.sacas               = '';
  maq.inicio              = '-';
  maq.previsaoTermino     = '-';
  maq.duracaoEst          = '-';
  maq.peneira             = '-';
  maq.cate                = '-';
  maq.desde               = '-';
  maq.horasProducao       = '0.00h';
  maq.percentProducao     = '0.0%';
  maq.percentProducaoNum  = 0;
  maq.horasParado         = '0.00h';
  maq.percentParado       = '0.0%';
  maq.percentParadoNum    = 0;
  maq.paradaMotivo        = '';
  maq.paradaInicioMs      = null;
  maq.paradaDescricao     = '';
  maq.sistemaParado       = false;
  maq.tempoPar            = '';

  try {
    const hojeStr = getHoje();
    const usuario = localStorage.getItem('user') ?? '';

    const respHoje = await prodParStore.prodPar({
      op: '', maqCod: maq.cod, dataIni: hojeStr, dataFim: hojeStr, usuario,
    });
    const listaMovHoje = respHoje?.listaMov ?? [];
    if (!listaMovHoje.length) return;

    const movAberto = listaMovHoje.find(m => !m.parHoraFim);
    const eProd     = movAberto?.parTipo === 'PRO' || movAberto?.parTipo === 'PRF';
    maq.status      = eProd ? 'PRODUZINDO' : movAberto ? 'PARADO' : 'FINALIZADA';

    if (maq.status === 'PARADO' && movAberto) {
      const codigo = String(movAberto.parMotivo ?? '').trim().toUpperCase();

      maq.paradaMotivo = codigo;

      maq.paradaDescricao = motivosCache.value.find(m => m.cod === codigo)?.descr ?? codigo;

      maq.paradaInicioMs = obterIniciarParadaMs(movAberto.parDataIni, movAberto.parHoraIni);
    }

    const opFonte    = movAberto ?? listaMovHoje[0];
    const opAtual    = (opFonte?.parOP || opFonte?.parOp || '').trim();
    const opNumerico = normalizarOP(opAtual);
    if (!opNumerico) return;

    maq.guia = opNumerico;

    const listaMov = listaMovHoje.filter(m =>
      normalizarOP(m.parOP || m.parOp) === opNumerico
    );
    if (!listaMov.length) return;

    // Buscar sequência ANT / OP / POS
    const seqRaw = await getSeqOpOPStore.getSeqOpOP({
      op: opNumerico,
      reben: maq.tipo === 'classificador' ? 'Sim' : 'Nao',
    });
    const seqItems = extrairItensSequencia(seqRaw);

    const itemOP = encontrarItemOP(seqItems, opNumerico);

    if (itemOP) {
      maq.quantidade = itemOP.guiadg?.trim() ?? '';
      maq.sacas = itemOP.sacas?.trim() ?? '';
    }

    // Calcular horas produção / parado
    const movPro             = listaMov.filter(m => m.parTipo === 'PRO' || m.parTipo === 'PRF');
    const movPar             = listaMov.filter(m => m.parTipo !== 'PRO' && m.parTipo !== 'PRF');
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

    const lastMovPro = movPro[movPro.length - 1];
    const peneiraCod = maq.status === 'PARADO' ? lastMovPro?.parPeneira : movAberto?.parPeneira || lastMovPro?.parPeneira;
    maq.peneira = peneiraCod ? `${peneiraCod}` : '-';
    maq.cate    = movAberto?.parQtdVez ? `${movAberto.parQtdVez}°` : '-';
    maq.desde   = movAberto?.parHoraIni ?? '-';

    const primeiroMov = listaMov.reduce((oldest, m) => {
      if (!oldest) return m;
      return (`${m.parDataIni}${m.parHoraIni}`) < (`${oldest.parDataIni}${oldest.parHoraIni}`) ? m : oldest;
    }, null);
    const primeiroMovPro = movPro.reduce((oldest, m) => {
      if (!oldest) return m;
      return (`${m.parDataIni}${m.parHoraIni}`) < (`${oldest.parDataIni}${oldest.parHoraIni}`) ? m : oldest;
    }, null);

    const movInicioGeral = maq.tipo === 'classificador'
      ? primeiroMovPro
      : primeiroMov;
    maq.inicio = formatarDataHora(movInicioGeral?.parDataIni, movInicioGeral?.parHoraIni);

    const horasClassificador = maq.tipo === 'classificador'
      ? numero(itemOP?.sacas) / 180
      : 0;

    maq.previsaoTermino = maq.tipo === 'classificador'
      ? adicionarHoras(primeiroMovPro?.parDataIni, primeiroMovPro?.parHoraIni, horasClassificador)
      : itemOP?.dtprevfim && itemOP?.hrprevfim
        ? formatarDataHora(itemOP.dtprevfim, itemOP.hrprevfim)
        : '-';

    const dataIniDuracao = itemOP?.dtprevini?.trim() || itemOP?.dtini?.trim() || primeiroMov?.parDataIni;
    const horaIniDuracao = itemOP?.hrprevini?.trim() || itemOP?.hrini?.trim() || primeiroMov?.parHoraIni;
    if (itemOP?.dtprevfim && itemOP?.hrprevfim && dataIniDuracao && horaIniDuracao) {
      const totalEstH = calcularHoras(
        dataIniDuracao, horaIniDuracao,
        itemOP.dtprevfim, itemOP.hrprevfim
      );
      const h  = Math.floor(totalEstH);
      const mn = Math.round((totalEstH - h) * 60);
      maq.duracaoEst = `${h}h${mn > 0 ? ` ${mn}min` : ''}`;
    }

    maq.horasProducao       = `${horasProd.toFixed(2)}h`;
    maq.percentProducao     = `${percProd.toFixed(1)}%`;
    maq.percentProducaoNum  = percProd;
    maq.horasParado         = `${horasPar.toFixed(2)}h`;
    maq.percentParado       = `${percPar.toFixed(1)}%`;
    maq.percentParadoNum    = percPar;

    /*const paradaMotivoCod = !eProd && movAberto ? (movAberto.parMotivo || '') : '';
    maq.paradaMotivo      = paradaMotivoCod;
    maq.paradaDescricao   = paradaMotivoCod
      ? (motivosCache.value.find(m => m.cod === paradaMotivoCod)?.descr ?? paradaMotivoCod)
      : '';*/

  } catch (e) {
    console.error(`Erro ao carregar máquina ${maq.cod}:`, e);
  } finally {
    maq.loading = false;
  }
}

// ─── Carregar todas as máquinas ──────────────────────────────────────────────
async function carregarTodos() {
  clearInterval(autoTimer);
  refreshProgress.value = 0;
  loadingGlobal.value   = true;

  await carregarNomes();
  await Promise.all(maquinas.value.map(m => carregarMaquina(m)));

  loadingGlobal.value = false;
  startAutoRefresh();
}

// ─── Auto-refresh (60s) ──────────────────────────────────────────────────────
function startAutoRefresh() {
  clearInterval(autoTimer);
  refreshProgress.value = 0;
  let elapsed = 0;
  autoTimer = setInterval(() => {
    agoraMs.value = Date.now();
    elapsed++;
    refreshProgress.value = Math.round((elapsed / 60) * 100);
    if (elapsed >= 60) {
      elapsed = 0;
      refreshProgress.value = 0;
      carregarTodos();
    }
  }, 1_000);
}

// ─── Navegar para detalhe ────────────────────────────────────────────────────
function abrirDetalhe(maq) {
  router.push(`/relatorios/producao?maq=${maq.cod}`);
}

onMounted(async () => {
  try {
    const motivos = await motivoParadaStore.getMotivoParadaMaquinario('');
    if (Array.isArray(motivos)) motivosCache.value = motivos;
  } catch (e) {
    console.error('Erro ao carregar motivos de parada:', e);
  }
  carregarTodos();
});

onUnmounted(() => clearInterval(autoTimer));
</script>

<style scoped>
.page-wrap {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 16px !important;
}

.titulo-pagina {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2e7d32;
}

.label-field {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #757575;
}

.label-field-red {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #c62828;
}

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

.nome-setor {
  color: #1a237e;
}

/* Cards de status */
.maq-card {
  height: 255px;
  transition: box-shadow 0.15s, transform 0.1s;
  overflow: hidden;
}
.card-inner {
  height: 100%;
}
.maq-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
  transform: translateY(-2px);
}

.alerta-sino {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff8e1;
  color: #8a4b00 !important;
  box-shadow: 0 1px 5px rgba(80, 25, 0, 0.35);
  transform-origin: 50% 20%;
  animation: tocar-sino 5s ease-in-out infinite;
}

@keyframes tocar-sino {
  0%, 20%, 100% { transform: rotate(0deg); }
  4%, 12% { transform: rotate(-18deg); }
  8%, 16% { transform: rotate(18deg); }
}

@media (prefers-reduced-motion: reduce) {
  .alerta-sino { animation: none; }
}

.card-prod {
  background-color: #90EE90 !important;
  border-left: 5px solid #2e9238 !important;
  color: #1b5e20;
}
.card-prod .label-field,
.card-prod .label-field-red,
.card-prod .nome-setor,
.card-prod .text-green-darken-4,
.card-prod .text-green-darken-3,
.card-prod .text-grey,
.card-prod .text-grey-darken-1 {
  color: #1b5e20 !important;
}
.card-prod .peneira-box {
  background-color: rgba(27, 94, 32, 0.18);
  border-color: rgba(27, 94, 32, 0.3);
}
.card-prod .horas-prod-box {
  background-color: rgba(27, 94, 32, 0.18);
  border-color: rgba(27, 94, 32, 0.3);
}
.card-prod .horas-par-box {
  background-color: rgba(183, 28, 28, 0.18);
  border-color: rgba(183, 28, 28, 0.3);
}

.card-par {
  background-color: #f96b69 !important;
  border-left: 5px solid #b71c1c !important;
  color: white;
}
.card-par .label-field,
.card-par .label-field-red,
.card-par .nome-setor,
.card-par .text-red-darken-3,
.card-par .text-red-darken-2,
.card-par .text-green-darken-4,
.card-par .text-green-darken-3,
.card-par .text-grey,
.card-par .text-grey-darken-1 {
  color: white !important;
}
.card-par .peneira-box {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}
.card-par .horas-prod-box {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}
.card-par .horas-par-box {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.card-vazio {
  background-color: #f5f5f5 !important;
  border-left: 5px solid #9e9e9e !important;
}

.card-loading {
  background-color: #fafafa !important;
  border-left: 5px solid #e0e0e0 !important;
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
</style>
