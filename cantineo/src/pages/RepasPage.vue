<template>
  <q-page class="q-pa-md bg-grey-9 text-white">
    
    <div class="row items-center q-mb-md">
      <q-icon name="restaurant" size="2em" color="green-5" class="q-mr-sm" />
      <div class="text-h5 text-weight-bold text-green-5">Saisie des Repas</div>
    </div>

    <div v-if="dbError" class="q-mb-md text-negative text-center" style="padding: 10px; border: 2px solid red; border-radius: 8px;">
      <b>ERREUR SQL :</b> <br /> {{ dbError }}
    </div>

    <q-card bordered class="q-mb-md shadow-1 bg-grey-10 text-white">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-6">
          <q-input 
            v-model="dateRepas" 
            label="Date des repas" 
            type="date" 
            outlined 
            dense
            dark
            color="green-5"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input 
            v-model.number="prixApplique" 
            label="Prix unitaire à appliquer (€)" 
            type="number" 
            step="0.10"
            outlined 
            dense 
            suffix="€" 
            dark
            color="green-5"
          />
        </div>
      </q-card-section>
    </q-card>

    <div v-if="employesActifs.length > 0">
      <div class="text-subtitle1 text-weight-medium q-mb-sm text-green-5">
        Qui a mangé le {{ dateAffichee }} ?
        <span class="text-caption text-white">({{ selectedEmployes.length }} sélectionnés)</span>
      </div>

      <q-list bordered separator class="bg-grey-10 text-white shadow-2 rounded-borders">
        <q-item 
          v-for="employe in employesActifs" 
          :key="employe.id_employe" 
          tag="label" 
          v-ripple
          class="q-py-md"
        >
          <q-item-section avatar>
            <q-checkbox 
              v-model="selectedEmployes" 
              :val="employe.id_employe" 
              color="green-5" 
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-subtitle1 text-weight-bold">
              {{ employe.prenom || 'Prénom' }} {{ employe.nom || 'Nom' }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div v-else-if="!dbError && !loading" class="q-mt-xl text-center">
      <q-icon name="warning" size="3em" color="warning" />
      <p class="text-grey-4 text-h6 q-mt-md">Aucun employé actif trouvé.</p>
      <q-btn to="/employes" color="green-5" text-color="black" label="Ajouter des employés" class="q-mt-sm" />
    </div>
    
    <div v-if="loading" class="text-center q-mt-xl">
       <q-spinner-dots color="green-5" size="40px" />
       <p class="text-grey-4 q-mt-sm">Chargement de la base...</p>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]" v-if="employesActifs.length > 0">
      <q-btn 
        fab 
        icon="save" 
        color="green-5" 
        text-color="black"
        :label="selectedEmployes.length > 0 ? `Valider (${selectedEmployes.length})` : 'Valider (0)'" 
        @click="saveRepas" 
      />
    </q-page-sticky>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const employesActifs = ref([]);
const loading = ref(true);
const dbError = ref('');
const today = new Date().toISOString().split('T')[0];
const dateRepas = ref(today);
const prixApplique = ref(5.00);
const selectedEmployes = ref([]);

watch(dateRepas, () => {
  if (window.$db) {
    fetchRepasDuJour();
  }
});

const dateAffichee = computed(() => {
  if (!dateRepas.value) return '...';
  const parts = dateRepas.value.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
});

const fetchEmployesActifs = () => {
  const db = window.$db;
  if (!db) {
    dbError.value = "La base de données n'est pas connectée.";
    loading.value = false;
    return;
  }

  dbError.value = '';

  db.transaction(function (tx) {
    tx.executeSql('SELECT * FROM EMPLOYE WHERE est_actif = 1 ORDER BY nom ASC', [], function (tx, results) {
      let temp = [];
      for (let i = 0; i < results.rows.length; i++) {
        temp.push(results.rows.item(i));
      }
      employesActifs.value = temp;
      
      fetchRepasDuJour();
      
    }, function(tx, error) {
      dbError.value = "Erreur SELECT Employés : " + error.message;
      loading.value = false;
    });
  });
};

const fetchRepasDuJour = () => {
  const db = window.$db;
  if (!db || !dateRepas.value) return;

  db.transaction(function(tx) {
    tx.executeSql('SELECT id_employe FROM REPAS WHERE date_repas = ?', [dateRepas.value], function(tx, results) {
       let dejaMange = [];
       for (let i = 0; i < results.rows.length; i++) {
         dejaMange.push(results.rows.item(i).id_employe);
       }
       selectedEmployes.value = dejaMange;
       loading.value = false;
    });
  });
};

const saveRepas = () => {
  if (!dateRepas.value || !prixApplique.value || prixApplique.value <= 0) {
    alert("Date ou prix unitaire invalide.");
    return;
  }

  const db = window.$db;
  const idsToInsert = [...selectedEmployes.value]; 

  db.transaction(function(tx) {
    tx.executeSql('DELETE FROM REPAS WHERE date_repas = ?', [dateRepas.value]);

    idsToInsert.forEach(idEmp => {
      tx.executeSql(
        'INSERT INTO REPAS (date_repas, prix_applique, id_employe) VALUES (?, ?, ?)',
        [dateRepas.value, prixApplique.value, idEmp]
      );
    });
  }, function(error) {
    dbError.value = "Erreur critique d'écriture (INSERT/DELETE REPAS) : " + error.message;
    alert("Impossible d'enregistrer les repas : " + error.message);
  }, function() {
    alert(`Modifications de repas enregistrées avec succès pour le ${dateAffichee.value} !`);
  });
};

onMounted(() => {
  if (window.$db) {
    fetchEmployesActifs();
  } else {
    window.addEventListener('db-ready', () => {
      fetchEmployesActifs();
    });

  }
});
</script>