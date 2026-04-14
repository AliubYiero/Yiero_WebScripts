export class NotLoginError extends Error {
  constructor() {
    super('User not logged in');
  }
}
