import { createClient } from "tinacms/dist/client";
import { queries } from "./types.js";
export const client = createClient({ url: "http://localhost:4001/graphql", token: "ea3c3b94a43d5306046e0c7b679e9ec7b298623b", queries });
export default client;
