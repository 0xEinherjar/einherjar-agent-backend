# Documentacao do Sistema

## Visao Geral

Este projeto e um backend Node.js com Express que serve como motor do agente Einherjar/Arc Automation Bot. O sistema combina API HTTP autenticada, agente de IA, integracao com X/Twitter, carteiras Circle Developer Controlled Wallets, MongoDB e servicos de e-mail para executar operacoes on-chain a partir de comandos em linguagem natural ou chamadas REST.

As principais responsabilidades do backend sao:

- autenticar usuarios via Better Auth com provedores Twitter/X e Google;
- criar e vincular uma carteira Circle SCA para cada usuario conhecido;
- manter o vinculo entre usuario da plataforma, conta do X/Twitter, Gmail, walletId e endereco EVM;
- interpretar comandos de chat ou mencoes no X/Twitter usando LangChain/OpenAI;
- executar transferencias de USDC, EURC e tokens ERC-20;
- manter contatos de pagamento por usuario para associar labels a carteiras EVM;
- criar tokens ERC-20 na Arc Testnet;
- executar bridge de USDC entre redes suportadas;
- solicitar faucet de USDC/EURC na Arc Testnet;
- registrar metricas agregadas de uso, volume e tokens criados;
- enviar recibos por e-mail ou DM quando o destinatario e identificado por Gmail ou X/Twitter.
- rastrear transferencias sociais para X/Twitter e permitir saque por DM sem login na plataforma.

## Stack Principal

- Runtime: Node.js com ES Modules.
- Framework HTTP: Express 5.
- Autenticacao: Better Auth com MongoDB adapter.
- Provedores sociais: Twitter/X OAuth e Google OAuth.
- IA: LangChain com ChatOpenAI, modelo configurado por `LLM_MODEL`.
- Blockchain/carteiras: Circle Developer Controlled Wallets, Circle Smart Contract Platform e Circle AppKit.
- Banco de dados: MongoDB.
- E-mail: Resend.
- Seguranca HTTP: Helmet, CORS e rate limit.
- Logs: Winston e Morgan.

## Inicializacao da Aplicacao

O ponto de entrada e `src/main.js`.

Fluxo de inicializacao:

1. carrega variaveis de ambiente com `dotenv`;
2. valida configuracoes obrigatorias em `src/config/env.js`;
3. cria a aplicacao Express;
4. aplica logger, Helmet, CORS e rate limit;
5. registra Better Auth em `/api/auth/{*any}`;
6. registra as rotas `/api/user`, `/api/blockchain` e `/api/stats`;
7. conecta ao MongoDB;
8. inicia o monitoramento de mencoes no X/Twitter;
9. faz shutdown gracioso em `SIGINT` e `SIGTERM`.

Scripts disponiveis:

- `npm start`: inicia `node src/main.js`.
- `npm run dev`: inicia `node --watch src/main.js`.

## Configuracao e Variaveis de Ambiente

As variaveis sao validadas por Zod em `src/config/env.js`. Sem elas, a aplicacao falha na inicializacao.

Obrigatorias:

- `NODE_ENV`: `development`, `production` ou `test`.
- `PORT`: porta HTTP.
- `MONGODB_URI`: URL de conexao MongoDB.
- `MONGODB_NAME_DATABASE`: nome do banco.
- `BETTER_AUTH_SECRET`: segredo do Better Auth.
- `BETTER_AUTH_URL`: URL base do backend para autenticacao.
- `FRONTEND_URL`: origem confiavel do frontend.
- `TWITTER_CLIENT_ID` e `TWITTER_CLIENT_SECRET`: OAuth do Twitter/X para Better Auth.
- `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`: credenciais OAuth 1.0a usadas pelo bot no X/Twitter.
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: OAuth Google.
- `LLM_API_KEY` e `LLM_MODEL`: acesso ao modelo usado pelo agente.
- `CIRCLE_KIT_KEY`: chave do Circle AppKit.
- `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`, `CIRCLE_WALLET_SET_ID`: credenciais de carteiras Circle.
- `PRIVY_APP_ID` e `PRIVY_APP_SECRET`: presentes na configuracao, embora o fluxo atual use Better Auth e Circle.
- `RESEND_API_KEY`: envio de e-mails.

