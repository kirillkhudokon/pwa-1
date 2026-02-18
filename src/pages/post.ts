import { AxiosError } from "axios";
import type { CommentCreateBody } from "../api/comment";
import type { PostOneResponse } from "../api/posts";
import type { Comment } from "../api/types/comments";
import { api, authUser, connectDb, DataEvent, eventBus, type IndexDB } from "../container";
import { Component } from "../core/component";
import { formToObject } from "../shared/forms";
import { nanoid } from "nanoid";

type PostState = {
  comments: Comment[],
  form: CommentCreateBody,
  errors: Partial<CommentCreateBody>,
  pending: boolean
}

export default class PostPage extends Component{
  state: PostState = {
    comments: [],
    form: { text: '', idk: nanoid(32) },
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

    this.state.comments = [
      ...(await db.getAll('commentsFailedStores'))
        .map(failedItemToComment)
        .filter(c => c.PostId == post.id),
      ...(await api.comments.all('post', this.post.id).catch(() => []))
    ]
    
    const record = await db.get('commentsForm', `post.${post.id}`);

    if(record){
      this.state.form = record.body;
    }
    
    this.on<HTMLTextAreaElement>('change', '.commentsForm [name=text]', function(){
      db.put('commentsForm', {
        itemKey: `post.${post.id}`,
        body: { text: this.value, idk: cmp.state.form.idk }
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
          form: { text: '', idk: nanoid(32) },
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
          const now = (new Date()).toUTCString();

          if(swr.sync){
            const failedItem: IndexDB['commentsFailedStores']['value'] = {
              key: Math.random() + '.' + Date.now(),
              item: 'post',
              itemId: post.id,
              body: form,
              user: authUser!,
              createdAt: now,
              updatedAt: now
            }

            await db.put('commentsFailedStores', failedItem)
            
            cmp.setState({ 
              errors: {},
              form: { text: '', idk: nanoid(32) },
              pending: false,
              comments: [
                failedItemToComment(failedItem),
                ...cmp.state.comments
              ]
            }); 
            
            swr.sync.register("comments-failed-store-retry");
          }
          else{
            console.log(e);
            cmp.setState({ errors: { text: 'Unknown server error' }, pending: false })
          }
        }
      }
    })

    eventBus.addEventListener("comments-failed-stored", (e) => {
      const { data } = (e as DataEvent<{ data: Comment[] }>).data;
      
      data.forEach(item => {
        /* very bad array search -> comments Map<idk, Comment>*/
        const idx = cmp.state.comments.findIndex(comment => item.idk == comment.idk);

        if(idx > -1){
          cmp.state.comments[idx] = item; // react shocked!
        }
      })

      this.render();
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
        <input type="hidden" name="idk" value="${form.idk}" >
        <div class="mb-2">
          <label class="form-label">Your comment</label>
          <textarea name="text" class="form-control">${form.text}</textarea>
          <div class="text-danger">${errors.text ?? '&nbsp;'}</div>
        </div>
        <button class="btnSend btn btn-primary" ${pending ? 'disabled' : ''}>Send comment</button>
      </form><hr>` : ''}
      <div>
        ${ comments.map(item => `<div class="alert alert-success">
          <div class="d-flex justify-content-between">
            <div>
              <strong>${ item.User.login }</strong> /
              <em>${ (new Date(item.createdAt)).toLocaleString() }</em>
            </div>
            ${ item.id == 0 ? `<div class="text-danger">
              (!) - sync
            </div>` : '' }
          </div>
          <hr/>
          ${ item.text }
        </div>`).join('') }
      </div>
    </div>` : '404'}`;
  }
}

function failedItemToComment(item: IndexDB['commentsFailedStores']['value']) : Comment{
  return {
    id: 0,
    UserId: item.user.id,
    User: item.user,
    text: item.body.text,
    idk: item.body.idk,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    PostId: item.itemId,
    ImageId: null
  }
}