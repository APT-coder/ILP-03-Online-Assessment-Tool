import { Component, ElementRef, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ButtonActiveComponent } from "../../ui/buttons/button-active/button-active.component";
import { TrainermanagementService } from '../../service/trainer-management/trainermanagement.service';
import { Role } from '../../shared/models/role.interface';
import { RolecreationCardComponent } from "./components/rolecreation-card/rolecreation-card.component";
import { AccountcreationModalComponent } from "./components/accountcreation-modal/accountcreation-modal.component";
import { TrainerTableComponent } from "./components/trainer-table/trainer-table.component";
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { MessageService } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { Dialog, DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-trainer-management',
  templateUrl: './trainer-management.component.html',
  styleUrls: ['./trainer-management.component.scss'],
  imports: [
    FontAwesomeModule,
    CommonModule,
    RolecreationCardComponent,
    ButtonActiveComponent,
    SidebarComponent,
    AccountcreationModalComponent,
    TrainerTableComponent, MessagesModule,
    MessageModule,
    DialogModule,
    ButtonModule,
    ToastModule
  ],
  providers:[MessageService],

  standalone:true
})
export class TrainerManagementComponent {

  isCardVisible: boolean = false;
  isSidebarCollapsed: boolean = false;
  selectedRole: Role = { id: 0, roleName: '', permissionIds: [] };
  isEditMode: boolean = false;
  isModalVisible: boolean = false;
  jsonData: any;
  visibleTemplatePreview: boolean = false;
  public csvData: any[] = [];

  constructor(private apiService: TrainermanagementService, private userService: TrainermanagementService, private messageService: MessageService, private http: HttpClient) {}

  ngOnInit() {
    this.readCSV("assets/sample.csv");
  }


  previewTemplate() {
    this.displayDialog = false;
    this.visibleTemplatePreview = true;
  }

  ShowTrainer() {
    this.isAddTrainer = !this.isAddTrainer;
    if (this.isAddTrainer) {
      this.isCardVisible = false;
    }
  }

  openRoleCreationModal() {
    this.isModalVisible = true;
  }

  closeRoleCreationModal() {
    this.isModalVisible = false;
  }

  editRole(role: Role) {
    this.selectedRole = { ...role };
    this.isEditMode = true;
    this.openRoleCreationModal();
  }

  onCancelRoleCreation() {
    this.closeRoleCreationModal();
    this.selectedRole = { id: 0, roleName: '', permissionIds: [] };
  }

  onRoleSaved() {
    this.closeRoleCreationModal();
    // Optionally reload data or perform other actions after role is saved
  }
  
  isAddTrainer: boolean = false;
  isEditTrainer: boolean = false;
  isDeleteTrainer: boolean = false;
  selectedUser: any = null;

  addTrainer() {
    this.isAddTrainer = true;
    this.selectedUser = null;
  }

  editTrainer(user: any) {
    this.isEditTrainer = true;
    this.selectedUser = user;
  }

  deleteTrainer(user: any) {
    this.isDeleteTrainer = true;
    this.selectedUser = user;
  }

  closeModal() {
    this.isAddTrainer = false;
    this.isEditTrainer = false;
    this.isDeleteTrainer = false;
    this.selectedUser = null;
  }

  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef;
  displayDialog: boolean = false;

  showUploadDialog() {
    this.displayDialog = true;
  }

  openFileUpload(): void {
    this.displayDialog = false;
    this.fileInput.nativeElement.click();
  }

  downloadTemplate() {
    const templateUrl = 'assets/sample.csv';
    this.http.get(templateUrl, { responseType: 'blob' }).subscribe((data: Blob) => {
      const downloadURL = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = 'template.csv';
      link.click();
      this.displayDialog = false;
    });
  }

  onFileChange(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        let workbook;
        if (fileExtension === 'csv') {
          const csvData = new TextDecoder('utf-8').decode(data);
          workbook = XLSX.read(csvData, { type: 'string' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        this.processData(jsonData);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  processData(data: any) {
    const headers = data[0] as string[];
    const rows = data.slice(1);
    this.jsonData = rows.map((row: any[]) => {
      let user: any = {};
      headers.forEach((header, index) => {
        user[header] = row[index];
      });
      return this.transformToJson(user);
    });
    this.jsonData.forEach((user: any) => {
      this.addTraineeAccount(user);
    });
  }

  transformToJson(user: any) {
    return {
      createUserDTO: {
        username: user.username,
        email: user.email,
        phone: user.phone,
        isAdmin: false,
        userType: 2,
        uuid: uuidv4()
      },
      trainerDTO: {
        joinedOn: new Date().toISOString(),
        password: "",
        roleId: 0
      },
      traineeDTO: {
        joinedOn: new Date().toISOString(),
        password: user.password,
        batchId: parseInt(user.batchid, 10)
      },
      batchIds: []
    };
  }

  addTraineeAccount(user: any){
    this.userService.createUser(user).subscribe(
      () => {
        console.log("User added successfully");
        this.messageService.add({ severity: 'success', summary: 'User Created', detail: 'User batch created successfully', life: 3000 });
      },
      (error: any) => {
        console.error('Error creating user:', error);
        this.messageService.add({ severity: 'error', summary: 'User creation failed', detail: 'User batch not created', life: 5000 });
      }
    );
  }

  private readCSV(filePath: string): void {
    this.http.get(filePath, { responseType: 'text' }).subscribe(
      data => {
        this.parseCSV(data);
      },
      error => {
        console.error('Error loading the CSV file:', error);
      }
    );
  }

  private parseCSV(data: string): void {
    const workbook: XLSX.WorkBook = XLSX.read(data, { type: 'string' });
    const sheetName: string = workbook.SheetNames[0];
    const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
    this.csvData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }
}