Observacao: `constants.TELEGRAM_BOT_TOKEN` existe em `src/shared/constant.js`, mas essa variavel nao esta no schema de validacao e nao ha rota/servico Telegram ativo no projeto atual.

## Autenticacao e Ciclo de Usuarios

### Better Auth

O Better Auth fica montado em `/api/auth/{*any}`. Ele usa MongoDB como persistencia e aceita login por:

- Twitter/X;
- Google.

Configuracoes importantes:

- sessoes com expiracao de 7 dias;
- cache de cookie por 7 dias;
- account linking habilitado;
- permissao para vincular contas com e-mails diferentes;
- origem confiavel definida por `FRONTEND_URL`;
- cookie `state` com `sameSite: "none"` e `secure: true`.

### Criacao e Vinculo de Usuario

Quando uma conta e criada pelo Better Auth, o hook em `src/lib/auth.js` executa a logica de usuario:

- busca perfil Google quando necessario para obter e-mail confiavel;
- procura usuario existente por `userId`;
- se nao encontrar, procura por `gmailAddress` para Google ou `twitterId` para Twitter/X;
- se encontrar um usuario parcial, vincula os campos faltantes;
- se nao encontrar, cria uma carteira Circle SCA e grava um novo registro em `user_agent`.

O usuario do dominio contem:

- `userId`: id do Better Auth;
- `twitterId`: id da conta do X/Twitter, quando vinculado;
- `gmailAddress`: endereco Gmail, quando vinculado;
- `walletId`: id da carteira Circle;
- `address`: endereco EVM da carteira.

### Carteira Circle

`src/lib/wallet-provider-circle.js` cria carteiras SCA no wallet set configurado. Cada chamada cria uma carteira com suporte a:

- `ARC-TESTNET`;
- `ETH-SEPOLIA`;
- `AVAX-FUJI`;
- `ARB-SEPOLIA`;
- `BASE-SEPOLIA`;
- `OP-SEPOLIA`;
- `MATIC-AMOY`.

## API HTTP

Todas as rotas em `/api/user` e `/api/blockchain` exigem sessao valida pelo middleware `src/middleware/auth.js`. Sem sessao, retornam `401 Unauthorized`.

### Auth

Base: `/api/auth/{*any}`

Funcionalidade:

- endpoints gerenciados pelo Better Auth;
- login/logout;
- callback OAuth;
- leitura e manutencao de sessao;
- vinculacao e remocao de contas, conforme APIs do Better Auth.

### Usuario

Base: `/api/user`

#### `GET /api/user/`

Carrega os dados do usuario autenticado.

Retorno em sucesso:

- `userId`;
- `address`;
- `walletId`;
- `twitterId`;
- `gmailAddress`;
- `avatar`: imagem vinda da sessao;
- `name`: nome vindo da sessao.

Erros:

- `404` quando o usuario nao existe na collection `user_agent`;
- `401` quando nao autenticado.

#### `POST /api/user/withdraw`

Retira USDC ou EURC da carteira do usuario para um endereco externo.

Entrada esperada:

- `to`: endereco EVM de destino;
- `value`: valor;
- `token`: `USDC` ou `EURC`; se omitido, o servico assume USDC;
- `chain`: rede desejada; se omitida, usa Arc Testnet.

Comportamento:

- valida se o usuario existe;
- resolve a rede conforme token;
- consulta `decimals()` e `balanceOf(address)` no contrato do token;
- bloqueia a retirada se o saldo for insuficiente;
- cria uma transacao Circle para o endereco de destino;
- aguarda ate 60 segundos por estado terminal;
- registra metrica `TRANSACTION` em caso de sucesso.

#### `POST /api/user/chat`

Executa o agente via canal web.

Entrada esperada:

- `message`: texto do usuario.

Comportamento:

- valida mensagem nao vazia;
- garante que o usuario exista;
- envia o texto ao agente com contexto `{ authorId: userId, channel: "web" }`;
- retorna `response` com o conteudo textual produzido pelo agente.

