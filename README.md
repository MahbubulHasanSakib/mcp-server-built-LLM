# MCP Mongo Users Server (TypeScript + Zod)

A **Model Context Protocol (MCP) server** written in TypeScript that inserts users into a **MongoDB database** with **type-safe validation using Zod**. Fully compatible with **MCP Inspector** for testing.

---

## 🚀 Features

- MCP server using **SDK v1.25.1**
- Strict input validation with **Zod**
- Inserts users into **MongoDB `users` collection**
- STDIO transport ready for **MCP Inspector**
- TypeScript ready for **Node.js 18+**
- Easily extendable for update/delete tools or HTTP transport

---

## 🛠 Prerequisites

- Node.js **v18+**
- MongoDB running locally (`mongodb://127.0.0.1:27017`)
- npm installed

---

## ⚡ Quick Start

Install dependencies, build, and run:

```bash
npm install       # Install dependencies
npm run build     # Compile TypeScript into dist/
npm start         # Start the MCP server
