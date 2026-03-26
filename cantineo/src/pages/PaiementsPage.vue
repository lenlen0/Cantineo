<template>
  <q-page class="q-pa-md bg-grey-9 text-white">
    
    <div class="row items-center q-mb-md">
      <q-icon name="payments" size="2em" color="green-5" class="q-mr-sm" />
      <div class="text-h5 text-weight-bold text-green-5">Soldes & Paiements</div>
    </div>

    <div v-if="dbError" class="q-mb-md text-negative text-center" style="padding: 10px; border: 2px solid red; border-radius: 8px;">
      <b>ERREUR SQL :</b> <br /> {{ dbError }}
    </div>

    <div v-if="employesActifs.length > 0" class="q-mt-md">
      <q-list bordered separator class="bg-grey-10 text-white shadow-2 rounded-borders">
        <q-item v-for="employe in employesActifs" :key="employe.id_employe" class="q-py-md">
          
          <q-item-section>
            <q-item-label class="text-weight-bold text-subtitle1">
              {{ employe.prenom || 'Prénom' }} {{ employe.nom || 'Nom' }}
            </q-item-label>
          </q-item-section>
          
          <q-item-section side>
            <div class="row items-center q-gutter-md">
              <div class="text-right">
                <div class="text-caption text-grey-4">À payer</div>
                <div :class="employe.solde > 0 ? 'text-negative text-weight-bold text-h6' : 'text-positive text-weight-bold text-h6'">
                  {{ (employe.solde || 0).toFixed(2) }} €
                </div>
              </div>
              <q-btn v-if="employe.solde > 0" icon="add_card" color="green-5" text-color="black" unelevated label="Encaisser" @click="openPaiementDialog(employe)" />
              <q-btn v-else icon="check_circle" flat color="positive" disable label="À jour" />
            </div>
          </q-item-section>
          
        </q-item>
      </q-list>
    </div>
    
    <div v-else-if="!dbError && !loading" class="q-mt-xl text-center">
       <q-icon name="warning" size="3em" color="warning" />
       <p class="text-grey-4 text-h6 q-mt-md">Aucun employé actif trouvé pour faire les soldes.</p>
    </div>

    <div v-if="loading" class="text-center q-mt-xl">
       <q-spinner-dots color="green-5" size="40px" />
    </div>

    <q-dialog v-model="dialogPaiementVisible" persistent>
      <q-card style="min-width: 350px" class="bg-grey-10 text-white">
        <q-card-section>
          <div class="text-h6 text-green-5">Nouveau Paiement</div>
          <div class="text-subtitle2">Pour : {{ selectedEmploye?.prenom }} {{ selectedEmploye?.nom }}</div>
          <div class="text-red text-weight-bold">Reste à payer : {{ selectedEmploye?.solde?.toFixed(2) }} €</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input 
            v-model="paiementForm.date_paiement" 
            label="Date du paiement" 
            type="date" 
            outlined 
            dense 
            dark
            color="green-5"
            class="q-mb-md"
          />
          <q-input 
            v-model.number="paiementForm.montant" 
            label="Montant reçu (€)" 
            type="number" 
            step="0.10"
            outlined 
            dense 
            suffix="€" 
            dark
            color="green-5"
            autofocus
          />
        </q-card-section>

        <q-card-actions align="right" class="text-green-5">
          <q-btn flat label="Annuler" v-close-popup />
          <q-btn flat color="green-5" label="Enregistrer le paiement" @click="savePaiement" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const employesActifs = ref([]);
const loading = ref(true);
const dbError = ref('');

const dialogPaiementVisible = ref(false);
const selectedEmploye = ref(null);
const paiementForm = reactive({
  date_paiement: new Date().toISOString().split('T')[0],
  montant: 0
});

const calculateSoldes = () => {
  const db = window.$db;
  if (!db) {
    dbError.value = "La base de données n'a pas pu s'initialiser.";
    loading.value = false;
    return;
  }

  dbError.value = '';

  const query = `
    SELECT 
        e.id_employe, e.nom, e.prenom,
        COALESCE((SELECT SUM(prix_applique) FROM REPAS WHERE id_employe = e.id_employe), 0) as total_repas,
        COALESCE((SELECT SUM(montant) FROM PAIEMENT WHERE id_employe = e.id_employe), 0) as total_paye
    FROM EMPLOYE e
    WHERE e.est_actif = 1
    ORDER BY total_repas - total_paye DESC;
  `;

  db.transaction(function (tx) {
    tx.executeSql(query, [], function (tx, results) {
      let temp = [];
      for (let i = 0; i < results.rows.length; i++) {
        let e = results.rows.item(i);
        temp.push({
          id_employe: e.id_employe,
          nom: e.nom,
          prenom: e.prenom,
          solde: e.total_repas - e.total_paye
        });
      }
      employesActifs.value = temp;
      loading.value = false;
    }, function(tx, error) {
      dbError.value = "Erreur SELECT Soldes : " + error.message;
      loading.value = false;
    });
  });
};

const openPaiementDialog = (employe) => {
  selectedEmploye.value = employe;
  paiementForm.date_paiement = new Date().toISOString().split('T')[0];
  paiementForm.montant = parseFloat(employe.solde.toFixed(2));
  dialogPaiementVisible.value = true;
};

const savePaiement = () => {
  if (!paiementForm.montant || paiementForm.montant <= 0) {
    alert("Le montant doit être supérieur à 0.");
    return;
  }

  const db = window.$db;
  db.transaction(function(tx) {
    tx.executeSql(
      'INSERT INTO PAIEMENT (date_paiement, montant, id_employe) VALUES (?, ?, ?)',
      [paiementForm.date_paiement, paiementForm.montant, selectedEmploye.value.id_employe]
    );
  }, function(error) {
    dbError.value = "Erreur d'écriture PAIEMENT : " + error.message;
    alert("Erreur lors du paiement: " + error.message);
  }, function() {
    alert(`Paiement de ${paiementForm.montant}€ enregistré avec succès !`);
    dialogPaiementVisible.value = false;
    calculateSoldes();
  });
};

onMounted(() => {
  if (window.$db) {
    calculateSoldes();
  } else {
    window.addEventListener('db-ready', () => {
      calculateSoldes();
    });

  }
});
</script>
