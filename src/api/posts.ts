import type { AxiosInstance } from "axios";
import type { Post } from "./types/posts";
import type { Pagination, WithTimestamps } from "./types/general";
import type { User, WithUser } from "./types/user";
import type { Image } from "./types/images";

export default function initPostsApi(http: AxiosInstance){
  return {
    async all(params: PostAllQuery = {}){
      const response = await http.get<PostAllResponse>('/posts', { params })
      return response.data;
    },
    async my(){
      const response = await http.get<WithTimestamps<Post>[]>('/posts/my')
      return response.data;
    },
    async one(id: number | string){
      const response = await http.get<PostOneResponse>(`/posts/${id}`)
      return response.data;
    },
    async add(body: PostCreateBody){
      const response = await http.post<PostCreateResponse>('/posts', body);
      return response.data;
    },
    async update(id: number, body: PostCreateBody){
      const response = await http.put<PostCreateResponse>(`/posts/${id}`, body);
      return response.data;
    }
  }
}

export type PostAllQuery = {
  batch?: number,
  page?: number,
  order?: 'desc' | 'asc',
  with?: Array<'user' | 'images'>
}

export type PostAllResponse = {
  pagination: Pagination,
  data: Array<
    WithTimestamps<Post> & {
      User?: User
      Images?: Image[]
    }
  >
}

export type PostOneResponse = WithUser<WithTimestamps<Post>>;

type PostCreateBody = {
  url: string,
  title: string,
  content: string
}

type PostCreateResponse = WithTimestamps<Post>;