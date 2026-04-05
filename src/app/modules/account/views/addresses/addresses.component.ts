import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressesComponent implements OnInit {
  addresses: any[] = [];
  showForm = false;
  editingAddress: any = null;
  addressForm!: FormGroup;

  provinces = [
    'Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica',
    'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.createForm();
    // TODO: Load addresses from API
  }

  createForm(): void {
    this.addressForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: ['', Validators.required],
      whatsapp: [''],
      address_line_1: ['', Validators.required],
      address_line_2: [''],
      city: ['', Validators.required],
      province: ['', Validators.required],
      postal_code: [''],
      is_primary: [false]
    });
  }

  addNewAddress(): void {
    this.editingAddress = null;
    this.showForm = true;
    this.addressForm.reset();
  }

  editAddress(address: any): void {
    this.editingAddress = address;
    this.showForm = true;
    this.addressForm.patchValue(address);
  }

  saveAddress(): void {
    if (this.addressForm.valid) {
      // TODO: Save address via API
      this.showForm = false;
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingAddress = null;
    this.addressForm.reset();
  }

  deleteAddress(address: any): void {
    // TODO: Delete address with confirmation
  }

  setAsPrimary(address: any): void {
    // TODO: Set address as primary
  }
}

