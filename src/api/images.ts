import type { AxiosInstance } from "axios";
import type { Image, Imageables } from "./types/images";

export default function initImagesApi(http: AxiosInstance){
  return {
    async all(type: Imageables, id: number){
      const response = await http.get<Image[]>(`/images/${type}/${id}`);
      return response.data;
    },
    async upload(type: Imageables, id: number, form: ImagesUploadBody){
      const body = new FormData();
     
      for(const file of form["image[]"]){
        body.append("image[]", file);
      }

      const response = await http.post<Image>(`/images/${type}/${id}`, body, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      return response.data;
    },
    async one(id: number | string){
      const response = await http.get<Image>(`/images/${id}`);
      return response.data;
    },
    async remove(id: number){
      const response = await http.delete<boolean>(`/images/${id}`);
      return response.data;
    }
  }
}

export type ImagesUploadBody = {
  "image[]": File[]
}
