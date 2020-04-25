import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styles: []
})
export class SignUpComponent  {

  errorEmail: string;

  errorPass: string;

  errorNombre: string;

  constructor(private fireService: FirebaseService) { }

  // Metodo para crearse una cuenta con su respectivo nombre.

  signUp(email?: string , password?: string , nombre?: string)  {

    if (nombre.length === 0) {

      this.errorNombre = 'Nombre requerido';

    } else {

      this.errorNombre = undefined;

      this.fireService.newUser(email, password, nombre).subscribe(
      (resp: any) => {

        localStorage.setItem('idToken' , resp.idToken);

        localStorage.setItem('refreshToken' , resp.refreshToken);

        localStorage.setItem('id' , resp.localId);

        this.fireService.setNombre(nombre);

       } , err => {

        this.fireService.handleError(err);

        this.errorEmail = this.fireService.errorEmail;

        this.errorPass = this.fireService.errorPass;
        }
      ) ; }
  }
}
