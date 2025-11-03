import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PetService } from '../../core/services/pet.service';
import { EventService } from '../../core/services/event.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { Pet } from '../../core/models/pet.model';
import { EventSummary } from '../../core/models/event.model';
import { PetFormComponent } from './pet-form.component';

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './pet-detail.component.html',
  styleUrls: ['./pet-detail.component.css']
})
export class PetDetailComponent implements OnInit {
  pet: Pet | null = null;
  recentEvents: EventSummary[] = [];
  isLoading = true;
  petId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private petService: PetService,
    private eventService: EventService,
    private dateTimeService: DateTimeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.petId = +id;
        this.loadPetDetails();
        this.loadRecentEvents();
      } else {
        this.router.navigate(['/pets']);
      }
    });
  }

  private loadPetDetails(): void {
    this.petService.getById(this.petId).subscribe({
      next: (pet) => {
        this.pet = pet;
        this.isLoading = false;
  
      },
      error: (err) => {
  
        this.snackBar.open('Erro ao carregar detalhes do pet.', 'Fechar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private loadRecentEvents(): void {
    this.eventService.listByPet(this.petId).subscribe({
      next: (events) => {
        // Pegar apenas os 5 eventos mais recentes
        this.recentEvents = events
          .sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime())
          .slice(0, 5)
          .map(event => ({
            ...event,
            petId: this.petId
          } as EventSummary));
  
      },
      error: (err) => {
  
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/pets']);
  }

  editPet(): void {
    if (this.pet) {
      const dialogRef = this.dialog.open(PetFormComponent, {
        width: '400px',
        data: {
          id: this.pet.id,
          name: this.pet.name,
          specie: this.pet.specie,
          race: this.pet.race,
          birthdate: this.pet.birthdate
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Recarregar os dados do pet após edição
          this.loadPetDetails();
          this.snackBar.open('Pet atualizado com sucesso!', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  viewAllEvents(): void {
    this.router.navigate(['/events/pet', this.petId]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return this.dateTimeService.formatForDisplay(dateString); // FIX: usar serviço centralizado
  }

  getGenderDisplay(gender: string): string {
    return gender === 'MALE' ? 'Macho' : 'Fêmea';
  }

  getAgeDisplay(birthDate: string): string {
    if (!birthDate) return 'N/A';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));
    const ageInMonths = Math.floor((ageInMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (ageInYears > 0) {
      return `${ageInYears} ano${ageInYears > 1 ? 's' : ''}`;
    } else {
      return `${ageInMonths} mês${ageInMonths > 1 ? 'es' : ''}`;
    }
  }

  getEventIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'VACCINE': 'vaccines',
      'MEDICINE': 'medication',
      'DIARY': 'book',
      'BREED': 'favorite',
      'SERVICE': 'content_cut'
    };
    return icons[type] || 'event';
  }

  getEventTypeName(type: string): string {
    const names: { [key: string]: string } = {
      'VACCINE': 'Vacina',
      'MEDICINE': 'Remédio',
      'DIARY': 'Diário',
      'BREED': 'Cio',
      'SERVICE': 'Serviço'
    };
    return names[type] || 'Evento';
  }

  formatEventDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return this.dateTimeService.formatDateTimeForDisplay(dateString); // FIX: usar serviço centralizado
  }

  getEventStatus(dateStart: string, status: string): string {
    if (status === 'DONE') {
      return 'Concluído';
    }
    const now = new Date();
    const eventDate = this.dateTimeService.parseAPIDate(dateStart); // FIX: usar parsing seguro
    if (!eventDate) return 'Desconhecido';
    if (eventDate < now) {
      return 'Atrasado';
    }
    return 'Pendente';
  }

  getStatusChipClass(dateStart: string, status: string): string {
    if (status === 'DONE') {
      return 'status-done';
    }
    const now = new Date();
    const eventDate = this.dateTimeService.parseAPIDate(dateStart); // FIX: usar parsing seguro
    if (!eventDate || eventDate < now) {
      return 'status-overdue';
    }
    return 'status-pending';
  }

  getDefaultPetImage(specie: string): string {
    const specieIcons: { [key: string]: string } = {
      'Cão': '🐕',
      'Gato': '🐱',
      'Pássaro': '🐦',
      'Peixe': '🐠',
      'Hamster': '🐹',
      'Coelho': '🐰'
    };
    return specieIcons[specie] || '🐾';
  }

  onImageError(event: any): void {
    // Substituir a imagem por um canvas com emoji quando falhar
    const img = event.target;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx && this.pet) {
      canvas.width = 300;
      canvas.height = 300;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 300, 300);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 300, 300);
      
      // Emoji
      ctx.font = '120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#374151';
      ctx.fillText(this.getDefaultPetImage(this.pet.specie), 150, 150);
      
      img.src = canvas.toDataURL();
      img.classList.add('fallback-image');
    }
  }
}
