import type { PostOneResponse } from "../api/posts";
import { api } from "../container";
import { Component } from "../core/component";

export default class PostPage extends Component{
  post?: PostOneResponse

  async setup(): Promise<void> {
    try{
      this.post = await api.posts.one(this.props.id as string);
    }
    catch(_){
      // err 404 or mb other, check status AxiosError
    }
  }

  render() {
    const { post } = this;

    this.el.innerHTML = post ? `<div>
      <h1>${post.title}</h1>
    </div>` : '404';
  }
}