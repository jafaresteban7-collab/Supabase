import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonSpinner
} from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-gallery',
  templateUrl: 'gallery.page.html',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
    IonCardTitle, IonSpinner
  ],
})
export class GalleryPage implements OnInit {
  private supabaseService = inject(SupabaseService);

  images: { name: string; url: string }[] = [];
  loading = true;
  errorMsg = '';

  async ngOnInit() {
    try {
      this.images = await this.supabaseService.getImages();
    } catch (e: any) {
      this.errorMsg = 'Error cargando imágenes: ' + e.message;
    }
    this.loading = false;
  }
}