import { Component, OnDestroy, DoCheck } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista',
  templateUrl: './lista.component.html',
  styles: [`

.fa-caret-left {
    opacity: .7;
    transition: .5s;
}

.fa-caret-left:hover {
    opacity: 1;
    transform: scale(1.2);
    cursor: pointer;
}

.width-input {
    width: 31%;
}

#tag0 {
    color: #ffffff;
    transition: .5s;
    cursor: pointer;
}

#tag1 {
    color: #c7c700b3;
    transition: .5s;
    cursor: pointer;
}

#tag2 {
    color: #ff0000b3;
    transition: .5s;
    cursor: pointer;
}

#tag0:hover,
#tag1:hover,
#tag2:hover {
    -webkit-box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.75);
    -moz-box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.75);
    box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.75);
}
  `]
})
export class ListaComponent implements OnDestroy , DoCheck {

  noCargando = true;

  alternar: boolean;

  items = [];

  tag: string;

  title = localStorage.getItem('title');

  latLng = JSON.parse(localStorage.getItem('latLng'));

  itemsSubscription: Subscription;

  setDocItemsIdsSubscription: Subscription;

  unidades = ['u' , 'doc' , 'oz' , 'mg' , 'gr' , 'kg' , 'ml' , 'cl' , 'lt'];

  constructor(private fireService: FirebaseService,
              private route: Router) {

    this.noCargando = false;

    this.tag = localStorage.getItem('tag');

    // El ref se hace para ordenar los items segun la fecha, por lo tanto el ultimo item creada o
    // modificada sera el primero visible.

    this.fireService.item = this.fireService.firestore.collection(localStorage.getItem('id') , ref => ref.orderBy('date' , 'desc')).doc(localStorage.getItem('listaId')).collection('lista' , ref => ref.orderBy('dateItem' , 'desc'));

    // Obtener la data del Cloudstore e ingresarla en el arreglo items, luego cambia el
    // valor del noCargando para mostrar los items.

    this.itemsSubscription = this.fireService.getItems().subscribe( data => {

      this.items.unshift(data);

      this.items = this.items[0];

      this.noCargando = true;
     });

    // Ingresar el id dentro del item correspodiente, dentro del metodo ya
    // esta la subscripcion por lo cual esta pendiente de los cambios.

    this.setDocItemsIdsSubscription = this.fireService.setDocItemsIds();
   }

   // Cambia la propiedad alternar para el theme del Angular Material

  ngDoCheck() {

    this.alternar = this.fireService.alternarService;
  }

   // Se borran items del localstorage para evitar posibles errores y se desubscribe del getItem() y del
   // setDocItemsIds()

   ngOnDestroy() {

    localStorage.removeItem('tag');
    localStorage.removeItem('title');
    localStorage.removeItem('latLng');

    this.itemsSubscription.unsubscribe();

    this.setDocItemsIdsSubscription.unsubscribe();
   }

   // Regresar a las listas

   regresar() {

     this.route.navigateByUrl(localStorage.getItem('id'));
   }

   // Agregar un item y borrar los values de los inputs

   agregarItem(nombre: string , cantidad: number , unidad: string) {

    if (nombre.length > 0  && cantidad > 0) {

      this.fireService.setItem( nombre , cantidad , unidad);

      $('.input').val('');

      $('#nombreText').focus();
    }
   }

   // Editar un item

   editarItem(i: number, data: any , condicion: number) {

    let dateItem: number = new Date().getTime();

    const itemId: string = data.itemId;

    const nombreData: string = data.nombre;

    const cantidadData: number = data.cantidad;

    const terminadoData: boolean = data.terminado;

     // Editar el nombre , si el item esta marcado como terminado no se ejecutara.

    if (condicion === 0) {

      if (data.terminado) {
        return;
      }

      Swal.fire ({
        title: `Editar ${data.nombre}`,
        input: 'text',
        inputValue: data.nombre,
        inputPlaceholder: 'Ingrese el nuevo nombre...',
        showCancelButton: true,
        confirmButtonText: 'Guardar nombre',
        cancelButtonText: 'Cancelar cambios',
        allowOutsideClick: false,
        confirmButtonColor: '#86a572',
        cancelButtonColor: '#704141b3',
        background: '#fffffff0'

       }).then( resp => {

         if (resp.value !== undefined) {

           const nombre: string = resp.value;

           this.fireService.editItem(itemId , dateItem , nombre , cantidadData , terminadoData);

           this.items.splice(
             i, 1 ,
            {nombre,
             dateItem
            });
         }
       },
      );
    }

    // Editar la cantidad , si el item esta marcado como terminado no se ejecutara.

    if (condicion === 1) {

      if (data.terminado) {
        return;
      }

      Swal.fire ({
        title: `Cantidad de ${data.nombre}`,
        input: 'number',
        inputValue: data.cantidad,
        inputPlaceholder: 'Ingrese la nueva cantidad...',
        showCancelButton: true,
        confirmButtonText: 'Guardar cantidad',
        cancelButtonText: 'Cancelar cambios',
        allowOutsideClick: false,
        confirmButtonColor: '#86a572',
        cancelButtonColor: '#704141b3',
        background: '#fffffff0'
       }).then( resp => {

         if (resp.value !== undefined) {

           const cantidad: number = resp.value;

           this.fireService.editItem(itemId , dateItem, nombreData , cantidad , terminadoData);

           this.items.splice(
             i, 1 ,
            {dateItem,
             cantidad,
            });
         }
       }
       );
    }

    // Cambiar a terminado/pendiente. La segunda condicion es para colocar al final de la lista en caso de estar terminado

    if (condicion === 2) {

      if (data.terminado) {

        dateItem = - dateItem;
      }

      this.fireService.editItem(itemId , dateItem , nombreData , cantidadData , data.terminado);
   }
 }

  // Seleccionar un tag

  seleccionarTag(tag: string) {

    this.fireService.editTag(tag);

    this.tag = tag;

    localStorage.setItem('tag' , tag);
  }

  // Borrar un item

  borrarItem(i: number , data) {

    Swal.fire({
      title: `¿ Seguro que desea borrar ${data.nombre} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Borrar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      confirmButtonColor: '#704141b3',
      background: '#fffffff0'
    }).then( resp => {

      if (resp.value === true) {

        this.fireService.borrarItem(data.itemId);

        this.items.splice(i , 1);
      }
    });
  }
}
