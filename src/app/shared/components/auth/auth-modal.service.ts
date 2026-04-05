import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AuthModalType = 'login' | 'register' | 'forgot-password' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {
  private _currentModal = new BehaviorSubject<AuthModalType>(null);
  public currentModal$: Observable<AuthModalType> = this._currentModal.asObservable();

  openLogin(): void {
    this._currentModal.next('login');
  }

  openRegister(): void {
    this._currentModal.next('register');
  }

  openForgotPassword(): void {
    this._currentModal.next('forgot-password');
  }

  close(): void {
    this._currentModal.next(null);
  }

  get currentModal(): AuthModalType {
    return this._currentModal.value;
  }
}

