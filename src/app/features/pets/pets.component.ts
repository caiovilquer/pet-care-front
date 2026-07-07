import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastService } from '../../core/services/toast.service';
import { PetService } from '../../core/services/pet.service';
import { UserStateService } from '../../core/services/user-state.service';
import { PetSummary, PetsPage } from '../../core/models/pet.model';
import { PetFormComponent } from './pet-form.component';
import { PageHeaderComponent } from '../../shared/components/ui/page-header.component';
import { PetAvatarComponent } from '../../shared/components/ui/pet-avatar.component';
import { EmptyStateComponent } from '../../shared/components/ui/empty-state.component';
import { SkeletonComponent } from '../../shared/components/ui/skeleton.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog.component';

@Component({
  selector: 'app-pets',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    PageHeaderComponent,
    PetAvatarComponent,
    EmptyStateComponent,
    SkeletonComponent
  ],
  templateUrl: './pets.component.html',
  styleUrls: ['./pets.component.css']
})
export class PetsComponent implements OnInit {
  pets: PetSummary[] = [];
  totalItems = 0;
  currentPage = 0;
  pageSize = 10;
  isLoading = true;

  constructor(
    private petService: PetService,
    private dialog: MatDialog,
    private toast: ToastService,
    private userStateService: UserStateService
  ) { }

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    this.isLoading = true;
    this.petService.getAllCached(this.currentPage, this.pageSize).subscribe({
      next: (page: PetsPage) => {
        this.pets = page.items;
        this.totalItems = page.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar pets:', err);
        this.pets = [];
        this.totalItems = 0;
        this.toast.error('Erro ao carregar pets. Tente novamente mais tarde.');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPets();
  }

  openPetForm(): void {
    const dialogRef = this.dialog.open(PetFormComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPets();
        this.userStateService.notifyUserUpdated();
      }
    });
  }

  editPet(pet: PetSummary): void {
    const dialogRef = this.dialog.open(PetFormComponent, {
      width: '400px',
      data: pet
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPets();
        this.userStateService.notifyUserUpdated();
      }
    });
  }

  deletePet(pet: PetSummary): void {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Remover ${pet.name}?`,
        message: 'O histórico de cuidados vai junto. Essa ação não pode ser desfeita.',
        confirmLabel: 'Remover',
        danger: true
      }
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.petService.delete(pet.id).subscribe({
        next: () => {
          this.toast.success(`${pet.name} foi removido.`);
          this.loadPets();
          this.userStateService.notifyUserUpdated();
        },
        error: () => {
          this.toast.error('Erro ao remover pet.');
        }
      });
    });
  }
}
