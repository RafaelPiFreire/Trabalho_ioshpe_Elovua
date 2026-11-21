# EDITAL — Evolua 2.0 (versão local, sem Firebase)

**Projeto:** Evolua — Calculadora de Consumo de Combustível
**Versão:** 2.0.0
**Autores originais:** Rafael Piffer e Vinicius Alexandre (Turma 2 DS — Disciplina PAM — Prof. Márcio Ferraz)
**Data deste edital:** 14 de outubro de 2026

---

## 1. Aviso mais importante: o aplicativo agora funciona SOMENTE LOCALMENTE

Nesta versão **não existe servidor, nem Firebase, nem internet** envolvidos. Isso significa que:

1. **Contas, senhas (em forma de hash), sessão e histórico de cálculos ficam salvos apenas no aparelho** (ou no navegador, se usar a versão web), por meio do `AsyncStorage`.
2. **Nada é sincronizado entre aparelhos.** Uma conta criada no celular não existe no computador, e vice-versa.
3. **Os dados podem ser perdidos** se o usuário limpar os dados do aplicativo, desinstalar o app ou limpar os dados do navegador (na web).
4. **Na web, os dados ficam presos a um endereço.** `http://localhost:8081` e `http://192.168.0.10:8081` são "sites" diferentes para o navegador e têm armazenamentos separados.
5. **Não há recuperação de senha.** Como não há servidor nem e-mail, quem esquecer a senha precisa criar outra conta (ou limpar os dados do app).
6. **Esta autenticação é de demonstração/uso acadêmico**, não um sistema de login seguro para publicação. Para publicar o app de verdade seria necessário um serviço de autenticação real (ver seção 11).

---

## 2. Resumo do que foi feito

O projeto recebido (`evolua_sem_firebase.zip`) tinha vários erros que impediam o funcionamento correto. Em vez de remendar, foi **criado um projeto novo** (pasta `evolua/`), aproveitando o que estava certo (a ideia, o visual azul, o texto da tela "Sobre", os ícones) e corrigindo ou reescrevendo o restante.

**Causa principal do "não funciona":** os arquivos das telas (`Login`, `Home`, `Calculo`, `Sobre`) **estavam sem a extensão `.js`**. O empacotador do Expo (Metro) não os encontrava ao executar `import Login from './src/screens/Login'`, e o app não abria.

---

## 3. Lista completa dos problemas encontrados no projeto antigo e como foram resolvidos

