import axios from "axios";
import initApi from "./api";

const http = axios.create({
  baseURL: 'http://localhost:3001',
  adapter: 'fetch'
});

// es module singletoon
export const api = initApi(http);