#### `POST /api/user/faucet`

Solicita faucet da Circle para a carteira do usuario na Arc Testnet.

Comportamento:

- valida usuario e endereco;
- chama `https://api.circle.com/v1/faucet/drips`;
- solicita `usdc: true` e `eurc: true`;
- usa `blockchain: "ARC-TESTNET"` e `native: false`.

#### `GET /api/user/payment-contacts`

Lista os contatos de pagamento do usuario autenticado.

Retorno:

- `contacts`: lista com `id`, `label`, `address`, `chainPreference`, `createdAt` e `updatedAt`.

#### `POST /api/user/payment-contacts`

Cria um contato de pagamento para uso no frontend e nas transferencias do agente.

Entrada esperada:

- `label`: nome amigavel, como `Pai`, `Minha Ledger` ou `Fornecedor`;
- `address`: endereco EVM;
- `chainPreference`: rede preferida opcional.

Regras:

- labels sao por usuario;
- label e normalizada sem acentos e sem diferenca entre maiusculas/minusculas;
- termos reservados como `usdc`, `eurc`, `base`, `ethereum`, `twitter` e `gmail` sao bloqueados;
- labels duplicadas para o mesmo usuario retornam `409 CONFLICT`.

#### `PUT /api/user/payment-contacts/:id`

Atualiza label, endereco e/ou rede preferida de um contato existente do usuario autenticado.

#### `DELETE /api/user/payment-contacts/:id`

Remove um contato de pagamento do usuario autenticado.

### Blockchain

Base: `/api/blockchain`

#### `POST /api/blockchain/create-token`

Cria um token ERC-20 na Arc Testnet.

Entrada esperada:

- `name`: nome do token;
- `symbol`: simbolo;
- `supply`: supply inicial.

Comportamento:

- valida usuario;
- usa Circle Smart Contract Platform para fazer deploy de contrato ERC-20;
- usa ABI e bytecode de `src/abi`;
- define o usuario como recebedor do supply inicial;
- aguarda ate 60 segundos pelo contrato em estado `COMPLETE`;
- registra metrica `TOKEN_CREATED`;
- retorna endereco do contrato e hash da transacao.

#### `POST /api/blockchain/transfer-stablecoin`

Transfere USDC ou EURC para um endereco EVM.

Entrada esperada:

- `to`: endereco EVM de destino ou label de contato de pagamento;
- `value`: valor;
- `token`: `USDC` ou `EURC`;
- `chain`: rede desejada; se omitida, usa Arc Testnet.

Comportamento:

- resolve a rede suportada conforme o token;
- se `to` nao for endereco EVM, tenta resolver como contato salvo do usuario;
- consulta saldo do usuario;
- para USDC, se faltar saldo na rede de destino, tenta auto-bridge a partir de outras redes suportadas;
- para EURC, se faltar saldo na rede de destino, retorna erro de saldo insuficiente;
- executa transferencia Circle;
- aguarda confirmacao;
- registra metrica `TRANSACTION`.

### Metricas

Base: `/api/stats`

#### `GET /api/stats/`

Retorna metricas agregadas do sistema.

Retorno:

- `totalUsers`: total de usuarios em `user_agent`;
- `volumeUsdc`: soma de transacoes USDC;
- `volumeEurc`: soma de transacoes EURC;
- `totalTransactions`: quantidade de metricas do tipo `TRANSACTION`;
- `tokensCreated`: quantidade de metricas do tipo `TOKEN_CREATED`.

Observacao: nao ha endpoint publico para registrar metricas manualmente. O registro acontece internamente via `src/shared/record-metric.js`.

## Agente de IA

O agente fica em `src/lib/agent.js`.

Caracteristicas:

- usa `ChatOpenAI` com temperatura `0.2`;
- usa o modelo definido em `LLM_MODEL`;
- carrega o prompt de sistema em `src/prompts/agent.txt`;
- registra ferramentas LangChain a partir de `src/tools`;
- recebe contexto com `authorId` e `channel`;
- aceita canais `twitter`, `telegram` e `web` no schema, embora apenas `twitter` e `web` estejam integrados no fluxo atual;
- tenta interpretar a resposta final como JSON;
- se houver texto extra, tenta extrair o primeiro bloco JSON;
- se nao conseguir parsear, retorna `{ content, success: false, ignored: false }`.

