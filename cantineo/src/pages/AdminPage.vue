<template>
  <q-page class="bg-grey-10 q-pa-md text-white">
    <div style="max-width: 700px; margin: 0 auto;">

      <div class="text-center q-mb-lg q-mt-sm">
        <q-icon name="admin_panel_settings" color="green-5" size="40px" />
        <div class="text-h5 text-weight-bold q-mt-xs">Administration</div>
      </div>

      <q-card flat class="bg-grey-9 q-mb-lg rounded-borders">
        <q-card-section class="q-pb-sm">
          <div class="text-subtitle1 text-green-5 text-weight-bold">
            <q-icon name="manage_accounts" size="20px" class="q-mr-xs" />
            Gestion des gestionnaires
          </div>
        </q-card-section>

        <q-separator color="grey-8" />

        <q-card-section>
          <q-form @submit.prevent="ajouterGestionnaire" class="q-gutter-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-5">
                <q-input
                  v-model="newLogin"
                  label="Login"
                  dark filled dense
                  color="green-5"
                  label-color="grey-5"
                  bg-color="grey-8"
                  :rules="[v => !!v || 'Requis']"
                >
                  <template #prepend>
                    <q-icon name="person" color="grey-5" size="18px" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-5">
                <q-input
                  v-model="newPassword"
                  label="Mot de passe"
                  :type="showNewPwd ? 'text' : 'password'"
                  dark filled dense
                  color="green-5"
                  label-color="grey-5"
                  bg-color="grey-8"
                  :rules="[v => !!v || 'Requis', v => v.length >= 4 || 'Min. 4 caractères']"
                >
                  <template #prepend>
                    <q-icon name="lock" color="grey-5" size="18px" />
                  </template>
                  <template #append>
                    <q-icon
                      :name="showNewPwd ? 'visibility_off' : 'visibility'"
                      color="grey-6" size="18px" class="cursor-pointer"
                      @click="showNewPwd = !showNewPwd"
                    />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-2 flex items-center">
                <q-btn
                  type="submit"
                  icon="person_add"
                  color="green-5"
                  text-color="black"
                  unelevated dense
                  class="full-width"
                  :loading="loadingAjout"
                  label="Ajouter"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-separator color="grey-8" />

        <q-card-section class="q-pt-sm">
          <div v-if="loadingListe" class="text-center q-py-md">
            <q-spinner color="green-5" size="30px" />
          </div>
          <div v-else-if="gestionnaires.length === 0" class="text-grey-6 text-center q-py-md">
            <q-icon name="info" size="20px" class="q-mr-xs" />
            Aucun gestionnaire enregistré
          </div>
          <q-list v-else separator>
            <q-item
              v-for="g in gestionnaires"
              :key="g.id_gest"
              class="q-px-none"
            >
              <q-item-section avatar>
                <q-avatar color="green-9" text-color="green-3" size="36px" font-size="14px">
                  {{ g.login.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-white text-weight-medium">{{ g.login }}</q-item-label>
                <q-item-label caption class="text-grey-6">Mot de passe : ••••••••</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  icon="delete"
                  flat round dense
                  color="red-4"
                  @click="confirmerSuppression(g)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <q-card flat class="bg-grey-9 rounded-borders">
        <q-card-section class="q-pb-sm">
          <div class="text-subtitle1 text-green-5 text-weight-bold">
            <q-icon name="storage" size="20px" class="q-mr-xs" />
            Base de données
          </div>
        </q-card-section>
        <q-separator color="grey-8" />
        <q-card-section>
          <q-btn
            label="Exporter la base de données"
            color="green-5"
            text-color="black"
            icon="download"
            unelevated
            @click="exporterBDD"
          />
        </q-card-section>
      </q-card>

    </div>

    <q-dialog v-model="dialogSuppr" persistent>
      <q-card dark class="bg-grey-9 text-white" style="min-width: 300px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-red-4">
            <q-icon name="warning" class="q-mr-xs" />Confirmation
          </div>
        </q-card-section>
        <q-card-section>
          Supprimer le gestionnaire <strong class="text-green-5">{{ gestToDelete?.login }}</strong> ?
          <br><span class="text-grey-5 text-caption">Cette action est irréversible.</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="grey-4" v-close-popup />
          <q-btn
            unelevated label="Supprimer"
            color="red-5" text-color="white"
            :loading="loadingSuppr"
            @click="supprimerGestionnaire"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import {
  createGestionnaire,
  deleteGestionnaire,
  getGestionnaires,
  ensureGestionnaireTable
} from 'src/composables/useAuth.js'

const $q = useQuasar()


const newLogin    = ref('')
const newPassword = ref('')
const showNewPwd  = ref(false)
const loadingAjout = ref(false)

const gestionnaires = ref([])
const loadingListe  = ref(true)

const dialogSuppr  = ref(false)
const gestToDelete = ref(null)
const loadingSuppr = ref(false)
function getDb() {
  return new Promise((resolve) => {
    if (window.$db) return resolve(window.$db)
    window.addEventListener('db-ready', () => resolve(window.$db), { once: true })
  })
}

onMounted(async () => {
  try {
    const db = await getDb()
    await ensureGestionnaireTable(db)
    await chargerGestionnaires(db)
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Erreur base de données : ' + e.message })
  } finally {
    loadingListe.value = false
  }
})

async function chargerGestionnaires(db) {
  const db_ = db || await getDb()
  gestionnaires.value = await getGestionnaires(db_)
}

async function ajouterGestionnaire() {
  loadingAjout.value = true
  try {
    const db = await getDb()
    await createGestionnaire(db, newLogin.value.trim(), newPassword.value)
    $q.notify({ type: 'positive', message: `Gestionnaire "${newLogin.value}" créé avec succès.` })
    newLogin.value    = ''
    newPassword.value = ''
    await chargerGestionnaires(db)
  } catch (e) {
    const msg = (e.message || '').includes('UNIQUE')
      ? `Le login "${newLogin.value}" est déjà utilisé.`
      : 'Erreur lors de la création : ' + (e.message || e)
    $q.notify({ type: 'negative', message: msg })
  } finally {
    loadingAjout.value = false
  }
}

function confirmerSuppression(g) {
  gestToDelete.value = g
  dialogSuppr.value  = true
}

async function supprimerGestionnaire() {
  loadingSuppr.value = true
  try {
    const db = await getDb()
    await deleteGestionnaire(db, gestToDelete.value.id_gest)
    $q.notify({ type: 'positive', message: `Gestionnaire "${gestToDelete.value.login}" supprimé.` })
    dialogSuppr.value = false
    await chargerGestionnaires(db)
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Erreur suppression : ' + (e.message || e) })
  } finally {
    loadingSuppr.value = false
  }
}

function exporterBDD() {
  $q.notify({ type: 'info', message: 'Export non implémenté sur cet environnement.' })
}
</script>
