import { Component, OnDestroy, DoCheck } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import { FirebaseService } from '../../services/firebase.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list',
  templateUrl: './listas.component.html',
  styles: [`

.fa-sign-out-alt {
    transform: rotate(-90deg);
}

.fa-clipboard-check,
.fa-clipboard-list {
  opacity: .5;
  transition: .5s;
  cursor: pointer;
}

.list-icon {
    opacity: 1;
}
  `],
  animations: [

    trigger('finished' , [
      transition(':enter' , [
       style({
         textDecorationLine: 'none',
         color: '#000000'
       }) ,
       animate('0.5s' , style({
        textDecorationLine: 'line-through',
        color: '#8c8c8c99',
        cursor: 'not-allowed',
        }))
    ])
   ])
  ]
})

export class ListasComponent implements OnDestroy , DoCheck {

  alternate: boolean;

  showPend = false;

  showFin = false;

  noLoading = false;

  userName: string;

  lists = [];

  pendingLength: number;

  center: google.maps.LatLngLiteral;

  markerIndex: Geolocation;

  getDataSubscription: Subscription;

  setDocsIdsSubscription: Subscription;

  constructor(private fireService: FirebaseService,
              private route: Router) {

// Obtener el nombre del usuario

this.fireService.getUser().subscribe(
   (resp: any) => this.userName = resp.users[0].providerUserInfo[0].displayName);

// El ref se hace para ordenar las listas segun la fecha, por lo tanto la ultima lista creada o
// modificada sera la primera visible.

this.fireService.lists = this.fireService.firestore.collection(localStorage.getItem('id') ,
ref => ref.orderBy('date' , 'desc'));

// Obtener la data del Cloudstore e ingresarla en el arreglo listas, tambien asigna el valor de
// pendingLength para los badges luego cambia el valor del noLoading para mostrar las listas

this.getDataSubscription = this.fireService.getData().subscribe( data => {

  this.lists.unshift(data);

  this.lists = this.lists[0];

  this.pendingLength = this.lists.length;

  for (let i = 0; i < this.lists.length; i++) {

    if (this.lists[i].finished === true) {

      this.pendingLength--;
    }
  }

  this.noLoading = true;
  });

// Ingresar el id dentro de la lista correspodiente, dentro del metodo ya esta la
// subscripcion por lo cual esta pendiente de los cambios

this.setDocsIdsSubscription = this.fireService.setDocsIds();

// Solicita al usuario la posicion actual para utilizarse en el map, en caso de no aceptar las
// coordenadas centrales corresponden al departamento de Google

navigator.geolocation.getCurrentPosition(position => {

    this.center = {
     lat: position.coords.latitude,
     lng: position.coords.longitude,
    };
   }
  );
  }

  // Cambia la propiedad alternate para el theme del Angular Material

  ngDoCheck() {

    this.alternate = this.fireService.alternateService;
  }

  // Desuscripción del getData() y del setDocsIds()

  ngOnDestroy() {

    this.getDataSubscription.unsubscribe();

    this.setDocsIdsSubscription.unsubscribe();
  }

  // Desconectarse, se maneja directamente con el id del storage mas el AuthGuard

  disconnect() {

    localStorage.clear();
    localStorage.setItem('theme' , (this.fireService.alternateService).toString());

    this.route.navigateByUrl('/signIn');
  }

  // Crear una lista, inicia aca y continua en el setMarker() al abrirse el modal
  // desde este metodo

  createList() {

    Swal.fire ({
    title: 'Crear nueva lista',
    input: 'text',
    inputPlaceholder: 'Ingrese el nombre de la lista...',
    showCancelButton: true,
    confirmButtonText: 'Seleccionar ubicación',
    cancelButtonText: 'Cancelar',
    allowOutsideClick: false,
    confirmButtonColor: '#86a572',
    cancelButtonColor: '#704141b3',
    background: '#fffffff0'
  }).then( resp => {

    if (resp.value === undefined || resp.value.length === 0) {

      return;

    } else {

      localStorage.setItem('title' , resp.value);

      localStorage.removeItem('tag');

      $('#modalMap').modal('show');
      }
     }
    );
   }

  // Editar una lista, inicia aca y continua en el setMarker() al abrirse el modal
  // desde este metodo

