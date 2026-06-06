const url = "http://glpi.localhost/apirest.php/initSession";

async function test(appToken, authHeader) {
  console.log(`Testing App-Token: ${appToken}, Auth: ${authHeader}`);
  const headers = {};
  if (appToken) headers['App-Token'] = appToken;
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    console.log(`=> Status: ${res.status}, Body: ${text.substring(0, 100)}`);
  } catch (err) {
    console.error(err);
  }
}

async function run() {
  const tokens = [
    "DNPavg9UezsKGDL9FbZBwEzsiPQf5GeBSbOrWEfK", // user's new
    "9ChDzHPGGEH3k0svqXWT5K6hgybFQNFXk4ruM6sy", // user's old
    "9db2dce8bb379a56697bd36c5baaa4e0f718a7a86ab6344f7f0252c9c93af3f0", // code old
    null // no app token
  ];

  const auths = [
    "user_token glpi",
    "user_token c9990dd59bb571902c862376a784ea6184c3531aff8aba27ae129f33ac155910",
    "Basic Z2xwaTpnbHBp"
  ];

  for (const app of tokens) {
    for (const auth of auths) {
      await test(app, auth);
    }
  }
}

run();
