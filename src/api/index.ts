import type { AxiosInstance } from "axios";
import initAuthApi from "./auth";
import initPostsApi from "./posts";
import initImagesApi from "./images";
import initCommentsApi from "./comment";

export default function initApi(http: AxiosInstance){
  const auth = initAuthApi(http);
  const posts = initPostsApi(http);
  const images = initImagesApi(http);
  const comments = initCommentsApi(http);

  return {
    auth,
    posts,
    images,
    comments
  }
}

export type ApiInstance = ReturnType<typeof initApi>