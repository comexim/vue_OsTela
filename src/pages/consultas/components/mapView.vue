<template>
  <div class="map-container">
    <!-- Container da Imagem do Mapa -->
    <div 
      class="image-container" 
      ref="imageContainer"
    >
      <v-img
        ref="galpaoImage"
        :src="galpaoImg"
        class="galpao-image"
        @load="onImageLoad"
      />
      
      <!-- Container dos Quadrados Sobrepostos -->
      <div 
        v-if="imageLoaded" 
        class="squares-container"
        :style="{ width: renderedWidth + 'px', height: renderedHeight + 'px' }"
      >
        <div
          v-for="item in enderColors"
          :key="item.cod"
          class="color-square"
          :style="getSquareStyle(item)"
          @click="handleSquareClick(item)"
          :title="`${item.cod}`"
        />
      </div>
    </div>

    <v-dialog
      v-model="showModal"
      max-width="100vw"
      persistent
    >
      <v-card>

        <v-card-text>
          <endereco-details
            v-if="selectedEndereco"
            :endereco-cod="selectedEndereco.cod"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue"
            text
            @click="closeModal"
            variant="tonal"
          >
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import GalpaoImg from '@/assets/Galpao.png';
import { ref, onMounted, nextTick, defineProps, defineEmits } from 'vue';
import { enderColor } from '../../../stores/Consultas/getEnderColor';
import { useMapSelection } from '../../../composables/useMapSelection';
import EnderecoDetails from '../models/enderecoDetals.vue';

// Props
const props = defineProps({
	title: {
		type: String,
		required: false
	},
	content: {
		type: String,
		required: false
	},
	selectionMode: {
		type: Boolean,
		default: false
	},
	selectionCallback: {
		type: Function,
		default: null
	},
  filteredEnderCods: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['endereco-selecionado']);

// Composable para seleção no mapa
const { mapSelectionState, selectAddress } = useMapSelection();

// Refs básicos
const imageContainer = ref(null);
const galpaoImage = ref(null);
const galpaoImg = GalpaoImg;

// Estado do mapa
const enderColorStore = enderColor();
const enderColors = ref([]);
const imageLoaded = ref(false);
const renderedWidth = ref(0);
const renderedHeight = ref(0);

//Modal
const showModal = ref(false);
const selectedEndereco = ref(null);

// Métodos principais
async function loadEnderColor() {
        const response = await enderColorStore.enderColor();
        console.log('Dados da API:', response);
        enderColors.value = response.map(item => ({
            cor: item.cor,
            x1: item.enderWebX1,
            x2: item.enderWebX2,
            y1: item.enderWebY1,
            y2: item.enderWebY2,
            cod: item.enderCod,
            tag: item.enderTag,
            status: item.enderStatus,
            sacas: item.enderSacas
        }));
}

function onImageLoad() {
  imageLoaded.value = true;
  nextTick(() => {
    if (galpaoImage.value && galpaoImage.value.$el) {
      const imgElement = galpaoImage.value.$el.querySelector('img');
      if (imgElement) {
        renderedWidth.value = imgElement.clientWidth;
        renderedHeight.value = imgElement.clientHeight;
        console.log('Dimensões da imagem:', renderedWidth.value, renderedHeight.value);
      }
    }
  });
}

function getSquareStyle(item) {
  if (!imageLoaded.value || !renderedWidth.value || !renderedHeight.value) {
    return {};
  }

  const x1 = parseInt(item.x1, 10);
  const x2 = parseInt(item.x2, 10);
  const y1 = parseInt(item.y1, 10);
  const y2 = parseInt(item.y2, 10);

  const scaleX = 1;
  const scaleY = 1;

  const scaledX1 = x1 * scaleX;
  const scaledX2 = x2 * scaleX;
  const scaledY1 = y1 * scaleY;
  const scaledY2 = y2 * scaleY;

  const width = Math.max(9, scaledX2 - scaledX1);
  const height = Math.max(9, scaledY2 - scaledY1);

  // Converter cor string para RGB
  let [r, g, b] = item.cor ? item.cor.split(",").map(Number) : [128, 128, 128];

  // Substituir a cor 128,0,255 por 0,0,139
  if (r === 128 && g === 0 && b === 255) {
    [r, g, b] = [0, 0, 255];
  }

  if (r === 255 && g === 0 && b === 127) {
    [r, g, b] = [160, 82, 45];
  }

  const isSelectionMode = mapSelectionState.isActive || props.selectionMode;

  const filtroAtivo = props.filteredEnderCods.length > 0 && props.filteredEnderCods.length < enderColors.value.length;
  const isFiltered = filtroAtivo && props.filteredEnderCods.includes(item.cod);

  return {
    left: `${x1 - 30}px`,
    top: `${y1 - 750}px`,
    width: `${width + 2}px`,
    height: `${height + 2}px`,
    backgroundColor: isFiltered ? '#000000' : `rgb(${r}, ${g}, ${b})`,
    border: "1px solid white",
    borderRadius: "2px",
    position: "absolute",
    opacity: isFiltered ? 1.0 : 0.7,
    cursor: isSelectionMode ? "crosshair" : "pointer",
    zIndex: isFiltered ? 10: 1,
  };
}

function handleSquareClick(item) {
  console.log('Quadrado clicado:', item);
  
  // Se há uma seleção ativa no estado global, usa ela
  if (mapSelectionState.isActive) {
    selectAddress(item.cod);
    return;
  }
  
  // Se está no modo de seleção via props, emite o evento ou chama o callback
  if (props.selectionMode) {
    if (props.selectionCallback) {
      props.selectionCallback(item.cod);
    } else {
      emit('endereco-selecionado', item.cod);
    }
    return;
  }
  
  selectedEndereco.value = item;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedEndereco.value = null;
}

onMounted(() => {
  loadEnderColor();
});

</script>

<style scoped>
/* Container principal do mapa */
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  margin-bottom: -2230px;
  padding-bottom: 0;
}

/* Container da imagem */
.image-container {
  position: relative;
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
  cursor: default;
  margin-bottom: 0;
  line-height: 0;
}

/* Imagem do galpão */
.galpao-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  display: block;
  margin: 0;
  padding: 0;
}

/* Container dos quadrados sobrepostos */
.squares-container {
  position: relative;
  top: 0;
  left: 0;
  pointer-events: none;
  transform: scaleX(0.98) scaleY(1.2);
  transform-origin: top;
  overflow: visible;
  margin-bottom: -100px;
  height: 0;
}

/* Estilo dos quadrados coloridos */
.color-square {
  opacity: 0.7;
  cursor: pointer;
  pointer-events: auto;
}

.color-square:hover {
  opacity: 0.9;
}

/* Responsividade */
@media (max-width: 768px) {
  .image-container {
    transform: scale(0.8);
    transform-origin: center top;
  }
}

@media (max-width: 480px) {
  .image-container {
    transform: scale(0.6);
    transform-origin: center top;
  }
}

/* Desktop/PC */
@media (min-width: 1200px) {
	.squares-container {
    margin-bottom: -100px;
  }
}

/* Animações suaves */
.color-square {
  transition: all 0.2s ease-in-out;
}

.galpao-image {
  transition: opacity 0.3s ease;
}

/* Estados especiais dos quadrados */
.color-square:active {
  transform: scale(0.95);
}
</style>