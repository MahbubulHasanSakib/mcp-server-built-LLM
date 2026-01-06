import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient } from "mongodb";
import { z } from "zod";
import {config} from 'dotenv'
config()

/* -----------------------------
   MongoDB Configuration
------------------------------ */
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;

/* -----------------------------
   Zod Schema
------------------------------ */
const InsertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  age: z.number().int().positive("Age must be a positive number")
});

/* -----------------------------
   MongoDB Connection
------------------------------ */
const client = new MongoClient(MONGO_URL||"mongodb://localhost:27017");
await client.connect();

const db = client.db(DB_NAME);
const users = db.collection("users");

/* -----------------------------
   MCP Server
------------------------------ */
const server = new McpServer({
  name: "mongo-users-mcp",
  version: "1.0.0"
});

/* -----------------------------
   Tool: insert_user
------------------------------ */
server.registerTool(
  "insert_user",
  {
    description: "Insert a new user into MongoDB",
    inputSchema: InsertUserSchema 
  },
  async (args: any) => {
    // Accept any shape from the transport and prefer args.input if present
    const input = args?.input ?? args;

    const parsed = InsertUserSchema.safeParse(input);

    if (!parsed.success) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: parsed.error.issues
              .map(i => `${i.path.join(".")}: ${i.message}`)
              .join(" | ")
          }
        ]
      };
    }

    const result = await users.insertOne({
      ...parsed.data,
      createdAt: new Date()
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ User inserted successfully. ID: ${result.insertedId}`
        }
      ]
    };
  }
);


/* -----------------------------
   STDIO Transport
------------------------------ */
const transport = new StdioServerTransport();
await server.connect(transport);

//console.log("🚀 MCP Server running 🚀");
