# Backend - Agent Privy Better

Este é o componente backend do **Agent Privy Better**, uma aplicação avançada que orquestra a interação entre Inteligência Artificial, Blockchain (carteiras Privy, Tokens ERC20 e Transferências Cross-chain) e Redes Sociais (Twitter). O sistema utiliza agentes autônomos baseados em **LangChain** e **GPT-4** para entender comandos em linguagem natural e executar operações complexas on-chain.

## 🚀 Tecnologias e Stack

O projeto utiliza um conjunto moderno de ferramentas para garantir escalabilidade, segurança e eficiência:

*   **Runtime & Framework**: [Node.js](https://nodejs.org/) (ES Modules), [Express.js](https://expressjs.com/)
*   **Inteligência Artificial**: [LangChain](https://js.langchain.com/), [OpenAI API](https://openai.com/) (GPT-4)
*   **Blockchain & Wallets**:
    *   [Privy](https://privy.io/) (Embedded Wallets & Auth)
    *   [Circle](https://www.circle.com/) (Cross-chain Transfer Protocol - CCTP)
    *   [Viem](https://viem.sh/) (Interação EVM)
*   **Autenticação**: [Better Auth](https://better-auth.com/)
*   **Banco de Dados**: [MongoDB](https://www.mongodb.com/)
*   **Social**: [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)

---

## ✨ Funcionalidades Principais

### 🤖 Agente de IA (Twitter Bot)

O coração do sistema é o agente de IA (`src/lib/agent.js`) que monitora o Twitter em busca de menções e comandos. Ele é capaz de interpretar a intenção do usuário e executar as seguintes ferramentas (**Tools**):

1.  **Criação de Tokens (ERC20)**: Cria novos tokens na blockchain especificada.
    *   *Comando Exemplo*: "Crie um token chamado 'MyToken' com símbolo 'MTK'..."
2.  **Transferência de Tokens (ERC20)**: Envia tokens ERC20 para um endereço de carteira.
3.  **Transferência de Tokens para @Username**: Envia tokens ERC20 diretamente para um usuário do Twitter (resolve o endereço da carteira associada).
4.  **Transferência de Ativos Nativos**: Envia ETH (ou a moeda nativa da rede) para um endereço.
5.  **Transferência de Ativos Nativos para @Username**: Envia ETH diretamente para um usuário do Twitter.
6.  **Transferência Cross-chain**: Move ativos (USDC/EURC) entre diferentes blockchains utilizando o protocolo da **Circle**.

### 🔐 Autenticação e Usuários

*   Integração completa com **Better Auth** para gerenciamento seguro de sessões.
*   Vinculação de contas sociais e carteiras via **Privy**.
*   API REST para gerenciamento de perfis de usuário (`/api/user`).

---

## 🛠️ Instalação e Configuração

### Pré-requisitos

*   **Node.js** (v18 ou superior)
*   **MongoDB** (Local ou Atlas)
*   Chaves de API para: OpenAI, Twitter Developer Portal, Privy e Better Auth.

### Passo a Passo

1.  **Clone o repositório e acesse a pasta do backend:**
    ```bash
    cd backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do diretório `backend` e preencha com suas credenciais:

    ```env
    # Servidor & Aplicação
    PORT=3000
    FRONTEND_URL=http://localhost:5173 # URL do Frontend para CORS
    
    # Banco de Dados (MongoDB)
    MONGODB_URI=mongodb://localhost:27017
    MONGODB_NAME_DATABASE=agent_db
    
    # Autenticação (Better Auth)
    BETTER_AUTH_SECRET=sua_chave_secreta_super_segura
    
    # Inteligência Artificial (OpenAI / LangChain)
    LLM_API_KEY=sk-...
    LLM_MODEL=gpt-4o
    
    # Privy (Wallets & Auth)
    PRIVY_APP_ID=seu_app_id
    PRIVY_APP_SECRET=seu_app_secret
    
    # Twitter API v2 (OAuth 1.0a & 2.0)
    TWITTER_CLIENT_ID=
    TWITTER_CLIENT_SECRET=
    TWITTER_CONSUMER_KEY=
    TWITTER_CONSUMER_SECRET=
    TWITTER_ACCESS_TOKEN=
    TWITTER_ACCESS_SECRET=
    ```

---

## ▶️ Execução

Para iniciar o servidor em **modo de desenvolvimento** (com hot-reload):

```bash
npm run dev
```

Para iniciar em **modo de produção**:

```bash
npm start
```

O servidor estará rodando em `http://localhost:3000` (ou na porta definida no `.env`).

---

## 📂 Estrutura do Projeto

A organização do código segue uma arquitetura modular focada em serviços e ferramentas:

```bash
backend/
├── src/
│   ├── api/            # Definições auxiliares de API
│   ├── config/         # Configurações gerais e validação de env
│   ├── database/       # Conexão e cliente MongoDB
│   ├── factory/        # Factories para criação de serviços/casos de uso
│   ├── lib/            # Bibliotecas core (Agent, Auth, Twitter Client, Wallet Provider)
│   │   ├── agent.js            # Lógica principal do Agente LangChain
│   │   ├── auth.js             # Configuração do Better Auth
│   │   ├── twitter-client.js   # Cliente da API do Twitter
│   │   └── wallet-provider.js  # Abstração para provedores de carteira
│   ├── middleware/     # Middlewares Express (Logger, Error Handling)
│   ├── router/         # Rotas da API (ex: /api/user)
│   ├── service/        # Lógica de negócios
│   ├── tools/          # Ferramentas do Agente (Actions)
│   │   ├── create-erc20.js
│   │   ├── crosschain-transfer.js
│   │   ├── transfer-erc20.js
│   │   └── ...
│   ├── twitter.js      # Serviço de monitoramento e loop do Twitter Bot
│   └── main.js         # Ponto de entrada (Entry Point)
├── .env                # Variáveis de ambiente (não versionado)
└── package.json        # Dependências e scripts
```

---

## 📝 Scripts Disponíveis

*   `npm start`: Inicia a aplicação (produção).
*   `npm run dev`: Inicia a aplicação em modo *watch* (desenvolvimento).