| # | Problema encontrado | Gravidade | Solução na versão 2.0 |
|---|---|---|---|
| 1 | Os 4 arquivos de tela (`Login`, `Home`, `Calculo`, `Sobre`) não tinham extensão `.js`; o Metro não resolvia os `import`. | **Impeditivo** | Arquivos recriados como `Login.js`, `Home.js`, `Calculo.js`, `Sobre.js`. |
| 2 | `Alert.alert` **não faz nada na versão web**: mensagens de erro ("senha incorreta", "preencha os campos") nunca apareciam, parecendo que o botão estava quebrado. | Alta | Criado `src/utils/alerta.js`: usa `window.alert` na web e `Alert.alert` no celular. |
| 3 | `package.json` sem as dependências da web (`react-native-web`, `react-dom`, `@expo/metro-runtime`), então `npm run web` falhava. | Alta | Dependências adicionadas. |
| 4 | Dependências com versão `"*"` (`react-native-paper`, `@react-navigation/*`): qualquer instalação futura podia puxar versões incompatíveis e quebrar. | Alta | Versões fixadas em faixas compatíveis com o Expo SDK 54. |
| 5 | `react-native-paper` listado, mas nunca usado. | Média | Removido. |
| 6 | Senhas guardadas **em texto puro** no armazenamento; a conta demo ficava com a senha escrita no código e era regravada a cada login. | Alta (segurança) | Senhas guardadas como **hash SHA-256 com sal e 1000 rodadas**. A conta demo é criada uma única vez. |
| 7 | Texto `Conta de teste: demo@evolua.com\nSenha: Evolua123` mostrava o `\n` literal na tela (em JSX, `\n` dentro de texto não quebra linha). | Baixa | Uso de `{'\n'}`; além disso, tocar no texto preenche e-mail e senha de teste. |
| 8 | Aba chamada internamente de `"Biscoito"`, com rótulo "**Abilidades**" (erro de digitação) e título "Calculadora de consumo" numa tela que era apenas um exemplo de aula. | Média | Aba renomeada para `Inicio`, rótulo "Início", título "Evolua". |
| 9 | A tela inicial era só um modelo ("Página Inicial / App exemplo de aula / App 1.1.0"). | Média | Nova tela Início: saudação com o nome, **média dos cálculos** e **histórico** (ver seção 6). |
| 10 | O arquivo `Sobre` exportava um componente chamado `Home` (nome errado, risco de confusão). | Baixa | Componente `Sobre` corrigido, com aviso de que o app é local e versão 2.0.0. |
| 11 | Em `Calculo`: variável chamada `imc` (sobra de outro exercício), variável `classificacao` sem uso, comentários de correções antigas, resultado escrito "consumo de : 12.00" **sem unidade** e com ponto decimal. | Média | Lógica reescrita e isolada em `src/utils/consumo.js`; resultado "Consumo médio: 12,00 km/L" com classificação. |
| 12 | `parseFloat("12abc")` devolvia `12` silenciosamente: texto inválido era aceito como número. | Média | Nova leitura estrita (`lerNumero`): aceita `12,5`, `12.5`, espaços nas pontas; rejeita `12abc`, `1e5`, `-3`, `1,2,3`. |
| 13 | `keyboardType="numeric"` em alguns teclados não mostra vírgula, e o brasileiro digita `8,5`. | Baixa | Trocado por `decimal-pad`. |
| 14 | Em `App.js`, `entrar` fazia `await AsyncStorage.setItem` sem proteção: se falhasse, o login travava. | Média | Falha ao salvar a sessão não impede mais a entrada (só não "lembra" o usuário). |
| 15 | A sessão guardava o objeto do usuário inteiro e nunca conferia se a conta ainda existia. | Média | Guarda só o e-mail e, ao abrir, confere se a conta ainda existe. |
| 16 | Dados corrompidos no armazenamento (`JSON.parse` com erro) podiam causar falha. | Média | Leitura protegida: dado inválido vira "vazio" e o app continua. |
| 17 | `fazerLogin` regravava a lista inteira de usuários a cada login sem necessidade. | Baixa | Removido. |
| 18 | Sobras do Snack: `components/AssetExample.js`, `snack-icon.png`, `README.md` do Snack, `slug` "snack-c3e19449-…", nome "trabalha_hobby". | Baixa | Removidos; nome do app "Evolua", slug "evolua". |
| 19 | Sem tratamento de tela larga (web): formulário esticava na largura toda. | Baixa | Conteúdo limitado a ~560 px e centralizado. |
| 20 | Não havia nenhum teste automatizado. | Média | 12 testes automatizados da lógica (seção 9). |

---

## 4. Estrutura do projeto novo

```
evolua/
├── App.js                      # Navegação, sessão (entrar/sair) e abas
├── index.js                    # Registro do app (Expo)
├── app.json                    # Configuração do Expo
├── package.json                # Dependências e scripts
├── README.md                   # Guia rápido
├── EDITAL.md                   # Este documento
├── assets/                     # Ícones e splash
├── src/
│   ├── theme.js                # Cores do app
│   ├── screens/
│   │   ├── Login.js            # Login e cadastro
│   │   ├── Home.js             # Início: saudação, média e histórico
│   │   ├── Calculo.js          # Formulário de cálculo
│   │   └── Sobre.js            # Créditos e informações
│   ├── services/
│   │   ├── contas.js           # Contas, sessão e histórico (lógica pura, testável)
│   │   └── armazenamento.js    # Liga a lógica ao AsyncStorage
│   └── utils/
│       ├── consumo.js          # Cálculo de km/L e classificação
│       ├── validacao.js        # Validação de cadastro e login
│       ├── hash.js             # SHA-256 + sal (JavaScript puro)
│       └── alerta.js           # Mensagens que funcionam no celular e na web
└── tests/
    ├── evolua.test.mjs         # 12 testes automatizados
    ├── registrar.mjs           # Auxiliar dos testes
    └── resolvedor.mjs          # Auxiliar dos testes
```

A lógica de negócio fica fora das telas (`contas.js`, `consumo.js`, `validacao.js`, `hash.js`) justamente para poder ser testada sem precisar abrir o aplicativo.

---

## 5. Como instalar e executar

**Pré-requisitos:** Node.js 20 ou superior, npm, e o aplicativo **Expo Go** no celular (ou um emulador Android/iOS, ou apenas o navegador).

