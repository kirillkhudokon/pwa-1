import { AxiosError } from "axios";
import type { LoginBody } from "../../api/auth";
import { api, connectDb } from "../../container";
import { Component } from "../../core/component";
import { formToObject } from "../../shared/forms";

type AuthLoginState = {
  form: LoginBody,
  errors: Partial<LoginBody>,
  pending: boolean
}

export default class AuthLoginPage extends Component{
  state: AuthLoginState = {
    form: {
      login: '',
      password: ''
    },
    errors: {},
    pending: false
  }

  async setup(): Promise<void> {
    const cmp = this;

    this.on<HTMLFormElement>('submit', '.authForm', async function(e){
      e.preventDefault();
      const form = formToObject<LoginBody>(this);
      cmp.setState({ form, errros: {}, pending: true });

      try{
        const response = await api.auth.login(form);
        const db = await connectDb();
        await db.put('auth', response.token, 'token');
        document.location = '/';
      }
      catch(e){
        if(e instanceof AxiosError && e.status === 422){
          cmp.setState({ 
            errors: Object.fromEntries(e.response!.data), 
            pending: false 
          })
        }
        else{
          console.log(e);
          cmp.setState({ errors: { password: 'Unknown server error' }, pending: false })
        }
      }
    })
  }

  render() {
    const { form, errors, pending } = this.state;

    this.el.innerHTML = `<div>
      <h1>Enter to site</h1>
      <hr>
      <form class="authForm">
        <div class="mb-1">
          <label class="form-label">Login</label>
          <input name="login" type="text" class="form-control" value="${form.login}">
          <div class="text-danger">${errors.login ?? '&nbsp;'}</div>
        </div>
        <div class="mb-1">
          <label class="form-label">Password</label>
          <input name="password" type="text" class="form-control" value="${form.password}">
          <div class="text-danger">${errors.password ?? '&nbsp;'}</div>
        </div>
        <button class="btnSend btn btn-primary" ${pending ? 'disabled' : ''}>Enter now</button>
      </form>
    </div>`;
  }
}