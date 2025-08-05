import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  LocationSearchParams, 
  LocationSearchResponse, 
  Petshop, 
  Veterinary,
  PetType,
  VeterinarySpecialty,
  OpeningHours
} from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class MockLocationService {
  
  private mockPetshops: Petshop[] = [
    {
      id: '1',
      name: 'Pet Shop Amigo Fiel',
      address: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      latitude: -23.5505,
      longitude: -46.6333,
      phone: '(11) 1234-5678',
      email: 'contato@amigofiel.com.br',
      website: 'https://amigofiel.com.br',
      rating: 4.5,
      reviewCount: 127,
      distance: 0.8,
      isOpen: true,
      type: 'petshop',
      hasGrooming: true,
      hasDaycare: true,
      hasHotel: false,
      hasVaccination: true,
      acceptedPetTypes: [PetType.DOG, PetType.CAT],
      services: ['grooming', 'daycare', 'vaccination', 'food'],
      imageUrl: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Pet+Shop',
      openingHours: this.generateOpeningHours()
    },
    {
      id: '2',
      name: 'Mundo Pet',
      address: 'Av. Paulista, 456',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      latitude: -23.5618,
      longitude: -46.6565,
      phone: '(11) 2345-6789',
      email: 'info@mundopet.com.br',
      website: 'https://mundopet.com.br',
      rating: 4.2,
      reviewCount: 89,
      distance: 1.2,
      isOpen: false,
      type: 'petshop',
      hasGrooming: true,
      hasDaycare: false,
      hasHotel: true,
      hasVaccination: false,
      acceptedPetTypes: [PetType.DOG, PetType.CAT, PetType.BIRD],
      services: ['grooming', 'hotel', 'food', 'toys'],
      imageUrl: 'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Mundo+Pet',
      openingHours: this.generateOpeningHours()
    },
    {
      id: '3',
      name: 'Pet Center Total',
      address: 'Rua Augusta, 789',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-000',
      latitude: -23.5489,
      longitude: -46.6388,
      phone: '(11) 3456-7890',
      email: 'atendimento@petcentertotal.com.br',
      rating: 4.8,
      reviewCount: 203,
      distance: 2.1,
      isOpen: true,
      type: 'petshop',
      hasGrooming: true,
      hasDaycare: true,
      hasHotel: true,
      hasVaccination: true,
      acceptedPetTypes: [PetType.DOG, PetType.CAT, PetType.RABBIT, PetType.BIRD],
      services: ['grooming', 'daycare', 'hotel', 'vaccination', 'food', 'toys'],
      imageUrl: 'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Pet+Center',
      openingHours: this.generateOpeningHours()
    }
  ];

  private mockVeterinaries: Veterinary[] = [
    {
      id: '4',
      name: 'Clínica Veterinária São Francisco',
      address: 'Rua dos Veterinários, 321',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05435-040',
      latitude: -23.5463,
      longitude: -46.6842,
      phone: '(11) 4567-8901',
      email: 'clinica@saofrancisco.vet.br',
      website: 'https://saofrancisco.vet.br',
      rating: 4.7,
      reviewCount: 156,
      distance: 1.5,
      isOpen: true,
      type: 'veterinary',
      hasEmergency: true,
      hasLaboratory: true,
      hasSurgery: true,
      hasRadiology: true,
      specialties: [VeterinarySpecialty.GENERAL, VeterinarySpecialty.CARDIOLOGY, VeterinarySpecialty.ORTHOPEDICS],
      acceptedPetTypes: [PetType.DOG, PetType.CAT],
      services: ['general', 'emergency', 'surgery', 'laboratory', 'radiology', 'cardiology'],
      imageUrl: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Clínica+Vet',
      openingHours: this.generateOpeningHours()
    },
    {
      id: '5',
      name: 'Hospital Veterinário 24h',
      address: 'Av. Rebouças, 654',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05402-000',
      latitude: -23.5505,
      longitude: -46.6896,
      phone: '(11) 5678-9012',
      email: 'emergencia@hospital24h.vet.br',
      website: 'https://hospital24h.vet.br',
      rating: 4.9,
      reviewCount: 287,
      distance: 0.6,
      isOpen: true,
      type: 'veterinary',
      hasEmergency: true,
      hasLaboratory: true,
      hasSurgery: true,
      hasRadiology: true,
      specialties: [VeterinarySpecialty.GENERAL, VeterinarySpecialty.CARDIOLOGY, VeterinarySpecialty.DERMATOLOGY, VeterinarySpecialty.ONCOLOGY],
      acceptedPetTypes: [PetType.DOG, PetType.CAT, PetType.BIRD, PetType.RABBIT],
      services: ['general', 'emergency', 'surgery', 'laboratory', 'radiology', 'cardiology', 'dermatology'],
      imageUrl: 'https://via.placeholder.com/300x200/F44336/FFFFFF?text=Hospital+24h',
      openingHours: this.generate24HoursOpeningHours()
    },
    {
      id: '6',
      name: 'Vet Care Especialidades',
      address: 'Rua da Consolação, 987',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01301-000',
      latitude: -23.5489,
      longitude: -46.6420,
      phone: '(11) 6789-0123',
      email: 'especialidades@vetcare.com.br',
      website: 'https://vetcare.com.br',
      rating: 4.6,
      reviewCount: 94,
      distance: 3.2,
      isOpen: false,
      type: 'veterinary',
      hasEmergency: false,
      hasLaboratory: true,
      hasSurgery: true,
      hasRadiology: true,
      specialties: [VeterinarySpecialty.DERMATOLOGY, VeterinarySpecialty.OPHTHALMOLOGY, VeterinarySpecialty.NEUROLOGY],
      acceptedPetTypes: [PetType.DOG, PetType.CAT],
      services: ['general', 'surgery', 'laboratory', 'dermatology', 'ophthalmology'],
      imageUrl: 'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Vet+Care',
      openingHours: this.generateOpeningHours()
    }
  ];

  searchPetshops(params: LocationSearchParams): Observable<LocationSearchResponse> {
    console.log('Mock: Buscando petshops com parâmetros:', params);
    
    let filteredPetshops = [...this.mockPetshops];
    
    // Simular filtro por serviços
    if (params.services && params.services.length > 0) {
      filteredPetshops = filteredPetshops.filter(petshop => 
        params.services!.some(service => petshop.services.includes(service))
      );
    }
    
    // Simular filtro por tipos de pets
    if (params.petTypes && params.petTypes.length > 0) {
      filteredPetshops = filteredPetshops.filter(petshop => 
        params.petTypes!.some(petType => petshop.acceptedPetTypes.includes(petType))
      );
    }
    
    // Simular filtro por aberto agora
    if (params.isOpenNow) {
      filteredPetshops = filteredPetshops.filter(petshop => petshop.isOpen);
    }
    
    // Simular filtro por distância (raio)
    filteredPetshops = filteredPetshops.filter(petshop => 
      petshop.distance <= params.radius
    );
    
    // Simular ordenação
    if (params.sortBy === 'rating') {
      filteredPetshops.sort((a, b) => b.rating - a.rating);
    } else if (params.sortBy === 'name') {
      filteredPetshops.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Por padrão ordena por distância
      filteredPetshops.sort((a, b) => a.distance - b.distance);
    }
    
    const response: LocationSearchResponse = {
      locations: filteredPetshops,
      total: filteredPetshops.length,
      searchParams: params
    };
    
    // Simular delay da API
    return of(response).pipe(delay(1500));
  }

  searchVeterinaries(params: LocationSearchParams): Observable<LocationSearchResponse> {
    console.log('Mock: Buscando veterinários com parâmetros:', params);
    
    let filteredVeterinaries = [...this.mockVeterinaries];
    
    // Simular filtro por especialidades
    if (params.services && params.services.length > 0) {
      filteredVeterinaries = filteredVeterinaries.filter(vet => 
        params.services!.some(service => vet.services.includes(service))
      );
    }
    
    // Simular filtro por tipos de pets
    if (params.petTypes && params.petTypes.length > 0) {
      filteredVeterinaries = filteredVeterinaries.filter(vet => 
        params.petTypes!.some(petType => vet.acceptedPetTypes.includes(petType))
      );
    }
    
    // Simular filtro por aberto agora
    if (params.isOpenNow) {
      filteredVeterinaries = filteredVeterinaries.filter(vet => vet.isOpen);
    }
    
    // Simular filtro por distância (raio)
    filteredVeterinaries = filteredVeterinaries.filter(vet => 
      vet.distance <= params.radius
    );
    
    // Simular ordenação
    if (params.sortBy === 'rating') {
      filteredVeterinaries.sort((a, b) => b.rating - a.rating);
    } else if (params.sortBy === 'name') {
      filteredVeterinaries.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Por padrão ordena por distância
      filteredVeterinaries.sort((a, b) => a.distance - b.distance);
    }
    
    const response: LocationSearchResponse = {
      locations: filteredVeterinaries,
      total: filteredVeterinaries.length,
      searchParams: params
    };
    
    // Simular delay da API
    return of(response).pipe(delay(1500));
  }

  private generateOpeningHours(): OpeningHours {
    return {
      monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      friday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      saturday: { isOpen: true, openTime: '08:00', closeTime: '14:00' },
      sunday: { isOpen: false }
    };
  }

  private generate24HoursOpeningHours(): OpeningHours {
    const allDay = { isOpen: true, openTime: '00:00', closeTime: '23:59' };
    return {
      monday: allDay,
      tuesday: allDay,
      wednesday: allDay,
      thursday: allDay,
      friday: allDay,
      saturday: allDay,
      sunday: allDay
    };
  }
}
