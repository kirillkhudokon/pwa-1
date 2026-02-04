import { Component } from "../core/component";

export default class Error404Page extends Component{
  render() {
    this.el.innerHTML = `<div>
      <h1>Error 404</h1>
      <a href="/">Начать с главной</a>
    </div>`;
  }
}