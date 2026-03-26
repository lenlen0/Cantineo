<template>
  <q-page class="bg-grey-10 flex flex-center" style="min-height: 100vh;">
    <div style="width: 100%; max-width: 360px; padding: 24px;">

      <div class="text-center q-mb-lg">
        <q-icon name="restaurant" color="green-5" size="48px" />
        <div class="text-h5 text-white text-weight-bold q-mt-sm">Cantineo</div>
      </div>

      <q-form @submit.prevent="handleLogin">
        <q-input
          v-model="username"
          label="Utilisateur"
          dark filled dense
          color="green-5"
          label-color="grey-5"
          bg-color="grey-9"
          class="q-mb-md"
        >
          <template #prepend>
            <q-icon name="person" color="grey-5" size="20px" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Mot de passe"
          :type="showPwd ? 'text' : 'password'"
          dark filled dense
          color="green-5"
          label-color="grey-5"
          bg-color="grey-9"
          class="q-mb-lg"
        >
          <template #prepend>
            <q-icon name="lock" color="grey-5" size="20px" />
          </template>
          <template #append>
            <q-icon
              :name="showPwd ? 'visibility_off' : 'visibility'"
              color="grey-6"
              size="20px"
              class="cursor-pointer"
              @click="showPwd = !showPwd"
            />
          </template>
        </q-input>

        <q-btn
          type="submit"
          label="Connexion"
          color="green-5"
          text-color="black"
          class="full-width"
          unelevated
          :loading="loading"
        />
      </q-form>

    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { loginGestionnaire } from 'src/composables/useAuth.js'

const router   = useRouter()
const $q       = useQuasar()
const username = ref('')
const password = ref('')
const showPwd  = ref(false)
const loading  = ref(false)

function getDb() {
  return new Promise((resolve) => {
    if (window.$db) return resolve(window.$db)
    window.addEventListener('db-ready', () => resolve(window.$db), { once: true })
  })
}

const handleLogin = async () => {
  loading.value = true
  try {
    const db   = await getDb()
    const gest = await loginGestionnaire(db, username.value.trim(), password.value)
    if (gest) {
      router.push('/repas')
    } else {
      $q.notify({ type: 'negative', message: 'Login ou mot de passe incorrect.' })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Erreur de connexion : ' + (e.message || e) })
  } finally {
    loading.value = false
  }
}
</script>
