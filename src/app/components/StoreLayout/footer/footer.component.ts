import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule,RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})

export class Footer {
  constructor(
    
  ) {}
  

}
