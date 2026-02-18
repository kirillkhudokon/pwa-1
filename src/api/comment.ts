import type { AxiosInstance } from "axios";
import type { Comment, Commentables } from "./types/comments";

export default function initCommentsApi(http: AxiosInstance){
  return {
    async all(type: Commentables, id: number){
      const response = await http.get<Comment[]>(`/comments/${type}/${id}`);
      return response.data;
    },
    async create(type: Commentables, id: number, body: CommentCreateBody){
      const response = await http.post<Comment>(`/comments/${type}/${id}`, body);
      return response.data;
    },
    async remove(id: number){
      const response = await http.delete<boolean>(`/comments/${id}`);
      return response.data;
    },
  }
}

export type CommentCreateBody = {
  text: string,
  idk: string
}
