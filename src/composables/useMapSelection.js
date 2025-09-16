import { ref, reactive } from 'vue'

// Estado global para a seleção do mapa
const mapSelectionState = reactive({
  isActive: false,
  type: null,
  callback: null
})

export function useMapSelection() {
  
  const activateSelection = (type, callback) => {
    mapSelectionState.isActive = true
    mapSelectionState.type = type
    mapSelectionState.callback = callback
  }
  
  const deactivateSelection = () => {
    mapSelectionState.isActive = false
    mapSelectionState.type = null
    mapSelectionState.callback = null
  }
  
  const selectAddress = (enderCod) => {
    if (mapSelectionState.isActive && mapSelectionState.callback) {
      mapSelectionState.callback(enderCod)
      deactivateSelection()
    }
  }
  
  return {
    mapSelectionState,
    activateSelection,
    deactivateSelection,
    selectAddress
  }
}
