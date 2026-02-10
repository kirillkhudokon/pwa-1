import axios from "axios";
import initApi from "./api";
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { User } from "./api/types/user";
import type { CommentCreateBody } from "./api/comment";
import type { Commentables } from "./api/types/comments";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

http.interceptors.request.use(async config => {
  const db = await connectDb();
  const token = await db.get('auth', 'token');

  if(token){
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
})

// es module singletoon
export const api = initApi(http);
const { promise: dbPromise, resolve: dbResolve } = Promise.withResolvers<IDBPDatabase<IndexDB>>();
let dbConnected = false;

interface IndexDB extends DBSchema {
  auth: {
    key: 'token',
    value: string
  },
  commentsForm: {
    key: string,
    value: {
      itemKey: string,
      body: CommentCreateBody
    }
  },
  commentsFailedStores: {
    key: string,
    value: {
      key: string,
      item: Commentables,
      itemId: number,
      body: CommentCreateBody
    }
  } 
}

export function connectDb(){
  if(!dbConnected){
    dbConnected = true;
    console.log('try connect to db')

    openDB<IndexDB>('appDb', 13, {
      upgrade(db) {
        Array.from(db.objectStoreNames).forEach(name => {
          db.deleteObjectStore(name);
        })

        db.createObjectStore('auth');

        db.createObjectStore('commentsForm', {
          keyPath: 'itemKey'
        })

        db.createObjectStore('commentsFailedStores', {
          keyPath: 'key'
        })
      },
    }).then(db => {
      dbResolve(db)
    });
  }
  
  return dbPromise;
}

export let authUser: User | null = null;

export async function initUser(){
  const response = await api.auth.check().catch(() => ({ auth: false } as const));
  authUser = response.auth ? response.user : null;
}

