<template>
  <q-page class="flex flex-center column q-pa-md bg-grey-9 text-white">
    
    <div v-if="dbError" class="q-mt-lg text-negative text-h6 text-center" style="max-width: 500px; padding: 10px; border: 2px solid red; border-radius: 8px;">
      ERREUR BDD : <br /> {{ dbError }}
    </div>

    <div v-if="employes.length > 0" class="q-mt-md" style="width: 100%; max-width: 600px">
      <h6 class="text-center q-my-sm text-green-5">Effectifs Cantineo ({{ activeCount }} / {{ employes.length }} actifs)</h6>
      
      <q-list bordered separator class="bg-grey-10 text-white shadow-2 rounded-borders">
        <q-item v-for="employe in employes" :key="employe.id_employe" class="q-py-md">
          
          <q-item-section avatar>
            <q-avatar :color="employe.est_actif ? 'green-5' : 'grey-7'" :text-color="employe.est_actif ? 'black' : 'white'">
              {{ (employe.prenom || '?').toString().charAt(0).toUpperCase() }}
            </q-avatar>
          </q-item-section>
          
          <q-item-section>
            <q-item-label class="text-weight-bold text-subtitle1" :class="!employe.est_actif ? 'text-strike text-grey-5' : ''">
              {{ employe.prenom || 'Prénom' }} {{ employe.nom || 'Nom' }}
            </q-item-label>
            <q-item-label caption v-if="!employe.est_actif">
              Profil inactif
            </q-item-label>
          </q-item-section>
          
          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn flat round dense color="green-5" icon="edit" @click="openEditDialog(employe)" />
              <q-btn flat round dense color="warning" icon="visibility_off" @click="anonymizeEmploye(employe)" v-if="employe.nom !== 'Anonyme'" />
              <q-btn flat round dense color="negative" icon="delete" @click="deleteEmploye(employe.id_employe)" />
            </div>
          </q-item-section>
          
        </q-item>
      </q-list>
    </div>
    
    <div v-else-if="!dbError" class="q-mt-lg text-center">
      <q-spinner-dots v-if="loading" color="green-5" size="40px" />
      <p v-else class="text-grey-4 text-h6">Aucun employé dans la base.</p>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="green-5" text-color="black" @click="openAddDialog" />
    </q-page-sticky>

    <q-dialog v-model="dialogVisible" persistent>
      <q-card style="min-width: 350px" class="bg-grey-10 text-white">
        <q-card-section>
          <div class="text-h6 text-green-5">{{ isEditing ? 'Modifier l\'employé' : 'Ajouter un employé' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input 
            v-model="formData.prenom" 
            label="Prénom" 
            dark
            color="green-5"
            autofocus 
            @keyup.enter="saveEmploye" />
          <q-input 
            v-model="formData.nom" 
            label="Nom de famille" 
            dark
            color="green-5"
            class="q-mt-md" 
            @keyup.enter="saveEmploye" />
          <div class="q-mt-md">
            <q-toggle v-model="formData.est_actif" label="Employé actif" color="green-5" dark />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="text-green-5">
          <q-btn flat label="Annuler" v-close-popup />
          <q-btn flat :label="isEditing ? 'Enregistrer' : 'Ajouter'" color="green-5" @click="saveEmploye" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

const employes = ref([]);
const loading = ref(true);
const dbError = ref('');


const dialogVisible = ref(false);
const isEditing = ref(false);
const formData = reactive({
  id_employe: null,
  nom: '',
  prenom: '',
  est_actif: true
});

const activeCount = computed(() => {
  return employes.value.filter(e => e.est_actif).length;
});

const fetchEmployes = () => {
  const db = window.$db;
  if (!db) {
    dbError.value = "La base de données n'a pas pu s'initialiser correctement.";
    loading.value = false;
    return;
  }

  dbError.value = '';

  db.transaction(function (tx) {
    tx.executeSql('SELECT * FROM EMPLOYE ORDER BY id_employe DESC', [], function (tx, results) {
      let tempEmployes = [];
      for (let i = 0; i < results.rows.length; i++) {
        let e = results.rows.item(i);
        tempEmployes.push({
          id_employe: e.id_employe,
          nom: e.nom,
          prenom: e.prenom,
          est_actif: e.est_actif == 1
        });
      }
      employes.value = tempEmployes;
      loading.value = false;
    }, function(tx, error) {
      dbError.value = "Erreur SELECT SQL: " + error.message;
      loading.value = false;
    });
  }, function(error) {
     dbError.value = "Erreur de Transaction SELECT: " + error.message;
     loading.value = false;
  });
};

const openAddDialog = () => {
  formData.id_employe = null;
  formData.nom = '';
  formData.prenom = '';
  formData.est_actif = true;
  isEditing.value = false;
  dialogVisible.value = true;
};

const openEditDialog = (employe) => {
  formData.id_employe = employe.id_employe;
  formData.nom = employe.nom;
  formData.prenom = employe.prenom;
  formData.est_actif = employe.est_actif;
  isEditing.value = true;
  dialogVisible.value = true;
};

const saveEmploye = () => {
  try {
    if (!formData.nom || !formData.prenom) {
      alert('Veuillez saisir le nom et le prénom !');
      return;
    }

    const db = window.$db;
    const actifValue = formData.est_actif ? 1 : 0;

    db.transaction(function(tx) {
      if (isEditing.value) {
        tx.executeSql(
          'UPDATE EMPLOYE SET nom = ?, prenom = ?, est_actif = ? WHERE id_employe = ?',
          [formData.nom, formData.prenom, actifValue, formData.id_employe]
        );
      } else {
        tx.executeSql(
          'INSERT INTO EMPLOYE (nom, prenom, est_actif) VALUES (?, ?, ?)',
          [formData.nom, formData.prenom, actifValue]
        );
      }
    }, function(error) {
      dbError.value = "Erreur d'écriture (INSERT/UPDATE) : " + error.message;
      alert("Sauvegarde échouée : " + error.message);
    }, function() {
      alert('Profil ' + (isEditing.value ? 'mis à jour' : 'créé') + ' avec succès !');
      dialogVisible.value = false;
      fetchEmployes();
    });
  } catch(e) {
    dbError.value = "Exception Javascript (save) : " + e.message;
  }
};

const deleteEmploye = (id) => {
  try {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé de la base de données ?')) {
      window.$db.transaction(function(tx) {
        tx.executeSql('DELETE FROM EMPLOYE WHERE id_employe = ?', [id]);
      }, function(error) {
        dbError.value = "Erreur de SUPPRESSION (DELETE) : " + error.message;
        alert("Suppression échouée : " + error.message);
      }, function() {
        alert('Employé supprimé !');
        fetchEmployes();
      });
    }
  } catch(e) {
    dbError.value = "Exception Javascript (delete) : " + e.message;
  }
};

const anonymizeEmploye = (employe) => {
  try {
    if (confirm(`Cacher les infos de ${employe.prenom} ? Les données seront remplacées par "Anonyme".`)) {
      window.$db.transaction(function(tx) {
        tx.executeSql('UPDATE EMPLOYE SET nom = ?, prenom = ?, est_actif = ? WHERE id_employe = ?', ['Anonyme', 'Anonyme', 0, employe.id_employe]);
      }, function(error) {
        dbError.value = "Erreur d'ANONYMISATION (UPDATE) : " + error.message;
        alert("Anonymisation échouée : " + error.message);
      }, function() {
        alert('Profil Anonymisé !');
        fetchEmployes();
      });
    }
  } catch(e) {
    dbError.value = "Exception Javascript (anomymize) : " + e.message;
  }
};

onMounted(() => {
  if (window.$db) {
    fetchEmployes();
  } else {
    window.addEventListener('db-ready', () => {
      fetchEmployes();
    });

  }
});
</script>
