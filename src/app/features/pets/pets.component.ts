import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PetService } from '../../core/services/pet.service';
import { PetSummary, PetsPage } from '../../core/models/pet.model';
import { PetFormComponent } from './pet-form.component';

@Component({
  selector: 'app-pets',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  templateUrl: './pets.component.html',
  styleUrls: ['./pets.component.css']
})
export class PetsComponent implements OnInit {
  pets: PetSummary[] = [];
  totalItems = 0;
  currentPage = 0;
  pageSize = 10;
  displayedColumns: string[] = ['name', 'specie', 'actions'];

  constructor(
    private petService: PetService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    this.petService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (page: PetsPage) => {
        this.pets = page.items;
        this.totalItems = page.total;
      },
      error: (err) => {
        this.snackBar.open('Erro ao carregar pets.', 'Fechar', { duration: 3000 });
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
      }
    });
  }

  deletePet(pet: PetSummary): void {
    if (confirm(`Tem certeza que deseja excluir ${pet.name}?`)) {
      this.petService.delete(pet.id).subscribe({
        next: () => {
          this.snackBar.open('Pet excluído com sucesso!', 'Fechar', { duration: 3000 });
          this.loadPets();
        },
        error: (err) => {
          this.snackBar.open('Erro ao excluir pet.', 'Fechar', { duration: 3000 });
        }
      });
    }
  }
}
