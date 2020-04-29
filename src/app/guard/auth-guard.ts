import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';

@Injectable({
    providedIn: 'root'
})
export class CanActivateGuard implements CanActivate {

    constructor(private router: Router,
                private fireService: FirebaseService) {
    }

    canActivate(): boolean {

        // Comparará el id del usuario del localstorage y del fireservice que no necesariamente
        // son el mismo, en caso de ser falso regresara a la ruta para conectarse.

        if (localStorage.getItem('id') === this.fireService.userId) {

            return true;

        } else {

            this.router.navigateByUrl('/signIn');
            return false;
        }
    }
}
