export function formToObject<T>(
  form: HTMLFormElement
){
	return Object.fromEntries((new FormData(form)).entries()) as T;
}