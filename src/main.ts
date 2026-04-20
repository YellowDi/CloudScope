import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createAppRouter } from './router';
import { useAccountsStore } from './store/accounts';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';
import './assets/index.css';
import 'vue-sonner/style.css';

const app = createApp(App);
const pinia = createPinia();
const router = createAppRouter(pinia);

app.use(pinia);

const authStore = useAuthStore(pinia);
const accountsStore = useAccountsStore(pinia);
const themeStore = useThemeStore(pinia);

authStore.restore();
accountsStore.restore();
themeStore.restore();

app.use(router);
app.mount('#app');
