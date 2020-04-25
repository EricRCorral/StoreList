import { Component, OnDestroy } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styles: []
})
export class SignInComponent implements OnDestroy {

  errorEmail: string;

  errorPass: string;

  constructor(private fireService: FirebaseService) {

    // En caso de que el usuario este logeado, navege al mismo

    if (localStorage.getItem('id')) {

      window.location.replace(localStorage.getItem('id'));
    }
  }

  ngOnDestroy() {

  }

  // Metodo para logearse con manejo de errores. Solo se muestra un error a la vez.

  login(email: string , password: string) {

  this.fireService.login(email , password).subscribe((resp: any) =>  {

  localStorage.setItem('id' , resp.localId);

  localStorage.setItem('idToken' , resp.idToken);

  localStorage.setItem('refreshToken' , resp.refreshToken);

  window.location.replace(resp.localId);

  } , err => {

      this.fireService.handleError(err);

      this.errorEmail = this.fireService.errorEmail;

      this.errorPass = this.fireService.errorPass;
    }
  );
 }
}
