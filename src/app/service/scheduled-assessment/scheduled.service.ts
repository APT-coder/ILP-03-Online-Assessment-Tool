

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ScheduledResponse } from '../../../models/Schedule.interface'; 
import { CheckAttended } from '../../../models/checkAttende.interface';
import { CheckAttendedPostBody } from '../../../models/checkAttendedpostbody.interface';

@Injectable({
  providedIn: 'root'
})

export class ScheduledService {

  constructor(private http:HttpClient) { }



  private apiUrl="https://localhost:7120/ScheduledAssessment/GetScheduledByUserId";
  private checkAttendedUrl ="https://localhost:7120/TraineeAnswer/CheckTraineeAnswerExists";

 

  getScheduled(userId : number): Observable<any[]> {
    return this.http.get<ScheduledResponse>(`${this.apiUrl}/${userId}`).pipe(
      map(response => response.result)
    );;
  }

  checkAttended(userId:number , scheduledAssessmentId:number): Observable<CheckAttended> {

    const body: CheckAttendedPostBody = {
      scheduledAssessmentId: scheduledAssessmentId,
      userId: userId
    };

    return this.http.post<CheckAttended>(this.checkAttendedUrl, body);
  }


}