Formato final esperado pelo prompt:

```json
{
  "content": "mensagem curta para o usuario",
  "success": true,
  "ignored": false
}
```

`ignored: true` e usado para mencoes sem comando acionavel, evitando resposta publica do bot.

## Monitoramento do X/Twitter

O servico fica em `src/twitter.js` e usa `src/lib/x-client.js`.

Fluxo:

1. o agente e instanciado na carga do modulo;
2. `startTwitterService()` e chamado apos a conexao com o MongoDB;
3. o primeiro ciclo roda 5 segundos depois;
4. os ciclos seguintes rodam a cada 1.050.000 ms, aproximadamente 17,5 minutos;
5. em paralelo, o bot busca mencoes recentes e eventos recentes de DM;
6. o fluxo de mencoes busca ate 5 mencoes recentes da propria conta;
7. usa `sinceId` estatico para evitar reprocessamento de mencoes;
8. para cada mencao, busca usuario local por `twitterId`;
9. se o usuario nao existir, ignora a mencao;
10. envia o texto ao agente com canal `twitter`;
11. se `ignored` for verdadeiro, nao responde;
12. se houver resposta, limita a 280 caracteres e responde no mesmo tweet;
13. no fluxo de DM, mensagens recebidas com comando de saque e endereco EVM acionam o saque da transferencia social pendente.

Funcionalidades do cliente X/Twitter:

- buscar o proprio usuario autenticado;
- buscar mencoes;
- buscar eventos recentes de DM;
- buscar usuario por `username`;
- responder tweets;
- enviar DM por id de participante.

## Ferramentas Disponiveis para o Agente

### `createERC20Token`

Cria um token ERC-20 na Arc Testnet.

Parametros:

- `name`;
- `symbol`;
- `supply`, com default `1000000000`.

Usa `CreateErc20Factory` e retorna contrato/hash quando concluido.

### `transferUsdc`

Transfere USDC para endereco EVM ou contato de pagamento salvo.

Parametros:

- `to`: endereco EVM ou label de contato;
- `value`;
- `chain` opcional.

Suporta as redes USDC mapeadas. Default de rede: Arc Testnet. Se `to` for uma label, o backend resolve a carteira usando os contatos do usuario.

### `transferUsdcToUsername`

Transfere USDC para um destinatario identificado por `@username`.

Parametros:

- `to`: handle com `@`;
- `value`.

Restricao:

- o servico aceita apenas canal `twitter`.

Comportamento:

- resolve o usuario no X/Twitter;
- procura ou cria carteira local para o `twitterId` do destinatario;
- transfere USDC;
- registra a transferencia em `social_transfers` para permitir saque por DM;
- envia DM de recibo ao destinatario quando possivel.

### `transferUsdcToGmail`

Transfere USDC para um destinatario identificado por Gmail.

Parametros:

- `to`: endereco `@gmail.com`;
- `value`.

Comportamento:

- aceita apenas Gmail como destinatario;
- procura ou cria carteira local para o Gmail;
- transfere USDC;
- envia recibo por e-mail via Resend.

### `transferEurc`

Transfere EURC para endereco EVM ou contato de pagamento salvo.

Parametros:

- `to`: endereco EVM ou label de contato;
- `value`;
- `chain` opcional.

Default de rede: Arc Testnet. Se `to` for uma label, o backend resolve a carteira usando os contatos do usuario.

### `transferEurcToUsername`

Funcionalidade pretendida: transferir EURC para `@username`.

Parametros:

- `to`;
- `value`.

Usa a mesma factory de stablecoins sociais com `token: "EURC"`, criando ou reutilizando a carteira vinculada ao `twitterId` do destinatario.

### `transferEurcToGmail`

Transfere EURC para Gmail.

Parametros:

- `to`;
- `value`.

Comportamento:

- procura ou cria carteira local para o Gmail;
- transfere EURC na rede padrao Arc Testnet;
- envia recibo por e-mail.

