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

  alternar: boolean;

  downPend = false;

  downTer = false;

  noCargando = false;

  nombreUsuario: string;

  listas = [];

  pendientesLength: number;

  center: google.maps.LatLngLiteral;

  marcadorIndex: Geolocation;

  getDataSubscription: Subscription;

  setDocsIdsSubscription: Subscription;

  constructor(private fireService: FirebaseService,
              private route: Router) {

this.fireService.getUser().subscribe(
   (resp: any) => this.nombreUsuario = resp.users[0].providerUserInfo[0].displayName);

// El ref se hace para ordenar las listas segun la fecha, por lo tanto la ultima lista creada o
// modificada sera la primera visible.

this.fireService.listas = this.fireService.firestore.collection(localStorage.getItem('id') , 
ref => ref.orderBy('date' , 'desc'));

// Obtener la data del Cloudstore e ingresarla en el arreglo listas, luego cambia el valor
// del noCargando para mostrar las listas

this.getDataSubscription = this.fireService.getData().subscribe( data => {

  this.listas.unshift(data);

  this.listas = this.listas[0];

  this.pendientesLength = this.listas.length;

  for (let i = 0; i < this.listas.length; i++) {

    if (this.listas[i].terminada === true) {

      this.pendientesLength--;
    }
  }

  this.noCargando = true;
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

  // Cambia la propiedad alternar para el theme del Angular Material

  ngDoCheck() {

    this.alternar = this.fireService.alternarService;
  }

  // Desuscripción del getData()

  ngOnDestroy() {

    this.getDataSubscription.unsubscribe();

    this.setDocsIdsSubscription.unsubscribe();
  }

  // Desconectarse, se maneja directamente con el id del storage mas el AuthGuard

  disconect() {

    localStorage.clear();
    localStorage.setItem('theme' , (this.fireService.alternarService).toString());

    this.route.navigateByUrl('/signIn');
  }

  // Crear una lista, inicia aca y continua en el ubicarMarcador() al abrirse el modal
  // desde este metodo

  crearLista() {

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

  // Editar una lista, inicia aca y continua en el ubicarMarcador() al abrirse el modal
  // desde este metodo

   editarLista(i: number , data) {

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

        this.marcadorIndex = data.latLng;

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

    ubicarMarcador(coords) {

    const latLng = coords.latLng.toJSON();

    let index: number;

    $('#modalMap').modal('hide') ;

    // *Crear: se ejecuta el setLista() y  recibe el title del localstorage, el latLng del click en el
    // mapa y el date instanciado justo antes.

    if (localStorage.getItem('title')) {

      const title = localStorage.getItem('title') ;

      localStorage.setItem('latLng' , JSON.stringify(latLng));

      const date = Number(new Date().getTime());

      this.fireService.setLista( title, latLng , date);

      // *Editar: se ejecuta el editLista(), marcador undefined para evitar errores en consola, listaId
      // obtenida del arreglo listas, title del storage, date es nuevo y latLng al clickear en el mapa,
      // luego se hace un splice en las listas para actualizar.

      } else {

        this.marcadorIndex = undefined;

        index = Number(localStorage.getItem('index'));

        const title = localStorage.getItem('titleEdited');

        const listaId: string = this.listas[index].listaId;

        const date = Number(new Date().getTime());

        this.fireService.editLista(listaId , title , date , latLng  );

        this.listas.splice(
          Number(localStorage.getItem('index')), 1 ,
          {position: latLng ,
           title,
           date
          });

        localStorage.removeItem('titleEdited');

        localStorage.removeItem('index');
        }
      }

      // Alternar entre lista terminada o pendiente

      cambiarCheck(listaId: string , terminada: boolean) {

        this.fireService.changeTerminado(listaId , terminada);
      }

      // Abrir una lista, se hacen los setItem al localstorage para utilizarlos luego dentro de la
      // lista seleccionada

  abrirLista(i: number , terminado: boolean) {

    if (terminado) {
      return;
    }

    const title = this.listas[i].title;

    localStorage.setItem('listaId' , this.listas[i].listaId);

    localStorage.setItem('title' , title);

    localStorage.setItem('latLng' , JSON.stringify(this.listas[i].latLng));

    if (this.listas[i].tag !== undefined) {
      localStorage.setItem('tag' , this.listas[i].tag);
    }

    this.route.navigateByUrl(`${localStorage.getItem('id')}/${title}`);
      }

      // Borrar una lista o todas las terminadas. El parametro i solo es enviada para borrar una sola
      // lista, de ahi la condicion para borrar todas las listas juntas. Se hace in ciclo 'for' dentro
      // de las listas y las que esten marcadas como terminadas se borran de la base de datos y se hace
      // un splice lo que devuelve un nuevo length de las listas entonces para no "saltearse" una lista
      // es que se le resta una iteración al index.

  borrarLista(i: number , data) {

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

          for (let index = 0; index < this.listas.length; index++) {

            if (this.listas[index].terminada === true) {

              this.fireService.borrarLista(this.listas[index].listaId);

              this.listas.splice(index , 1);

              index = index - 1;
            }
          }
        }
      });

    } else {

      this.fireService.borrarLista(data.listaId);

      this.listas.splice(i , 1);
    }
  }
}