```bash
cd evolua
npm install
npx expo install --fix     # recomendado na 1ª vez: ajusta cada biblioteca à versão exata do SDK 54
npx expo start
```

Depois:
- **Celular:** escaneie o QR code com o Expo Go (celular e computador na mesma rede Wi-Fi).
- **Web:** pressione `w` no terminal (ou `npm run web`).
- **Android/iOS (emulador):** `npm run android` / `npm run ios`.

Se aparecer comportamento estranho após trocar de projeto, limpe o cache: `npx expo start -c`.

**Atenção:** apague a pasta `node_modules` do projeto antigo e não misture arquivos dos dois projetos.

---

## 6. Funcionalidades

### 6.1 Login e cadastro (`Login.js`)
- **Cadastro:** nome, e-mail, senha e confirmação. Validações: todos os campos preenchidos, e-mail em formato válido, senha com no mínimo 6 caracteres, senhas iguais, e-mail ainda não cadastrado. O e-mail é guardado em minúsculas e sem espaços nas pontas (`Ana@X.com` e `ana@x.com` são a mesma conta).
- **Login:** confere e-mail e senha com a conta salva.
- **Conta de teste:** `demo@evolua.com` / `Evolua123` (toque no texto da tela para preencher).
- **Enter no teclado** envia o formulário.
- Botão fica desativado e mostra um indicador enquanto processa (evita duplo envio).

### 6.2 Sessão (`App.js`)
- Ao abrir o app, recupera a sessão salva; se a conta não existir mais, volta para o login.
- Botão **Sair** no topo encerra a sessão.

### 6.3 Cálculo (`Calculo.js`)
- Campos: distância (km) e combustível (litros). Aceita vírgula ou ponto (`8,5` ou `8.5`).
- Fórmula: **consumo (km/L) = distância ÷ litros**.
- Classificação informativa (carros de passeio):
  - **Econômico:** 14 km/L ou mais
  - **Moderado:** de 9 até menos de 14 km/L
  - **Alto consumo:** menos de 9 km/L
- Erros mostrados na tela em vermelho (campos vazios, texto inválido, zero ou negativo).
- Cada cálculo válido é salvo automaticamente no histórico do usuário.
- Botão **Limpar** zera o formulário.

### 6.4 Início (`Home.js`)
- Saudação com o nome do usuário.
- **Média** de todos os cálculos guardados no histórico.
- **Histórico** com data/hora, distância, litros, km/L e classificação (os 30 mais recentes; cada usuário vê somente o seu).
- Botão **Limpar** apaga o histórico do usuário.
- A lista é atualizada sempre que a aba volta a ser exibida.

### 6.5 Sobre (`Sobre.js`)
- Créditos (autores, turma, disciplina, professor), descrição do app, aviso de que funciona só localmente e versão 2.0.0.

---

## 7. Como os dados ficam guardados

Todas as chaves ficam no `AsyncStorage` (no navegador, equivale ao `localStorage`):

| Chave | Conteúdo |
|---|---|
| `@evolua/usuarios` | Lista de contas: `nome`, `email`, `sal` e `hash` (nunca a senha). |
| `@evolua/sessao` | Somente o e-mail do usuário que está logado. |
| `@evolua/historico:<email>` | Até 30 cálculos daquele usuário. |

**Compatibilidade com a versão anterior:** se existirem contas antigas com a senha em texto puro (`@evolua/usuarios` da versão sem Firebase), elas são **migradas automaticamente** para hash na primeira leitura, e continuam funcionando com a mesma senha.

---

## 8. Segurança — o que foi feito e o que NÃO foi

**Feito:** a senha não é guardada em texto puro; é guardada como SHA-256 com sal aleatório por usuário e 1000 rodadas. O SHA-256 foi implementado em JavaScript puro (e conferido contra o `crypto` do Node) porque as bibliotecas de criptografia do navegador não funcionam em endereços `http` que não sejam `localhost` (por exemplo, abrir a versão web pelo IP da rede).

**NÃO é seguro para produção, porque:**
- Qualquer pessoa com acesso ao aparelho/navegador e às ferramentas de desenvolvedor pode copiar os dados guardados e tentar adivinhar senhas por força bruta (1000 rodadas de SHA-256 é muito menos protetor que bcrypt/argon2 num servidor).
- O sal é gerado com `Math.random`, que não é criptograficamente forte.
- Não há limite de tentativas de login, bloqueio de conta nem recuperação de senha.
- Não use senhas reais ou reutilizadas em outros serviços.

