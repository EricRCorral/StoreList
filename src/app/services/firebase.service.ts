import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AngularFirestore , AngularFirestoreCollection } from '@angular/fire/firestore';
import { ListaInterface } from '../interfaces/lista-interface';
import { Item } from '../interfaces/item-interface';
import 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private url = 'https://identitytoolkit.googleapis.com/v1/accounts:';

  private apiKey = 'AIzaSyDq_GqvrLyTbzYSmZPUuKhjVy39RyKEOsQ';

  alternateService: boolean;

  userId: string;

  lists: AngularFirestoreCollection<ListaInterface>;

  item: AngularFirestoreCollection<Item>;

  emailError: string;

  passwordError: string;

  constructor(private http: HttpClient,
              private route: Router,
              public firestore: AngularFirestore) {

                this.alternateService = JSON.parse(localStorage.getItem('theme'));

                // Condición para que en el authguard se pueda entrar unicamente al usuario ingresado y
                // no que sea publico. Luego se ejecuta el metodo para actualizar el id_token y tambien un
                // intervalo en caso de que el usuario no haga uso de la app, cada 55 minutos se actualice
                // el id_token.

                if (localStorage.getItem('id')) {

                  this.userId = window.location.pathname.slice( 1 , 29 );

                  this.refreshTokenId();

                  setInterval( () => {

                    this.refreshTokenId();
                   }, 3300000);

                }
  }

  // **Auth service**

  // Crear un nuevo usuario y ademas se hace dentro otra petición al endpoint del update para insertar
  // un nombre en el usuario, luego de ingresar los datos navega al id del mismo. Se hace el set de
  // los token para mantener al usuario conectado mas alla de la hora.

  newUser(emailEntered: string , passwordEntered: string , name: string) {

    const user = {
      email: emailEntered,
      password: passwordEntered,
      returnSecureToken: true,
    };

    return this.http.post(`${this.url}signUp?key=${this.apiKey}` , user);
  }

  setName(name: string) {

    const user = {
      idToken: localStorage.getItem('idToken'),
      displayName: name
    };

    this.http.post(`${this.url}update?key=${this.apiKey}`, user ).subscribe();

    this.route.navigateByUrl(localStorage.getItem('id'));
  }

  // Ingresar con un usuario, luego de ingresar los datos navega al id del mismo.
  // Se hace el set de los token para mantener al usuario conectado mas alla de una hora. La mayor
  // parte de la logica esta en el sign-component.

    login(emailEntered: string , passwordEntered: string ) {

    const user = {
      email: emailEntered,
      password: passwordEntered,
      returnSecureToken: true,
    };

    return this.http.post(`${this.url}signInWithPassword?key=${this.apiKey}` , user);
 }

 // Manejo de errores para la creación y el ingreso de usuarios

 handleError(err) {

  console.log(err);

  const emailCond = ['INVALID_EMAIL' , 'EMAIL_NOT_FOUND' , 'EMAIL_EXISTS' , 'MISSING_EMAIL'];

  const passCond = ['INVALID_PASSWORD' , 'MISSING_PASSWORD'];

  if (emailCond.includes(err.error.error.message)) {

    this.emailError = 'Email invalido';

    this.passwordError = '';

    if (err.error.error.message === emailCond[2]) {

      this.emailError = 'Email en uso';

    }

  } else {

    this.emailError = '';
  }

  if (passCond.includes(err.error.error.message)) {

    this.passwordError = 'Contraseña invalida';

    this.emailError = '';

  }  else {

    if (err.error.error.message.length > 20 ) {

      this.passwordError = 'Minimo 6 carácteres';

    } else {

      this.passwordError = '';
    }
  }
 }

  // Obtener información del usuario logeado

  getUser() {

    const idToken = {idToken: localStorage.getItem('idToken')};

    return this.http.post(`${this.url}lookup?key=${this.apiKey}`, idToken);
  }

  // Actualiza el id_token del usuario para que el displayName del mismo se siga mostrando. Este metodo se
  // ejecuta en el constructor.

  refreshTokenId() {

    const body = {
      grant_type: 'refresh_token',
      refresh_token: localStorage.getItem('refreshToken')
    };

    this.http.post(`https://securetoken.googleapis.com/v1/token?key=${this.apiKey}` , body).subscribe
    ((data: any) => localStorage.setItem('idToken' , data.id_token));
  }

  // **Cloud firestore service**

  // ||Servicios de listas||

  // Obtener la data de las listas al subscribirse

  getData() {

    return  this.lists.valueChanges();
  }

  // Crear una lista, los primeros 3 parametros los obtiene del lista.component, el listId
  // es inicialmente un string vacio para evitar errores. Primero se ejecuta el add para guardar la
  // data y luego, ya con el listId cargado del setDocsIds() al cual ya se esta subscripto en lista,
  // navegará a esa lista.

  setList(title: string, latLng: Geolocation , date: number , listId = '' , finished = false) {

    const list: ListaInterface = {
      title,
      latLng,
      date,
      listId,
      finished,
    };

    this.lists.add(list).then( () => {

    this.route.navigateByUrl(`${localStorage.getItem('id')}/${localStorage.getItem('title')}`);
    });
  }

  // Insertar el listId en la lista en particular. En caso de que la data sea nula no hacer
  // nada. Este metodo se inicia cada vez que se detecte un cambio en las listas.

  setDocsIds() {

      return this.lists.snapshotChanges().subscribe( snapData => {

      let listId: string;

      if (snapData.length === 0) {
        return;
      }

      listId = snapData[0].payload.doc.id;

      localStorage.setItem('listId' , listId);

      this.lists.doc(listId).update({listId});
    });
  }

  // Editar una lista, toda la data la obtiene desde el lista.component

  editList(listId: string , title: string , date: number , latLng: Geolocation) {

    return this.lists.doc(listId).update({title , latLng , date});
  }

  // Actualizar el valor del finished

  changeFinished(listId: string , finished: boolean) {
    return this.lists.doc(listId).update({finished});
  }

  // Borrar una lista con sus items. Primero se hace un ciclo for para borrar item por
  // item ya que borrar la lista, la cual es un documento del cloudstore, no borrara sus items
  // (colecciones), luego de borrar los items se borrara la lista ( documento ).

  deleteList(listId: string) {

    const list = this.lists.doc(listId).collection('list');

    list.snapshotChanges().subscribe( snapData => {

      for (let i = 0; i < snapData.length; i++) {

        const itemId = snapData[i].payload.doc.id;

        list.doc(itemId).delete();
      }
    });

    return this.lists.doc(listId).delete();
  }

  // ||Servicios de lista/item||

  // Obtener la data de los items al subscribirse

  getItems() {

    return this.item.valueChanges();
  }

  // Crear un item, los primeros 3 parametros se obtienen del lista.component y el itemId
  // es un string vacio para evitar errores

  setItem(
    name: string ,
    quantity: number ,
    unity: string ,
    finished = false,
    itemId = '',
    dateItem = new Date().getTime()) {

    const item: Item = {
      name,
      quantity,
      unity,
      finished,
      itemId,
      dateItem
    };

    return this.item.add(item);
  }

  // Insertar el itemId en el item en particular. En caso de que la data sea nula no hacer
  // nada. Este metodo se inicia cada vez que se detecte un cambio en los items.

  setDocItemsIds() {

    return this.item.snapshotChanges().subscribe( snapData => {

      if (snapData.length === 0) {
        return;
      }

      const itemId = snapData[0].payload.doc.id;

      this.item.doc(itemId).update({itemId}); });
  }

  // Editar un item, la data es obtenida desde el lista.component.

  editItem(itemId: string , dateItem: number , name: string , quantity: number , finished: boolean ) {

    return this.item.doc(itemId).update({dateItem , name , quantity , finished});
  }

  // Edita el tag que tendra la lista. Este servicio se ejecuta desde el lista.component.

  editTag(tag: string) {

    return this.firestore.collection(localStorage.getItem('id')).doc(localStorage.getItem('listId')).update({tag});
  }

  // Borrar un item.

  deleteItem(itemId: string) {
    return this.item.doc(itemId).delete();
  }
}

