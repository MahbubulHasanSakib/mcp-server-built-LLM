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


const SearchSchema = z.object({
  collection: z.string().min(1, "Collection name is required"),

  query: z.record(z.string(), z.any()).optional().default({}),

  projection: z.record(z.string(), z.any()).optional(),

  limit: z.number().int().positive().max(100).optional().default(20),

  sort: z.record(z.string(), z.union([z.literal(1), z.literal(-1)])).optional(),
});

/* -----------------------------
   Tool: search_data
------------------------------ */

server.registerTool(
  "search_data",
  {
    description: "Search data from any MongoDB collection dynamically",
    inputSchema: SearchSchema,
  },
  async (args: any) => {
    // MCP sometimes sends payload under args.input
    const input = args?.input ?? args;

    // Validate input
    const parsed = SearchSchema.safeParse(input);
    if (!parsed.success) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: parsed.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join(" | "),
          },
        ],
      };
    }

    const { collection, query, projection, limit, sort } = parsed.data;

    try {
      const col = db.collection(collection);

      let cursor = col.find(query ?? {}, {
        projection: projection ?? undefined,
      });

      if (sort) {
        cursor = cursor.sort(sort);
      }
      if (limit) {
        cursor = cursor.limit(limit);
      }

      const results = await cursor.toArray();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `❌ Error searching data: ${error.message}`,
          },
        ],
      };
    }
  }
);


/* -----------------------------
   STDIO Transport
------------------------------ */
const transport = new StdioServerTransport();
await server.connect(transport);

//console.log("🚀 MCP Server running 🚀");
