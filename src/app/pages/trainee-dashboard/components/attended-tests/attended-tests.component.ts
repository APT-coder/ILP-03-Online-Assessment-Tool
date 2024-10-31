import { Component } from '@angular/core';
import { ScheduledService } from '../../../../service/scheduled-assessment/scheduled.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attended-tests',
  standalone: true,
  imports: [TableModule,CommonModule],
  templateUrl: './attended-tests.component.html',
  styleUrl: './attended-tests.component.scss'
})
export class AttendedTestsComponent {
  constructor(private api:ScheduledService){}
  scores:any;
  sortOrder: number = -1;
  
  user = JSON.parse(localStorage.getItem('userDetails') as string);

  
  ngOnInit(): void {
    this.api.getScores(this.user.TraineeId).subscribe((response) =>{
        
        this.scores =response.result;
        console.log(this.scores);
    })
  }


}