### `transferERC20Token`

Transfere token ERC-20 customizado para endereco EVM ou contato de pagamento salvo na Arc Testnet.

Parametros:

- `to`: endereco EVM ou label de contato;
- `value`;
- `token`: endereco do contrato ERC-20.

Comportamento:

- consulta `decimals()` e saldo do token;
- executa `transfer(address,uint256)` no contrato;
- aguarda confirmacao;
- registra metrica `TRANSACTION` com token `ERC20`.

### `transferERC20TokenToUsername`

Transfere token ERC-20 customizado para `@username` na Arc Testnet.

Parametros:

- `to`: handle com `@`;
- `value`;
- `token`: endereco do contrato ERC-20.

Restricao:

- o servico aceita apenas canal `twitter`.

Comportamento:

- resolve o usuario no X/Twitter;
- cria carteira para o destinatario se necessario;
- executa `transfer(address,uint256)`;
- registra a transferencia em `social_transfers` para permitir saque por DM;
- envia DM de recibo.

### `transferERC20TokenToGmail`

Transfere token ERC-20 customizado para Gmail na Arc Testnet.

Parametros:

- `to`: endereco `@gmail.com`;
- `value`;
- `token`: endereco do contrato ERC-20.

Comportamento:

- cria carteira para o Gmail se necessario;
- executa `transfer(address,uint256)`;
- envia recibo por e-mail.

## Saque por DM no X/Twitter

Quando uma transferencia e enviada para `@username`, o backend registra a operacao na collection `social_transfers` com status `PENDING`. O destinatario recebe uma DM com instrucao para sacar sem entrar na plataforma.

Comando aceito por DM:

```text
withdraw 0xYourWalletAddress
```

Tambem sao aceitas variacoes com verbos como `sacar`, `saca`, `envia`, `manda`, `transfer` e `transferir`, desde que a mensagem contenha um endereco EVM valido.

Fluxo:

1. remetente envia USDC, EURC ou ERC-20 para `@username`;
2. o sistema resolve o `twitterId` do destinatario e cria/reutiliza uma carteira Circle vinculada a ele;
3. a transferencia on-chain acontece para a carteira social do destinatario;
4. o backend grava uma entrada `PENDING` em `social_transfers`;
5. o bot envia DM de recibo com o comando de saque;
6. o loop do Twitter tambem le DMs recentes;
7. se a DM vier do mesmo `twitterId` salvo e trouxer um endereco `0x...`, o backend transfere da carteira social para o endereco informado;
8. a entrada vira `WITHDRAWN` e guarda `withdrawTxHash`, `withdrawTo`, `withdrawDmEventId` e `withdrawnAt`.

Por padrao, uma mensagem como `withdraw 0x...` saca a transferencia pendente mais recente daquele usuario. Se a mensagem contiver `all`, `tudo`, `todos`, `total` ou `saldo`, o sistema tenta sacar todas as transferencias pendentes do `twitterId`.

Campos principais de `social_transfers`:

- `senderUserId` e `senderAddress`;
- `recipientTwitterId` e `recipientUsername`;
- `recipientWalletId` e `recipientAddress`;
- `token`: `USDC`, `EURC` ou `ERC20`;
- `tokenAddress` e `tokenDecimals`, quando ERC-20;
- `amount`, `chain`, `originalTxHash`;
- `status`: `PENDING` ou `WITHDRAWN`;
- `withdrawTxHash`, `withdrawTo`, `withdrawDmEventId`;
- `createdAt` e `withdrawnAt`.

### `bridge_usdc`

Executa bridge de USDC entre redes suportadas.

Parametros:

- `fromChain`;
- `toChain`;
- `value`.

Comportamento:

- resolve aliases de rede;
- usa Circle AppKit e Circle Wallets Adapter;
- executa bridge de USDC;
- registra metrica `TRANSACTION` em sucesso;
- retorna mensagem com origem, destino e, quando disponivel, explorer URL.

## Redes Suportadas

### USDC

USDC suporta as seguintes redes no mapa do sistema:

