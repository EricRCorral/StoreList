import { Component } from '@angular/core';
import { FirebaseService } from './services/firebase.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [`
  .fa-sign-out-alt {
    transform: rotate(-90deg);
}
  `
  ]
})
export class AppComponent {

  alternate: boolean;

  constructor(private fireService: FirebaseService) {

    this.alternate = JSON.parse(localStorage.getItem('theme'));

  }

  // Cambia el color de la app

  changeTheme() {

    this.alternate = !this.alternate;

    this.fireService.alternateService = this.alternate;

    localStorage.setItem('theme' , (this.alternate).toString());

  }

}
