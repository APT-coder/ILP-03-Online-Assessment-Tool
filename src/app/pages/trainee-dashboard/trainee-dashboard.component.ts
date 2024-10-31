import { Component } from '@angular/core';
import { ReminderComponent } from './components/reminder/reminder.component';
import { ScheduledService } from '../../service/scheduled-assessment/scheduled.service';
import { AttendedTestsComponent } from './components/attended-tests/attended-tests.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { SharedService } from '../../service/shared/shared.service';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { ScheduledPipe } from '../../pipes/scheduledFilter/scheduled.pipe';

@Component({
  selector: 'app-trainee-dashboard',
  standalone: true,
  imports: [ReminderComponent, AttendedTestsComponent, SidebarComponent, SelectButtonModule, FormsModule, ScheduledPipe],
  templateUrl: './trainee-dashboard.component.html',
  styleUrl: './trainee-dashboard.component.scss',
  providers: [ScheduledPipe]
})
export class TraineeDashboardComponent {

  isScheduled:boolean=true;
  selected: string = 'scheduled';
  stateOptions: any[] = [{ label: 'Upcoming', value: 'upcoming' },{ label: 'Completed', value: 'completed' }];
  value: string = 'upcoming';
  warning: string = '';

  handleClick(buttonType: string) {
    this.selected = buttonType;
    console.log(buttonType);
  }

  user = JSON.parse(localStorage.getItem('userDetails') as string);
  firstname: string = this.getFirstName(this.user.UserName);
  scheduled: any[] | undefined;
  filterScheduled: any[] | undefined;

  constructor(private api: ScheduledService, private sharedService: SharedService, private scheduledPipe: ScheduledPipe) {}

  ngOnInit(): void {
    this.sharedService.isScheduled$.subscribe(isScheduled => {
      this.isScheduled = isScheduled;
      console.log('Is Scheduled:', isScheduled);
    });

    this.fetchScheduled();
    console.log(this.user);
  }

  fetchScheduled(): void {
    this.api.getScheduled(this.user.TraineeId).subscribe((response) => {
      this.scheduled = response;
      this.filterScheduled = this.scheduledPipe.transform(response);
      this.warning = this.filterScheduled.length === 0 ? "No upcoming tests" : "";
      console.log(this.scheduled);
    });
  }
  
  getFirstName(userName: string): string {
    return userName.split(' ')[0];
  }
}
