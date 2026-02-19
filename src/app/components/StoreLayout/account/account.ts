import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../service/user-service';
import { AddressService, Address } from '../../../service/address';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './account.html',
  styleUrls: ['./account.css']
})
export class AccountComponent implements OnInit {
  private _userService = inject(UserService);
  private _addressService = inject(AddressService);
  private _router = inject(Router);

  // Active Tab
  activeTab: 'profile' | 'addresses' | 'security' = 'profile';

  // User Data
  userData = this._userService.getUserData();

  // Addresses
  addresses = signal<Address[]>([]);
  isLoadingAddresses = signal(false);
  isAddingAddress = signal(false);
  addressError = signal<string | null>(null);
  addressSuccess = signal<string | null>(null);

  // Security
  isChangingPassword = false;
  passwordError: string | null = null;
  passwordSuccess: string | null = null;

  // Address Form
  addressForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    city: new FormControl('', [Validators.required, Validators.minLength(2)]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]),
    details: new FormControl('', [Validators.required, Validators.minLength(5)])
  });

  // Password Change Form
  passwordForm = new FormGroup({
    currentPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    rePassword: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    this.loadAddresses();
  }

  // ─── TABS ─────────────────────────────────
  setTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
    if (tab === 'addresses') this.loadAddresses();
  }

  // ─── ADDRESSES ────────────────────────────
  loadAddresses(): void {
    this.isLoadingAddresses.set(true);
    this._addressService.getAddresses().subscribe({
      next: (res) => {
        this.addresses.set(res.data || []);
        this.isLoadingAddresses.set(false);
      },
      error: () => {
        this.isLoadingAddresses.set(false);
      }
    });
  }

  addAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isAddingAddress.set(true);
    this.addressError.set(null);
    this.addressSuccess.set(null);

    const formValue = this.addressForm.value as Omit<Address, '_id'>;

    this._addressService.addAddress(formValue).subscribe({
      next: (res) => {
        this.addresses.set(res.data || []);
        this.addressForm.reset();
        this.isAddingAddress.set(false);
        this.addressSuccess.set('Address added successfully!');
        setTimeout(() => this.addressSuccess.set(null), 3000);
      },
      error: (err) => {
        this.isAddingAddress.set(false);
        this.addressError.set(err?.error?.message || 'Failed to add address. Please try again.');
        setTimeout(() => this.addressError.set(null), 4000);
      }
    });
  }

  removeAddress(addressId: string): void {
    if (!confirm('Are you sure you want to delete this address?')) return;

    this._addressService.removeAddress(addressId).subscribe({
      next: (res) => {
        this.addresses.set(res.data || []);
        this.addressSuccess.set('Address removed successfully!');
        setTimeout(() => this.addressSuccess.set(null), 3000);
      },
      error: () => {
        this.addressError.set('Failed to remove address.');
        setTimeout(() => this.addressError.set(null), 4000);
      }
    });
  }

  // ─── SECURITY ─────────────────────────────
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { password, rePassword } = this.passwordForm.value;
    if (password !== rePassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = null;

    // TODO: Connect to change password API
    setTimeout(() => {
      this.isChangingPassword = false;
      this.passwordSuccess = 'Password changed successfully!';
      this.passwordForm.reset();
      setTimeout(() => this.passwordSuccess = null, 3000);
    }, 1500);
  }

  // ─── HELPERS ──────────────────────────────
  isFieldInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getInitials(): string {
    const name = this.userData?.name || 'User';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_info');
      this._router.navigate(['/login']);
    }
  }

  goBack(): void {
    this._router.navigate(['/']);
  }
}