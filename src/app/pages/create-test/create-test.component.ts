import { Component, OnInit, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { CardComponent } from './components/card/card.component';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AssessmentService } from '../../service/assessment/assessment.service';
import { Assessment } from '../../shared/models/assessment.interface';
import { CommonModule } from '@angular/common';
import { AssessmentPreviewComponent } from './components/assessment-preview/assessment-preview.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { ScheduledAssessmentService } from '../../service/scheduled-assessment/scheduled-assessment.service';
import { Router } from '@angular/router';
import { CreateTestFormComponent } from "./components/create-test-form/create-test-form.component";
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { AssessmentEditComponent } from './components/assessment-edit/assessment-edit.component';
import { QuestionBankComponent } from '../question-bank/question-bank.component';

interface Option {
  option: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-create-test',
  standalone: true,
  imports: [
    CreateTestFormComponent,
    FileUploadComponent,
    AssessmentEditComponent,
    QuestionBankComponent,
    AssessmentPreviewComponent,
    ScheduleComponent,
    ButtonModule,
    StepperModule,
    CardComponent,
    FormsModule,
    ToastModule,
    CommonModule,
],
  templateUrl: './create-test.component.html',
  styleUrl: './create-test.component.scss',
  providers: [MessageService]
})
export class CreateTestComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('userDetails') as string);
  @ViewChild(ScheduleComponent) scheduleComponent!: ScheduleComponent;
  @ViewChild(QuestionBankComponent) questionBankComponent!: QuestionBankComponent;
  activeStep: number = 0; 
  
  selectedCardIndex: number | null = null;
  isCardSelected: boolean = false;
  assessmentName: string = '';
  questions: { id: number, type: string, score: number, content: string, options: Option[], correctAnswer: string[] }[] = [{ id: 1, type: '', score: 0, content: '', options: [], correctAnswer: [] }];
  editQuestions: any;
  assessmentCreated!: boolean;
  fileUploaded: boolean = false;
  questionsUploaded: boolean = false;
  totalScore: number = 0;
  createdBy: number = this.user.TrainerId;
  dashboard = localStorage.getItem("dashboard");
  assessment: Assessment = { assessmentId: 0, assessmentName: '', createdBy: 0, createdOn: new Date() };

  secondStep: string = 'Add Questions';
  thirdStep: string = '';

  constructor(private assessmentService: AssessmentService,
    private scheduledAssessmentService: ScheduledAssessmentService,
    private messageService: MessageService,
    private router: Router
  ) {}

  selectCard(index: number) {
    this.selectedCardIndex = index;
    this.isCardSelected=true;
  }

  ngOnInit(): void {
    if (!sessionStorage.getItem('hasReloaded')) {
      sessionStorage.setItem('hasReloaded', 'true');
      window.location.reload();
    } else {
      sessionStorage.removeItem('hasReloaded');
    }
  }

  scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToNextStep() {
    if(this.activeStep === 1 && this.selectedCardIndex === 2 && !this.fileUploaded){
      this.questionBankComponent.onNextClick();
    }
    else{
      this.activeStep++;
    }
  }

  goToPreviousStep() {
      this.activeStep--;
  }

  getQuestions(questions: any){
    this.questions = questions;
    console.log(questions);
  }

  createAssessment(assessmentName: string, nextCallback: any) {
    if (assessmentName) {
      this.assessmentService.createAssessment(assessmentName, this.createdBy).subscribe(
        (response: any) => {
          this.assessmentCreated = true;
          this.assessment = response.result;
          localStorage.setItem("assessmentId", (this.assessment.assessmentId).toString());
      
          console.log('Assessment successfully created!', this.assessment);
          this.secondStep = (this.selectedCardIndex === 0) ? "File Upload" : (this.selectedCardIndex === 1) ? "Add Questions" : (this.selectedCardIndex === 2) ? "Question Bank": '';
          if(nextCallback){
            nextCallback.emit();
          }
        },
        (error: any) => {
          console.error('Error creating assessment', error);
        }
      );
    } else {
      console.error('Assessment name is required.');
    }
  }

  getParsedContent(questions: any){
    this.fileUploaded = true;
    this.questions = questions;
    this.editQuestions = questions;
    console.log(this.questions);
  }

  showMessage(message: string){
    if(message.startsWith("Upload Success")){
      this.messageService.add({ severity: 'success', summary: 'Upload Success', detail: `${message.split('Upload Success!')[1]} questions uploaded`, life: 5000 });
    }
    else if(message === "Upload Failed"){
      this.messageService.add({ severity: 'error', summary: 'Upload Failed', detail: 'File format not supported', life: 5000 });
    }
    else if(message === "Download Success"){
      this.messageService.add({ severity: 'info', summary: 'Download Started', detail: 'Template Downloaded started', life: 5000 });
    }
    else if(message === "Empty Set"){
      this.messageService.add({ severity: 'error', summary: 'No Questions selected', detail: 'Select atleast one question to proceed', life: 5000 });
    }
    else if(message === "No Questions"){
      this.messageService.add({ severity: 'warn', summary: 'No Questions found', detail: 'No questions found in selected assessment', life: 5000 });
    }
  }

  logQuestions(nextCallback: any) {
    const formattedQuestions = this.questions.map(question => {
      let formattedQuestion = {
        id: question.id,
        type: question.type,
        content: question.content,
        options: question.options,
        correctAnswer: question.correctAnswer,
        score: question.score
      };
      return formattedQuestion;
    });

    console.log('Formatted Questions:', formattedQuestions);
    this.submitQuestions(formattedQuestions, nextCallback);
  }

  calculateTotalScore() {
    this.questions.forEach(question => {
      this.totalScore += question.score;
    })
    return this.totalScore;
  }

  updateTotalScore() {
    const assessmentId = this.assessment.assessmentId;
    const totalScore = this.calculateTotalScore();
    this.assessmentService.updateAssessment(assessmentId, totalScore).subscribe((response: any) => {
      console.log('Question score posted successfully', response);
    }, (error: any) => {
      console.error('Error posting question', error);
    });
  }

  submitQuestions(formattedQuestions: any[], nextCallback: any) {
    const assessmentId = this.assessment.assessmentId;
    formattedQuestions.forEach(question => {
      this.assessmentService.postQuestion(assessmentId, question, this.createdBy).subscribe((response: any) => {
        console.log('Question posted successfully', response);
        this.questionsUploaded = true;
      }, (error: any) => {
        console.error('Error posting question', error);
      });
    });
    
    // if(this.questionsUploaded){
    //   this.updateTotalScore();

    //   // if(nextCallback){
    //   //   nextCallback.emit();
    //   // }
    // }
    this.updateTotalScore();
    this.goToNextStep();
  }

  finishSchedule() {
    if (this.scheduleComponent) {
      const formResult = this.scheduleComponent.logFormValues();
      console.log(formResult);
      this.scheduledAssessmentService.scheduleAssessment(formResult).subscribe((response: any) => {
        console.log('Question scheduled successfully', response);
        this.messageService.add({ severity: 'success', summary: 'Assessment Scheduled ', detail: 'Assessment Scheduled Successfully', life: 3000 });

        this.scrollToTop();

        setTimeout(() => {
          this.router.navigate([`/app/${this.dashboard}`]);
        }, 5000);
      }, (error: any) => {
        console.error('Error posting question', error);
      });
    } 
  }
}
