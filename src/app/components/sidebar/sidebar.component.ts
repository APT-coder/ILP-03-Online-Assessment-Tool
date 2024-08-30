import { Component, ElementRef, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Sidebar, SidebarModule } from 'primeng/sidebar';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { StyleClassModule } from 'primeng/styleclass';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ImageModule } from 'primeng/image';
import { InputTextModule } from 'primeng/inputtext';
import { ChipsModule } from 'primeng/chips';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { ButtonActiveComponent } from "../../ui/buttons/button-active/button-active.component";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, SidebarModule, ButtonModule, RippleModule, AvatarModule, StyleClassModule,ImageModule,
    OverlayPanelModule, InputGroupModule, InputGroupAddonModule, InputTextModule, ChipsModule, CommonModule, ButtonActiveComponent,
    RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  
 
})
export class SidebarComponent {


  @Output() isSchedule =new EventEmitter<boolean>();

  changeIsSchedule(scheduled:boolean) {
      this.isSchedule.emit(scheduled);
  }

  sidebarCollapsed = false;
  @Output() sidebarToggled = new EventEmitter<boolean>();

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.sidebarToggled.emit(this.sidebarCollapsed);
  }

  user = JSON.parse(localStorage.getItem('userDetails') as string);
  username = this.user.UserName;
    hoveredRow: number | null = null;
    profileImage: string = "assets/Ellipse 56.svg";
    path: string = '';
    profileDetails = [
      { label: 'Name:', value: 'Your Name' },
      { label: 'Designation:', value: 'Your Role' }
    ];
  constructor(private elementRef: ElementRef, private authService: MsalService) { }

  ngOnInit(): void {

    console.log(this.user);
    
      this.profileDetails[0].value = this.user.UserName;

      if(this.user.UserAdmin){
        this.profileDetails[1].value = "Admin";
      }
      else if(this.user.TrainerId){
        this.profileDetails[1].value = this.user.UserRole.roleName;
      }
      else{
        this.profileDetails[1].value = "Trainee";
      }

      if (this.user.UserType === 0) {
        this.path = "admin";
      } else if (this.user.UserType === 1) {
        this.path = "trainer";
      } else {
        this.path = "trainee";
      }
      localStorage.setItem("dashboard", this.path);
   }
closeModal() {
  const modal = this.elementRef.nativeElement.querySelector('.profile-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('overlay');
  }
}

openFileExplorer() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.click();
  fileInput.onchange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file:', file.name);
    }
  };
}

logout() {
  this.authService.logoutRedirect();
  localStorage.removeItem("loginToken");
}
}