| Chave interna | Circle | Bridge/AppKit | Aliases aceitos |
| --- | --- | --- | --- |
| `ethereum_sepolia` | `ETH-SEPOLIA` | `Ethereum_Sepolia` | ethereum, eth, ethereum sepolia, eth sepolia, sepolia |
| `avalanche_fuji` | `AVAX-FUJI` | `Avalanche_Fuji` | avalanche, avax, avalanche fuji, avax fuji, avalanche testnet, avax testnet |
| `arbitrum_sepolia` | `ARB-SEPOLIA` | `Arbitrum_Sepolia` | arbitrum, arb, arbitrum sepolia |
| `arc_testnet` | `ARC-TESTNET` | `Arc_Testnet` | arc, arc testnet, arc network |
| `base_sepolia` | `BASE-SEPOLIA` | `Base_Sepolia` | base, base testnet, base sepolia |
| `optimism_sepolia` | `OP-SEPOLIA` | `Optimism_Sepolia` | op, op sepolia, optimism, optimism sepolia |
| `polygon_amoy` | `MATIC-AMOY` | `Polygon_Amoy_Testnet` | polygon, poly, polygon amoy, poly amoy, polygon testnet |

### EURC

EURC suporta as seguintes redes no mapa do sistema:

| Chave interna | Circle | Bridge/AppKit | Aliases aceitos |
| --- | --- | --- | --- |
| `arc_testnet` | `ARC-TESTNET` | `Arc_Testnet` | arc, arc testnet, arc network |
| `ethereum_sepolia` | `ETH-SEPOLIA` | `Ethereum_Sepolia` | ethereum, eth, ethereum sepolia, eth sepolia, sepolia |
| `avalanche_fuji` | `AVAX-FUJI` | `Avalanche_Fuji` | avalanche, avax, avalanche fuji, avax fuji, avalanche testnet, avax testnet |
| `base_sepolia` | `BASE-SEPOLIA` | `Base_Sepolia` | base, base testnet, base sepolia |

EURC nao esta mapeado para Arbitrum Sepolia, Optimism Sepolia ou Polygon Amoy.

## Auto-Bridge de USDC

As transferencias de USDC por endereco, Gmail ou X/Twitter possuem codigo para protecao de saldo na rede de destino.

Quando o saldo USDC na rede escolhida e insuficiente:

1. o servico calcula o deficit;
2. adiciona buffer de `0.50` USDC para cobrir possiveis custos do bridge;
3. consulta saldo USDC nas outras redes suportadas;
4. monta um plano usando redes com maior saldo primeiro;
5. executa bridges em paralelo via Circle AppKit;
6. registra metricas `BRIDGE` para cada bridge executado;
7. continua a transferencia se os bridges tiverem sucesso.

Atencoes tecnicas:

- o auto-bridge esta completo em `src/service/blockchain/transfer-stablecoin.js`, usado por transferencias para endereco EVM;
- os servicos `transfer-stablecoin-to-gmail.js` e `transfer-stablecoin-to-username-twitter.js` tambem chamam `appKit.bridge(...)`, mas nao declaram/importam `appKit` e `adapter`; se o caminho de saldo insuficiente for acionado nesses servicos, a operacao tende a falhar em runtime;
- o modelo de metricas (`MetricEvent`) aceita apenas `TRANSACTION` e `TOKEN_CREATED`; como os servicos tentam registrar `BRIDGE`, esses registros sao descartados silenciosamente por `recordMetric()`. Portanto, bridges automaticos podem acontecer, mas nao entram hoje nas metricas agregadas.

## Servicos Internos Nao Expostos Atualmente

Existem servicos/factories implementados que nao estao ligados as rotas Express nem ao registro de ferramentas do agente.

### Swap

Arquivos:

- `src/service/blockchain/swap.js`;
- `src/factory/blockchain/swap.js`.

Funcionalidade:

- usa Circle AppKit para executar swap na `Arc_Testnet`;
- recebe `tokenIn`, `tokenOut` e `value`;
- retorna `txHash`, `amountOut`, `amountIn` e `explorerUrl`.

Status:

