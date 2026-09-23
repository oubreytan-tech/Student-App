import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dest = path.join(root, 'univen-anguler-app/frontend');
fs.mkdirSync(path.join(dest, 'src/app/shared'), { recursive: true });
fs.mkdirSync(path.join(dest, 'public'), { recursive: true });
fs.copyFileSync(path.join(root, 'src/types.ts'), path.join(dest, 'src/app/types.ts'));
fs.copyFileSync(path.join(root, 'app-logo/univen-logo.png'), path.join(dest, 'public/univen-logo.png'));
for (const name of ['supportNormalizer.ts', 'statementExport.ts']) fs.copyFileSync(path.join(root, 'src/services', name), path.join(dest, 'src/app/shared', name));
fs.copyFileSync(path.join(root, 'src/components/requests.css'), path.join(dest, 'src/app/requests.css'));
const original = fs.readFileSync(path.join(root, 'src/data/initialAppData.ts'), 'utf8');
const config = original.slice(original.indexOf('export const ticketCategoriesConfig'));
fs.writeFileSync(path.join(dest, 'src/app/shared/categories.ts'), "import type { TicketCategory } from '../types';\n" + config);
const icons = {};
for (const name of ['user','lock','eye','eye-off','shield-check','circle-alert','circle-check','home','grid-2x2','plus','message-square-warning','bell','smartphone','monitor','log-out','credit-card','graduation-cap','file-text','arrow-right','chevron-right','history','book-open','download','search','layers','x','send','paperclip','mail','phone','map-pin','calendar','refresh-cw','arrow-left','clock','pencil','qr-code']) {
  let text = fs.readFileSync(path.join(root, 'node_modules/lucide-react/dist/esm/icons', name + '.js'), 'utf8');
  const alias = text.match(/from ['"]\.\/([^'"]+)['"]/);
  if (!text.includes('const __iconNode') && alias) text = fs.readFileSync(path.join(root, 'node_modules/lucide-react/dist/esm/icons', alias[1]), 'utf8');
  const match = text.match(/const __iconNode = ([\s\S]*?);/);
  if (!match) throw new Error('Icon not found: ' + name);
  icons[name] = vm.runInNewContext('(' + match[1] + ')', {}, { timeout: 1000 });
}
fs.writeFileSync(path.join(dest, 'src/app/shared/icons.json'), JSON.stringify(icons));
console.log('Copied existing logo, types, category configuration, request styles, PDF export and support normalizer. No credentials or student sample records copied.');
