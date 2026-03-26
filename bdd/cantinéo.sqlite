CREATE TABLE IF NOT EXISTS GESTIONNAIRE (
    id_gest INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    mot_de_passe_hache TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS PARAMETRE (
    id_param INTEGER PRIMARY KEY AUTOINCREMENT,
    libelle TEXT NOT NULL,
    valeur TEXT -- On garde TEXT ici car une valeur peut être n'importe quoi
);

CREATE TABLE IF NOT EXISTS EMPLOYE (
    id_employe INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    est_actif INTEGER DEFAULT 1 -- 1 = Actif, 0 = Anonymisé
);

CREATE TABLE IF NOT EXISTS PAIEMENT (
    id_paiement INTEGER PRIMARY KEY AUTOINCREMENT,
    date_paiement TEXT NOT NULL, -- Format YYYY-MM-DD
    montant REAL NOT NULL,       -- Type numérique pour les calculs
    id_employe INTEGER NOT NULL,
    FOREIGN KEY (id_employe) REFERENCES EMPLOYE(id_employe)
);

CREATE TABLE IF NOT EXISTS REPAS (
    id_repas INTEGER PRIMARY KEY AUTOINCREMENT,
    date_repas TEXT NOT NULL,
    prix_applique REAL NOT NULL,
    id_employe INTEGER NOT NULL,
    FOREIGN KEY (id_employe) REFERENCES EMPLOYE(id_employe)
);