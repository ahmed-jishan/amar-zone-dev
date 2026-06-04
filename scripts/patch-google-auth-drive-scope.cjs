const fs = require('fs')
const path = require('path')

const pluginPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@codetrix-studio',
  'capacitor-google-auth',
  'android',
  'src',
  'main',
  'java',
  'com',
  'codetrixstudio',
  'capacitor',
  'GoogleAuth',
  'GoogleAuth.java'
)

if (!fs.existsSync(pluginPath)) {
  console.warn('[patch-google-auth-drive-scope] GoogleAuth.java not found; skipping.')
  process.exit(0)
}

let source = fs.readFileSync(pluginPath, 'utf8')
let changed = false

function replaceOnce(search, replacement) {
  if (source.includes(search)) {
    source = source.replace(search, replacement)
    changed = true
  }
}

if (!source.includes('import java.util.LinkedHashSet;')) {
  replaceOnce(
    'import java.net.URL;\n',
    'import java.net.URL;\nimport java.util.LinkedHashSet;\nimport java.util.Set;\n'
  )
}

if (!source.includes('private String accountManagerScope')) {
  replaceOnce(
    '  private GoogleSignInClient googleSignInClient;\n',
    '  private GoogleSignInClient googleSignInClient;\n  private String accountManagerScope = "oauth2:profile email";\n'
  )
}

if (!source.includes('accountManagerScope = buildAccountManagerScope(scopeArray);')) {
  replaceOnce(
    '    googleSignInBuilder.requestScopes(firstScope, scopes);\n',
    '    googleSignInBuilder.requestScopes(firstScope, scopes);\n    accountManagerScope = buildAccountManagerScope(scopeArray);\n'
  )
}

replaceOnce(
  '    AccountManagerFuture<Bundle> future = manager.getAuthToken(account, "oauth2:profile email", null, false, null, null);\n',
  '    AccountManagerFuture<Bundle> future = manager.getAuthToken(account, accountManagerScope, null, false, null, null);\n'
)

replaceOnce(
  '        call.reject("Something went wrong", "" + e.getStatusCode());\n',
  '        call.reject("Google sign-in failed with status code " + e.getStatusCode(), "" + e.getStatusCode());\n'
)

replaceOnce(
  '    String configClientId = getConfig().getString("androidClientId",\n      getConfig().getString("clientId",\n        this.getContext().getString(R.string.server_client_id)));\n',
  '    String configClientId = getConfig().getString("serverClientId",\n      getConfig().getString("clientId",\n        this.getContext().getString(R.string.server_client_id)));\n'
)

replaceOnce(
  '    String configClientId = getConfig().getString("serverClientId",\n      getConfig().getString("clientId",\n        getConfig().getString("androidClientId",\n          this.getContext().getString(R.string.server_client_id))));\n',
  '    String configClientId = getConfig().getString("serverClientId",\n      getConfig().getString("clientId",\n        this.getContext().getString(R.string.server_client_id)));\n'
)

replaceOnce(
  '          call.reject("Something went wrong while retrieving access token", e);\n',
  '          call.reject("Google Drive access token retrieval failed. Verify Drive API, OAuth project, package name, and SHA-1 fingerprint.", e);\n'
)

replaceOnce(
  '        call.reject("Something went wrong while retrieving access token", e);\n',
  '        call.reject("Google Drive access token refresh failed. Reconnect Google Drive.", e);\n'
)

replaceOnce(
  '    Log.d("AuthenticatedBackend", "token: " + authToken + ", verification: " + stringResponse);\n',
  ''
)

if (!source.includes('private String buildAccountManagerScope')) {
  replaceOnce(
    '\n  private JSONObject verifyToken(String authToken) throws IOException, JSONException {\n',
    '\n  private String buildAccountManagerScope(String[] scopeArray) {\n    Set<String> scopes = new LinkedHashSet<>();\n    scopes.add("profile");\n    scopes.add("email");\n    for (String scope : scopeArray) {\n      if (scope != null && !scope.trim().isEmpty()) {\n        scopes.add(scope.trim());\n      }\n    }\n    return "oauth2:" + String.join(" ", scopes);\n  }\n\n  private JSONObject verifyToken(String authToken) throws IOException, JSONException {\n'
  )
}

if (changed) {
  fs.writeFileSync(pluginPath, source)
  console.log('[patch-google-auth-drive-scope] Patched native Google Auth Drive scope/sign-in config.')
} else {
  console.log('[patch-google-auth-drive-scope] Patch already applied.')
}
