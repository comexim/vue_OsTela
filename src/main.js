import { createApp } from 'vue'
import { createPinia } from 'pinia';
import './style.css'
import '@mdi/font/css/materialdesignicons.min.css';
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import router from './router'
import vuetify from './plugins/vuetify'

const pinia = createPinia();

createApp(App)
	.use(router)
	.use(pinia)
	.use(vuetify)
	.mount('#app')
