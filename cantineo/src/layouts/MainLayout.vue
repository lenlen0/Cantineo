<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-9">
    <q-header elevated class="bg-grey-10 text-green-5">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="text-weight-bold">
          Cantineo
        </q-toolbar-title>
        <q-btn
          flat dense round
          icon="logout"
          color="red-4"
          aria-label="Déconnexion"
          @click="deconnexion"
        >
          <q-tooltip>Déconnexion</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-9 text-white">
      <q-list>
        <q-item-label header class="text-green-5 text-weight-bolder uppercase">Menu Principal</q-item-label>
        
        <q-item clickable v-ripple exact to="/repas">
          <q-item-section avatar>
            <q-icon name="restaurant" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Saisie des Repas</q-item-label>
            <q-item-label caption>Enregistrer les repas du jour</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple exact to="/employes">
          <q-item-section avatar>
            <q-icon name="groups" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Gestion Employés</q-item-label>
            <q-item-label caption>Ajouter, modifier, suspendre</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple exact to="/paiements">
          <q-item-section avatar>
            <q-icon name="payments" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Soldes & Paiements</q-item-label>
            <q-item-label caption>Voir les dettes et encaisser</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple exact to="/admin">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Administration</q-item-label>
            <q-item-label caption>Paramètres et configuration</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator dark class="q-mt-sm" />

        <q-item clickable v-ripple @click="deconnexion" class="text-red-4 q-mt-sm">
          <q-item-section avatar>
            <q-icon name="logout" color="red-4" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Déconnexion</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const leftDrawerOpen = ref(false)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const deconnexion = () => {
  router.push('/')
}
</script>