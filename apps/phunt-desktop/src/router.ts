import WelcomePage from "./components/pages/Welcome.vue";
import SelectDestination from "./components/pages/SelectDestination.vue";
import { createMemoryHistory, createRouter } from "vue-router";

const routes = [
  { path: "/", component: WelcomePage },
  { path: "/select-destination", component: SelectDestination },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