- implementado internamente;
- nao exposto por rota;
- nao registrado como ferramenta do agente.

### Deposit Unified USDC

Arquivo:

- `src/service/blockchain/deposit-unified-usdc.js`.

Funcionalidade pretendida:

- aprovar USDC para um gateway;
- depositar USDC no gateway configurado.

Enderecos constantes:

- `GATEWAY_WALLET_ADDRESS`;
- `GATEWAY_MINTER_ADDRESS`.

Status:

- implementado internamente;
- nao exposto por rota;
- nao registrado como ferramenta do agente.

Atencao tecnica:

- o arquivo usa `left(...)`, mas nao importa `left` de `shared/either.js`;
- chamadas `this.approve(...)` e `this.deposit(...)` nao usam `await` antes de acessar `data?.id`;
- do jeito atual, precisa revisao antes de ser exposto.

## Persistencia de Dados

### Collection `user_agent`

Usada por `src/database/user-repository.js`.

Campos gravados:

- `userId`;
- `walletId`;
- `address`;
- `twitterId`;
- `gmailAddress`.

Uso:

- vinculo de usuario autenticado;
- resolucao de destinatarios por Twitter/X ou Gmail;
- descoberta da carteira de origem para transacoes.

### Collection `agent_metrics`

Usada por `src/database/metric-repository.js`.

Campos gravados:

- `type`;
- `token`;
- `amount`;
- `chain`;
- `userId`;
- `createdAt`.

Tipos validos no entity atual:

- `TRANSACTION`;
- `TOKEN_CREATED`.

Tokens validos no entity atual:

- `USDC`;
- `EURC`;
- `ERC20`.

### Collection `social_transfers`

Usada por `src/database/social-transfer-repository.js`.

Armazena transferencias para destinatarios do X/Twitter que podem ser sacadas por DM sem login na plataforma.

### Collection `payment_contacts`

Usada por `src/database/payment-contact-repository.js`.

Armazena contatos de pagamento criados pelo frontend para cada usuario.

Campos principais:

- `id`;
- `userId`;
- `label`;
- `normalizedLabel`;
- `address`;
- `chainPreference`;
- `createdAt`;
- `updatedAt`.

### Collections do Better Auth

O Better Auth usa o adapter MongoDB e cria/usa suas proprias collections para usuarios, contas e sessoes, conforme a biblioteca.

### Checkpoints do LangGraph

`src/lib/agent.js` instancia `MongoDBSaver` com collections `checkpoint` e `checkpoint_writes`, mas o checkpointer esta comentado na criacao do agente. Assim, memoria/checkpoint persistente do agente nao esta ativa no estado atual.

## Seguranca e Middlewares

### Helmet

`src/middleware/security.js` aplica Helmet com CSP basica:

- `defaultSrc 'self'`;
- `styleSrc 'self' 'unsafe-inline'`;
- `scriptSrc 'self'`;
- `imgSrc 'self' data: https:`;
- `crossOriginEmbedderPolicy: false`.

### CORS

CORS esta configurado com:

