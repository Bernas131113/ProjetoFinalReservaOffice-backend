# Reserva Office - Backend API

Este é o repositório do Backend para a aplicação **Reserva Office**. Trata-se de uma API RESTful desenvolvida em Node.js responsável por gerir a autenticação de utilizadores, a listagem de recursos (mesas, monitores, salas) e a lógica de criação e cancelamento de reservas.

---

## Tecnologias Utilizadas

* **Node.js** & **Express.js** (Servidor Web)
* **MySQL2** (Base de Dados Relacional com suporte a Promises)
* **JSON Web Tokens (JWT)** (Autenticação e Autorização)
* **Swagger** (Documentação interativa da API)
* **Cors** & **Dotenv** (Segurança e Variáveis de Ambiente)

---

## Estrutura do Projeto

A arquitetura do código segue o padrão de separação de responsabilidades (MVC adaptado para APIs):

```text
src/
├── config/         # Configuração da ligação à base de dados (db.js)
├── controllers/    # Lógica de negócio (auth, bookings, resources)
├── middlewares/    # Intercetores de segurança (verificação de JWT e Admin)
├── routes/         # Definição dos caminhos da API (Endpoints)
└── server.js       # Ponto de entrada e configuração do Express/Swagger

```

---

## Pré-requisitos

Para correres este servidor na tua máquina, precisas de ter instalado:

* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* [MySQL Server](https://dev.mysql.com/downloads/mysql/) ou um pacote como XAMPP/WAMP.
* [Git](https://git-scm.com/)

---

## Como Configurar e Correr Localmente

### 1. Instalação das Dependências

Navega até à raiz do projeto no teu terminal e corre:

```bash
npm install

```

### 2. Configuração da Base de Dados

1. Abre o gestor de MySQL (ex: MySQL Workbench).
2. Cria uma base de dados vazia chamada `reserva_office`.
3. Certifica-te de que as tabelas (`users`, `resources`, `bookings`) estão criadas. (Podes usar o script `src/seed.js` para popular a base de dados).

### 3. Variáveis de Ambiente

Cria um ficheiro chamado `.env` na raiz do projeto (ao lado do `package.json`) e adiciona as seguintes credenciais, ajustando os valores da base de dados consoante a tua máquina:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tua_password_aqui
DB_NAME=reserva_office
JWT_SECRET=o_meu_segredo_super_seguro_reserva_office_2026

```

### 4. Iniciar o Servidor

Para iniciar o servidor em modo de desenvolvimento (reinicia automaticamente ao guardar alterações):

```bash
npm run dev

```

Se vires a mensagem `Ligação à base de dados MySQL com sucesso` e `Servidor a correr na porta 5000`, está tudo pronto!

---

## Documentação da API (Swagger)

A API possui documentação automática e interativa gerada pelo Swagger.
Com o servidor a correr, abre o navegador e acede a:

**[http://localhost:5000/api-docs](https://www.google.com/search?q=http://localhost:5000/api-docs)**

A partir desta interface gráfica, é possível:

* Ver todas as rotas disponíveis (`/auth`, `/resources`, `/bookings`).
* Consultar os parâmetros e formatos JSON exigidos no `body`.
* Fazer pedidos de teste (Try it out) diretamente pelo navegador.
* Testar rotas protegidas introduzindo o Token no botão "Authorize".

---

## Autenticação

A grande maioria das rotas (ex: efetuar uma reserva) está protegida e requer um cabeçalho de autorização.
Para testar via Postman ou Swagger, deves:

1. Fazer `POST` para `/api/auth/login` com credenciais válidas.
2. Copiar o `token` devolvido.
3. Injetar o token no cabeçalho dos pedidos seguintes no formato: `Authorization: Bearer <teu_token>`.

---

**Desenvolvido por:** Bruno Garcia e Bernardo Alves - Projeto Final MVP

