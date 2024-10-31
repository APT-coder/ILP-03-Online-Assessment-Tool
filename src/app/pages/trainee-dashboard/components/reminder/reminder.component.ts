import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ScheduledService } from '../../../../service/scheduled-assessment/scheduled.service'; 
import { Router, RouterLink ,NavigationExtras} from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TimeFormatPipe } from '../../../../pipes/timeFormat/timeformat.pipe';
import { ScheduledPipe } from "../../../../pipes/scheduledFilter/scheduled.pipe";
import { UtcToIstPipe } from '../../../../pipes/utcToIst/utc-to-ist.pipe';

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [MatTableModule, CommonModule, RouterLink, MatSnackBarModule, TableModule, ButtonModule, FormsModule, TimeFormatPipe, ScheduledPipe, UtcToIstPipe],
  templateUrl: './reminder.component.html',
  styleUrl: './reminder.component.scss'
})
export class ReminderComponent {

  @Input() assessments: any;
  searchValue: string | undefined;
  sortOrder: number = -1;


  clear(table: Table) {
    table.clear();
    this.searchValue = ''
  }

  filterTable(event: Event, dt: any) {
    const target = event.target as HTMLInputElement;
    const filterValue = target?.value || ''; // Safe access to the value property
    dt.filterGlobal(filterValue, 'contains');
  }

  constructor(private router: Router,private api: ScheduledService,private snackBar: MatSnackBar) {}
  user = JSON.parse(localStorage.getItem('userDetails') as string);
  
  onRowClicked(assessmentId: number, assessment:any) {
    const currentDateTime = new Date();
    const assessmentStartTime = new Date(assessment.startTime);

    const isStartTimeEqual = currentDateTime.getTime() >= assessmentStartTime.getTime();

    if (!isStartTimeEqual) {
        this.openSnackBar("StartTimeNotEqual");
        return;
    }

    this.api.checkAttended(this.user.TraineeId , assessmentId).subscribe((response) =>{
      console.log(response.result.exists);
      if(response.result.exists){
        this.openSnackBar("AlreadyAttended");
      }else{
        
        const navigationExtras: NavigationExtras = {
          state: {
            data: assessment
          }
        };

        this.router.navigate(['/instructions', assessment.assessmentId],navigationExtras);
      }
    })
  }

  openSnackBar(val: string): void {
    if(val === "StartTimeNotEqual"){
      this.snackBar.open('Assessment cannot be started before scheduled start time !', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
    }
    else{
      this.snackBar.open('You have already completed the assessment.', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
    }
  }
}
