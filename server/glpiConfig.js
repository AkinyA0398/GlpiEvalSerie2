// Centralisation configuration GLPI (Node/Express backend)

const GLPI_CONFIG = {
    // ⚠️ Attention: remplacez ces valeurs par vos vrais tokens GLPI.
    // L’API renvoie ERROR_WRONG_APP_TOKEN_PARAMETER si appToken est incorrect.
    get url() { return process.env.GLPI_URL || "http://glpi.localhost/apirest.php"; },
    get appToken() { return process.env.GLPI_APP_TOKEN || "DNPavg9UezsKGDL9FbZBwEzsiPQf5GeBSbOrWEfK"; },
    get userToken() { return process.env.GLPI_USER_TOKEN || "glpi"; },
};


export default GLPI_CONFIG;


