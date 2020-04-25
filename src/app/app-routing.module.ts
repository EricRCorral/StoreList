import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanActivateGuard } from './guard/auth-guard';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ListasComponent } from './components/listas/listas.component';
import { ListaComponent } from './components/lista/lista.component';


const routes: Routes = [
  { path: 'signIn', component: SignInComponent },
  { path: 'signUp', component: SignUpComponent },
  { path: ':idUser', component: ListasComponent , canActivate: [CanActivateGuard] },
  { path: ':idxUser',
    component: ListaComponent ,
    canActivate: [CanActivateGuard],
    children: [
     { path: ':lista', component: ListaComponent}
   ]
  },
  { path: '**', pathMatch: 'full', redirectTo: 'signIn' }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