   editList(i: number , data) {

     Swal.fire ({
     title: `Editar ${data.title}`,
     input: 'text',
     inputValue: data.title,
     inputPlaceholder: 'Ingrese el nuevo nombre...',
     showCancelButton: true,
     confirmButtonText: 'Seleccionar nueva ubicación',
     cancelButtonText: 'Cancelar cambios',
     allowOutsideClick: false,
     confirmButtonColor: '#86a572',
     cancelButtonColor: '#704141b3',
     background: '#fffffff0'
    }).then( resp => {

      if (resp.value !== undefined) {

        this.markerIndex = data.latLng;

        localStorage.removeItem('title');

        localStorage.setItem('index' , i.toString());

        localStorage.setItem('titleEdited' , resp.value);

        $('#modalMap').modal('show');
      }
    }
    );
  }

  // Metodo que se va a ejecutar dentro del modal al hacer click en el mapa, este va de la mano del
  // crear y editar lista, ambos utilizan la misma latLng y se divide con un if para el caso de crear y
  // otro para el de editar dependiendo si hay un 'title' en el storage. *Casos:

    setMarker(coords) {

    const latLng = coords.latLng.toJSON();

    let index: number;

    $('#modalMap').modal('hide') ;

    // *Crear: se ejecuta el setList() y  recibe el title del localstorage, el latLng del click en el
    // mapa y el date instanciado justo antes.

    if (localStorage.getItem('title')) {

      const title = localStorage.getItem('title') ;

      localStorage.setItem('latLng' , JSON.stringify(latLng));

      const date = Number(new Date().getTime());

      this.fireService.setList( title, latLng , date);

      // *Editar: se ejecuta el editList(), marcador undefined para evitar errores en consola, listId
      // obtenida del arreglo listas, title del storage, date es nuevo y latLng al clickear en el mapa,
      // luego se hace un splice en las listas para actualizar.

      } else {

        this.markerIndex = undefined;

        index = Number(localStorage.getItem('index'));

        const title = localStorage.getItem('titleEdited');

        const listId: string = this.lists[index].listId;

        const date = Number(new Date().getTime());

        this.fireService.editList(listId , title , date , latLng  );

        this.lists.splice(
          Number(localStorage.getItem('index')), 1 ,
          {position: latLng ,
           title,
           date
          });

        localStorage.removeItem('titleEdited');

        localStorage.removeItem('index');
        }
      }

      // Actualizar el valor del finished en la base de datos.

  changeCheck(listId: string , finished: boolean) {

      this.fireService.changeFinished(listId , finished);
    }

      // Abrir una lista, se hacen los setItem al localstorage para utilizarlos luego dentro de la
      // lista seleccionada

  openList(i: number , finished: boolean) {

    if (finished) {
      return;
    }

    const title = this.lists[i].title;

    localStorage.setItem('listId' , this.lists[i].listId);

    localStorage.setItem('title' , title);

    localStorage.setItem('latLng' , JSON.stringify(this.lists[i].latLng));

    if (this.lists[i].tag !== undefined) {
      localStorage.setItem('tag' , this.lists[i].tag);
    }

    this.route.navigateByUrl(`${localStorage.getItem('id')}/${title}`);
      }

      // Borrar una lista o todas las finished. El parametro i solo es enviada para borrar una sola
      // lista, de ahi la condicion para borrar todas las listas juntas. Se hace in ciclo 'for' dentro
      // de las listas y las que esten marcadas como finished se borran de la base de datos y se hace
      // un splice lo que devuelve un nuevo length de las listas entonces para no "saltearse" una lista
      // es que se le resta una iteración al index.

  deleteList(i?: number , data?) {

    if (i === undefined) {

      Swal.fire({
        title: `¿ Seguro que desea borrar las listas terminadas?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Borrar',
        cancelButtonText: 'Cancelar',
        allowOutsideClick: false,
        confirmButtonColor: '#704141b3',
        background: '#fffffff0'
      }).then( resp => {

        if (resp.value === true) {

          for (let index = 0; index < this.lists.length; index++) {

            if (this.lists[index].finished === true) {

              this.fireService.deleteList(this.lists[index].listId);

              this.lists.splice(index , 1);

              index = index - 1;
            }
          }
        }
      });

    } else {

      this.fireService.deleteList(data.listId);

      this.lists.splice(i , 1);
    }
  }
}
