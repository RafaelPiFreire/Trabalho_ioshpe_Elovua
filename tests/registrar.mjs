// Permite que o Node (ESM) importe os arquivos de src/ sem a extensão ".js",
// como o Metro/Expo faz. Usado só nos testes.
import { register } from 'node:module';
register('./resolvedor.mjs', import.meta.url);
