<template>
  <v-container>
    <div class="d-flex flex-column justify-center align-center pt-15">
      <v-card class="pa-10" elevation="10" width="500">
        <div class="text-h5 text-center mb-4">Bem vindo!</div>
		<div class="text-h6 text-center mb-4">Faça o login:</div>
        <v-form @submit.prevent="onLogin">
          <v-row>
            <v-col>
              <v-text-field 
                label="Login" 
                variant="outlined" 
                v-model="login"
                required
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field 
                label="Senha" 
                variant="outlined" 
                v-model="senha" 
                type="password"
                required
              ></v-text-field>
            </v-col>
          </v-row>
          <v-card-actions class="justify-center">
            <v-btn type="submit" variant="tonal" color="blue-accent-4" prepend-icon="mdi-login">
              Entrar
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUsers } from '@/stores/Auth/AuthLogin';

const router = useRouter();
const login = ref('');
const senha = ref('');
const usersStore = useUsers();

async function onLogin() {
  try {
    const result = await usersStore.loginUser(login.value, senha.value);
    
    if (result.success) {
      console.log('Login realizado com sucesso!');
      // Redireciona para a tela de mapas
      router.push('/consultas/mapa');
    } else {
      console.error('Erro ao realizar login:', result.message);
      // Aqui você pode adicionar uma notificação de erro para o usuário
    }
  } catch (error) {
    console.error('Erro ao realizar login:', error);
  }
}
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
</style>
