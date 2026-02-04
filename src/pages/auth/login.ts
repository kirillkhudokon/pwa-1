import { Component } from "../../core/component";

export default class AuthLoginPage extends Component{

  async setup(): Promise<void> {
    this.on('click', 'button', function(e){
      console.log(this, e)
      // api.auth.login
    })
  }

  render() {
    this.el.innerHTML = `<div>
      <h1>Enter to site</h1>
      <hr>
      <form>
        <button>Enter</button>
      </form>
    </div>`;
  }
}