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

    if (!post) {
      this.el.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">404 - Пост не найден</h4>
          <p>К сожалению, запрашиваемый пост не существует или был удален.</p>
          <hr>
          <a href="/posts" class="btn btn-primary">Вернуться к постам</a>
        </div>
      `;
      return;
    }

    const createdDate = new Date(post.createdAt).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.el.innerHTML = `
      <article class="post-detail">
        <!-- Заголовок поста -->
        <div class="mb-4">
          <h1 class="display-4 mb-3">${post.title}</h1>
          
          <div class="d-flex align-items-center text-muted mb-3">
            <div class="me-3">
              <i class="bi bi-person-circle"></i>
              <span class="ms-1">${post.User.login}</span>
            </div>
            <div>
              <i class="bi bi-calendar3"></i>
              <span class="ms-1">${createdDate}</span>
            </div>
          </div>
          
          <hr>
        </div>
        <div class="post-content">
          <div class="card">
            <div class="card-body">
              <p class="card-text" style="white-space: pre-wrap; line-height: 1.6;">${post.content}</p>
            </div>
          </div>
        </div>
        <div class="mt-4 d-flex gap-2">
          <a href="/posts" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left"></i> Назад к постам
          </a>
        </div>
      </article>
    `;
  }
}