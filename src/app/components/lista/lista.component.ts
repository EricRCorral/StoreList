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
    width: 25%;
}

.add-btn {
  // width: fit-content;
  // padding: 1px 2px;
  // border: solid black 1px;
  // text-align: center;
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

  noLoading = true;

  alternate: boolean;

  items = [];

  tag: string;

  title = localStorage.getItem('title');

  latLng = JSON.parse(localStorage.getItem('latLng'));

  itemsSubscription: Subscription;

  setDocItemsIdsSubscription: Subscription;

  unities = ['u' , 'doc' , 'oz' , 'mg' , 'gr' , 'kg' , 'ml' , 'cl' , 'lt'];

  constructor(private fireService: FirebaseService,
              private route: Router) {

    this.noLoading = false;

    this.tag = localStorage.getItem('tag');

    // El ref se hace para ordenar los items segun la fecha, por lo tanto el ultimo item creada o
    // modificada sera el primero visible.

    this.fireService.item = this.fireService.firestore.collection(localStorage.getItem('id') , ref => ref.orderBy('date' , 'desc')).doc(localStorage.getItem('listId')).collection('list' , ref => ref.orderBy('dateItem' , 'desc'));

    // Obtener la data del Cloudstore e ingresarla en el arreglo items, luego cambia el
    // valor del noLoading para mostrar los items.

    this.itemsSubscription = this.fireService.getItems().subscribe( data => {

      this.items.unshift(data);

      this.items = this.items[0];

      this.noLoading = true;
     });

    // Ingresar el id dentro del item correspodiente, dentro del metodo ya
    // esta la subscripcion por lo cual esta pendiente de los cambios.

    this.setDocItemsIdsSubscription = this.fireService.setDocItemsIds();
   }

   // Cambia la propiedad alternate para el theme del Angular Material

  ngDoCheck() {

    this.alternate = this.fireService.alternateService;
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

   back() {

     this.route.navigateByUrl(localStorage.getItem('id'));
   }

   // Agregar un item y borrar los values de los inputs

   createItem(name: string , quantity: number , unity: string) {

    if (name.length > 0  && quantity > 0) {

      this.fireService.setItem( name , quantity , unity);

      $('.input').val('');

      $('#nameText').focus();
    }
   }

   // Editar un item

   editItem(i: number, data: any , condition: number) {

    let dateItem: number = new Date().getTime();

    const itemId: string = data.itemId;

    const nameData: string = data.name;

    const quantityData: number = data.quantity;

    const finishedData: boolean = data.finished;

     // Editar el nombre , si el item esta marcado como finished no se ejecutara.

    if (condition === 0) {

      if (data.finished) {
        return;
      }

      Swal.fire ({
        title: `Editar ${data.name}`,
        input: 'text',
        inputValue: data.name,
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

           const name: string = resp.value;

           this.fireService.editItem(itemId , dateItem , name , quantityData , finishedData);

           this.items.splice(
             i, 1 ,
            {name,
             dateItem
            });
         }
       },
      );
    }

    // Editar la cantidad , si el item esta marcado como finished no se ejecutara.

    if (condition === 1) {

      if (data.finished) {
        return;
      }

      Swal.fire ({
        title: `Cantidad de ${data.name}`,
        input: 'number',
        inputValue: data.quantity,
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

           const quantity: number = resp.value;

           this.fireService.editItem(itemId , dateItem, nameData , quantity , finishedData);

           this.items.splice(
             i, 1 ,
            {dateItem,
             quantity,
            });
         }
       }
       );
    }

    // Cambiar a finished/pending. La segunda condition es para colocar al final de la lista en caso de estar finished

    if (condition === 2) {

      if (data.finished) {

        dateItem = - dateItem;
      }

      this.fireService.editItem(itemId , dateItem , nameData , quantityData , data.finished);
   }
 }

  // Seleccionar un tag

  selectTag(tag: string) {

    this.fireService.editTag(tag);

    this.tag = tag;

    localStorage.setItem('tag' , tag);
  }

  // Borrar un item

  delItem(i: number , data) {

    Swal.fire({
      title: `¿ Seguro que desea borrar ${data.name} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Borrar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      confirmButtonColor: '#704141b3',
      background: '#fffffff0'
    }).then( resp => {

      if (resp.value === true) {

        this.fireService.deleteItem(data.itemId);

        this.items.splice(i , 1);
      }
    });
  }
}
