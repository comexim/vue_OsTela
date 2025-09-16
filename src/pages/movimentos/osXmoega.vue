<template>
  <BasePage>
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 mb-4">OS x Moega</h2>
        </v-col>
      </v-row>

    <!-- Lista de Moegas -->
    <v-row>
      <v-col cols="12">
        <h3 class="text-h6 mb-3">Selecione uma Moega:</h3>
        <v-row v-if="moegasList && moegasList.length > 0">
          <v-col 
            v-for="moega in moegasList" 
            :key="moega.enderCod"
            cols="12" 
            sm="6" 
            md="4" 
            lg="3"
          >
            <v-card
              :color="selectedMoega === moega.enderCod ? 'primary' : 'white'"
              :elevation="selectedMoega === moega.enderCod ? 8 : 2"
              class="moega-card"
              hover
              @click="selectMoega(moega.enderCod)"
            >
              <v-card-title class="text-center">
                <v-icon 
                  :color="selectedMoega === moega.enderCod ? 'white' : 'primary'" 
                  class="mr-2"
                >
                  mdi-warehouse
                </v-icon>
                <span :class="selectedMoega === moega.enderCod ? 'text-white' : 'text-primary'">
                  {{ moega.enderCod }}
                </span>
              </v-card-title>
              <v-card-text class="text-center">
                <span :class="selectedMoega === moega.enderCod ? 'text-white' : 'text-grey-darken-1'">
                  {{ moega.descricao || 'Moega' }}
                </span>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Loading de moegas -->
        <v-row v-else-if="loadingMoegas">
          <v-col cols="12" class="text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Carregando moegas...</p>
          </v-col>
        </v-row>

        <!-- Nenhuma moega encontrada -->
        <v-row v-else>
          <v-col cols="12" class="text-center">
            <v-alert type="info" variant="tonal">
              Nenhuma moega encontrada
            </v-alert>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Modal de Detalhes da OS -->
    <v-dialog v-model="showOSDialog" max-width="800px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          <v-icon class="mr-2">mdi-file-document-outline</v-icon>
          Gerenciar OSs - Moega: {{ selectedMoega }}
        </v-card-title>

        <v-card-text class="pa-4">
          <div v-if="loadingOS" class="text-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Carregando dados da OS...</p>
          </div>

          <div v-else>
            <!-- Seção para adicionar nova OS -->
            <v-row class="mb-4">
              <v-col cols="12">
                <v-card variant="outlined" class="pa-3 bg-blue-lighten-5">
                  <v-card-title class="text-h6 pb-2">
                    <v-icon class="mr-2">mdi-plus-circle</v-icon>
                    Adicionar Nova OS
                  </v-card-title>
                  <v-row align="center">
                    <v-col cols="8">
                      <v-text-field
                        v-model="newOsInput"
                        label="Número da OS"
                        variant="outlined"
                        density="compact"
                        placeholder="Ex: 066459"
                        @keyup.enter="addNewOs"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="4">
                      <v-btn
                        color="primary"
                        @click="addNewOs"
                        :disabled="!newOsInput || newOsInput.trim() === ''"
                        block
                      >
                        <v-icon class="mr-1">mdi-plus</v-icon>
                        Adicionar
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card>
              </v-col>
            </v-row>

            <!-- Lista de OSs Editáveis -->
            <v-row>
              <v-col cols="12">
                <v-card variant="outlined" class="pa-3">
                  <v-card-title class="text-h6 pb-2">
                    <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
                    OSs da Moega ({{ editableOsList.length }})
                  </v-card-title>
                  
                  <div v-if="editableOsList.length > 0">
                    <v-chip-group column>
                      <v-chip
                        v-for="osId in editableOsList"
                        :key="`os-${osId}`"
                        color="primary"
                        variant="elevated"
                        closable
                        @click:close="removeOs(osId)"
                        size="large"
                      >
                        <v-icon class="mr-1">mdi-clipboard-text</v-icon>
                        OS: {{ osId }}
                      </v-chip>
                    </v-chip-group>
                  </div>

                  <div v-else class="text-center py-4">
                    <v-alert type="info" variant="tonal">
                      <v-icon class="mr-2">mdi-information</v-icon>
                      Nenhuma OS encontrada para esta moega
                    </v-alert>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          
          <v-btn 
            color="grey" 
            variant="text" 
            @click="closeOSDialog"
            :disabled="savingChanges"
          >
            Cancelar
          </v-btn>
          
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveChanges"
            :loading="savingChanges"
            :disabled="loadingOS"
          >
            <v-icon class="mr-1">mdi-content-save</v-icon>
            Salvar Alterações
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para mensagens -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
    </v-container>
  </BasePage>
</template>

<script>
import { ref, onMounted } from 'vue'
import { moegas } from '@/stores/Consultas/getMoega'
import { osMoega } from '@/stores/Consultas/getOSMoega'
import { setOsMoega } from '@/stores/Consultas/setOSMoega'
import BasePage from '@/components/BasePage.vue'

