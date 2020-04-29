import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styles: []
})
export class SignUpComponent  {

  emailErrorMessage: string;

  passwordErrorMessage: string;

  nameErrorMessage: string;

  constructor(private fireService: FirebaseService) { }

  // Metodo para crearse una cuenta con su respectivo nombre.

  signUp(email?: string , password?: string , name?: string)  {

    if (name.length === 0) {

      this.nameErrorMessage = 'Nombre requerido';

    } else {

      this.nameErrorMessage = undefined;

      this.fireService.newUser(email, password, name).subscribe(
      (resp: any) => {

        localStorage.setItem('idToken' , resp.idToken);

        localStorage.setItem('refreshToken' , resp.refreshToken);

        localStorage.setItem('id' , resp.localId);

        this.fireService.setName(name);

       } , err => {

        this.fireService.handleError(err);

        this.emailErrorMessage = this.fireService.emailError;

        this.passwordErrorMessage = this.fireService.passwordError;
        }
      ) ; }
  }
}
