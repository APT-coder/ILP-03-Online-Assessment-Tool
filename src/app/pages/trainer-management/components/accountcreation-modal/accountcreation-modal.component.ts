import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Role } from '../../../../shared/models/role.interface';
import { Batch, TrainermanagementService } from '../../../../service/trainer-management/trainermanagement.service';
import { CalendarModule } from 'primeng/calendar';
import { MessageService, SelectItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { User } from '../../../../shared/models/user.interface';


@Component({
  selector: 'app-accountcreation-modal',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule, 
    InputTextModule,
    DropdownModule,
    ReactiveFormsModule,
    PasswordModule,
    AvatarModule,
    CheckboxModule,
    MultiSelectModule,
    CalendarModule,
    CommonModule, 

  ],
  templateUrl: './accountcreation-modal.component.html',
  styleUrls: ['./accountcreation-modal.component.scss']
})
export class AccountcreationModalComponent implements OnChanges, OnInit {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() mode: 'add' | 'edit' | 'delete' = 'add';
  @Input() userData: any;
  @Output() close = new EventEmitter<void>();

  userForm: FormGroup;
  userTypes: SelectItem[] = [
    { label: 'Select User Type', value: null },
    { label: 'Trainer', value: 'Trainer' },
    { label: 'Trainee', value: 'Trainee' }
  ];
  roles: SelectItem[] = [];
  batches: SelectItem[] = [];
  roleMap: Map<string, number> = new Map(); // role name to id
  batchMap: Map<string, number> = new Map(); 

  constructor(private fb: FormBuilder, private userService: TrainermanagementService,private messageService:MessageService) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{1,14}$')]], 
      usertype: [null],
      password: [''],
      role: [null],
      selectedBatches: [[]],
      joiningDate: [''],
      batch: [null]
    });
  }

  ngOnInit() {
    this.loadRoles();
    this.loadBatches();

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userData'] && this.userData) {
      this.userForm.patchValue(this.userData);
      this.onUserTypeChange(this.userData.usertype);
    }
  }

  loadRoles(): void {
    this.userService.getAllRoles().subscribe(response => {
      if (response.isSuccess) {
        this.roles = this.mapRolesToSelectItems(response.result);
        this.roleMap = new Map(response.result.map(role => [role.roleName, role.id]));
      } else {
        console.warn('Error loading roles:', response.message);
      }
    }, error => {
      console.error('Error fetching roles', error);
    });
  }
  mapRolesToSelectItems(roles: Role[]): SelectItem[] {
    return roles.map(role => ({
      label: role.roleName,
      value: role.id // Ensure this is the role ID
    }));
  }
  selectedRoleId = 0;
  onRoleChange(event: any) {
    return this.selectedRoleId = event.value; // Extract the selected value

  }
  traineeBatch = 0;
  OnBatchSelect(event:any)
  {
    return this.traineeBatch = event.value;
  }

  loadBatches(): void {
    this.userService.getBatches().subscribe(
      response => {
        if (response.isSuccess) {
          this.batches = response.result.map((batch: Batch) => ({
            label: batch.batchname,
            value: batch.batchid
          }));
          this.batchMap = new Map(response.result.map(batch => [batch.batchname, batch.batchid]));
        } else {
          console.warn('Batches loaded with isSuccess as false:', response.message);
          this.batches = response.result.map((batch: Batch) => ({
            label: batch.batchname,
            value: batch.batchid
          }));
          this.batchMap = new Map(response.result.map(batch => [batch.batchname, batch.batchid]));
        }
      },
      error => {
        console.error('Error fetching batches:', error.message);
      }
    );
  }
  selectedBatchIds:number[] = []
  onBatchChange(event: any) {
     this.selectedBatchIds =event.value.map((batch: { label: string, value: number }) => batch.value);
    // Perform additional logic if needed
  }

  onUserTypeChange(selectedType: string) {
    const form = this.userForm;
    if (selectedType === 'Trainer') {
      form.get('password')?.setValidators(null);
      form.get('role')?.setValidators([Validators.required]);
      form.get('selectedBatches')?.setValidators([Validators.required]);
      form.get('batch')?.clearValidators();
    } else if (selectedType === 'Trainee') {
      form.get('password')?.clearValidators();
      form.get('role')?.clearValidators();
      form.get('selectedBatches')?.clearValidators();
      form.get('batch')?.setValidators([Validators.required]);
    }
    form.get('joiningDate')?.setValidators([Validators.required]);
    form.get('password')?.updateValueAndValidity();
    form.get('role')?.updateValueAndValidity();
    form.get('selectedBatches')?.updateValueAndValidity();
    form.get('batch')?.updateValueAndValidity();
    form.get('joiningDate')?.updateValueAndValidity();
  }


  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c: string): string {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  saveUser() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;

      const batchId = this.batches.find(batch => batch.label === userData.batch)?.value ?? null;

      // Prepare the payload based on the user type
      const apiPayload: any = {
        createUserDTO: {
          username: userData.username,
          email: userData.email,
          phone: userData.phone,
          isAdmin: false,
          userType: userData.usertype === 'Trainer' ? 1 : 2,
          uuid: this.generateUUID()
        },
        trainerDTO: userData.usertype === 'Trainer' ? {
          joinedOn: new Date(userData.joiningDate).toISOString(),
          password: userData.password,
          roleId: this.selectedRoleId
        } : null,
        traineeDTO: userData.usertype === 'Trainee' ? {
          password: userData.password,
          joinedOn: new Date(userData.joiningDate).toISOString(),
          batchId: this.traineeBatch
        } : null,
        batchIds: userData.usertype === 'Trainer' ? this.selectedBatchIds : []
      };

      // Include userId only in case of update
      if (this.mode === 'edit' && this.userData && this.userData.userId) {
        apiPayload.createUserDTO.userId = this.userData.userId;
      }

      if (this.mode === 'edit') {
        this.userService.updateUser(apiPayload).subscribe(
          () => {
            this.messageService.add({ severity: 'success', summary: 'User Updated', detail: 'User Updated Successfully', life: 3000 });
            this.closeModal();
          },
          error => {
            console.error('Error updating user:', error);
            this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Failed to update user. Please try again.', life: 5000 });
          }
        );
      } else if (this.mode === 'add') {
        this.userService.createUser(apiPayload).subscribe(
          () => {
            this.messageService.add({ severity: 'success', summary: 'User Created', detail: 'User Created Successfully', life: 3000 });
            this.closeModal();
          },
          error => {
            console.error('Error creating user:', error);
            this.messageService.add({ severity: 'error', summary: 'Creation Failed', detail: 'Failed to create user. Please try again.', life: 5000 });
          }
        );
      }
    } else {
      this.userForm.markAllAsTouched();
    }
  }




  // deleteUser() {
  //   if (this.userData) {
  //     // Call service to delete user
  //     // this.userService.deleteUser(this.userData.id).subscribe(() => {
  //     //   this.closeModal();
  //     // });
  //   }
  // }

  closeModal() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.userForm.reset();
  }
}