export default {
  name: 'OsXmoega',
  components: {
    BasePage
  },
  setup() {
    // Stores
    const moegasStore = moegas()
    const osMoegaStore = osMoega()
    const setOsMoegaStore = setOsMoega()

    // Reactive data
    const moegasList = ref([])
    const selectedMoega = ref(null)
    const osData = ref([])
    const editableOsList = ref([])
    const newOsInput = ref('')
    const loadingMoegas = ref(false)
    const loadingOS = ref(false)
    const savingChanges = ref(false)
    const showOSDialog = ref(false)
    const showSnackbar = ref(false)
    const snackbarMessage = ref('')
    const snackbarColor = ref('success')

    // Methods
    const loadMoegas = async () => {
      try {
        loadingMoegas.value = true
        const response = await moegasStore.moegas()
        
        if (response && Array.isArray(response)) {
          moegasList.value = response
        } else if (response && response.data && Array.isArray(response.data)) {
          moegasList.value = response.data
        } else {
          moegasList.value = []
          showMessage('Nenhuma moega encontrada', 'warning')
        }
      } catch (error) {
        console.error('Erro ao carregar moegas:', error)
        showMessage('Erro ao carregar moegas', 'error')
        moegasList.value = []
      } finally {
        loadingMoegas.value = false
      }
    }

    const selectMoega = async (moegaId) => {
      try {
        selectedMoega.value = moegaId
        loadingOS.value = true
        showOSDialog.value = true

        // Chama a API getOSMoega passando a moega como parâmetro
        const response = await osMoegaStore.movEnder({ moega: moegaId })
        
        if (response && Array.isArray(response)) {
          osData.value = response
          // Cria array editável com apenas os osids
          editableOsList.value = response.map(item => item.osid).filter(Boolean)
        } else if (response && response.data && Array.isArray(response.data)) {
          osData.value = response.data
          editableOsList.value = response.data.map(item => item.osid).filter(Boolean)
        } else if (response && response.success === false) {
          osData.value = []
          editableOsList.value = []
          showMessage(response.message || 'Erro ao buscar dados da OS', 'error')
        } else {
          osData.value = []
          editableOsList.value = []
          showMessage('Nenhuma OS encontrada para esta moega', 'info')
        }
      } catch (error) {
        console.error('Erro ao buscar OS da moega:', error)
        showMessage('Erro ao buscar dados da OS', 'error')
        osData.value = []
        editableOsList.value = []
      } finally {
        loadingOS.value = false
      }
    }

    const addNewOs = () => {
      if (newOsInput.value && newOsInput.value.trim() !== '') {
        const osId = newOsInput.value.trim()
        
        // Validação básica do formato da OS (apenas números)
        if (!/^\d+$/.test(osId)) {
          showMessage('Número da OS deve conter apenas números', 'warning')
          return
        }
        
        if (!editableOsList.value.includes(osId)) {
          editableOsList.value.push(osId)
          newOsInput.value = ''
          showMessage('OS adicionada com sucesso', 'success')
        } else {
          showMessage('Esta OS já está na lista', 'warning')
        }
      } else {
        showMessage('Digite um número de OS válido', 'warning')
      }
    }

    const removeOs = (osId) => {
      console.log('Removendo OS:', osId)
      console.log('Lista antes:', [...editableOsList.value])
      
      editableOsList.value = editableOsList.value.filter(id => id !== osId)
      
      console.log('Lista depois:', [...editableOsList.value])
      showMessage('OS removida com sucesso', 'success')
    }

    const saveChanges = async () => {
      try {
        savingChanges.value = true
        
        const payload = {
          moega: selectedMoega.value,
          listOs: editableOsList.value
        }

        console.log('Enviando payload:', payload)
        const response = await setOsMoegaStore.setOsMoega(payload)
        
        if (response && response.success !== false) {
          showMessage('Alterações salvas com sucesso', 'success')
          // Atualiza os dados originais
          osData.value = editableOsList.value.map(osId => ({ osid: osId }))
        } else {
          showMessage(response?.message || 'Erro ao salvar alterações', 'error')
        }
      } catch (error) {
        console.error('Erro ao salvar alterações:', error)
        showMessage('Erro ao salvar alterações', 'error')
      } finally {
        savingChanges.value = false
      }
    }

    const closeOSDialog = () => {
      showOSDialog.value = false
      selectedMoega.value = null
      osData.value = []
      editableOsList.value = []
      newOsInput.value = ''
    }

    const showMessage = (message, color = 'success') => {
      snackbarMessage.value = message
      snackbarColor.value = color
      showSnackbar.value = true
    }

    // Lifecycle
    onMounted(() => {
      loadMoegas()
    })

    return {
      // Data
      moegasList,
      selectedMoega,
      osData,
      editableOsList,
      newOsInput,
      loadingMoegas,
      loadingOS,
      savingChanges,
      showOSDialog,
      showSnackbar,
      snackbarMessage,
      snackbarColor,
      
      // Methods
      selectMoega,
      closeOSDialog,
      addNewOs,
      removeOs,
      saveChanges
    }
  }
}
</script>

<style scoped>
.moega-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.moega-card:hover {
  transform: translateY(-2px);
}

.v-card-title {
  word-break: break-word;
}
</style>
