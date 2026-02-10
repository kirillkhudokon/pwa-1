import { AxiosError } from "axios";
import type { CommentCreateBody } from "../api/comment";
import type { PostOneResponse } from "../api/posts";
import type { Comment } from "../api/types/comments";
import { api, authUser, connectDb } from "../container";
import { Component } from "../core/component";
import { formToObject } from "../shared/forms";

type PostState = {
  comments: Comment[],
  form: CommentCreateBody,
  errors: Partial<CommentCreateBody>,
  pending: boolean
}

export default class PostPage extends Component{
  state: PostState = {
    comments: [],
    form: { text: '' },
    errors: {},
    pending: false
  }

  post?: PostOneResponse

  async setup(): Promise<void> {
    try{
      this.post = await api.posts.one(this.props.id as string);
    }
    catch(_){
      // err 404 or mb other, check status AxiosError
      console.log(_);
      return;
    }

    const cmp = this;
    const db = await connectDb();
    const post = this.post!;
    this.state.comments = await api.comments.all('post', this.post.id).catch(() => []);
    
    const record = await db.get('commentsForm', `post.${post.id}`);

    if(record){
      this.state.form = record.body;
    }
    
    this.on<HTMLTextAreaElement>('change', '.commentsForm [name=text]', function(){
      db.put('commentsForm', {
        itemKey: `post.${post.id}`,
        body: { text: this.value }
      })
    })

    this.on<HTMLFormElement>('submit', '.commentsForm', async function(e){
      e.preventDefault();
      const form = formToObject<CommentCreateBody>(this);
      cmp.setState({ form, errros: {}, pending: true });

      try{
        /* const comment =  */await api.comments.create('post', post.id, form);
        await db.delete('commentsForm', `post.${post.id}`);

        cmp.setState({
          errors: {},
          pending: false,
          form: { text: '' },
          comments: await api.comments.all('post', post.id).catch(() => [])
        })
      }
      catch(e){
        if(e instanceof AxiosError && e.status === 422){
          cmp.setState({ 
            errors: Object.fromEntries(e.response!.data), 
            pending: false 
          })
        }
        else{
          const swr = await navigator.serviceWorker.ready;

          if(swr.sync){
            await db.put('commentsFailedStores', {
              key: Math.random() + '.' + Date.now(),
              item: 'post',
              itemId: post.id,
              body: form
            })
            // swr reg event sync
            cmp.setState({ errors: { text: 'Maybe you is offline, it is not problem, we send message later in background mode' }}); // ui not good
            
            swr.sync.register("comments-failed-store-retry");
          }
          else{
            console.log(e);
            cmp.setState({ errors: { text: 'Unknown server error' }, pending: false })
          }
        }
      }
    })
  }

  render() {
    const { post } = this;
    const { form, errors, comments, pending } = this.state;

    this.el.innerHTML = `${post ? `<div>
      <h1>${post.title}</h1>
      <hr>
      <div>
        ${post.content}
      </div>
      <hr>
      ${ authUser ? `<form class="commentsForm">
        <div class="mb-2">
          <label class="form-label">Your comment</label>
          <textarea name="text" class="form-control">${form.text}</textarea>
          <div class="text-danger">${errors.text ?? '&nbsp;'}</div>
        </div>
        <button class="btnSend btn btn-primary" ${pending ? 'disabled' : ''}>Send comment</button>
      </form><hr>` : ''}
      <div>
        ${ comments.map(item => `<div class="alert alert-success">
          <strong>${ item.User.login }</strong>
          <hr/>
          ${ item.text }
        </div>`).join('') }
      </div>
    </div>` : '404'}`;
  }
}