---

## 9. Testes realizados

### 9.1 Testes automatizados (executados e aprovados: 12 de 12)
Comando: `npm test` (requer Node 22.12 ou superior; é uma exigência só dos testes, não do app).

1. Leitura de números (vírgula, ponto, espaços; rejeita lixo).
2. Cálculo: 300 km com 25 L = 12,00 km/L, "Moderado".
3. Validação do cálculo (vazio, zero, negativo, texto).
4. Faixas de classificação.
5. Validação de e-mail e de cadastro.
6. SHA-256 confere com o `crypto` do Node em 8 tamanhos de texto (inclui acentos, emoji, limites de bloco de 55/56/64 bytes).
7. Conta demo funciona e a senha não aparece no armazenamento.
8. Cadastro, login, e-mail duplicado, senha errada, e-mail inexistente e e-mail com maiúsculas.
9. Sessão: salvar, recuperar, encerrar e conta removida.
10. Migração de conta antiga (texto puro) para hash.
11. Dados corrompidos não derrubam o app.
12. Histórico por usuário, limite de 30, ids únicos e limpeza.

Durante estes testes foi encontrado e corrigido um erro real: os identificadores do histórico podiam se repetir quando duas gravações ocorriam no mesmo milissegundo com a lista cheia.

### 9.2 Verificações adicionais
- Todos os 13 arquivos `.js` foram analisados quanto à sintaxe (inclusive JSX) e todos os `import` do projeto foram resolvidos com sucesso num empacotamento de teste.

### 9.3 O que NÃO foi possível testar (limitação honesta)
O ambiente onde este projeto foi preparado **bloqueou o acesso ao registro do npm** (erro 403 de política de rede). Por isso:
- **`npm install` e `npx expo start` não foram executados aqui.** O aplicativo **ainda não foi aberto** num celular, emulador ou navegador por mim.
- As **versões das bibliotecas** em `package.json` foram escolhidas com base no Expo SDK 54 que já estava no projeto original, mas **não foram confirmadas por instalação**. Por isso o passo `npx expo install --fix` (seção 5) é recomendado: ele corrige qualquer diferença de versão automaticamente.
- A aparência das telas (layout, cores, rolagem do teclado) precisa ser conferida visualmente por você.

Se algo falhar ao rodar, envie a mensagem de erro do terminal para que seja corrigida.

---

## 10. Solução de problemas

| Sintoma | O que fazer |
|---|---|
| Erro de módulo não encontrado ao iniciar | `npm install` e depois `npx expo start -c`. |
| Aviso de versões incompatíveis do Expo | `npx expo install --fix`. |
| Tela branca/erro vermelho após copiar arquivos do projeto antigo | Use a pasta nova inteira; apague `node_modules` e `.expo` e reinstale. |
| Celular não abre o QR code | Confirme a mesma rede Wi-Fi ou use `npx expo start --tunnel`. |
| Na web, minha conta "sumiu" | O armazenamento depende do endereço (`localhost` vs. IP) e do navegador; use sempre o mesmo. |
| Esqueci a senha | Não há recuperação. Crie outra conta ou limpe os dados do app/navegador. |
| Quero zerar tudo | Limpe os dados do aplicativo (Android: Configurações > Apps > Expo Go > Armazenamento) ou do site (navegador). |

---

## 11. Próximos passos sugeridos (fora do escopo desta versão)

- Autenticação real com servidor (Firebase Auth, Supabase etc.) caso o app seja publicado e precise de sincronização entre aparelhos e recuperação de senha.
- Exportar/importar o histórico (arquivo) para fazer cópia de segurança.
- Cadastro de veículos e preço do combustível para calcular custo por km.
- Gráfico de evolução do consumo.

---

## 12. Fica fora de propósito (decisões tomadas)

- **Mantido:** nomes e créditos da tela "Sobre", cor azul do app, a conta de teste e o comportamento "sessão lembrada ao reabrir".
- **Removido de propósito:** Firebase (já removido antes), `react-native-paper`, exemplo do Snack, textos de exemplo de aula.
- **Alterado de propósito:** as cores vinho (`#800020`) das telas Home/Calculo/Sobre foram unificadas no azul do login, para o app ter uma identidade visual única.
