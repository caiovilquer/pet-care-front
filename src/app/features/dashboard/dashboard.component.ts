import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin, Subscription } from 'rxjs';
import { TutorService } from '../../core/services/tutor.service';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { PetService } from '../../core/services/pet.service';
import { Tutor } from '../../core/models/tutor.model';
import { EventSummary, EventType, isEventDone } from '../../core/models/event.model';
import { PetSummary } from '../../core/models/pet.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: Tutor | null = null;
  totalPets = 0;
  totalEvents = 0;
  upcomingEvents = 0;
  recentPets: PetSummary[] = [];
  recentEvents: EventSummary[] = [];
  private eventUpdateSubscription?: Subscription;

  constructor(
    private tutorService: TutorService,
    private eventService: EventService,
    private eventStateService: EventStateService,
    private petService: PetService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    
    // Se inscrever para atualizações de eventos
    this.eventUpdateSubscription = this.eventStateService.eventUpdated$.subscribe(() => {
      console.log('Dashboard: Recebeu notificação de atualização de evento');
      this.refreshEventData();
    });
  }

  ngOnDestroy(): void {
    if (this.eventUpdateSubscription) {
      this.eventUpdateSubscription.unsubscribe();
    }
  }

  private refreshEventData(): void {
    if (this.currentUser && this.currentUser.pets.length > 0) {
      console.log('Dashboard: Recarregando dados dos eventos...');
      this.loadEventsForAllPets(this.currentUser.pets);
    }
  }

  loadDashboardData(): void {
    this.tutorService.getMyProfile().subscribe((user: Tutor) => {
      this.currentUser = user;
      this.totalPets = user.pets.length;
      this.recentPets = user.pets.slice(0, 5);
      
      console.log('Perfil do usuário carregado:', user); // Debug
      console.log('Pets do usuário:', user.pets); // Debug
      
      // Carregar eventos de todos os pets
      if (user.pets.length > 0) {
        this.loadEventsForAllPets(user.pets);
      } else {
        this.totalEvents = 0;
        this.upcomingEvents = 0;
        this.recentEvents = [];
      }
    });
  }

  private loadEventsForAllPets(pets: any[]): void {
    console.log('=== INÍCIO DO CARREGAMENTO DE EVENTOS ===');
    console.log('Pets para carregar eventos:', pets.map(p => ({ id: p.id, name: p.name })));
    
    const petEventRequests = pets.map(pet => {
      console.log(`Fazendo requisição para pet ${pet.id} (${pet.name})`);
      return this.eventService.listByPet(pet.id);
    });

    forkJoin(petEventRequests).subscribe({
      next: (petEventsArrays) => {
        console.log('=== RESPOSTAS DA API ===');
        console.log('Número de respostas recebidas:', petEventsArrays.length);
        console.log('Respostas completas:', petEventsArrays);
        
        // Combinar todos os eventos de todos os pets
        const allEvents: EventSummary[] = [];
        
        petEventsArrays.forEach((petEvents, index) => {
          const pet = pets[index];
          console.log(`\n--- Pet ${pet.id} (${pet.name}) ---`);
          console.log('Eventos recebidos:', petEvents);
          console.log('Tipo da resposta:', typeof petEvents);
          console.log('É array?', Array.isArray(petEvents));
          
          if (Array.isArray(petEvents)) {
            console.log(`Processando ${petEvents.length} eventos do pet ${pet.id}`);
            petEvents.forEach((event: any, eventIndex: number) => {
              console.log(`  Evento ${eventIndex + 1}:`, {
                id: event.id,
                type: event.type,
                description: event.description,
                dateStart: event.dateStart,
                status: event.status
              });
              
              allEvents.push({
                id: event.id,
                type: event.type,
                description: event.description || this.getEventTypeName(event.type),
                dateStart: event.dateStart,
                petId: pet.id,
                status: event.status || 'PENDING'
              });
            });
          } else {
            console.log(`AVISO: Resposta para pet ${pet.id} não é um array:`, petEvents);
          }
        });
        
        console.log('\n=== RESULTADO FINAL ===');
        console.log('Total de eventos coletados:', allEvents.length);
        console.log('Eventos completos:', allEvents);
        
        this.totalEvents = allEvents.length;
        const upcomingEvents = this.getUpcomingEvents(allEvents);
        this.upcomingEvents = upcomingEvents.length;
        this.recentEvents = upcomingEvents.slice(0, 5);
        
        console.log('\n=== ESTATÍSTICAS FINAIS ===');
        console.log('Total eventos:', this.totalEvents);
        console.log('Eventos próximos:', this.upcomingEvents);
        console.log('Eventos recentes (amostra):', this.recentEvents);
        console.log('=== FIM DO CARREGAMENTO ===\n');
      },
      error: (error) => {
        console.error('Erro ao carregar eventos:', error);
        this.totalEvents = 0;
        this.upcomingEvents = 0;
        this.recentEvents = [];
      }
    });
  }

  private getUpcomingEvents(events: EventSummary[]): EventSummary[] {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log('\n--- FILTRAGEM DE EVENTOS PRÓXIMOS ---');
    console.log('Data atual:', now.toISOString());
    console.log('Data limite (próxima semana):', nextWeek.toISOString());
    console.log('Total de eventos para filtrar:', events.length);
    
    const filtered = events.filter((event, index) => {
      const eventDate = new Date(event.dateStart);
      const isNotDone = !isEventDone(event.status);
      const isInFuture = eventDate >= now;
      const isWithinWeek = eventDate <= nextWeek;
      
      console.log(`Evento ${index + 1} (ID: ${event.id}):`);
      console.log(`  - Descrição: ${event.description}`);
      console.log(`  - Data: ${event.dateStart} (${eventDate.toISOString()})`);
      console.log(`  - Não concluído: ${isNotDone} (status=${event.status})`);
      console.log(`  - No futuro: ${isInFuture}`);
      console.log(`  - Dentro da semana: ${isWithinWeek}`);
      console.log(`  - INCLUÍDO: ${isNotDone && isInFuture && isWithinWeek ? 'SIM' : 'NÃO'}`);
      
      return isNotDone && isInFuture && isWithinWeek;
    });
    
    console.log('Eventos próximos filtrados:', filtered.length);
    console.log('--- FIM DA FILTRAGEM ---\n');
    return filtered;
  }

  getEventTypeName(type: EventType): string {
    const names = {
      VACCINE: 'Vacina',
      MEDICINE: 'Remédio',
      DIARY: 'Diário',
      BREED: 'Cio',
      SERVICE: 'Serviço'
    };
    return names[type] || 'Evento';
  }

  getEventIcon(type: EventType): string {
    const icons = {
      VACCINE: 'vaccines',
      MEDICINE: 'medication',
      DIARY: 'book',
      BREED: 'favorite',
      SERVICE: 'content_cut'
    };
    return icons[type] || 'event';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
