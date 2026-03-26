import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
    document.addEventListener('deviceready', () => {
        try {
            if (!window.sqlitePlugin) {
                alert("ERREUR CRITIQUE: window.sqlitePlugin n'existe pas. Le plugin Cordova n'est pas installé ou détecté sur ce build.");
                return;
            }
            
            const db = window.sqlitePlugin.openDatabase({
                name: 'cantineo.db',
                location: 'default',
                createFromLocation: 1
            });

            app.config.globalProperties.$db = db;
            window.$db = db;
            
            window.dispatchEvent(new Event('db-ready'));

        } catch (e) {
            alert("Exception SQLite dans sqlite.js : " + e.message);
        }
    }, false);
})
