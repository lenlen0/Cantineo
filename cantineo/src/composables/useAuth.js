

/**
 * Hache un mot de passe avec SHA-256 via Web Crypto API.
 * @param {string} password - Le mot de passe en clair
 * @returns {Promise<string>} - Le hash en hexadécimal
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Vérifie un mot de passe en le comparant à son hash SHA-256.
 * @param {string} password - Le mot de passe en clair saisi
 * @param {string} hash - Le hash stocké en base
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  const inputHash = await hashPassword(password)
  return inputHash === hash
}

/**
 * Crée un gestionnaire en base de données SQLite.
 * @param {object} db - L'instance SQLite
 * @param {string} login - Le login du gestionnaire
 * @param {string} password - Le mot de passe en clair (sera haché)
 * @returns {Promise<void>}
 */
export async function createGestionnaire(db, login, password) {
  const hashed = await hashPassword(password)
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO GESTIONNAIRE (login, mot_de_passe_hache) VALUES (?, ?)',
        [login, hashed],
        () => resolve(),
        (_, err) => reject(err)
      )
    })
  })
}

/**
 * Supprime un gestionnaire par son id.
 * @param {object} db
 * @param {number} id
 * @returns {Promise<void>}
 */
export function deleteGestionnaire(db, id) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM GESTIONNAIRE WHERE id_gest = ?',
        [id],
        () => resolve(),
        (_, err) => reject(err)
      )
    })
  })
}

/**
 * Récupère tous les gestionnaires (sans les mots de passe).
 * @param {object} db
 * @returns {Promise<Array>}
 */
export function getGestionnaires(db) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id_gest, login FROM GESTIONNAIRE ORDER BY login ASC',
        [],
        (_, result) => {
          const rows = []
          for (let i = 0; i < result.rows.length; i++) {
            rows.push(result.rows.item(i))
          }
          resolve(rows)
        },
        (_, err) => reject(err)
      )
    })
  })
}

/**
 * Authentifie un gestionnaire via login + mot de passe.
 * @param {object} db
 * @param {string} login
 * @param {string} password
 * @returns {Promise<object|null>} - Le gestionnaire si authentifié, sinon null
 */
export function loginGestionnaire(db, login, password) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM GESTIONNAIRE WHERE login = ?',
        [login],
        async (_, result) => {
          if (result.rows.length === 0) return resolve(null)
          const gest = result.rows.item(0)
          const ok = await verifyPassword(password, gest.mot_de_passe_hache)
          resolve(ok ? gest : null)
        },
        (_, err) => reject(err)
      )
    })
  })
}

/**
 * S'assure que la table GESTIONNAIRE existe
 * @param {object} db
 * @returns {Promise<void>}
 */
export function ensureGestionnaireTable(db) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS GESTIONNAIRE (
          id_gest INTEGER PRIMARY KEY AUTOINCREMENT,
          login TEXT NOT NULL UNIQUE,
          mot_de_passe_hache TEXT NOT NULL
        )`,
        [],
        () => resolve(),
        (_, err) => reject(err)
      )
    })
  })
}
