import { Component } from '@angular/core';
import { Footer } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Footer,
    NavbarComponent
  ],
  templateUrl: './store-layout.html',
  styleUrl: './store-layout.css',
})
export class StoreLayout {

}
