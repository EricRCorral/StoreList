import { Component } from '@angular/core';
import { FirebaseService } from './services/firebase.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  alternar: boolean;

  constructor(private fireService: FirebaseService) {

    this.alternar = JSON.parse(localStorage.getItem('theme'));

  }

  cambiarTheme() {

    this.alternar = !this.alternar;

    this.fireService.alternarService = this.alternar;

    localStorage.setItem('theme' , (this.alternar).toString());

  }

}
