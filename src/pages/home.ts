import { Component } from "../core/component";

export default class HomePage extends Component{
  render() {
    this.el.innerHTML = `<div>
      <h1>Home page</h1>
    </div>`;
  }
}