- `origin: true`;
- `credentials: true`;
- metodos `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.

Observacao: embora `FRONTEND_URL` seja usado como trusted origin no Better Auth, o CORS Express atual aceita qualquer origem refletida.

### Rate Limit

Rate limit geral:

- janela de 15 minutos;
- limite de 100 requisicoes por IP;
- aplicado depois de `express.json()`.

Rate limit de autenticacao:

- existe como `authRateLimiter`;
- limite de 10 tentativas por 15 minutos;
- nao esta aplicado em `src/main.js` no estado atual.

### Tratamento de Erros

Middlewares registrados:

- `request-logger`;
- `not-found`;
- `error-handler`.

O padrao dos services usa `Either` (`left`/`right`) para separar sucesso e falha sem lancar excecoes em fluxos esperados.

## Notificacoes e Recibos

### E-mail

Transferencias para Gmail enviam recibo via Resend.

Template:

- `src/templates/emails/transferReceipt.js`.

Remetente default:

- `Einherjar <info@einherjar.online>`.

Envio:

- fire-and-forget;
- falhas de envio sao logadas, mas nao bloqueiam a transacao.

### DM no X/Twitter

Transferencias para `@username` tentam enviar DM ao destinatario.

Template:

- `src/templates/dms/transferReceipt.js`.

Envio:

- fire-and-forget;
- falhas sao registradas no console, mas nao bloqueiam a resposta principal.

## Logs

O projeto possui logs em `logs/` e usa `src/lib/logger.js` para registrar eventos relevantes.

Arquivos observados:

- `logs/combined.log`;
- `logs/error.log`;
- `logs/exceptions.log`;
- `logs/rejections.log`.

## Funcionalidades por Canal

### API Web

Disponivel por REST:

- login/sessao via Better Auth;
- carregar usuario;
- chat com agente;
- faucet;
- saque para endereco externo;
- criacao de token;
- transferencia de stablecoin para endereco EVM;
- consulta de metricas.

### Chat Web com Agente

Disponivel via `POST /api/user/chat`:

- interpreta linguagem natural;
- pode acionar ferramentas registradas no agente;
- usa o usuario autenticado como autor da operacao.

### X/Twitter

Disponivel via monitoramento de mencoes:

- interpreta comandos em tweets;
- ignora mencoes sem comando;
- executa ferramentas do agente;
- responde no tweet com ate 280 caracteres;
- permite transferencias para handles do X/Twitter;
- envia DMs de recibo para destinatarios quando aplicavel.

### Telegram

Estado atual:

- o schema do agente aceita `telegram`;
- `package.json` inclui `node-telegram-bot-api`;
- nao ha bot Telegram inicializado, rota Telegram ou integracao ativa no codigo analisado.

## Observacoes Tecnicas Importantes

- `DOCUMENTACAO_SISTEMA.md` anterior descrevia `POST /api/stats/record` e `GET /api/stats/metrics`, mas o codigo atual expoe apenas `GET /api/stats/`.
- Transferencias para Gmail aceitam somente enderecos terminados em `@gmail.com`.
- Ferramentas para `@username` exigem canal `twitter`; se chamadas pelo chat web, retornam `Invalid channel`.
- ERC-20 customizado opera na `ARC-TESTNET`.
- USDC tem suporte multichain e auto-bridge.
- EURC tem mapa de redes menor e nao faz auto-bridge quando falta saldo.
- O prompt exige resposta final em JSON cru com `content`, `success` e `ignored`.
- O checkpointer MongoDB do agente esta preparado, mas desativado.
- O rate limiter especifico de autenticacao esta definido, mas nao aplicado.
- A metrica `BRIDGE` e tentada por alguns services, mas o entity atual nao aceita esse tipo.
- O auto-bridge de USDC para Gmail e X/Twitter referencia `appKit` e `adapter` sem declara-los/importa-los nos respectivos arquivos de service.

## Mapa Resumido de Arquitetura

```text
src/main.js
  -> Express
  -> Better Auth em /api/auth/{*any}
  -> /api/user
  -> /api/blockchain
  -> /api/stats
  -> MongoDB
  -> Twitter service

src/lib/agent.js
  -> ChatOpenAI
  -> src/prompts/agent.txt
  -> tools de blockchain
  -> factories
  -> services
  -> repositories
  -> Circle / X / Resend / MongoDB
```

## Estrutura de Pastas

```text
src/
  abi/          ABI e bytecode de contratos usados pelo deploy/execucao.
  config/       Validacao de variaveis de ambiente.
  database/     Cliente MongoDB e repositories.
  entity/       Entidades de dominio e validacoes.
  factory/      Montagem de services com dependencias.
  lib/          Agent, auth, logger, clientes Circle/X/Resend.
  middleware/   Auth, seguranca, logger, 404 e error handler.
  prompts/      Prompt de sistema do agente.
  router/       Rotas Express.
  service/      Casos de uso e integracoes de negocio.
  shared/       Utilitarios, constantes, Either, resolucao de redes.
  templates/    Templates de e-mail e DM.
  tools/        Ferramentas LangChain expostas ao agente.
  main.js       Entrada HTTP.
  twitter.js    Loop de monitoramento do X/Twitter.
```
