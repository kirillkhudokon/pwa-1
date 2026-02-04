import type { PostAllResponse } from "../api/posts";
import { api } from "../container";
import { Component } from "../core/component";

export default class PostsPage extends Component{
  state: {
    posts?: PostAllResponse;
  } = {
    posts: undefined
  }

  async setup(): Promise<void> {
    api.posts.all().then(data => this.setState({ posts: data }))
  }

  render() {
    const { posts } = this.state;

    this.el.innerHTML = posts 
      ? `<div>
        <h1>Posts page</h1>
        <div class="row">
          ${posts.data.map(post => `<div class="col col-4 mb-3">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">${post.title}</h5>
                <a href="/posts/${post.id}" class="btn btn-primary">Read more</a>
              </div>
            </div>
          </div>`).join('')}
        </div>
      </div>` 
      : 'Loading...';
  }
}